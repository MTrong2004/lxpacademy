/**
 * Ảnh + upload Cloudinary — bước 3 của docs/SPLIT_PLAN.md, tách ngày 20260727.
 *
 * Năm block ảnh chuyển nguyên văn từ appCore (chỉ đổi chỗ buộc phải đổi):
 *   installUploadDiagnostics        COPILOT_FINAL_UPLOAD_DIAGNOSTIC_LOCK_20260628
 *   installUploadLock               COPILOT_ULTRA_FINAL_EDIT_UPLOAD_LOCK_20260628
 *   installImageVisibleAfterSave    COPILOT_FIX_EDIT_IMAGE_VISIBLE_AFTER_SAVE_20260628
 *   installEditImagesRender         EDIT_RENDER_NULL_GUARD_20260629      (renderEditImages)
 *   installImgsHTML                 COPILOT_FIX_IMAGE_RESET_LOSS_FINAL_20260630 (imgsHTML)
 *
 * Đây là các bản ĐANG CHẠY của `imgsHTML`, `renderEditImages`,
 * `window.__LHUploadCloudinary`, `__LHTestCloudinaryConfig`, `__LHGetPendingImageUpload`,
 * `__LHUploadPendingDataUrls` — sửa ảnh/upload thì sửa ở đây, đừng sửa thân dự phòng
 * trong appCore.
 *
 * Đổi so với bản trong appCore:
 * - `esc` / `answerText` -> import từ ./format.js; `LHState` / `lhWarn` -> import.
 * - `notify` / `renderCard` / `renderEditImages` -> gọi qua `window.*` (bản đang chạy).
 * - Hai chỗ gán trần `imgsHTML = …` / `renderEditImages = …` (binding module của appCore)
 *   -> chỉ còn `window.*`. appCore giữ hai hàm cùng tên làm CHUYỂN TIẾP: chúng đọc
 *   `window.*` lúc gọi, và vẫn giữ thân gốc làm dự phòng cho quãng trước khi install chạy.
 *
 * Vẫn là các hàm `install*()` gọi ĐÚNG chỗ block cũ đứng, không phải IIFE chạy lúc import —
 * xem lý do trong ./exam.js.
 */
import { LHState } from './state.js';
import { lhWarn } from '../core/log.js';
import { answerText, esc } from './format.js';

