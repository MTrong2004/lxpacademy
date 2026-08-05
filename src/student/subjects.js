/**
 * Student Subject Selection & Gate Module
 */

import { getDeviceTypeString, getDeviceId } from '../core/device.js';
import { lhWarn } from '../core/log.js';
// GLOBALS_BRIDGE_20260731: `esc` dùng ở imgsHTML / renderEditImages phía dưới. Trước đây
// gọi trần theo tên — hồi còn một file thì thấy binding của appCore, tách ra là ReferenceError
// mỗi khi câu hỏi CÓ ảnh. `npm run check:globals` canh lớp lỗi này.
import { esc } from './format.js';

const SUBJECT_STORE = 'learninghub_subject_code_merged_v1';

export function getSubjectCode() {
  return localStorage.getItem(SUBJECT_STORE) || '';
}

export function syncUserSubjectToProfile(code, supabaseUser) {
  const u = supabaseUser || window.HODSupabase?.getUser?.();
  if (!u) return;
  try {
    const md = u.user_metadata || {};
    fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: u.id,
        email: u.email,
        full_name: md.full_name || md.name || '',
        avatar_url: md.avatar_url || md.picture || '',
        current_subject: code || getSubjectCode() || '',
        device_info: getDeviceTypeString(),
        device_id: getDeviceId(),
      }),
    }).catch(e => console.warn('syncUserSubjectToProfile failed:', e));
  } catch (e) {
    lhWarn('syncUserSubjectToProfile', e);
  }
}

export function setSubject(code, supabaseUser) {
  if (code) {
    localStorage.setItem(SUBJECT_STORE, code);
  } else {
    localStorage.removeItem(SUBJECT_STORE);
  }
  syncUserSubjectToProfile(code, supabaseUser);
}

// Exported installation functions for appCore integration
import { LHState } from './state.js';

