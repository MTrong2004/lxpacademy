import { db, json } from '../lib/db.js';

export async function handleSettings(req) {
  if (req.method !== 'GET') return json({ error: 'Method not allowed' }, 405);
  let registration_mode = 'approval';
  try {
    const r = await db.execute({ sql: "select value from site_settings where key = 'registration_mode'", args: [] });
    if (r.rows && r.rows[0]) {
      const v = r.rows[0].value;
      registration_mode = (typeof v === 'string' ? v.replace(/"/g, '') : String(v)) || 'approval';
    }
  } catch (e) { /* default approval */ }
  return json({ registration_mode });
}
