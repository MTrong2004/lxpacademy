import { json } from '../lib/db.js';
import { roleColor, getAdminEmail, checkUserAccess } from '../lib/auth.js';
// DISCORD_NOTIFICATION_TOGGLES_20260729: dùng bản chung ở api/lib/discord.js — nó tự kiểm
// tra loại thông báo có đang bật hay không. Đừng gọi webhook trực tiếp ở đây nữa.
import { postDiscordEmbed } from '../lib/discord.js';

export async function handleNotify(req, authUser) {
  if (req.method !== 'POST') return json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' }, 405);
  const access = await checkUserAccess(authUser);
  if (!access.ok) return json({ error: access.error, code: access.code }, access.status);

  const body = await req.json();
  const { kind } = body;
  const user_id = authUser.id;
  const email = authUser.email;
  if (!user_id || !email) return json({ error: 'Thiếu thông tin người dùng', code: 'BAD_REQUEST' }, 400);

  // X: dùng lại profile mà checkUserAccess đã đọc (cache 10s) thay vì
  // `select * from profiles` lần thứ hai cho cùng một request.
  const profile = access.profile;
  if (String(profile.email || '').toLowerCase().trim() !== String(email).toLowerCase().trim()) {
    return json({ error: 'Phiên đăng nhập không hợp lệ', code: 'UNAUTHORIZED' }, 401);
  }
  const role = profile.role || 'user';

  if (kind === 'login') {
    const roleIcon = role === 'admin' ? '👑' : role === 'editor' ? '✏️' : '👤';
    await postDiscordEmbed({
      title: `${roleIcon} ĐĂNG NHẬP | ${role.toUpperCase()}`,
      color: roleColor(role),
      description: `Email: **${email}**`,
      fields: [
        { name: 'Tài khoản', value: email, inline: true },
        { name: 'Vai trò', value: `\`${role}\``, inline: true },
        { name: 'Từ', value: body.source === 'admin' ? 'Admin' : 'Web học', inline: true },
        { name: 'Thời gian', value: new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }), inline: false }
      ],
      footer: { text: 'Learning Hub · Đăng nhập hệ thống' },
      timestamp: new Date().toISOString()
    }, 'login');
    return json({ ok: true });
  }

  if (kind === 'action') {
    // approved/blocked đã được checkUserAccess() xác minh, ở đây chỉ còn vai trò.
    const isEditorOrAdmin = ['admin', 'editor'].includes(role);
    const adminEmail = getAdminEmail();
    const isConfiguredAdmin = !!adminEmail && String(profile.email || '').toLowerCase().trim() === adminEmail;
    if (!isConfiguredAdmin && !isEditorOrAdmin) {
      return json({ error: 'Bạn không có quyền thực hiện thao tác này', code: 'INSUFFICIENT_ROLE' }, 403);
    }

    const { action_name, target_type, target_id } = body;
    const roleIcon = role === 'admin' ? '👑' : role === 'editor' ? '✏️' : '👤';
    await postDiscordEmbed({
      title: `${roleIcon} HÀNH ĐỘNG: ${String(action_name || '').toUpperCase()}`,
      color: roleColor(role),
      description: `Người thực hiện: **${email}** | Vai trò: \`${role}\``,
      fields: [
        { name: 'Loại đối tượng', value: `\`${target_type || 'N/A'}\``, inline: true },
        { name: 'ID', value: `\`${target_id || 'N/A'}\``, inline: true },
        { name: 'Thời gian', value: new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }), inline: false }
      ],
      footer: { text: 'Learning Hub · Hệ thống hành động' },
      timestamp: new Date().toISOString()
    }, 'action');
    return json({ ok: true });
  }

  return json({ error: 'Loại thông báo không hợp lệ', code: 'BAD_REQUEST' }, 400);
}
