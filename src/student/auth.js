/**
 * Student Auth & Supabase Bridge Module
 */
import { lhWarn } from '../core/log.js';
import { esc, finalAnswerText } from './format.js';
import { getDeviceId } from '../core/device.js';

export function installHODSupabaseAndAvatar() {
  window.HODSupabase = (() => {
    const CONFIG = window.APP_CONFIG || {
      SUPABASE_URL: '',
      SUPABASE_ANON_KEY: '',
    };

    let client = null;
    let currentUser = null;
    let currentProfile = null;

    const configured = () =>
      CONFIG.SUPABASE_URL.startsWith('https://') && !CONFIG.SUPABASE_ANON_KEY.startsWith('PASTE_');
    const isReady = () => !!client && !!currentUser;
    const isAdmin = () => currentProfile?.role === 'admin';
    const canOpenDashboard = () => ['admin', 'editor'].includes(currentProfile?.role);
    const $id = id => document.getElementById(id);

    function safeJson(obj) {
      try {
        return JSON.stringify(obj, null, 2);
      } catch (e) {
        return String(obj);
      }
    }

    function questionToRow(q) {
      const imgs = q.images || [];
      return {
        question: q.question,
        options: q.options || {},
        answer: q.answer,
        answer_text: finalAnswerText(q),
        images: imgs,
        has_image: !!(q.has_image || imgs.length),
        error_risk: q.error_risk || 'low',
        error_risk_reason: q.error_risk_reason || null,
      };
    }

    function rowToQuestion(row) {
      return {
        id: row.id,
        subject_code: row.subject_code,
        num: row.num,
        question: row.question,
        options: row.options || {},
        answer: row.answer,
        answer_text: row.answer_text,
        images: row.images || [],
        has_image: !!(row.has_image || (row.images || []).length),
        error_risk: row.error_risk || 'low',
        error_risk_reason: row.error_risk_reason || '',
        // Đánh dấu đã có đủ dữ liệu từ Turso, để các đoạn code cũ (fallback gọi
        // sang Supabase để "lazy load" ảnh/dữ liệu) không kích hoạt nữa - Supabase
        // giờ chỉ dùng cho Auth, mọi dữ liệu câu hỏi đều lấy từ Turso.
        __imagesChecked: true,
        __imagesLoaded: true,
      };
    }

    function notify2(msg) {
      if (typeof notify === 'function') notify(msg);
      else console.log('[HOD102]', msg);
    }

    function openAuth() {
      $id('authModal')?.classList.remove('hidden');
    }
    function closeAuth() {
      $id('authModal')?.classList.add('hidden');
    }
    function openAdmin() {
      if (!canOpenDashboard()) {
        alert('Tài khoản Google này chưa có quyền admin.');
        return;
      }
      window.open('admin.html', '_blank');
    }
    function closeAdmin() {
      $id('adminModal')?.classList.add('hidden');
    }

    function setupHeaderAuthUI() {
      const actions =
        document.querySelector('.globalTop .actions') ||
        document.querySelector('#fc .actions') ||
        document.querySelector('.actions');
      if (!actions || $id('authStatusBtn')) return;

      const adminBtn = document.createElement('button');
      adminBtn.id = 'adminOpenBtn';
      adminBtn.className = 'btn adminBtn hidden';
      adminBtn.title = 'Dashboard quản trị';
      adminBtn.textContent = '';
      adminBtn.style.display = 'none';
      adminBtn.onclick = () => window.open('admin.html', '_blank');

      const authBtn = document.createElement('button');
      authBtn.id = 'authStatusBtn';
      authBtn.className = 'btn authBtn';
      authBtn.title = 'Đăng nhập / Đăng xuất';
      authBtn.textContent = configured() ? 'Đăng nhập' : 'Local';
      authBtn.onclick = async () => {
        if (!configured()) return alert('Bạn cần điền SUPABASE_URL và SUPABASE_ANON_KEY trong file HTML trước.');
        if (currentUser) await signOut();
        else openAuth();
      };

      actions.prepend(authBtn);
      actions.prepend(adminBtn);
    }

    function updateAuthUI() {
      const authBtn = $id('authStatusBtn');
      const adminBtn = $id('adminOpenBtn');
      if (!authBtn) return;
      if (!configured()) {
        authBtn.textContent = 'Local';
        authBtn.classList.remove('userChip');
        adminBtn?.classList.add('hidden');
        return;
      }
      if (currentUser) {
        authBtn.textContent = currentProfile?.email || currentUser.email || 'User';
        authBtn.classList.add('userChip');
        const admin = canOpenDashboard();
        adminBtn?.classList.toggle('hidden', !admin);
        if (adminBtn) adminBtn.style.display = admin ? '' : 'none';
        const floatAdmin = $id('hodFloatAdmin');
        floatAdmin?.classList.toggle('hidden', !admin);
        if (floatAdmin) floatAdmin.style.display = admin ? '' : 'none';
        if (!admin) $id('adminModal')?.classList.add('hidden');
      } else {
        authBtn.textContent = 'Đăng nhập';
        authBtn.classList.remove('userChip');
        adminBtn?.classList.add('hidden');
        if (adminBtn) adminBtn.style.display = 'none';
        const floatAdmin = $id('hodFloatAdmin');
        floatAdmin?.classList.add('hidden');
        if (floatAdmin) floatAdmin.style.display = 'none';
        $id('adminModal')?.classList.add('hidden');
      }
    }

    /*
    ACCESS_GATE_STRICT_20260726
    Cổng truy cập fail-closed: chỉ mở web chính khi profile khẳng định
    approved === 1 VÀ blocked === 0. Thiếu profile, profile lỗi, hay /api/profile 500
    đều bị coi là KHÔNG có quyền.
  */
    const PENDING_DEFAULT_TITLE = 'Chờ phê duyệt';
    const PENDING_DEFAULT_MESSAGE =
      'Tài khoản của bạn đang chờ admin phê duyệt.<br>Bạn sẽ có thể sử dụng Learning Hub sau khi được duyệt.';
    const BLOCKED_TITLE = 'Tài khoản bị khóa';
    const BLOCKED_MESSAGE = 'Tài khoản của bạn đã bị quản trị viên khóa.<br>Bạn đã được đăng xuất khỏi hệ thống.';

    function truthyFlag(v) {
      return v === 1 || v === true || v === '1';
    }

    /*
    approved === 1 && blocked === 0 — không có ngoại lệ.
    Bản cũ có `if (['admin','editor'].includes(role)) return true;` ĐẶT TRƯỚC
    kiểm tra approved, nên editor bị thu hồi duyệt vẫn vào được giao diện chính.
    Nó khớp với lỗ tương ứng ở server (checkUserAccess cũ) — đã sửa cả hai phía.
    Đây chỉ là lớp hiển thị: quyền thật do server quyết định.
  */
    function hasFullAccess(profile) {
      if (!profile || typeof profile !== 'object') return false;
      if (truthyFlag(profile.blocked) || truthyFlag(profile.is_blocked) || profile.status === 'blocked') return false;
      return truthyFlag(profile.approved);
    }
    window.lhHasFullAccess = hasFullAccess;

    function showPendingApproval(opts) {
      const el = $id('hodPendingApproval');
      if (el) el.classList.remove('hidden');
      const titleEl = $id('hodPendingTitle');
      if (titleEl) titleEl.textContent = opts?.title || PENDING_DEFAULT_TITLE;
      const msgEl = $id('hodPendingMessage');
      if (msgEl) msgEl.innerHTML = opts?.message || PENDING_DEFAULT_MESSAGE;
      const emailEl = $id('hodPendingEmail');
      if (emailEl) emailEl.textContent = currentUser?.email || '';
      $id('hodLoginGate')?.classList.add('hidden');
      document.body?.classList.add('hod-locked');
      window.__LH_ACCESS_OK = false;
      /*
      PENDING_GATE_STICKY_20260726
      Cờ "gate đang do luồng quyền làm chủ". Các interval UI (avatar/nút admin,
      chạy mỗi 500ms) TUYỆT ĐỐI không được tự ẩn màn chờ duyệt khi cờ này bật —
      xem updateAll() ở block ACCOUNT AVATAR CLEAN FINAL.
    */
      window.__LH_GATE_LOCKED = true;
    }
    window.showPendingApproval = showPendingApproval;

    // /api/profile lỗi server (5xx) hoặc mất mạng: không kết luận được quyền => chặn.
    function showAccessCheckError() {
      showPendingApproval({
        title: 'Không thể kiểm tra quyền',
        message: 'Không thể kiểm tra quyền, vui lòng thử lại.',
      });
    }
    window.showAccessCheckError = showAccessCheckError;

    function hidePendingApproval() {
      const el = $id('hodPendingApproval');
      if (el) el.classList.add('hidden');
      document.body?.classList.remove('hod-locked');
      window.__LH_GATE_LOCKED = false;
    }

    // ===== APP_DIRECT_DISCORD_LOGIN_NOTIFY_20260627 =====
    // Gửi thông báo đăng nhập web qua /api/notify (server tự lấy webhook từ env, không lộ ra client).
    async function sendLoginToDiscord(email, role) {
      try {
        const res = await fetch('/api/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kind: 'login', user_id: currentUser?.id, email, role, source: 'web' }),
        });
        if (!res.ok) console.warn('Discord login notify failed:', res.status, await res.text().catch(() => ''));
      } catch (error) {
        console.warn('Lỗi gửi thông báo login web:', error);
      }
    }
    async function notifyLoginToDiscordOnce() {
      if (!currentUser) return;
      const key = 'hod_web_login_discord_notified_' + currentUser.id;
      if (sessionStorage.getItem(key)) return;
      await sendLoginToDiscord(currentProfile?.email || currentUser.email, currentProfile?.role || 'user');
      sessionStorage.setItem(key, 'true');
    }
    let lhApiAbortController = typeof AbortController !== 'undefined' ? new AbortController() : null;
    function getLhApiSignal() {
      return lhApiAbortController ? lhApiAbortController.signal : undefined;
    }
    window.getLhApiSignal = getLhApiSignal;

    function purgeOfflineQuestionCache() {
      try {
        LHState.RAW = [];
        LHState.pool = [];
        LHState.ci = 0;
        LHState.flipped = false;
        const q = $('question');
        if (q) q.textContent = 'Tài khoản chưa được duyệt hoặc đã bị khóa.';
        const opts = $('options');
        if (opts) opts.innerHTML = '';
        const imgs = $('images');
        if (imgs) imgs.innerHTML = '';
        const total = $('total');
        if (total) total.textContent = '0';
        const idx = $('idx');
        if (idx) idx.textContent = '0';
        if (typeof renderQuiz === 'function') (typeof renderQuiz === 'function' ? renderQuiz : window.renderQuiz)?.();
        if (typeof renderStudy === 'function')
          (typeof renderStudy === 'function' ? renderStudy : window.renderStudy)?.();

        for (let i = localStorage.length - 1; i >= 0; i--) {
          const k = localStorage.key(i);
          if (
            k &&
            (k.startsWith('lh_question_') ||
              k.startsWith('lh_raw_') ||
              k.startsWith('lh_starred_') ||
              k.startsWith('learninghub_questions_'))
          ) {
            localStorage.removeItem(k);
          }
        }
        for (let i = sessionStorage.length - 1; i >= 0; i--) {
          const k = sessionStorage.key(i);
          if (k && (k.startsWith('lh_') || k.startsWith('learninghub_'))) {
            sessionStorage.removeItem(k);
          }
        }
        if (typeof caches !== 'undefined' && caches.keys) {
          caches
            .keys()
            .then(names => {
              names.forEach(name => {
                if (name.includes('questions') || name.includes('learninghub')) caches.delete(name);
              });
            })
            .catch(() => {});
        }
        if (typeof indexedDB !== 'undefined' && indexedDB.databases) {
          indexedDB
            .databases()
            .then(dbs => {
              dbs.forEach(dbInfo => {
                if (dbInfo.name && dbInfo.name.includes('learninghub')) indexedDB.deleteDatabase(dbInfo.name);
              });
            })
            .catch(() => {});
        }
      } catch (e) {
        console.warn('purgeOfflineQuestionCache error:', e);
      }
    }

    /*
    VI + VII. Hai kịch bản thu hồi quyền, khác nhau ở CHỖ CÓ ĐĂNG XUẤT HAY KHÔNG.

      PENDING_APPROVAL (bị thu hồi duyệt): xóa sạch dữ liệu học, GIỮ phiên
        Supabase để user chờ được duyệt lại rồi bấm "Kiểm tra lại".
      BLOCKED (bị khóa): xóa sạch dữ liệu học VÀ đăng xuất Supabase.
      UNAUTHORIZED (phiên hỏng/hết hạn): dọn dữ liệu và đăng xuất, vì token
        không còn dùng được nữa.

    Bản cũ gọi showPendingApproval() với text mặc định cho cả ba, nên user bị
    khóa vẫn đọc thấy "Tài khoản của bạn đang chờ admin phê duyệt".
  */
    function handleAccessRevoked(reason, code = null) {
      if (window.__LH_REVOKING_ACCESS) return;
      window.__LH_REVOKING_ACCESS = true;
      console.warn('[LH Auth] Thu hồi quyền:', reason, '| code:', code);

      // 1. Hủy mọi request /api/ đang chạy.
      try {
        if (lhApiAbortController) {
          lhApiAbortController.abort('Access revoked');
          lhApiAbortController = typeof AbortController !== 'undefined' ? new AbortController() : null;
        }
      } catch (e) {
        lhWarn('APP_DIRECT_DISCORD_LOGIN_NOTIFY_20260627', e);
      }

      // 2. Xóa RAM, DOM, localStorage/sessionStorage/IndexedDB/Cache Storage.
      window.__LH_ACCESS_OK = false;
      currentProfile = null;
      purgeOfflineQuestionCache();

      // 3. Dừng timer nền và subscription.
      try {
        if (typeof window.lhTeardownAccessWatch === 'function') window.lhTeardownAccessWatch();
      } catch (e) {
        lhWarn('APP_DIRECT_DISCORD_LOGIN_NOTIFY_20260627', e);
      }

      const mustSignOut = code === 'BLOCKED' || code === 'UNAUTHORIZED';

      if (code === 'BLOCKED') {
        showPendingApproval({ title: BLOCKED_TITLE, message: BLOCKED_MESSAGE });
      } else if (code === 'UNAUTHORIZED') {
        showPendingApproval({
          title: 'Phiên đăng nhập đã hết hạn',
          message: 'Vui lòng đăng nhập lại để tiếp tục.',
        });
      } else {
        showPendingApproval({ title: PENDING_DEFAULT_TITLE, message: PENDING_DEFAULT_MESSAGE });
      }

      if (mustSignOut) {
        try {
          unsubscribeUserStatusRealtime();
        } catch (e) {
          lhWarn('APP_DIRECT_DISCORD_LOGIN_NOTIFY_20260627', e);
        }
        if (typeof signOut === 'function') signOut().catch(() => {});
      }

      updateAuthUI();
      setTimeout(() => {
        window.__LH_REVOKING_ACCESS = false;
      }, 3000);
    }
    window.handleAccessRevoked = handleAccessRevoked;

    /*
    V. SUPABASE REALTIME — CHỈ LÀ CƠ CHẾ BÁO THAY ĐỔI, KHÔNG PHẢI NGUỒN QUYỀN.

    Bản cũ quyết định quyền TRỰC TIẾP từ payload realtime:
      if (data.blocked === true) handleAccessRevoked(...)
      else if (data.approved === false) handleAccessRevoked(...)
    Ba vấn đề:
      1. Tin vào nội dung một message có thể bị giả mạo/ lỗi thời để khoá UI.
      2. Payload từ server đã từng sai thật: toggle_user_block gửi kèm
         `approved: !blocked`, nên mở khoá một tài khoản CHƯA DUYỆT lại báo cho
         client rằng nó đã được duyệt.
      3. Nó cũng nghe postgres_changes trên public.profiles của Supabase —
         nhưng bảng profiles thật nằm ở TURSO. Kênh đó hoặc không bao giờ bắn,
         hoặc bắn dữ liệu của một bảng đã lỗi thời. Đã bỏ hẳn.

    Nay: nhận tín hiệu -> chống trùng -> gọi ĐÚNG MỘT LẦN /api/profile ->
    xử lý theo kết quả thật từ Turso.
  */
    let statusRealtimeChannel = null;
    let lastRealtimeSignalAt = 0;

    function unsubscribeUserStatusRealtime() {
      if (!statusRealtimeChannel) return;
      try {
        statusRealtimeChannel.unsubscribe();
      } catch (e) {
        lhWarn('APP_DIRECT_DISCORD_LOGIN_NOTIFY_20260627', e);
      }
      statusRealtimeChannel = null;
      window.__lhRealtimeConnected = false;
    }
    window.lhUnsubscribeUserStatus = unsubscribeUserStatusRealtime;

    function onRealtimeSignal(reason) {
      // Chống xử lý sự kiện trùng: nhiều message dồn trong 2s chỉ tính là một.
      const now = Date.now();
      if (now - lastRealtimeSignalAt < 2000) return;
      lastRealtimeSignalAt = now;
      if (typeof window.lhRevalidateAccess === 'function') {
        window.lhRevalidateAccess('realtime:' + (reason || 'status_changed'));
      }
    }

    /*
    RELOAD_NOTICE_REALTIME_20260729 — kênh CHUNG cho "nhắc tất cả người dùng tải lại".

    Vì sao cần kênh riêng ngoài 'user-status-<id>': nhắc tất cả mà bắn lần lượt vào topic
    của từng người thì server phải gọi Supabase một lần cho MỖI user. Kênh chung: một lần
    bắn, mọi client đang mở đều nhận.

    Ở đây được phép tin payload vì việc duy nhất nó gây ra là hiện banner "hãy tải lại" —
    không liên quan quyền. Mọi thứ dính tới QUYỀN vẫn phải đi qua /api/profile
    (xem ghi chú V ở trên).
  */
    let globalRealtimeChannel = null;

    function subscribeGlobalRealtime() {
      if (globalRealtimeChannel) return;
      try {
        const supa = window.HODSupabase?.__client;
        if (!supa || typeof supa.channel !== 'function') return;
        globalRealtimeChannel = supa.channel('lh-global');
        globalRealtimeChannel.on('broadcast', { event: 'reload_notice' }, () => {
          window.lhHandleReloadNotice?.();
        });
        globalRealtimeChannel.subscribe(status => {
          if (status === 'SUBSCRIBED') console.log('[Realtime] đã theo dõi kênh chung lh-global');
        });
      } catch (e) {
        lhWarn('RELOAD_NOTICE_REALTIME_20260729', e);
        globalRealtimeChannel = null;
      }
    }

    function unsubscribeGlobalRealtime() {
      if (!globalRealtimeChannel) return;
      try {
        globalRealtimeChannel.unsubscribe();
      } catch (e) {
        lhWarn('RELOAD_NOTICE_REALTIME_20260729', e);
      }
      globalRealtimeChannel = null;
    }

    function subscribeUserStatusRealtime(userId) {
      // Một user chỉ có ĐÚNG MỘT subscription, kể cả khi lh:profile-ready bắn lại.
      if (!userId || statusRealtimeChannel) return;
      try {
        const supa = window.HODSupabase?.__client;
        if (!supa || typeof supa.channel !== 'function') return;

        // Client chỉ subscribe channel của CHÍNH user đang đăng nhập.
        statusRealtimeChannel = supa.channel('user-status-' + userId);

        statusRealtimeChannel.on('broadcast', { event: 'status_changed' }, msg => {
          const data = msg?.payload || {};
          /*
          RELOAD_NOTICE_REALTIME_20260729: admin nhắc RIÊNG người này tải lại. Vẫn gọi
          lhRevalidateAccess (nó đọc /api/profile check_only, chính chỗ trả reload_notice và
          xoá cờ), nhưng hiện banner ngay để không phải chờ vòng xác minh.
        */
          if (data.reason === 'reload_notice') window.lhHandleReloadNotice?.();
          onRealtimeSignal(data.reason);
        });

        statusRealtimeChannel.subscribe(status => {
          if (status === 'SUBSCRIBED') {
            console.log('[Realtime] đã theo dõi trạng thái tài khoản:', userId);
            window.__lhRealtimeConnected = true;
            if (typeof window.stopFallbackPolling === 'function') window.stopFallbackPolling();
            // Kết nối (lại) xong thì kiểm tra một lần, phòng khi có thay đổi
            // xảy ra đúng lúc kênh đang đứt.
            if (typeof window.lhRevalidateAccess === 'function') window.lhRevalidateAccess('realtime:subscribed');
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            console.warn('[Realtime] mất kết nối:', status);
            window.__lhRealtimeConnected = false;
            if (document.visibilityState === 'visible' && typeof window.startFallbackPolling === 'function') {
              window.startFallbackPolling();
            }
          }
        });
      } catch (e) {
        console.warn('[Realtime] không đăng ký được kênh:', e);
        statusRealtimeChannel = null;
        window.__lhRealtimeConnected = false;
        if (document.visibilityState === 'visible' && typeof window.startFallbackPolling === 'function') {
          window.startFallbackPolling();
        }
      }
    }

    window.addEventListener('lh:profile-ready', () => {
      const u = window.HODSupabase?.getUser?.();
      if (u?.id) subscribeUserStatusRealtime(u.id);
      subscribeGlobalRealtime();
    });

    /*
    X. CHỐNG REQUEST TRÙNG
    activeProfilePromise: nếu /api/profile đang chạy thì mọi lời gọi khác dùng
    chung promise đó, KHÔNG tạo request thứ hai. init(), onAuthStateChange,
    visibilitychange, Realtime và polling đều đi qua đây.

    checkOnly = true -> gửi { check_only: true }: server chỉ ĐỌC trạng thái
    quyền (PK lookup, cột hẹp) và không ghi gì. Dùng cho mọi lần xác minh lại
    (Realtime / quay lại tab / polling), nên một tab mở cả ngày không còn tạo ra
    hàng loạt lượt ghi device_history + last_login vô nghĩa.
  */
    let activeProfilePromise = null;
    async function loadProfile(force = false, checkOnly = false) {
      window.loadProfile = loadProfile;
      if (!currentUser) {
        currentProfile = null;
        updateAuthUI();
        return null;
      }
      if (activeProfilePromise) return activeProfilePromise;
      activeProfilePromise = (async () => {
        try {
          const activeSubjectCode = (localStorage.getItem('learninghub_subject_code_merged_v1') || '').trim();
          const body = checkOnly
            ? { check_only: true }
            : {
                id: currentUser.id,
                email: currentUser.email || '',
                full_name: currentUser.user_metadata?.full_name || '',
                avatar_url: currentUser.user_metadata?.avatar_url || currentUser.user_metadata?.picture || '',
                current_subject: activeSubjectCode,
                device_info: typeof getDeviceTypeString === 'function' ? getDeviceTypeString() : undefined,
                // DEVICE_ID_AND_SUBJECT_PER_DEVICE_20260731: khoá lịch sử thiết bị theo ID trình duyệt.
                device_id: getDeviceId(),
                last_login: new Date().toISOString(),
                last_activity: new Date().toISOString(),
              };
          const res = await fetch('/api/profile?turso=1&ts=' + Date.now(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-store',
            body: JSON.stringify(body),
          });
          const json = await res.json().catch(() => ({}));
          if (!res.ok || json.error) {
            currentProfile = null;
            window.__LH_ACCESS_OK = false;
            /*
            VIII: chỉ 401/403 mới là "mất quyền". 500 và lỗi mạng chỉ có nghĩa là
            KHÔNG KẾT LUẬN ĐƯỢC -> hiện "Không thể kiểm tra quyền" kèm nút thử
            lại, tuyệt đối không xóa dữ liệu và không đăng xuất user.
          */
            if (res.status === 401 || res.status === 403) {
              handleAccessRevoked(
                json.error || 'Tài khoản chưa được duyệt hoặc đã bị khóa.',
                json.code || (res.status === 401 ? 'UNAUTHORIZED' : 'PENDING_APPROVAL'),
              );
            } else {
              showAccessCheckError();
              updateAuthUI();
            }
            throw new Error(json.error || `Không kiểm tra được quyền (HTTP ${res.status})`);
          }
          currentProfile = json.data || json.profile || json;
          /*
          RELOAD_NOTICE_CLIENT_20260729: chỉ hiện banner ở các lần XÁC MINH LẠI
          (checkOnly = true: realtime / quay lại tab / polling). Lần gọi đầy đủ chạy đúng
          lúc MỞ TRANG — vừa tải mới xong thì nhắc "hãy tải lại" là vô nghĩa.
        */
          if (checkOnly && json.reload_notice) showReloadNoticeNow();
          if (truthyFlag(currentProfile?.blocked)) {
            handleAccessRevoked('Tài khoản đã bị khóa', 'BLOCKED');
            return null;
          }
          // Fail-closed: chỉ đi tiếp khi approved === 1 && blocked === 0.
          // (Server đã trả 403 PENDING_APPROVAL trong trường hợp này; đây là lớp
          //  phòng thủ thứ hai phòng khi server cũ chưa kịp deploy.)
          if (!hasFullAccess(currentProfile)) {
            handleAccessRevoked('Tài khoản chưa được phê duyệt', 'PENDING_APPROVAL');
            return null;
          }
          if (!checkOnly) await notifyLoginToDiscordOnce();
          window.__LH_ACCESS_OK = true;
          hidePendingApproval();
          updateAuthUI();
          window.dispatchEvent(new CustomEvent('lh:profile-ready'));
          return currentProfile;
        } catch (e) {
          console.error('[Turso profile]', e);
          currentProfile = null;
          window.__LH_ACCESS_OK = false;
          // Lỗi mạng / JSON hỏng: cũng không được vào web chính.
          if (!document.getElementById('hodPendingApproval')?.classList.contains('hidden')) {
            // gate đã hiển thị ở nhánh trên, giữ nguyên thông điệp
          } else {
            showAccessCheckError();
          }
          updateAuthUI();
          return null;
        } finally {
          activeProfilePromise = null;
        }
      })();
      return activeProfilePromise;
    }

    /*
    V.3: điểm vào DUY NHẤT cho việc "xác minh lại quyền từ Turso".
    lhRevalidateAccess() (interceptor cuối file) gọi hàm này sau khi đã dedupe
    và debounce, nên một sự kiện Realtime chỉ sinh ra tối đa MỘT request.
  */
    window.lhCheckProfileOnce = function (reason) {
      console.debug('[LH access] xác minh lại quyền từ Turso, nguồn:', reason || 'unknown');
      return loadProfile(true, true);
    };

    async function loadQuestionsFromSupabase() {
      if (!currentUser) return false;
      // ACCESS_GATE_STRICT_20260726: fail-closed.
      if (!hasFullAccess(currentProfile)) {
        showPendingApproval();
        return false;
      }
      const activeSubject = localStorage.getItem('learninghub_subject_code_merged_v1') || '';
      if (!activeSubject) return false;
      try {
        const res = await fetch(
          '/api/questions?subject_code=' + encodeURIComponent(activeSubject) + '&ts=' + Date.now(),
          { cache: 'no-store' },
        );
        const json = await res.json().catch(() => ({}));
        if (!res.ok || json.error) throw new Error(json.error || 'Không tải được questions từ Turso');
        const rows = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
        LHState.RAW = rows.map(rowToQuestion);
        LHState.pool = [...LHState.RAW];
        var _sci = +localStorage.getItem('learninghub_progress_' + activeSubject) || 0;
        LHState.ci = Math.max(0, Math.min(_sci, Math.max(0, LHState.pool.length - 1)));
        LHState.flipped = false;
        if ($id('total')) $id('total').textContent = LHState.pool.length;
        try {
          (typeof renderCard === 'function' ? renderCard : window.renderCard)?.();
        } catch (e) {
          lhWarn('APP_DIRECT_DISCORD_LOGIN_NOTIFY_20260627', e);
        }
        try {
          (typeof renderQuiz === 'function' ? renderQuiz : window.renderQuiz)?.();
        } catch (e) {
          lhWarn('APP_DIRECT_DISCORD_LOGIN_NOTIFY_20260627', e);
        }
        try {
          (typeof renderStudy === 'function' ? renderStudy : window.renderStudy)?.();
        } catch (e) {
          lhWarn('APP_DIRECT_DISCORD_LOGIN_NOTIFY_20260627', e);
        }
        notify2('Đã tải câu hỏi từ Turso');
        return true;
      } catch (e) {
        console.warn('[Turso questions]', e);
        notify2('Không tải được câu hỏi từ Turso.');
        return false;
      }
    }

    async function signInGoogle() {
      if (!window.supabase) return alert('Không tải được Supabase. Kiểm tra mạng hoặc CDN.');
      if (!client) return alert('Supabase chưa sẵn sàng.');
      const redirectUrl =
        (window.APP_CONFIG && window.APP_CONFIG.REDIRECT_URL) ||
        window.location.origin + window.location.pathname + window.location.search;
      const { error } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: redirectUrl },
      });
      if (error) alert(error.message);
    }

    async function signIn() {
      if (!client) return;
      const email = $id('authEmail')?.value.trim();
      const password = $id('authPassword')?.value;
      if (!email || !password) return alert('Nhập email và mật khẩu nha.');
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) return alert(error.message);
      currentUser = data.user;
      await loadProfile();
      await loadQuestionsFromSupabase();
      closeAuth();
      notify2('Đã đăng nhập');
    }

    async function signUp() {
      if (!client) return;
      const email = $id('authEmail')?.value.trim();
      const password = $id('authPassword')?.value;
      if (!email || !password) return alert('Nhập email và mật khẩu nha.');
      const { data, error } = await client.auth.signUp({ email, password });
      if (error) return alert(error.message);
      alert('Đã tạo tài khoản. Nếu Supabase yêu cầu xác nhận email, hãy xác nhận rồi đăng nhập.');
    }

    /*
    RELOAD_NOTICE_CLIENT_20260729 — THAY cho FORCE_LOGOUT_REALLY_SIGNS_OUT_20260726.

    Trước đây admin có nút "Đăng xuất người dùng": server set force_logout=1, client huỷ
    phiên Supabase + alert "Bạn đã được quản trị viên đăng xuất khỏi hệ thống" rồi reload.
    Nay đổi thành NHẮC TẢI LẠI: người dùng không bị mất phiên, không có alert chặn màn
    hình — chỉ hiện đúng banner "Hệ thống vừa cập nhật / Tải lại" như khi deploy bản mới,
    và họ tự bấm khi thuận tiện.

    Cờ ở DB (profiles.reload_notice) lo cho người đang offline; realtime lo cho người đang
    mở web. Banner nằm ở src/core/versionChecker.js (showAdminReloadNotice), main.js gán
    vào window.lhShowReloadNotice.
  */
    function showReloadNoticeNow() {
      if (window.__LH_RELOAD_NOTICE_SHOWN) return;
      window.__LH_RELOAD_NOTICE_SHOWN = true;
      try {
        if (typeof window.lhShowReloadNotice === 'function') window.lhShowReloadNotice();
      } catch (e) {
        lhWarn('RELOAD_NOTICE_CLIENT_20260729', e);
      }
    }
    window.lhHandleReloadNotice = showReloadNoticeNow;

    async function signOut() {
      if (!client) return;
      // IX: dọn subscription + timer khi đăng xuất, không để timer mồ côi chạy tiếp.
      try {
        unsubscribeUserStatusRealtime();
        unsubscribeGlobalRealtime(); // RELOAD_NOTICE_REALTIME_20260729
      } catch (e) {
        lhWarn('APP_DIRECT_DISCORD_LOGIN_NOTIFY_20260627', e);
      }
      try {
        if (typeof window.lhTeardownAccessWatch === 'function') window.lhTeardownAccessWatch();
      } catch (e) {
        lhWarn('APP_DIRECT_DISCORD_LOGIN_NOTIFY_20260627', e);
      }
      Object.keys(sessionStorage)
        .filter(k => k.startsWith('hod_web_login_discord_notified_'))
        .forEach(k => sessionStorage.removeItem(k));
      await client.auth.signOut();
      currentUser = null;
      currentProfile = null;
      window.__LH_ACCESS_OK = false;
      updateAuthUI();
      notify2('Đã đăng xuất');
    }

    async function submitEditRequest(newDraft, oldQ) {
      if (!client) return alert('Chưa cấu hình Supabase.');
      if (!currentUser) {
        openAuth();
        return;
      }
      if (!oldQ?.id) {
        alert(
          'Câu hỏi hiện đang lấy từ data local. Hãy đăng nhập và tải questions từ Supabase trước khi gửi yêu cầu sửa.',
        );
        return;
      }
      // Chờ upload ảnh Cloudinary (nếu đang chạy dở) rồi quét nốt ảnh base64 còn sót,
      // tránh trường hợp bấm gửi trước khi upload xong làm ảnh bị lọc mất khi gửi lên backend.
      try {
        if (typeof window.__LHGetPendingImageUpload === 'function') {
          const p = window.__LHGetPendingImageUpload();
          if (p) await p;
        }
        if (typeof window.__LHUploadPendingDataUrls === 'function') await window.__LHUploadPendingDataUrls();
      } catch (e) {
        console.warn('Chờ upload ảnh trước khi gửi yêu cầu sửa thất bại:', e);
      }
      const payload = {
        question_id: oldQ.id,
        question_num: oldQ.num,
        subject_code: oldQ.subject_code || newDraft.subject_code || '',
        user_id: currentUser.id,
        user_email: currentUser.email || currentProfile?.email || '',
        old_data: questionToRow(oldQ),
        new_data: questionToRow(newDraft),
        reason: '',
      };
      const res = await fetch('/api/edit-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify(payload),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || out.error) return alert('Gửi yêu cầu sửa thất bại: ' + (out.error || res.status));
      $id('editModal')?.classList.add('hidden');
      notify2('Đã gửi yêu cầu sửa, đang chờ admin duyệt');
    }

    async function loadPendingRequests() {
      if (!client || !isAdmin()) return;
      const list = $id('adminRequests');
      const count = $id('adminCount');
      if (list) list.innerHTML = '<div class="more">Đang tải...</div>';
      let data = [];
      try {
        const res = await fetch('/api/admin-dashboard', { cache: 'no-store' });
        const dash = await res.json().catch(() => ({}));
        if (!res.ok || dash.error) throw new Error(dash.error || res.status);
        data = (dash.requests || [])
          .filter(r => r.status === 'pending')
          .map(r => ({
            ...r,
            old_data: typeof r.old_data === 'string' ? JSON.parse(r.old_data || '{}') : r.old_data,
            new_data: typeof r.new_data === 'string' ? JSON.parse(r.new_data || '{}') : r.new_data,
          }));
      } catch (e) {
        if (list) list.innerHTML = '<div class="more">' + esc(e.message || 'Lỗi tải') + '</div>';
        return;
      }
      if (count) count.textContent = `${data.length} yêu cầu`;
      if (!list) return;
      list.innerHTML = data.length
        ? data
            .map(
              r => `
      <div class="adminReq" data-request-id="${r.id}">
        <div class="adminReqHead"><span>Request #${r.id} · Câu ${r.question_num || r.question_id}</span><span>${new Date(r.created_at).toLocaleString()}</span></div>
        <div class="compareGrid">
          <div class="compareBox"><h4>Nội dung cũ</h4><pre>${esc(safeJson(r.old_data))}</pre></div>
          <div class="compareBox"><h4>Nội dung đề xuất</h4><pre>${esc(safeJson(r.new_data))}</pre></div>
        </div>
        <div class="adminActions">
          <button class="btn approveBtn" data-approve="${r.id}">Duyệt</button>
          <button class="btn rejectBtn" data-reject="${r.id}">Từ chối</button>
        </div>
      </div>`,
            )
            .join('')
        : '<div class="more">Không có yêu cầu chờ duyệt.</div>';
      list.querySelectorAll('[data-approve]').forEach(
        btn =>
          (btn.onclick = () =>
            approveRequest(
              Number(btn.dataset.approve),
              data.find(x => x.id === Number(btn.dataset.approve)),
            )),
      );
      list
        .querySelectorAll('[data-reject]')
        .forEach(btn => (btn.onclick = () => rejectRequest(Number(btn.dataset.reject))));
    }

    async function approveRequest(id, req) {
      if (!isAdmin()) return alert('Chỉ admin mới duyệt được.');
      const res = await fetch('/api/admin-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ user_id: currentUser.id, action: 'approve_request', payload: { request_id: id } }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || out.error) return alert('Không duyệt được: ' + (out.error || res.status));
      if (typeof window.clearLearningHubQuestionCache === 'function') window.clearLearningHubQuestionCache();
      notify2('Đã duyệt yêu cầu');
      try {
        await loadPendingRequests();
      } catch (e) {
        console.warn('loadPendingRequests failed:', e);
      }
      try {
        await loadQuestionsFromSupabase();
      } catch (e) {
        console.warn('loadQuestions failed:', e);
      }
    }

    async function rejectRequest(id) {
      if (!isAdmin()) return alert('Chỉ admin mới từ chối được.');
      const note = prompt('Lý do từ chối (tuỳ chọn):') || '';
      const res = await fetch('/api/admin-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({
          user_id: currentUser.id,
          action: 'reject_request',
          payload: { request_id: id, admin_note: note },
        }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || out.error) return alert('Không từ chối được: ' + (out.error || res.status));
      notify2('Đã từ chối yêu cầu');
      try {
        await loadPendingRequests();
      } catch (e) {
        console.warn('loadPendingRequests failed:', e);
      }
    }

    async function applyOAuthHashSession(supaClient) {
      try {
        let h = window.location.hash || '';
        if (!h) return false;
        h = h.replace(/^#/, '').replace(/&amp;/g, '&');
        const p = new URLSearchParams(h);
        const access_token = p.get('access_token');
        const refresh_token = p.get('refresh_token');
        if (!access_token || !refresh_token) return false;
        const { error } = await supaClient.auth.setSession({ access_token, refresh_token });
        if (error) {
          console.warn('setSession from hash failed:', error);
          return false;
        }
        history.replaceState(null, '', window.location.pathname + window.location.search);
        return true;
      } catch (e) {
        console.warn('applyOAuthHashSession error:', e);
        return false;
      }
    }
    async function init() {
      setupHeaderAuthUI();
      $id('authGoogle')?.addEventListener('click', signInGoogle);
      $id('authLogin')?.addEventListener('click', signIn);
      $id('authSignup')?.addEventListener('click', signUp);
      $id('authClose')?.addEventListener('click', closeAuth);
      $id('adminClose')?.addEventListener('click', closeAdmin);
      $id('adminReload')?.addEventListener('click', loadPendingRequests);
      $id('hodPendingRefresh')?.addEventListener('click', async () => {
        const btn = $id('hodPendingRefresh');
        if (btn) {
          btn.disabled = true;
          btn.textContent = 'Đang kiểm tra...';
        }
        await loadProfile();
        if (hasFullAccess(currentProfile)) await loadQuestionsFromSupabase();
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Kiểm tra lại';
        }
      });
      $id('hodPendingLogout')?.addEventListener('click', async () => {
        await signOut();
        hidePendingApproval();
      });

      if (!configured()) {
        updateAuthUI();
        return;
      }
      client = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
      await applyOAuthHashSession(client);
      const { data } = await client.auth.getSession();
      currentUser = data.session?.user || null;
      if (currentUser) {
        const prof = await loadProfile();
        if (prof) {
          await loadQuestionsFromTurso();
          if (typeof window.__LHTriggerSubjectCheck === 'function') window.__LHTriggerSubjectCheck();
        }
      } else updateAuthUI();

      client.auth.onAuthStateChange(async (_event, session) => {
        currentUser = session?.user || null;
        if (currentUser) {
          const prof = await loadProfile();
          if (prof) {
            await loadQuestionsFromTurso();
            if (typeof window.__LHTriggerSubjectCheck === 'function') window.__LHTriggerSubjectCheck();
          }
        } else {
          currentProfile = null;
          updateAuthUI();
        }
      });
    }

    // FIX_AUTO_LOAD_ON_SESSION_RESTORE_20260701: khi khoi phuc phien dang nhap luc mo lai trang,
    // uu tien goi thang loader Turso chuan (loadCurrentSubjectOnly) thay vi ham loadQuestionsFromSupabase
    // cu o tren (ham cu khong tu cap nhat lai man hinh khi loi, khien giao dien ket o "Dang cho du lieu Supabase...").
    async function loadQuestionsFromTurso() {
      if (typeof window.loadCurrentSubjectOnly === 'function') return window.loadCurrentSubjectOnly();
      return loadQuestionsFromSupabase();
    }

    document.addEventListener('DOMContentLoaded', init);

    return {
      init,
      isReady,
      isAdmin,
      canOpenDashboard,
      submitEditRequest,
      loadQuestionsFromSupabase,
      openAuth,
      openAdmin,
      signOut,
      signInGoogle,
      getUser: () => currentUser,
      getProfile: () => currentProfile,
      get __client() {
        return client;
      },
    };
  })();

  // ===== HOD Login + Admin UI (added) =====
  (function () {
    function $(id) {
      return document.getElementById(id);
    }
    function hideLanding() {
      $('hodLoginScreen')?.classList.add('hidden');
    }
    function openLogin() {
      hideLanding();
      if (window.HODSupabase?.openAuth) window.HODSupabase.openAuth();
      else alert('Supabase UI chưa sẵn sàng, hãy tải lại trang.');
    }
    function openAdmin() {
      hideLanding();
      if (window.HODSupabase?.canOpenDashboard?.()) window.HODSupabase.openAdmin();
      else {
        if (window.HODSupabase?.openAuth) window.HODSupabase.openAuth();
        setTimeout(() => alert('Đăng nhập tài khoản admin trước. Sau đó bấm nút Admin lại.'), 80);
      }
    }
    function bind() {
      $('hodGuestEnter')?.addEventListener('click', hideLanding);
      $('hodOpenLogin')?.addEventListener('click', openLogin);
      $('hodOpenAdmin')?.addEventListener('click', openAdmin);
      $('hodFloatLogin')?.addEventListener('click', openLogin);
      $('hodFloatAdmin')?.addEventListener('click', openAdmin);
      const box = document.querySelector('#authModal .box.authBox');
      if (box && !document.getElementById('hodAuthExtraHint')) {
        const hint = document.createElement('div');
        hint.id = 'hodAuthExtraHint';
        hint.className = 'hodAuthHint';
        hint.textContent =
          'Người học dùng Đăng nhập/Đăng ký. Admin đăng nhập bằng tài khoản đã được set role = admin trong Supabase.';
        box.appendChild(hint);
      }
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
    else bind();
  })();

  // ===== Admin visibility hard fix =====
  (function () {
    function applyAdminGuard() {
      const isAdmin = !!window.HODSupabase?.canOpenDashboard?.();
      document.body?.classList.toggle('hod-is-admin', isAdmin);
      ['adminOpenBtn', 'hodFloatAdmin'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.classList.toggle('hidden', !isAdmin);
        el.style.display = isAdmin ? '' : 'none';
      });
      const modal = document.getElementById('adminModal');
      if (modal && !isAdmin) modal.classList.add('hidden');
    }
    function patchOpenAdmin() {
      if (!window.HODSupabase || window.HODSupabase.__adminGuardPatched) return;
      const oldOpen = window.HODSupabase.openAdmin;
      window.HODSupabase.openAdmin = function () {
        if (!window.HODSupabase.canOpenDashboard?.()) {
          document.getElementById('adminModal')?.classList.add('hidden');
          alert('Tài khoản Google này chưa có quyền admin.');
          applyAdminGuard();
          return;
        }
        return oldOpen?.apply(this, arguments);
      };
      window.HODSupabase.__adminGuardPatched = true;
    }
    function tick() {
      patchOpenAdmin();
      applyAdminGuard();
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tick);
    else tick();
    setInterval(tick, 500);
  })();

  // ===== ACCOUNT AVATAR CLEAN FINAL =====
  (function () {
    function $(id) {
      return document.getElementById(id);
    }
    function user() {
      return window.HODSupabase?.getUser?.() || null;
    }
    function profile() {
      return window.HODSupabase?.getProfile?.() || null;
    }
    function isAdmin() {
      return !!window.HODSupabase?.canOpenDashboard?.();
    }
    function email() {
      return profile()?.email || user()?.email || '';
    }
    function meta() {
      return user()?.user_metadata || {};
    }
    function avatarHTML() {
      const u = meta().avatar_url || meta().picture || '';
      const e = email();
      const l = (e || 'U').trim().charAt(0).toUpperCase();
      return u ? '<img src="' + esc(u) + '" alt="avatar" loading="lazy" decoding="async">' : l;
    }
    function ensureAvatar() {
      const actions =
        document.querySelector('.globalTop .actions') ||
        document.querySelector('#fc .actions') ||
        document.querySelector('.actions');
      if (!actions || $('hodTopAvatar')) return;
      const btn = document.createElement('button');
      btn.id = 'hodTopAvatar';
      btn.className = 'hodTopAvatar';
      btn.type = 'button';
      btn.onclick = toggleMenu;
      actions.appendChild(btn);
    }
    function toggleMenu() {
      if (!user()) return showLogin();
      updateMenu();
      $('hodAccountMenu')?.classList.toggle('hidden');
    }
    function showLogin() {
      if (window.__LOCAL_DEV_MODE) return;
      document.body?.classList.add('hod-locked');
      $('hodLoginGate')?.classList.remove('hidden');
      $('hodAccountMenu')?.classList.add('hidden');
      $('hodPendingApproval')?.classList.add('hidden');
    }
    function hideLogin() {
      document.body?.classList.remove('hod-locked');
      $('hodLoginGate')?.classList.add('hidden');
    }
    function login() {
      const api = window.HODSupabase;
      if (!api) {
        alert('Supabase chưa sẵn sàng, hãy tải lại trang.');
        return;
      }
      if (api.signInGoogle) {
        api.signInGoogle();
        return;
      }
      api.openAuth?.();
    }
    async function logout() {
      await window.HODSupabase?.signOut?.();
      showLogin();
      updateAll();
    }
    function openDash() {
      if (isAdmin()) window.open('admin.html', '_blank');
      else alert('Tài khoản này không có quyền admin.');
    }
    function updateMenu() {
      const admin = isAdmin();
      const pRole = profile()?.role || (email() === 'trongbm2004@gmail.com' ? 'admin' : 'user');
      const rawRole = String(pRole).toLowerCase();
      const mail = $('hodAccountEmail');
      if (mail) mail.textContent = email() || 'Chưa đăng nhập';
      const role = $('hodAccountRole');
      if (role)
        role.textContent =
          rawRole === 'admin' || email() === 'trongbm2004@gmail.com'
            ? 'Admin'
            : rawRole === 'editor'
              ? 'Editor'
              : 'Người học';
      const av = $('hodAccountAvatarBig');
      if (av) {
        const __avb = avatarHTML();
        if (av.dataset.av !== __avb) {
          av.innerHTML = __avb;
          av.dataset.av = __avb;
        }
      }
      $('hodAccountDashboard')?.classList.toggle('hidden', !admin);
    }
    /*
    PENDING_GATE_STICKY_20260726
    Bug: điều kiện cũ là `u && p && p.approved === false`. Từ khi /api/profile trả
    403 PENDING_APPROVAL thì user chưa duyệt KHÔNG bao giờ có profile nữa
    (handleAccessRevoked đặt currentProfile = null), nên p = null -> pending = false
    -> nhánh `else if (u)` của interval 500ms này ẩn luôn màn "Chờ phê duyệt" mà
    showPendingApproval() vừa mở và bỏ luôn class hod-locked. Kết quả: user chưa
    duyệt nhìn thấy giao diện chính rỗng với dòng "Tài khoản chưa được duyệt hoặc
    đã bị khóa." nằm trong khung câu hỏi (do purgeOfflineQuestionCache ghi vào
    #question), thay vì màn chờ duyệt.
    Nay: showPendingApproval()/hidePendingApproval() là chủ của gate
    (window.__LH_GATE_LOCKED); interval này chỉ đồng bộ theo, không tự đóng gate,
    và KHÔNG ghi đè title/message vì lý do chặn (chờ duyệt / bị khóa / hết phiên)
    do luồng quyền đặt.
  */
    function denied() {
      const u = user();
      if (!u) return false;
      if (window.__LH_GATE_LOCKED === true) return true;
      const p = profile();
      return !!p && !(window.lhHasFullAccess?.(p) ?? true);
    }
    function updateAll() {
      ensureAvatar();
      const u = user();
      const p = profile();
      const admin = isAdmin();
      const pending = denied();
      document.body?.classList.toggle('hod-is-admin-final', admin);
      if (pending) {
        $('hodLoginGate')?.classList.add('hidden');
        $('hodPendingApproval')?.classList.remove('hidden');
        document.body?.classList.add('hod-locked');
        const emailEl = $('hodPendingEmail');
        if (emailEl && !emailEl.textContent) emailEl.textContent = p?.email || u.email || '';
      } else if (u) {
        hideLogin();
        $('hodPendingApproval')?.classList.add('hidden');
      } else if (window.__LH_GATE_LOCKED === true) {
        /* BLOCKED: đã signOut nhưng vẫn phải đọc được lý do; chỉ nút "Đăng xuất" trong gate mới mở cờ này. */
      } else {
        showLogin();
      }
      const top = $('hodTopAvatar');
      if (top) {
        const __ah = avatarHTML();
        if (top.dataset.av !== __ah) {
          top.innerHTML = __ah;
          top.dataset.av = __ah;
        }
        top.style.display = u && !pending ? 'grid' : 'none';
      }
      const headerAdmin = $('adminOpenBtn');
      if (headerAdmin) {
        headerAdmin.remove();
      }
      if (!admin) $('adminModal')?.classList.add('hidden');
      updateMenu();
    }
    function patchAdmin() {
      if (!window.HODSupabase || window.HODSupabase.__avatarCleanPatch) return;
      const old = window.HODSupabase.openAdmin;
      window.HODSupabase.openAdmin = function () {
        if (!window.HODSupabase.canOpenDashboard?.()) {
          $('adminModal')?.classList.add('hidden');
          alert('Tài khoản này không có quyền admin.');
          return;
        }
        return old?.apply(this, arguments);
      };
      window.HODSupabase.__avatarCleanPatch = true;
    }
    function bind() {
      $('hodGateLoginBtn')?.addEventListener('click', login);
      $('hodLogoutBtn')?.addEventListener('click', logout);
      $('hodAccountDashboard')?.addEventListener('click', openDash);
      document.addEventListener('click', e => {
        const m = $('hodAccountMenu'),
          a = $('hodTopAvatar');
        if (m && !m.contains(e.target) && a && !a.contains(e.target)) m.classList.add('hidden');
      });
      setInterval(() => {
        patchAdmin();
        updateAll();
      }, 500);
      setTimeout(() => {
        patchAdmin();
        updateAll();
      }, 250);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
    else bind();
  })();
}

