/**
 * Sửa / báo cáo câu hỏi — bước 3 của docs/SPLIT_PLAN.md, tách ngày 20260727.
 *
 * Đây là editor ĐANG CHẠY của app học sinh: `openEditPreview` / `saveEditPreview`, nguyên
 * văn block LIBRARY_FILTER_AND_EDIT_PREVIEW_LAYOUT_20260627 (appCore cũ dòng 7900–8220),
 * kèm block Ctrl+V dán ảnh EDIT_PREVIEW_CTRL_V_IMAGE_UPLOAD_20260629 (cũ 11194–11294).
 * Mọi lớp editor cũ trong appCore đã bị xóa ở commit trước (chúng chết vì apply() ở mốc
 * 900ms — xem SPLIT_PLAN mục 3).
 *
 * Chỉ đổi những chỗ BUỘC phải đổi vì sang file khác:
 *
 * - `clone` -> import từ ./format.js; `LHState` / `lhWarn` -> import như các file khác.
 * - `notify` / `rebuild` / `restoreEditor` / `renderCard` / `renderQuiz` / `renderStudy`
 *   -> gọi qua `window.*`. Ba hàm render bị xếp lớp nhiều lần trong appCore nên PHẢI lấy
 *   bản đang chạy lúc gọi; `rebuild` cũng có bản window thắng (PATCH_NO_LOCAL_QUESTIONS).
 * - Nhánh lưu dự phòng (không có kết nối duyệt) trước đây ghi thẳng vào map `edits` của
 *   appCore. Nay gọi `window.__LHSaveLocalEdit(num, patch)`: `edits` bị GÁN LẠI lúc chạy
 *   (nhập file sửa / xóa hết) nên giữ tham chiếu qua file khác là ghi vào object đã bị thay.
 * - `apply()` bỏ hai dòng gán vào binding module của appCore (`openEditor = …`,
 *   `saveEditor = …`) — module ES không cho. appCore giữ hai hàm CHUYỂN TIẾP cùng tên
 *   (~dòng 620 và 680) để 5 chỗ gọi `openEditor()` theo tên vẫn tới được bản này.
 *
 * Vì sao là `installEditor()` / `installEditorPasteUpload()` chứ không phải IIFE chạy lúc
 * import: `import` bị đưa lên đầu file, để IIFE thì hai block chạy trước gần hết thân
 * appCore — khác thứ tự cũ. appCore gọi hai hàm này ĐÚNG chỗ hai block vốn đứng.
 */
import { LHState } from './state.js';
import { lhWarn } from '../core/log.js';
import { clone } from './format.js';

