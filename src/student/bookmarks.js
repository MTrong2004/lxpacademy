/**
 * Lưu câu hỏi (🔖) + chuông thông báo yêu cầu sửa — tách khỏi appCore ngày 20260731.
 *
 * Hai block nguyên văn từ appCore: BOOKMARK_QUESTIONS_FEATURE_20260726 (cũ 4732–5044) và
 * HEADER_EDIT_REQUEST_BELL_20260726 (cũ 5046–5489). Đây là bản ĐANG CHẠY — bản cũ trong
 * appCore đã xóa, chỉ còn lời gọi installBookmarks() / installHeaderBell() đúng chỗ hai
 * block cũ đứng (thứ tự chạy phải giữ nguyên, xem docs/SPLIT_PLAN.md mục 2).
 *
 * Chỉ đổi những chỗ BUỘC phải đổi vì sang file khác — mọi chú thích gốc giữ nguyên:
 *
 * - `$` -> khai báo lại tại chỗ (appCore có `const $` riêng ở tầng module).
 * - `notify` / `renderUnified` -> `window.*` (bản thật ở appCore / library.js).
 * - `updateCardTools` -> `window.updateCardTools`. appCore phơi bản gốc ra window rồi giữ
 *   một hàm CHUYỂN TIẾP cùng tên (RENDER_CARD_WINDOW_BRIDGE_20260731). Đọc trần
 *   `typeof updateCardTools` ở đây trả false -> lớp bọc không được cài -> MẤT nút 🔖.
 * - `switchTab` -> `window.switchTab` (appCore gán thẳng ra window, không ai bọc).
 */
import { LHState } from './state.js';
import { lhWarn } from '../core/log.js';

const $ = id => document.getElementById(id);