// ===== COPILOT_FINAL_UPLOAD_DIAGNOSTIC_LOCK_20260628 =====
// Chốt lại upload ảnh: hiện trạng thái rõ ràng + kiểm tra config Cloudinary.
export function installUploadDiagnostics() {
  const CFG = (window.APP_CONFIG = Object.assign(
    {
      CLOUDINARY_CLOUD_NAME: 'ddc4uvm7m',
      CLOUDINARY_UPLOAD_PRESET: 'learninghub_unsigned',
      CLOUDINARY_UPLOAD_FOLDER: 'learninghub/questions',
      CLOUDINARY_UPLOAD_URL: 'https://api.cloudinary.com/v1_1/ddc4uvm7m/image/upload',
    },
    window.APP_CONFIG || {},
  ));
  function $(id) {
    return document.getElementById(id);
  }
  function msg(t) {
    if (typeof window.notify === 'function') window.notify(t);
    else console.log(t);
  }
  function ensureStatus(inputId, statusId) {
    const inp = $(inputId);
    if (!inp) return null;
    let st = $(statusId);
    if (!st) {
      st = document.createElement('div');
      st.id = statusId;
      st.style.cssText =
        'display:none;margin-top:7px;color:var(--gold2);font-weight:900;font-size:.86rem;word-break:break-word;';
      inp.insertAdjacentElement('afterend', st);
    }
    return st;
  }
  async function directUpload(file, fileName) {
    const url =
      CFG.CLOUDINARY_UPLOAD_URL ||
      (CFG.CLOUDINARY_CLOUD_NAME
        ? 'https://api.cloudinary.com/v1_1/' + CFG.CLOUDINARY_CLOUD_NAME + '/image/upload'
        : '');
    const preset = CFG.CLOUDINARY_UPLOAD_PRESET;
    if (!url || !preset) throw new Error('Thiếu Cloudinary config / upload preset.');
    const fd = new FormData();
    const nameToUse = fileName || file.name || 'image.png';
    fd.append('file', file, nameToUse);
    fd.append('upload_preset', preset);
    if (CFG.CLOUDINARY_UPLOAD_FOLDER) fd.append('folder', CFG.CLOUDINARY_UPLOAD_FOLDER);
    const res = await fetch(url, { method: 'POST', body: fd });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error?.message || 'Cloudinary lỗi HTTP ' + res.status);
    const img = {
      id: data.public_id,
      public_id: data.public_id,
      src: data.secure_url,
      url: data.secure_url,
      width: data.width,
      height: data.height,
      source: 'cloudinary',
    };
    return img;
  }
  window.__LHUploadCloudinary = directUpload;
  window.__LHTestCloudinaryConfig = function () {
    console.log('[Cloudinary config]', {
      url: CFG.CLOUDINARY_UPLOAD_URL,
      cloud: CFG.CLOUDINARY_CLOUD_NAME,
      preset: CFG.CLOUDINARY_UPLOAD_PRESET,
      folder: CFG.CLOUDINARY_UPLOAD_FOLDER,
    });
    return CFG;
  };
  function bindEditUploadFinal() {
    const inp = $('imgUpload');
    if (!inp || inp.__copilotFinalUpload) return;
    inp.__copilotFinalUpload = true;
    inp.onchange = async function (e) {
      const files = Array.from(e.target.files || []);
      const st = ensureStatus('imgUpload', 'editUploadStatus');
      if (!files.length) return;
      inp.disabled = true;
      if (st) {
        st.style.display = 'block';
        st.textContent = 'Đang upload ' + files.length + ' ảnh lên Cloudinary...';
      }
      msg('Đang upload ảnh lên Cloudinary...');
      try {
        LHState.editDraft.images = window.__LHCleanImages
          ? window.__LHCleanImages(LHState.editDraft.images || [])
          : LHState.editDraft.images || [];
        for (const file of files) {
          const uploaded = await (window.__LHUploadCloudinary || directUpload)(file);
          LHState.editDraft.images.push(uploaded);
        }
        window.renderEditImages?.();
        if (st) {
          st.textContent = 'Đã upload xong. URL nằm dưới ảnh.';
          setTimeout(() => {
            st.style.display = 'none';
          }, 2200);
        }
        msg('Đã upload ảnh thành URL');
      } catch (err) {
        if (st) {
          st.textContent = 'Upload lỗi: ' + (err.message || err);
        }
        alert(err.message || err);
      } finally {
        inp.disabled = false;
        inp.value = '';
      }
    };
  }
  // Lớp bọc openEditor của block này đã XÓA (20260727): chết vì apply() ở mốc 900ms.
  // __LHUploadCloudinary / __LHTestCloudinaryConfig của block vẫn sống (editor đang chạy
  // gọi __LHUploadCloudinary lúc chọn file).
  function boot() {
    bindEditUploadFinal();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  setTimeout(boot, 500);
  // Chỉ log config 1 lần khi module khởi tạo xong
  if (typeof window.__LHTestCloudinaryConfig === 'function') window.__LHTestCloudinaryConfig();
}
// ===== END COPILOT_FINAL_UPLOAD_DIAGNOSTIC_LOCK_20260628 =====

