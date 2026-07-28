/**
 * CỔNG CHỌN MÔN + số câu mỗi môn — bước 4 của docs/SPLIT_PLAN.md, tách ngày 20260727.
 *
 *   installSubjectGate            LEARNING HUB MERGED SUBJECT PATCH (cốt lõi: #subjectGate,
 *                                 renderSubjects, enterSubject, openGate, chip môn đang học,
 *                                 setSubject, patchSubmit, patchSignOut)
 *   installGateAriaFix            FIX_ARIA_HIDDEN_SUBJECT_GATE_20260629
 *   installSubjectCountsCache     SUBJECT_COUNTS_ONCE_CACHE_20260629 (refreshSubjectCountsOnce)
 *   installClearAddSubjectDraft   CLEAR_ADD_SUBJECT_DRAFT_NEW_SESSION_20260629
 *   installSubjectCountsFallback  TURSO_SUBJECT_COUNTS_FALLBACK_20260630
 *
 * Đổi so với bản trong appCore:
 * - `LHState` / `lhWarn` -> import.
 * - `notify` / `fixBrand` / `renderCard` / `renderQuiz` / `renderStudy` -> gọi qua `window.*`.
 * - `renderSubjects` KHÔNG cần hàm chuyển tiếp: nó là hàm local của installSubjectGate, chưa
 *   bao giờ ở tầng module appCore (xem chú thích trong installSubjectCountsFallback).
 *
 * Vẫn dùng `install*()` gọi đúng chỗ block cũ đứng, không IIFE — xem lý do trong ./exam.js.
 *
 * CHƯA tách (cố ý, xem SPLIT_PLAN mục 4): nhóm "Thêm môn" + xem trước file import
 * (ADD_SUBJECT_FEATURE, QUIZLET_IMPORT_AUTODETECT, IMPORT_PREVIEW_*, FIX_ADD_SUBJECT_FAST_…)
 * và nhóm tải dữ liệu (ACTIVE_SUBJECT_COUNT_SYNC gán `loadCurrentSubjectOnly`/`renderCard`).
 */
import { LHState } from './state.js';
import { lhWarn } from '../core/log.js';

/**
 * SUBJECT_FOLDER_NEW_BADGE_20260729 — cờ NEW của THƯ MỤC là cờ RIÊNG của thư mục, không suy ra
 * từ môn con nữa (trước đây: "có ít nhất một môn con bật thì thư mục sáng NEW").
 * `/api/subjects` trả `folder_new_badges` = mảng mã gốc đang bật (nguồn:
 * `site_settings.subject_folder_new_badges`, admin bấm nút NEW ở hàng thư mục).
 * Để ở tầng module vì HAI block trong file này đều gọi `/api/subjects` (getSubjects của cổng
 * chọn môn và tursoCounts của số câu) — block nào lấy được thì cả file dùng chung.
 */
let folderNewBadges = new Set();
function rememberFolderNewBadges(json) {
  if (!json || !Array.isArray(json.folder_new_badges)) return;
  folderNewBadges = new Set(json.folder_new_badges.map(x => String(x || '').toUpperCase()));
}
function isNewFolder(base) {
  return folderNewBadges.has(String(base || '').toUpperCase());
}

