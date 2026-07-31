/**
 * Flashcard: hiệu ứng hạt nền + nút "Báo cáo đã gửi" + điều hướng trên điện thoại —
 * tách khỏi appCore ngày 20260731.
 *
 * Ba block nguyên văn từ appCore (cũ 2455–3144): FINAL_FLOATING_PARTICLES_CANVAS_20260613,
 * FINAL_REPORT_BUTTON_OPEN_TAB_20260613, MOBILE_FLASHCARD_NAVIGATION_20260702. Đây là bản
 * ĐANG CHẠY — bản cũ trong appCore đã xóa, chỉ còn ba lời gọi install*() đúng chỗ ba block
 * cũ đứng (thứ tự chạy phải giữ nguyên, xem docs/SPLIT_PLAN.md mục 2).
 *
 * Chỉ đổi những chỗ BUỘC phải đổi vì sang file khác — mọi chú thích gốc giữ nguyên:
 *
 * - `$` -> khai báo lại tại chỗ (appCore có `const $` riêng ở tầng module).
 * - `prev` / `next` -> `window.prev` / `window.next`. Hai hàm này bị
 *   FINAL_IMAGE_NO_FLICKER_HARD_FIX_20260628 bọc thêm một lớp (preload ảnh câu kế); block đó
 *   gán CẢ binding lẫn window nên bản ở window là bản đủ lớp. Viết rõ `window.` cho khỏi
 *   hiểu nhầm là đang đọc binding của appCore — đọc trần ở đây KHÔNG thấy binding đó.
 */
import { lhWarn } from '../core/log.js';

const $ = id => document.getElementById(id);

