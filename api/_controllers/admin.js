import { db, json } from '../_lib/db.js';
import { checkUserAccess, getAdminEmail, roleColor, clearProfileCache, broadcastRealtimeUserStatus, broadcastRealtimeGlobal, isRootAdmin, isSystemAdmin, getSystemAdminEmails } from '../_lib/auth.js';
import { clearQuestionsCache } from './questions.js';
import { clearSubjectsCache } from './subjects.js';
import { getDiscordSettings, saveDiscordSettings, postDiscordEmbed, DISCORD_NOTIFICATION_KINDS, SETTINGS_KEY } from '../_lib/discord.js';
import { getFolderNewBadges, setFolderNewBadge, FOLDER_NEW_BADGE_KEY } from '../_lib/folderBadges.js';
import { resolveImportNums } from '../_lib/questionNums.js';

/*
  QUESTION_EDIT_DISCORD_20260729
  Nhãn tiếng Việt cho từng thao tác đụng vào nội dung câu hỏi. Khoá là `actionName` mà
  logAdminAction nhận được (toggle_question ghi log thành show_question / hide_question).
*/
const QUESTION_EDIT_LABELS = {
  approve_request: 'Duyệt yêu cầu sửa của người học',
  save_question_direct: 'Sửa + lưu trực tiếp',
  add_question: 'Thêm câu mới',
  delete_question: 'Xoá câu (vào thùng rác)',
  restore_question: 'Khôi phục câu từ thùng rác',
  permanent_delete_question: 'Xoá vĩnh viễn câu',
  show_question: 'Hiện lại câu',
  hide_question: 'Ẩn câu'
};

/* DISCORD_ACTION_KINDS_20260729 — nhãn cho tin `role_change` và `destructive`. */
const ROLE_CHANGE_LABELS = {
  block_user: 'Khoá tài khoản',
  unblock_user: 'Mở khoá tài khoản',
  set_user_role: 'Đổi vai trò',
  approve_user_registration: 'Duyệt tài khoản',
  reject_user_registration: 'Từ chối + xoá tài khoản',
  revoke_user_approval: 'Thu hồi duyệt'
};

const DESTRUCTIVE_LABELS = {
  delete_subject: 'Xoá môn (còn khôi phục được từ thùng rác)',
  permanent_delete_subject: 'Xoá vĩnh viễn môn + toàn bộ câu hỏi',
  rename_subject_code: 'Đổi mã môn'
};

function parseJson(v, fallback) {
  if (v === null || v === undefined || v === '') return fallback;
  if (typeof v !== 'string') return v;
  try { return JSON.parse(v); } catch { return fallback; }
}

function toJsonText(v, fallback) {
  if (v === null || v === undefined) return JSON.stringify(fallback);
  if (typeof v === 'string') return v;
  try { return JSON.stringify(v); } catch { return JSON.stringify(fallback); }
}

function safeParse(str, fallback) {
  if (!str) return fallback;
  try { return JSON.parse(str); } catch(e) { return fallback; }
}

function hasOwn(obj, key) {
  return !!obj && Object.prototype.hasOwnProperty.call(obj, key);
}

function normalizeImagesForDb(newData, oldData) {
  if (hasOwn(newData, 'images')) {
    return Array.isArray(newData.images) ? newData.images : [];
  }
  if (Array.isArray(oldData?.images)) return oldData.images;
  return [];
}

function subjectCoverWithNewBadge(cover, enabled) {
  let meta = {};
  if (cover) {
    try {
      meta = typeof cover === 'string' ? JSON.parse(cover) : cover;
    } catch (e) {
      meta = { url: String(cover) };
    }
  }
  meta.new_badge = !!enabled;
  return JSON.stringify(meta);
}

// OPTIM_TURSO_READS_20260726: Cache admin dashboard.
// SELECT * 9 bảng rất tốn reads. TTL 2 phút (admin cần data tương đối mới).
let _adminDashCache = null;
let _adminDashCacheAt = 0;
const _ADMIN_DASH_CACHE_TTL = 2 * 60 * 1000; // 2 phút

export function clearAdminDashboardCache() {
  _adminDashCache = null;
  _adminDashCacheAt = 0;
}

export async function handleAdminDashboard(req, authUser) {
  if (req.method !== 'GET') return json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' }, 405);
  // III: phân biệt rõ 401/BLOCKED/PENDING_APPROVAL/INSUFFICIENT_ROLE thay vì
  // gộp tất cả thành một 403 không có code (client không biết phải xử lý kiểu gì).
  const access = await checkUserAccess(authUser, 'staff');
  if (!access.ok) return json({ error: access.error, code: access.code }, access.status);

  /*
    ADMIN_TWO_TIERS_20260729 + DISCORD_NOTIFICATION_TOGGLES_20260729
    Cấp admin phụ thuộc NGƯỜI ĐANG GỌI nên không được nằm trong _adminDashCache (cache dùng
    chung cho mọi staff). Vì vậy tính riêng rồi gắn vào response ở cả hai nhánh cache.
  */
  const viewer = {
    is_system_admin: isSystemAdmin(access.profile?.email),
    admin_tier: isSystemAdmin(access.profile?.email) ? 'system' : access.profile?.role === 'admin' ? 'normal' : null
  };
  const discord = {
    discord_notifications: await getDiscordSettings(),
    discord_notification_kinds: DISCORD_NOTIFICATION_KINDS
  };

  if (_adminDashCache && Date.now() - _adminDashCacheAt < _ADMIN_DASH_CACHE_TTL) {
    return json({ ..._adminDashCache, ...discord, ...viewer });
  }

  const [profiles, questions, requests, history, logs, subjects, subject_requests, deleted_questions, deleted_subjects] = await Promise.all([
    db.execute('select * from profiles order by created_at desc'),
    db.execute('select * from questions order by subject_code asc, num asc'),
    db.execute('select * from edit_requests order by created_at desc'),
    db.execute('select * from question_history order by created_at desc limit 500'),
    db.execute('select * from admin_logs order by created_at desc limit 500'),
    db.execute('select * from subjects order by sort_order asc, code asc'),
    db.execute('select * from subject_requests order by created_at desc'),
    db.execute('select * from deleted_questions order by deleted_at desc'),
    db.execute('select * from deleted_subjects order by deleted_at desc')
  ]);

  // SUBJECT_FOLDER_NEW_BADGE_20260729: nằm trong `data` (được cache) là an toàn vì MỌI
  // admin-action đều xoá _adminDashCache, kể cả set_subject_folder_new_badge.
  const folder_new_badges = await getFolderNewBadges();

  let release_notes_enabled = false;
  let release_notes_content = '';
  try {
    const settingsRows = await db.execute({
      sql: "select key, value from site_settings where key in ('release_notes_enabled', 'release_notes_content')",
      args: []
    });
    if (settingsRows.rows) {
      settingsRows.rows.forEach(row => {
        const k = row.key;
        const v = row.value;
        const strVal = typeof v === 'string' ? v.replace(/^"+|"+$/g, '') : String(v || '');
        if (k === 'release_notes_enabled') release_notes_enabled = strVal === 'true';
        if (k === 'release_notes_content') release_notes_content = strVal || '';
      });
    }
  } catch (e) {}

  const data = {
    folder_new_badges,
    release_notes: {
      enabled: release_notes_enabled,
      content: release_notes_content
    },
    profiles: profiles.rows || [],
    questions: questions.rows || [],
    requests: requests.rows || [],
    history: history.rows || [],
    logs: logs.rows || [],
    subjects: subjects.rows || [],
    subject_requests: subject_requests.rows || [],
    deleted_questions: deleted_questions.rows || [],
    deleted_subjects: deleted_subjects.rows || []
  };

  _adminDashCache = data;
  _adminDashCacheAt = Date.now();
  return json({ ...data, ...discord, ...viewer });
}

