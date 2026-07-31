/**
 * Learning Hub - Bookmark Questions & Header Edit Request Bell Module
 * Tách từ appCore.js (lines 10180 - 10937)
 */

import { LHState } from './state.js';
import { lhWarn } from '../core/log.js';

// ===== BOOKMARK_QUESTIONS_FEATURE_20260726 =====
export function installBookmarks() {
  const BOOKMARK_PREFIX = 'lh_starred_v1_';

  const SVG_UNSAVED = `<svg class="bmIcon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>`;
  const SVG_SAVED = `<svg class="bmIcon" width="18" height="18" viewBox="0 0 24 24" fill="#f5c518" stroke="#f5c518" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>`;

  const SVG_LIB_UNSAVED = `<svg class="bmLibIcon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>`;
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

  function bookmarkKey() {
    return BOOKMARK_PREFIX + getSubjectCode();
  }

  function getQKey(q) {
    if (!q) return null;
    if (typeof q === 'string' || typeof q === 'number') return 'num_' + String(q);
    if (q.num !== undefined && q.num !== null && q.num !== '') return 'num_' + String(q.num);
    if (q.id !== undefined && q.id !== null && q.id !== '') return 'id_' + String(q.id);
    if (q.question) return 'q_' + String(q.question).trim().slice(0, 50);
    return null;
  }

  function loadBookmarks() {
    try {
      const primaryKey = bookmarkKey();
      const primaryArr = JSON.parse(localStorage.getItem(primaryKey) || '[]');
      const backupArr = JSON.parse(localStorage.getItem('lh_starred_v1_backup_all') || '[]');
      const merged = new Set(
        [...(Array.isArray(primaryArr) ? primaryArr : []), ...(Array.isArray(backupArr) ? backupArr : [])].map(x =>
          String(x),
        ),
      );
      return merged;
    } catch (e) {
      return new Set();
    }
  }

  function saveBookmarks(set) {
    try {
      const arr = [...set].map(x => String(x));
      localStorage.setItem(bookmarkKey(), JSON.stringify(arr));
      localStorage.setItem('lh_starred_v1_backup_all', JSON.stringify(arr));
    } catch (e) {
      lhWarn('BOOKMARK_QUESTIONS_FEATURE_20260726', e);
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
    return added;
  }

  function countBookmarks() {
    return loadBookmarks().size;
  }

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
        if (typeof window.notify === 'function') {
          window.notify(added ? `🔖 Đã lưu câu ${displayNum}` : `Đã bỏ lưu câu ${displayNum}`);
        }
      } catch (err) {
        lhWarn('BOOKMARK_QUESTIONS_FEATURE_20260726', err);
      }
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
          if (typeof window.notify === 'function') {
            window.notify(added ? `🔖 Đã lưu câu hỏi` : `Đã bỏ lưu câu hỏi`);
          }
        } catch (ex) {
          lhWarn('BOOKMARK_QUESTIONS_FEATURE_20260726', ex);
        }

        if (typeof window.renderStudy === 'function') window.renderStudy();
        updateBookmarkBtn();
      },
      false,
    );
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
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 100));
  } else {
    setTimeout(init, 100);
  }

  window.addEventListener('lh:subject-changed', () => {
    setTimeout(updateBookmarkBtn, 100);
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
  });
}

// ===== HEADER_EDIT_REQUEST_BELL_20260726 =====
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

  let bell = null;
  let items = [];
  let staffPendingItems = [];
  let loading = false;
  let inflight = null;
  let lastFetch = 0;
  let loadedOk = false;
  let watchedUser = null;

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
        if (isModalOpen()) renderList();
      }
    })();
  }

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

    try {
      localStorage.setItem('learninghub_library_filter_v1', 'all');
    } catch (e) {
      lhWarn('HEADER_EDIT_REQUEST_BELL_20260726', e);
    }

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

    const tabBtn = document.querySelector('.tab[data-tab="study"]');
    if (typeof window.switchTab === 'function') {
      window.switchTab('study', tabBtn);
    } else if (tabBtn) {
      tabBtn.click();
    }

    if (needReloadSubject) {
      if (typeof window.loadCurrentSubjectOnly === 'function') {
        window.loadCurrentSubjectOnly(true);
      } else if (typeof window.loadSubjectLight === 'function') {
        window.loadSubjectLight(true);
      }
    }

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
    [300, 1200, 3000].forEach(ms => setTimeout(tick, ms));
    setInterval(tick, 700);
    setInterval(() => load(false), POLL_MS);
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
