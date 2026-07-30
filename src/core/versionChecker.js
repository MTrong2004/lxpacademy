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
    isAdminNotice: true
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
 * @param {{title?: string, sub?: string, isAdminNotice?: boolean}} [opts]
 */
export async function showUpdateNotification(opts) {
  const title = opts?.title || 'Có phiên bản mới';
  const sub = opts?.sub || 'Cập nhật để tải giao diện và dữ liệu mới nhất';
  const isAdminNotice = !!opts?.isAdminNotice;
  const existingBanner = document.getElementById('lhUpdateBanner');
  if (existingBanner) {
    existingBanner.remove();
  }

  let releaseNotes = null;
  if (!isAdminNotice) {
    try {
      const [settingsRes, verRes] = await Promise.all([
        fetch('/api/settings?ts=' + Date.now(), { cache: 'no-store' }).then(r => r.ok ? r.json() : {}).catch(() => ({})),
        fetch('/version.json?ts=' + Date.now(), { cache: 'no-store' }).then(r => r.ok ? r.json() : {}).catch(() => ({}))
      ]);

      const enabled = settingsRes?.release_notes?.enabled !== false;
      if (enabled) {
        if (settingsRes?.release_notes?.content && settingsRes.release_notes.content.trim()) {
          releaseNotes = settingsRes.release_notes.content.trim();
        } else if (Array.isArray(verRes?.recent_commits) && verRes.recent_commits.length > 0) {
          releaseNotes = verRes.recent_commits.map(c => {
            const clean = String(c).replace(/^[\s•\-\*]+/, '');
            return '• ' + clean;
          }).join('\n');
        }
      }
    } catch (e) {}
  }

  const styleId = 'lhUpdateBannerStyles';
  let styleEl = document.getElementById(styleId);
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = `
      .lh-update-banner {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 2147483647;
        display: flex;
        flex-direction: column;
        gap: 12px;
        width: min(420px, calc(100vw - 32px));
        padding: 16px 18px;
        background: rgba(18, 24, 38, 0.96);
        border: 1px solid rgba(200, 169, 110, 0.35);
        border-left: 4px solid var(--gold, #c8a96e);
        border-radius: 16px;
        box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6), 0 0 24px rgba(200, 169, 110, 0.2);
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
      .lh-update-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }
      .lh-update-main {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .lh-update-icon {
        width: 36px;
        height: 36px;
        border-radius: 10px;
        background: linear-gradient(135deg, #c8a96e, #a8894e);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        box-shadow: 0 4px 14px rgba(200, 169, 110, 0.35);
      }
      .lh-update-icon svg {
        width: 18px;
        height: 18px;
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
      .lh-update-notes-box {
        margin-top: 2px;
        padding: 10px 12px;
        background: rgba(200, 169, 110, 0.06);
        border: 1px solid rgba(200, 169, 110, 0.2);
        border-radius: 10px;
        font-size: 12px;
        color: #e2e8f0;
        max-height: 140px;
        overflow-y: auto;
      }
      .lh-update-notes-box::-webkit-scrollbar {
        width: 4px;
      }
      .lh-update-notes-box::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 4px;
      }
      .lh-update-notes-box::-webkit-scrollbar-thumb {
        background: rgba(200, 169, 110, 0.4);
        border-radius: 4px;
      }
      .lh-update-notes-title {
        color: var(--gold2, #e8d4a8);
        font-weight: 700;
        font-size: 12px;
        margin-bottom: 4px;
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .lh-update-notes-body {
        white-space: pre-wrap;
        line-height: 1.5;
        color: #e2e8f0;
      }
      .lh-update-actions {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 4px;
      }
      .lh-update-btn {
        background: linear-gradient(135deg, #c8a96e, #e8d4a8);
        color: #111827;
        border: none;
        border-radius: 8px;
        padding: 8px 16px;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 4px 14px rgba(200, 169, 110, 0.35);
        white-space: nowrap;
        width: 100%;
        text-align: center;
      }
      .lh-update-btn:hover {
        background: linear-gradient(135deg, #e8d4a8, #f5e6c4);
        transform: translateY(-1px);
        box-shadow: 0 6px 18px rgba(200, 169, 110, 0.5);
      }
      .lh-update-btn:active {
        transform: translateY(0);
      }
      .lh-update-close {
        background: transparent;
        border: none;
        color: #64748b;
        cursor: pointer;
        padding: 4px;
        border-radius: 6px;
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
          left: 16px;
          right: 16px;
          bottom: 16px;
          width: auto;
        }
      }
    `;

  const banner = document.createElement('div');
  banner.id = 'lhUpdateBanner';
  banner.className = 'lh-update-banner';
  banner.setAttribute('role', 'alert');
  banner.setAttribute('aria-live', 'assertive');
  banner.innerHTML = `
    <div class="lh-update-header">
      <div class="lh-update-main">
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
      </div>
    </div>
    ${releaseNotes ? `
    <div class="lh-update-notes-box">
      <div class="lh-update-notes-title">✨ Có gì mới trong bản này:</div>
      <div class="lh-update-notes-body"></div>
    </div>` : ''}
    <div class="lh-update-actions">
      <button id="lhUpdateReloadBtn" class="lh-update-btn" type="button">Cập nhật ngay</button>
    </div>
  `;

  banner.querySelector('.lh-update-title').textContent = title;
  banner.querySelector('.lh-update-sub').textContent = sub;
  if (releaseNotes && banner.querySelector('.lh-update-notes-body')) {
    banner.querySelector('.lh-update-notes-body').textContent = releaseNotes;
  }

  document.body.appendChild(banner);

  document.getElementById('lhUpdateReloadBtn')?.addEventListener('click', () => {
    window.location.reload();
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
