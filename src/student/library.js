/**
 * THƯ VIỆN câu hỏi (tab "Thư viện") — bước 4 của docs/SPLIT_PLAN.md, tách ngày 20260727.
 *
 * `installLibrary` là block LIBRARY_UX_STEP1_STABLE_RENDER_20260627: `renderUnified` —
 * bản ĐANG CHẠY của `renderStudy` (danh sách câu, lọc theo rủi ro/ảnh/bookmark, tìm kiếm,
 * mở/thu gọn từng câu, nút Học / Lưu / Báo cáo). Sửa thư viện thì sửa ở đây.
 * `installLibraryLabelFix` là block nhỏ đổi nhãn tab thành "Thư viện" + placeholder ô tìm.
 *
 * Đổi so với bản trong appCore:
 * - `LHState` / `lhWarn` -> import.
 * - `renderStudy` / `renderCard` -> gọi qua `window.*`; `apply()` bỏ dòng gán vào binding
 *   module của appCore, chỉ còn `window.renderStudy = renderUnified`. appCore giữ
 *   `renderStudy` làm hàm CHUYỂN TIẾP (~dòng 613) và ĐÃ XÓA hai lớp gán trần cũ
 *   (FINAL_APP_REPORT_BUTTON_NO_TOGGLE, FINAL_SMART_SEARCH) — nếu còn, chúng gán đồng bộ
 *   sau hàm chuyển tiếp và bản của library.js sẽ không bao giờ tới được 11 chỗ gọi theo tên.
 *
 * Vẫn dùng `install*()` gọi đúng chỗ block cũ đứng, không IIFE — xem lý do trong ./exam.js.
 */
import { LHState } from './state.js';
import { lhWarn } from '../core/log.js';

// ===== LIBRARY_LABEL_AND_UI_FIX_20260627 =====
export function installLibraryLabelFix() {
  function fixLibraryText() {
    document.querySelectorAll('.tab,[data-tab="study"],button,a,span,div,h1,h2,h3,p').forEach(el => {
      if (!el || el.children.length) return;
      const t = (el.textContent || '').trim();
      if (t === 'Thư viện' || t === 'Thư viện' || t === 'All' || (el.dataset && el.dataset.tab === 'study')) {
        el.textContent = 'Thư viện';
      }
    });
    document.querySelectorAll('[data-tab="study"]').forEach(el => {
      el.textContent = 'Thư viện';
    });
    const search = document.getElementById('search') || document.getElementById('studySearch');
    if (search) search.placeholder = 'Tìm trong thư viện: #12, đáp án, từ khóa...';
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fixLibraryText);
  else fixLibraryText();
  setTimeout(fixLibraryText, 100);
  setTimeout(fixLibraryText, 600);
  setInterval(fixLibraryText, 1200);
}
// ===== LIBRARY_LABEL_AND_UI_FIX_20260627 END =====

