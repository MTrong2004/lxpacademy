import { db, json } from '../lib/db.js';

export async function handleSettings(req) {
  if (req.method !== 'GET') return json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' }, 405);
  let registration_mode = 'approval';
  let add_subject_ai_prompt = '';
  let release_notes_enabled = false;
  let release_notes_content = '';
  try {
    const r = await db.execute({ sql: "select key, value from site_settings where key in ('registration_mode', 'add_subject_ai_prompt', 'release_notes_enabled', 'release_notes_content')", args: [] });
    if (r.rows) {
      r.rows.forEach(row => {
        const k = row.key;
        const v = row.value;
        const strVal = typeof v === 'string' ? v.replace(/^"+|"+$/g, '') : String(v || '');
        if (k === 'registration_mode') registration_mode = strVal || 'approval';
        if (k === 'add_subject_ai_prompt') add_subject_ai_prompt = strVal || '';
        if (k === 'release_notes_enabled') release_notes_enabled = strVal === 'true';
        if (k === 'release_notes_content') release_notes_content = strVal || '';
      });
    }
  } catch (e) {
    console.error('[API /api/settings error]', e?.message || e);
  }
  return json({
    registration_mode,
    add_subject_ai_prompt,
    release_notes: {
      enabled: release_notes_enabled,
      content: release_notes_content
    }
  });
}