// ===== LEARNING HUB MERGED SUBJECT PATCH START =====
export function installSubjectGate() {
  const HUB_URL = window.APP_CONFIG?.SUPABASE_URL || '';
  const HUB_KEY = window.APP_CONFIG?.SUPABASE_ANON_KEY || '';
  const SUBJECT_STORE = 'learninghub_subject_code_merged_v1';
  let subjectClient = null,
    subjectsCache = [],
    pickedCode = localStorage.getItem(SUBJECT_STORE) || '',
    // SUBJECT_FOLDER_DRILLDOWN_20260728: mã gốc của thư mục đang mở ('' = đang ở ngoài cùng).
    openBase = '',
    lock = false;
  function c() {
    if (window.HODSupabase?.__client) return window.HODSupabase.__client;
    if (!window.supabase) return null;
    if (!subjectClient) subjectClient = window.supabase.createClient(HUB_URL, HUB_KEY);
    return subjectClient;
  }
  function $(id) {
    return document.getElementById(id);
  }
  function esc2(s) {
    return String(s ?? '').replace(
      /[&<>"']/g,
      c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );
  }
  function displayCode(code) {
    return String(code || '');
  }
  /**
   * SUBJECT_GROUP_BY_BASE_20260728: mã gốc của môn, giống hệt `baseCode` của exam.js (dòng ~96)
   * mà khối "Gộp thêm môn" đang dùng — MLN122, MLN122_2, MLN122_3 đều ra 'MLN122'.
   * Cố ý KHÔNG import từ exam.js: exam.js không xuất tên này, và nhân đôi 3 dòng rẻ hơn
   * việc mở thêm một đường phụ thuộc giữa hai file. Đổi quy tắc thì phải đổi CẢ HAI chỗ.
   */
  function baseCode(code) {
    return String(code || '')
      .split(/[_\-\s]/)[0]
      .toUpperCase();
  }
  function countOf(s) {
    const n = Number(s?.question_count ?? s?.questions_count ?? s?.count);
    return Number.isFinite(n) ? n : 0;
  }
  function user() {
    return window.HODSupabase?.getUser?.() || null;
  }
  function logged() {
    return !!user();
  }
  function subjectCode() {
    return localStorage.getItem(SUBJECT_STORE) || '';
  }
  function getDeviceTypeString() {
    const ua = navigator.userAgent || '';
    let os = 'Máy tính';
    if (/iPhone|iPad|iPod/i.test(ua)) os = '📱 iOS';
    else if (/Android/i.test(ua)) os = '📱 Android';
    else if (/Macintosh|Mac OS X/i.test(ua)) os = '💻 Mac';
    else if (/Windows/i.test(ua)) os = '💻 Windows';
    else if (/Linux/i.test(ua)) os = '💻 Linux';

    let browser = '';
    if (/Chrome|CriOS/i.test(ua) && !/Edge|Edg/i.test(ua)) browser = 'Chrome';
    else if (/Safari/i.test(ua) && !/Chrome|CriOS/i.test(ua)) browser = 'Safari';
    else if (/Firefox|FxMo/i.test(ua)) browser = 'Firefox';
    else if (/Edge|Edg/i.test(ua)) browser = 'Edge';

    return browser ? `${os} · ${browser}` : os;
  }
  function syncUserSubjectToProfile(code) {
    const u = user() || window.HODSupabase?.getUser?.();
    if (!u) {
      setTimeout(() => {
        const u2 = user() || window.HODSupabase?.getUser?.();
        if (u2) syncUserSubjectToProfile(code);
      }, 1000);
      return;
    }
    try {
      const md = u.user_metadata || {};
      const sub = code || subjectCode() || '';
      fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: u.id,
          email: u.email,
          full_name: md.full_name || md.name || '',
          avatar_url: md.avatar_url || md.picture || '',
          current_subject: sub,
          device_info: typeof getDeviceTypeString === 'function' ? getDeviceTypeString() : undefined,
        }),
      }).catch(e => console.warn('syncUserSubjectToProfile failed:', e));
    } catch (e) {
      lhWarn('LEARNING_HUB_MERGED_SUBJECT_PATCH', e);
    }
  }
  // FIX_LIBRARY_STALE_AFTER_SUBJECT_CHANGE_20260727: bắn 'lh:subject-changed' (trước đây
  // không nơi nào bắn nên listener trong BOOKMARK_QUESTIONS_FEATURE chưa từng chạy) để
  // thư viện tự dọn tìm kiếm/trạng thái mở của môn cũ rồi vẽ lại.
  function setSubject(code) {
    if (code) localStorage.setItem(SUBJECT_STORE, code);
    else localStorage.removeItem(SUBJECT_STORE);
    pickedCode = code || '';
    syncSubjectTexts();
    syncUserSubjectToProfile(code);
    try {
      if (typeof window.__examResetForSubjectChange === 'function') window.__examResetForSubjectChange();
    } catch (e) {
      lhWarn('LEARNING_HUB_MERGED_SUBJECT_PATCH', e);
    }
    try {
      window.dispatchEvent(new CustomEvent('lh:subject-changed', { detail: { code: code || '' } }));
    } catch (e) {
      lhWarn('LEARNING_HUB_MERGED_SUBJECT_PATCH', e);
    }
  }
  function meta(code) {
    return subjectsCache.find(x => x.code === code) || null;
  }
  function label(code) {
    const m = meta(code);
    return m ? `${displayCode(m.code)} · ${m.name || ''}` : displayCode(code) || 'Chưa chọn môn';
  }
  function notifyUX(msg) {
    // `notify` khai báo ở appCore tầng module (~274) và phơi ra `window.notify` (~757) ngay
    // lúc import. Ở file này KHÔNG có tên đó, nên phải đọc qua window — để nguyên
    // `typeof notify` thì nhánh luôn sai và mọi toast của cổng chọn môn im lặng biến mất.
    if (typeof window.notify === 'function') window.notify(msg);
    else console.log(msg);
  }
  function syncSubjectTexts() {
    const code = subjectCode();
    if ($('subjectInlineText')) $('subjectInlineText').textContent = code ? label(code) : 'Chưa chọn môn';
    if ($('hodAccountSubjectText')) $('hodAccountSubjectText').textContent = code ? label(code) : 'Chưa chọn môn';
    ensureChip();
    const chip = $('subjectTopChip');
    if (chip) {
      chip.textContent = code ? label(code) : 'Chọn môn';
      chip.classList.toggle('hidden', !logged());
    }
    syncGateUserInfo();
  }
  function syncGateUserInfo() {
    const u = user();
    const emailEl = $('subjectUserEmail');
    if (emailEl) emailEl.textContent = u?.email || 'Chưa đăng nhập';
    const avatarEl = $('subjectUserAvatar');
    if (avatarEl) {
      const md = u?.user_metadata || {};
      const avatarUrl = md.avatar_url || md.picture || '';
      const nameStr = md.full_name || md.name || u?.email || 'U';
      const initial = nameStr.charAt(0).toUpperCase();
      if (avatarUrl) {
        avatarEl.innerHTML = `<img src="${esc2(avatarUrl)}" alt="Avatar" class="subjectAvatarImg">`;
      } else {
        avatarEl.innerHTML = `<div class="subjectAvatarInitial">${esc2(initial)}</div>`;
      }
    }
  }
  function ensureChip() {
    const actions = document.querySelector('#fc .actions') || document.querySelector('.actions');
    if (!actions || $('subjectTopChip')) return;
    const b = document.createElement('button');
    b.id = 'subjectTopChip';
    b.type = 'button';
    b.className = 'subjectChip hidden';
    b.onclick = () => openGate();
    actions.prepend(b);
  }
  function updateBrand(code) {
    // `fixBrand` là hàm local của block FINAL_HEADER_SUBJECT_DYNAMIC_FIX trong appCore, được
    // phơi ra `window.fixBrand` (~4173) lúc import. Cùng lý do như notifyUX ở trên.
    if (typeof window.fixBrand === 'function') window.fixBrand();
  }
  function closeAccountMenu() {
    $('hodAccountMenu')?.classList.add('hidden');
  }
  function gateOn(on) {
    document.body.classList.toggle('has-subject-gate', !!on);
    $('subjectGate')?.classList.toggle('hidden', !on);
    $('subjectGate')?.setAttribute('aria-hidden', on ? 'false' : 'true');
  }
  function showErr(msg) {
    const e = $('subjectError');
    if (e) {
      e.textContent = msg;
      e.classList.remove('hidden');
    }
  }
  function clearErr() {
    $('subjectError')?.classList.add('hidden');
  }
  function showLoading(on, msg = 'Đang tải danh sách môn học...') {
    const e = $('subjectLoading');
    if (e) {
      e.textContent = msg;
      e.classList.toggle('hidden', !on);
    }
  }
  function fallbackSubjects() {
    return [
      {
        code: 'HOD102',
        name: 'HOD102 Learning',
        description: 'Môn mặc định để bắt đầu học.',
        cover: '',
        is_active: true,
        question_count: 0,
      },
      {
        code: 'MLN111',
        name: 'MLN111 Learning',
        description: 'Bộ câu hỏi và tài liệu MLN111.',
        cover: '',
        is_active: true,
        question_count: 0,
      },
    ];
  }
  async function addQuestionCounts(subjects) {
    const list = subjects || [];
    // Giảm gọi Supabase: không query questions ở bước render môn.
    // Số câu lấy từ subjects nếu có, hoặc cache localStorage đã đếm một lần.
    let store = { counts: {}, confirmed: {} };
    try {
      store = JSON.parse(localStorage.getItem('learninghub_subject_counts_cache_v3') || '{}') || store;
    } catch (e) {
      lhWarn('LEARNING_HUB_MERGED_SUBJECT_PATCH', e);
    }
    store.counts = store.counts || {};
    store.confirmed = store.confirmed || {};
    const active = localStorage.getItem('learninghub_subject_code_merged_v1') || '';
    const current = {};
    try {
      (LHState.RAW || []).forEach(q => {
        const code = q.subject_code || active || '';
        if (code) current[code] = (current[code] || 0) + 1;
      });
    } catch (e) {
      lhWarn('LEARNING_HUB_MERGED_SUBJECT_PATCH', e);
    }
    return list.map(s => {
      const code = s.code || '';
      let n = s.question_count ?? s.questions_count ?? s.count;
      if (n === undefined || n === null || Number(n) === 0) n = current[code] ?? store.counts[code] ?? 0;
      n = Number(n);
      if (!Number.isFinite(n)) n = 0;
      return { ...s, question_count: n };
    });
  }
  async function getSubjects() {
    if (!logged()) return fallbackSubjects();
    try {
      const res = await fetch('/api/subjects?ts=' + Date.now(), { cache: 'no-store' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.error) throw new Error(json.error || 'Không tải được subjects từ Turso');
      rememberFolderNewBadges(json);
      const rows = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
      if (!rows.length) return fallbackSubjects();
      rows.sort(
        (a, b) =>
          (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0) ||
          String(a.code || '').localeCompare(String(b.code || '')),
      );
      return await addQuestionCounts(rows);
    } catch (e) {
      console.warn('[Turso subjects]', e);
      showErr('Không tải được danh sách môn học từ Turso. Đang dùng môn mặc định.');
      return fallbackSubjects();
    }
  }

  /** Cờ NEW của một môn — `cover` là chuỗi JSON do admin ghi (set_subject_new_badge). */
  function isNewSubject(s) {
    let coverMeta = {};
    try {
      coverMeta = typeof s?.cover === 'string' ? JSON.parse(s.cover || '{}') : s?.cover || {};
    } catch (e) {
      coverMeta = {};
    }
    return !!(
      s?.new_badge ||
      s?.newBadge ||
      s?.is_new ||
      s?.isNew ||
      coverMeta.new_badge ||
      coverMeta.newBadge ||
      coverMeta.is_new
    );
  }
  function card(s) {
    const rawCode = String(s.code || '');
    const code = esc2(displayCode(rawCode));
    const name = esc2(s.name || displayCode(rawCode) || 'Chưa có tên môn');
    const desc = esc2(s.description || 'Môn học chưa có mô tả.');
    const rawCount = Number(s.question_count ?? s.questions_count ?? s.count);
    const countText = Number.isFinite(rawCount) ? `${rawCount} câu` : '— câu';
    const status = s.is_active === false ? 'Tạm ẩn' : countText;
    const chosen = pickedCode === s.code;
    const isNew = isNewSubject(s);
    const newBadge = isNew ? '<span class="subjectNewBadge">NEW</span>' : '';
    // Mô tả bị kẹp 3 dòng bằng CSS (.subjectCardDesc). Đưa nguyên văn vào `title` để mô tả dài
    // vẫn đọc được khi hover, thay vì mất hẳn phần bị cắt.
    return `<button class="subjectCard ${chosen ? 'active' : ''} ${isNew ? 'hasNewBadge' : ''}" data-code="${esc2(rawCode)}" type="button" title="${code} - ${name} - ${countText}&#10;${desc}">
      ${newBadge}
      <span class="subjectCardCode"><span>${code}</span></span>
      <span class="subjectCardTitle">${name}</span>
      <span class="subjectCardDesc">${desc}</span>
      <span class="subjectMeta">
        <span>${status}</span>
        <span class="subjectChoose">${chosen ? 'Đã chọn' : 'Chọn môn'}</span>
      </span>
    </button>`;
  }
  function applyPicked() {
    if ($('subjectPickedText')) $('subjectPickedText').textContent = pickedCode ? label(pickedCode) : 'Chưa chọn môn';
    if ($('subjectEnter')) $('subjectEnter').disabled = !pickedCode;
    document.querySelectorAll('.subjectCard').forEach(x => {
      const active = x.dataset.code === pickedCode;
      x.classList.toggle('active', active);
      x.setAttribute('aria-pressed', active ? 'true' : 'false');
      const choose = x.querySelector('.subjectChoose');
      if (choose) choose.textContent = active ? 'Đã chọn' : 'Chọn môn';
    });
  }
  /**
   * SUBJECT_GROUP_BY_BASE_20260728: gom các môn cùng mã gốc thành một cụm, giữ nguyên thứ tự
   * `sort_order` của server — cụm được neo tại vị trí thành viên ĐẦU TIÊN xuất hiện, nên
   * không có môn nào bị nhảy lên/xuống so với trước. Cụm chỉ 1 môn thì trả về thẻ trần
   * (không bọc gì) để danh sách không mọc thêm khung vô ích.
   */
  function groupByBase(arr) {
    const byBase = new Map();
    const order = [];
    arr.forEach(s => {
      const b = baseCode(s.code);
      if (!byBase.has(b)) {
        byBase.set(b, []);
        order.push(b);
      }
      byBase.get(b).push(s);
    });
    return order.map(b => ({ base: b, items: byBase.get(b) }));
  }
  function groupTotal(g) {
    // Số câu cộng từ đúng các môn ĐANG HIỆN, để khi đang tìm kiếm thì con số khớp với thẻ thấy được.
    return g.items.reduce((n, s) => n + countOf(s), 0);
  }
  /**
   * SUBJECT_FOLDER_DRILLDOWN_20260728 (thay khung `.subjectGroup` mở sẵn của
   * SUBJECT_GROUP_BY_BASE_20260728): cụm ≥2 môn hiện thành MỘT thẻ thư mục cỡ bằng thẻ môn.
   * Bấm vào mới sổ ra các môn con (`openBase`), có thanh "← Tất cả môn" để lùi ra.
   * Nhờ vậy danh sách ngoài cùng luôn là lưới 4 cột đều nhau, không còn khung cao chiếm cả hàng.
   */
  function folderHTML(g) {
    const total = groupTotal(g);
    // SUBJECT_FOLDER_NEW_BADGE_20260729: cờ NEW của chính thư mục (admin bật riêng), KHÔNG phải
    // "có môn con nào bật NEW hay không". Môn con vẫn có NEW riêng của nó ở thẻ bên trong.
    const isNew = isNewFolder(g.base);
    const holdsPicked = g.items.some(s => s.code === pickedCode);
    const names = esc2(g.items.map(s => displayCode(s.code)).join(' · '));
    // `&#10;` phải là thực thể THÔ (xuống dòng trong tooltip) — ghép sau khi đã esc2 từng phần,
    // esc2 cả chuỗi thì dấu & bị đổi thành &amp; và tooltip hiện đúng chữ "&#10;".
    const title = `${esc2(g.base)} — ${g.items.length} môn · ${total} câu&#10;${names}`;
    return `<button class="subjectFolderCard${isNew ? ' hasNewBadge' : ''}${holdsPicked ? ' holdsPicked' : ''}" type="button" data-folder="${esc2(g.base)}" title="${title}">
      ${isNew ? '<span class="subjectNewBadge">NEW</span>' : ''}
      <span class="subjectCardCode"><span>${esc2(g.base)}</span></span>
      <span class="subjectFolderTag">${g.items.length} môn</span>
      <span class="subjectFolderNames">${names}</span>
      <span class="subjectMeta">
        <span>${total.toLocaleString('vi-VN')} câu</span>
        <span class="subjectChoose subjectFolderOpen">Mở ▸</span>
      </span>
    </button>`;
  }
  /**
   * SUBJECT_FOLDER_BAR_IN_TABS_20260729: thanh thư mục KHÔNG còn chiếm một hàng riêng của lưới.
   * Nút "← Tất cả môn" + mã gốc chèn vào `.subjectGateTabsLeft` (cạnh tab "Danh sách môn học"),
   * còn "N môn · M câu" nằm bên phải ô tìm kiếm — cả hàng là một khối, danh sách môn được thêm
   * ~65px chiều cao. Hai ô này do `ensureSubjectGateTabs()` (appCore) dựng thanh tab nên phải
   * tạo LAZY: thanh tab có thể chưa tồn tại ở lần render đầu.
   * Còn `folderBarHTML` làm bản dự phòng khi chưa có thanh tab, để nút lùi ra không bao giờ mất.
   */
  function folderBarHTML(g) {
    return `<div class="subjectFolderBar">
      <button class="subjectFolderBack" type="button" data-folder-back="1">← Tất cả môn</button>
      <span class="subjectFolderBarCode">${esc2(g.base)}</span>
      <span class="subjectFolderBarMeta">${g.items.length} môn · ${groupTotal(g).toLocaleString('vi-VN')} câu</span>
    </div>`;
  }
  function tabsBar() {
    return document.getElementById('subjectGateTabsBar');
  }
  function folderCrumbHost() {
    const bar = tabsBar();
    if (!bar) return null;
    let host = $('subjectFolderCrumb');
    if (!host) {
      host = document.createElement('div');
      host.id = 'subjectFolderCrumb';
      host.className = 'subjectFolderCrumb hidden';
      (bar.querySelector('.subjectGateTabsLeft') || bar).appendChild(host);
    }
    return host;
  }
  function folderMetaHost() {
    const bar = tabsBar();
    if (!bar) return null;
    let host = $('subjectFolderCrumbMeta');
    if (!host) {
      host = document.createElement('span');
      host.id = 'subjectFolderCrumbMeta';
      host.className = 'subjectFolderCrumbMeta hidden';
      bar.appendChild(host);
    }
    return host;
  }
  /** Vẽ thanh thư mục vào hàng tab. Trả về true nếu đã vẽ được (khỏi vẽ bản trong lưới). */
  function syncFolderCrumb(g) {
    const crumb = folderCrumbHost();
    const meta = folderMetaHost();
    if (!crumb || !meta) return false;
    crumb.classList.toggle('hidden', !g);
    meta.classList.toggle('hidden', !g);
    if (!g) {
      crumb.innerHTML = '';
      meta.textContent = '';
      return true;
    }
    crumb.innerHTML = `<button class="subjectFolderBack" type="button" data-folder-back="1">← Tất cả môn</button>
      <span class="subjectFolderBarCode">${esc2(g.base)}</span>`;
    meta.textContent = `${g.items.length} môn · ${groupTotal(g).toLocaleString('vi-VN')} câu`;
    return true;
  }
  function renderSubjects() {
    const list = $('subjectList');
    if (!list) return;
    const q = ($('subjectSearch')?.value || '').trim().toLowerCase();
    const arr = subjectsCache.filter(
      s => !q || `${s.code || ''} ${s.name || ''} ${s.description || ''}`.toLowerCase().includes(q),
    );
    const groups = groupByBase(arr);
    // Đang tìm kiếm thì bỏ qua thư mục, trải phẳng kết quả — vào đúng việc của ô tìm kiếm.
    // Xóa ô tìm kiếm thì quay lại đúng thư mục đang mở (openBase giữ nguyên).
    const openGroup = q ? null : groups.find(g => g.base === openBase && g.items.length > 1) || null;
    if (!q && !openGroup) openBase = '';
    list.classList.toggle('inFolder', !!openGroup);
    // Thanh thư mục ưu tiên nằm trong hàng tab; chỉ khi chưa có thanh tab mới vẽ vào lưới.
    const crumbDone = syncFolderCrumb(openGroup);
    document.body.classList.toggle('lh-in-subject-folder', !!openGroup && crumbDone);
    if (q) list.innerHTML = arr.map(card).join('');
    else if (openGroup)
      list.innerHTML = (crumbDone ? '' : folderBarHTML(openGroup)) + openGroup.items.map(card).join('');
    else list.innerHTML = groups.map(g => (g.items.length < 2 ? g.items.map(card).join('') : folderHTML(g))).join('');
    $('subjectEmpty')?.classList.toggle('hidden', !!arr.length);
    list.querySelectorAll('.subjectCard').forEach(
      x =>
        (x.onclick = () => {
          pickedCode = x.dataset.code;
          applyPicked();
        }),
    );
    list.querySelectorAll('.subjectFolderCard').forEach(
      x =>
        (x.onclick = () => {
          openBase = x.dataset.folder || '';
          renderSubjects();
          list.scrollTop = 0;
        }),
    );
    // Nút lùi ra có thể ở trong lưới (bản dự phòng) HOẶC trong hàng tab — bắt cả hai chỗ.
    document.querySelectorAll('#subjectGate [data-folder-back]').forEach(
      x =>
        (x.onclick = () => {
          openBase = '';
          renderSubjects();
          list.scrollTop = 0;
        }),
    );
    applyPicked();
  }
  let lastRefreshTime = 0;
  /**
   * `autoOpenPickedFolder` chỉ bật khi MỞ cổng chọn môn (openGate) — lúc đó mở sẵn thư mục
   * chứa môn đang học là tiện. Nút "Tải lại" thì KHÔNG: trước đây nó cũng tính lại `openBase`
   * theo môn đang học nên đang đứng ở "Tất cả môn" mà bấm Tải lại là bị nhảy vào thư mục
   * MLN122 (SUBJECT_REFRESH_KEEP_FOLDER_20260729). Giữ đúng chỗ người dùng đang đứng.
   */
  async function refreshSubjects(force = false, autoOpenPickedFolder = false) {
    const now = Date.now();
    if (!force && now - lastRefreshTime < 2000) {
      return;
    }
    lastRefreshTime = now;
    if (!logged()) return;
    clearErr();
    showLoading(true);
    try {
      subjectsCache = await getSubjects();
      if (!pickedCode && subjectCode()) pickedCode = subjectCode();
      if (!pickedCode && subjectsCache[0]) pickedCode = subjectsCache[0].code;
      if (autoOpenPickedFolder) {
        const pickedBase = baseCode(pickedCode);
        openBase = subjectsCache.filter(s => baseCode(s.code) === pickedBase).length > 1 ? pickedBase : '';
      } else if (openBase && subjectsCache.filter(s => baseCode(s.code) === openBase).length < 2) {
        // Thư mục đang mở vừa biến mất sau khi tải lại (bị xoá / còn 1 môn) thì lùi ra ngoài.
        openBase = '';
      }
      renderSubjects();
      syncSubjectTexts();
    } finally {
      showLoading(false);
    }
  }
  let lastOpenGateTime = 0;
  function openGate(force = false) {
    const now = Date.now();
    if (!force && now - lastOpenGateTime < 1000) {
      return;
    }
    lastOpenGateTime = now;
    if (!logged()) return;
    localStorage.setItem('learninghub_subject_gate_open_v1', 'true');
    syncGateUserInfo();
    gateOn(true);
    closeAccountMenu();
    refreshSubjects(true, true);
  }
  function closeGate() {
    localStorage.setItem('learninghub_subject_gate_open_v1', 'false');
    gateOn(false);
  }
  async function loadBySubject(code) {
    if (!code) return false;
    syncUserSubjectToProfile(code);
    // ACCESS_GATE_STRICT_20260726: fail-closed, không có profile hợp lệ thì không gọi /api/questions.
    if (!window.lhHasFullAccess?.(window.HODSupabase?.getProfile?.() || null)) return false;
    try {
      const res = await fetch('/api/questions?subject_code=' + encodeURIComponent(code) + '&ts=' + Date.now(), {
        cache: 'no-store',
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.error) throw new Error(json.error || 'Không tải được questions từ Turso');
      const data = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
      LHState.RAW = data.map(r => ({
        id: r.id,
        subject_code: r.subject_code || code,
        num: r.num,
        question: r.question,
        options: r.options || {},
        answer: r.answer,
        answer_text: r.answer_text,
        // `cleanImages` KHÔNG hề tồn tại ở phạm vi này — cũng chưa bao giờ tồn tại ở tầng module
        // appCore (chỗ khai báo duy nhất là hàm local trong block FINAL_URL_ONLY_IMAGES).
        // Nhánh `typeof` vì vậy LUÔN sai, ở đây và ở bản cũ trong appCore y như nhau: câu tải
        // theo đường này chưa bao giờ được lọc ảnh. GIỮ NGUYÊN — đổi sang `window.cleanImages`
        // là đổi hành vi, phải làm ở commit riêng cùng 3 chỗ còn lại (xem CLAUDE.md "Việc còn nợ").
        images: typeof cleanImages === 'function' ? cleanImages(r.images || []) : r.images || [],
        has_image: !!(r.has_image || (r.images || []).length),
        error_risk: r.error_risk || 'low',
        error_risk_reason: r.error_risk_reason || '',
        __imagesChecked: true,
        __imagesLoaded: true,
      }));
      LHState.pool = [...LHState.RAW];
      var _saved = +localStorage.getItem('learninghub_progress_' + code) || 0;
      LHState.ci = Math.max(0, Math.min(_saved, Math.max(0, LHState.pool.length - 1)));
      LHState.flipped = false;
      if ($('idx')) $('idx').textContent = LHState.pool.length ? String(LHState.ci + 1) : '0';
      if ($('total')) $('total').textContent = String(LHState.pool.length);
      updateBrand(code);
      syncSubjectTexts();
      // FIX_20260705: xóa trạng thái bài kiểm tra của môn trước để tab Kiểm tra không hiện đề cũ.
      try {
        if (typeof window.__examResetForSubjectChange === 'function') window.__examResetForSubjectChange();
      } catch (e) {
        lhWarn('LEARNING_HUB_MERGED_SUBJECT_PATCH', e);
      }
      // Ba render, mỗi hàm một `try` riêng (như renderAllSafe của appCore) — gộp lại thì
      // renderCard lỗi là thư viện không được vẽ lại. Phải đọc `window.*` LÚC GỌI: cả ba tên
      // đều bị xếp lớp (renderCard 3 lớp trong appCore, renderQuiz ở exam.js, renderStudy ở
      // library.js) và không có tên nào ở phạm vi file này — gọi trần là ném ReferenceError,
      // bị lhWarn nuốt, và đổi môn xong cả ba tab đều giữ nội dung môn cũ.
      try {
        window.renderCard?.();
      } catch (e) {
        lhWarn('LEARNING_HUB_MERGED_SUBJECT_PATCH', e);
      }
      try {
        window.renderQuiz?.();
      } catch (e) {
        lhWarn('LEARNING_HUB_MERGED_SUBJECT_PATCH', e);
      }
      try {
        window.renderStudy?.();
      } catch (e) {
        lhWarn('LEARNING_HUB_MERGED_SUBJECT_PATCH', e);
      }
      notifyUX('Đã tải ' + label(code));
      return true;
    } catch (e) {
      console.warn('[Turso loadBySubject]', e);
      notifyUX('Không tải được dữ liệu môn học từ Turso.');
      return false;
    }
  }

  async function enterSubject() {
    if (!pickedCode) return;
    const btn = $('subjectEnter');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Đang tải...';
    }
    try {
      setSubject(pickedCode);
      closeGate();
      let ok = false;
      if (typeof window.loadCurrentSubjectOnly === 'function') {
        ok = await window.loadCurrentSubjectOnly(true);
      }
      if (!ok) {
        ok = await loadBySubject(pickedCode);
      }
    } catch (e) {
      console.error('[enterSubject]', e);
      notifyUX('Không thể chuyển môn: ' + (e.message || e));
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Bắt đầu →';
      }
    }
  }
  async function logoutGate() {
    closeGate();
    setSubject('');
    await window.HODSupabase?.signOut?.();
  }
  function patchSubmit() {
    if (window.__hubPatchSubmitMerged || !window.HODSupabase?.submitEditRequest) return;
    window.__hubPatchSubmitMerged = true;
    const old = window.HODSupabase.submitEditRequest.bind(window.HODSupabase);
    window.HODSupabase.submitEditRequest = async function (newDraft, oldQ) {
      if (oldQ?.id) return old(newDraft, oldQ);
      const supa = c();
      const code = oldQ?.subject_code || subjectCode();
      const num = oldQ?.num;
      if (supa && code && num) {
        const { data, error } = await supa
          .from('questions')
          .select('id,subject_code')
          .eq('subject_code', code)
          .eq('num', num)
          .maybeSingle();
        if (!error && data) oldQ = { ...oldQ, id: data.id, subject_code: data.subject_code || code };
      }
      return old(newDraft, oldQ);
    };
  }
  /*
    patchSave() ĐÃ XÓA (20260727) — 91 dòng. Nó bọc saveEditor (chết vì apply() của
    LIBRARY_FILTER_AND_EDIT_PREVIEW_LAYOUT ghi đè ở mốc 900ms) rồi gán #saveEdit.onclick
    (id đó bị openEditPreview xóa khỏi DOM). Nhánh "admin/editor lưu trực tiếp qua
    /api/admin-action" và nhánh "người thường gửi submitEditRequest" bên trong nó đều đã có
    trong saveEditPreview. patchSubmit() ngay trên vẫn SỐNG, đừng lẫn hai cái.
  */
  function patchSignOut() {
    if (window.__hubPatchSignoutMerged || !window.HODSupabase?.signOut) return;
    window.__hubPatchSignoutMerged = true;
    const old = window.HODSupabase.signOut.bind(window.HODSupabase);
    window.HODSupabase.signOut = async function () {
      setSubject('');
      return old();
    };
  }
  function ensureChangeBtn() {
    if (!$('hodChangeSubjectBtn')) return;
    $('hodChangeSubjectBtn').onclick = e => {
      e?.preventDefault?.();
      openGate(true);
    };
  }
  function isApproved() {
    return !!window.lhHasFullAccess?.(window.HODSupabase?.getProfile?.() || null);
  }
  function bind() {
    ensureChip();
    ensureChangeBtn();
    patchSubmit();
    patchSignOut();
    syncSubjectTexts();
    $('subjectRefresh')?.addEventListener('click', () => refreshSubjects(true));
    $('subjectSearch')?.addEventListener('input', renderSubjects);
    $('subjectEnter')?.addEventListener('click', enterSubject);
    $('subjectLogout')?.addEventListener('click', logoutGate);

    // Bỏ tự kiểm tra/tự tải môn học liên tục.
    // Chỉ tải môn đã chọn 1 lần khi mở web. Danh sách môn chỉ tải khi người dùng mở bảng chọn môn hoặc bấm Tải lại.
    const runSubjectCheckOnce = () => {
      if (window.__LHCheckedOnce) return;
      if (!logged() || !isApproved()) return;
      window.__LHCheckedOnce = true;
      syncSubjectTexts();
      const isGateOpen = localStorage.getItem('learninghub_subject_gate_open_v1') === 'true';
      if (subjectCode() && !isGateOpen) {
        syncUserSubjectToProfile(subjectCode());
        loadBySubject(subjectCode());
      } else {
        openGate();
      }
    };

    window.__LHTriggerSubjectCheck = runSubjectCheckOnce;
    runSubjectCheckOnce();
    setTimeout(runSubjectCheckOnce, 800);
  }
  window.getSubjectsCache = () => subjectsCache;
  window.loadBySubject = loadBySubject;
  window.setSubject = setSubject;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
}
// ===== LEARNING HUB MERGED SUBJECT PATCH END =====

