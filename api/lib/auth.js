import { db, cleanStr } from './db.js';
import { postServerErrorEmbed } from './discord.js';

export function getAdminEmail() {
  const envEmail = cleanStr(process.env.ADMIN_EMAIL).toLowerCase().trim();
  return envEmail || 'trongbm2004@gmail.com';
}

export function getRootAdminUserId() {
  return cleanStr(process.env.ROOT_ADMIN_USER_ID) || '';
}

export function isRootAdmin(userId, email) {
  const rootId = getRootAdminUserId();
  if (rootId && userId && String(userId).trim() === rootId) return true;
  const adminEmail = getAdminEmail();
  if (adminEmail && email && String(email).toLowerCase().trim() === adminEmail) return true;
  return false;
}

/*
  ADMIN_TWO_TIERS_20260729 — hai cấp admin.

  - "admin hệ thống": danh sách email cố định dưới đây (đổi được bằng biến môi trường
    SYSTEM_ADMIN_EMAILS, phân cách bằng dấu phẩy). Nắm TẤT CẢ quyền, kể cả đổi cấu hình
    thông báo Discord.
  - "admin thường": role = 'admin' trong Turso. Làm được mọi việc quản trị nội dung và
    người dùng, NHƯNG không đổi được cấu hình thông báo Discord.

  Cấp bậc quyết định ở SERVER theo email đã verify bằng token (authUser.email), không bao
  giờ theo giá trị client gửi lên — cùng nguyên tắc với AUTHZ_SINGLE_SOURCE_20260726.
*/
const DEFAULT_SYSTEM_ADMIN_EMAILS = ['trongbm2004@gmail.com', 'trongbm1009@gmail.com'];

export function getSystemAdminEmails() {
  const raw = cleanStr(process.env.SYSTEM_ADMIN_EMAILS);
  const fromEnv = raw
    .split(',')
    .map(s => s.toLowerCase().trim())
    .filter(Boolean);
  const list = fromEnv.length ? fromEnv : [...DEFAULT_SYSTEM_ADMIN_EMAILS];
  // ADMIN_EMAIL luôn là admin hệ thống, kể cả khi không nằm trong danh sách trên.
  const adminEmail = getAdminEmail();
  if (adminEmail && !list.includes(adminEmail)) list.push(adminEmail);
  return list;
}

export function isSystemAdmin(email) {
  const e = String(email || '').toLowerCase().trim();
  if (!e) return false;
  return getSystemAdminEmails().includes(e);
}

const SUPABASE_URL = cleanStr(process.env.SUPABASE_URL) || 'https://kxyukiwhhorvxgxxxmfq.supabase.co';
const SUPABASE_ANON_KEY = cleanStr(process.env.SUPABASE_ANON_KEY) || 'sb_publishable_yOIciG2SCPyu8mP5KWE5RQ_qIgCd4-f';

/*
  AUTH_VERIFY_INCONCLUSIVE_20260805 — "KHÔNG XÁC MINH ĐƯỢC" KHÁC "HẾT PHIÊN".

  Bản cũ trả `null` cho CẢ HAI ca:
    (1) không có token, hoặc Supabase khẳng định token sai/hết hạn (401/403);
    (2) KHÔNG HỎI ĐƯỢC Supabase: mất mạng, timeout, Supabase 5xx, 429 rate limit.
  Router thấy `null` là trả `401 UNAUTHORIZED`, mà ở client `401 UNAUTHORIZED` có
  nghĩa cố định là "phiên hỏng" -> `handleAccessRevoked()` GỌI `signOut()`. Nói cách
  khác: Supabase auth chớp một nhịp (hoặc bị rate limit) là NGƯỜI DÙNG BỊ ĐĂNG XUẤT
  dù phiên của họ còn tốt nguyên. Lớp làm mới token của client
  (LH_SESSION_REFRESH_20260729) không cứu được ca này: token mới cũng không xác minh
  được, `inspectDenial` vẫn kết luận UNAUTHORIZED.

  Nay ca (2) trả code AUTH_CHECK_FAILED -> router trả 503, cùng ý nghĩa với
  `500 INTERNAL_ERROR` của `checkUserAccess`: "không kết luận được quyền, client hiện
  thử lại, KHÔNG được coi là bị thu hồi quyền". Vẫn fail-closed (không cấp quyền),
  chỉ khác ở chỗ không xoá phiên đăng nhập của người dùng.

  Ranh giới: 400/401/403 từ Supabase = token thật sự không dùng được (UNAUTHORIZED).
  Mọi mã khác, mọi exception, và timeout = AUTH_CHECK_FAILED.
*/
const VERIFY_TIMEOUT_MS = 8000;

