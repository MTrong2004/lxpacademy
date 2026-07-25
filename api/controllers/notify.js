import { db, json } from '../lib/db.js';
import { roleColor, getAdminEmail } from '../lib/auth.js';

async function postDiscordEmbed(embed) {
  const webhookUrl = (process.env.DISCORD_WEBHOOK_URL || '').trim().replace(/(^['"]|['"]$)/g, '');
  if (!webhookUrl) return;
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] })
    });
  } catch (e) {
    console.warn('Discord notify failed:', e);
  }
}

export async function handleNotify(req, authUser) {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const body = await req.json();
  const { kind } = body;
  const user_id = authUser.id;
  const email = authUser.email;
  if (!user_id || !email) return json({ error: 'Missing user_id or email' }, 400);

  const userRes = await db.execute({ sql: 'select * from profiles where id = ?', args: [user_id] });
  const profile = userRes.rows?.[0];
  if (!profile || String(profile.email || '').toLowerCase().trim() !== String(email).toLowerCase().trim()) {
    return json({ error: 'Unauthorized' }, 403);
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
    });
    return json({ ok: true });
  }

  if (kind === 'action') {
    const isBlocked = profile.blocked === 1 || profile.blocked === true;
    const isApproved = profile.approved === 1 || profile.approved === true;
    const isEditorOrAdmin = ['admin', 'editor'].includes(role);
    const adminEmail = getAdminEmail();
    const isConfiguredAdmin = !!adminEmail && String(profile.email || '').toLowerCase().trim() === adminEmail;
    if (!isConfiguredAdmin && !(isApproved && !isBlocked && isEditorOrAdmin)) {
      return json({ error: 'Unauthorized' }, 403);
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
    });
    return json({ ok: true });
  }

  return json({ error: 'Invalid kind' }, 400);
}
