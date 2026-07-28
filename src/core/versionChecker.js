/**
 * Learning Hub - Version Checker Module
 * Checks for new deployments on Vercel/server and prompts user to reload.
 */

let currentVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : null;
let updateDetected = false;
let lastCheckTime = 0;
const CHECK_INTERVAL_MS = 60 * 1000; // Kiểm tra định kỳ mỗi 60s
const MIN_CHECK_GAP_MS = 15 * 1000; // Tối thiểu 15s giữa 2 lần check để tránh spam khi tab focus liên tục

function isUserTyping() {
  const active = document.activeElement;
  if (!active) return false;
  const tag = active.tagName ? active.tagName.toLowerCase() : '';
  if (tag === 'input' || tag === 'textarea' || tag === 'select' || active.isContentEditable) {
    return true;
  }
  return false;
}

export async function fetchVersion() {
  try {
    const res = await fetch('/version.json?_t=' + Date.now(), {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-store, no-cache',
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data && data.version ? String(data.version) : null;
  } catch (e) {
    return null;
  }
}

export async function checkForUpdates() {
  if (updateDetected) return; // Đã hiển thị thông báo rồi thì không check lại

  const now = Date.now();
  if (now - lastCheckTime < MIN_CHECK_GAP_MS) return;
  lastCheckTime = now;

  const remoteVersion = await fetchVersion();
  if (!remoteVersion) return;

  if (!currentVersion) {
    // Lưu phiên bản ban đầu nếu chưa được định nghĩa
    currentVersion = remoteVersion;
    return;
  }

  if (remoteVersion !== currentVersion) {
    updateDetected = true;
    showUpdateNotification();
  }
}

/**
 * RELOAD_NOTICE_20260729 — admin nhắc người dùng tải lại trang.
 * main.js gán hàm này vào `window.lhShowReloadNotice` (KHÔNG gán trong initVersionChecker,
 * vì hàm đó bị bỏ qua ở chế độ ?mock=1 — banner sẽ không test được).
 */
export function showAdminReloadNotice() {
  showUpdateNotification({
    title: 'Hệ thống vừa cập nhật',
    sub: 'Hãy tải lại trang để lấy dữ liệu và giao diện mới nhất',
  });
}

/**
 * Banner "có bản mới, tải lại đi".
 *
 * RELOAD_NOTICE_20260729: dùng lại đúng banner này cho việc admin nhắc người dùng tải lại
 * (trước đây admin "đăng xuất bắt buộc": huỷ phiên + alert). Vì vậy tách title/sub ra tham
 * số thay vì hardcode — đừng tạo banner thứ hai, người dùng phải thấy một kiểu thông báo
 * duy nhất cho cùng một việc.
 *
 * @param {{title?: string, sub?: string}} [opts]
 */
export function showUpdateNotification(opts) {
  const title = opts?.title || 'Có phiên bản mới';
  const sub = opts?.sub || 'Cập nhật để tải giao diện và dữ liệu mới nhất';
  if (document.getElementById('lhUpdateBanner')) return;

  const styleId = 'lhUpdateBannerStyles';
  if (!document.getElementById(styleId)) {
    const styleEl = document.createElement('style');
    styleEl.id = styleId;
    styleEl.textContent = `
      .lh-update-banner {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 2147483647;
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 14px 20px;
        background: rgba(18, 24, 38, 0.95);
        border: 1px solid rgba(255, 255, 255, 0.16);
        border-left: 4px solid #3b82f6;
        border-radius: 16px;
        box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5), 0 0 24px rgba(59, 130, 246, 0.25);
        backdrop-filter: blur(18px);
        color: #f8fafc;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        font-size: 14px;
        animation: lhBannerSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }
      @keyframes lhBannerSlideIn {
        from { opacity: 0; transform: translateY(24px) scale(0.94); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      .lh-update-icon {
        width: 38px;
        height: 38px;
        border-radius: 12px;
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);
      }
      .lh-update-icon svg {
        width: 20px;
        height: 20px;
        fill: none;
        stroke: #ffffff;
        stroke-width: 2.2;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
      .lh-update-content {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .lh-update-title {
        font-weight: 700;
        font-size: 14px;
        color: #ffffff;
        letter-spacing: -0.01em;
      }
      .lh-update-sub {
        font-size: 12px;
        color: #94a3b8;
      }
      .lh-update-actions {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-left: 6px;
      }
      .lh-update-btn {
        background: linear-gradient(135deg, #2563eb, #1d4ed8);
        color: #ffffff;
        border: none;
        border-radius: 10px;
        padding: 8px 16px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);
        white-space: nowrap;
      }
      .lh-update-btn:hover {
        background: linear-gradient(135deg, #3b82f6, #2563eb);
        transform: translateY(-1px);
        box-shadow: 0 6px 18px rgba(59, 130, 246, 0.5);
      }
      .lh-update-btn:active {
        transform: translateY(0);
      }
      .lh-update-close {
        background: transparent;
        border: none;
        color: #64748b;
        cursor: pointer;
        padding: 6px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }
      .lh-update-close:hover {
        color: #f1f5f9;
        background: rgba(255, 255, 255, 0.1);
      }
      @media (max-width: 640px) {
        .lh-update-banner {
          left: 12px;
          right: 12px;
          bottom: 16px;
          padding: 12px 14px;
          gap: 10px;
        }
        .lh-update-sub {
          display: none;
        }
      }
    `;
    document.head.appendChild(styleEl);
  }

  const banner = document.createElement('div');
  banner.id = 'lhUpdateBanner';
  banner.className = 'lh-update-banner';
  banner.setAttribute('role', 'alert');
  banner.setAttribute('aria-live', 'assertive');
  banner.innerHTML = `
    <div class="lh-update-icon">
      <svg viewBox="0 0 24 24">
        <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
        <path d="M3 3v5h5"></path>
        <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path>
        <path d="M16 16h5v5"></path>
      </svg>
    </div>
    <div class="lh-update-content">
      <span class="lh-update-title"></span>
      <span class="lh-update-sub"></span>
    </div>
    <div class="lh-update-actions">
      <button id="lhUpdateReloadBtn" class="lh-update-btn" type="button">Cập nhật ngay</button>
      <button id="lhUpdateCloseBtn" class="lh-update-close" type="button" aria-label="Đóng thông báo">
        <svg style="width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2.2" viewBox="0 0 24 24">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  `;

  // textContent, không nhúng vào chuỗi HTML: chữ có thể đến từ tham số nên không dựng bằng
  // template string để khỏi phải nghĩ tới chuyện escape.
  banner.querySelector('.lh-update-title').textContent = title;
  banner.querySelector('.lh-update-sub').textContent = sub;

  document.body.appendChild(banner);

  document.getElementById('lhUpdateReloadBtn')?.addEventListener('click', () => {
    // Không bao giờ tự reload khi người dùng không chủ động click, khi click nút reload ngay:
    window.location.reload();
  });

  document.getElementById('lhUpdateCloseBtn')?.addEventListener('click', () => {
    banner.remove();
  });
}

export function initVersionChecker() {
  if (typeof window === 'undefined') return;

  // Lấy version ban đầu
  if (!currentVersion) {
    fetchVersion().then(v => {
      if (v) currentVersion = v;
    });
  }

  // Định kỳ kiểm tra phiên bản mới mỗi 60 giây
  setInterval(() => {
    checkForUpdates();
  }, CHECK_INTERVAL_MS);

  // Kiểm tra khi người dùng quay lại tab (visibilitychange -> visible)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      checkForUpdates();
    }
  });

  // Kiểm tra khi window focus
  window.addEventListener('focus', () => {
    checkForUpdates();
  });
}