export async function verifyUserDetailed(req) {
  const auth = req.headers.get('authorization') || req.headers.get('Authorization') || '';
  const m = /^Bearer\s+(.+)$/i.exec(auth);
  if (!m) return { user: null, code: 'UNAUTHORIZED' };
  const token = m[1].trim();
  if (!token) return { user: null, code: 'UNAUTHORIZED' };

  const fetchUrl = SUPABASE_URL.replace(/\/+$/, '') + '/auth/v1/user';
  // Edge runtime không có AbortSignal.timeout ở mọi region -> tự hẹn giờ.
  const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = ctl ? setTimeout(() => ctl.abort(), VERIFY_TIMEOUT_MS) : null;
  let res;
  try {
    res = await fetch(fetchUrl, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: 'Bearer ' + token },
      signal: ctl ? ctl.signal : undefined
    });
  } catch (e) {
    // Mất mạng / timeout: KHÔNG kết luận gì về phiên của người dùng.
    console.warn('verifyUser: không gọi được Supabase /auth/v1/user:', e?.message || e);
    return { user: null, code: 'AUTH_CHECK_FAILED', error: e };
  } finally {
    if (timer) clearTimeout(timer);
  }

  if (res.status === 400 || res.status === 401 || res.status === 403) {
    return { user: null, code: 'UNAUTHORIZED' };
  }
  if (!res.ok) {
    // 429 rate limit, 5xx, 404 sai URL: lỗi hạ tầng, không phải lỗi phiên.
    const err = new Error('Supabase /auth/v1/user trả HTTP ' + res.status);
    console.warn('verifyUser:', err.message);
    return { user: null, code: 'AUTH_CHECK_FAILED', error: err };
  }
  const u = await res.json().catch(() => null);
  if (!u || !u.id) {
    const err = new Error('Supabase /auth/v1/user trả 200 nhưng không có id');
    console.warn('verifyUser:', err.message);
    return { user: null, code: 'AUTH_CHECK_FAILED', error: err };
  }
  return { user: { id: u.id, email: String(u.email || '').toLowerCase().trim() } };
}

/*
  Bản tương thích: chỉ trả user hoặc null (fail-closed như trước). Chỗ nào cần phân
  biệt "không xác minh được" thì phải dùng verifyUserDetailed — hiện là api/index.js.
*/
export async function verifyUser(req) {
  const r = await verifyUserDetailed(req);
  return r.user;
}

/*
  AUTHZ_SINGLE_SOURCE_20260726
  Turso là NGUỒN TRẠNG THÁI QUYỀN DUY NHẤT. Mọi API bảo vệ dữ liệu phải đi qua
  checkUserAccess() -> loadProfileRow() -> Turso. Không tin role/approved/blocked
  gửi từ client, từ localStorage hay từ JWT metadata.

  Cache profile:
  - TTL cũ là 5 PHÚT. Trên Vercel Edge mỗi region là một isolate riêng, nên
    clearProfileCache() lúc admin khóa user CHỈ xoá cache của isolate đang chạy
    admin-action — isolate đang phục vụ nạn nhân vẫn giữ bản cũ tới 5 phút và
    user bị khóa vẫn đọc được /api/subjects, /api/questions suốt thời gian đó.
  - TTL mới 10 GIÂY: đủ ngắn để khóa có hiệu lực gần như tức thì ở mọi isolate,
    vẫn gộp được chùm request của một lần load trang (profile + subjects +
    questions) thành 1 lần đọc Turso. Query là PK lookup trên profiles.id nên
    chi phí gần như không đổi.
*/
const _profileCache = new Map();
const _PROFILE_CACHE_TTL = 10 * 1000; // 10 giây (spec: 5-15s)
const _PROFILE_CACHE_MAX = 2000;

export function clearProfileCache(id) {
  if (id) _profileCache.delete(id);
  else _profileCache.clear();
}

/*
  Broadcast chỉ là TÍN HIỆU "hãy kiểm tra lại", không phải nguồn quyền.
  Payload cố ý KHÔNG mang giá trị approved/blocked để client không thể (và không
  được phép) dùng nó quyết định quyền — client bắt buộc gọi lại /api/profile.
  Secret chỉ tồn tại trong Vercel Environment Variables, không bao giờ ở frontend.
*/
const SUPABASE_BROADCAST_KEY =
  cleanStr(process.env.SUPABASE_SERVICE_ROLE_KEY) ||
  cleanStr(process.env.SUPABASE_REALTIME_KEY) ||
  SUPABASE_ANON_KEY;

