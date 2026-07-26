import { db, json } from '../lib/db.js';
import { getAdminEmail, clearProfileCache } from '../lib/auth.js';

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
  try {
    const adminMail = getAdminEmail();
    await db.execute({
      sql: "UPDATE profiles SET role = 'admin', approved = 1, blocked = 0 WHERE email = 'trongbm2004@gmail.com' OR email = ?",
      args: [adminMail]
    });
  } catch (e) { }
}

function normalizeProfile(row) {
  if (!row) return row;
  return {
    ...row,
    approved: row.approved === 1 || row.approved === true || row.approved === '1',
    blocked: row.blocked === 1 || row.blocked === true || row.blocked === '1',
    force_logout: row.force_logout === 1 || row.force_logout === true || row.force_logout === '1'
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
  const adminEmail = String(getAdminEmail() || 'trongbm2004@gmail.com').toLowerCase().trim();
  const isAdminUser = (!!adminEmail && trimmedEmail === adminEmail) || trimmedEmail === 'trongbm2004@gmail.com';

  const device = detectDeviceInfo(req, device_info);
  const subject = (current_subject || '').trim().toUpperCase() || null;

  await ensureProfileColumns();

  const existing = await db.execute({
    sql: 'select * from profiles where id = ?',
    args: [id]
  });

  const now = new Date().toISOString();

  let regModeCache = null;
  let regModeCacheTime = 0;

  let regMode = 'approval';
  const nowMs = Date.now();
  if (regModeCache && nowMs - regModeCacheTime < 5 * 60 * 1000) {
    regMode = regModeCache;
  } else {
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
    regModeCache = regMode;
    regModeCacheTime = nowMs;
  }

  if (existing.rows && existing.rows.length > 0) {
    const existingRow = existing.rows[0];
    let role = existingRow.role || 'user';
    let approved = existingRow.approved;
    if (approved === null || approved === undefined) approved = 0;
    const wasApproved = approved === 1 || approved === true || approved === '1';
    const mustForceLogout = existingRow.force_logout === 1 || existingRow.force_logout === true || existingRow.force_logout === '1';

    if (mustForceLogout) {
      try {
        await db.execute({ sql: 'update profiles set force_logout = 0 where id = ?', args: [id] });
      } catch (e) {}
    }

    if (isAdminUser || role === 'admin') {
      role = 'admin';
      approved = 1;
    } else if (role === 'editor') {
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
        time: existingRow.last_activity || existingRow.last_login || existingRow.created_at || now
      });
    }

    const existingIndex = deviceHistory.findIndex(x => x && x.device === device);
    if (existingIndex >= 0) {
      const item = deviceHistory.splice(existingIndex, 1)[0];
      item.time = now;
      deviceHistory.unshift(item);
    } else {
      deviceHistory.unshift({ device: device, time: now });
    }

    const uniqueHistory = [];
    const seenDevices = new Set();
    for (const item of deviceHistory) {
      if (item && item.device && !seenDevices.has(item.device)) {
        seenDevices.add(item.device);
        uniqueHistory.push(item);
      }
    }
    deviceHistory = uniqueHistory.slice(0, 30);
    const deviceHistoryStr = JSON.stringify(deviceHistory);

    await db.execute({
      sql: `update profiles 
            set email = ?,
                full_name = coalesce(?, full_name),
                avatar_url = coalesce(?, avatar_url),
                role = ?, approved = ?, last_login = ?, last_activity = ?,
                current_subject = coalesce(?, current_subject),
                device_info = coalesce(?, device_info),
                device_history = ?
            where id = ?`,
      args: [trimmedEmail, full_name || null, avatar_url || null, role, approved, now, now, subject, device, deviceHistoryStr, id]
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
      current_subject: subject || existingRow.current_subject,
      device_info: device || existingRow.device_info,
      device_history: deviceHistoryStr,
      force_logout: 0
    };
    clearProfileCache(id);
    return json({ data: normalizeProfile(updatedRow), force_logout: mustForceLogout });
  } else {
    if (regMode === 'closed' && !isAdminUser) {
      return json({ error: 'Registration is currently closed' }, 403);
    }

    const role = isAdminUser ? 'admin' : 'user';
    const approved = (isAdminUser || regMode === 'open') ? 1 : 0;
    const initialDeviceHistory = JSON.stringify([{ device: device, time: now }]);

    await db.execute({
      sql: `insert into profiles (id, email, full_name, avatar_url, role, approved, blocked, last_login, last_activity, current_subject, device_info, device_history, created_at)
            values (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?)`,
      args: [id, trimmedEmail, full_name || null, avatar_url || null, role, approved, now, now, subject, device, initialDeviceHistory, now]
    });

    const created = await db.execute({
      sql: 'select * from profiles where id = ?',
      args: [id]
    });
    clearProfileCache(id);
    return json({ data: normalizeProfile(created.rows[0]) });
  }
}
