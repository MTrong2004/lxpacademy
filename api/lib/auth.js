import { db, cleanStr } from './db.js';

export function getAdminEmail() {
  const envEmail = cleanStr(process.env.ADMIN_EMAIL).toLowerCase().trim();
  return envEmail || 'trongbm2004@gmail.com';
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

// OPTIM_TURSO_READS_20260726: Cache profile lookups để tránh query mỗi API request.
// TTL 5 phút, invalidate khi profile bị update (handleProfile gọi clearProfileCache).
const _profileCache = new Map();
const _PROFILE_CACHE_TTL = 5 * 60 * 1000; // 5 phút

export function clearProfileCache(id) {
  if (id) _profileCache.delete(id);
  else _profileCache.clear();
}

export async function loadProfileRow(id) {
  try {
    const cached = _profileCache.get(id);
    if (cached && Date.now() - cached.at < _PROFILE_CACHE_TTL) return cached.row;
    const r = await db.execute({ sql: 'select * from profiles where id = ?', args: [id] });
    const row = r.rows?.[0] || null;
    _profileCache.set(id, { row, at: Date.now() });
    return row;
  } catch (e) { return null; }
}

export async function isApprovedOrStaff(authUser) {
  const adminEmail = getAdminEmail();
  if (adminEmail && authUser.email === adminEmail) return true;
  const p = await loadProfileRow(authUser.id);
  if (!p) return false;
  const blocked = p.blocked === 1 || p.blocked === true;
  if (blocked) return false;
  const approved = p.approved === 1 || p.approved === true;
  const staff = ['admin', 'editor'].includes(p.role);
  return approved || staff;
}

export async function isStaff(authUser) {
  const adminEmail = getAdminEmail();
  if (adminEmail && authUser.email === adminEmail) return true;
  const p = await loadProfileRow(authUser.id);
  if (!p) return false;
  const blocked = p.blocked === 1 || p.blocked === true;
  if (blocked) return false;
  return ['admin', 'editor'].includes(p.role);
}

export function roleColor(role) {
  if (role === 'admin') return 15158332;
  if (role === 'editor') return 3447003;
  return 3066897;
}