// ===== LIBRARY_UX_STEP1_STABLE_RENDER_20260627 =====
export function installLibrary() {
  const FILTER_STORE = 'learninghub_library_filter_v1';
  const VIEW_STORE = 'learninghub_library_view_v1';
  const OPEN_STORE = 'learninghub_library_open_nums_v1';
  const SEARCH_STORE = 'learninghub_library_search_v1';
  const $ = id => document.getElementById(id);
  const esc = s =>
    String(s ?? '').replace(
      /[&<>"']/g,
      c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );
  const norm = s =>
    String(s ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9#:\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  const ans = q =>
    String(q?.answer || '')
      .toUpperCase()
      .replace(/[^A-Z]/g, '');
  const imgSrc = im => (typeof im === 'string' ? im : im?.src || im?.url || '');
  const optimizeImageUrl = src => {
    if (!src) return '';
    if (src.includes('res.cloudinary.com/') && src.includes('/image/upload/')) {
      if (!src.includes('q_auto') && !src.includes('f_auto')) {
        return src.replace('/image/upload/', '/image/upload/c_limit,w_600,q_auto,f_auto/');
      }
    }
    return src;
  };
  const hasImg = q => {
    const list = q?.images || [];
    const localHasImg = !!(list.map(imgSrc).filter(Boolean).length || q?.has_image);
    if (localHasImg) return true;
    const text = (q?.question || '') + ' ' + Object.values(q?.options || {}).join(' ');
    return /(hình vẽ|hình bên|đồ thị|bảng biến thiên|sơ đồ)/gi.test(text);
  };
  const risk = q => {
    if (q?.error_risk) return q.error_risk;
    const list = (q?.images || []).map(imgSrc).filter(Boolean);
    const localHasImg = !!(list.length || q?.has_image);
    const text = (q?.question || '') + ' ' + Object.values(q?.options || {}).join(' ');
    const needsImg = /(hình vẽ|hình bên|đồ thị|bảng biến thiên|sơ đồ)/gi.test(text);
    const hasPlaceholder = list.some(im => {
      const src = typeof im === 'string' ? im : im.src || im.url || '';
      return !src || src.includes('URL_') || src.includes('MÔ_TẢ') || src.includes('PLACEHOLDER');
    });
    if ((localHasImg && hasPlaceholder) || (needsImg && list.length === 0)) {
      return 'high';
    }
    if (ans(q).length > 1) return 'medium';
    return 'low';
  };
  const riskColor = r => ({ high: '#e74c3c', medium: '#f39c12', low: '#27ae60' })[r] || '#999';
  const filterVal = () => localStorage.getItem(FILTER_STORE) || 'all';
  const viewVal = () => localStorage.getItem(VIEW_STORE) || 'compact';
  let lastList = [];
  const libraryOpenNums = new Set();
  try {
    JSON.parse(localStorage.getItem(OPEN_STORE) || '[]').forEach(n => libraryOpenNums.add(String(n)));
  } catch (e) {
    lhWarn('LIBRARY_UX_STEP1_STABLE_RENDER_20260627', e);
  }
  function saveOpenState() {
    try {
      localStorage.setItem(OPEN_STORE, JSON.stringify([...libraryOpenNums]));
    } catch (e) {
      lhWarn('LIBRARY_UX_STEP1_STABLE_RENDER_20260627', e);
    }
  }
  function answerText(q) {
    const a = ans(q);
    return a
      ? a
          .split('')
          .map(k => k + '. ' + (q.options?.[k] || ''))
          .join(' | ')
      : 'Chưa có đáp án';
  }
  function allText(q) {
    return norm([q?.num, q?.question, q?.answer, q?.answer_text, Object.values(q?.options || {}).join(' ')].join(' '));
  }
  function parseQuery(raw) {
    const q = String(raw || '').trim(),
      n = norm(q);
    const p = { raw: q, n, num: null, answer: null, multi: false, tokens: [] };
    if (/^\d+$/.test(n)) p.num = Number(n);
    let m = n.match(/(?:^|\s)#\s*(\d+)(?:\s|$)|(?:^|\s)cau\s*(\d+)(?:\s|$)/);
    if (m) p.num = Number(m[1] || m[2]);
    m = n.match(/(?:answer|ans|dap\s*an|dapan)\s*:\s*([a-e]+)/i);
    if (m) p.answer = m[1].toUpperCase().split('').sort().join('');
    p.multi = /(^|\s)(multi|multiple|chon nhieu|nhieu dap an|nhieu lua chon)(\s|$)/.test(n);
    let tokens = n
      .split(/\s+/)
      .filter(
        t =>
          t.length >= 2 &&
          !/^(answer|ans|dap|an|dapan|multi|multiple|chon|nhieu|lua|cau)$/.test(t) &&
          !t.includes(':') &&
          !/^#?\d+$/.test(t),
      );
    const cleanN = n
      .replace(/(?:answer|ans|dap\s*an|dapan)\s*:\s*[a-e]+/gi, '')
      .replace(/(?:^|\s)#\s*\d+(?:\s|$)|(?:^|\s)cau\s*\d+(?:\s|$)/gi, '')
      .replace(/(?:^|\s)(multi|multiple|chon nhieu|nhieu dap an|nhieu lua chon)(\s|$)/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (cleanN.includes(' ') && cleanN.length >= 3) {
      tokens.unshift(cleanN);
    }
    p.tokens = tokens;
    return p;
  }
  function hlt(text) {
    const raw = $('search')?.value || $('studySearch')?.value || '';
    const p = parseQuery(raw);
    const tokens = [...new Set((p.tokens || []).filter(t => t.length >= 2))].sort((a, b) => b.length - a.length);
    const src = String(text ?? '');
    if (!tokens.length) return esc(src);
    let ns = '',
      map = [];
    for (let i = 0; i < src.length; i++) {
      let c = norm(src[i]);
      if (!c) continue;
      for (const ch of c) {
        ns += ch;
        map.push(i);
      }
    }
    let ranges = [];
    for (const t of tokens) {
      let pos = 0;
      while ((pos = ns.indexOf(t, pos)) > -1) {
        let a = map[pos],
          b = map[pos + t.length - 1] + 1;
        if (a != null && b != null && !ranges.some(r => !(b <= r[0] || a >= r[1]))) ranges.push([a, b]);
        pos += t.length;
      }
    }
    if (!ranges.length) return esc(src);
    ranges.sort((a, b) => a[0] - b[0]);
    let out = '',
      last = 0;
    for (const [a, b] of ranges) {
      out += esc(src.slice(last, a));
      out += `<mark class="searchMark tokenMark">${esc(src.slice(a, b))}</mark>`;
      last = b;
    }
    return out + esc(src.slice(last));
  }
  function searchList() {
    const raw = $('search')?.value || $('studySearch')?.value || '';
    const p = parseQuery(raw);
    let data = Array.isArray(LHState.RAW) ? LHState.RAW : [];
    if (!p.raw) return data;
    return data
      .map(q => {
        let score = 0;
        if (p.num !== null) {
          if (Number(q.num) !== p.num) return null;
          score += 2000;
        }
        const a = ans(q).split('').sort().join('');
        if (p.answer) {
          if (a !== p.answer) return null;
          score += 900;
        }
        if (p.multi) {
          if (ans(q).length <= 1) return null;
          score += 350;
        }
        const h = allText(q);
        for (const t of p.tokens) {
          if (!h.includes(t)) return null;
          score += 80;
        }
        return { q, score };
      })
      .filter(Boolean)
      .sort((x, y) => y.score - x.score || Number(x.q.num) - Number(y.q.num))
      .map(x => x.q);
  }
  function passFilter(q) {
    const f = filterVal();
    if (f === 'all') return true;
    if (f === 'has_image') return hasImg(q);
    if (f === 'starred') return typeof window.__isBookmarked === 'function' ? window.__isBookmarked(q) : false;
    return risk(q) === f;
  }
  function stats(data) {
    return {
      total: data.length,
      img: data.filter(hasImg).length,
      high: data.filter(q => risk(q) === 'high').length,
      medium: data.filter(q => risk(q) === 'medium').length,
      low: data.filter(q => risk(q) === 'low').length,
    };
  }
  function ensureToolbar() {
    const list = $('studyList');
    if (!list) return;
    let tool = $('libraryStableToolbar');
    if (!tool) {
      tool = document.createElement('section');
      tool.id = 'libraryStableToolbar';
      tool.className = 'libraryStableToolbar';
      tool.innerHTML =
        '<div class="libStableHead libStableHeadCompact"><div class="libStableInfo"><b id="libStableFilterText">Tất cả</b><em id="libStableCount">0 câu</em></div></div><div id="libStableSearchSlot"></div><div id="libStableFilters"></div>';
      const searchBox = ($('search') || $('studySearch'))?.closest('.search');
      (searchBox?.parentNode || list.parentNode).insertBefore(tool, searchBox || list);
    }
    const searchBox = ($('search') || $('studySearch'))?.closest('.search');
    if (searchBox && $('libStableSearchSlot') && searchBox.parentNode !== $('libStableSearchSlot'))
      $('libStableSearchSlot').appendChild(searchBox);
    const input = $('search') || $('studySearch');
    if (input) {
      input.placeholder = 'Tìm câu hoặc #12...';
      if (!input.value) {
        try {
          input.value = localStorage.getItem(SEARCH_STORE) || '';
        } catch (e) {
          lhWarn('LIBRARY_UX_STEP1_STABLE_RENDER_20260627', e);
        }
      }
      if (!$('libStableClear')) {
        const b = document.createElement('button');
        b.id = 'libStableClear';
        b.type = 'button';
        b.textContent = '×';
        b.title = 'Xóa tìm kiếm';
        b.onclick = function () {
          input.value = '';
          try {
            localStorage.removeItem(SEARCH_STORE);
          } catch (e) {
            lhWarn('LIBRARY_UX_STEP1_STABLE_RENDER_20260627', e);
          }
          renderUnified();
          input.focus();
        };
        input.insertAdjacentElement('afterend', b);
      }
      input.oninput = function () {
        try {
          localStorage.setItem(SEARCH_STORE, input.value || '');
        } catch (e) {
          lhWarn('LIBRARY_UX_STEP1_STABLE_RENDER_20260627', e);
        }
        renderUnified();
      };
      $('libStableClear')?.classList.toggle('show', !!input.value.trim());
    }
  }
  function renderFilters(base, shown) {
    ensureToolbar();
    const box = $('libStableFilters');
    if (!box) return;
    const s = stats(base),
      f = filterVal(),
      v = viewVal();
    const starCnt = typeof window.__countBookmarks === 'function' ? window.__countBookmarks() : 0;
    const filters = [
      ['all', 'Tất cả', s.total],
      ['starred', '🔖 Đã lưu', starCnt],
      ['has_image', 'Có ảnh', s.img],
      ['high', 'Rủi ro cao', s.high],
      ['medium', 'Trung bình', s.medium],
      ['low', 'Thấp', s.low],
    ];
    const isAllOpen = v === 'full';

    box.innerHTML = `
      <div class="libStableFilterLine" style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;">
        <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
          ${filters.map(x => `<button type="button" class="${f === x[0] ? 'active' : ''}" data-stable-filter="${x[0]}">${x[1]} <small>${x[2]}</small></button>`).join('')}
        </div>
        <div style="display:flex;gap:6px;align-items:center;">
          <button type="button" class="v7FilterBtn ${isAllOpen ? 'active' : ''}" data-stable-toggle-all="${isAllOpen ? 'compact' : 'full'}" title="Mở hoặc thu gọn tất cả câu hỏi trong danh sách">
            ${isAllOpen ? '📑 Thu gọn tất cả' : '📂 Mở tất cả'}
          </button>
        </div>
      </div>
    `;
    const ft = $('libStableFilterText'),
      ct = $('libStableCount');
    if (ft) ft.textContent = 'Đang lọc: ' + (filters.find(x => x[0] === f)?.[1] || 'Tất cả');
    if (ct) ct.textContent = shown.length + ' / ' + base.length + ' câu';
  }
  function miniImg(q) {
    const imgs = (q.images || []).map(imgSrc).filter(Boolean);
    if (imgs.length) {
      return `<div class="libraryV2Img noAutoImg" title="Có ${imgs.length} ảnh"><img src="${esc(optimizeImageUrl(imgs[0]))}" alt="thumb" loading="lazy" decoding="async"></div>`;
    }
    return q.has_image
      ? `<div class="libraryV2Img noAutoImg" title="Có ảnh"><span>🖼</span></div>`
      : '<div class="libraryV2Img empty"></div>';
  }
  function options(q) {
    const a = ans(q);
    return Object.entries(q.options || {})
      .map(
        ([k, v]) =>
          `<div class="libraryOption ${a.includes(String(k).toUpperCase()) ? 'correct' : ''}"><b>${esc(k)}</b><span>${hlt(v)}</span></div>`,
      )
      .join('');
  }
  function images(q, open) {
    if (!open) return '';
    if (q.has_image && !q.__imagesLoaded && !q.__imagesLoading) {
      q.__imagesLoading = true;
      const supa = window.HODSupabase?.__client;
      if (supa && q.id) {
        supa
          .from('questions')
          .select('id,images,updated_at')
          .eq('id', q.id)
          .maybeSingle()
          .then(res => {
            q.__imagesLoading = false;
            q.__imagesLoaded = true;
            if (res.data) {
              /*
                GIỮ NGUYÊN, đừng "sửa gọn": `cleanImages` KHÔNG tồn tại ở tầng module —
                nó chỉ là hàm local của block FINAL_URL_ONLY_IMAGES trong appCore (kiểm
                bằng `npm run find cleanImages`: chỗ khai báo duy nhất nằm trong IIFE).
                Dòng dưới vì vậy ném ReferenceError, bị `.catch` ngay dưới nuốt — đường nạp
                ảnh chậm này CHƯA BAO GIỜ chạy xong, từ trước khi tách file.
                Sửa cho nó chạy là ĐỔI HÀNH VI (ảnh sẽ hiện thêm) -> commit riêng,
                xem docs/SPLIT_PLAN.md mục 4.
              */
              q.images = cleanImages(res.data.images);
              window.renderStudy?.();
            }
          })
          .catch(() => {
            q.__imagesLoading = false;
            q.__imagesLoaded = true;
          });
      }
    }
    const imgs = (q.images || []).map(imgSrc).filter(Boolean);
    if (!imgs.length) {
      return q.has_image
        ? `<div class="libraryV2Images"><div class="imgLoading" style="color:var(--mist);font-size:.8rem;padding:10px 0;">Đang tải ảnh từ database...</div></div>`
        : '';
    }
    return `<div class="libraryV2Images">${imgs.map((s, i) => `<img loading="lazy" decoding="async" src="${esc(optimizeImageUrl(s))}" alt="Ảnh ${i + 1}" class="zoomableImg">`).join('')}</div>`;
  }
  function card(q, i) {
    const a = ans(q) || '?',
      r = risk(q);
    const rawSearch = ($('search')?.value || $('studySearch')?.value || '').trim();
    const queryObj = parseQuery(rawSearch);
    let isMatchInDetails = false;
    if (queryObj.tokens && queryObj.tokens.length) {
      const detailsText = norm(Object.values(q.options || {}).join(' ') + ' ' + (q.answer_text || ''));
      isMatchInDetails = queryObj.tokens.every(t => detailsText.includes(t));
    }
    const open = viewVal() === 'full' || libraryOpenNums.has(String(q.num)) || isMatchInDetails || !!rawSearch;
    const bmBtnHTML = typeof window.__getBookmarkBtnHTML === 'function' ? window.__getBookmarkBtnHTML(q) : '';
    return `<article class="libraryV2Card libraryQuestionCard ${open ? 'open' : ''}" data-num="${esc(q.num || '')}" data-stable-index="${i}" style="--card-index:${Math.min(i, 15)}; border-left-color:${riskColor(r)}!important"><div class="libraryV2Row"><div class="libraryV2Num">Câu ${esc(q.num || i + 1)}</div><div class="libraryV2Main"><div class="libraryV2Question">${hlt(q.question || '')}</div><div class="libraryV2Answer"><b>Đáp án: ${esc(a)}</b><span>${hlt(answerText(q))}</span></div></div>${miniImg(q)}<div class="libraryV2Actions"><button type="button" class="libraryV2Study" data-stable-study="${i}" title="Học câu này">Học</button>${bmBtnHTML}<button type="button" class="libraryV2Report" data-stable-report="${i}" title="Báo cáo / sửa câu">!</button></div></div><div class="libraryV2Details"><div class="libraryOptions">${options(q)}</div>${images(q, open)}</div></article>`;
  }

  function showLibrarySkeleton() {
    const list = $('studyList');
    if (!list) return;
    delete list.dataset.renderedHash;
    list.innerHTML = `
      <div class="lhSkeletonContainer">
        <div class="lhSkeletonCard">
          <div class="lhSkeletonLine title short"></div>
          <div class="lhSkeletonLine full"></div>
          <div class="lhSkeletonLine medium"></div>
        </div>
        <div class="lhSkeletonCard">
          <div class="lhSkeletonLine title short"></div>
          <div class="lhSkeletonLine full"></div>
          <div class="lhSkeletonLine medium"></div>
        </div>
        <div class="lhSkeletonCard">
          <div class="lhSkeletonLine title short"></div>
          <div class="lhSkeletonLine full"></div>
          <div class="lhSkeletonLine medium"></div>
        </div>
        <div class="lhSkeletonCard">
          <div class="lhSkeletonLine title short"></div>
          <div class="lhSkeletonLine full"></div>
          <div class="lhSkeletonLine medium"></div>
        </div>
      </div>`;
  }
  window.showLibrarySkeleton = showLibrarySkeleton;

  // Thẻ thư viện KHÔNG có nút xóa: chức năng xóa câu ở app học sinh đã bỏ (20260727).
  // Xóa câu làm ở trang admin. Xem ghi chú "ĐÃ XÓA" tại chỗ 2 block delete cũ.
  function renderUnified() {
    // RESTORE_LIBRARY_NORMALIZE_20260727: chuẩn hóa has_image/error_risk trước khi lọc & đếm,
    // nếu không thì câu mới import thiếu thuộc tính -> bộ lọc "Có ảnh"/"Rủi ro" đếm sai.
    if (typeof window.__LHNormalizeAll === 'function') window.__LHNormalizeAll();
    ensureToolbar();
    const base = searchList();
    lastList = base.filter(passFilter);
    renderFilters(base, lastList);
    const list = $('studyList');
    if (!list) return;

    const newHtml = lastList.length
      ? lastList.map(card).join('')
      : '<div class="libraryStableEmpty"><b>Không có câu phù hợp.</b><button type="button" data-stable-clear-all>Xóa tìm kiếm & bộ lọc</button></div>';

    if (list.dataset.renderedHash === newHtml) {
      if ($('libStableClear'))
        $('libStableClear').classList.toggle('show', !!(($('search') || $('studySearch'))?.value || '').trim());
      return;
    }
    list.dataset.renderedHash = newHtml;
    list.innerHTML = newHtml;

    if ($('libStableClear'))
      $('libStableClear').classList.toggle('show', !!(($('search') || $('studySearch'))?.value || '').trim());
  }
  window.renderUnified = renderUnified;
  window.renderStudy = renderUnified;
  function setCurrent(q) {
    let idx = (LHState.pool || []).findIndex(x => Number(x.num) === Number(q.num));
    if (idx < 0) {
      LHState.pool = [...LHState.RAW];
      idx = LHState.pool.findIndex(x => Number(x.num) === Number(q.num));
    }
    if (idx >= 0) {
      LHState.ci = idx;
      LHState.flipped = false;
      LHState.flipDir = 'horizontal';
      try {
        window.renderCard?.();
      } catch (e) {
        lhWarn('LIBRARY_UX_STEP1_STABLE_RENDER_20260627', e);
      }
      return true;
    }
    return false;
  }

  function showImageLightbox(src) {
    let overlay = document.getElementById('lhImageLightbox');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'lhImageLightbox';
      overlay.style.cssText = `
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.85);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 99999;
        cursor: zoom-out;
        opacity: 0;
        transition: opacity 0.25s ease;
      `;
      overlay.innerHTML = `<img id="lhLightboxImg" src="" style="width:90vw;height:90vh;object-fit:contain;border-radius:8px;box-shadow:0 8px 32px rgba(0,0,0,0.5);transition:transform 0.25s ease;transform:scale(0.95);">`;
      overlay.onclick = () => {
        overlay.style.opacity = '0';
        overlay.querySelector('img').style.transform = 'scale(0.95)';
        setTimeout(() => overlay.classList.add('hidden'), 250);
      };
      document.body.appendChild(overlay);
    }
    overlay.classList.remove('hidden');
    overlay.querySelector('img').src = src;
    setTimeout(() => {
      overlay.style.opacity = '1';
      overlay.querySelector('img').style.transform = 'scale(1)';
    }, 10);
  }

  document.addEventListener(
    'click',
    function (e) {
      // 1. Phóng to bất kỳ ảnh nào khi bấm vào
      const zoomImg = e.target.closest(
        '.libraryV2Images img, #images img, .sitem img, .dqEditImg img, .libraryV2Img img',
      );
      if (zoomImg && zoomImg.src) {
        e.preventDefault();
        e.stopPropagation();
        showImageLightbox(zoomImg.src);
        return;
      }

      const toggleAll = e.target.closest('[data-stable-toggle-all]');
      if (toggleAll) {
        e.preventDefault();
        const targetView = toggleAll.dataset.stableToggleAll;
        localStorage.setItem(VIEW_STORE, targetView);
        if (targetView === 'compact') {
          libraryOpenNums.clear();
          saveOpenState();
        }
        renderUnified();
        return;
      }

      const f = e.target.closest('[data-stable-filter]');
      if (f) {
        e.preventDefault();
        localStorage.setItem(FILTER_STORE, f.dataset.stableFilter || 'all');
        renderUnified();
        return;
      }
      if (e.target.closest('[data-stable-clear-all]')) {
        e.preventDefault();
        const input = $('search') || $('studySearch');
        if (input) input.value = '';
        try {
          localStorage.removeItem(SEARCH_STORE);
        } catch (_e) {
          lhWarn('LIBRARY_UX_STEP1_STABLE_RENDER_20260627', _e);
        }
        localStorage.setItem(FILTER_STORE, 'all');
        renderUnified();
        return;
      }

      const h = e.target.closest('[data-stable-study]');
      if (h) {
        e.preventDefault();
        const q = lastList[+h.dataset.stableStudy];
        if (q && setCurrent(q)) document.querySelector('[data-tab="fc"]')?.click?.();
        return;
      }
      const r = e.target.closest('[data-stable-report]');
      if (r) {
        e.preventDefault();
        const q = lastList[+r.dataset.stableReport];
        if (q) {
          if (typeof window.openStudyReport === 'function') window.openStudyReport(q.num, e);
          else if (setCurrent(q)) openEditor?.();
        }
        return;
      }

      // 2. Nhấp vào hàng để co/giãn câu hỏi
      const cardRow = e.target.closest('.libraryV2Row');
      if (cardRow) {
        const card = cardRow.closest('.libraryV2Card');
        if (card) {
          e.preventDefault();
          card.classList.toggle('open');
          const num = card.dataset.num;
          if (num) {
            if (card.classList.contains('open')) libraryOpenNums.add(String(num));
            else libraryOpenNums.delete(String(num));
            saveOpenState();
          }
          const toggleBtn = card.querySelector('[data-stable-toggle]');
          if (toggleBtn) {
            toggleBtn.textContent = card.classList.contains('open') ? 'Thu gọn' : 'Mở';
          }
          return;
        }
      }
    },
    true,
  );
  function apply() {
    // Trước khi tách còn gán vào binding module của appCore (`renderStudy = renderUnified`),
    // nay chỉ còn window — appCore có hàm chuyển tiếp `renderStudy` đọc window lúc gọi.
    window.renderStudy = renderUnified;
    const s = $('search') || $('studySearch');
    if (s) {
      try {
        if (!s.value) s.value = localStorage.getItem(SEARCH_STORE) || '';
      } catch (e) {
        lhWarn('LIBRARY_UX_STEP1_STABLE_RENDER_20260627', e);
      }
      s.oninput = function () {
        try {
          localStorage.setItem(SEARCH_STORE, s.value || '');
        } catch (e) {
          lhWarn('LIBRARY_UX_STEP1_STABLE_RENDER_20260627', e);
        }
        renderUnified();
      };
    }
    renderUnified();
  }
  window.__renderStudyUnified = renderUnified;
  /*
    FIX_LIBRARY_STALE_AFTER_SUBJECT_CHANGE_20260727
    Đổi môn thì tìm kiếm + danh sách câu đang mở của môn cũ không còn đúng nữa
    (OPEN_STORE lưu theo số câu, môn mới cũng có số câu trùng). Dọn rồi vẽ lại ngay
    bằng RAW hiện có; khi loadSubjectLight xong nó sẽ gọi renderStudy lần nữa.
  */
  window.addEventListener('lh:subject-changed', () => {
    const s = $('search') || $('studySearch');
    if (s) s.value = '';
    try {
      localStorage.removeItem(SEARCH_STORE);
    } catch (e) {
      lhWarn('LIBRARY_UX_STEP1_STABLE_RENDER_20260627', e);
    }
    libraryOpenNums.clear();
    saveOpenState();
    try {
      renderUnified();
    } catch (e) {
      lhWarn('LIBRARY_UX_STEP1_STABLE_RENDER_20260627', e);
    }
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(apply, 0));
  else setTimeout(apply, 0);
  setTimeout(apply, 700);
}
// ===== LIBRARY_UX_STEP1_STABLE_RENDER_20260627 END =====