// ===== FINAL_FLOATING_PARTICLES_CANVAS_20260613 =====
export function installFloatingParticles() {
  let canvas,
    ctx,
    w = 0,
    h = 0,
    dpr = 1,
    parts = [],
    raf = 0,
    uxInterval = 0,
    resizeT = 0,
    running = false;
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function gateActive() {
    const gate = document.getElementById('hodLoginGate');
    return !!gate && !gate.classList.contains('hidden') && getComputedStyle(gate).display !== 'none';
  }
  function ensureCanvas() {
    const gate = document.getElementById('hodLoginGate');
    if (!gate || reduce) return null;
    canvas = document.getElementById('landingParticles');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'landingParticles';
      gate.prepend(canvas);
    }
    ctx = canvas.getContext('2d');
    return gate;
  }
  function resize() {
    if (!canvas || !ctx) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    init();
  }
  function resizeDebounced() {
    clearTimeout(resizeT);
    resizeT = setTimeout(resize, 150);
  }
  function init() {
    // Giảm số hạt tối thiểu trên màn nhỏ (điện thoại) thay vì luôn ép sàn 55 hạt.
    const floorCount = w <= 480 ? 26 : w <= 860 ? 40 : 55;
    const count = Math.min(140, Math.max(floorCount, Math.floor((w * h) / 14000)));
    parts = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 0.7 + Math.random() * 2.4,
      vx: (Math.random() - 0.5) * 0.22,
      vy: -0.1 - Math.random() * 0.42,
      a: 0.18 + Math.random() * 0.55,
      p: Math.random() * Math.PI * 2,
      hue: Math.random() < 0.55 ? '255,255,255' : Math.random() < 0.5 ? '255,226,170' : '135,225,255',
    }));
  }
  function stop() {
    running = false;
    cancelAnimationFrame(raf);
    raf = 0;
    if (uxInterval) {
      clearInterval(uxInterval);
      uxInterval = 0;
    }
  }
  function draw() {
    if (!running) return;
    // Dừng hẳn (không chỉ tạm nghỉ) khi landing gate đã bị ẩn/đóng sau đăng nhập, tránh vòng lặp chạy nền vô thời hạn.
    if (!gateActive()) {
      stop();
      return;
    }
    if (!ctx || document.hidden) {
      raf = requestAnimationFrame(draw);
      return;
    }
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';
    for (const p of parts) {
      p.p += 0.012;
      p.x += p.vx + Math.sin(p.p) * 0.1;
      p.y += p.vy;
      if (p.y < -20) {
        p.y = h + 20;
        p.x = Math.random() * w;
      }
      if (p.x < -30) p.x = w + 30;
      if (p.x > w + 30) p.x = -30;
      const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 7);
      glow.addColorStop(0, `rgba(${p.hue},${p.a})`);
      glow.addColorStop(0.45, `rgba(${p.hue},${p.a * 0.22})`);
      glow.addColorStop(1, `rgba(${p.hue},0)`);
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(${p.hue},${Math.min(1, p.a + 0.15)})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    raf = requestAnimationFrame(draw);
  }
  function ux() {
    if (!gateActive()) {
      stop();
      return;
    }
    const b = document.getElementById('subjectEnter');
    if (b) b.textContent = 'Bắt đầu';
    const i = document.getElementById('subjectSearch');
    if (i) i.placeholder = 'Tìm môn học...';
    const l = document.getElementById('subjectLoading'),
      r = document.getElementById('subjectRefresh');
    if (l && r) {
      const on = !l.classList.contains('hidden');
      r.classList.toggle('is-loading', on);
      r.setAttribute('aria-busy', on ? 'true' : 'false');
    }
  }
  function parallax() {
    const g = document.getElementById('hodLoginGate');
    if (!g || g.__particles3d) return;
    g.__particles3d = true;
    g.addEventListener(
      'pointermove',
      e => {
        const r = g.getBoundingClientRect();
        const x = Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100));
        const y = Math.max(0, Math.min(100, ((e.clientY - r.top) / r.height) * 100));
        g.style.setProperty('--mx', x.toFixed(1) + '%');
        g.style.setProperty('--my', y.toFixed(1) + '%');
      },
      { passive: true },
    );
  }
  function boot() {
    ux();
    parallax();
    if (ensureCanvas()) {
      resize();
      cancelAnimationFrame(raf);
      running = true;
      draw();
      if (!uxInterval) uxInterval = setInterval(ux, 150);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  window.addEventListener('resize', resizeDebounced, { passive: true });
}

// ===== FINAL_REPORT_BUTTON_OPEN_TAB_20260613 =====
// Thay khu vực "Báo cáo đã gửi" trong menu tài khoản thành nút bấm mở tab/modal xem báo cáo.
export function installReportButtonOpenTab() {
  const $ = id => document.getElementById(id);
  const esc = s =>
    String(s ?? '').replace(
      /[&<>"']/g,
      c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );
  const user = () => window.HODSupabase?.getUser?.() || null;

  function ensureReportModal() {
    if ($('hodReportModal')) return;
    const modal = document.createElement('div');
    modal.id = 'hodReportModal';
    modal.className = 'modal hidden hodReportModal';
    modal.innerHTML = `
      <div class="box hodReportModalBox">
        <button class="modalX" id="hodReportModalClose" type="button" title="Đóng">×</button>
        <div class="hodReportModalHead">
          <div>
            <div class="hodReportModalLabel">BÁO CÁO ĐÃ GỬI</div>
            <h2>Danh sách báo cáo</h2>
            <p>Xem trạng thái các báo cáo/chỉnh sửa bạn đã gửi cho admin.</p>
          </div>
          <button id="hodReportModalReload" class="btn" type="button">Tải lại</button>
        </div>
        <div id="hodReportModalList" class="hodReportModalList">Chưa tải.</div>
      </div>`;
    document.body.appendChild(modal);
    $('hodReportModalClose')?.addEventListener('click', () => modal.classList.add('hidden'));
    $('hodReportModalReload')?.addEventListener('click', loadReportModalList);
    modal.addEventListener('mousedown', e => {
      if (e.target === modal) modal.classList.add('hidden');
    });
  }

  function ensureReportButton() {
    const menu = $('hodAccountMenu');
    if (!menu) return;
    let box = $('hodReportBox');
    if (!box) {
      box = document.createElement('div');
      box.id = 'hodReportBox';
      box.className = 'hodReportBox';
      const logout = $('hodLogoutBtn');
      logout ? menu.insertBefore(box, logout) : menu.appendChild(box);
    }
    box.innerHTML = `
      <button id="hodOpenReportsBtn" class="hodOpenReportsBtn" type="button">
        <span>Báo cáo đã gửi</span>
        <b>Xem</b>
      </button>`;
    $('hodOpenReportsBtn')?.addEventListener('click', openReportsTab);
  }

  function statusText(s) {
    return { pending: 'Đang chờ', approved: 'Đã duyệt', rejected: 'Từ chối' }[s] || s || 'Không rõ';
  }
  function statusClass(s) {
    return s === 'approved' ? 'approved' : s === 'rejected' ? 'rejected' : 'pending';
  }

  async function loadReportModalList() {
    ensureReportModal();
    const list = $('hodReportModalList');
    const u = user();
    if (!list) return;
    if (!u) {
      list.innerHTML = '<div class="hodReportEmpty">Đăng nhập để xem báo cáo.</div>';
      return;
    }
    list.innerHTML = '<div class="hodReportEmpty">Đang tải...</div>';
    // FIX_20260726: trước đây đọc thẳng client.from('edit_requests') của Supabase —
    // đường đó đã CHẾT (dữ liệu nằm ở Turso, Supabase chỉ còn dùng để auth) nên
    // danh sách luôn rỗng/lỗi. Dùng chung nguồn với chuông header: /api/my-edit-requests.
    let data = null;
    try {
      const res = await fetch('/api/my-edit-requests?ts=' + Date.now(), { cache: 'no-store' });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || !Array.isArray(out?.data)) throw new Error(out?.error || res.status);
      data = out.data;
    } catch (e) {
      console.warn('[reports] không tải được báo cáo:', e);
      list.innerHTML = '<div class="hodReportEmpty">Không tải được báo cáo.</div>';
      return;
    }
    if (!data || !data.length) {
      list.innerHTML = '<div class="hodReportEmpty">Bạn chưa gửi báo cáo nào.</div>';
      return;
    }
    list.innerHTML = data
      .map(
        r => `
      <div class="hodReportRow">
        <div class="hodReportRowTop">
          <b>Câu ${esc(r.question_num || '?')}</b>
          <span class="hodReportStatus ${statusClass(r.status)}">${esc(statusText(r.status))}</span>
        </div>
        <div class="hodReportTime">Gửi: ${esc(new Date(r.created_at).toLocaleString('vi-VN'))}</div>
        ${r.admin_note ? `<div class="hodReportNote">Ghi chú admin: ${esc(r.admin_note)}</div>` : ''}
      </div>`,
      )
      .join('');
  }

  async function openReportsTab() {
    ensureReportModal();
    $('hodAccountMenu')?.classList.add('hidden');
    $('hodReportModal')?.classList.remove('hidden');
    await loadReportModalList();
  }

  function boot() {
    ensureReportModal();
    ensureReportButton();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  setInterval(ensureReportButton, 700);
}

// ===== MOBILE_FLASHCARD_NAVIGATION_20260702 (viết lại) =====
// Mobile: nút chuyển câu và vuốt trái/phải để đổi flashcard.
//
// Lý do viết lại: bản cũ trượt trực tiếp trên #card — nhưng #card mang class
// "dir-horizontal/dir-up/dir-down" + "flip" để lật thẻ bằng CSS:
//   #fc .card.dir-horizontal.flip{transform:rotateY(180deg) !important}
// Rule này có !important nên bất cứ khi nào thẻ đang ở trạng thái lật (đang xem
// đáp án), CSS đè hoàn toàn lên transform trượt (translateX) mà JS gán qua inline
// style — khiến thẻ không trượt đúng như tính toán, gây cảm giác "trượt sai hướng".
// Cách sửa: bọc #card trong 1 wrapper riêng (#cardSlideWrap) CHỈ lo việc trượt
// (translateX). #card bên trong vẫn tự lo việc lật (rotateY) như cũ, không đụng
// nhau nên không còn xung đột !important nữa.
export function installMobileFlashcardNavigation() {
  function $(id) {
    return document.getElementById(id);
  }
  function goPrev() {
    if (typeof window.prev === 'function') window.prev();
  }
  function goNext() {
    if (typeof window.next === 'function') window.next();
  }
  const isMobile = () => window.matchMedia('(max-width:760px)').matches;

  // Bọc #card vào #cardSlideWrap 1 lần duy nhất, giữ nguyên #card và toàn bộ
  // logic lật/hiển thị đang có — chỉ thêm 1 lớp cha để xử lý trượt riêng.
  function ensureSlideWrap() {
    let wrap = $('cardSlideWrap');
    if (wrap) return wrap;
    const card = $('card');
    if (!card || !card.parentNode) return null;
    wrap = document.createElement('div');
    wrap.id = 'cardSlideWrap';
    wrap.style.cssText =
      'position:relative;width:100%;height:100%;display:flex;align-items:center;justify-content:center;min-height:0;flex:1;max-width:100%;margin:0 auto;';
    card.parentNode.insertBefore(wrap, card);
    wrap.appendChild(card);
    return wrap;
  }

  let __sliding = false;
  let __activeFinishSlide = null;
  // Trượt liền mạch: câu cũ (ghost) và câu mới (wrap) chạy song song cùng hướng.
  function slideChange(dir, isRepeat = false) {
    const zone = $('zone');
    // Chỉ bọc #card vào wrapper trên mobile — bọc trên desktop sẽ đổi #card từ flex item
    // trực tiếp của .zone thành con của 1 div thường, có thể làm lệch layout desktop.
    if (!zone) {
      dir === 'next' ? goNext() : goPrev();
      return;
    }
    const wrap = ensureSlideWrap();
    if (!wrap) {
      dir === 'next' ? goNext() : goPrev();
      return;
    }

    // Nếu đang trượt dở mà nhận thêm lệnh mới (ví dụ nhấp nhanh nhiều lần hoặc giữ phím),
    // kết thúc ngay slide trước để trả giao diện về vị trí chuẩn và tiến hành câu mới lập tức.
    if (__sliding && typeof __activeFinishSlide === 'function') {
      __activeFinishSlide();
    }

    // Khi giữ phím (isRepeat / e.repeat): chuyển câu trực tiếp không chạy animation trượt 220ms
    // để giao diện tua nhanh mượt mà ở tốc độ phím gõ (30-50ms/câu).
    if (isRepeat) {
      dir === 'next' ? goNext() : goPrev();
      return;
    }

    __sliding = true;
    window.__lhSuppressFlip = true;

    // Dọn các ghost cũ nếu còn sót lại trên DOM
    try {
      zone.querySelectorAll('.lhGhost').forEach(g => g.remove());
    } catch (e) {
      lhWarn('MOBILE_FLASHCARD_NAVIGATION_20260702', e);
    }

    const zr = zone.getBoundingClientRect();
    const r = wrap.getBoundingClientRect();
    // ghost = ảnh chụp câu cũ ngay tại vị trí đang thấy (kể cả khi đang kéo dở).
    // Clone nguyên wrap (gồm cả #card bên trong) nên giữ đúng trạng thái lật hiện tại.
    const ghost = wrap.cloneNode(true);
    ghost.removeAttribute('id');
    ghost.classList.add('lhGhost');
    ghost.style.cssText +=
      ';position:absolute;margin:0;pointer-events:none;z-index:6;left:' +
      (r.left - zr.left) +
      'px;top:' +
      (r.top - zr.top) +
      'px;width:' +
      r.width +
      'px;height:' +
      r.height +
      'px;transform:none;opacity:1;transition:none;';
    zone.appendChild(ghost);

    wrap.classList.remove('lhDragging');
    wrap.classList.add('lhSliding');
    wrap.style.transition = 'none';
    // Khi vào đây từ một cú vuốt, touchmove đã hạ opacity của wrap xuống thấp nhất .4
    // để tạo cảm giác thẻ mờ dần theo ngón tay. Phải trả lại 1 ngay tại đây, nếu không
    // câu MỚI trượt vào vẫn mang inline opacity cũ và bị tối đi vĩnh viễn.
    wrap.style.opacity = '1';
    dir === 'next' ? goNext() : goPrev(); // đổi nội dung #card bên trong wrap
    const fromX = dir === 'next' ? '100%' : '-100%'; // next: câu mới vào từ bên phải; prev: từ bên trái
    const toX = dir === 'next' ? '-100%' : '100%'; // câu cũ (ghost) ra cùng hướng vuốt
    wrap.style.transform = 'translateX(' + fromX + ')';

    let animFrame1 = null;
    let animFrame2 = null;
    let slideTimeout = null;
    let __slideDone = false;

    function finishSlide() {
      if (__slideDone) return;
      __slideDone = true;
      if (animFrame1) cancelAnimationFrame(animFrame1);
      if (animFrame2) cancelAnimationFrame(animFrame2);
      if (slideTimeout) clearTimeout(slideTimeout);
      wrap.removeEventListener('transitionend', finishSlide);
      ghost.remove();
      wrap.style.transition = '';
      wrap.style.transform = '';
      wrap.style.opacity = '';
      wrap.classList.remove('lhSliding');
      __sliding = false;
      window.__lhSuppressFlip = false;
      if (__activeFinishSlide === finishSlide) {
        __activeFinishSlide = null;
      }
    }

    __activeFinishSlide = finishSlide;

    // Double rAF: đảm bảo trình duyệt vẽ xong vị trí xuất phát ở 1 frame riêng
    // trước khi bắt đầu transition, tránh gộp frame/giật hình trên máy yếu.
    animFrame1 = requestAnimationFrame(() => {
      animFrame2 = requestAnimationFrame(() => {
        if (!__sliding || __slideDone) return;
        const ease = 'transform .22s cubic-bezier(.22,.61,.36,1)';
        wrap.style.transition = ease;
        ghost.style.transition = ease + ', opacity .22s ease';
        wrap.style.transform = 'translateX(0)'; // câu mới vào giữa
        ghost.style.transform = 'translateX(' + toX + ')'; // câu cũ ra
        ghost.style.opacity = '.35';
      });
    });

    wrap.addEventListener('transitionend', finishSlide);
    slideTimeout = setTimeout(finishSlide, 350);
  }

  // Bấm nhanh (tap): chuyển 1 câu có hiệu ứng trượt (slideChange).
  // Bấm giữ: sau 1 khoảng trễ ngắn, tự động chuyển câu liên tục (không hiệu ứng trượt,
  // để không bị dồn/giật animation) cho tới khi thả tay ra.
  function bindHoldRepeat(btn, dir) {
    if (!btn) return;
    const REPEAT_DELAY = 420; // chờ trước khi bắt đầu tua nhanh
    const REPEAT_INTERVAL = 130; // tốc độ tua khi giữ
    let startTimer = null,
      repeatTimer = null,
      repeated = false,
      touchActive = false;

    function stepOnce() {
      dir === 'next' ? goNext() : goPrev();
    }
    function clearTimers() {
      if (startTimer) {
        clearTimeout(startTimer);
        startTimer = null;
      }
      if (repeatTimer) {
        clearInterval(repeatTimer);
        repeatTimer = null;
      }
    }
    function startHold() {
      repeated = false;
      clearTimers();
      startTimer = setTimeout(() => {
        repeated = true;
        stepOnce();
        repeatTimer = setInterval(stepOnce, REPEAT_INTERVAL);
      }, REPEAT_DELAY);
    }
    function endHold() {
      clearTimers();
    }

    btn.addEventListener(
      'touchstart',
      e => {
        touchActive = true;
        e.stopPropagation();
        startHold();
      },
      { passive: true },
    );
    btn.addEventListener(
      'touchend',
      e => {
        e.stopPropagation();
        endHold();
        setTimeout(() => {
          touchActive = false;
        }, 400);
      },
      { passive: true },
    );
    btn.addEventListener(
      'touchcancel',
      e => {
        e.stopPropagation();
        endHold();
        setTimeout(() => {
          touchActive = false;
        }, 400);
      },
      { passive: true },
    );
    // mousedown/mouseup: phòng khi test bằng chuột trên desktop; touchActive chặn double-fire trên thiết bị vừa có touch vừa giả lập mouse.
    btn.addEventListener('mousedown', e => {
      if (touchActive) return;
      e.stopPropagation();
      startHold();
    });
    btn.addEventListener('mouseup', e => {
      if (touchActive) return;
      e.stopPropagation();
      endHold();
    });
    btn.addEventListener('mouseleave', () => {
      if (!touchActive) endHold();
    });
    btn.addEventListener('click', e => {
      e.stopPropagation();
      if (repeated) {
        repeated = false;
        return;
      } // đã tua rồi thì bỏ qua click cuối, tránh nhảy dư 1 câu
      slideChange(dir);
    });
  }

  function ensureMobileNav() {
    const zone = $('zone');
    if (!zone || $('mobileCardNav')) return;
    const nav = document.createElement('div');
    nav.id = 'mobileCardNav';
    nav.className = 'mobileCardNav';
    nav.innerHTML = `
      <button id="mobilePrev" type="button" aria-label="Câu trước"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg></button>
      <div class="mobileSwipeHint">Vuốt trái / phải để đổi câu</div>
      <button id="mobileNext" type="button" aria-label="Câu sau"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg></button>`;
    zone.appendChild(nav);
    try {
      if (localStorage.getItem('learninghub_swipe_hint_seen_v1') === '1') zone.classList.add('swiped');
    } catch (e) {
      lhWarn('MOBILE_FLASHCARD_NAVIGATION_20260702', e);
    }
    bindHoldRepeat($('mobilePrev'), 'prev');
    bindHoldRepeat($('mobileNext'), 'next');
  }

  // Kéo dính ngón realtime + búng/snap (giống Quizlet). Chỉ trên mobile.
  // Kéo trên wrap (không phải #card) để không đụng transform lật (rotateY) của #card.
  function bindDrag() {
    const zone = $('zone');
    if (!zone || zone.__mobileDragBound) return;
    zone.__mobileDragBound = true;
    let sx = 0,
      sy = 0,
      st = 0,
      dragging = false,
      decided = false,
      axis = null,
      moved = false;
    // true khi touch hiện tại bắt đầu trên nút/khu vực loại trừ (mobileCardNav, edit...).
    // Phải giữ nguyên trạng thái này xuyên suốt touchmove/touchend của CÙNG 1 lần chạm,
    // nếu không touchmove/touchend sẽ dùng sx/sy CŨ (của lần kéo trước đó) để tính khoảng
    // cách kéo, khiến việc giữ nút bị hiểu nhầm thành một cú vuốt và tự nhảy câu.
    let ignoreTouch = false;
    const W = () => zone.getBoundingClientRect().width || window.innerWidth || 360;
    function markSeen() {
      zone.classList.add('swiped');
      try {
        localStorage.setItem('learninghub_swipe_hint_seen_v1', '1');
      } catch (e) {
        lhWarn('MOBILE_FLASHCARD_NAVIGATION_20260702', e);
      }
    }

    zone.addEventListener(
      'touchstart',
      e => {
        const t = e.changedTouches && e.changedTouches[0];
        if (!t) return;
        ignoreTouch = !isMobile() || __sliding || !!e.target.closest('#cardTools, #editCard, .edit, .mobileCardNav');
        if (ignoreTouch) return;
        sx = t.clientX;
        sy = t.clientY;
        st = Date.now();
        dragging = false;
        decided = false;
        axis = null;
        moved = false;
      },
      { passive: true },
    );

    zone.addEventListener(
      'touchmove',
      e => {
        if (ignoreTouch || !isMobile() || __sliding) return;
        const t = e.changedTouches && e.changedTouches[0];
        if (!t) return;
        const dx = t.clientX - sx,
          dy = t.clientY - sy;
        if (!decided) {
          if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
          decided = true;
          axis = Math.abs(dx) > Math.abs(dy) * 1.2 ? 'x' : 'y'; // dọc -> để trình duyệt cuộn
          if (axis === 'x') {
            const w = ensureSlideWrap();
            if (w) {
              w.style.transition = 'none';
              w.classList.add('lhDragging');
            }
          }
        }
        if (dragging || axis === 'x') {
          dragging = true;
          e.preventDefault();
          if (Math.abs(dx) > 6) moved = true;
          const w = ensureSlideWrap();
          if (w) {
            w.style.transform = 'translateX(' + dx + 'px)';
            w.style.opacity = String(Math.max(0.4, 1 - Math.abs(dx) / (W() * 1.1)));
          }
        }
      },
      { passive: false },
    );

    function endDrag(e) {
      if (ignoreTouch || !dragging) return;
      dragging = false;
      const w = ensureSlideWrap();
      if (w) w.classList.remove('lhDragging');
      const t = e.changedTouches && e.changedTouches[0];
      const dx = t ? t.clientX - sx : 0;
      const dt = Date.now() - st;
      const commit = Math.abs(dx) > W() * 0.3 || (dt < 320 && Math.abs(dx) > 56);
      if (!w) return;
      if (commit) {
        markSeen();
        slideChange(dx < 0 ? 'next' : 'prev'); // ghost(câu cũ) + wrap(câu mới) chạy song song
      } else {
        // chưa đủ xa -> búng về chỗ cũ
        window.__lhSuppressFlip = moved;
        w.style.transition = 'transform .2s cubic-bezier(.22,.61,.36,1), opacity .2s ease';
        w.style.transform = 'translateX(0)';
        w.style.opacity = '1';
        setTimeout(() => {
          w.style.transition = '';
          w.style.transform = '';
          w.style.opacity = '';
          window.__lhSuppressFlip = false;
        }, 220);
      }
    }
    zone.addEventListener('touchend', endDrag, { passive: false });
    zone.addEventListener('touchcancel', endDrag, { passive: false });
    // Chặn lật thẻ nếu vừa kéo (tap mới được lật)
    zone.addEventListener(
      'click',
      e => {
        if (window.__lhSuppressFlip) {
          e.stopImmediatePropagation();
          e.preventDefault();
        }
      },
      true,
    );
  }

  function boot() {
    ensureSlideWrap();
    ensureMobileNav();
    bindHoldRepeat($('prev'), 'prev');
    bindHoldRepeat($('next'), 'next');
    bindHoldRepeat(document.querySelector('.arrow.left'), 'prev');
    bindHoldRepeat(document.querySelector('.arrow.right'), 'next');
    bindDrag();
  }
  window.slideChange = slideChange;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  setTimeout(boot, 300);
  setTimeout(boot, 1000);
}