// ===== COPILOT_ULTRA_FINAL_EDIT_UPLOAD_LOCK_20260628 =====
export function installUploadLock() {
  const STORE = 'learninghub_subject_code_merged_v1';
  let pending = null;
  // Lộ ra ngoài để submitEditRequest (gửi yêu cầu sửa cho user thường) có thể chờ
  // upload Cloudinary xong trước khi gửi — tránh gửi request khi editDraft.images
  // vẫn còn là base64 tạm (bị cleanImages() lọc mất khi tới backend).
  window.__LHGetPendingImageUpload = () => pending;
  function $(id) {
    return document.getElementById(id);
  }
  function msg(t) {
    if (typeof window.notify === 'function') window.notify(t);
    else console.log(t);
  }
  function c() {
    return window.HODSupabase?.__client || null;
  }
  function u() {
    return window.HODSupabase?.getUser?.() || null;
  }
  function p() {
    return window.HODSupabase?.getProfile?.() || null;
  }
  function can() {
    const x = p(),
      r = String(x?.role || '').toLowerCase();
    return !!u() && (r === 'admin' || r === 'editor') && !(x?.blocked || x?.is_blocked || x?.status === 'blocked');
  }
  function sc() {
    return localStorage.getItem(STORE) || '';
  }
  function draft() {
    try {
      return LHState.editDraft || null;
    } catch (e) {
      return null;
    }
  }
  function dataUrl(s) {
    return /^data:image\//i.test(String(s || ''));
  }
  function escx(s) {
    return String(s ?? '').replace(
      /[&<>"']/g,
      a => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[a],
    );
  }
  function toFile(data, name) {
    const a = String(data).split(','),
      m = (a[0].match(/:(.*?);/) || [])[1] || 'image/png',
      b = atob(a[1] || ''),
      u8 = new Uint8Array(b.length);
    for (let i = 0; i < b.length; i++) u8[i] = b.charCodeAt(i);
    return new File([u8], name || 'image.png', { type: m });
  }
  async function up(file) {
    if (window.__LHUploadCloudinary) return await window.__LHUploadCloudinary(file);
    const cfg = window.APP_CONFIG || {},
      url =
        cfg.CLOUDINARY_UPLOAD_URL ||
        (cfg.CLOUDINARY_CLOUD_NAME
          ? 'https://api.cloudinary.com/v1_1/' + cfg.CLOUDINARY_CLOUD_NAME + '/image/upload'
          : '');
    if (!url || !cfg.CLOUDINARY_UPLOAD_PRESET) throw new Error('Thiếu Cloudinary config/upload preset');
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', cfg.CLOUDINARY_UPLOAD_PRESET);
    if (cfg.CLOUDINARY_UPLOAD_FOLDER) fd.append('folder', cfg.CLOUDINARY_UPLOAD_FOLDER);
    const res = await fetch(url, { method: 'POST', body: fd }),
      j = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(j?.error?.message || 'Cloudinary lỗi ' + res.status);
    return {
      id: j.public_id,
      public_id: j.public_id,
      src: j.secure_url,
      url: j.secure_url,
      width: j.width,
      height: j.height,
      source: 'cloudinary',
    };
  }
  function imgs(a) {
    return (a || [])
      .map(im => {
        if (!im) return null;
        if (typeof im === 'string') return { src: im, url: im };
        const src = im.secure_url || im.src || im.url || im.publicUrl || im.public_url || '';
        return src ? Object.assign({}, im, { src: String(src), url: String(src) }) : null;
      })
      .filter(Boolean);
  }
  function status(t) {
    let inp = $('imgUpload'),
      s = $('editUploadStatus');
    if (!inp) return null;
    if (!s) {
      s = document.createElement('div');
      s.id = 'editUploadStatus';
      s.style.cssText =
        'display:block;margin-top:7px;color:var(--gold2);font-weight:900;font-size:.86rem;word-break:break-word;';
      inp.insertAdjacentElement('afterend', s);
    }
    s.style.display = 'block';
    if (t) s.textContent = t;
    return s;
  }
  function renderUrls() {
    const d = draft(),
      box = $('editImgs');
    if (!d || !box) return;
    d.images = imgs(d.images).filter(x => !dataUrl(x.src || x.url));
    box.innerHTML = d.images.length
      ? d.images
          .map(
            (im, i) =>
              `<div class="editImg"><button class="rm" data-rm="${i}">×</button><img src="${escx(im.src)}" loading="lazy" decoding="async"><input value="${escx(im.src)}" readonly onclick="this.select()" style="margin-top:6px;width:100%;max-width:260px;border:1px solid rgba(200,169,110,.24);border-radius:10px;background:rgba(0,0,0,.22);color:var(--gold2);padding:7px;font-size:.72rem;"></div>`,
          )
          .join('')
      : '<p style="color:var(--mist)">Chưa có hình.</p>';
  }
  async function runUpload(files) {
    const d = draft();
    if (!d) return;
    files = [...(files || [])];
    if (!files.length) return;
    const btn = $('saveEdit');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Đang upload ảnh...';
    }
    status('Đang upload ' + files.length + ' ảnh lên Cloudinary...');
    msg('Đang upload ảnh lên Cloudinary...');
    d.images = imgs(d.images).filter(x => !dataUrl(x.src || x.url));
    for (const f of files) {
      const x = await up(f);
      d.images.push(x);
    }
    d.images = window.__LHCleanImages ? window.__LHCleanImages(d.images) : imgs(d.images);
    renderUrls();
    status('Đã upload xong. URL nằm dưới ảnh.');
    msg('Đã upload ảnh thành URL');
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Lưu trực tiếp';
    }
  }
  function bindInput() {
    const inp = $('imgUpload');
    if (!inp || inp.__ultraUpload) return;
    inp.__ultraUpload = true;
    inp.onchange = null;
    inp.addEventListener(
      'change',
      e => {
        const files = [...(e.target.files || [])];
        if (!files.length) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        pending = runUpload(files)
          .catch(err => {
            status('Upload lỗi: ' + (err.message || err));
            alert(err.message || err);
            throw err;
          })
          .finally(() => {
            inp.value = '';
          });
      },
      true,
    );
  }
  function build() {
    const d = draft();
    if (!d) return null;
    d.question = ($('editQuestion')?.value || '').trim();
    d.answer = ($('editAnswer')?.value || '').trim().toUpperCase();
    const o = {};
    document.querySelectorAll('[data-opt]').forEach(t => {
      if ((t.value || '').trim()) o[t.dataset.opt] = t.value.trim();
    });
    d.options = o;
    d.answer_text = answerText(d);
    d.subject_code = sc() || d.subject_code || '';
    d.images = window.__LHCleanImages
      ? window.__LHCleanImages(imgs(d.images))
      : imgs(d.images).filter(x => /^https?:\/\//i.test(x.src || x.url));
    return d;
  }
  async function uploadDataUrls() {
    const d = draft();
    if (!d) return;
    const list = imgs(d.images);
    if (!list.some(x => dataUrl(x.src || x.url))) {
      d.images = window.__LHCleanImages ? window.__LHCleanImages(list) : list;
      return;
    }
    status('Đang upload ảnh trước khi lưu...');
    const out = [];
    for (const im of list) {
      const s = im.src || im.url;
      out.push(dataUrl(s) ? await up(toFile(s, im.name)) : im);
    }
    d.images = window.__LHCleanImages ? window.__LHCleanImages(out) : out;
    renderUrls();
  }
  // Lộ ra ngoài: submitEditRequest dùng để "quét" nốt ảnh base64 còn sót (vd upload qua
  // paste thay vì chọn file) trước khi gửi yêu cầu duyệt, tránh mất ảnh như khi upload dở dang.
  window.__LHUploadPendingDataUrls = uploadDataUrls;
  async function qid(d) {
    if (d.id) return d.id;
    const db = c(),
      code = d.subject_code || sc();
    if (!db || !code || !d.num) return null;
    const { data, error } = await db
      .from('questions')
      .select('id')
      .eq('subject_code', code)
      .eq('num', d.num)
      .maybeSingle();
    return error || !data ? null : data.id;
  }
  async function saveDirect() {
    if (!can()) return false;
    const usr = u();
    if (!usr || !draft()) {
      alert('Chưa sẵn sàng dữ liệu');
      return true;
    }
    const btn = $('saveEdit');
    try {
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Đang upload/lưu...';
      }
      if (pending) await pending;
      await uploadDataUrls();
      const d = build(),
        id = await qid(d);
      if (!id) {
        alert('Không tìm thấy ID câu hỏi. Hãy tải lại trang rồi thử lại.');
        return true;
      }
      const oldQ = (LHState.RAW || []).find(x => String(x.id) === String(id)) || (LHState.pool || [])[LHState.ci] || d;
      const imgs = d.images || [];
      const payload = {
        id,
        subject_code: d.subject_code || oldQ.subject_code || sc(),
        num: d.num || oldQ.num,
        question: d.question,
        options: d.options || {},
        answer: d.answer,
        answer_text: d.answer_text,
        images: imgs,
        has_image: imgs.length > 0,
        updated_at: new Date().toISOString(),
        error_risk: oldQ.error_risk || 'low',
        error_risk_reason: oldQ.error_risk_reason || null,
      };
      const res = await fetch('/api/admin-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({
          user_id: usr.id,
          action: 'save_question_direct',
          payload: { question_id: id, new_data: payload, old_data: oldQ },
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.error) {
        alert('Lưu trực tiếp thất bại: ' + (json.error || res.status));
        return true;
      }
      if (typeof window.clearLearningHubQuestionCache === 'function') window.clearLearningHubQuestionCache();
      $('editModal')?.classList.add('hidden');
      msg('Đã lưu trực tiếp');
      if (typeof window.loadCurrentSubjectOnly === 'function') await window.loadCurrentSubjectOnly(true);
      return true;
    } finally {
      pending = null;
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Lưu trực tiếp';
      }
    }
  }
  function bindSave() {
    const b = $('saveEdit');
    if (!b || b.__ultraSave) return;
    b.__ultraSave = true;
    b.onclick = null;
    b.addEventListener(
      'click',
      async e => {
        if (!can()) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        await saveDirect();
      },
      true,
    );
  }
  // Lớp bọc openEditor của block này đã XÓA (20260727): bị apply() của
  // LIBRARY_FILTER_AND_EDIT_PREVIEW_LAYOUT ghi đè ở mốc 900ms nên không bao giờ chạy.
  // Phần còn lại của block (__LHGetPendingImageUpload / __LHUploadPendingDataUrls, được
  // submitEditRequest gọi) vẫn sống — boot() dưới đây vẫn bind như cũ.
  function boot() {
    bindInput();
    bindSave();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  setTimeout(boot, 500);
  setTimeout(boot, 1500);
  setInterval(boot, 1000);
}
// ===== END COPILOT_ULTRA_FINAL_EDIT_UPLOAD_LOCK_20260628 =====