// ===== LIBRARY_FILTER_AND_EDIT_PREVIEW_LAYOUT_20260627 =====
export function installEditor() {
  const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  function $(id) {
    return document.getElementById(id);
  }
  function esc(s) {
    return String(s ?? '').replace(
      /[&<>"']/g,
      c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );
  }
  function ans(q) {
    return String(q?.answer || '')
      .toUpperCase()
      .replace(/[^A-Z]/g, '');
  }
  function src(im) {
    return typeof im === 'string' ? im : im?.src || im?.url || '';
  }
  function risk(q) {
    return q?.error_risk || (ans(q).length > 1 ? 'medium' : 'low');
  }
  function nextKey(opts) {
    const used = new Set(Object.keys(opts || {}).map(k => String(k).toUpperCase()));
    return LETTERS.find(k => !used.has(k));
  }
  /*
    Bản render thư viện + handler [data-library-filter] của block này ĐÃ XÓA (20260727):
    LIBRARY_UX_STEP1_STABLE_RENDER ghi đè `renderStudy` trong setTimeout nên chúng
    không bao giờ chạy. Phần còn lại của block (form sửa câu hỏi / edit preview) vẫn sống.
  */
  function editImgs(q) {
    const imgs = q.images || [];
    return `<div class="v7Images"><div class="v7ImagesHead"><span>Ảnh của câu hỏi</span><button class="v7UploadBtn" type="button" data-edit-pick-img>+ Thêm ảnh</button><input id="editPreviewImgInput" class="v7HiddenInput" type="file" accept="image/*" multiple></div><div class="v7Thumbs">${imgs.length ? imgs.map((im, i) => `<div class="v7Thumb"><button class="v7RemoveImg" type="button" data-edit-rm-img="${i}">×</button><img src="${esc(src(im))}" alt="Ảnh ${i + 1}" loading="lazy" decoding="async"></div>`).join('') : '<div class="v7NoImage">Chưa có ảnh.</div>'}</div></div>`;
  }
  function optRows(opts) {
    return Object.keys(opts || {})
      .sort()
      .map(
        k =>
          `<div class="v7OptRow"><div class="v7Key">${esc(k)}</div><input value="${esc(opts[k] || '')}" data-edit-opt="${esc(k)}"><button class="v7DelOpt" type="button" data-edit-del-opt="${esc(k)}">×</button></div>`,
      )
      .join('');
  }
  function redrawImg() {
    const h = $('editPreviewImageHost');
    if (h && window.editDraft) h.innerHTML = editImgs(window.editDraft);
  }
  function redrawOpt() {
    const h = $('editPreviewOptions');
    if (h && window.editDraft) h.innerHTML = optRows(window.editDraft.options || {});
  }
  function openEditPreview() {
    const c =
      (typeof LHState.pool !== 'undefined' && LHState.pool[LHState.ci]) ||
      (typeof LHState.RAW !== 'undefined' && LHState.RAW[0]);
    if (!c) return;
    window.editDraft = clone(c);
    if (typeof LHState.editDraft !== 'undefined') LHState.editDraft = window.editDraft;
    const role = String(window.HODSupabase?.getProfile?.()?.role || '')
      .trim()
      .toLowerCase();
    const canDirect = ['admin', 'editor'].includes(role);
    const reporting = !!window.HODSupabase?.getUser?.() && !canDirect;
    const modal = $('editModal'),
      box = modal?.querySelector('.box');
    if (!modal || !box) return;
    box.classList.add('editPreviewBox', 'quizEditLayoutV2');
    box.innerHTML = `<button class="modalX" type="button" data-edit-preview-close>×</button><div class="v7Head editPreviewHead"><div><span class="v7Label">SỬA CÂU HỎI</span><h2>${esc((reporting ? 'Báo cáo / đề xuất sửa câu ' : 'Sửa câu ') + (c.num || ''))}</h2><p class="v7Hint">Sửa nhanh nội dung quiz, đáp án và ảnh.</p></div><div class="v7TopActions"><button class="btn ${reporting ? 'hidden' : ''}" type="button" data-edit-preview-restore>Khôi phục</button><button class="primary v7SaveTop" type="button" data-edit-preview-save>${canDirect ? 'Lưu trực tiếp' : reporting ? 'Gửi báo cáo' : 'Lưu sửa'}</button></div></div><article class="v7Card editPreviewCard"><div class="editPreviewTwoColumns"><div class="editPreviewLeftCol"><div class="v7Field"><label>Câu hỏi</label><textarea data-edit-question>${esc(c.question || '')}</textarea></div><div class="v7Field"><label>Đáp án đúng</label><input data-edit-answer value="${esc(ans(c))}" placeholder="VD: A hoặc AC"></div><div id="editPreviewImageHost">${editImgs(c)}</div></div><div class="editPreviewRightCol"><div class="v7Field"><label>Các đáp án</label><div id="editPreviewOptions" class="v7Options">${optRows(c.options || {})}</div></div><div class="v7Bottom"><button class="btn" type="button" data-edit-add-opt>+ Thêm đáp án</button></div></div></div></article>`;
    modal.classList.remove('hidden');
  }
  async function saveEditPreview() {
    if (!window.editDraft) return;
    const oldQ = clone(
      (typeof LHState.RAW !== 'undefined' && LHState.RAW.find(c => c.num === window.editDraft.num)) || window.editDraft,
    );
    const modal = $('editModal');
    const q = (modal?.querySelector('[data-edit-question]')?.value || '').trim();
    const a = (modal?.querySelector('[data-edit-answer]')?.value || '')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z]/g, '');
    if (!q) return alert('Câu hỏi không được để trống.');
    if (!a) return alert('Đáp án đúng không được để trống.');
    const opts = {};
    modal?.querySelectorAll('[data-edit-opt]').forEach(inp => {
      const k = String(inp.dataset.editOpt || '').toUpperCase(),
        v = (inp.value || '').trim();
      if (k && v) opts[k] = v;
    });
    if (!Object.keys(opts).length) return alert('Cần ít nhất 1 đáp án.');
    for (const k of a.split('')) if (!opts[k]) return alert('Đáp án đúng ' + k + ' chưa có nội dung.');
    Object.assign(window.editDraft, {
      question: q,
      answer: a,
      options: opts,
      answer_text: a
        .split('')
        .map(k => k + '. ' + (opts[k] || ''))
        .join('; '),
      subject_code: localStorage.getItem('learninghub_subject_code_merged_v1') || window.editDraft.subject_code || '',
    });
    if (window.HODSupabase && window.HODSupabase.isReady()) {
      const role = String(window.HODSupabase?.getProfile?.()?.role || '')
        .trim()
        .toLowerCase();
      const canDirect = ['admin', 'editor'].includes(role);
      if (canDirect) {
        const id = oldQ?.id || window.editDraft?.id;
        if (!id) {
          alert('Không tìm thấy ID câu hỏi. Hãy tải lại trang rồi thử lại.');
          return;
        }
        const u = window.HODSupabase?.getUser?.();
        if (!u?.id) {
          alert('Chưa đăng nhập. Hãy đăng nhập lại.');
          return;
        }
        const list = window.editDraft.images || [];
        const localHasImg = oldQ?.__imagesLoaded ? list.length > 0 : !!(list.length || oldQ?.has_image);
        const text = window.editDraft.question + ' ' + Object.values(window.editDraft.options || {}).join(' ');
        const needsImg = /(hình vẽ|hình bên|đồ thị|bảng biến thiên|sơ đồ)/gi.test(text);
        const hasPlaceholder = list.some(im => {
          const src = typeof im === 'string' ? im : im.src || im.url || im.secure_url || '';
          return !src || src.includes('URL_') || src.includes('MÔ_TẢ') || src.includes('PLACEHOLDER');
        });
        let risk = '';
        let reason = '';
        if ((localHasImg && hasPlaceholder) || (needsImg && list.length === 0)) {
          risk = 'high';
          reason = 'Cần hình vẽ/ảnh minh họa nhưng chưa có ảnh thực tế';
        } else if (window.editDraft.answer.length > 1) {
          risk = 'medium';
          reason = 'Câu chọn nhiều đáp án đúng, cần rà soát kỹ';
        } else {
          risk = 'low';
        }
        const newData = {
          question: window.editDraft.question,
          options: window.editDraft.options || {},
          answer: window.editDraft.answer,
          answer_text: window.editDraft.answer_text,
          images: list,
          has_image: localHasImg || needsImg,
          error_risk: risk,
          error_risk_reason: reason || null,
        };
        const oldData = {
          question: oldQ.question,
          options: oldQ.options || {},
          answer: oldQ.answer,
          answer_text: oldQ.answer_text,
          images: oldQ.images || [],
        };
        window.notify?.('Đang lưu...');
        try {
          const res = await fetch('/api/admin-action', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              user_id: u.id,
              action: 'save_question_direct',
              payload: { question_id: id, new_data: newData, old_data: oldData },
            }),
          });
          const resJson = await res.json().catch(() => ({}));
          if (!res.ok || resJson.error) {
            alert('Lưu trực tiếp thất bại: ' + (resJson.error || res.status));
            return;
          }
        } catch (fetchErr) {
          alert('Lỗi kết nối khi lưu: ' + fetchErr.message);
          return;
        }
        if (typeof window.clearLearningHubQuestionCache === 'function') {
          window.clearLearningHubQuestionCache();
        }
        $('editModal')?.classList.add('hidden');
        window.notify?.('Đã lưu trực tiếp ✓');
        if (typeof window.loadCurrentSubjectOnly === 'function') await window.loadCurrentSubjectOnly(true);
        else if (window.HODSupabase?.loadQuestionsFromSupabase)
          await window.HODSupabase.loadQuestionsFromSupabase(true);
        return;
      }
      await window.HODSupabase.submitEditRequest(window.editDraft, oldQ);
      return;
    }
    if (window.HODSupabase?.getUser?.()) {
      alert('Chưa kết nối được dữ liệu duyệt. Hãy tải lại trang rồi gửi lại báo cáo.');
      return;
    }
    // Trước khi tách: ghi thẳng vào map `edits` của appCore rồi tự setItem. Nay gọi hàm
    // appCore phơi ra, vì `edits` bị gán lại lúc chạy (xem chú thích ở saveLocalEdit).
    window.__LHSaveLocalEdit(window.editDraft.num, {
      question: window.editDraft.question,
      options: window.editDraft.options,
      answer: window.editDraft.answer,
      answer_text: window.editDraft.answer_text,
      images: window.editDraft.images || [],
    });
    window.rebuild?.();
    LHState.ci = LHState.pool.findIndex(c => c.num === window.editDraft.num);
    if (LHState.ci < 0) LHState.ci = 0;
    LHState.flipped = false;
    window.renderCard?.();
    window.renderQuiz?.();
    window.renderStudy?.();
    $('editModal')?.classList.add('hidden');
    window.notify?.('Đã lưu sửa local');
  }
  /*
    ĐÂY LÀ BẢN ĐANG CHẠY của cả nhóm sửa câu hỏi (xác minh 20260727).

    Trước khi tách file, apply() còn gán vào binding module của appCore
    (`openEditor = openEditPreview`) cho 5 chỗ trong appCore gọi `openEditor()` theo tên
    (nút "!" trên Flashcard, #stEdit, phím `e`, openStudyReport). Từ file khác thì module ES
    không cho gán, nên appCore giữ hai hàm CHUYỂN TIẾP cùng tên đọc `window.openEditor` /
    `window.saveEditor` lúc gọi — đừng xóa chúng, xóa là editor không mở được từ Flashcard.

    apply() vẫn được gọi ba lần (ngay, 0ms, 900ms) và gán VÔ ĐIỀU KIỆN. Giữ nguyên: các lớp
    editor cũ trong appCore đã xóa hết, nhưng lịch gọi này là thứ tự đã kiểm, không đổi.
    Muốn sửa editor thì sửa openEditPreview / saveEditPreview ngay trong file này.
  */
  function apply() {
    window.openEditor = openEditPreview;
    window.saveEditor = saveEditPreview;
  }
  apply();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(apply, 0));
  else setTimeout(apply, 0);
  setTimeout(apply, 900);
  window.goStudyFromLib = function (idx) {
    if (typeof LHState.pool !== 'undefined' && Array.isArray(LHState.pool) && LHState.pool.length > 0) {
      if (typeof idx === 'number' && idx >= 0 && idx < LHState.pool.length) LHState.ci = idx;
    }
    window.renderCard?.();
    document.querySelector('[data-tab="fc"]')?.click();
  };
  document.addEventListener('click', e => {
    if (e.target.closest('[data-edit-preview-close]')) return $('editModal')?.classList.add('hidden');
    if (e.target.closest('[data-edit-preview-save]')) return saveEditPreview();
    if (e.target.closest('[data-edit-preview-restore]')) return window.__LHRestoreEditor?.();
    if (e.target.closest('[data-edit-pick-img]')) return $('editPreviewImgInput')?.click();
    const rm = e.target.closest('[data-edit-rm-img]');
    if (rm && window.editDraft) {
      window.editDraft.images = window.editDraft.images || [];
      window.editDraft.images.splice(+rm.dataset.editRmImg, 1);
      redrawImg();
      return;
    }
    if (e.target.closest('[data-edit-add-opt]') && window.editDraft) {
      window.editDraft.options = window.editDraft.options || {};
      const k = nextKey(window.editDraft.options);
      if (!k) return alert('Đã đủ số đáp án.');
      window.editDraft.options[k] = '';
      redrawOpt();
      setTimeout(() => document.querySelector(`[data-edit-opt="${k}"]`)?.focus(), 0);
      return;
    }
    const del = e.target.closest('[data-edit-del-opt]');
    if (del && window.editDraft) {
      delete window.editDraft.options[String(del.dataset.editDelOpt || '').toUpperCase()];
      redrawOpt();
    }
  });
  document.addEventListener('change', async e => {
    if (e.target?.id === 'editPreviewImgInput' && window.editDraft) {
      const inp = e.target;
      const files = Array.from(inp.files || []);
      if (!files.length) return;
      inp.disabled = true;
      window.notify?.('Đang upload ảnh...');
      try {
        window.editDraft.images = window.editDraft.images || [];
        if (window.__LHCleanImages) window.editDraft.images = window.__LHCleanImages(window.editDraft.images);
        for (const file of files) {
          if (window.__LHUploadCloudinary) {
            const uploaded = await window.__LHUploadCloudinary(file);
            if (uploaded) window.editDraft.images.push(uploaded);
          } else {
            const fr = new FileReader();
            const p = new Promise(resolve => {
              fr.onload = () => {
                window.editDraft.images.push({
                  id: 'edit_' + Date.now(),
                  src: fr.result,
                  source: 'user-upload',
                  name: file.name,
                });
                resolve();
              };
              fr.readAsDataURL(file);
            });
            await p;
          }
        }
        redrawImg();
        window.notify?.('Đã upload ảnh thành URL');
      } catch (err) {
        alert(err.message || err);
      } finally {
        inp.disabled = false;
        inp.value = '';
      }
    }
  });
  setTimeout(() => {
    try {
      if ($('studyList')) window.renderStudy?.();
    } catch (e) {
      lhWarn('LIBRARY_FILTER_AND_EDIT_PREVIEW_LAYOUT_20260627', e);
    }
  }, 350);
}
// ===== LIBRARY_FILTER_AND_EDIT_PREVIEW_LAYOUT_20260627 END =====

