import { db, cleanStr } from './db.js';

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

const SUPABASE_URL = cleanStr(process.env.SUPABASE_URL) || 'https://kxyukiwhhorvxgxxxmfq.supabase.co';
const SUPABASE_ANON_KEY = cleanStr(process.env.SUPABASE_ANON_KEY) || 'sb_publishable_yOIciG2SCPyu8mP5KWE5RQ_qIgCd4-f';

export async function verifyUser(req) {
  try {
    const auth = req.headers.get('authorization') || req.headers.get('Authorization') || '';
    const m = /^Bearer\s+(.+)$/i.exec(auth);
    if (!m) return null;
    const token = m[1].trim();
    if (!token) return null;

    const fetchUrl = SUPABASE_URL.replace(/\/+$/, '') + '/auth/v1/user';
    const res = await fetch(fetchUrl, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: 'Bearer ' + token }
    });
    if (!res.ok) return null;
    const u = await res.json().catch(() => null);
    if (!u || !u.id) return null;
    return { id: u.id, email: String(u.email || '').toLowerCase().trim() };
  } catch (e) {
    console.warn('verifyUser exception failed:', e);
    return null;
  }
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
  X. TỐI ƯU TURSO ROWS READ
  - Tìm theo profiles.id (TEXT PRIMARY KEY) -> index lookup, không quét bảng.
  - Chỉ lấy cột cần thiết: cột device_history có thể chứa tới 30 bản ghi JSON,
    `select *` kéo theo nó ở MỌI request là lãng phí thuần túy.
  - LIMIT 1.
  Fallback `select *`: cột force_logout được thêm bằng ALTER TABLE trong
  ensureProfileColumns() (api/controllers/profile.js). Trên một DB chưa từng
  chạy migration đó, select hẹp sẽ lỗi -> rơi về select * để không khoá nhầm
  toàn bộ người dùng.
*/
const PROFILE_COLUMNS = 'id, email, full_name, avatar_url, role, approved, blocked, force_logout, current_subject';

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
