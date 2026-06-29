import { db, json } from './_db.js';

export default async function handler() {
  try {
    const r = await db.execute('select 1 as ok');
    return json({ ok: true, db: r.rows?.[0]?.ok === 1 });
  } catch (e) {
    return json({ ok: false, error: e.message }, 500);
  }
}