export async function broadcastRealtimeUserStatus(targetUserId, reasonData) {
  if (!targetUserId) return false;
  try {
    const broadcastUrl = SUPABASE_URL.replace(/\/+$/, '') + '/realtime/v1/api/broadcast';
    const res = await fetch(broadcastUrl, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_BROADCAST_KEY,
        'Authorization': 'Bearer ' + SUPABASE_BROADCAST_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [
          {
            topic: 'user-status-' + targetUserId,
            event: 'status_changed',
            payload: {
              user_id: targetUserId,
              // Chỉ là gợi ý để client biết vì sao phải kiểm tra lại.
              reason: String(reasonData?.reason || 'status_changed'),
              at: new Date().toISOString()
            }
          }
        ]
      })
    });
    if (!res.ok) {
      // XII: Turso đã đổi rồi thì KHÔNG rollback. Chỉ ghi log, client sẽ được
      // chặn ở lần gọi API kế tiếp / khi quay lại tab / khi polling chạy.
      console.warn('[Realtime broadcast] failed', res.status, 'user:', targetUserId);
      return false;
    }
    return true;
  } catch (e) {
    console.warn('[Realtime broadcast] exception for user', targetUserId, e?.message || e);
    return false;
  }
}

/*
  RELOAD_NOTICE_BROADCAST_20260729
  Nhắc TẤT CẢ người dùng tải lại trang. Không thể bắn lần lượt vào topic
  'user-status-<id>' của từng người (mỗi lần là một HTTP request tới Supabase, vài trăm
  user là vài trăm request), nên dùng một topic CHUNG mà mọi client đều nghe.

  Payload cũng chỉ là TÍN HIỆU, không mang quyền: client nhận được thì hiện banner
  "tải lại trang" — thao tác vô hại. Trạng thái thật vẫn nằm ở cột profiles.reload_notice
  để người đang offline lúc bắn vẫn nhận được ở lần gọi /api/profile kế tiếp.
*/
export const GLOBAL_REALTIME_TOPIC = 'lh-global';

export async function broadcastRealtimeGlobal(event, payload) {
  try {
    const broadcastUrl = SUPABASE_URL.replace(/\/+$/, '') + '/realtime/v1/api/broadcast';
    const res = await fetch(broadcastUrl, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_BROADCAST_KEY,
        'Authorization': 'Bearer ' + SUPABASE_BROADCAST_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [
          {
            topic: GLOBAL_REALTIME_TOPIC,
            event: String(event || 'reload_notice'),
            payload: { ...(payload || {}), at: new Date().toISOString() }
          }
        ]
      })
    });
    if (!res.ok) {
      console.warn('[Realtime broadcast global] failed', res.status, event);
      return false;
    }
    return true;
  } catch (e) {
    console.warn('[Realtime broadcast global] exception', e?.message || e);
    return false;
  }
}

/*
  X. TỐI ƯU TURSO ROWS READ
  - Tìm theo profiles.id (TEXT PRIMARY KEY) -> index lookup, không quét bảng.
  - Chỉ lấy cột cần thiết: cột device_history có thể chứa tới 30 bản ghi JSON,
    `select *` kéo theo nó ở MỌI request là lãng phí thuần túy.
  - LIMIT 1.
  Fallback `select *`: các cột force_logout / reload_notice được thêm bằng ALTER TABLE
  trong ensureProfileColumns() (api/controllers/profile.js). Trên một DB chưa từng
  chạy migration đó, select hẹp sẽ lỗi -> rơi về select * để không khoá nhầm
  toàn bộ người dùng.
*/
const PROFILE_COLUMNS =
  'id, email, full_name, avatar_url, role, approved, blocked, force_logout, reload_notice, current_subject';

async function queryProfileRow(id) {
  try {
    const r = await db.execute({
      sql: `select ${PROFILE_COLUMNS} from profiles where id = ? limit 1`,
      args: [id]
    });
    return r.rows?.[0] || null;
  } catch (e) {
    console.warn('[loadProfileRow] narrow select failed, fallback to select *:', e?.message || e);
    const r = await db.execute({ sql: 'select * from profiles where id = ? limit 1', args: [id] });
    return r.rows?.[0] || null;
  }
}

/*
  Lỗi khi ĐỌC được phân biệt với "không có dòng nào".
  Bản trước nuốt exception và trả null, nên Turso sập = mọi user nhận
  403 PENDING_APPROVAL ("Tài khoản chưa được phê duyệt") — sai hoàn toàn và trái
  mục XIV-7 (500 không được biến thành PENDING_APPROVAL/BLOCKED).
  Nay ném ProfileLookupError để tầng trên trả 500 INTERNAL_ERROR; client hiểu là
  "không kết luận được quyền" và hiện nút thử lại, vẫn KHÔNG mở giao diện chính.
*/
export class ProfileLookupError extends Error {}

