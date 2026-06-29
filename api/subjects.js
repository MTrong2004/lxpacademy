import { db, json } from './_db.js';

export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'GET') return json({ error: 'Method not allowed' }, 405);

  try {
    const r = await db.execute({
      sql: `select id, code, name, description, cover, sort_order, is_active, created_at
            from subjects
            where coalesce(is_active, 1) = 1
            order by sort_order asc, code asc`
    });
    return json({ data: r.rows || [] });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}
