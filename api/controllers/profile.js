import { db, json } from '../lib/db.js';
import { getAdminEmail } from '../lib/auth.js';

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
}

function normalizeProfile(row) {
  if (!row) return row;
  return {
    ...row,
    approved: row.approved === 1 || row.approved === true || row.approved === '1',
    blocked: row.blocked === 1 || row.blocked === true || row.blocked === '1'
  };
}

export async function handleProfile(req, authUser) {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const body = await req.json();
  const { full_name, avatar_url, current_subject, device_info } = body;
  const id = authUser.id;
  const email = authUser.email || String(body.email || '').toLowerCase().trim();
  if (!id || !email) {
    return json({ error: 'Missing id or email' }, 400);
  }

  const trimmedEmail = email.toLowerCase().trim();
  const adminEmail = String(getAdminEmail() || '').toLowerCase().trim();
  const isAdminUser = !!adminEmail && trimmedEmail === adminEmail;

  const device = detectDeviceInfo(req, device_info);
  const subject = (current_subject || '').trim().toUpperCase() || null;

  await ensureProfileColumns();

  const existing = await db.execute({
    sql: 'select * from profiles where id = ?',
    args: [id]
  });

  const now = new Date().toISOString();

  let regMode = 'approval';
  try {
    const setting = await db.execute({
      sql: "select value from site_settings where key = 'registration_mode'",
      args: []
    });
    if (setting.rows && setting.rows[0]) {
      const val = setting.rows[0].value;
      regMode = typeof val === 'string' ? val.replace(/"/g, '') : String(val);
    }
  } catch (e) {
    console.warn('Cannot read registration_mode setting, default to approval:', e);
  }

  if (existing.rows && existing.rows.length > 0) {
    let role = existing.rows[0].role || 'user';
    let approved = existing.rows[0].approved;
    if (approved === null || approved === undefined) approved = 0;
    const wasApproved = approved === 1 || approved === true || approved === '1';

    if (isAdminUser) {
      role = 'admin';
      approved = 1;
    } else if (regMode === 'open' && !wasApproved) {
      approved = 1;
    }

    await db.execute({
      sql: `update profiles 
            set email = ?,
                full_name = coalesce(?, full_name),
                avatar_url = coalesce(?, avatar_url),
                role = ?, approved = ?, last_login = ?, last_activity = ?,
                current_subject = coalesce(?, current_subject),
                device_info = coalesce(?, device_info)
            where id = ?`,
      args: [trimmedEmail, full_name || null, avatar_url || null, role, approved, now, now, subject, device, id]
    });

    const updated = await db.execute({
      sql: 'select * from profiles where id = ?',
      args: [id]
    });
    return json({ data: normalizeProfile(updated.rows[0]) });
  } else {
    if (regMode === 'closed' && !isAdminUser) {
      return json({ error: 'Registration is currently closed' }, 403);
    }

    const role = isAdminUser ? 'admin' : 'user';
    const approved = (isAdminUser || regMode === 'open') ? 1 : 0;

    await db.execute({
      sql: `insert into profiles (id, email, full_name, avatar_url, role, approved, blocked, last_login, last_activity, current_subject, device_info, created_at)
            values (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?)`,
      args: [id, trimmedEmail, full_name || null, avatar_url || null, role, approved, now, now, subject, device, now]
    });

    const created = await db.execute({
      sql: 'select * from profiles where id = ?',
      args: [id]
    });
    return json({ data: normalizeProfile(created.rows[0]) });
  }
}