// ===== BOOKMARK_QUESTIONS_FEATURE_20260726 =====
// Tính năng lưu câu hỏi (🔖 Bookmark Ribbon SVG): lưu câu hỏi yêu thích từ flashcard, xem lại ở Thư viện.
export function installBookmarks() {
  const BOOKMARK_PREFIX = 'lh_starred_v1_';

  const SVG_UNSAVED = `<svg class="bmIcon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>`;
  const SVG_SAVED = `<svg class="bmIcon" width="18" height="18" viewBox="0 0 24 24" fill="#f5c518" stroke="#f5c518" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>`;

  const SVG_LIB_UNSAVED = `<svg class="bmLibIcon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>`;
  const SVG_LIB_SAVED = `<svg class="bmLibIcon" width="14" height="14" viewBox="0 0 24 24" fill="#f5c518" stroke="#f5c518" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>`;

  function getSubjectCode() {
    if (
      typeof LHState.RAW !== 'undefined' &&
      Array.isArray(LHState.RAW) &&
      LHState.RAW[0] &&
      LHState.RAW[0].subject_code
    ) {
      return String(LHState.RAW[0].subject_code).trim();
    }
    return localStorage.getItem('learninghub_subject_code_merged_v1') || 'default_subject';
  }

  /*
    BOOKMARK_SYNC_PER_PART_20260806 — một khoá localStorage cho TẤT CẢ học phần.

    Bản cũ có hai khoá và chính cặp đó là lỗi: `lh_starred_v1_<MÃ>` (đúng, theo từng phần) và
    `lh_starred_v1_backup_all`. `saveBookmarks` ghi ĐÈ backup_all bằng danh sách của môn đang
    mở, còn `loadBookmarks` lại HỢP backup_all vào mọi môn — mà `getQKey` là `num_<số câu>` và
    mọi phần đều đánh số từ 1, nên lưu câu 5 ở MLN122 xong mở MLN122_2 là câu 5 ở đó cũng hiện
    "đã lưu". Đúng triệu chứng "lưu chung về tổng một môn".

    Nay: `lh_starred_v2` = { "MLN122": ["num_5"], "MLN122_2": [] } — mỗi mã môn (tức mỗi HỌC
    PHẦN) một ô riêng, không có ô dùng chung nào để lẫn sang nhau.
  */
  const STORE_KEY = 'lh_starred_v2';
  const MIGRATED_FLAG = 'lh_starred_v2_migrated';
  const PUSHED_FLAG = 'learninghub_bookmarks_pushed_v1';

  function readStore() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
      return raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
    } catch (e) {
      return {};
    }
  }

  function writeStore(map) {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(map || {}));
    } catch (e) {
      lhWarn('BOOKMARK_SYNC_PER_PART_20260806', e);
    }
  }

  /**
   * Gom `lh_starred_v1_<MÃ>` cũ vào khoá v2, một lần cho mỗi thiết bị.
   * KHÔNG đọc `lh_starred_v1_backup_all`: nó là bản trộn lẫn của mọi môn, nhặt vào là bê
   * nguyên cái lỗi cũ sang khoá mới. Các khoá theo mã môn mới là bản đúng (saveBookmarks
   * luôn ghi cả hai chỗ nên không mất gì).
   */
  function migrateLegacyStore() {
    if (localStorage.getItem(MIGRATED_FLAG) === '1') return;
    const map = readStore();
    const legacyKeys = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(BOOKMARK_PREFIX)) legacyKeys.push(k);
      }
      legacyKeys.forEach(k => {
        if (k === 'lh_starred_v1_backup_all') return;
        const code = k.slice(BOOKMARK_PREFIX.length).trim().toUpperCase();
        if (!code) return;
        const arr = JSON.parse(localStorage.getItem(k) || '[]');
        if (!Array.isArray(arr) || !arr.length) return;
        const merged = new Set([...(map[code] || []), ...arr.map(String)]);
        map[code] = [...merged];
      });
      writeStore(map);
      legacyKeys.forEach(k => localStorage.removeItem(k));
      localStorage.setItem(MIGRATED_FLAG, '1');
    } catch (e) {
      lhWarn('BOOKMARK_SYNC_PER_PART_20260806', e);
    }
  }
  migrateLegacyStore();

  // Định danh nhất quán cho từng câu hỏi (ưu tiên num, fallback id)
  function getQKey(q) {
    if (!q) return null;
    if (typeof q === 'string' || typeof q === 'number') return 'num_' + String(q);
    if (q.num !== undefined && q.num !== null && q.num !== '') return 'num_' + String(q.num);
    if (q.id !== undefined && q.id !== null && q.id !== '') return 'id_' + String(q.id);
    if (q.question) return 'q_' + String(q.question).trim().slice(0, 50);
    return null;
  }

  /** Bookmark của ĐÚNG học phần đang mở. Không hợp thêm ô nào khác. */
  function loadBookmarks() {
    const arr = readStore()[getSubjectCode().toUpperCase()];
    return new Set(Array.isArray(arr) ? arr.map(String) : []);
  }

  function saveBookmarks(set) {
    const map = readStore();
    map[getSubjectCode().toUpperCase()] = [...set].map(x => String(x));
    writeStore(map);
  }

  /*
    Đồng bộ máy tính ↔ điện thoại (`/api/bookmarks`). localStorage tụt xuống vai bản đệm:
    vẽ ngay lúc mở web, rồi bản của server đè lên khi tải xong.

    Lượt đầu trên mỗi thiết bị thì HỢP local với server rồi đẩy phần server chưa có lên
    (`merge`) — bookmark lưu từ trước khi có tính năng đồng bộ không được mất. Từ lượt sau
    server là bản thật và ĐÈ local, để "bỏ lưu" ở điện thoại lan được sang máy tính thay vì
    bị bản local cũ hồi sinh.
  */
  let syncing = false;

  async function syncBookmarks() {
    if (syncing) return false;
    syncing = true;
    try {
      const res = await fetch('/api/bookmarks', { cache: 'no-store' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const out = await res.json();
      const server = out?.data && typeof out.data === 'object' ? out.data : {};
      const firstRun = localStorage.getItem(PUSHED_FLAG) !== '1';

      if (!firstRun) {
        writeStore(server);
        return true;
      }

      const local = readStore();
      const merged = {};
      const onlyLocal = {};
      new Set([...Object.keys(local), ...Object.keys(server)]).forEach(code => {
        const s = new Set((server[code] || []).map(String));
        const l = (local[code] || []).map(String);
        const missing = l.filter(k => !s.has(k));
        if (missing.length) onlyLocal[code] = missing;
        merged[code] = [...new Set([...s, ...l])];
      });
      writeStore(merged);

      if (Object.keys(onlyLocal).length) {
        const push = await fetch('/api/bookmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
          body: JSON.stringify({ merge: onlyLocal }),
        });
        // Đẩy thất bại thì KHÔNG đặt cờ: lần mở web sau thử lại, tránh mất bookmark cũ.
        if (!push.ok) throw new Error('merge HTTP ' + push.status);
      }
      localStorage.setItem(PUSHED_FLAG, '1');
      return true;
    } catch (e) {
      // Mất mạng / 401 / server lỗi: giữ nguyên bản trên máy, vẫn xem lại được câu đã lưu.
      lhWarn('BOOKMARK_SYNC_PER_PART_20260806', e);
      return false;
    } finally {
      syncing = false;
    }
  }
  window.__lhSyncBookmarks = syncBookmarks;

  /** Ghi một thay đổi lên server. Lỗi thì chỉ cảnh báo — bản local đã đổi rồi. */
  function pushBookmark(key, on) {
    try {
      fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ subject_code: getSubjectCode().toUpperCase(), q_key: String(key), on: !!on }),
      })
        .then(res => {
          if (!res.ok) lhWarn('BOOKMARK_SYNC_PER_PART_20260806', new Error('HTTP ' + res.status));
        })
        .catch(e => lhWarn('BOOKMARK_SYNC_PER_PART_20260806', e));
    } catch (e) {
      lhWarn('BOOKMARK_SYNC_PER_PART_20260806', e);
    }
  }

  function isBookmarked(qOrKey) {
    if (!qOrKey) return false;
    const key = typeof qOrKey === 'object' ? getQKey(qOrKey) : String(qOrKey);
    if (!key) return false;
    return loadBookmarks().has(key);
  }

  function toggleBookmarkFn(qOrKey) {
    if (!qOrKey) return false;
    const key = typeof qOrKey === 'object' ? getQKey(qOrKey) : String(qOrKey);
    if (!key) return false;
    const s = loadBookmarks();
    let added;
    if (s.has(key)) {
      s.delete(key);
      added = false;
    } else {
      s.add(key);
      added = true;
    }
    saveBookmarks(s);
    pushBookmark(key, added);
    return added;
  }

  function countBookmarks() {
    return loadBookmarks().size;
  }

  // Gắn helpers ra window để Thư viện gọi trực tiếp trong template
  window.__isBookmarked = isBookmarked;
  window.__countBookmarks = countBookmarks;
  window.__getBookmarkBtnHTML = function (q) {
    const key = getQKey(q);
    if (!key) return '';
    const bookmarked = isBookmarked(key);
    const esc2 = s =>
      String(s ?? '').replace(
        /[&<>"']/g,
        c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
      );
    return `<button type="button" class="libBookmarkBtn${bookmarked ? ' bookmarked' : ''}" data-lib-bookmark="${esc2(key)}" title="${bookmarked ? 'Bỏ lưu câu này' : 'Lưu câu hỏi này'}">${bookmarked ? SVG_LIB_SAVED : SVG_LIB_UNSAVED}</button>`;
  };

  // ── CSS inject ────────────────────────────────────────────────────────────
  (function injectBookmarkCSS() {
    if (document.getElementById('__bookmarkQCSS')) return;
    const s = document.createElement('style');
    s.id = '__bookmarkQCSS';
    s.textContent = `
      #bookmarkBtn {
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px 6px;
        border-radius: 8px;
        color: rgba(232,212,168,.65);
        transition: color .18s, transform .15s, filter .18s;
        user-select: none;
        display: flex; align-items: center; justify-content: center;
      }
      #bookmarkBtn .bmIcon { transition: stroke .18s, fill .18s, transform .15s; }
      #bookmarkBtn.bookmarked {
        color: #f5c518;
        filter: drop-shadow(0 0 7px rgba(245,197,24,.65));
      }
      #bookmarkBtn:hover { transform: scale(1.18); color: #f5c518; }
      #bookmarkBtn:active { transform: scale(.9); }
      @keyframes bookmarkPop {
        0%   { transform: scale(1); }
        40%  { transform: scale(1.42); }
        70%  { transform: scale(.88); }
        100% { transform: scale(1); }
      }
      #bookmarkBtn.pop { animation: bookmarkPop .32s ease; }

      .libBookmarkBtn {
        background: rgba(255,255,255,.03);
        border: 1px solid rgba(200,169,110,.25);
        border-radius: 7px;
        cursor: pointer;
        font-size: .82rem;
        padding: 4px 9px;
        color: rgba(232,212,168,.75);
        display: inline-flex; align-items: center; gap: 4px;
        transition: color .15s, border-color .15s, background .15s, transform .12s;
        line-height: 1;
        white-space: nowrap;
      }
      .libBookmarkBtn.bookmarked {
        color: #f5c518;
        border-color: rgba(245,197,24,.55);
        background: rgba(245,197,24,.09);
      }
      .libBookmarkBtn:hover { transform: scale(1.06); color: #f5c518; border-color: rgba(245,197,24,.5); }

      .v7FilterBtn[data-library-filter="starred"] .bookmarkCount {
        font-size: .75em;
        opacity: .88;
        margin-left: 4px;
      }
    `;
    document.head.appendChild(s);
  })();

  // ── Flashcard: lấy chính xác câu hiện tại ─────────────────────────────────
  function getCurrentCard() {
    try {
      const arr =
        typeof LHState.pool !== 'undefined' && Array.isArray(LHState.pool) && LHState.pool.length
          ? LHState.pool
          : typeof LHState.RAW !== 'undefined'
            ? LHState.RAW
            : [];
      if (!arr.length) return null;
      const index = Math.max(0, Math.min(typeof LHState.ci === 'number' ? LHState.ci : 0, arr.length - 1));
      return arr[index] || null;
    } catch (e) {
      return null;
    }
  }

  function updateBookmarkBtn() {
    const btn = document.getElementById('bookmarkBtn');
    if (!btn) return;
    const card = getCurrentCard();
    if (!card) return;
    const key = getQKey(card);
    if (!key) return;
    const bookmarked = isBookmarked(key);
    btn.classList.toggle('bookmarked', bookmarked);
    btn.innerHTML = bookmarked ? SVG_SAVED : SVG_UNSAVED;
    btn.title = bookmarked ? 'Bỏ lưu câu này' : 'Lưu câu hỏi này';
  }
  window.updateBookmarkBtn = updateBookmarkBtn;

  function addBookmarkButtonToCard() {
    if (document.getElementById('bookmarkBtn')) {
      updateBookmarkBtn();
      return;
    }
    const cardTools = document.getElementById('cardTools');
    if (!cardTools) return;
    const btn = document.createElement('button');
    btn.id = 'bookmarkBtn';
    btn.type = 'button';
    btn.className = 'cardToolBtn';
    btn.innerHTML = SVG_UNSAVED;
    btn.title = 'Lưu câu hỏi này';
    btn.setAttribute('aria-label', 'Lưu câu hỏi yêu thích');
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      const card = getCurrentCard();
      if (!card) return;
      const key = getQKey(card);
      if (!key) return;
      const added = toggleBookmarkFn(key);
      btn.classList.toggle('bookmarked', added);
      btn.innerHTML = added ? SVG_SAVED : SVG_UNSAVED;
      btn.title = added ? 'Bỏ lưu câu này' : 'Lưu câu hỏi này';
      btn.classList.remove('pop');
      void btn.offsetWidth;
      btn.classList.add('pop');
      btn.addEventListener('animationend', () => btn.classList.remove('pop'), { once: true });
      const displayNum = card.num || (typeof LHState.ci === 'number' ? LHState.ci : 0) + 1;
      try {
        window.notify(added ? `🔖 Đã lưu câu ${displayNum}` : `Đã bỏ lưu câu ${displayNum}`);
      } catch (err) {
        lhWarn('BOOKMARK_QUESTIONS_FEATURE_20260726', err);
      }
      // Nếu thư viện đang hiển thị thì render lại thư viện
      if (typeof window.renderStudy === 'function') window.renderStudy();
    });
    cardTools.appendChild(btn);
    updateBookmarkBtn();
  }

  const _origUpdateCardTools = typeof window.updateCardTools === 'function' ? window.updateCardTools : null;
  window.updateCardTools = function () {
    if (_origUpdateCardTools) _origUpdateCardTools.apply(this, arguments);
    updateBookmarkBtn();
  };

  // ── Thư viện: Event listener cho nút Bookmark trên Card ───────────────────
  function bindLibraryClickEvents() {
    document.addEventListener(
      'click',
      function (e) {
        const btn = e.target.closest('[data-lib-bookmark]');
        if (!btn) return;
        e.stopPropagation();
        const key = btn.dataset.libBookmark;
        if (!key) return;
        const added = toggleBookmarkFn(key);
        btn.classList.toggle('bookmarked', added);
        btn.innerHTML = added ? SVG_LIB_SAVED : SVG_LIB_UNSAVED;
        btn.title = added ? 'Bỏ lưu' : 'Lưu câu này';
        btn.classList.remove('pop');
        void btn.offsetWidth;
        btn.classList.add('pop');
        btn.addEventListener('animationend', () => btn.classList.remove('pop'), { once: true });
        try {
          window.notify(added ? `🔖 Đã lưu câu hỏi` : `Đã bỏ lưu câu hỏi`);
        } catch (ex) {
          lhWarn('BOOKMARK_QUESTIONS_FEATURE_20260726', ex);
        }

        // Re-render thư viện để cập nhật danh sách và số đếm bộ lọc
        if (typeof window.renderStudy === 'function') window.renderStudy();
        updateBookmarkBtn();
      },
      false,
    );
  }

  /** Vẽ lại nút 🔖 trên flashcard + danh sách "Đã lưu" của thư viện. */
  function repaintBookmarks() {
    updateBookmarkBtn();
    if (typeof window.renderUnified === 'function') {
      try {
        window.renderUnified();
      } catch (e) {
        lhWarn('BOOKMARK_QUESTIONS_FEATURE_20260726', e);
      }
    } else if (typeof window.renderStudy === 'function') {
      try {
        window.renderStudy();
      } catch (e) {
        lhWarn('BOOKMARK_QUESTIONS_FEATURE_20260726', e);
      }
    }
  }

  function init() {
    addBookmarkButtonToCard();
    bindLibraryClickEvents();
    if (typeof window.renderUnified === 'function') {
      try {
        window.renderUnified();
      } catch (e) {
        lhWarn('BOOKMARK_QUESTIONS_FEATURE_20260726', e);
      }
    }
    // BOOKMARK_SYNC_PER_PART_20260806: lấy bản của server rồi vẽ lại. Chạy sau lần vẽ đầu nên
    // người dùng thấy bookmark trên máy ngay, không phải chờ mạng.
    syncBookmarks().then(changed => {
      if (changed) repaintBookmarks();
    });
    // Máy vừa có mạng lại (chế độ ngoại tuyến của LH_OFFLINE_GRACE_20260806) thì thử đồng bộ.
    window.addEventListener('online', () => {
      syncBookmarks().then(changed => {
        if (changed) repaintBookmarks();
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 100));
  } else {
    setTimeout(init, 100);
  }

  // Đổi học phần = đọc ô khác trong `lh_starred_v2`, chỉ cần vẽ lại (một lần GET ở init đã
  // mang về bookmark của MỌI phần nên không phải gọi server lần nữa).
  window.addEventListener('lh:subject-changed', () => {
    setTimeout(updateBookmarkBtn, 100);
    repaintBookmarks();
  });
}
// ===== BOOKMARK_QUESTIONS_FEATURE_20260726 END =====

// ===== HEADER_EDIT_REQUEST_BELL_20260726 =====
// Chuông thông báo yêu cầu sửa câu hỏi.
//
// Vị trí: NGOÀI header (.globalTop .actions), nằm bên trái nút "Đổi môn" ->
// thứ tự trên thanh trên cùng là: [chuông] [Đổi môn] [Cài đặt] [Avatar].
// Nút và modal đã có sẵn trong index.html (#hodEditRequestBell,
// #hodEditRequestModal) cùng CSS cho .globalTop, nhưng trước đây không có JS nào
// gắn vào nên nút nằm im trong menu tài khoản và không bấm được.
//
// Điện thoại: KHÔNG xử lý ở JS. app.css đã có
//   @media (max-width:760px){ .globalTop #hodEditRequestBell{display:none!important} }
// nên chuông tự ẩn trên mobile (báo cáo vẫn xem được qua menu tài khoản ->
// "Báo cáo đã gửi"). Đừng thêm inline style.display cho nút này, vì inline
// (không !important) sẽ thua rule !important trong CSS và ngược lại setProperty
// important sẽ đè luôn media query mobile.
//
// Dữ liệu: GET /api/my-edit-requests (Turso). Supabase chỉ dùng để auth, token
// do lớp patch fetch tự gắn Authorization - xem LH_FETCH_AUTH ở dưới file.
export function installHeaderBell() {
  const SEEN_KEY = 'lh_edit_request_seen_v1';
  const POLL_MS = 60000;
  const MIN_GAP_MS = 15000;

  const $ = id => document.getElementById(id);
  const esc = s =>
    String(s ?? '').replace(
      /[&<>"']/g,
      c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );
  const user = () => window.HODSupabase?.getUser?.() || null;

  let bell = null; // giữ tham chiếu vì khi đăng xuất ta tháo nút khỏi DOM
  let items = [];
  let staffPendingItems = []; // yêu cầu của học sinh chờ admin duyệt
  let loading = false;
  let inflight = null; // promise của lần gọi API đang chạy (chống gọi trùng)
  let lastFetch = 0; // mốc lần GỌI gần nhất (kể cả lỗi) để không spam API
  let loadedOk = false; // đã từng lấy được danh sách -> phân biệt rỗng vs lỗi
  let watchedUser = null; // id user đang theo dõi, đổi user thì nạp lại từ đầu

  function isStaff() {
    const role = String(window.HODSupabase?.getProfile?.()?.role || '').toLowerCase();
    return !!user() && (window.HODSupabase?.isAdmin?.() || role === 'admin' || role === 'editor');
  }

  function actionsBar() {
    return (
      document.querySelector('.globalTop .actions') ||
      document.querySelector('#fc .actions') ||
      document.querySelector('.actions')
    );
  }

  function readSeen() {
    try {
      return JSON.parse(localStorage.getItem(SEEN_KEY) || '{}') || {};
    } catch (e) {
      return {};
    }
  }
  function writeSeen(map) {
    try {
      localStorage.setItem(SEEN_KEY, JSON.stringify(map));
    } catch (e) {
      lhWarn('HEADER_EDIT_REQUEST_BELL_20260726', e);
    }
  }
  // Mốc "đã xem" theo trạng thái + thời điểm duyệt: admin duyệt lại lần nữa thì
  // lại tính là thông báo mới.
  function stampOf(r) {
    return String(r.status || '') + '|' + String(r.reviewed_at || r.created_at || '');
  }
  function isFresh(r, seen) {
    if (String(r.status || 'pending') === 'pending') return false;
    return seen[String(r.id)] !== stampOf(r);
  }

  function statusText(s) {
    return { pending: 'Đang chờ', approved: 'Đã duyệt', rejected: 'Từ chối' }[s] || s || 'Không rõ';
  }
  function statusClass(s) {
    return s === 'approved' ? 'approved' : s === 'rejected' ? 'rejected' : 'pending';
  }
  function timeText(v) {
    if (!v) return '';
    const d = new Date(v);
    return isNaN(d.getTime()) ? String(v) : d.toLocaleString('vi-VN');
  }

  // Đưa chuông ra thanh header, ngay trước nút Đổi môn / Cài đặt.
  function mount() {
    if (!bell) bell = $('hodEditRequestBell');
    if (!bell) return;
    if (!user()) {
      if (bell.isConnected) bell.remove();
      return;
    }
    const actions = actionsBar();
    if (!actions) return;
    const anchor = $('subjectTopChip') || $('openSettings');
    if (anchor && anchor.parentNode === actions) {
      if (anchor.previousElementSibling !== bell) actions.insertBefore(bell, anchor);
    } else if (bell.parentNode !== actions) {
      actions.prepend(bell);
    }
  }

  function paint() {
    if (!bell || !bell.isConnected) return;
    const seen = readSeen();
    const myFreshCount = items.filter(r => isFresh(r, seen)).length;
    const staffPendingCount = isStaff() ? staffPendingItems.length : 0;
    const totalNew = myFreshCount + staffPendingCount;

    const badge = $('hodEditRequestBadge');
    if (badge) {
      badge.textContent = totalNew > 9 ? '9+' : String(totalNew);
      badge.classList.toggle('hidden', totalNew === 0);
    }
    bell.classList.toggle('hasNewRequest', totalNew > 0);

    let titleText = 'Thông báo yêu cầu sửa câu hỏi';
    if (staffPendingCount > 0 && myFreshCount > 0) {
      titleText = `${staffPendingCount} yêu cầu học sinh chờ duyệt & ${myFreshCount} phản hồi mới`;
    } else if (staffPendingCount > 0) {
      titleText = `${staffPendingCount} yêu cầu sửa từ học sinh đang chờ duyệt`;
    } else if (myFreshCount > 0) {
      titleText = `${myFreshCount} yêu cầu sửa vừa có phản hồi`;
    }
    bell.title = titleText;
  }

  function isModalOpen() {
    return !!$('hodEditRequestModal') && !$('hodEditRequestModal').classList.contains('hidden');
  }

  function fetchNow() {
    loading = true;
    return (async () => {
      try {
        const promises = [
          fetch('/api/my-edit-requests?ts=' + Date.now(), { cache: 'no-store' })
            .then(res => (res.ok ? res.json() : {}))
            .catch(() => ({})),
        ];
        if (isStaff()) {
          promises.push(
            fetch('/api/staff-edit-requests?ts=' + Date.now(), { cache: 'no-store' })
              .then(res => (res.ok ? res.json() : {}))
              .catch(() => ({})),
          );
        }
        const [myOut, staffOut] = await Promise.all(promises);
        if (Array.isArray(myOut?.data)) {
          items = myOut.data;
          loadedOk = true;
        }
        if (staffOut && Array.isArray(staffOut?.data)) {
          staffPendingItems = staffOut.data;
        } else if (!isStaff()) {
          staffPendingItems = [];
        }
      } catch (e) {
        console.warn('[bell] không tải được yêu cầu sửa:', e);
      } finally {
        loading = false;
        inflight = null;
        paint();
        // Modal đang mở thì vẽ lại: nếu chỉ paint() thì danh sách treo ở "Đang tải...".
        if (isModalOpen()) renderList();
      }
    })();
  }

  // Trả về promise của lần gọi ĐANG chạy để openModal await đúng lần đó, thay vì
  // thoát sớm rồi render lúc dữ liệu chưa về.
  function load(force) {
    if (!user()) {
      items = [];
      staffPendingItems = [];
      return Promise.resolve();
    }
    if (inflight) return inflight;
    if (!force && Date.now() - lastFetch < MIN_GAP_MS) return Promise.resolve();
    lastFetch = Date.now();
    inflight = fetchNow();
    return inflight;
  }

  window.jumpToQuestionInLibrary = function (num, subjectCode) {
    closeModal();

    // 1. Reset bộ lọc thư viện về "Tất cả" (all)
    try {
      localStorage.setItem('learninghub_library_filter_v1', 'all');
    } catch (e) {
      lhWarn('HEADER_EDIT_REQUEST_BELL_20260726', e);
    }

    // 2. Tự động chuyển sang môn học tương ứng nếu câu hỏi thuộc môn khác
    const targetSubject = String(subjectCode || '').trim();
    const currentSubject = (localStorage.getItem('learninghub_subject_code_merged_v1') || '').trim();
    let needReloadSubject = false;

    if (targetSubject && targetSubject !== currentSubject) {
      try {
        localStorage.setItem('learninghub_subject_code_merged_v1', targetSubject);
        needReloadSubject = true;
        if ($('subjectInlineText')) $('subjectInlineText').textContent = targetSubject;
        if ($('hodAccountSubjectText')) $('hodAccountSubjectText').textContent = targetSubject;
      } catch (e) {
        lhWarn('HEADER_EDIT_REQUEST_BELL_20260726', e);
      }
    }

    // 3. Chuyển tab sang Thư viện (study)
    const tabBtn = document.querySelector('.tab[data-tab="study"]');
    if (typeof window.switchTab === 'function') {
      window.switchTab('study', tabBtn);
    } else if (tabBtn) {
      tabBtn.click();
    }

    // 4. Nếu đổi môn, gọi nạp lại dữ liệu môn mới
    if (needReloadSubject) {
      if (typeof window.loadCurrentSubjectOnly === 'function') {
        window.loadCurrentSubjectOnly(true);
      } else if (typeof window.loadSubjectLight === 'function') {
        window.loadSubjectLight(true);
      }
    }

    // 5. Điền mã câu vào ô tìm kiếm (#num)
    const searchInput = document.getElementById('search') || document.getElementById('studySearch');
    if (searchInput) {
      searchInput.value = '#' + num;
      try {
        localStorage.setItem('learninghub_library_search_v1', '#' + num);
      } catch (e) {
        lhWarn('OPEN_QUESTION_LOCALLY_LOCALSTORAGE_SAVE', e);
      }
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      searchInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // 6. Vẽ lại giao diện Thư viện & cuộn tới câu hỏi
    if (typeof window.renderStudy === 'function') {
      try {
        window.renderStudy();
      } catch (e) {
        lhWarn('HEADER_EDIT_REQUEST_BELL_20260726', e);
      }
    }
    setTimeout(() => {
      const list = document.getElementById('studyList') || document.getElementById('study');
      if (list) list.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  };

  function renderList() {
    const box = $('hodEditRequestList');
    if (!box) return;
    if (!user()) {
      box.innerHTML = '<div class="hodReportEmpty">Đăng nhập để xem thông báo.</div>';
      return;
    }

    let staffHtml = '';
    if (isStaff()) {
      if (staffPendingItems.length > 0) {
        staffHtml = `
        <div class="hodStaffPendingBlock" style="margin-bottom: 14px; padding: 12px 14px; background: rgba(200, 169, 110, 0.08); border: 1px solid rgba(200, 169, 110, 0.35); border-radius: 14px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <strong style="color:var(--gold2, #e8d4a8); font-size:13px; display:flex; align-items:center; gap:6px; font-weight:700;">
              <span>📌</span> Có ${staffPendingItems.length} yêu cầu từ học sinh chờ duyệt
            </strong>
            <a href="admin.html?tab=requests" target="_blank" style="font-size:12px; font-weight:700; color:#111111; text-decoration:none; background:linear-gradient(135deg, #c8a96e, #e8d4a8); padding:5px 12px; border-radius:8px; border:none; display:inline-flex; align-items:center; gap:3px; box-shadow:0 2px 8px rgba(200, 169, 110, 0.3);">
              Duyệt ngay ↗
            </a>
          </div>
          ${staffPendingItems
            .slice(0, 3)
            .map(r => {
              const n = r.question_num || r.new_data?.num || '?';
              const sc = r.subject_code || r.new_data?.subject_code || '';
              return `
            <div style="font-size:12px; color:#e2d8c3; margin-top:6px; padding-top:6px; border-top:1px dashed rgba(200, 169, 110, 0.2); line-height:1.45; display:flex; justify-content:space-between; align-items:center; gap:8px;">
              <div>
                <b style="color:#ffffff;">Câu ${esc(n)}</b> (${esc(sc)}) - <span style="color:var(--gold2, #e8d4a8); font-weight:500;">${esc(r.user_email || 'Học sinh')}</span>: <span style="color:#c8bba6; font-style:italic;">"${esc(r.reason || 'Đề xuất sửa câu hỏi')}"</span>
              </div>
              ${n !== '?' ? `<button type="button" onclick="window.jumpToQuestionInLibrary('${esc(n)}', '${esc(sc)}')" style="font-size:11px; font-weight:600; padding:2px 8px; border-radius:6px; background:rgba(200, 169, 110, 0.15); border:1px solid rgba(200, 169, 110, 0.3); color:var(--gold2, #e8d4a8); cursor:pointer; white-space:nowrap;">Tra câu ↗</button>` : ''}
            </div>`;
            })
            .join('')}
          ${staffPendingItems.length > 3 ? `<div style="font-size:11px; color:#c8bba6; margin-top:6px; font-style:italic;">...và ${staffPendingItems.length - 3} yêu cầu khác</div>` : ''}
        </div>`;
      } else {
        staffHtml = `
        <div class="hodStaffPendingBlock" style="margin-bottom: 12px; padding: 10px 14px; background: rgba(114, 197, 140, 0.08); border: 1px solid rgba(114, 197, 140, 0.25); border-radius: 12px; font-size:12px; display:flex; justify-content:space-between; align-items:center;">
          <span style="color:#9ee5b2; font-weight:600; display:flex; align-items:center; gap:6px;">✓ Không có yêu cầu học sinh nào đang chờ duyệt</span>
          <a href="admin.html?tab=requests" target="_blank" style="color:var(--gold2, #e8d4a8); font-weight:700; text-decoration:none;">Trang Admin ↗</a>
        </div>`;
      }
    }

    if (!items.length) {
      // Phân biệt "chưa gửi gì" với "gọi API lỗi" để không báo sai cho người học.
      const emptyMsg = loading
        ? '<div class="hodReportEmpty">Đang tải...</div>'
        : loadedOk
          ? '<div class="hodReportEmpty">Bạn chưa gửi yêu cầu sửa nào.</div>'
          : '<div class="hodReportEmpty">Không tải được thông báo. Thử lại sau.</div>';
      box.innerHTML = staffHtml + emptyMsg;
      return;
    }
    const seen = readSeen();
    const myItemsHtml = items
      .map(r => {
        const fresh = isFresh(r, seen);
        const num = r.question_num || r.new_data?.num || '?';
        const code = r.subject_code || r.new_data?.subject_code || '';
        return `
      <div class="hodEditRequestItem${fresh ? ' is-new' : ''}">
        <div class="hodEditRequestHead">
          <b>Câu ${esc(num)}${code ? ' · ' + esc(code) : ''}</b>
          <span class="hodEditRequestStatus ${statusClass(r.status)}">${esc(statusText(r.status))}</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px; gap:8px;">
          <p class="hodEditRequestMeta" style="margin:0;">Gửi: ${esc(timeText(r.created_at))}${r.reviewed_at ? ' · Phản hồi: ' + esc(timeText(r.reviewed_at)) : ''}</p>
          ${
            num !== '?'
              ? `
          <button type="button" class="hodJumpStudyBtn" data-num="${esc(num)}" data-subject="${esc(code)}" style="font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 6px; background: rgba(200, 169, 110, 0.15); border: 1px solid rgba(200, 169, 110, 0.35); color: var(--gold2, #e8d4a8); cursor: pointer; display: inline-flex; align-items: center; gap: 3px; white-space: nowrap; flex-shrink: 0;">
            🔍 Tra câu ↗
          </button>`
              : ''
          }
        </div>
        ${r.admin_note ? `<p class="hodEditRequestNote" style="margin-top:4px;">Ghi chú admin: ${esc(r.admin_note)}</p>` : ''}
        ${fresh ? '<span class="hodEditRequestNew">Mới</span>' : ''}
      </div>`;
      })
      .join('');

    box.innerHTML = staffHtml + myItemsHtml;
  }

  // Mở modal = đã đọc: xoá badge nhưng vẫn giữ nhãn "Mới" của lần mở này.
  function markAllSeen() {
    const seen = readSeen();
    items.forEach(r => {
      if (String(r.status || 'pending') !== 'pending') seen[String(r.id)] = stampOf(r);
    });
    writeSeen(seen);
  }

  function closeModal() {
    $('hodEditRequestModal')?.classList.add('hidden');
  }

  async function openModal() {
    const modal = $('hodEditRequestModal');
    if (!modal) return;
    $('hodAccountMenu')?.classList.add('hidden');
    modal.classList.remove('hidden');
    renderList();
    await load(true);
    renderList();
    markAllSeen();
    paint();
  }

  function bind() {
    if (!bell) bell = $('hodEditRequestBell');
    if (bell && !bell.__lhBellBound) {
      bell.__lhBellBound = true;
      bell.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        openModal();
      });
    }
    const closeBtn = $('hodEditRequestClose');
    if (closeBtn && !closeBtn.__lhBellBound) {
      closeBtn.__lhBellBound = true;
      closeBtn.addEventListener('click', closeModal);
    }
    const modal = $('hodEditRequestModal');
    if (modal && !modal.__lhBellBound) {
      modal.__lhBellBound = true;
      modal.addEventListener('mousedown', e => {
        if (e.target === modal) closeModal();
      });
    }
    const listEl = $('hodEditRequestList');
    if (listEl && !listEl.__lhJumpBound) {
      listEl.__lhJumpBound = true;
      listEl.addEventListener('click', e => {
        const btn = e.target.closest('.hodJumpStudyBtn');
        if (btn) {
          const num = btn.dataset.num;
          const subject = btn.dataset.subject || '';
          if (num && num !== '?') window.jumpToQuestionInLibrary(num, subject);
        }
      });
    }
  }

  function tick() {
    mount();
    bind();
    const uid = user()?.id || null;
    if (uid !== watchedUser) {
      watchedUser = uid;
      items = [];
      loadedOk = false;
      lastFetch = 0;
      if (uid) load(true);
    }
    paint();
  }

  function boot() {
    tick();
    // Lúc boot user thường CHƯA đăng nhập xong (auth async) nên tick đầu tháo nút
    // ra; các mốc dưới đây gắn lại ngay khi có user, không phải chờ interval.
    [300, 1200, 3000].forEach(ms => setTimeout(tick, ms));
    setInterval(tick, 700);
    setInterval(() => load(false), POLL_MS);
    // PATCH_MOBILE_PERF_PAUSE_INTERVALS chặn setInterval khi tab bị ẩn, nên khi
    // tab hiện lại phải tick tay một nhịp thay vì chờ interval.
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) tick();
    });
    window.addEventListener('focus', () => {
      tick();
      load(false);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
}
// ===== HEADER_EDIT_REQUEST_BELL_20260726 END =====