// ===== COPILOT_FIX_EDIT_IMAGE_VISIBLE_AFTER_SAVE_20260628 =====
// Fix: thêm ảnh trong form sửa xong không thấy hiện do reload bị cache / cột tải nhẹ thiếu images.
// Lưu xong cập nhật local ngay, không chờ reload toàn bộ môn.
export function installImageVisibleAfterSave() {
  if (window.__COPILOT_FIX_EDIT_IMAGE_VISIBLE_AFTER_SAVE_20260628) return;
  window.__COPILOT_FIX_EDIT_IMAGE_VISIBLE_AFTER_SAVE_20260628 = true;

  function $(id) {
    return document.getElementById(id);
  }
  function db() {
    return window.HODSupabase?.__client || null;
  }
  function user() {
    return window.HODSupabase?.getUser?.() || null;
  }
  function profile() {
    return window.HODSupabase?.getProfile?.() || null;
  }
  function canDirect() {
    const r = String(profile()?.role || '').toLowerCase();
    return !!user() && (r === 'admin' || r === 'editor');
  }
  function subjectCode() {
    return localStorage.getItem('learninghub_subject_code_merged_v1') || '';
  }
  function currentDraft() {
    try {
      return window.editDraft || LHState.editDraft || null;
    } catch (e) {
      return window.editDraft || null;
    }
  }
  function imgUrl(im) {
    if (!im) return '';
    if (typeof im === 'string') return im;
    return im.src || im.url || im.secure_url || im.publicUrl || im.public_url || '';
  }
  function cleanImgs(list) {
    return (list || [])
      .map(im => {
        const src = imgUrl(im);
        if (!src || !/^https?:\/\//i.test(src)) return null;
        return typeof im === 'string' ? { src, url: src } : Object.assign({}, im, { src, url: src });
      })
      .filter(Boolean);
  }
  function collectDraft() {
    const d = currentDraft();
    if (!d) return null;
    const qEl = $('editQuestion') || document.querySelector('[data-edit-question]');
    const aEl = $('editAnswer') || document.querySelector('[data-edit-answer]');
    d.question = (qEl?.value || d.question || '').trim();
    d.answer = (aEl?.value || d.answer || '')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z]/g, '');
    const opts = {};
    document.querySelectorAll('[data-opt],[data-edit-opt]').forEach(inp => {
      const k = String(inp.dataset.opt || inp.dataset.editOpt || '').toUpperCase();
      const v = String(inp.value || '').trim();
      if (k && v) opts[k] = v;
    });
    if (Object.keys(opts).length) d.options = opts;
    d.answer_text = answerText(d) || d.answer_text || '';
    d.subject_code = d.subject_code || subjectCode();
    d.images = cleanImgs(d.images);
    return d;
  }
  async function getQuestionId(d) {
    if (d.id) return d.id;
    const c = db();
    if (!c || !d.num) return null;
    const r = await c
      .from('questions')
      .select('id')
      .eq('subject_code', d.subject_code || subjectCode())
      .eq('num', d.num)
      .maybeSingle();
    return r.error || !r.data ? null : r.data.id;
  }
  function updateLocal(d, id) {
    const patch = Object.assign({}, d, {
      id,
      images: cleanImgs(d.images),
      has_image: !!(d.images && d.images.length),
      __imagesChecked: true,
      __imagesLoaded: true,
    });
    try {
      if (Array.isArray(LHState.RAW)) {
        const i = LHState.RAW.findIndex(q => String(q.id) === String(id) || Number(q.num) === Number(patch.num));
        if (i >= 0) LHState.RAW[i] = Object.assign({}, LHState.RAW[i], patch);
      }
      if (Array.isArray(LHState.pool)) {
        const j = LHState.pool.findIndex(q => String(q.id) === String(id) || Number(q.num) === Number(patch.num));
        if (j >= 0) LHState.pool[j] = Object.assign({}, LHState.pool[j], patch);
      }
      const active = (LHState.pool && LHState.pool[LHState.ci]) || null;
      if (active && (String(active.id) === String(id) || Number(active.num) === Number(patch.num))) {
        Object.assign(active, patch);
      }
      window.renderCard?.();
      window.renderQuiz?.();
      window.renderStudy?.();
    } catch (e) {
      console.warn('[edit image local update]', e);
    }
  }
  async function saveDirectNoReload() {
    if (!canDirect()) return false;
    const c = db();
    const d = collectDraft();
    if (!c || !d) return false;
    const id = await getQuestionId(d);
    if (!id) {
      alert('Không tìm thấy ID câu hỏi trên Supabase.');
      return true;
    }
    const payload = {
      question: d.question,
      options: d.options || {},
      answer: d.answer,
      answer_text: d.answer_text,
      images: cleanImgs(d.images),
      has_image: !!(d.images && d.images.length),
      updated_at: new Date().toISOString(),
    };
    const u = window.HODSupabase?.getUser?.();
    const oldQ =
      (LHState.RAW || []).find(x => String(x.id) === String(id) || Number(x.num) === Number(d.num)) ||
      (LHState.pool || []).find(x => String(x.id) === String(id) || Number(x.num) === Number(d.num)) ||
      d;
    const old_data = {
      question: oldQ.question || '',
      options: oldQ.options || {},
      answer: oldQ.answer || '',
      answer_text: oldQ.answer_text || '',
      images: cleanImgs(oldQ.images || []),
    };
    const res = await fetch('/api/admin-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({
        user_id: u?.id,
        action: 'save_question_direct',
        payload: {
          question_id: id,
          new_data: Object.assign({ id, subject_code: d.subject_code, num: d.num }, payload),
          old_data,
        },
      }),
    });
    const out = await res.json().catch(() => ({}));
    if (!res.ok || out.error) {
      alert('Lưu trực tiếp thất bại: ' + (out.error || res.status));
      return true;
    }
    if (typeof window.clearLearningHubQuestionCache === 'function') {
      window.clearLearningHubQuestionCache();
    }
    d.images = payload.images;
    $('editModal')?.classList.add('hidden');
    updateLocal(Object.assign({}, d, payload), id);
    window.notify?.('Đã lưu ảnh và cập nhật câu hiện tại');
    return true;
  }

  document.addEventListener(
    'click',
    async function (e) {
      const btn = e.target.closest?.('#saveEdit,[data-edit-preview-save]');
      if (!btn || !btn.closest?.('#editModal')) return;
      if (!canDirect()) return;
      e.preventDefault?.();
      e.stopPropagation?.();
      e.stopImmediatePropagation?.();
      const oldText = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Đang lưu...';
      try {
        await saveDirectNoReload();
      } finally {
        btn.disabled = false;
        btn.textContent = oldText || 'Lưu trực tiếp';
      }
    },
    true,
  );
}
// ===== END COPILOT_FIX_EDIT_IMAGE_VISIBLE_AFTER_SAVE_20260628 =====