export async function handleAdminAction(req, authUser) {
  if (req.method !== 'POST') return json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' }, 405);

  const body = await req.json();
  const { action, payload } = body;
  // Danh tính LUÔN lấy từ token đã verify, không bao giờ từ body.user_id.
  const user_id = authUser.id;

  if (!user_id || !action) {
    return json({ error: 'Thiếu tham số action', code: 'BAD_REQUEST' }, 400);
  }

  /*
    SECURITY_ACTION_NORMALIZE_20260726 (LEO THANG ĐẶC QUYỀN)
    Bug cũ: kiểm tra quyền dùng `action` THÔ, còn switch điều phối dùng
    `act` đã .toLowerCase().trim(). Hai chuỗi khác nhau => bỏ qua được mọi kiểm tra.
    Ví dụ editor POST {"action":"Set_User_Role","payload":{...}}:
      - ADMIN_ONLY_ACTIONS.has("Set_User_Role") === false  -> rơi vào nhánh editor -> CHO PHÉP
      - act === "set_user_role"                            -> switch VẪN CHẠY
    => editor tự nâng mình lên admin. Tương tự với "Toggle_User_Block" để né cả
    lớp bảo vệ Root Admin bên dưới.
    Sửa: chuẩn hoá MỘT LẦN tại đây và dùng `act` cho toàn bộ phần còn lại.
  */
  const act = String(action || '').toLowerCase().trim();

  /*
    Một lần đọc Turso duy nhất cho toàn bộ request này (checkUserAccess dùng
    chung cache profile 10s với các API khác), thay cho `select * from profiles`
    riêng ở đây. Đồng thời áp luôn hàng rào chung: 401 / BLOCKED /
    PENDING_APPROVAL / INSUFFICIENT_ROLE đều có code chuẩn.
  */
  const access = await checkUserAccess(authUser);
  if (!access.ok) return json({ error: access.error, code: access.code }, access.status);

  const userProfile = access.profile;
  const adminEmail = String(getAdminEmail() || '').toLowerCase().trim();
  const isConfiguredAdmin = !!adminEmail && !!userProfile?.email && String(userProfile.email).toLowerCase().trim() === adminEmail;
  const isEditorOrAdmin = ['admin', 'editor'].includes(userProfile?.role);
  const isAdminRole = userProfile?.role === 'admin';
  // ADMIN_TWO_TIERS_20260729: cấp bậc lấy theo email trong profile Turso (đã verify token).
  const isSysAdmin = isSystemAdmin(userProfile?.email);

  const ADMIN_ONLY_ACTIONS = new Set([
    'toggle_user_block',
    'set_user_role',
    'approve_user_registration',
    'reject_user_registration',
    'revoke_user_approval',
    'notify_reload_user',
    'notify_reload_all',
    'set_registration_mode',
    'set_add_subject_ai_prompt',
    'approve_subject_request',
    'reject_subject_request',
    'permanent_delete_question',
    // SECURITY_ACTION_NORMALIZE_20260726: xoá vĩnh viễn cả môn + toàn bộ câu hỏi của môn
    // là thao tác không hoàn tác được, trước đây thiếu ở đây nên editor gọi thẳng API vẫn chạy.
    'permanent_delete_subject'
  ]);

  /*
    ADMIN_TWO_TIERS_20260729 — chỉ ADMIN HỆ THỐNG được đổi cấu hình thông báo Discord.
    Admin thường bị chặn ngay ở đây, không chỉ ẩn nút bên client: client chỉ là gợi ý,
    server mới là chốt.
  */
  const SYSTEM_ADMIN_ONLY_ACTIONS = new Set(['set_discord_notifications']);

  /*
    checkUserAccess() ở trên đã đảm bảo approved === 1 && blocked === 0, nên ở
    đây chỉ còn phải quyết định VAI TRÒ. `add_subject_request` là hành động của
    người học nên mọi tài khoản đã duyệt đều gọi được.
  */
  const isAllowedAction = act === 'add_subject_request'
    ? true
    : SYSTEM_ADMIN_ONLY_ACTIONS.has(act)
      ? isSysAdmin
      : ADMIN_ONLY_ACTIONS.has(act)
        ? (isConfiguredAdmin || isAdminRole)
        : (isConfiguredAdmin || isEditorOrAdmin);

  if (!isAllowedAction) {
    const err = SYSTEM_ADMIN_ONLY_ACTIONS.has(act)
      ? 'Chỉ admin hệ thống mới được đổi cấu hình này'
      : 'Bạn không có quyền thực hiện thao tác này';
    return json({ error: err, code: 'INSUFFICIENT_ROLE' }, 403);
  }

  /*
    DISCORD_ACTION_KINDS_20260729: giữ lại email/vai trò cũ của người bị tác động để tin
    `role_change` nói được "ai" thay vì chỉ có uuid. Dùng chính lần đọc đã có sẵn ở hàng rào
    Root Admin dưới đây, KHÔNG thêm lượt đọc Turso nào.
    (approve_user_registration không nằm trong danh sách này nên tin của nó chỉ có id — đúng,
    vì hàng rào Root Admin không cần đọc gì cho thao tác duyệt.)
  */
  let targetUserInfo = null;

  if (['toggle_user_block', 'set_user_role', 'revoke_user_approval', 'reject_user_registration'].includes(act)) {
    const targetId = payload?.target_user_id;
    if (targetId) {
      const targetRes = await db.execute({
        sql: 'select email, role from profiles where id = ?',
        args: [targetId]
      });
      const targetProfile = targetRes.rows?.[0];
      targetUserInfo = targetProfile || null;
      if (isRootAdmin(targetId, targetProfile?.email)) {
        return json({ error: 'Không thể hạ quyền, khóa hoặc xóa Root Admin.', code: 'PROTECTED_ROOT_ADMIN' }, 403);
      }
    }
  }

  const adminEmailStr = userProfile?.email || 'N/A';
  const now = new Date().toISOString();

  /*
    DISCORD_ACTION_KINDS_20260729 (mở rộng QUESTION_EDIT_DISCORD_20260729)
    Ba loại tin Discord đều bám vào MỘT chốt là logAdminAction, không rải vào từng case: mọi
    action đều đã gọi hàm này, nên action thêm sau này chỉ cần thêm tên vào đúng Set là có tin.

      · question_edit — nội dung câu hỏi bị đổi. CỐ Ý bỏ qua admin hệ thống (đỡ tự báo cho
        chính mình); admin thường / editor thì báo.
      · role_change   — quyền hoặc trạng thái tài khoản bị đổi. Báo với MỌI cấp, kể cả admin
        hệ thống: đây là vết cần giữ đủ.
      · destructive   — xoá môn / xoá vĩnh viễn / đổi mã môn. Cũng báo với mọi cấp.

    Việc bật/tắt do postDiscordEmbed(_, kind) lo (công tắc ở trang admin).
  */
  const _ROLE_CHANGE_ACTIONS = new Set([
    'block_user',
    'unblock_user',
    'set_user_role',
    'approve_user_registration',
    'reject_user_registration',
    'revoke_user_approval'
  ]);
  const _DESTRUCTIVE_ACTIONS = new Set(['delete_subject', 'permanent_delete_subject', 'rename_subject_code']);

  const actorLine = () => {
    const role = userProfile?.role || 'user';
    const tier = isSysAdmin ? 'admin hệ thống' : role === 'admin' ? 'admin thường' : role;
    return `Người thực hiện: **${adminEmailStr}** | Cấp: \`${tier}\``;
  };
  const timeField = () => ({
    name: 'Thời gian',
    value: new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
    inline: false
  });

  const notifyDiscordForAction = async (actionName, targetId, details) => {
    const role = userProfile?.role || 'user';
    const d = details || {};

    if (_QUESTION_MUTATIONS.has(act) && !isSysAdmin) {
      const where =
        d.subject_code || d.num ? `\`${d.subject_code || '?'}\` · câu **${d.num ?? '?'}**` : '_không rõ môn/số câu_';
      await postDiscordEmbed(
        {
          title: `📝 CÂU HỎI BỊ ĐỔI: ${QUESTION_EDIT_LABELS[actionName] || actionName}`,
          color: roleColor(role),
          description: actorLine(),
          fields: [
            { name: 'Thao tác', value: `\`${actionName}\``, inline: true },
            { name: 'ID câu hỏi', value: `\`${d.question_id ?? targetId ?? 'N/A'}\``, inline: true },
            { name: 'Vị trí', value: where, inline: false },
            timeField()
          ],
          footer: { text: 'Learning Hub · Thay đổi nội dung câu hỏi' },
          timestamp: now
        },
        'question_edit'
      );
      return;
    }

    if (_ROLE_CHANGE_ACTIONS.has(actionName)) {
      const fields = [
        { name: 'Thao tác', value: `\`${actionName}\``, inline: true },
        { name: 'Người bị tác động', value: targetUserInfo?.email || `\`${targetId}\``, inline: true }
      ];
      if (d.role) fields.push({ name: 'Vai trò mới', value: `\`${d.role}\``, inline: true });
      if (targetUserInfo?.role) fields.push({ name: 'Vai trò cũ', value: `\`${targetUserInfo.role}\``, inline: true });
      fields.push({ name: 'ID', value: `\`${targetId}\``, inline: false }, timeField());
      await postDiscordEmbed(
        {
          title: `🔐 QUYỀN NGƯỜI DÙNG: ${ROLE_CHANGE_LABELS[actionName] || actionName}`,
          color: roleColor(role),
          description: actorLine(),
          fields,
          footer: { text: 'Learning Hub · Quyền & trạng thái tài khoản' },
          timestamp: now
        },
        'role_change'
      );
      return;
    }

    if (_DESTRUCTIVE_ACTIONS.has(actionName)) {
      const fields = [{ name: 'Thao tác', value: `\`${actionName}\``, inline: true }];
      if (actionName === 'rename_subject_code') {
        fields.push({ name: 'Mã cũ → mã mới', value: `\`${d.old_code}\` → \`${d.new_code}\``, inline: true });
      } else {
        fields.push({ name: 'Môn', value: `\`${d.code || '?'}\``, inline: true });
      }
      if (d.questions !== undefined) {
        fields.push({ name: 'Số câu kéo theo', value: String(d.questions), inline: true });
      }
      fields.push(timeField());
      await postDiscordEmbed(
        {
          title:
            actionName === 'permanent_delete_subject'
              ? '☠️ XOÁ VĨNH VIỄN MÔN + TOÀN BỘ CÂU HỎI'
              : `⚠️ MÔN HỌC: ${DESTRUCTIVE_LABELS[actionName] || actionName}`,
          color: actionName === 'permanent_delete_subject' ? 14431557 : 16297114,
          description:
            actionName === 'permanent_delete_subject'
              ? `${actorLine()}\n**KHÔNG khôi phục được.**`
              : actorLine(),
          fields,
          footer: { text: 'Learning Hub · Thao tác nặng trên môn học' },
          timestamp: now
        },
        'destructive'
      );
    }
  };

  const logAdminAction = async (actionName, targetType, targetId, details = {}) => {
    try {
      await db.execute({
        sql: `insert into admin_logs (admin_id, admin_email, action, target_type, target_id, details, created_at)
              values (?, ?, ?, ?, ?, ?, ?)`,
        args: [user_id, adminEmailStr, actionName, targetType, String(targetId), JSON.stringify(details), now]
      });
    } catch (logErr) {
      console.warn('Logging failed:', logErr);
    }
    // Discord gửi SAU khi đã ghi log: webhook lỗi thì cũng không được làm mất dòng log.
    try {
      await notifyDiscordForAction(actionName, targetId, details);
    } catch (notifyErr) {
      console.warn('[discord action notify] không gửi được:', notifyErr?.message || notifyErr);
    }
  };

  /*
    V. ĐỒNG BỘ TURSO -> REALTIME (thứ tự bắt buộc)
      1. Ghi Turso.
      2. KIỂM TRA ghi thành công (rowsAffected). Không có dòng nào đổi nghĩa là
         target_user_id sai -> báo lỗi, KHÔNG báo ok và KHÔNG bắn realtime.
      3. Xoá cache profile phía server của user đó.
      4. Mới gửi tín hiệu realtime.
    Broadcast thất bại KHÔNG rollback Turso (XII): quyền đã bị chặn ở mọi API,
    client sẽ nhận ra ở lần gọi kế tiếp / khi quay lại tab / khi polling chạy.
  */
  async function applyUserStatusChange(targetUserId, sql, args, reason) {
    const targetId = String(targetUserId || '').trim();
    if (!targetId) {
      return { ok: false, res: json({ error: 'Thiếu target_user_id', code: 'BAD_REQUEST' }, 400) };
    }
    const r = await db.execute({ sql, args });
    if (r?.rowsAffected === 0) {
      return { ok: false, res: json({ error: 'Không tìm thấy người dùng', code: 'NOT_FOUND' }, 404) };
    }
    clearProfileCache(targetId);
    const delivered = await broadcastRealtimeUserStatus(targetId, { reason });
    return { ok: true, targetId, realtime_delivered: delivered };
  }

  // OPTIM_TURSO_READS_20260726: Invalidate server cache khi có mutation.
  // CACHE_INVALIDATION_FIX_20260726: 'toggle_subject_new_badge' KHÔNG tồn tại (case thật
  // là 'set_subject_new_badge'), nên bật/tắt nhãn NEW không bao giờ xoá cache -> học viên
  // thấy nhãn cũ tới 5 phút. Bổ sung luôn restore_question/restore_subject/
  // permanent_delete_subject vì trước đây khôi phục/xoá xong vẫn phục vụ dữ liệu cũ.
  const _QUESTION_MUTATIONS = new Set(['approve_request', 'save_question_direct', 'add_question', 'delete_question', 'toggle_question', 'permanent_delete_question', 'restore_question']);
  const _SUBJECT_MUTATIONS = new Set(['add_subject', 'delete_subject', 'approve_subject_request', 'set_subject_new_badge', 'set_subject_folder_new_badge', 'reorder_subjects', 'move_subject', 'rename_subject_code', 'edit_subject', 'restore_subject', 'permanent_delete_subject']);
  /*
    ADMIN_DASH_CACHE_USER_ACTIONS_20260726
    Bug: cache dashboard CHỈ được xoá cho mutation câu hỏi/môn. Các thao tác trên
    NGƯỜI DÙNG (toggle_user_block, set_user_role, approve/revoke/reject, xoá user,
    force_logout) không xoá gì cả, nên admin bấm Block xong:
      - toggleBlock() sửa lạc quan cache.profiles -> badge hiện "Bị khóa"
      - rồi loadAll() gọi lại /api/admin-dashboard -> server trả SNAPSHOT CŨ
        (TTL 2 phút, chụp trước khi block) -> badge nhảy về "Đã duyệt"
    User bị khóa thật (mọi API đều chặn), chỉ riêng admin nhìn thấy sai tới 2 phút.
    Nay xoá vô điều kiện: /api/admin-action luôn là mutation, và mọi action đều
    ghi admin_logs — bảng mà dashboard cũng hiển thị — nên chẳng có action nào
    được phép để lại cache cũ.

    Lưu ý (cùng bản chất với clearProfileCache): cache là biến module trong MỘT
    isolate. Isolate khác vẫn có thể phục vụ snapshot cũ tới khi hết TTL; TTL 2
    phút vẫn là chặn trên thực sự.
  */
  function _invalidateCaches() {
    clearAdminDashboardCache();
    if (_QUESTION_MUTATIONS.has(act)) { clearQuestionsCache(); clearSubjectsCache(); }
    if (_SUBJECT_MUTATIONS.has(act)) { clearSubjectsCache(); clearQuestionsCache(); }
  }

  try {

  switch (act) {
    case 'approve_request': {
      const { request_id } = payload;
      const reqRes = await db.execute({
        sql: 'select * from edit_requests where id = ?',
        args: [request_id]
      });
      const request = reqRes.rows?.[0];
      if (!request) return json({ error: 'Request not found' }, 404);

      const new_data = safeParse(request.new_data, {});
      const old_data = safeParse(request.old_data, {});
      const finalImages = normalizeImagesForDb(new_data, old_data);

      await db.execute({
        sql: `update questions
              set question = ?, options = ?, answer = ?, answer_text = ?, images = ?,
                  has_image = ?, error_risk = ?, error_risk_reason = ?, updated_at = ?
              where id = ?`,
        args: [
          new_data.question,
          JSON.stringify(new_data.options || {}),
          new_data.answer,
          new_data.answer_text || '',
          JSON.stringify(finalImages),
          (hasOwn(new_data, 'has_image') ? new_data.has_image : finalImages.length > 0) ? 1 : 0,
          new_data.error_risk || 'low',
          new_data.error_risk_reason || null,
          now,
          request.question_id
        ]
      });

      await db.execute({
        sql: 'update edit_requests set status = ?, reviewed_at = ?, reviewed_by = ? where id = ?',
        args: ['approved', now, user_id, request_id]
      });

      await db.execute({
        sql: `insert into question_history (question_id, request_id, previous_data, new_data, changed_by, approved_by, created_at)
              values (?, ?, ?, ?, ?, ?, ?)`,
        args: [
          request.question_id,
          request_id,
          request.old_data,
          request.new_data,
          request.user_id,
          user_id,
          now
        ]
      });

      // QUESTION_EDIT_DISCORD_20260729: subject_code/num đi kèm để tin Discord (và cả dòng
      // log) nói được "môn nào, câu số bao nhiêu" thay vì chỉ có id.
      await logAdminAction('approve_request', 'edit_requests', request_id, {
        question_id: request.question_id,
        subject_code: new_data.subject_code ?? old_data.subject_code ?? request.subject_code,
        num: new_data.num ?? old_data.num ?? request.num
      });
      return json({ ok: true });
    }

    case 'reject_request': {
      const { request_id, admin_note } = payload;
      await db.execute({
        sql: 'update edit_requests set status = ?, admin_note = ?, reviewed_at = ?, reviewed_by = ? where id = ?',
        args: ['rejected', admin_note || '', now, user_id, request_id]
      });

      await logAdminAction('reject_request', 'edit_requests', request_id, { admin_note });
      return json({ ok: true });
    }

    case 'save_question_direct': {
      const { question_id, new_data, old_data } = payload;
      const finalImages = normalizeImagesForDb(new_data || {}, old_data || {});
      await db.execute({
        sql: `update questions
              set question = ?, options = ?, answer = ?, answer_text = ?, images = ?,
                  has_image = ?, error_risk = ?, error_risk_reason = ?, updated_at = ?
              where id = ?`,
        args: [
          new_data.question,
          JSON.stringify(new_data.options || {}),
          new_data.answer,
          new_data.answer_text || '',
          JSON.stringify(finalImages),
          (hasOwn(new_data, 'has_image') ? new_data.has_image : finalImages.length > 0) ? 1 : 0,
          new_data.error_risk || 'low',
          new_data.error_risk_reason || null,
          now,
          question_id
        ]
      });

      await db.execute({
        sql: `insert into question_history (question_id, request_id, previous_data, new_data, changed_by, approved_by, created_at)
              values (?, null, ?, ?, ?, ?, ?)`,
        args: [
          question_id,
          JSON.stringify(old_data || {}),
          JSON.stringify(new_data || {}),
          user_id,
          user_id,
          now
        ]
      });

      await logAdminAction('save_question_direct', 'questions', question_id, {
        question_id,
        subject_code: new_data?.subject_code ?? old_data?.subject_code,
        num: new_data?.num ?? old_data?.num
      });
      return json({ ok: true });
    }

    case 'add_question': {
      const { question_data } = payload;
      const subjectCode = question_data.subject_code || 'HOD102';
      
      let finalNum = Number(question_data.num);
      const existRes = await db.execute({
        sql: 'select num from questions where subject_code = ?',
        args: [subjectCode]
      });
      const existSet = new Set((existRes.rows || []).map(x => Number(x.num)));
      
      if (!finalNum || existSet.has(finalNum)) {
        let n = 1;
        while (existSet.has(n)) n++;
        finalNum = n;
      }

      const res = await db.execute({
        sql: `insert into questions (subject_code, num, question, options, answer, answer_text, images, is_active, has_image, error_risk, error_risk_reason, created_at, updated_at)
              values (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)`,
        args: [
          subjectCode,
          finalNum,
          question_data.question,
          JSON.stringify(question_data.options || {}),
          question_data.answer,
          question_data.answer_text || '',
          JSON.stringify(question_data.images || []),
          question_data.has_image ? 1 : 0,
          question_data.error_risk || 'low',
          question_data.error_risk_reason || null,
          now,
          now
        ]
      });

      const newId = Number(res.lastInsertRowid);

      await db.execute({
        sql: `insert into question_history (question_id, request_id, previous_data, new_data, changed_by, approved_by, created_at)
              values (?, null, null, ?, ?, ?, ?)`,
        args: [
          newId,
          JSON.stringify(question_data),
          user_id,
          user_id,
          now
        ]
      });

      await logAdminAction('add_question', 'questions', newId, {
        question_id: newId,
        subject_code: subjectCode,
        num: finalNum
      });
      return json({ ok: true, id: newId });
    }

    case 'delete_question': {
      const { question_id } = payload;
      const qRes = await db.execute({
        sql: 'select * from questions where id = ?',
        args: [question_id]
      });
      const q = qRes.rows?.[0];
      if (!q) return json({ error: 'Question not found' }, 404);

      await db.execute({
        sql: 'update questions set is_active = 0, updated_at = ? where id = ?',
        args: [now, question_id]
      });

      await db.execute({
        sql: `insert or replace into deleted_questions (id, original_data, deleted_at, deleted_by, deleted_by_email)
              values (?, ?, ?, ?, ?)`,
        args: [question_id, JSON.stringify(q), now, user_id, adminEmailStr]
      });

      await logAdminAction('delete_question', 'questions', question_id, {
        question_id,
        subject_code: q.subject_code,
        num: q.num
      });
      return json({ ok: true });
    }

    case 'restore_question': {
      const { question_id } = payload;
      await db.execute({
        sql: 'update questions set is_active = 1, updated_at = ? where id = ?',
        args: [now, question_id]
      });
      await db.execute({
        sql: 'delete from deleted_questions where id = ?',
        args: [question_id]
      });

      await logAdminAction('restore_question', 'questions', question_id);
      return json({ ok: true });
    }

    case 'add_subject': {
      const { code, name, description, cover, sort_order, questions } = payload;
      
      let finalCode = code.toUpperCase().trim();
      const existed = await db.execute({
        sql: "select code from subjects where code = ? or code like ?",
        args: [finalCode, `${finalCode}_%`]
      });
      const usedCodes = new Set((existed.rows || []).map(x => String(x.code || '').toUpperCase()));
      if (usedCodes.has(finalCode)) {
        let n = 2;
        while (usedCodes.has(`${finalCode}_${n}`)) n++;
        finalCode = `${finalCode}_${n}`;
      }

      let finalSortOrder = sort_order;
      if (!finalSortOrder) {
        const maxRes = await db.execute('select max(sort_order) as m from subjects');
        finalSortOrder = (Number(maxRes.rows?.[0]?.m) || 0) + 1;
      }
      const res = await db.execute({
        sql: `insert into subjects (code, name, description, cover, sort_order, is_active, created_at)
              values (?, ?, ?, ?, ?, 1, ?)`,
        args: [finalCode, name, description || '', subjectCoverWithNewBadge(cover, true), finalSortOrder, now]
      });

      const newId = Number(res.lastInsertRowid);

      if (questions && questions.length > 0) {
        // IMPORT_QUALITY_GATE_20260805: tôn trọng num của file import (kể cả biến thể "1.1"),
        // chỉ tự cấp số khi num thiếu/rác/trùng. Xem api/lib/questionNums.js.
        const finalNums = resolveImportNums(questions);
        for (let qi = 0; qi < questions.length; qi++) {
          const q = questions[qi];
          const list = q.images || [];
          const localHasImg = !!(list.length || q.has_image);
          const finalNum = finalNums[qi];
          await db.execute({
            sql: `insert into questions (subject_code, num, question, options, answer, answer_text, images, is_active, has_image, error_risk, error_risk_reason, created_at, updated_at)
                  values (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)`,
            args: [
              finalCode,
              finalNum,
              q.question || '',
              JSON.stringify(q.options || {}),
              (q.answer || '').toUpperCase(),
              q.answer_text || '',
              JSON.stringify(q.images || []),
              localHasImg ? 1 : 0,
              q.error_risk || 'low',
              q.error_risk_reason || null,
              now,
              now
            ]
          });
        }
      }

      await logAdminAction('add_subject', 'subjects', newId, { code: finalCode });
      return json({ ok: true, id: newId, code: finalCode });
    }

    case 'edit_subject': {
      const { id, name, description, cover, sort_order, new_badge } = payload;
      const oldRes = await db.execute({ sql: 'select * from subjects where id = ?', args: [id] });
      const oldSub = oldRes.rows?.[0];
      if (!oldSub) return json({ error: 'Subject not found' }, 404);
      const finalCover = (new_badge === true || new_badge === false)
        ? subjectCoverWithNewBadge(cover !== undefined ? cover : oldSub.cover, new_badge)
        : (cover !== undefined ? cover : oldSub.cover || '');
      await db.execute({
        sql: `update subjects
              set name = ?, description = ?, cover = ?, sort_order = ?
              where id = ?`,
        args: [name, description || '', finalCover, Number(sort_order || 0), id]
      });
      await logAdminAction('edit_subject', 'subjects', id, { new_badge, sort_order });
      return json({ ok: true });
    }

    case 'rename_subject_code': {
      const oc = String(payload.old_code || '').toUpperCase().trim();
      const nc = String(payload.new_code || '').toUpperCase().trim();
      if (!oc || !nc) return json({ error: 'Thiếu mã môn' }, 400);
      const oldRes = await db.execute({ sql: 'select * from subjects where code = ?', args: [oc] });
      const oldSub = oldRes.rows?.[0];
      if (!oldSub) return json({ error: 'Không tìm thấy môn ' + oc }, 404);
      if (nc !== oc) {
        const exist = await db.execute({ sql: 'select id from subjects where code = ?', args: [nc] });
        if (exist.rows && exist.rows.length) return json({ error: 'Mã môn ' + nc + ' đã tồn tại' }, 400);
      }
      await db.execute({
        sql: `insert into subjects (code, name, description, cover, sort_order, is_active, created_at)
              values (?, ?, ?, ?, ?, 1, ?)
              on conflict(code) do update set name = excluded.name, description = excluded.description`,
        args: [nc, payload.name || oldSub.name, payload.description || oldSub.description || '', oldSub.cover || '', oldSub.sort_order || 0, now]
      });
      await db.execute({ sql: 'update questions set subject_code = ? where subject_code = ?', args: [nc, oc] });
      if (nc !== oc) await db.execute({ sql: 'delete from subjects where code = ?', args: [oc] });
      await logAdminAction('rename_subject_code', 'subjects', nc, { old_code: oc, new_code: nc });
      return json({ ok: true });
    }

    case 'reorder_subjects': {
      const items = Array.isArray(payload?.subjects) ? payload.subjects : [];
      if (!items.length) return json({ error: 'Missing subjects' }, 400);

      for (const item of items) {
        const sid = item?.id;
        const order = Number(item?.sort_order);
        if (!sid || !Number.isFinite(order) || order < 1) continue;
        await db.execute({
          sql: 'update subjects set sort_order = ? where id = ?',
          args: [order, sid]
        });
      }

      await logAdminAction('reorder_subjects', 'subjects', 'bulk', { count: items.length });
      return json({ ok: true, count: items.length });
    }

    case 'set_subject_new_badge': {
      const { id, enabled } = payload;
      const subRes = await db.execute({ sql: 'select * from subjects where id = ?', args: [id] });
      const sub = subRes.rows?.[0];
      if (!sub) return json({ error: 'Subject not found' }, 404);
      await db.execute({
        sql: 'update subjects set cover = ? where id = ?',
        args: [subjectCoverWithNewBadge(sub.cover, !!enabled), id]
      });
      await logAdminAction('set_subject_new_badge', 'subjects', id, { enabled: !!enabled });
      return json({ ok: true });
    }

    /*
      SUBJECT_FOLDER_NEW_BADGE_20260729 — NEW của THƯ MỤC (mã gốc) là cờ riêng, KHÔNG ghi gì
      vào các môn con. Đổi cờ này không làm môn con bật/tắt NEW và ngược lại.
      payload: { base: 'MLN122', enabled: bool }
    */
    case 'set_subject_folder_new_badge': {
      const { base, enabled } = payload;
      if (!String(base || '').trim()) return json({ error: 'Thiếu mã gốc thư mục' }, 400);
      const folders = await setFolderNewBadge(base, !!enabled, user_id);
      await logAdminAction('set_subject_folder_new_badge', 'site_settings', FOLDER_NEW_BADGE_KEY, {
        base: String(base).toUpperCase(),
        enabled: !!enabled
      });
      return json({ ok: true, folder_new_badges: folders });
    }

    case 'move_subject': {
      const { id, direction } = payload;
      const all = await db.execute({
        sql: 'select id, sort_order, code from subjects where coalesce(is_active, 1) = 1 order by sort_order asc, code asc'
      });
      const rows = all.rows || [];
      const idx = rows.findIndex(x => String(x.id) === String(id));
      if (idx < 0) return json({ error: 'Subject not found' }, 404);
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= rows.length) return json({ ok: true, unchanged: true });
      const a = rows[idx], b = rows[swapIdx];
      const aOrder = Number(a.sort_order || idx + 1);
      const bOrder = Number(b.sort_order || swapIdx + 1);
      await db.execute({ sql: 'update subjects set sort_order = ? where id = ?', args: [bOrder, a.id] });
      await db.execute({ sql: 'update subjects set sort_order = ? where id = ?', args: [aOrder, b.id] });
      await logAdminAction('move_subject', 'subjects', id, { direction });
      return json({ ok: true });
    }

    case 'delete_subject': {
      const { subject_id } = payload;
      const subRes = await db.execute({
        sql: 'select * from subjects where id = ?',
        args: [subject_id]
      });
      const sub = subRes.rows?.[0];
      if (!sub) return json({ error: 'Subject not found' }, 404);

      const qRes = await db.execute({
        sql: 'select * from questions where subject_code = ? order by num asc',
        args: [sub.code]
      });
      const backup = { subject: sub, questions: qRes.rows || [] };

      await db.execute({
        sql: 'update subjects set is_active = 0 where id = ?',
        args: [subject_id]
      });
      await db.execute({
        sql: 'update questions set is_active = 0, updated_at = ? where subject_code = ?',
        args: [now, sub.code]
      });

      await db.execute({
        sql: `insert into deleted_subjects (original_data, deleted_by, deleted_by_email, deleted_at)
              values (?, ?, ?, ?)`,
        args: [JSON.stringify(backup), user_id, adminEmailStr, now]
      });

      await logAdminAction('delete_subject', 'subjects', subject_id, { code: sub.code, questions: backup.questions.length });
      return json({ ok: true });
    }

    case 'permanent_delete_subject': {
      const { subject_id } = payload;
      const sid = String(subject_id || '').trim();
      if (!sid) return json({ error: 'Missing subject_id' }, 400);

      const delRes = await db.execute({
        sql: 'select * from deleted_subjects where id = ?',
        args: [sid]
      });
      let trash = delRes.rows?.[0];
      if (!trash && /^\d+$/.test(sid)) {
        const delRes2 = await db.execute({
          sql: 'select * from deleted_subjects where id = ?',
          args: [Number(sid)]
        });
        trash = delRes2.rows?.[0];
      }
      if (!trash) return json({ error: 'Deleted subject not found' }, 404);

      const backup = safeParse(trash.original_data, {});
      const sub = backup.subject || backup || {};
      const code = String(sub.code || '').trim();

      if (code) {
        await db.execute({ sql: 'delete from questions where subject_code = ?', args: [code] });
        await db.execute({ sql: 'delete from subjects where code = ?', args: [code] });
      }

      await db.execute({ sql: 'delete from deleted_subjects where id = ?', args: [trash.id] });
      await logAdminAction('permanent_delete_subject', 'deleted_subjects', trash.id, { code });
      return json({ ok: true, id: trash.id, code });
    }

    case 'permanent_delete_question': {
      const { question_id } = payload;
      const qid = String(question_id || '').trim();
      if (!qid) return json({ error: 'Missing question_id' }, 400);

      const delRes = await db.execute({ sql: 'select * from deleted_questions where id = ?', args: [qid] });
      let trash = delRes.rows?.[0];
      if (!trash && /^\d+$/.test(qid)) {
        const delRes2 = await db.execute({ sql: 'select * from deleted_questions where id = ?', args: [Number(qid)] });
        trash = delRes2.rows?.[0];
      }
      if (!trash) return json({ error: 'Deleted question not found' }, 404);

      const oldQ = safeParse(trash.original_data, {});
      const realQuestionId = oldQ.id || trash.id;
      if (realQuestionId) await db.execute({ sql: 'delete from questions where id = ?', args: [realQuestionId] });
      await db.execute({ sql: 'delete from deleted_questions where id = ?', args: [trash.id] });
      await logAdminAction('permanent_delete_question', 'deleted_questions', trash.id, { question_id: realQuestionId, subject_code: oldQ.subject_code, num: oldQ.num });
      return json({ ok: true, id: trash.id });
    }

    case 'restore_subject': {
      const { subject_id, code } = payload;
      const delRes = await db.execute({
        sql: 'select * from deleted_subjects where id = ?',
        args: [subject_id]
      });
      const trash = delRes.rows?.[0];
      const backup = trash ? safeParse(trash.original_data, {}) : {};
      const sub = backup.subject || backup || null;

      if (sub?.code) {
        await db.execute({
          sql: `insert into subjects (code, name, description, cover, sort_order, is_active, created_at)
                values (?, ?, ?, ?, ?, 1, ?)
                on conflict(code) do update set
                  name = excluded.name,
                  description = excluded.description,
                  cover = excluded.cover,
                  sort_order = excluded.sort_order,
                  is_active = 1`,
          args: [sub.code, sub.name || sub.code, sub.description || '', sub.cover || '', sub.sort_order || 0, sub.created_at || now]
        });

        const questions = Array.isArray(backup.questions) ? backup.questions : [];
        for (const q of questions) {
          await db.execute({
            sql: `insert into questions (subject_code, num, question, options, answer, answer_text, images, is_active, has_image, error_risk, error_risk_reason, created_at, updated_at)
                  values (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)
                  on conflict(subject_code, num) do update set
                    question = excluded.question,
                    options = excluded.options,
                    answer = excluded.answer,
                    answer_text = excluded.answer_text,
                    images = excluded.images,
                    is_active = 1,
                    has_image = excluded.has_image,
                    error_risk = excluded.error_risk,
                    error_risk_reason = excluded.error_risk_reason,
                    updated_at = excluded.updated_at`,
            args: [
              q.subject_code || sub.code,
              q.num,
              q.question || '',
              toJsonText(q.options, {}),
              q.answer || '',
              q.answer_text || '',
              toJsonText(q.images, []),
              q.has_image ? 1 : 0,
              q.error_risk || 'low',
              q.error_risk_reason || null,
              q.created_at || now,
              now
            ]
          });
        }
      } else {
        await db.execute({
          sql: 'update subjects set is_active = 1 where id = ?',
          args: [subject_id]
        });
      }

      await db.execute({
        sql: 'delete from deleted_subjects where id = ?',
        args: [subject_id]
      });
      await logAdminAction('restore_subject', 'subjects', subject_id, { code: code || sub?.code });
      return json({ ok: true });
    }

    case 'approve_subject_request': {
      const { request_id } = payload;
      const reqRes = await db.execute({
        sql: 'select * from subject_requests where id = ?',
        args: [request_id]
      });
      const request = reqRes.rows?.[0];
      if (!request) return json({ error: 'Request not found' }, 404);

      await db.execute({
        sql: `insert into subjects (code, name, description, cover, sort_order, is_active, created_at)
              values (?, ?, ?, ?, 99, 1, ?)`,
        args: [request.code.toUpperCase().trim(), request.name, request.description || '', subjectCoverWithNewBadge('', true), now]
      });

      const qList = safeParse(request.questions_data, []);
      if (qList && qList.length > 0) {
        // IMPORT_QUALITY_GATE_20260805: cùng luật đánh số với `add_subject` — nếu chỉ sửa một chỗ
        // thì môn do admin tự thêm và môn do học viên gửi duyệt sẽ đánh số khác nhau.
        const finalNums = resolveImportNums(qList);
        for (let qi = 0; qi < qList.length; qi++) {
          const q = qList[qi];
          await db.execute({
            sql: `insert into questions (subject_code, num, question, options, answer, answer_text, images, is_active, has_image, error_risk, error_risk_reason, created_at, updated_at)
                  values (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)`,
            args: [
              request.code.toUpperCase().trim(),
              finalNums[qi],
              q.question,
              JSON.stringify(q.options || {}),
              q.answer,
              q.answer_text || '',
              JSON.stringify(q.images || []),
              !!(q.images && q.images.length) || !!q.has_image ? 1 : 0,
              q.error_risk || 'low',
              q.error_risk_reason || null,
              now,
              now
            ]
          });
        }
      }

      await db.execute({
        sql: 'update subject_requests set status = ?, reviewed_at = ?, reviewed_by = ? where id = ?',
        args: ['approved', now, user_id, request_id]
      });

      await logAdminAction('approve_subject_request', 'subject_requests', request_id, { code: request.code });
      return json({ ok: true });
    }

    case 'reject_subject_request': {
      const { request_id, admin_note } = payload;
      await db.execute({
        sql: 'update subject_requests set status = ?, admin_note = ?, reviewed_at = ?, reviewed_by = ? where id = ?',
        args: ['rejected', admin_note || '', now, user_id, request_id]
      });

      await logAdminAction('reject_subject_request', 'subject_requests', request_id);
      return json({ ok: true });
    }

    case 'toggle_user_block': {
      const { target_user_id, blocked } = payload;
      const out = await applyUserStatusChange(
        target_user_id,
        'update profiles set blocked = ? where id = ?',
        [blocked ? 1 : 0, String(target_user_id || '').trim()],
        blocked ? 'blocked' : 'unblocked'
      );
      if (!out.ok) return out.res;
      await logAdminAction(blocked ? 'block_user' : 'unblock_user', 'profiles', out.targetId);
      return json({ ok: true, realtime_delivered: out.realtime_delivered });
    }

    case 'set_user_role': {
      const { target_user_id, role } = payload;
      if (!['user', 'editor', 'admin'].includes(role)) {
        return json({ error: 'Vai trò không hợp lệ', code: 'BAD_REQUEST' }, 400);
      }
      /*
        Thăng lên editor/admin thì duyệt luôn. Trước đây việc này được /api/profile
        "chữa cháy" bằng cách tự set approved = 1 mỗi lần editor đăng nhập, khiến
        thao tác "Thu hồi duyệt" trên editor không bao giờ có tác dụng. Nay quyết
        định nằm đúng ở nơi admin bấm nút, còn approved thì thu hồi được bình thường.
      */
      const promote = role === 'editor' || role === 'admin';
      const out = await applyUserStatusChange(
        target_user_id,
        promote
          ? 'update profiles set role = ?, approved = 1 where id = ?'
          : 'update profiles set role = ? where id = ?',
        [role, String(target_user_id || '').trim()],
        'role_changed'
      );
      if (!out.ok) return out.res;
      await logAdminAction('set_user_role', 'profiles', out.targetId, { role });
      return json({ ok: true, realtime_delivered: out.realtime_delivered });
    }

    case 'approve_user_registration': {
      const { target_user_id } = payload;
      const out = await applyUserStatusChange(
        target_user_id,
        'update profiles set approved = 1, blocked = 0 where id = ?',
        [String(target_user_id || '').trim()],
        'approved'
      );
      if (!out.ok) return out.res;
      await logAdminAction('approve_user_registration', 'profiles', out.targetId);
      return json({ ok: true, realtime_delivered: out.realtime_delivered });
    }

    case 'reject_user_registration': {
      const { target_user_id } = payload;
      const out = await applyUserStatusChange(
        target_user_id,
        'delete from profiles where id = ?',
        [String(target_user_id || '').trim()],
        'rejected'
      );
      if (!out.ok) return out.res;
      await logAdminAction('reject_user_registration', 'profiles', out.targetId);
      return json({ ok: true, realtime_delivered: out.realtime_delivered });
    }

    case 'revoke_user_approval': {
      const { target_user_id } = payload;
      const out = await applyUserStatusChange(
        target_user_id,
        'update profiles set approved = 0 where id = ?',
        [String(target_user_id || '').trim()],
        'revoked'
      );
      if (!out.ok) return out.res;
      await logAdminAction('revoke_user_approval', 'profiles', out.targetId);
      return json({ ok: true, realtime_delivered: out.realtime_delivered });
    }

    /*
      RELOAD_NOTICE_20260729 — thay cho force_logout_user / force_logout_all.
      Admin KHÔNG đá người dùng ra nữa: chỉ đặt cờ reload_notice để client hiện banner
      "Có bản cập nhật — Tải lại", đúng như khi deploy bản mới. Không huỷ phiên, không
      alert, người dùng tự bấm tải lại khi thuận tiện.

      Cờ trong DB lo cho người đang offline; broadcast realtime lo cho người đang mở web.
    */
    case 'notify_reload_user': {
      const { target_user_id } = payload;
      const targetId = String(target_user_id || '').trim();
      if (!targetId) return json({ error: 'Missing target_user_id' }, 400);

      const out = await applyUserStatusChange(
        targetId,
        'update profiles set reload_notice = 1 where id = ?',
        [targetId],
        'reload_notice'
      );
      if (!out.ok) return out.res;
      await logAdminAction('notify_reload_user', 'profiles', targetId);
      return json({ ok: true, realtime_delivered: out.realtime_delivered });
    }

    case 'notify_reload_all': {
      // Trừ chính người bấm — không có lý do gì tự nhắc mình tải lại.
      const r = await db.execute({
        sql: 'update profiles set reload_notice = 1 where id != ?',
        args: [user_id]
      });
      clearProfileCache(); // clear toàn bộ cache
      const delivered = await broadcastRealtimeGlobal('reload_notice', { reason: 'admin_notify_all' });
      await logAdminAction('notify_reload_all', 'profiles', 'all', { affected: r?.rowsAffected ?? null });
      return json({ ok: true, affected: r?.rowsAffected ?? null, realtime_delivered: delivered });
    }

    /*
      DISCORD_NOTIFICATION_TOGGLES_20260729 — CHỈ admin hệ thống (chặn ở
      SYSTEM_ADMIN_ONLY_ACTIONS phía trên). payload: { notifications: { login: bool, ... } }
    */
    case 'set_discord_notifications': {
      const next = await saveDiscordSettings(payload?.notifications ?? payload);
      await logAdminAction('set_discord_notifications', 'site_settings', SETTINGS_KEY, next);
      return json({ ok: true, notifications: next });
    }

    case 'toggle_question': {
      const { question_id, is_active } = payload;
      await db.execute({
        sql: 'update questions set is_active = ?, updated_at = ? where id = ?',
        args: [is_active ? 1 : 0, now, question_id]
      });
      await logAdminAction(is_active ? 'show_question' : 'hide_question', 'questions', question_id);
      return json({ ok: true });
    }

    case 'set_registration_mode': {
      let { mode } = payload;  
      if (typeof mode !== 'string') mode = String(mode || 'approval');  
      try { mode = JSON.parse(mode); } catch {}  
      if (typeof mode !== 'string') mode = String(mode || 'approval');  
      mode = mode.replace(/^\"+|\"+$/g, '').trim();  
      if (!['open', 'approval', 'closed'].includes(mode)) mode = 'approval';  
      await db.execute({  
        sql: "insert into site_settings (key, value, updated_at, updated_by) values ('registration_mode', ?, ?, ?) on conflict(key) do update set value = excluded.value, updated_at = excluded.updated_at, updated_by = excluded.updated_by",  
        args: [mode, now, user_id]  
      });  
      await logAdminAction('set_registration_mode', 'site_settings', 'registration_mode', { mode });  
      return json({ ok: true, mode });  
    }

    case 'set_add_subject_ai_prompt': {
      let { prompt } = payload;
      if (typeof prompt !== 'string') prompt = '';
      await db.execute({
        sql: "insert into site_settings (key, value, updated_at, updated_by) values ('add_subject_ai_prompt', ?, ?, ?) on conflict(key) do update set value = excluded.value, updated_at = excluded.updated_at, updated_by = excluded.updated_by",
        args: [prompt, now, user_id]
      });
      await logAdminAction('set_add_subject_ai_prompt', 'site_settings', 'add_subject_ai_prompt', { prompt_len: prompt.length });
      return json({ ok: true, prompt });
    }

    case 'set_release_notes': {
      const enabled = payload.enabled ? 'true' : 'false';
      const content = String(payload.content || '').trim();
      await db.execute({
        sql: "insert into site_settings (key, value, updated_at, updated_by) values ('release_notes_enabled', ?, ?, ?) on conflict(key) do update set value = excluded.value, updated_at = excluded.updated_at, updated_by = excluded.updated_by",
        args: [enabled, now, user_id]
      });
      await db.execute({
        sql: "insert into site_settings (key, value, updated_at, updated_by) values ('release_notes_content', ?, ?, ?) on conflict(key) do update set value = excluded.value, updated_at = excluded.updated_at, updated_by = excluded.updated_by",
        args: [content, now, user_id]
      });
      await logAdminAction('set_release_notes', 'site_settings', 'release_notes', { enabled: !!payload.enabled, content_len: content.length });
      return json({ ok: true, release_notes: { enabled: !!payload.enabled, content } });
    }

    case 'add_subject_request': {
      const { code, name, description, questions_data } = payload;
      const reqCode = code.toUpperCase().trim();
      await db.execute({
        sql: `insert into subject_requests (code, name, description, questions_data, user_id, user_email, status, created_at)
              values (?, ?, ?, ?, ?, ?, 'pending', ?)`,
        args: [reqCode, name, description || '', toJsonText(questions_data, []), user_id, adminEmailStr, now]
      });
      /*
        SUBJECT_REQUEST_DISCORD_20260729
        Case này là thao tác của NGƯỜI HỌC (xem isAllowedAction ở đầu hàm) nên không ghi
        admin_logs, tức là không đi qua chốt notifyDiscordForAction — phải gọi thẳng ở đây.
        Cùng loại việc "có cái đang chờ duyệt" như new_user: không nhắc thì môn nằm im.
      */
      try {
        const qCount = Array.isArray(questions_data) ? questions_data.length : null;
        await postDiscordEmbed(
          {
            title: '📚 YÊU CẦU THÊM MÔN MỚI',
            color: 6323595,
            description: `**${adminEmailStr}** gửi một môn chờ duyệt — trang admin → Yêu cầu thêm môn.`,
            fields: [
              { name: 'Mã môn', value: `\`${reqCode}\``, inline: true },
              { name: 'Tên môn', value: String(name || '_không có_').slice(0, 200), inline: true },
              { name: 'Số câu kèm theo', value: qCount === null ? '_không rõ_' : String(qCount), inline: true },
              { name: 'Người gửi', value: adminEmailStr, inline: false },
              {
                name: 'Thời gian',
                value: new Date(now).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
                inline: false
              }
            ],
            footer: { text: 'Learning Hub · Yêu cầu thêm môn' },
            timestamp: now
          },
          'subject_request'
        );
      } catch (notifyErr) {
        console.warn('[subject_request discord] không gửi được:', notifyErr?.message || notifyErr);
      }
      return json({ ok: true });
    }

    default:
      // Trả `act` đã chuẩn hoá, không phản chiếu nguyên văn chuỗi từ client.
      return json({ error: `Hành động '${act}' không được hỗ trợ`, code: 'BAD_REQUEST' }, 400);
  }

  } finally {
    _invalidateCaches();
  }
}