export async function loadProfileRow(id, { fresh = false } = {}) {
  if (!id) return null;
  if (!fresh) {
    const cached = _profileCache.get(id);
    if (cached && Date.now() - cached.at < _PROFILE_CACHE_TTL) return cached.row;
  }
  let row;
  try {
    row = await queryProfileRow(id);
  } catch (e) {
    console.error('[loadProfileRow] không đọc được profiles:', e?.message || e);
    throw new ProfileLookupError('profile lookup failed');
  }
  if (_profileCache.size > _PROFILE_CACHE_MAX) _profileCache.clear();
  _profileCache.set(id, { row, at: Date.now() });
  return row;
}

export function isTruthyFlag(v) {
  return v === 1 || v === true || v === '1';
}

/*
  II. NGUYÊN TẮC PHÂN QUYỀN — chỉ cho truy cập khi approved === 1 && blocked === 0.
  Bản cũ có ngoại lệ `if (!approved && !staff)`: editor/admin bị THU HỒI DUYỆT vẫn
  đi lọt vì được coi là staff. Kết hợp với /api/profile tự set approved = 1 cho
  role editor, thao tác "Thu hồi duyệt" trên editor gần như không có tác dụng.
  Nay approved là điều kiện bắt buộc cho MỌI role; việc thăng quyền lên
  editor/admin sẽ tự set approved = 1 (xem case set_user_role).
*/
export async function checkUserAccess(authUser, requiredRole = null) {
  if (!authUser || !authUser.id) {
    return { ok: false, status: 401, code: 'UNAUTHORIZED', error: 'Phiên đăng nhập không hợp lệ' };
  }

  let p;
  try {
    p = await loadProfileRow(authUser.id);
  } catch (e) {
    // Lỗi hạ tầng, KHÔNG phải "chưa duyệt". Vẫn fail-closed (không cấp quyền)
    // nhưng báo đúng bản chất để client hiện màn hình "Không thể kiểm tra quyền".
    console.error('[checkUserAccess] không đọc được profile:', e?.stack || e?.message || e);
    /*
      SERVER_ERROR_DISCORD_20260729: nhánh này KHÔNG ném ra ngoài (trả về object), nên chốt
      500 ở api/index.js không thấy — phải tự báo. Đây đúng là loại lỗi cần biết ngay: cả hệ
      thống không kết luận được quyền. postServerErrorEmbed tự gộp tin nên Turso sập cũng
      chỉ ra 1 tin mỗi 5 phút.
    */
    try {
      await postServerErrorEmbed('checkUserAccess', e);
    } catch (notifyErr) {
      console.warn('[server_error discord] không gửi được:', notifyErr?.message || notifyErr);
    }
    return { ok: false, status: 500, code: 'INTERNAL_ERROR', error: 'Đã xảy ra lỗi hệ thống' };
  }
  if (!p) {
    // Không có dòng nào = tài khoản chưa được khởi tạo => đúng là chờ duyệt.
    return { ok: false, status: 403, code: 'PENDING_APPROVAL', error: 'Tài khoản chưa được phê duyệt' };
  }

  if (isTruthyFlag(p.blocked)) {
    return { ok: false, status: 403, code: 'BLOCKED', error: 'Tài khoản đã bị khóa' };
  }

  if (!isTruthyFlag(p.approved)) {
    return { ok: false, status: 403, code: 'PENDING_APPROVAL', error: 'Tài khoản chưa được phê duyệt' };
  }

  const staff = ['admin', 'editor'].includes(p.role);

  if (requiredRole === 'staff' && !staff) {
    return { ok: false, status: 403, code: 'INSUFFICIENT_ROLE', error: 'Bạn không có quyền thực hiện thao tác này' };
  }

  if (requiredRole === 'admin' && p.role !== 'admin') {
    return { ok: false, status: 403, code: 'INSUFFICIENT_ROLE', error: 'Bạn không có quyền thực hiện thao tác này' };
  }

  return { ok: true, profile: p };
}

export async function isApprovedOrStaff(authUser) {
  const access = await checkUserAccess(authUser);
  return access.ok;
}

export async function isStaff(authUser) {
  const access = await checkUserAccess(authUser, 'staff');
  return access.ok;
}

export function roleColor(role) {
  if (role === 'admin') return 15158332;
  if (role === 'editor') return 3447003;
  return 3066897;
}