// ===== FIX_ARIA_HIDDEN_SUBJECT_GATE_20260629 =====
// Fix warning: Blocked aria-hidden because focused button stayed inside #subjectGate.
export function installGateAriaFix() {
  if (window.__FIX_ARIA_HIDDEN_SUBJECT_GATE_20260629) return;
  window.__FIX_ARIA_HIDDEN_SUBJECT_GATE_20260629 = true;
  function blurInsideGate() {
    const gate = document.getElementById('subjectGate');
    const active = document.activeElement;
    if (gate && active && gate.contains(active)) {
      try {
        active.blur();
      } catch (e) {
        lhWarn('FIX_ARIA_HIDDEN_SUBJECT_GATE_20260629', e);
      }
    }
  }
  function patchGate() {
    const gate = document.getElementById('subjectGate');
    if (!gate || gate.__ariaFocusPatch) return;
    gate.__ariaFocusPatch = true;
    const obs = new MutationObserver(() => {
      if (gate.classList.contains('hidden') || gate.getAttribute('aria-hidden') === 'true') blurInsideGate();
    });
    obs.observe(gate, { attributes: true, attributeFilter: ['class', 'aria-hidden'] });
  }
  ['click', 'pointerdown', 'mousedown', 'touchstart'].forEach(ev => {
    document.addEventListener(
      ev,
      e => {
        if (
          e.target &&
          e.target.closest &&
          e.target.closest('#subjectEnter,#subjectLogout,#subjectGate .close,#subjectGate [data-close]')
        ) {
          setTimeout(blurInsideGate, 0);
        }
      },
      true,
    );
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', patchGate);
  else patchGate();
  setTimeout(patchGate, 500);
}
// ===== END FIX_ARIA_HIDDEN_SUBJECT_GATE_20260629 =====

// ===== SUBJECT_COUNTS_ONCE_CACHE_20260629 =====
// Hiện số câu từng môn theo kiểu tiết kiệm:
// - Lần đầu trong trình duyệt mới đếm các môn chưa có cache.
// - F5/load lại dùng localStorage, không query lại.
// - Khi realtime báo questions/subjects đổi thì đánh dấu dirty, lần sau mới cập nhật lại.
export function installSubjectCountsCache() {
  if (window.__SUBJECT_COUNTS_ONCE_CACHE_20260629) return;
  window.__SUBJECT_COUNTS_ONCE_CACHE_20260629 = true;

  const STORE = 'learninghub_subject_counts_cache_v3';
  const DIRTY = 'learninghub_subject_counts_dirty_v3';
  const pending = new Set();

  function client() {
    return window.HODSupabase?.__client || null;
  }
  function user() {
    return window.HODSupabase?.getUser?.() || null;
  }
  function activeSubject() {
    return localStorage.getItem('learninghub_subject_code_merged_v1') || '';
  }
  function cssEscape(s) {
    try {
      return CSS.escape(String(s));
    } catch (e) {
      return String(s).replace(/"/g, '\\"');
    }
  }
  function read() {
    try {
      return JSON.parse(localStorage.getItem(STORE) || '{}') || {};
    } catch (e) {
      return {};
    }
  }
  function write(data) {
    try {
      localStorage.setItem(STORE, JSON.stringify(data || {}));
    } catch (e) {
      lhWarn('SUBJECT_COUNTS_ONCE_CACHE_20260629', e);
    }
  }
  function dirty() {
    return localStorage.getItem(DIRTY) === '1';
  }
  function setDirty(on = true) {
    try {
      on ? localStorage.setItem(DIRTY, '1') : localStorage.removeItem(DIRTY);
    } catch (e) {
      lhWarn('SUBJECT_COUNTS_ONCE_CACHE_20260629', e);
    }
  }
  function ensureStore() {
    const x = read();
    x.counts = x.counts || {};
    x.confirmed = x.confirmed || {};
    x.updated_at = x.updated_at || '';
    return x;
  }
  function localCount(code) {
    try {
      const active = activeSubject();
      if (active === code && Array.isArray(LHState.RAW) && LHState.RAW.length) return LHState.RAW.length;
      if (Array.isArray(LHState.RAW)) {
        const n = LHState.RAW.filter(q => (q.subject_code || active) === code).length;
        return n > 0 ? n : null;
      }
    } catch (e) {
      lhWarn('SUBJECT_COUNTS_ONCE_CACHE_20260629', e);
    }
    return null;
  }
  function setCardCount(code, n) {
    const count = Number(n || 0);
    document.querySelectorAll('.subjectCard[data-code="' + cssEscape(code) + '"]').forEach(card => {
      const meta = card.querySelector('.subjectMeta span:first-child');
      if (meta) meta.textContent = count + ' câu';
      card.title = (card.title || code).replace(/(?:\d+|—) câu/g, count + ' câu');
    });
  }
  function paint() {
    const store = ensureStore();
    document.querySelectorAll('.subjectCard[data-code]').forEach(card => {
      const code = card.dataset.code;
      const n = localCount(code);
      if (Number.isFinite(Number(n)) && Number(n) > 0) {
        setCardCount(code, Number(n));
        return;
      }
      if (store.confirmed[code]) setCardCount(code, Number(store.counts[code] || 0));
    });
  }
  let _countsMap = null,
    _countsAt = 0;
  async function tursoCounts(force) {
    const now = Date.now();
    if (!force && _countsMap && now - _countsAt < 60000) return _countsMap;
    try {
      const res = await fetch('/api/subjects?ts=' + now, { cache: 'no-store' });
      const j = await res.json().catch(() => ({}));
      rememberFolderNewBadges(j); // SUBJECT_FOLDER_NEW_BADGE_20260729
      const map = {};
      (j.data || []).forEach(r => {
        map[String(r.code || '').toUpperCase()] = Number(r.question_count ?? r.questions_count ?? r.count ?? 0);
      });
      _countsMap = map;
      _countsAt = now;
      return map;
    } catch (e) {
      console.warn('[subject count Turso]', e);
      return _countsMap || {};
    }
  }
  async function countOne(code) {
    if (!code) return null;
    const map = await tursoCounts();
    const v = map[String(code).toUpperCase()];
    return v === undefined || v === null ? null : Number(v);
  }
  async function refresh(force = false) {
    if (!user()) return;
    const prof = window.HODSupabase?.getProfile?.() || null;
    if (prof && (prof.approved === false || prof.approved === 0 || prof.approved === '0')) return;
    const cards = [...document.querySelectorAll('.subjectCard[data-code]')];
    if (!cards.length) return;
    const store = ensureStore();
    const must = force || dirty();

    paint();

    const codes = cards.map(card => card.dataset.code).filter(Boolean);
    const need = codes.filter(code => {
      const n = localCount(code);
      if (Number.isFinite(Number(n)) && Number(n) > 0) return false;
      return must || !store.confirmed[code];
    });
    if (!need.length) return;

    for (const code of need) {
      if (pending.has(code)) continue;
      pending.add(code);
      const n = await countOne(code);
      if (n !== null) {
        store.counts[code] = n;
        store.confirmed[code] = true;
        store.updated_at = new Date().toISOString();
        write(store);
        setCardCount(code, n);
      }
      pending.delete(code);
    }
    setDirty(false);
  }

  const oldClear = window.clearLearningHubSupabaseCache;
  window.clearLearningHubSupabaseCache = function (kind) {
    if (!kind || kind === 'all' || kind === 'questions' || kind === 'subjects') setDirty(true);
    return typeof oldClear === 'function' ? oldClear.apply(this, arguments) : undefined;
  };

  window.refreshSubjectCountsOnce = function () {
    return refresh(true);
  };

  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(paint, 300);
    setTimeout(() => refresh(false), 1200);
    setTimeout(() => refresh(false), 2600);
  });
  document.addEventListener(
    'click',
    e => {
      if (e.target.closest('#subjectRefresh')) setTimeout(() => refresh(true), 600);
      if (e.target.closest('#hodChangeSubjectBtn,#subjectTopChip')) {
        setTimeout(paint, 300);
        setTimeout(() => refresh(false), 1200);
        setTimeout(() => refresh(false), 2600);
      }
    },
    true,
  );
}
// ===== END SUBJECT_COUNTS_ONCE_CACHE_20260629 =====

// ===== CLEAR_ADD_SUBJECT_DRAFT_NEW_SESSION_20260629 =====
// Phiên đăng nhập mới: xóa toàn bộ dữ liệu nháp ở phần Thêm môn để người dùng điền lại từ đầu.
export function installClearAddSubjectDraft() {
  const KEYS = [
    'learninghub_add_subject_code_v1',
    'learninghub_add_subject_name_v1',
    'learninghub_add_subject_desc_v1',
    'learninghub_add_subject_step_v1',
    'learninghub_add_subject_file_name_v1',
    'learninghub_add_subject_file_size_v1',
    'learninghub_add_subject_file_data_v1',
    'learninghub_add_subject_file_previewed_v1',
  ];
  const SESSION_KEY = 'learninghub_add_subject_draft_cleared_for_user_v1';

  function clearAddSubjectDraft() {
    try {
      KEYS.forEach(k => localStorage.removeItem(k));
    } catch (e) {
      lhWarn('CLEAR_ADD_SUBJECT_DRAFT_NEW_SESSION_20260629', e);
    }
    try {
      localStorage.setItem('learninghub_subject_gate_tab_v1', 'list');
    } catch (e) {
      lhWarn('CLEAR_ADD_SUBJECT_DRAFT_NEW_SESSION_20260629', e);
    }

    const ids = ['addSubjectCode', 'addSubjectName', 'addSubjectDesc', 'userImportData', 'userImportFile'];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });

    const card = document.getElementById('userImportFileCard');
    const dz = document.getElementById('importDropZone');
    const pv = document.getElementById('previewImportBtn');
    const preview = document.getElementById('userImportPreview');
    if (card) card.classList.add('hidden');
    if (dz) dz.classList.remove('hidden');
    if (pv) {
      pv.classList.add('hidden');
      pv.disabled = true;
    }
    if (preview) preview.innerHTML = '';
  }

  function currentUserId() {
    try {
      return window.HODSupabase?.getUser?.()?.id || '';
    } catch (e) {
      return '';
    }
  }

  function clearOnceForCurrentLogin() {
    const uid = currentUserId();
    if (!uid) return;
    let cleared = '';
    try {
      cleared = sessionStorage.getItem(SESSION_KEY) || '';
    } catch (e) {
      lhWarn('CLEAR_ADD_SUBJECT_DRAFT_NEW_SESSION_20260629', e);
    }
    if (cleared === uid) return;
    clearAddSubjectDraft();
    try {
      sessionStorage.setItem(SESSION_KEY, uid);
    } catch (e) {
      lhWarn('CLEAR_ADD_SUBJECT_DRAFT_NEW_SESSION_20260629', e);
    }
  }

  function patchAuthMethods() {
    const api = window.HODSupabase;
    if (!api || api.__clearAddSubjectDraftPatched) return;

    if (typeof api.signInGoogle === 'function') {
      const oldGoogle = api.signInGoogle.bind(api);
      api.signInGoogle = async function () {
        clearAddSubjectDraft();
        try {
          sessionStorage.removeItem(SESSION_KEY);
        } catch (e) {
          lhWarn('CLEAR_ADD_SUBJECT_DRAFT_NEW_SESSION_20260629', e);
        }
        return oldGoogle.apply(this, arguments);
      };
    }

    if (typeof api.signOut === 'function') {
      const oldSignOut = api.signOut.bind(api);
      api.signOut = async function () {
        clearAddSubjectDraft();
        try {
          sessionStorage.removeItem(SESSION_KEY);
        } catch (e) {
          lhWarn('CLEAR_ADD_SUBJECT_DRAFT_NEW_SESSION_20260629', e);
        }
        return oldSignOut.apply(this, arguments);
      };
    }

    api.__clearAddSubjectDraftPatched = true;
  }

  function tick() {
    patchAuthMethods();
    clearOnceForCurrentLogin();
  }

  window.__clearAddSubjectDraft = clearAddSubjectDraft;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tick);
  else tick();
  setTimeout(tick, 500);
  setTimeout(tick, 1600);
  setInterval(tick, 2500);
}
// ===== END CLEAR_ADD_SUBJECT_DRAFT_NEW_SESSION_20260629 =====

