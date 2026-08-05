/*
  BOOKMARK_SYNC_PER_PART_20260806 — "Lưu câu 🔖" đồng bộ giữa máy tính và điện thoại.

  Trước đây tính năng này chỉ có localStorage: mở web ở điện thoại là danh sách trống, và
  khoá `lh_starred_v1_backup_all` (ghi đè bằng danh sách của môn đang mở rồi hợp vào MỌI
  môn khi đọc) làm các học phần cùng nhìn thấy bookmark của nhau.

  Endpoint này là nguồn thật; localStorage tụt xuống vai bản đệm để mất mạng vẫn xem được.

  · GET  /api/bookmarks              -> { data: { "MLN122": ["num_5"], "MLN122_2": [...] } }
  · POST /api/bookmarks {subject_code, q_key, on}   -> bật/tắt một câu
  · POST /api/bookmarks {merge: {MÃ: [q_key…]}}     -> đẩy dữ liệu localStorage cũ lên (một lần)

  Ghi theo (user_id, subject_code, q_key) nên MỖI HỌC PHẦN có danh sách riêng — đó là ranh
  giới của tính năng, đừng gộp theo mã gốc.
*/

import { db, json } from '../lib/db.js';
import { checkUserAccess } from '../lib/auth.js';

// Chặn payload rác: đủ rộng cho `q_<40 ký tự đầu của đề bài>` mà không cho ghi cả bài văn.
const MAX_KEY_LEN = 120;
const MAX_CODE_LEN = 40;
// Một người lưu vài trăm câu là bình thường; mốc này chỉ để một lần `merge` không ghi vô hạn.
const MAX_MERGE_ROWS = 2000;

function cleanCode(v) {
  return String(v ?? '')
    .trim()
    .toUpperCase()
    .slice(0, MAX_CODE_LEN);
}

function cleanKey(v) {
  return String(v ?? '')
    .trim()
    .slice(0, MAX_KEY_LEN);
}

export async function handleBookmarks(req, authUser) {
  const access = await checkUserAccess(authUser);
  if (!access.ok) return json({ error: access.error, code: access.code }, access.status);
  const userId = authUser.id;

  if (req.method === 'GET') {
    const r = await db.execute({
      sql: 'select subject_code, q_key from bookmarks where user_id = ?',
      args: [userId]
    });
    const map = {};
    for (const row of r.rows || []) {
      const code = cleanCode(row.subject_code);
      if (!code) continue;
      (map[code] = map[code] || []).push(String(row.q_key));
    }
    return json({ data: map });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' }, 405);
  }

  const body = await req.json().catch(() => ({}));

  /*
    Nhánh `merge`: chỉ chạy MỘT LẦN cho mỗi thiết bị (client tự nhớ bằng
    `learninghub_bookmarks_pushed_v1`). Cố ý chỉ THÊM, không xoá: thiết bị cũ có thể giữ
    bookmark mà server chưa biết, còn "bỏ lưu" luôn đi qua nhánh dưới nên không mất.
  */
  if (body.merge && typeof body.merge === 'object') {
    const rows = [];
    for (const [rawCode, keys] of Object.entries(body.merge)) {
      const code = cleanCode(rawCode);
      if (!code || !Array.isArray(keys)) continue;
      for (const rawKey of keys) {
        const key = cleanKey(rawKey);
        if (!key) continue;
        rows.push([userId, code, key]);
        if (rows.length >= MAX_MERGE_ROWS) break;
      }
      if (rows.length >= MAX_MERGE_ROWS) break;
    }
    if (rows.length) {
      // Một batch cho tất cả: 300 câu cũ = 1 round-trip, không phải 300.
      await db.batch(
        rows.map(args => ({
          sql: 'insert or ignore into bookmarks (user_id, subject_code, q_key) values (?, ?, ?)',
          args
        })),
        'write'
      );
    }
    return json({ ok: true, merged: rows.length });
  }

  const code = cleanCode(body.subject_code);
  const key = cleanKey(body.q_key);
  if (!code || !key) {
    return json({ error: 'Thiếu mã môn hoặc mã câu', code: 'BAD_REQUEST' }, 400);
  }

  if (body.on === false) {
    await db.execute({
      sql: 'delete from bookmarks where user_id = ? and subject_code = ? and q_key = ?',
      args: [userId, code, key]
    });
    return json({ ok: true, on: false });
  }

  await db.execute({
    sql: 'insert or ignore into bookmarks (user_id, subject_code, q_key) values (?, ?, ?)',
    args: [userId, code, key]
  });
  return json({ ok: true, on: true });
}
