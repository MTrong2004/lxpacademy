import { db, json } from '../lib/db.js';
import { isApprovedOrStaff } from '../lib/auth.js';

function parseJson(v, fallback) {
  if (v === null || v === undefined || v === '') return fallback;
  if (typeof v !== 'string') return v;
  try { return JSON.parse(v); } catch { return fallback; }
}

export async function handleQuestions(req, authUser, parsedUrl) {
  if (req.method !== 'GET') return json({ error: 'Method not allowed' }, 405);
  if (!await isApprovedOrStaff(authUser)) return json({ error: 'Tài khoản chưa được duyệt.' }, 403);

  const countOnly = parsedUrl.searchParams.get('count_only') === '1';
  if (countOnly) {
    const r = await db.execute({
      sql: `select upper(trim(subject_code)) as subject_code, count(*) as question_count
            from questions
            where coalesce(is_active, 1) = 1
            group by upper(trim(subject_code))
            order by upper(trim(subject_code)) asc`,
      args: []
    });
    return json({ data: (r.rows || []).map(row => ({
      subject_code: row.subject_code,
      question_count: Number(row.question_count || 0),
      count: Number(row.question_count || 0)
    })) });
  }

  const subject = (parsedUrl.searchParams.get('subject_code') || '').trim().toUpperCase();
  let sql = `select id, subject_code, num, question, options, answer, answer_text,
                    images, is_active, created_at, updated_at, has_image,
                    error_risk, error_risk_reason
             from questions
             where coalesce(is_active, 1) = 1`;
  const args = [];

  if (subject) {
    sql += ' and subject_code = ?';
    args.push(subject);
  }
  sql += ' order by subject_code asc, num asc';

  const r = await db.execute({ sql, args });
  return json({
    data: (r.rows || []).map(row => ({
      ...row,
      options: parseJson(row.options, {}),
      images: parseJson(row.images, []),
      is_active: row.is_active === 1 || row.is_active === true || row.is_active === '1',
      has_image: row.has_image === 1 || row.has_image === true || row.has_image === '1'
    }))
  });
}
