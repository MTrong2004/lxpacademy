import { db, json } from '../_lib/db.js';
import { checkUserAccess } from '../_lib/auth.js';
import { getFolderNewBadges } from '../_lib/folderBadges.js';

// OPTIM_TURSO_READS_20260726: Cache subjects query server-side.
// Query này JOIN questions (full table scan) nên rất tốn reads.
// TTL 5 phút. Invalidate khi add/delete subject hoặc thay đổi questions.
let _subjectsCache = null;
let _subjectsCacheAt = 0;
const _SUBJECTS_CACHE_TTL = 5 * 60 * 1000; // 5 phút

export function clearSubjectsCache() {
  _subjectsCache = null;
  _subjectsCacheAt = 0;
}

export async function handleSubjects(req, authUser) {
  if (req.method !== 'GET') return json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' }, 405);
  const access = await checkUserAccess(authUser);
  if (!access.ok) return json({ error: access.error, code: access.code }, access.status);

  if (_subjectsCache && Date.now() - _subjectsCacheAt < _SUBJECTS_CACHE_TTL) {
    return json(_subjectsCache);
  }
  
  const r = await db.execute({
    sql: `select s.id, s.code, s.name, s.description, s.cover, s.sort_order, s.is_active, s.created_at,
                 coalesce(q.question_count, 0) as question_count
          from subjects s
          left join (
            select upper(trim(subject_code)) as subject_code, count(*) as question_count
            from questions
            where coalesce(is_active, 1) = 1
            group by upper(trim(subject_code))
          ) q on q.subject_code = upper(trim(s.code))
          where coalesce(s.is_active, 1) = 1
          order by s.sort_order asc, s.code asc`
  });
  
  // SUBJECT_FOLDER_NEW_BADGE_20260729: cờ NEW của thư mục là cờ riêng, không suy ra từ môn con.
  const folder_new_badges = await getFolderNewBadges();

  const data = {
    folder_new_badges,
    data: (r.rows || []).map(row => {
      const n = Number(row.question_count || 0);
      return {
        ...row,
        sort_order: Number(row.sort_order || 0),
        is_active: row.is_active === 1 || row.is_active === true || row.is_active === '1',
        question_count: n,
        questions_count: n,
        count: n
      };
    })
  };

  _subjectsCache = data;
  _subjectsCacheAt = Date.now();
  return json(data);
}
