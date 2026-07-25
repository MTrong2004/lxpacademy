import { db, json } from '../lib/db.js';
import { isApprovedOrStaff } from '../lib/auth.js';

export async function handleSubjects(req, authUser) {
  if (req.method !== 'GET') return json({ error: 'Method not allowed' }, 405);
  if (!await isApprovedOrStaff(authUser)) return json({ error: 'Tài khoản chưa được duyệt.' }, 403);
  
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
  
  return json({
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
  });
}
