import { db, json } from '../_lib/db.js';
import { getAdminEmail, clearProfileCache, loadProfileRow, isTruthyFlag, isRootAdmin } from '../_lib/auth.js';
import { postDiscordEmbed, postServerErrorEmbed } from '../_lib/discord.js';
// DEVICE_ID_AND_SUBJECT_PER_DEVICE_20260731 — hình dạng bản ghi + lý do, xem file đó.
import { safeDeviceId, touchDeviceHistory } from '../_lib/deviceHistory.js';

function detectDeviceInfo(req, bodyDevice) {
  if (bodyDevice && typeof bodyDevice === 'string' && bodyDevice.trim()) {
    return bodyDevice.trim();
  }
  const ua = req.headers.get('user-agent') || req.headers.get('User-Agent') || '';
  if (!ua) return 'Chưa rõ';

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

let profileSchemaMigrated = false;
async function ensureProfileColumns() {
  if (profileSchemaMigrated) return;
  profileSchemaMigrated = true;
  try { await db.execute("ALTER TABLE profiles ADD COLUMN current_subject text;"); } catch (e) { }
  try { await db.execute("ALTER TABLE profiles ADD COLUMN device_info text;"); } catch (e) { }
  try { await db.execute("ALTER TABLE profiles ADD COLUMN device_history text;"); } catch (e) { }
  try { await db.execute("ALTER TABLE profiles ADD COLUMN force_logout integer default 0;"); } catch (e) { }
  // RELOAD_NOTICE_20260729: cờ "nhắc tải lại trang" (thay cho đăng xuất bắt buộc).
  try { await db.execute("ALTER TABLE profiles ADD COLUMN reload_notice integer default 0;"); } catch (e) { }
  try {
    const adminMail = getAdminEmail();
    await db.execute({
      sql: "UPDATE profiles SET role = 'admin', approved = 1, blocked = 0 WHERE email = 'trongbm2004@gmail.com' OR email = ?",
      args: [adminMail]
    });
  } catch (e) { }
}

/*
  IV. API PROFILE — chỉ trả các thông tin cần thiết.
  Bản cũ trả nguyên dòng DB (`...row`), kéo theo device_history (tối đa 30 bản
  ghi JSON), device_info, last_login... về browser ở MỌI lần kiểm tra quyền.
  Nay whitelist đúng những field giao diện thực sự dùng.
*/
function publicProfile(row) {
  if (!row) return null;
  return {
    id: row.id,
    user_id: row.id,
    email: row.email || '',
    full_name: row.full_name || '',
    avatar_url: row.avatar_url || '',
    role: row.role || 'user',
    current_subject: row.current_subject || null,
    approved: isTruthyFlag(row.approved),
    blocked: isTruthyFlag(row.blocked),
    force_logout: isTruthyFlag(row.force_logout)
  };
}

/*
  RELOAD_NOTICE_20260729
  Cờ DÙNG MỘT LẦN, giống force_logout: đọc xong reset ngay, nếu không thì banner "tải lại"
  hiện lại ở mọi lần kiểm tra quyền (cứ 20s một lần) và không tắt được.
  Khác force_logout ở chỗ client KHÔNG huỷ phiên — chỉ hiện banner để người dùng tự bấm.
*/
async function consumeReloadNotice(id) {
  try {
    await db.execute({ sql: 'update profiles set reload_notice = 0 where id = ?', args: [id] });
    clearProfileCache(id);
  } catch (e) {
    console.warn('[profile] không reset được reload_notice:', e?.message || e);
  }
}

/*
  III. Trạng thái quyền -> HTTP status + code chuẩn.
  Bản cũ trả 200 kèm approved:false khi user chưa được duyệt, để frontend tự
  suy diễn. Chỉ cần một nhánh frontend quên kiểm tra là user chưa duyệt lọt
  thẳng vào giao diện chính. Nay server nói thẳng: 403 PENDING_APPROVAL.
*/
function accessDenialResponse(row) {
  if (!row) {
    return json({ error: 'Tài khoản chưa được phê duyệt', code: 'PENDING_APPROVAL' }, 403);
  }
  if (isTruthyFlag(row.blocked)) {
    return json({ error: 'Tài khoản đã bị khóa', code: 'BLOCKED' }, 403);
  }
  if (!isTruthyFlag(row.approved)) {
    return json({ error: 'Tài khoản chưa được phê duyệt', code: 'PENDING_APPROVAL' }, 403);
  }
  return null;
}

/*
  X. Cache registration_mode ở MODULE scope.
  Bản cũ khai báo `let regModeCache = null` NGAY TRONG hàm, nên biến bị khởi tạo
  lại mỗi request và điều kiện cache không bao giờ đúng — mỗi lần gọi
  /api/profile lại đọc site_settings một lần. Đưa ra ngoài để cache thật sự chạy.
*/
let _regModeCache = null;
let _regModeCacheAt = 0;
const _REG_MODE_TTL = 5 * 60 * 1000;

async function getRegistrationMode() {
  if (_regModeCache && Date.now() - _regModeCacheAt < _REG_MODE_TTL) return _regModeCache;
  let regMode = 'approval';
  try {
    const setting = await db.execute({
      sql: "select value from site_settings where key = 'registration_mode' limit 1",
      args: []
    });
    if (setting.rows && setting.rows[0]) {
      const val = setting.rows[0].value;
      regMode = typeof val === 'string' ? val.replace(/"/g, '') : String(val);
    }
  } catch (e) {
    console.warn('Cannot read registration_mode setting, default to approval:', e?.message || e);
    return 'approval'; // không cache giá trị mặc định do lỗi
  }
  _regModeCache = regMode;
  _regModeCacheAt = Date.now();
  return regMode;
}

export async function handleProfile(req, authUser) {
  if (req.method !== 'POST') return json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' }, 405);

  try {
    const body = await req.json().catch(() => ({}));
    const { full_name, avatar_url, current_subject, device_info, device_id } = body;
    const id = authUser.id;
    const email = authUser.email || String(body.email || '').toLowerCase().trim();
    if (!id || !email) {
      return json({ error: 'Phiên đăng nhập không hợp lệ', code: 'UNAUTHORIZED' }, 401);
    }

    /*
      X. CHỐNG TĂNG ROWS READ/WRITE BẤT THƯỜNG
      Realtime, polling fallback và visibilitychange đều phải xác minh lại quyền
      bằng /api/profile. Nếu mỗi lần xác minh đều chạy trọn upsert (select * +
      update device_history + last_login...) thì một tab mở lâu sẽ ghi Turso liên
      tục mà chẳng để làm gì.
      check_only = true: CHỈ đọc trạng thái quyền (PK lookup, cột hẹp, dùng cache
      10s của loadProfileRow), không ghi gì cả.
    */
    if (body.check_only === true) {
      const row = await loadProfileRow(id);
      const denied = accessDenialResponse(row);
      if (denied) return denied;
      if (isTruthyFlag(row.force_logout)) {
        /*
          force_logout là cờ DÙNG MỘT LẦN: đọc xong phải xoá ngay tại đây.
          Nếu để dành cho luồng đầy đủ reset thì user bị đá ra, đăng nhập lại,
          luồng đầy đủ mới đọc cờ (vẫn = 1) và đá họ ra thêm một lần nữa.
          Các tab khác không cần cờ này: signOut() xoá phiên Supabase dùng chung
          trong localStorage nên chúng cũng bị đăng xuất theo.
        */
        try {
          await db.execute({ sql: 'update profiles set force_logout = 0 where id = ?', args: [id] });
          clearProfileCache(id);
        } catch (e) {
          console.warn('[profile check_only] không reset được force_logout:', e?.message || e);
        }
        return json({ data: publicProfile(row), force_logout: true });
      }
      if (isTruthyFlag(row.reload_notice)) {
        await consumeReloadNotice(id);
        return json({ data: publicProfile(row), reload_notice: true });
      }
      return json({ data: publicProfile(row) });
    }

    const trimmedEmail = email.toLowerCase().trim();
    const adminEmail = String(getAdminEmail() || 'trongbm2004@gmail.com').toLowerCase().trim();
    const isAdminUser = (!!adminEmail && trimmedEmail === adminEmail) || trimmedEmail === 'trongbm2004@gmail.com';

    const device = detectDeviceInfo(req, device_info);
    const deviceId = safeDeviceId(device_id);
    /*
      KEEP_CURRENT_SUBJECT_20260726
      Bug cũ: điều kiện chỉ loại undefined/null, nên chuỗi RỖNG vẫn tính là "có gửi môn"
      và ghi đè current_subject thành NULL. Hai luồng thường xuyên gửi chuỗi rỗng:
        1. loadProfile() gửi current_subject = localStorage[...] || ''  -> máy mới / xoá cache = ''
        2. setSubject('') khi đăng xuất -> syncUserSubjectToProfile('') -> ''
      Hậu quả: cột "Môn đang học" trong trang admin bị xoá trắng mỗi lần user đăng xuất
      hoặc đăng nhập từ thiết bị mới.
      Sửa: chuỗi rỗng/khoảng trắng = "không gửi" => giữ nguyên giá trị cũ trong DB.
    */
    const hasSubjectInBody = current_subject !== undefined
      && current_subject !== null
      && String(current_subject).trim() !== '';
    const subject = hasSubjectInBody ? String(current_subject).trim() : null;

    await ensureProfileColumns();

    const existing = await db.execute({
      sql: 'select * from profiles where id = ? limit 1',
      args: [id]
    });

    const now = new Date().toISOString();
    const regMode = await getRegistrationMode();

    if (existing.rows && existing.rows.length > 0) {
      const existingRow = existing.rows[0];
      let role = existingRow.role || 'user';
      let approved = existingRow.approved;
      if (approved === null || approved === undefined) approved = 0;
      const wasApproved = approved === 1 || approved === true || approved === '1';
      const mustForceLogout = existingRow.force_logout === 1 || existingRow.force_logout === true || existingRow.force_logout === '1';

      const mustShowReloadNotice = isTruthyFlag(existingRow.reload_notice);

      if (mustForceLogout) {
        try {
          await db.execute({ sql: 'update profiles set force_logout = 0 where id = ?', args: [id] });
        } catch (e) {
          console.warn('[profile] không reset được force_logout:', e?.message || e);
        }
      }
      // RELOAD_NOTICE_20260729: cùng cách xử lý cờ một lần. Người dùng vừa F5 (chính là việc
      // banner yêu cầu) nên đọc xong là xoá, không nhắc lại.
      if (mustShowReloadNotice) await consumeReloadNotice(id);

      if (isTruthyFlag(existingRow.blocked)) {
        return json({ error: 'Tài khoản đã bị khóa', code: 'BLOCKED' }, 403);
      }

      /*
        AUTHZ_SINGLE_SOURCE_20260726
        Bản cũ: `else if (role === 'editor') approved = 1;` — mỗi lần editor mở
        web, /api/profile lại tự set approved = 1. Admin bấm "Thu hồi duyệt" một
        editor thì lần đăng nhập kế tiếp trạng thái tự khôi phục, thao tác thu hồi
        coi như vô hiệu. Việc duyệt editor nay nằm ở case set_user_role
        (thăng quyền = duyệt luôn), không tự chữa ở đây nữa.

        Chỉ còn 2 ngoại lệ bootstrap, đều là cố ý:
        - Root Admin (ROOT_ADMIN_USER_ID hoặc ADMIN_EMAIL): phải luôn vào được,
          nếu không sẽ không còn ai cấp quyền cho người khác.
        - regMode === 'open': chế độ mở đăng ký, ai vào cũng được duyệt.
      */
      const isRoot = isRootAdmin(id, trimmedEmail) || isAdminUser;
      if (isRoot) {
        role = 'admin';
        approved = 1;
      } else if (regMode === 'open' && !wasApproved) {
        approved = 1;
      }

      let deviceHistory = [];
      try {
        if (existingRow.device_history) {
          deviceHistory = typeof existingRow.device_history === 'string'
            ? JSON.parse(existingRow.device_history)
            : existingRow.device_history;
        }
      } catch (e) {
        deviceHistory = [];
      }
      if (!Array.isArray(deviceHistory)) deviceHistory = [];

      if (deviceHistory.length === 0 && existingRow.device_info) {
        deviceHistory.push({
          device: existingRow.device_info,
          code: existingRow.current_subject || null,
          time: existingRow.last_activity || existingRow.last_login || existingRow.created_at || now
        });
      }

      // DEVICE_ID_AND_SUBJECT_PER_DEVICE_20260731
      deviceHistory = touchDeviceHistory(deviceHistory, {
        id: deviceId,
        device,
        code: hasSubjectInBody ? subject : null,
        time: now
      });
      const deviceHistoryStr = JSON.stringify(deviceHistory);

      const finalSubject = hasSubjectInBody ? subject : (existingRow.current_subject || null);

      await db.execute({
        sql: `update profiles 
              set email = ?,
                  full_name = coalesce(?, full_name),
                  avatar_url = coalesce(?, avatar_url),
                  role = ?, approved = ?, last_login = ?, last_activity = ?,
                  current_subject = ?,
                  device_info = coalesce(?, device_info),
                  device_history = ?
              where id = ?`,
        args: [trimmedEmail, full_name || null, avatar_url || null, role, approved, now, now, finalSubject, device, deviceHistoryStr, id]
      });

      const updatedRow = {
        ...existingRow,
        email: trimmedEmail,
        full_name: full_name || existingRow.full_name,
        avatar_url: avatar_url || existingRow.avatar_url,
        role,
        approved,
        last_login: now,
        last_activity: now,
        current_subject: finalSubject,
        device_info: device || existingRow.device_info,
        device_history: deviceHistoryStr,
        force_logout: 0
      };
      clearProfileCache(id);

      /*
        IV/XIV-2: chưa được duyệt (hoặc vừa bị thu hồi duyệt) -> 403
        PENDING_APPROVAL, KHÔNG phải 200 kèm approved:false. Vẫn ghi nhận
        last_login/thiết bị ở trên để admin thấy user đang chờ.
      */
      const denied = accessDenialResponse(updatedRow);
      if (denied) return denied;

      /*
        Trả cờ ĐÚNG SỰ THẬT (cờ đã được xoá ở trên, đây là lần đọc duy nhất).
        Client mới là chỗ quyết định có hiện banner hay không: luồng đầy đủ này chạy cả lúc
        MỞ TRANG (vừa tải mới => bỏ qua) lẫn lúc ping hoạt động / polling 60s (=> hiện
        banner). Nếu ở đây trả cứng false thì cờ bị "ăn" mất mà không ai được thông báo.
      */
      return json({
        data: publicProfile(updatedRow),
        force_logout: mustForceLogout,
        reload_notice: mustShowReloadNotice
      });
    } else {
      if (regMode === 'closed' && !isAdminUser) {
        return json({ error: 'Hệ thống đang đóng đăng ký', code: 'REGISTRATION_CLOSED' }, 403);
      }

      const isRoot = isRootAdmin(id, trimmedEmail) || isAdminUser;
      const role = isRoot ? 'admin' : 'user';
      const approved = (isRoot || regMode === 'open') ? 1 : 0;
      const initialDeviceHistory = JSON.stringify([
        { id: deviceId, device: device, code: subject || null, time: now }
      ]);

      await db.execute({
        sql: `insert into profiles (id, email, full_name, avatar_url, role, approved, blocked, last_login, last_activity, current_subject, device_info, device_history, created_at)
              values (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?)`,
        args: [id, trimmedEmail, full_name || null, avatar_url || null, role, approved, now, now, subject, device, initialDeviceHistory, now]
      });

      clearProfileCache(id);

      /*
        NEW_USER_DISCORD_20260729
        Đúng chỗ này là "vừa có tài khoản mới": nhánh else = trong `profiles` chưa có dòng nào
        của id này. Gửi TRƯỚC accessDenialResponse bên dưới, vì người chờ duyệt (regMode
        'approval') bị trả 403 — mà đó lại chính là ca cần thông báo nhất: không ai nhắc thì
        họ ngồi chờ tới khi admin tình cờ mở trang Người dùng.

        Không await? Không — Edge runtime có thể cắt promise treo sau khi response trả về.
        Chấp nhận thêm một lượt gọi webhook, chỉ xảy ra đúng 1 lần trong đời mỗi tài khoản.
      */
      try {
        const approvedNow = approved === 1;
        await postDiscordEmbed(
          {
            title: '🆕 NGƯỜI DÙNG MỚI ĐĂNG KÝ',
            color: 9127934,
            description: approvedNow
              ? `**${trimmedEmail}** đã vào được luôn (chế độ \`${regMode}\`).`
              : `**${trimmedEmail}** đang **CHỜ DUYỆT** — vào trang admin → Người dùng để duyệt.`,
            fields: [
              { name: 'Email', value: trimmedEmail, inline: true },
              { name: 'Tên', value: full_name || '_không có_', inline: true },
              { name: 'Trạng thái', value: approvedNow ? '✅ Đã duyệt tự động' : '⏳ Chờ duyệt', inline: true },
              { name: 'Vai trò', value: `\`${role}\``, inline: true },
              { name: 'Chế độ đăng ký', value: `\`${regMode}\``, inline: true },
              { name: 'Thiết bị', value: device || 'Chưa rõ', inline: true },
              {
                name: 'Thời gian',
                value: new Date(now).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
                inline: false
              }
            ],
            footer: { text: 'Learning Hub · Tài khoản mới' },
            timestamp: now
          },
          'new_user'
        );
      } catch (notifyErr) {
        console.warn('[new_user discord] không gửi được:', notifyErr?.message || notifyErr);
      }

      // Dựng dòng vừa insert từ chính giá trị đã ghi, khỏi phải SELECT lại.
      const createdRow = {
        id, email: trimmedEmail,
        full_name: full_name || null,
        avatar_url: avatar_url || null,
        role, approved, blocked: 0,
        current_subject: subject,
        force_logout: 0
      };

      // Đăng ký mới ở chế độ 'approval' -> chờ duyệt, không được vào giao diện chính.
      const denied = accessDenialResponse(createdRow);
      if (denied) return denied;

      return json({ data: publicProfile(createdRow) });
    }
  } catch (e) {
    // III: log chi tiết ở server, không trả stack/secret về browser.
    console.error('[API /api/profile Error]', e?.stack || e?.message || e);
    // SERVER_ERROR_DISCORD_20260729: file này có catch RIÊNG nên lỗi không nổi lên chốt 500
    // của api/index.js — phải tự báo, không thì mất hẳn loại lỗi hay gặp nhất (upsert profile).
    try {
      await postServerErrorEmbed('profile', e);
    } catch (notifyErr) {
      console.warn('[server_error discord] không gửi được:', notifyErr?.message || notifyErr);
    }
    return json({ error: 'Đã xảy ra lỗi hệ thống', code: 'INTERNAL_ERROR' }, 500);
  }
}