export function installUnifiedFetchAndAccess() {
  // ===== LH_UNIFIED_FETCH_AND_ACCESS_20260726 =====
  /*
  INTERCEPTOR FETCH DUY NHẤT của app học sinh (mục VIII) + hàng rào xác minh
  quyền (mục V, VI, VII, IX, X).

  Trước đây file này ghi đè window.fetch BỐN lần (APP_API_DEDUPE,
  APP_F5_SUPABASE_CACHE, COPILOT_CLEAN_RUNTIME_GUARD, LH_AUTH_FETCH). Ba lớp đầu
  đã bị xóa; đây là lớp duy nhất còn lại.

  Nguyên tắc:
  - originalFetch được lưu ĐÚNG MỘT LẦN, cờ __LH_UNIFIED_FETCH_INSTALLED chống
    cài lại khi init / auth state thay đổi.
  - Chỉ gắn Authorization cho request /api/ CÙNG ORIGIN. Token phải là chuỗi
    không rỗng, không chứa ký tự xuống dòng (header injection).
  - Header chuẩn hóa bằng new Headers(init.headers || {}).
  - Response được clone() trước khi đọc JSON, hàm gọi phía sau vẫn dùng được body.
  - Chỉ 401 UNAUTHORIZED / 403 BLOCKED / 403 PENDING_APPROVAL / 403
    INSUFFICIENT_ROLE mới kích hoạt luồng thu hồi quyền. Lỗi mạng và 5xx KHÔNG
    bị coi là mất quyền.
*/
  (function () {
    if (window.__LH_UNIFIED_FETCH_INSTALLED) return;
    window.__LH_UNIFIED_FETCH_INSTALLED = true;

    var originalFetch = typeof window.fetch === 'function' ? window.fetch.bind(window) : null;
    if (!originalFetch) return;
    window.__lhOriginalFetch = originalFetch;

    // ---------- Token ----------
    function validToken(t) {
      return typeof t === 'string' && t.trim().length > 0 && !/[\r\n]/.test(t);
    }

    function readTokenFromStorage(raw) {
      if (!raw) return '';
      var v;
      try {
        v = JSON.parse(raw);
      } catch (e) {
        return '';
      }
      var tok =
        v && (v.access_token || (v.currentSession && v.currentSession.access_token) || (Array.isArray(v) && v[0]));
      var exp = v && (v.expires_at || (v.currentSession && v.currentSession.expires_at));
      if (!validToken(tok)) return '';
      // Token hết hạn: không gắn header rác, để server trả 401 sạch sẽ.
      if (exp && Date.now() / 1000 > exp - 10) return '';
      return tok.trim();
    }

    /*
    LH_SESSION_REFRESH_20260729 — RỜI WEB LÂU QUAY LẠI KHÔNG BỊ ĐĂNG XUẤT NỮA.

    Bệnh cũ: access_token của Supabase sống 1 giờ. readTokenFromStorage() thấy token hết hạn
    thì trả '' (đúng — không gắn header rác), request /api/ đi ra không có Authorization,
    server trả 401 UNAUTHORIZED, handleAccessRevoked('UNAUTHORIZED') GỌI signOut() luôn.
    Trong khi refresh_token trong localStorage vẫn còn dùng được hàng chục ngày.
    Máy sleep / tab bị treo mấy tiếng là timer tự làm mới của supabase-js không kịp chạy trước
    request đầu tiên -> người dùng phải chọn lại mail Google dù chưa hề hết phiên thật.

    Nay: token thiếu/hết hạn thì LÀM MỚI TRƯỚC khi gọi, và 401 thì làm mới rồi THỬ LẠI ĐÚNG
    MỘT LẦN. Chỉ khi làm mới cũng thất bại (refresh_token hết hạn / bị thu hồi) mới coi là
    UNAUTHORIZED và đăng xuất. Nhiều request 401 cùng lúc dùng chung một lần làm mới
    (refreshInFlight), không bắn n request refresh song song.
  */
    function storedSession() {
      try {
        var url = (window.APP_CONFIG && window.APP_CONFIG.SUPABASE_URL) || '';
        var m = /https:\/\/([a-z0-9]+)\.supabase\./i.exec(url);
        var keys = [];
        if (m) keys.push('sb-' + m[1] + '-auth-token');
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i);
          if (k && k.slice(0, 3) === 'sb-' && k.slice(-11) === '-auth-token' && keys.indexOf(k) === -1) keys.push(k);
        }
        for (var j = 0; j < keys.length; j++) {
          var raw = localStorage.getItem(keys[j]);
          if (!raw) continue;
          var v = JSON.parse(raw);
          var s = v && v.currentSession ? v.currentSession : v;
          if (s && (s.access_token || s.refresh_token)) return s;
        }
      } catch (e) {
        lhWarn('LH_SESSION_REFRESH_20260729', e);
      }
      return null;
    }
    function hasRefreshToken() {
      var s = storedSession();
      return !!(s && typeof s.refresh_token === 'string' && s.refresh_token.length > 0);
    }
    function authClient() {
      try {
        var c = window.HODSupabase && window.HODSupabase.__client;
        return c && c.auth ? c : null;
      } catch (e) {
        return null;
      }
    }
    function freshTokenOf(session) {
      if (!session) return '';
      var tok = session.access_token;
      if (!validToken(tok)) return '';
      if (session.expires_at && Date.now() / 1000 > session.expires_at - 10) return '';
      return tok.trim();
    }
    var refreshInFlight = null;
    function lhRefreshToken() {
      if (refreshInFlight) return refreshInFlight;
      var c = authClient();
      // Không có client (chưa init) hoặc không có refresh_token: không có gì để làm mới.
      if (!c || !hasRefreshToken()) return Promise.resolve('');
      refreshInFlight = Promise.resolve()
        .then(function () {
          // getSession() của supabase-js v2 tự làm mới khi token đã hết hạn.
          return c.auth.getSession();
        })
        .then(function (r) {
          var tok = freshTokenOf(r && r.data && r.data.session);
          if (tok) return tok;
          return c.auth.refreshSession().then(function (r2) {
            return freshTokenOf(r2 && r2.data && r2.data.session);
          });
        })
        .catch(function (e) {
          lhWarn('LH_SESSION_REFRESH_20260729', e);
          return '';
        })
        .then(function (tok) {
          refreshInFlight = null;
          return tok;
        });
      return refreshInFlight;
    }
    window.__lhRefreshAccessToken = lhRefreshToken;

    function lhToken() {
      try {
        var url = (window.APP_CONFIG && window.APP_CONFIG.SUPABASE_URL) || '';
        var m = /https:\/\/([a-z0-9]+)\.supabase\./i.exec(url);
        var ref = m ? m[1] : '';
        if (ref) {
          var t = readTokenFromStorage(localStorage.getItem('sb-' + ref + '-auth-token'));
          if (t) return t;
        }
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i);
          if (k && k.slice(0, 3) === 'sb-' && k.slice(-11) === '-auth-token') {
            var t2 = readTokenFromStorage(localStorage.getItem(k));
            if (t2) return t2;
          }
        }
      } catch (e) {
        lhWarn('LH_UNIFIED_FETCH_AND_ACCESS_20260726', e);
      }
      return '';
    }
    window.__lhAccessToken = lhToken;

    // ---------- Nhận dạng URL ----------
    function toUrl(input) {
      try {
        var raw = typeof input === 'string' ? input : (input && input.url) || '';
        if (!raw) return null;
        return new URL(raw, location.href);
      } catch (e) {
        return null;
      }
    }
    function isOwnApi(url) {
      return !!url && url.origin === location.origin && url.pathname.indexOf('/api/') === 0;
    }
    function methodOf(input, init) {
      if (init && init.method) return String(init.method).toUpperCase();
      if (input && typeof input === 'object' && input.method) return String(input.method).toUpperCase();
      return 'GET';
    }

    // ---------- Cache Supabase REST (giữ từ COPILOT_CLEAN_RUNTIME_GUARD) ----------
    /*
    Editor sửa câu hỏi vẫn còn vài chỗ đọc Supabase REST (tra id câu hỏi, ảnh).
    Chỉ cache GET, chỉ trên host Supabase, và KHÔNG BAO GIỜ cache /rest/v1/profiles
    — đó là bảng trạng thái, cache nó là tự tạo lại đúng lỗ hổng vừa xóa.
  */
    var restCache = new Map();
    var restPending = new Map();

    function supabaseOrigin() {
      try {
        return new URL((window.APP_CONFIG && window.APP_CONFIG.SUPABASE_URL) || '').origin;
      } catch (e) {
        return '';
      }
    }
    function restTtl(url, method) {
      if (method !== 'GET') return 0;
      var origin = supabaseOrigin();
      if (!origin || url.origin !== origin) return 0;
      var p = url.pathname;
      if (p.indexOf('/rest/v1/') !== 0 && p.indexOf('/rest/v1/') === -1) return 0;
      if (p.indexOf('/rest/v1/profiles') !== -1) return 0; // KHÔNG cache trạng thái quyền
      if (p.indexOf('/rest/v1/questions') !== -1) return 2 * 60 * 1000;
      if (p.indexOf('/rest/v1/subjects') !== -1) return 2 * 60 * 1000;
      if (p.indexOf('/rest/v1/site_settings') !== -1) return 60 * 1000;
      return 0;
    }
    function restKey(url) {
      var params = Array.from(url.searchParams.entries()).sort(function (a, b) {
        return (a[0] + '=' + a[1]).localeCompare(b[0] + '=' + b[1]);
      });
      return (
        url.origin +
        url.pathname +
        '?' +
        params
          .map(function (x) {
            return x[0] + '=' + x[1];
          })
          .join('&')
      );
    }
    function matchKind(text, kind) {
      if (!kind || kind === 'all') return true;
      return text.indexOf('/' + kind) !== -1;
    }
    function clearRestCache(kind) {
      Array.from(restCache.keys()).forEach(function (k) {
        if (matchKind(k, kind)) restCache.delete(k);
      });
      Array.from(restPending.keys()).forEach(function (k) {
        if (matchKind(k, kind)) restPending.delete(k);
      });
      try {
        // Dọn nốt các key sessionStorage do những bản cache cũ để lại.
        Object.keys(sessionStorage).forEach(function (k) {
          if (k.indexOf('lh_f5_cache:') === 0) sessionStorage.removeItem(k);
        });
      } catch (e) {
        lhWarn('LH_UNIFIED_FETCH_AND_ACCESS_20260726', e);
      }
    }
    window.clearLearningHubSupabaseCache = clearRestCache;

    // ---------- Điều phối 401/403 ----------
    var REVOKE_CODES = { UNAUTHORIZED: 1, BLOCKED: 1, PENDING_APPROVAL: 1, INSUFFICIENT_ROLE: 1 };

    function dispatchDenial(code, message) {
      /*
      INSUFFICIENT_ROLE nghĩa là phiên vẫn hợp lệ, chỉ là thao tác vừa rồi vượt
      quyền (vd người học gọi nhầm endpoint quản trị). Xóa sạch dữ liệu học và
      đá về màn hình chờ duyệt trong trường hợp này là sai — chỉ báo lỗi.
    */
      if (code === 'INSUFFICIENT_ROLE') {
        if (typeof notify === 'function') notify(message || 'Bạn không có quyền thực hiện thao tác này');
        return;
      }
      if (typeof window.handleAccessRevoked === 'function') {
        window.handleAccessRevoked(message || 'Tài khoản bị từ chối truy cập.', code);
      }
    }

    function inspectDenial(res) {
      // Clone trước khi đọc: body gốc vẫn còn nguyên cho hàm gọi phía sau.
      res
        .clone()
        .json()
        .then(function (data) {
          var code = data && data.code;
          if (code && REVOKE_CODES[code]) dispatchDenial(code, data.error);
          else if (!code) {
            // 401/403 không có code: coi như phiên hỏng, nhưng không đoán BLOCKED.
            dispatchDenial(res.status === 401 ? 'UNAUTHORIZED' : 'PENDING_APPROVAL', null);
          }
        })
        .catch(function () {
          dispatchDenial(res.status === 401 ? 'UNAUTHORIZED' : 'PENDING_APPROVAL', null);
        });
    }

    /*
    Gắn Authorization + signal chung vào một request /api/. Trả về [input, init] để gọi
    originalFetch.apply(). Tách riêng vì phải dùng LẠI khi thử lại sau khi làm mới token
    (LH_SESSION_REFRESH_20260729) — trước đây phần này viết thẳng trong interceptor.
  */
    function withAuth(input, init, tok, force) {
      try {
        if (input instanceof Request) {
          if (tok && (force || !input.headers.has('Authorization'))) {
            var h = new Headers(input.headers);
            h.set('Authorization', 'Bearer ' + tok);
            input = new Request(input, { headers: h });
          }
          return [input, init];
        }
        init = init ? Object.assign({}, init) : {};
        var hh = new Headers(init.headers || {});
        // Lần đầu: KHÔNG ghi đè Authorization do hàm gọi tự đặt. Lúc thử lại (force) thì phải
        // ghi đè, vì header cũ chính là token vừa hết hạn.
        if (tok && (force || !hh.has('Authorization'))) hh.set('Authorization', 'Bearer ' + tok);
        init.headers = hh;
        // VI: mọi request /api/ đều gắn signal chung để hủy được hàng loạt
        // ngay khi quyền bị thu hồi.
        if (!init.signal && typeof window.getLhApiSignal === 'function') {
          var sig = window.getLhApiSignal();
          if (sig) init.signal = sig;
        }
        return [input, init];
      } catch (e) {
        console.warn('[LH fetch] không gắn được Authorization:', e);
        return [input, init];
      }
    }

    // ---------- Interceptor ----------
    window.fetch = function (input, init) {
      var url = toUrl(input);
      var method = methodOf(input, init);
      var ownApi = isOwnApi(url);

      if (ownApi) {
        /*
        VI: khi đã BIẾT CHẮC không có quyền (=== false), chặn ngay ở client mọi
        request dữ liệu học. Server vẫn tự bảo vệ bằng checkUserAccess() — đây chỉ
        là lớp chặn sớm để khỏi gọi thừa và không rò dữ liệu vào UI.
        Chỉ chặn khi === false, không chặn lúc chưa rõ (undefined), tránh chặn nhầm
        request chạy song song trước khi /api/profile trả về.
      */
        if (window.__LH_ACCESS_OK === false && /\/api\/(subjects|questions)\b/.test(url.pathname)) {
          return Promise.resolve(
            new Response(JSON.stringify({ error: 'Tài khoản chưa được phê duyệt', code: 'PENDING_APPROVAL' }), {
              status: 403,
              headers: { 'content-type': 'application/json' },
            }),
          );
        }

        // Bản chưa dùng, giữ để THỬ LẠI được sau khi làm mới token (body của Request chỉ đọc
        // được một lần nên phải clone TRƯỚC lần gọi đầu).
        var retrySrc = input instanceof Request ? input.clone() : input;
        var retryInit = init;
        var tok = lhToken();
        // Token thiếu/hết hạn nhưng còn refresh_token: làm mới TRƯỚC khi gọi, đừng để server
        // trả 401 rồi đăng xuất người dùng (LH_SESSION_REFRESH_20260729).
        var pre = tok || !hasRefreshToken() ? Promise.resolve(tok) : lhRefreshToken();

        return pre.then(function (token) {
          return originalFetch.apply(null, withAuth(input, init, token)).then(function (res) {
            if (url.pathname.indexOf('/api/version.json') !== -1) return res;
            if (res.status === 401) {
              // 401 CÓ THỂ chỉ là token vừa hết hạn. Làm mới rồi thử lại đúng một lần.
              return lhRefreshToken().then(function (fresh) {
                if (!fresh || fresh === token) {
                  inspectDenial(res);
                  return res;
                }
                var args = withAuth(retrySrc, retryInit, fresh, true);
                return originalFetch.apply(null, args).then(function (res2) {
                  if (res2.status === 401 || res2.status === 403) inspectDenial(res2);
                  return res2;
                });
              });
            }
            if (res.status === 403) inspectDenial(res);
            return res;
          });
        });
        // Lỗi mạng: để promise reject tự nhiên. KHÔNG coi là thu hồi quyền (VIII).
      }

      // ----- Nhánh Supabase REST: cache GET nhẹ, không đụng tới header -----
      var ttl = url ? restTtl(url, method) : 0;
      if (!ttl) return originalFetch(input, init);

      var key = restKey(url);
      var hit = restCache.get(key);
      if (hit && Date.now() - hit.at < ttl) return Promise.resolve(hit.res.clone());

      if (restPending.has(key)) {
        return restPending.get(key).then(function (r) {
          return r.clone();
        });
      }
      var job = originalFetch(input, init)
        .then(function (res) {
          if (res.ok) restCache.set(key, { at: Date.now(), res: res.clone() });
          restPending.delete(key);
          return res;
        })
        .catch(function (err) {
          restPending.delete(key);
          throw err;
        });
      restPending.set(
        key,
        job.then(function (r) {
          return r.clone();
        }),
      );
      return job;
    };

    /*
    ============================================================
    HÀNG RÀO XÁC MINH QUYỀN (V.3, X)
    ============================================================
    Mọi tín hiệu (Realtime, quay lại tab, polling fallback) đều đi qua đây, và
    đây là nơi DUY NHẤT gọi /api/profile để xác minh lại:
      - Đang có request chạy  -> dùng chung, không tạo request thứ hai.
      - Vừa xác minh xong < 3s -> bỏ qua (debounce).
      - Một sự kiện Realtime  -> tối đa một lần kiểm tra.
  */
    var inflight = null;
    var lastCheckAt = 0;
    var MIN_INTERVAL = 3000; // 3 giây (spec: 2-5s)

    function lhRevalidateAccess(reason, force) {
      if (inflight) return inflight;
      if (!force && Date.now() - lastCheckAt < MIN_INTERVAL) return Promise.resolve(null);

      var api = window.HODSupabase;
      if (!api || typeof api.getUser !== 'function' || !api.getUser()) return Promise.resolve(null);
      if (typeof window.lhCheckProfileOnce !== 'function') return Promise.resolve(null);

      lastCheckAt = Date.now();
      inflight = Promise.resolve(window.lhCheckProfileOnce(reason))
        .catch(function (e) {
          console.warn('[LH access] kiểm tra thất bại:', e);
          return null;
        })
        .then(function (r) {
          inflight = null;
          lastCheckAt = Date.now();
          return r;
        });
      return inflight;
    }
    window.lhRevalidateAccess = lhRevalidateAccess;

    /*
    IX. DỰ PHÒNG KHI REALTIME MẤT KẾT NỐI
    Realtime là cơ chế chính. Polling chỉ chạy khi: Realtime disconnected VÀ tab
    visible VÀ còn phiên Supabase. Chỉ tồn tại duy nhất một timer.
  */
    var pollTimer = null;
    var POLL_MS = 90 * 1000; // 90s, nằm trong khoảng 60-120s

    function startFallbackPolling() {
      if (pollTimer) return; // chống tạo nhiều interval sau mỗi lần render/đăng nhập
      if (window.__lhRealtimeConnected) return;
      console.log('[LH access] Realtime mất kết nối -> bật polling dự phòng', POLL_MS / 1000 + 's');
      pollTimer = setInterval(function () {
        if (window.__lhRealtimeConnected) {
          stopFallbackPolling();
          return;
        }
        if (document.visibilityState !== 'visible') return;
        var api = window.HODSupabase;
        if (!api || typeof api.getUser !== 'function' || !api.getUser()) return;
        lhRevalidateAccess('polling');
      }, POLL_MS);
    }

    function stopFallbackPolling() {
      if (!pollTimer) return;
      console.log('[LH access] Realtime đã kết nối lại -> tắt polling dự phòng');
      clearInterval(pollTimer);
      pollTimer = null;
    }

    window.startFallbackPolling = startFallbackPolling;
    window.stopFallbackPolling = stopFallbackPolling;
    // Dùng khi đăng xuất / khởi tạo lại app: dọn timer, tránh timer mồ côi.
    window.lhTeardownAccessWatch = function () {
      stopFallbackPolling();
      inflight = null;
      lastCheckAt = 0;
    };

    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') {
        lhRevalidateAccess('visibilitychange');
        if (!window.__lhRealtimeConnected) startFallbackPolling();
      } else {
        // Không kiểm tra gì khi tab ẩn.
        stopFallbackPolling();
      }
    });
  })();
  // ===== END LH_UNIFIED_FETCH_AND_ACCESS_20260726 =====
}