// ===== TURSO_SUBJECT_COUNTS_FALLBACK_20260630 =====
// Fix: user mới chưa có cache thì thẻ môn không bị hiện 0 câu; nếu /api/subjects thiếu count sẽ tự đếm từ /api/questions một lần.
export function installSubjectCountsFallback() {
  if (window.__TURSO_SUBJECT_COUNTS_FALLBACK_20260630) return;
  window.__TURSO_SUBJECT_COUNTS_FALLBACK_20260630 = true;

  const STORE = 'learninghub_subject_counts_cache_v3';
  let loading = false;

  function readStore() {
    try {
      return JSON.parse(localStorage.getItem(STORE) || '{}') || {};
    } catch (e) {
      return {};
    }
  }
  function writeCounts(counts) {
    try {
      localStorage.setItem(STORE, JSON.stringify({ counts: counts || {}, confirmed: counts || {}, at: Date.now() }));
    } catch (e) {
      lhWarn('TURSO_SUBJECT_COUNTS_FALLBACK_20260630', e);
    }
  }
  function norm(code) {
    return String(code || '')
      .trim()
      .toUpperCase();
  }

  async function fetchCounts() {
    if (loading) return null;
    if (!window.HODSupabase?.getUser?.()) return null;
    const prof = window.HODSupabase?.getProfile?.();
    if (prof && (prof.approved === false || prof.approved === 0 || prof.approved === '0')) return null;
    loading = true;
    try {
      const res = await fetch('/api/questions?count_only=1&ts=' + Date.now(), { cache: 'no-store' });
      const json = await res.json().catch(() => ({}));
      const rows = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
      const counts = {};
      rows.forEach(q => {
        const code = norm(q.subject_code);
        const n = Number(q.question_count ?? q.questions_count ?? q.count ?? 1);
        if (code) counts[code] = (counts[code] || 0) + (Number.isFinite(n) && n > 0 ? n : 1);
      });
      writeCounts(counts);
      return counts;
    } catch (e) {
      console.warn('[Turso counts fallback]', e);
      return null;
    } finally {
      loading = false;
    }
  }

  function applyCountsToCards(counts) {
    if (!counts) return;
    document.querySelectorAll('.subjectCard').forEach(card => {
      const code = norm(card.dataset.code || card.getAttribute('data-code'));
      if (!code || counts[code] == null) return;
      const meta = card.querySelector('.subjectMeta span');
      if (meta) meta.textContent = Number(counts[code] || 0) + ' câu';
    });
  }

  async function refreshZeroCounts() {
    const cards = Array.from(document.querySelectorAll('.subjectCard'));
    if (!cards.length) return;
    const hasZero = cards.some(card => /(^|\s)0\s*câu/i.test(card.textContent || ''));
    if (!hasZero) return;
    const store = readStore();
    if (store.counts) applyCountsToCards(store.counts);
    const counts = await fetchCounts();
    applyCountsToCards(counts);
  }

  // MÃ CHẾT TỪ TRƯỚC, GIỮ NGUYÊN: `renderSubjects` là hàm local của installSubjectGate (~307),
  // chưa bao giờ ở tầng module appCore — trong bản cũ block này cũng là một IIFE riêng nên
  // `typeof renderSubjects` đã luôn ra 'undefined'. Tức `oldRenderSubjects` luôn null, cả khối
  // `if` dưới đây (kể cả dòng `renderSubjects = fn`) CHƯA BAO GIỜ chạy → refreshZeroCounts chỉ
  // được gọi qua hai setTimeout trong DOMContentLoaded ở dưới. `npm run find renderSubjects` in
  // dòng 979 là "● SỐNG" — sai, nó không mô phỏng được điều kiện `if`.
  // Đừng đổi thành `window.renderSubjects` cho "gọn": đó là BẬT một lớp ghi đè đang tắt.
  const oldRenderSubjects = typeof renderSubjects === 'function' ? renderSubjects : null;
  if (oldRenderSubjects && !oldRenderSubjects.__tursoCountsFallback) {
    const fn = function () {
      const out = oldRenderSubjects.apply(this, arguments);
      setTimeout(refreshZeroCounts, 80);
      return out;
    };
    fn.__tursoCountsFallback = true;
    window.renderSubjects = renderSubjects = fn;
  }

  document.addEventListener('DOMContentLoaded', function () {
    setTimeout(refreshZeroCounts, 600);
    setTimeout(refreshZeroCounts, 1800);
  });
}
// ===== END TURSO_SUBJECT_COUNTS_FALLBACK_20260630 =====
