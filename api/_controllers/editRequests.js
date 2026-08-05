import { db, json } from '../_lib/db.js';
import { checkUserAccess, loadProfileRow, roleColor, getAdminEmail } from '../_lib/auth.js';
// DISCORD_NOTIFICATION_TOGGLES_20260729: bản chung, tự kiểm tra loại 'edit_request' có bật.
import { postDiscordEmbed } from '../_lib/discord.js';

function parseJson(v, fallback) {
  if (v === null || v === undefined || v === '') return fallback;
  if (typeof v !== 'string') return v;
  try { return JSON.parse(v); } catch { return fallback; }
}

function discordText(value, fallback = 'N/A', maxLength = 1000) {
  const text = String(value ?? '').trim();
  if (!text) return fallback;
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

function shouldNotifyQuestionChange(profile, authUser) {
  const role = String(profile?.role || '').toLowerCase();
  const configuredAdmin = String(getAdminEmail() || '').toLowerCase().trim();
  const email = String(authUser?.email || profile?.email || '').toLowerCase().trim();
  return role !== 'admin' && (!configuredAdmin || email !== configuredAdmin);
}

function questionAnswerText(data) {
  if (!data) return '';
  const answerText = String(data.answer_text || '').trim();
  if (answerText) return answerText;
  const answer = String(data.answer || '').trim();
  const options = parseJson(data.options, data.options || {});
  const optionText = options && typeof options === 'object' ? String(options[answer] || '').trim() : '';
  return optionText ? `${answer}. ${optionText}` : answer;
}

function getFirstImageUrl(data) {
  if (!data) return null;
  const imgs = parseJson(data.images, data.images);
  if (!Array.isArray(imgs) || imgs.length === 0) return null;
  const im = imgs[0];
  if (typeof im === 'string') return im;
  return im?.src || im?.url || im?.secure_url || null;
}

async function notifyQuestionChange({ profile, authUser, title, questionNum, subjectCode, questionText, oldData, newData, reason }) {
  if (!shouldNotifyQuestionChange(profile, authUser)) return;
  const role = String(profile?.role || 'user').toLowerCase();
  const oldAnswer = questionAnswerText(oldData);
  const newAnswer = questionAnswerText(newData);
  const roleIcon = role === 'admin' ? '👑' : role === 'editor' ? '✏️' : '👤';
  const oldImgUrl = getFirstImageUrl(oldData);
  const newImgUrl = getFirstImageUrl(newData);

  let imgStatus = '';
  if (!oldImgUrl && newImgUrl) {
    imgStatus = '🟢 Thêm mới';
  } else if (oldImgUrl && !newImgUrl) {
    imgStatus = '🔴 Xóa bỏ';
  } else if (oldImgUrl && newImgUrl && oldImgUrl !== newImgUrl) {
    imgStatus = '🟡 Thay đổi';
  }

  await postDiscordEmbed({
    title: `${roleIcon} ${title || 'Yêu cầu sửa câu hỏi'}`,
    color: roleColor(role),
    description: `**Cần kiểm tra** từ ${discordText(profile?.full_name || authUser?.email)}\nVai trò: \`${role}\``,
    fields: [
      { name: 'Người gửi', value: discordText(profile?.full_name || authUser?.email), inline: true },
      { name: 'Vai trò', value: `\`${role}\``, inline: true },
      { name: 'Môn học', value: `\`${discordText(subjectCode, 'Chưa rõ', 50)}\``, inline: true },
      { name: 'Câu hỏi', value: `Câu ${discordText(questionNum, 'N/A', 10)}`, inline: true },
      ...(imgStatus ? [{ name: 'Trạng thái ảnh', value: imgStatus, inline: true }] : []),
      ...(oldImgUrl ? [{ name: 'Ảnh hiện tại', value: `[Xem ảnh](${oldImgUrl})`, inline: true }] : []),
      ...(newImgUrl ? [{ name: 'Ảnh đề xuất', value: `[Xem ảnh](${newImgUrl})`, inline: true }] : []),
      { name: 'Nội dung đề xuất', value: discordText(questionText, '*(Không có nội dung)*', 950), inline: false },
      ...(oldData || newData ? [
        { name: 'Đáp án hiện tại', value: discordText(oldAnswer, '*(Chưa có đáp án)*', 950), inline: false },
        { name: 'Đáp án đề xuất', value: discordText(newAnswer, '*(Chưa có đáp án)*', 950), inline: false }
      ] : []),
      ...(reason ? [{ name: 'Ghi chú', value: discordText(reason, '*(Không ghi chú)*', 900), inline: false }] : [])
    ],
    image: newImgUrl ? { url: newImgUrl } : undefined,
    footer: { text: `Learning Hub · Yêu cầu chỉnh sửa · ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}` },
    timestamp: new Date().toISOString()
  }, 'edit_request');
}

export async function handleEditRequests(req, authUser) {
  if (req.method !== 'POST') return json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' }, 405);
  const access = await checkUserAccess(authUser);
  if (!access.ok) return json({ error: access.error, code: access.code }, access.status);

  const body = await req.json();
  const profile = await loadProfileRow(authUser.id);
  const questionId = body.question_id || null;
  const questionNum = body.question_num || null;
  const subjectCode = body.subject_code || body.old_data?.subject_code || body.new_data?.subject_code || '';

  const pending = await db.execute({
    sql: `select id from edit_requests
          where user_id = ? and question_id is ? and subject_code = ? and status = 'pending'
          order by id desc limit 1`,
    args: [authUser.id, questionId, subjectCode]
  });
  const existingId = pending.rows?.[0]?.id;
  if (existingId) {
    await db.execute({
      sql: `update edit_requests
            set question_num = ?, user_email = ?, old_data = ?, new_data = ?, reason = ?, created_at = datetime('now')
            where id = ?`,
      args: [questionNum, authUser.email || '', JSON.stringify(body.old_data || {}), JSON.stringify(body.new_data || {}), body.reason || '', existingId]
    });
    await db.execute({
      sql: `delete from edit_requests
            where user_id = ? and question_id is ? and subject_code = ? and status = 'pending' and id <> ?`,
      args: [authUser.id, questionId, subjectCode, existingId]
    });
  } else {
    await db.execute({
      sql: `insert into edit_requests
            (question_id, question_num, subject_code, user_id, user_email, old_data, new_data, reason, status, created_at)
            values (?, ?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'))`,
      args: [questionId, questionNum, subjectCode, authUser.id, authUser.email || '', JSON.stringify(body.old_data || {}), JSON.stringify(body.new_data || {}), body.reason || '']
    });
  }
  await notifyQuestionChange({
    profile,
    authUser,
    title: existingId ? 'Yêu cầu sửa câu hỏi đã cập nhật' : 'Yêu cầu sửa câu hỏi mới',
    questionNum: questionNum || body.old_data?.num || body.new_data?.num,
    subjectCode,
    questionText: body.new_data?.question || body.old_data?.question,
    oldData: body.old_data,
    newData: body.new_data,
    reason: body.reason
  });
  return json({ ok: true, id: existingId || null, updated_existing: !!existingId });
}

export async function handleMyEditRequests(req, authUser) {
  if (req.method !== 'GET') return json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' }, 405);
  const access = await checkUserAccess(authUser);
  if (!access.ok) return json({ error: access.error, code: access.code }, access.status);
  const r = await db.execute({
    sql: `select e.id, e.question_id, e.question_num, e.subject_code, e.new_data, e.reason,
                 e.status, e.admin_note, e.created_at, e.reviewed_at
          from edit_requests e
          where e.user_id = ? and e.id in (
            select max(id) from edit_requests where user_id = ? group by question_id, subject_code
          )
          order by coalesce(e.reviewed_at, e.created_at) desc, e.id desc
          limit 100`,
    args: [authUser.id, authUser.id]
  });
  return json({ data: (r.rows || []).map(row => ({ ...row, new_data: parseJson(row.new_data, {}) })) });
}

export async function handleStaffEditRequests(req, authUser) {
  if (req.method !== 'GET') return json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' }, 405);
  const access = await checkUserAccess(authUser, 'staff');
  if (!access.ok) return json({ error: access.error, code: access.code }, access.status);
  const r = await db.execute({
    sql: `select id, question_id, question_num, subject_code, user_email, old_data, new_data, reason, status, created_at
          from edit_requests where status = 'pending' order by created_at desc, id desc limit 100`,
    args: []
  });
  return json({ data: (r.rows || []).map(row => ({ ...row, old_data: parseJson(row.old_data, {}), new_data: parseJson(row.new_data, {}) })) });
}