export function installSubjectDataLoader() {
  // ===== COPILOT_CLOUDINARY_IMAGE_FIX_20260627 =====
  // Ảnh mới sẽ upload lên Cloudinary, KHÔNG lưu Base64 vào Supabase nữa.
  (function () {
    const CLOUDINARY_CLOUD_NAME = window.APP_CONFIG?.CLOUDINARY_CLOUD_NAME || '';
    const CLOUDINARY_UPLOAD_PRESET = window.APP_CONFIG?.CLOUDINARY_UPLOAD_PRESET || '';
    const CLOUDINARY_UPLOAD_FOLDER = window.APP_CONFIG?.CLOUDINARY_UPLOAD_FOLDER || 'learninghub/questions';
    const CLOUDINARY_UPLOAD_URL =
      window.APP_CONFIG?.CLOUDINARY_UPLOAD_URL ||
      (CLOUDINARY_CLOUD_NAME ? `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload` : '');
    const SUBJECT_STORE = 'learninghub_subject_code_merged_v1';
    const QUESTION_LIGHT_COLUMNS =
      'id,subject_code,num,question,options,answer,answer_text,images,is_active,updated_at,has_image,error_risk,error_risk_reason,has_image,error_risk,error_risk_reason';
    function $(id) {
      return document.getElementById(id);
    }
    function supa() {
      return window.HODSupabase?.__client || null;
    }
    function user() {
      return window.HODSupabase?.getUser?.() || null;
    }
    function subject() {
      return localStorage.getItem(SUBJECT_STORE) || '';
    }
    function notifyX(t) {
      if (typeof notify === 'function') notify(t);
      else console.log(t);
    }
    async function uploadCloudinary(file) {
      if (!CLOUDINARY_UPLOAD_URL || !CLOUDINARY_UPLOAD_PRESET) throw new Error('Thiếu Cloudinary trong config.js.');
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      fd.append('folder', CLOUDINARY_UPLOAD_FOLDER);
      const res = await fetch(CLOUDINARY_UPLOAD_URL, { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error?.message || 'Upload Cloudinary thất bại');
      return {
        id: data.public_id,
        public_id: data.public_id,
        src: data.secure_url,
        url: data.secure_url,
        width: data.width,
        height: data.height,
        source: 'cloudinary',
      };
    }
    async function loadSubjectLight(force = false) {
      const code = subject();
      if (!code) return false;
      try {
        if (typeof window.__examResetForSubjectChange === 'function') window.__examResetForSubjectChange();
      } catch (e) {
        lhWarn('COPILOT_CLOUDINARY_IMAGE_FIX_20260627', e);
      }
      try {
        const res = await fetch('/api/questions?subject_code=' + encodeURIComponent(code) + '&ts=' + Date.now(), {
          cache: 'no-store',
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || json.error) throw new Error(json.error || 'Không tải được câu hỏi từ Turso');
        const data = Array.isArray(json.data) ? json.data : [];
        LHState.RAW = data.map(r => {
          const images = typeof cleanImages === 'function' ? cleanImages(r.images || []) : r.images || [];
          return {
            id: r.id,
            subject_code: r.subject_code || code,
            num: r.num,
            question: r.question,
            options: r.options || {},
            answer: r.answer || '',
            answer_text: r.answer_text || '',
            images,
            has_image: !!(r.has_image || images.length),
            error_risk: r.error_risk,
            error_risk_reason: r.error_risk_reason,
            __imagesChecked: true,
            __imagesLoaded: true,
          };
        });
        LHState.pool = [...LHState.RAW];
        const saved = +localStorage.getItem('learninghub_progress_' + code) || 0;
        LHState.ci = Math.max(0, Math.min(saved, Math.max(0, LHState.pool.length - 1)));
        LHState.flipped = false;
        renderAllSafe(); // FIX_LIBRARY_STALE_AFTER_SUBJECT_CHANGE_20260727
        return true;
      } catch (e) {
        console.warn('[light load]', e);
        return false;
      }
    }
    window.loadCurrentSubjectOnly = loadSubjectLight;
    function patchApi() {
      if (window.HODSupabase) window.HODSupabase.loadQuestionsFromSupabase = loadSubjectLight;
    }
    patchApi();
    setTimeout(patchApi, 500);
    setTimeout(patchApi, 1500);

    async function fetchImagesForCurrent() {
      const c = supa();
      const q = (LHState.pool && LHState.pool[LHState.ci]) || null;
      if (!c || !q || !q.id || q.__imagesChecked) return;
      q.__imagesChecked = true;
      const { data, error } = await c.from('questions').select('id,images').eq('id', q.id).maybeSingle();
      if (!error && data) {
        q.images = data.images || [];
        q.__imagesLoaded = true;
        try {
          (typeof renderCard === 'function' ? renderCard : window.renderCard)?.();
        } catch (e) {
          lhWarn('COPILOT_CLOUDINARY_IMAGE_FIX_20260627', e);
        }
      }
    }
    // RENDER_CARD_WINDOW_BRIDGE_20260731: chuỗi lớp renderCard nằm ở window (appCore chỉ
    // giữ hàm chuyển tiếp cùng tên). Đọc/ghi thẳng window.renderCard — viết trần
    // `renderCard = …` trong module là gán vào biến toàn cục, dễ hiểu nhầm là binding của appCore.
    const oldRenderCard = typeof window.renderCard === 'function' ? window.renderCard : null;
    if (oldRenderCard && !oldRenderCard.__cloudinaryLazy) {
      const cloudinaryLazyRenderCard = function () {
        oldRenderCard.apply(this, arguments);
      }; // tắt auto fetch ảnh để tránh nhấp nháy
      cloudinaryLazyRenderCard.__cloudinaryLazy = true;
      window.renderCard = cloudinaryLazyRenderCard;
    }

    function bindEditorUpload() {
      const inp = $('imgUpload');
      if (!inp || inp.__cloudinaryBound) return;
      inp.__cloudinaryBound = true;
      inp.onchange = async function (e) {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        inp.disabled = true;
        notifyX('Đang upload ảnh lên Cloudinary...');
        try {
          LHState.editDraft.images = LHState.editDraft.images || [];
          for (const file of files) {
            LHState.editDraft.images.push(await uploadCloudinary(file));
          }
          if (typeof renderEditImages === 'function') renderEditImages();
          notifyX('Đã upload ảnh lên Cloudinary');
        } catch (err) {
          alert(err.message || err);
        } finally {
          inp.disabled = false;
          e.target.value = '';
        }
      };
    }
    // Lớp bọc openEditor của block này đã XÓA (20260727): chết vì apply() ở mốc 900ms.
    // Bỏ luôn được một đường đọc THẲNG Supabase từ client (c.from("questions")) mà
    // CLAUDE.md nói phải chuyển dần sang /api/*. loadCurrentSubjectOnly / renderCard của
    // block này vẫn sống.
    document.addEventListener('DOMContentLoaded', () => {
      patchApi();
      setTimeout(bindEditorUpload, 300);
    });
  })();

  // ===== FINAL_URL_ONLY_IMAGES_AND_CURRENT_RELOAD_20260628 =====
  // Mục tiêu: không lưu Base64 mới, chỉ lưu URL ảnh, tải câu nhẹ, có nút/tự reload câu hiện tại.
  (function () {
    const CLOUD_NAME = window.APP_CONFIG?.CLOUDINARY_CLOUD_NAME || '';
    const UPLOAD_PRESET = window.APP_CONFIG?.CLOUDINARY_UPLOAD_PRESET || '';
    const UPLOAD_FOLDER = window.APP_CONFIG?.CLOUDINARY_UPLOAD_FOLDER || 'learninghub/questions';
    const UPLOAD_URL =
      window.APP_CONFIG?.CLOUDINARY_UPLOAD_URL ||
      (CLOUD_NAME ? `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload` : '');
    const SUBJECT_STORE = 'learninghub_subject_code_merged_v1';
    const LIGHT_COLUMNS =
      'id,subject_code,num,question,options,answer,answer_text,is_active,updated_at,has_image,error_risk,error_risk_reason';
    const FULL_COLUMNS =
      'id,subject_code,num,question,options,answer,answer_text,images,is_active,updated_at,has_image,error_risk,error_risk_reason,has_image,error_risk,error_risk_reason';
    let lastAutoReload = 0;

    function $(id) {
      return document.getElementById(id);
    }
    function supa() {
      return window.HODSupabase?.__client || null;
    }
    function user() {
      return window.HODSupabase?.getUser?.() || null;
    }
    function subject() {
      return localStorage.getItem(SUBJECT_STORE) || '';
    }
    function notifyX(msg) {
      if (typeof notify === 'function') notify(msg);
      else console.log(msg);
    }

    function isDataImage(s) {
      return /^data:image\//i.test(String(s || ''));
    }
    function isLikelyBase64(s) {
      s = String(s || '').trim();
      return s.length > 500 && /^(iVBORw0KGgo|\/9j\/|R0lGOD|UklGR)/.test(s);
    }
    function cleanImageOne(im) {
      if (!im) return null;
      if (typeof im === 'string') {
        const s = im.trim();
        if (!s || isDataImage(s) || isLikelyBase64(s)) return null;
        if (/^https?:\/\//i.test(s)) return { src: s, url: s, source: 'url' };
        return null;
      }
      if (typeof im === 'object') {
        const raw =
          im.secure_url ||
          im.src ||
          im.url ||
          im.publicUrl ||
          im.public_url ||
          im.image_url ||
          im.imageUrl ||
          im.file_url ||
          im.fileUrl ||
          im.href ||
          im.path ||
          '';
        if (!raw || isDataImage(raw) || isLikelyBase64(raw)) return null;
        if (!/^https?:\/\//i.test(String(raw))) return null;
        return {
          id: im.public_id || im.id || undefined,
          public_id: im.public_id || im.id || undefined,
          src: String(raw),
          url: String(raw),
          width: im.width || undefined,
          height: im.height || undefined,
          source: im.source || 'url',
        };
      }
      return null;
    }
    function cleanImages(arr) {
      let raw = arr || [];
      if (typeof raw === 'string') {
        const s = raw.trim();
        if ((s.startsWith('[') && s.endsWith(']')) || (s.startsWith('{') && s.endsWith('}'))) {
          try {
            raw = JSON.parse(s);
          } catch (e) {
            raw = [raw];
          }
        } else raw = [raw];
      }
      if (!Array.isArray(raw)) raw = [raw];
      return raw.map(cleanImageOne).filter(Boolean);
    }
    // GLOBALS_BRIDGE_20260731: phơi ra window NGAY SAU khi khai báo — appCore, library.js và
    // subjectGate.js đều gọi tên này. Đây là bản DUY NHẤT; thiếu cầu nối thì library ném
    // ReferenceError (ảnh chậm không bao giờ nạp) còn hai chỗ kia im lặng bỏ qua lọc ảnh.
    window.cleanImages = cleanImages;
    function imageUrl(im) {
      const c = cleanImageOne(im);
      return c?.src || '';
    }

    async function uploadCloudinary(file) {
      if (!UPLOAD_URL || !UPLOAD_PRESET) throw new Error('Thiếu Cloudinary trong config.js.');
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', UPLOAD_PRESET);
      fd.append('folder', UPLOAD_FOLDER);
      const res = await fetch(UPLOAD_URL, { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error?.message || 'Upload ảnh lên Cloudinary thất bại');
      return cleanImageOne({
        public_id: data.public_id,
        secure_url: data.secure_url,
        width: data.width,
        height: data.height,
        source: 'cloudinary',
      });
    }

    window.__LHCleanImages = cleanImages;
    window.__LHUploadCloudinary = uploadCloudinary;

    function optimizeImageUrl(src) {
      if (!src) return '';
      if (src.includes('res.cloudinary.com/') && src.includes('/image/upload/')) {
        if (!src.includes('q_auto') && !src.includes('f_auto')) {
          return src.replace('/image/upload/', '/image/upload/c_limit,w_600,q_auto,f_auto/');
        }
      }
      return src;
    }

    // Hiển thị ảnh chỉ từ URL hợp lệ.
    window.imgsHTML = imgsHTML = function (c) {
      return cleanImages(c?.images || [])
        .map(im => `<img src="${esc(optimizeImageUrl(im.src))}" alt="" loading="lazy" decoding="async">`)
        .join('');
    };

    function bindEditorUpload() {
      const inp = $('imgUpload');
      if (!inp || inp.__urlOnlyBound) return;
      inp.__urlOnlyBound = true;
      inp.onchange = async function (e) {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        inp.disabled = true;
        notifyX('Đang upload ảnh...');
        try {
          LHState.editDraft.images = cleanImages(LHState.editDraft.images);
          for (const file of files) {
            const uploaded = await uploadCloudinary(file);
            if (uploaded) LHState.editDraft.images.push(uploaded);
          }
          if (typeof renderEditImages === 'function') renderEditImages();
          notifyX('Đã upload ảnh bằng URL');
        } catch (err) {
          alert(err.message || err);
        } finally {
          inp.disabled = false;
          inp.value = '';
        }
      };
    }

    // Không cho render/sửa ảnh Base64 cũ ở form.
    const oldRenderEditImages = typeof renderEditImages === 'function' ? renderEditImages : null;
    renderEditImages = window.renderEditImages = function () {
      const box = $('editImgs');
      if (!box) return oldRenderEditImages ? oldRenderEditImages() : undefined;
      LHState.editDraft.images = cleanImages(LHState.editDraft.images);
      box.innerHTML = LHState.editDraft.images.length
        ? LHState.editDraft.images
            .map(
              (im, i) =>
                `<div class="editImg"><button class="rm" data-rm="${i}">×</button><img src="${esc(im.src)}" loading="lazy" decoding="async"></div>`,
            )
            .join('')
        : '<p style="color:var(--mist)">Chưa có hình.</p>';
    };

    // Lớp bọc openEditor của block này đã XÓA (20260727): chết vì apply() ở mốc 900ms.
    // Nó nạp trước ảnh của câu từ Turso rồi lọc lại editDraft.images — việc nạp ảnh nay do
    // thư viện (LIBRARY_UX_STEP1_STABLE_RENDER) làm. __LHCleanImages vẫn sống.

    // Chặn Base64 trước mọi luồng gửi báo cáo/sửa.
    if (window.HODSupabase?.submitEditRequest && !window.HODSupabase.submitEditRequest.__urlOnlyPatch) {
      const oldSubmit = window.HODSupabase.submitEditRequest.bind(window.HODSupabase);
      window.HODSupabase.submitEditRequest = async function (newDraft, oldQ) {
        if (newDraft) newDraft.images = cleanImages(newDraft.images);
        if (oldQ) oldQ.images = cleanImages(oldQ.images);
        return oldSubmit(newDraft, oldQ);
      };
      window.HODSupabase.submitEditRequest.__urlOnlyPatch = true;
    }

    const CACHE_TTL = 12 * 60 * 60 * 1000; // 12 giờ
    /*
    QUESTION_CACHE_REVALIDATE_20260726
    Key đổi v1 -> v2 để bỏ các cache v1 đã "nhiễm độc": chúng được ghi lúc DB còn
    images = [] và sống tới 12 giờ, nên ảnh mới thêm vào DB không bao giờ hiện ra
    (F5 cũng vô ích vì boot dùng loadSubjectLight(false) = đọc cache).
    Cache giờ chỉ để render tức thì, luôn kèm revalidate ngầm (xem revalidateQuestions).
  */
    function cacheKey(code) {
      return 'learninghub_questions_cache_v2_' + code;
    }
    /*
    LH_OFFLINE_GRACE_20260806: `allowStale` bỏ qua hạn 12 giờ. Chỉ dùng khi KHÔNG gọi được
    server: cache quá hạn vẫn hơn hẳn một màn hình rỗng — dữ liệu cũ vài ngày còn học được,
    còn "0 câu" thì không. Đường bình thường vẫn giữ đúng TTL để không ai đọc dữ liệu cũ
    trong lúc mạng vẫn tốt.
  */
    function readQuestionCache(code, allowStale = false) {
      try {
        const raw = localStorage.getItem(cacheKey(code));
        if (!raw) return null;
        const obj = JSON.parse(raw);
        if (!obj || !obj.savedAt || !Array.isArray(obj.rows)) return null;
        if (!allowStale && Date.now() - obj.savedAt > CACHE_TTL) return null;
        return obj.rows;
      } catch (e) {
        return null;
      }
    }
    function writeQuestionCache(code, rows) {
      try {
        localStorage.setItem(cacheKey(code), JSON.stringify({ savedAt: Date.now(), rows: rows || [] }));
      } catch (e) {
        lhWarn('FINAL_URL_ONLY_IMAGES_AND_CURRENT_RELOAD_20260628', e);
      }
    }
    async function fetchTursoQuestions(code, fresh = false) {
      // fresh=1: bỏ qua cả cache 5 phút phía server (_questionsCache trong
      // api/controllers/questions.js). `cache:'no-store'` chỉ bỏ cache của browser.
      const res = await fetch(
        '/api/questions?subject_code=' + encodeURIComponent(code) + (fresh ? '&fresh=1' : '') + '&ts=' + Date.now(),
        { cache: 'no-store' },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.error) throw new Error(json.error || 'Không tải được câu hỏi từ Turso');
      return Array.isArray(json.data) ? json.data : [];
    }
    function mapTursoRow(r, code) {
      const images = cleanImages(r.images || []);
      return {
        id: r.id,
        subject_code: r.subject_code || code,
        num: r.num,
        question: r.question,
        options: r.options || {},
        answer: r.answer || '',
        answer_text: r.answer_text || '',
        images,
        is_active: r.is_active !== false && r.is_active !== 0 && r.is_active !== '0',
        updated_at: r.updated_at,
        has_image: !!(r.has_image || images.length),
        error_risk: r.error_risk || 'low',
        error_risk_reason: r.error_risk_reason || '',
        __imagesChecked: true,
        __imagesLoaded: true,
      };
    }
    function applyQuestionRows(rows, code) {
      LHState.RAW = (rows || []).map(r => mapTursoRow(r, code));
      LHState.pool = [...LHState.RAW];
      const saved = +localStorage.getItem('learninghub_progress_' + code) || 0;
      LHState.ci = Math.max(0, Math.min(saved, Math.max(0, LHState.pool.length - 1)));
      LHState.flipped = false;
      renderAllSafe(); // FIX_LIBRARY_STALE_AFTER_SUBJECT_CHANGE_20260727
    }

    /*
    QUESTION_CACHE_REVALIDATE_20260726
    Render ngay từ cache rồi đối chiếu lại với server ở background. Vá TẠI CHỖ
    (Object.assign lên đúng object trong RAW/pool) thay vì applyQuestionRows để
    không reset ci -> người dùng không bị nhảy về câu khác giữa lúc đang học.
    Fetch KHÔNG dùng fresh=1: cache 5 phút của server đủ mới cho lần đối chiếu này
    và không tốn thêm read Turso (xem OPTIM_TURSO_READS_20260726).
  */
    let revalidating = {};
    async function revalidateQuestions(code) {
      if (revalidating[code]) return;
      revalidating[code] = true;
      try {
        const rows = await fetchTursoQuestions(code);
        if (!rows.length || subject() !== code) return;
        writeQuestionCache(code, rows);
        const byId = new Map(rows.map(r => [String(r.id), mapTursoRow(r, code)]));
        let changed = 0;
        const patch = row => {
          const next = byId.get(String(row?.id));
          if (!next) return row;
          if (
            row.question !== next.question ||
            row.answer !== next.answer ||
            JSON.stringify(row.images || []) !== JSON.stringify(next.images || [])
          )
            changed++;
          return Object.assign(row, next);
        };
        LHState.RAW = (LHState.RAW || []).map(patch);
        LHState.pool = (LHState.pool || []).map(patch);
        if (changed) {
          console.info('[revalidateQuestions] ' + code + ': cập nhật ' + changed + ' câu từ server');
          renderAllSafe(); // FIX_LIBRARY_STALE_AFTER_SUBJECT_CHANGE_20260727
        }
      } catch (e) {
        console.warn('[revalidateQuestions]', e);
      } finally {
        delete revalidating[code];
      }
    }

    let activeLoadPromises = {};
    async function loadSubjectLight(force = false) {
      const code = subject();
      if (!user() || !code) return false;
      if (!force) {
        const cached = readQuestionCache(code);
        if (cached && cached.length && cached.every(r => Object.prototype.hasOwnProperty.call(r, 'images'))) {
          applyQuestionRows(cached, code);
          revalidateQuestions(code); // cố ý không await: hiện dữ liệu cache trước, sửa sau
          return true;
        }
      }
      if (activeLoadPromises[code]) return activeLoadPromises[code];
      if (typeof window.showLibrarySkeleton === 'function') window.showLibrarySkeleton();
      activeLoadPromises[code] = (async () => {
        try {
          const data = await fetchTursoQuestions(code, force);
          writeQuestionCache(code, data);
          applyQuestionRows(data, code);
          return true;
        } catch (e) {
          console.warn('[loadSubjectLight]', e);
          /*
          LH_OFFLINE_GRACE_20260806: mất mạng / server lỗi thì rơi về cache, KỂ CẢ CACHE QUÁ HẠN.
          Trước đây nhánh này chỉ `return false` nên rớt mạng là thư viện + flashcard trắng
          trơn dù dữ liệu vẫn nằm trong localStorage — nhất là đường force=true
          (loadCurrentSubjectOnly(true)) vốn không đọc cache ở đầu hàm.
        */
          const stale = readQuestionCache(code, true);
          if (stale && stale.length) {
            console.warn('[loadSubjectLight] dùng dữ liệu đã lưu trên máy cho', code, '—', stale.length, 'câu');
            applyQuestionRows(stale, code);
            return true;
          }
          return false;
        } finally {
          delete activeLoadPromises[code];
        }
      })();
      return activeLoadPromises[code];
    }

    async function fetchImagesForCurrent(force = false) {
      const q = (LHState.pool && LHState.pool[LHState.ci]) || null;
      const code = subject();
      if (!q?.id || !code) return false;
      if (!force && q.__imagesLoaded) return true;
      if (q.__imagesLoading) return true;
      if (!force && q.images && q.images.length) {
        q.__imagesLoaded = true;
        return true;
      }
      if (!force && !q.has_image) {
        q.images = [];
        q.__imagesLoaded = true;
        return true;
      }
      q.__imagesLoading = true;
      try {
        const rows = await fetchTursoQuestions(code);
        const data = rows.find(r => String(r.id) === String(q.id));
        if (data) {
          const mapped = mapTursoRow(data, code);
          Object.assign(q, mapped);
          try {
            writeQuestionCache(
              code,
              LHState.pool.map(x => ({
                id: x.id,
                subject_code: x.subject_code,
                num: x.num,
                question: x.question,
                options: x.options,
                answer: x.answer,
                answer_text: x.answer_text,
                images: x.images,
                is_active: x.is_active,
                updated_at: x.updated_at,
                has_image: x.has_image,
                error_risk: x.error_risk,
                error_risk_reason: x.error_risk_reason,
              })),
            );
          } catch (e) {
            lhWarn('FINAL_URL_ONLY_IMAGES_AND_CURRENT_RELOAD_20260628', e);
          }
          renderAllSafe(); // FIX_LIBRARY_STALE_AFTER_SUBJECT_CHANGE_20260727
        }
        q.__imagesLoaded = true;
        return !!data;
      } catch (e) {
        q.__imagesLoaded = true;
        return false;
      } finally {
        q.__imagesLoading = false;
      }
    }

    async function reloadCurrentQuestion(silent = false) {
      const q = (LHState.pool && LHState.pool[LHState.ci]) || null;
      const code = subject();
      if (!q?.id || !code) return false;
      try {
        const rows = await fetchTursoQuestions(code, true); // người dùng bấm reload => phải lấy bản mới nhất
        const data = rows.find(r => String(r.id) === String(q.id));
        if (!data) {
          if (!silent) alert('Không reload được câu hiện tại.');
          return false;
        }
        const clean = mapTursoRow(data, code);
        const upd = row => (String(row.id) === String(clean.id) ? Object.assign(row, clean) : row);
        LHState.RAW = (LHState.RAW || []).map(upd);
        LHState.pool = (LHState.pool || []).map(upd);
        renderAllSafe(); // FIX_LIBRARY_STALE_AFTER_SUBJECT_CHANGE_20260727
        if (!silent) notifyX('Đã reload câu hiện tại');
        return true;
      } catch (e) {
        if (!silent) alert('Không reload được câu hiện tại.');
        return false;
      }
    }

    window.loadCurrentSubjectOnly = loadSubjectLight;
    window.reloadCurrentQuestion = reloadCurrentQuestion;
    if (window.HODSupabase) window.HODSupabase.loadQuestionsFromSupabase = loadSubjectLight;

    let lazyLoadTimeout = null;
    // RENDER_CARD_WINDOW_BRIDGE_20260731: xem chú thích ở lớp __cloudinaryLazy phía trên.
    const oldRenderCard = typeof window.renderCard === 'function' ? window.renderCard : null;
    if (oldRenderCard && !oldRenderCard.__urlOnlyLazy) {
      const urlOnlyLazyRenderCard = function () {
        oldRenderCard.apply(this, arguments);
        // Gọi fetchImagesForCurrent tự động sau khi render có debounce 300ms
        if (lazyLoadTimeout) clearTimeout(lazyLoadTimeout);
        lazyLoadTimeout = setTimeout(() => {
          fetchImagesForCurrent(false);
        }, 300);
      };
      urlOnlyLazyRenderCard.__urlOnlyLazy = true;
      window.renderCard = urlOnlyLazyRenderCard;
    }

    function ensureReloadButton() {
      return;
    }

    function autoReloadCurrent() {
      const now = Date.now();
      if (now - lastAutoReload < 45000) return;
      lastAutoReload = now;
      reloadCurrentQuestion(true);
    }

    // Tắt tự reload câu hiện tại sau mỗi 60 giây/focus (chỉ load khi chọn môn).
  })();
  // ===== END FINAL_URL_ONLY_IMAGES_AND_CURRENT_RELOAD_20260628 =====
}

export function installActiveSubjectCountSync() {
  // ===== ACTIVE_SUBJECT_COUNT_SYNC_20260629 =====
  // Nếu môn đang chọn đã load câu hỏi, số câu trên thẻ môn phải lấy từ RAW/pool ngay, không để cache 0 đè lên.
  (function () {
    if (window.__ACTIVE_SUBJECT_COUNT_SYNC_20260629) return;
    window.__ACTIVE_SUBJECT_COUNT_SYNC_20260629 = true;

    const STORE = 'learninghub_subject_counts_cache_v3';
    const SUBJECT_STORE = 'learninghub_subject_code_merged_v1';

    function code() {
      return localStorage.getItem(SUBJECT_STORE) || '';
    }
    function read() {
      try {
        return JSON.parse(localStorage.getItem(STORE) || '{}') || {};
      } catch (e) {
        return {};
      }
    }
    function write(x) {
      try {
        localStorage.setItem(STORE, JSON.stringify(x || {}));
      } catch (e) {
        lhWarn('ACTIVE_SUBJECT_COUNT_SYNC_20260629', e);
      }
    }
    function cssEscape(s) {
      try {
        return CSS.escape(String(s));
      } catch (e) {
        return String(s).replace(/"/g, '\\"');
      }
    }
    function loadedCount() {
      try {
        if (Array.isArray(LHState.RAW) && LHState.RAW.length) return LHState.RAW.length;
        if (Array.isArray(LHState.pool) && LHState.pool.length) return LHState.pool.length;
      } catch (e) {
        lhWarn('ACTIVE_SUBJECT_COUNT_SYNC_20260629', e);
      }
      return 0;
    }
    function setCardCount(subject, n) {
      if (!subject || !Number.isFinite(Number(n)) || Number(n) <= 0) return;
      const count = Number(n);
      document.querySelectorAll('.subjectCard[data-code="' + cssEscape(subject) + '"]').forEach(card => {
        const meta = card.querySelector('.subjectMeta span:first-child');
        if (meta) meta.textContent = count + ' câu';
        card.title = (card.title || subject).replace(/(?:\d+|—|0) câu/g, count + ' câu');
      });
      const store = read();
      store.counts = store.counts || {};
      store.confirmed = store.confirmed || {};
      store.counts[subject] = count;
      store.confirmed[subject] = true;
      store.updated_at = new Date().toISOString();
      write(store);
    }
    function syncActiveSubjectCount() {
      const subject = code();
      const n = loadedCount();
      if (subject && n > 0) setCardCount(subject, n);
    }

    window.syncActiveSubjectCount = syncActiveSubjectCount;

    const oldLoadCurrent = window.loadCurrentSubjectOnly;
    if (typeof oldLoadCurrent === 'function' && !oldLoadCurrent.__activeCountPatched) {
      window.loadCurrentSubjectOnly = async function () {
        const out = await oldLoadCurrent.apply(this, arguments);
        setTimeout(syncActiveSubjectCount, 50);
        setTimeout(syncActiveSubjectCount, 300);
        return out;
      };
      window.loadCurrentSubjectOnly.__activeCountPatched = true;
    }

    const oldLoadBySubject = window.loadBySubject;
    if (typeof oldLoadBySubject === 'function' && !oldLoadBySubject.__activeCountPatched) {
      window.loadBySubject = async function () {
        const out = await oldLoadBySubject.apply(this, arguments);
        setTimeout(syncActiveSubjectCount, 50);
        setTimeout(syncActiveSubjectCount, 300);
        return out;
      };
      window.loadBySubject.__activeCountPatched = true;
    }

    // RENDER_CARD_WINDOW_BRIDGE_20260731: xem chú thích ở installSubjectDataLoader.
    const oldRenderCard = typeof window.renderCard === 'function' ? window.renderCard : null;
    if (oldRenderCard && !window.__renderCardActiveCountPatched) {
      window.__renderCardActiveCountPatched = true;
      window.renderCard = function () {
        const out = oldRenderCard.apply(this, arguments);
        setTimeout(syncActiveSubjectCount, 0);
        return out;
      };
    }

    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(syncActiveSubjectCount, 500);
      setTimeout(syncActiveSubjectCount, 1500);
    });
    setInterval(() => {
      const gate = document.getElementById('subjectGate');
      if (gate && !gate.classList.contains('hidden')) syncActiveSubjectCount();
    }, 800);
  })();
  // ===== END ACTIVE_SUBJECT_COUNT_SYNC_20260629 =====

  // SUBJECTS_CACHE_BUST_AFTER_ADD_20260629 đã bị xóa (20260702): chỉ tác dụng khi có
  // request GET /rest/v1/subjects (Supabase REST trực tiếp), nhưng subjects giờ luôn
  // lấy qua /api/subjects (xem NOTE_20260630 đầu file) nên nhánh đó không bao giờ chạy.

  // ===== REMOVE_EYE_HIDE_OPTIONS_20260629 =====
  // Xóa nút con mắt và tắt hẳn chức năng ẩn/hiện lựa chọn.
  (function () {
    function apply() {
      try {
        localStorage.removeItem('hod102_hide_options');
      } catch (e) {
        lhWarn('REMOVE_EYE_HIDE_OPTIONS_20260629', e);
      }
      var opt = document.getElementById('options');
      if (opt) opt.classList.remove('hide');
      var eye = document.getElementById('toggleOpts');
      if (eye) eye.remove();
      var st = document.getElementById('stToggleOpts');
      if (st) st.style.display = 'none';
      var stText = document.getElementById('stOptState');
      if (stText) stText.textContent = 'Đang hiện lựa chọn';
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply);
    else apply();
    setTimeout(apply, 300);
  })();
  // ===== END REMOVE_EYE_HIDE_OPTIONS_20260629 =====
}

export function installAppStartupAutoLoad() {
  // ===== APP_STARTUP_AUTO_LOAD_QUESTIONS_SUBJECTS_20260630 =====
  // Fix nhẹ: mới vào web tự tải câu hỏi + thư viện, không cần F5. Không chạy vòng lặp dài.
  (function () {
    if (window.__APP_STARTUP_AUTO_LOAD_QUESTIONS_SUBJECTS_20260630) return;
    window.__APP_STARTUP_AUTO_LOAD_QUESTIONS_SUBJECTS_20260630 = true;

    const SUBJECT_STORE = 'learninghub_subject_code_merged_v1';
    let running = false;
    let doneFor = '';
    function subject() {
      return localStorage.getItem(SUBJECT_STORE) || '';
    }
    function user() {
      return window.HODSupabase?.getUser?.() || null;
    }
    function profile() {
      return window.HODSupabase?.getProfile?.() || null;
    }
    function approved() {
      // ACCESS_GATE_STRICT_20260726: fail-closed.
      return !!window.lhHasFullAccess?.(profile());
    }
    function dataOk(code) {
      try {
        return (
          !!code &&
          Array.isArray(LHState.RAW) &&
          LHState.RAW.length > 0 &&
          LHState.RAW.some(q => String(q.subject_code || code).toUpperCase() === String(code).toUpperCase())
        );
      } catch (e) {
        return false;
      }
    }
    function renderAll() {
      try {
        (typeof renderCard === 'function' ? renderCard : window.renderCard)?.();
      } catch (e) {
        lhWarn('APP_STARTUP_AUTO_LOAD_QUESTIONS_SUBJECTS_20260630', e);
      }
      try {
        (typeof renderQuiz === 'function' ? renderQuiz : window.renderQuiz)?.();
      } catch (e) {
        lhWarn('APP_STARTUP_AUTO_LOAD_QUESTIONS_SUBJECTS_20260630', e);
      }
      try {
        (typeof renderStudy === 'function' ? renderStudy : window.renderStudy)?.();
      } catch (e) {
        lhWarn('APP_STARTUP_AUTO_LOAD_QUESTIONS_SUBJECTS_20260630', e);
      }
    }
    async function loadOnce(reason) {
      const code = subject();
      if (!code || !user() || !approved() || running) return false;
      if (dataOk(code)) {
        doneFor = code;
        renderAll();
        return true;
      }
      if (doneFor === code) return true;
      running = true;
      try {
        let ok = false;
        if (typeof window.loadCurrentSubjectOnly === 'function') ok = await window.loadCurrentSubjectOnly(false);
        else if (window.HODSupabase?.loadQuestionsFromSupabase)
          ok = await window.HODSupabase.loadQuestionsFromSupabase();
        if (ok || dataOk(code)) {
          doneFor = code;
          renderAll();
          return true;
        }
      } catch (e) {
        console.warn('[startup auto load]', reason, e);
      } finally {
        running = false;
      }
      return false;
    }
    function schedule(reason) {
      [300, 1300, 3500].forEach(ms => setTimeout(() => loadOnce(reason + ':' + ms), ms));
    }
    function boot() {
      schedule('boot');
      document.querySelectorAll('.tab').forEach(btn => {
        if (btn.__startupAutoLoadBound) return;
        btn.__startupAutoLoadBound = true;
        btn.addEventListener('click', () => setTimeout(() => loadOnce('tab'), 120));
      });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
    // OPTIM_TURSO_READS_20260726: Bỏ reload khi focus/visible.
    // Data đã cache trong RAM (RAW), không cần gọi API lại mỗi lần đổi tab.
    // Giữ boot retry 3 lần khi mới mở trang là đủ.
  })();
  // ===== END APP_STARTUP_AUTO_LOAD_QUESTIONS_SUBJECTS_20260630 =====
}