// ===== EDIT_RENDER_NULL_GUARD_20260629 =====
export function installEditImagesRender() {
  function $(id) {
    return document.getElementById(id);
  }
  function safeSrc(im) {
    return im && typeof im === 'object'
      ? im.src || im.url || im.secure_url || im.publicUrl || im.public_url || ''
      : im || '';
  }
  function safeEsc(s) {
    return String(s ?? '').replace(
      /[&<>"']/g,
      c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );
  }
  function ensureEditImgsBox() {
    let box = $('editImgs');
    if (box) return box;
    const input = $('imgUpload');
    if (!input) return null;
    box = document.createElement('div');
    box.id = 'editImgs';
    box.className = 'editImgs';
    input.insertAdjacentElement('afterend', box);
    return box;
  }
  window.renderEditImages = function () {
    const box = ensureEditImgsBox();
    if (!box) return;
    const imgs =
      typeof LHState.editDraft !== 'undefined' && LHState.editDraft && Array.isArray(LHState.editDraft.images)
        ? LHState.editDraft.images
        : [];
    box.innerHTML = imgs.length
      ? imgs
          .map((im, i) => {
            const src = safeSrc(im);
            return `<div class="editImg"><button class="rm" data-rm="${i}">×</button><img src="${safeEsc(src)}" loading="lazy" decoding="async"><input class="imgUrlBox" value="${safeEsc(src)}" readonly onclick="this.select()" title="Bấm để chọn URL ảnh" style="margin-top:6px;width:100%;max-width:260px;border:1px solid rgba(200,169,110,.24);border-radius:10px;background:rgba(0,0,0,.22);color:var(--gold2);padding:7px;font-size:.72rem;"></div>`;
          })
          .join('')
      : '<p style="color:var(--mist)">Chưa có hình.</p>';
  };
}
// ===== END EDIT_RENDER_NULL_GUARD_20260629 =====

// ===== COPILOT_FIX_IMAGE_RESET_LOSS_FINAL_20260630 =====
export function installImgsHTML() {
  window.imgsHTML = function (c) {
    let raw = c?.images || [];
    if (typeof raw === 'string') {
      const s = raw.trim();
      if ((s.startsWith('[') && s.endsWith(']')) || (s.startsWith('{') && s.endsWith('}'))) {
        try {
          raw = JSON.parse(s);
        } catch (e) {
          raw = [s];
        }
      } else if (s) {
        raw = [s];
      } else {
        raw = [];
      }
    }
    if (!Array.isArray(raw)) raw = [raw];
    return raw
      .map(im => {
        if (!im) return '';
        const src =
          typeof im === 'string'
            ? im
            : im.src || im.url || im.secure_url || im.publicUrl || im.public_url || im.image_url || im.imageUrl || '';
        if (!src || String(src).startsWith('data:image/')) return '';
        return '<img src="' + esc(src) + '" alt="" loading="lazy" decoding="async">';
      })
      .join('');
  };
}
// ===== END COPILOT_FIX_IMAGE_RESET_LOSS_FINAL_20260630 =====