// ===== EDIT_PREVIEW_CTRL_V_IMAGE_UPLOAD_20260629 =====
// Đúng UI trong form "Sửa câu hỏi": vùng "Ảnh của câu hỏi" / nút "+ Thêm ảnh" dùng input #editPreviewImgInput.
// Ctrl+V hoặc kéo thả ảnh sẽ đưa file vào input này, để handler upload Cloudinary có sẵn xử lý và redraw đúng khung ảnh.
export function installEditorPasteUpload() {
  function $(id) {
    return document.getElementById(id);
  }
  function msg(t) {
    if (typeof window.notify === 'function') window.notify(t);
    else console.log(t);
  }
  function imageFilesFromClipboard(e) {
    return [...(e.clipboardData?.items || [])]
      .filter(item => item.kind === 'file' && String(item.type || '').startsWith('image/'))
      .map(item => item.getAsFile())
      .filter(Boolean);
  }
  function imageFilesFromDrop(e) {
    return [...(e.dataTransfer?.files || [])].filter(file => String(file.type || '').startsWith('image/'));
  }
  function setInputFilesAndUpload(files, source) {
    files = [...(files || [])].filter(file => file && String(file.type || '').startsWith('image/'));
    if (!files.length) return false;
    const input = $('editPreviewImgInput') || $('imgUpload');
    if (!input) {
      alert('Chưa thấy ô thêm ảnh. Đóng/mở lại form sửa rồi thử lại.');
      return true;
    }
    try {
      const dt = new DataTransfer();
      files.forEach(file => dt.items.add(file));
      input.files = dt.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      msg(source === 'paste' ? 'Đang upload ảnh vừa dán...' : 'Đang upload ảnh...');
    } catch (err) {
      alert('Trình duyệt không hỗ trợ dán ảnh kiểu này. Hãy bấm + Thêm ảnh để chọn file.');
    }
    return true;
  }
  function ensureEditPasteHint() {
    const modal = $('editModal');
    if (!modal || modal.classList.contains('hidden')) return;
    const imagesBox = modal.querySelector('.v7Images');
    if (!imagesBox || imagesBox.querySelector('.editPasteImageHint')) return;
    const head = imagesBox.querySelector('.v7ImagesHead') || imagesBox.firstElementChild;
    const hint = document.createElement('div');
    hint.className = 'pasteImageHint editPasteImageHint';
    hint.textContent = 'Có thể chụp/copy ảnh rồi bấm Ctrl + V tại khung này để tự upload URL.';
    if (head) head.insertAdjacentElement('afterend', hint);
    else imagesBox.prepend(hint);
  }
  function bindEditPreviewPasteUpload() {
    const modal = $('editModal');
    if (!modal) return;
    ensureEditPasteHint();
    if (modal.__editPreviewPasteUploadBound) return;
    modal.__editPreviewPasteUploadBound = true;
    modal.addEventListener(
      'paste',
      e => {
        const files = imageFilesFromClipboard(e);
        if (!files.length) return;
        e.preventDefault();
        setInputFilesAndUpload(files, 'paste');
      },
      true,
    );
    modal.addEventListener(
      'dragover',
      e => {
        const hasFile = [...(e.dataTransfer?.items || [])].some(item => item.kind === 'file');
        if (!hasFile) return;
        e.preventDefault();
        modal.classList.add('dragImageOver');
        ensureEditPasteHint();
      },
      true,
    );
    modal.addEventListener('dragleave', () => modal.classList.remove('dragImageOver'), true);
    modal.addEventListener(
      'drop',
      e => {
        const files = imageFilesFromDrop(e);
        if (!files.length) return;
        e.preventDefault();
        modal.classList.remove('dragImageOver');
        setInputFilesAndUpload(files, 'drop');
      },
      true,
    );
  }
  function boot() {
    bindEditPreviewPasteUpload();
    ensureEditPasteHint();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  setTimeout(boot, 300);
  setInterval(boot, 700);
}
// ===== END EDIT_PREVIEW_CTRL_V_IMAGE_UPLOAD_20260629 =====
