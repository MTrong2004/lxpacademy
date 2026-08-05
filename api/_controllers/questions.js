import { db, json } from '../_lib/db.js';
import { checkUserAccess } from '../_lib/auth.js';

function parseJson(v, fallback) {
  if (v === null || v === undefined || v === '') return fallback;
  if (typeof v !== 'string') return v;
  try { return JSON.parse(v); } catch { return fallback; }
}

// OPTIM_TURSO_READS_20260726: Cache questions server-side.
// Questions hiếm khi thay đổi, TTL 5 phút. Invalidate khi save/add/delete question.
const _questionsCache = new Map();
const _QUESTIONS_CACHE_TTL = 5 * 60 * 1000; // 5 phút

export function clearQuestionsCache(subjectCode) {
  if (subjectCode) {
    _questionsCache.delete(subjectCode.toUpperCase());
    _questionsCache.delete('__count_only__');
  } else {
    _questionsCache.clear();
  }
}

export async function handleQuestions(req, authUser, parsedUrl) {
  if (req.method !== 'GET') return json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' }, 405);
  const access = await checkUserAccess(authUser);
  if (!access.ok) return json({ error: access.error, code: access.code }, access.status);

  // QUESTIONS_FRESH_BYPASS_20260726: cache 5 phút ở trên chỉ được invalidate bởi
  // các action ghi qua /api/admin-action. Nếu DB bị sửa bằng đường khác (script
  // migration, sửa tay) thì client không có cách nào lấy bản mới trước khi TTL hết
  // — `cache: 'no-store'` và tham số ts chỉ bỏ qua cache của browser. fresh=1 cho
  // các lần tải chủ động (đổi môn, bấm reload câu) đọc thẳng Turso.
  const fresh = parsedUrl.searchParams.get('fresh') === '1';

  const countOnly = parsedUrl.searchParams.get('count_only') === '1';
  if (countOnly) {
    const cacheKey = '__count_only__';
    const cached = fresh ? null : _questionsCache.get(cacheKey);
    if (cached && Date.now() - cached.at < _QUESTIONS_CACHE_TTL) return json(cached.data);

    const r = await db.execute({
      sql: `select upper(trim(subject_code)) as subject_code, count(*) as question_count
            from questions
            where coalesce(is_active, 1) = 1
            group by upper(trim(subject_code))
            order by upper(trim(subject_code)) asc`,
      args: []
    });
    const data = { data: (r.rows || []).map(row => ({
      subject_code: row.subject_code,
      question_count: Number(row.question_count || 0),
      count: Number(row.question_count || 0)
    })) };
    _questionsCache.set(cacheKey, { data, at: Date.now() });
    return json(data);
  }

  const subject = (parsedUrl.searchParams.get('subject_code') || '').trim().toUpperCase();
  if (subject && !fresh) {
    const cached = _questionsCache.get(subject);
    if (cached && Date.now() - cached.at < _QUESTIONS_CACHE_TTL) return json(cached.data);
  }

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
  const data = {
    data: (r.rows || []).map(row => ({
      ...row,
      options: parseJson(row.options, {}),
      images: parseJson(row.images, []),
      is_active: row.is_active === 1 || row.is_active === true || row.is_active === '1',
      has_image: row.has_image === 1 || row.has_image === true || row.has_image === '1'
    }))
  };

  if (subject) {
    _questionsCache.set(subject, { data, at: Date.now() });
  }
  return json(data);
}
