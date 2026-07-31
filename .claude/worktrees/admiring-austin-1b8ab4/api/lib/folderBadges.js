/*
  SUBJECT_FOLDER_NEW_BADGE_20260729
  Cờ NEW của THƯ MỤC (mã gốc, ví dụ MLN122) là cờ RIÊNG — bật/tắt nó KHÔNG đụng tới cờ NEW
  của từng môn con (cờ đó nằm trong `subjects.cover`, xem set_subject_new_badge).

  Thư mục không phải một dòng trong bảng `subjects` (nó chỉ là cách gom môn cùng mã gốc), nên
  cờ lưu ở `site_settings` với key 'subject_folder_new_badges' = JSON mảng mã gốc ĐANG BẬT.
  Một dòng cho tất cả thư mục: đọc 1 query, ghi 1 query.
*/
import { db } from './db.js';

export const FOLDER_NEW_BADGE_KEY = 'subject_folder_new_badges';

function normalizeBase(base) {
  return String(base || '')
    .trim()
    .toUpperCase();
}

function parseList(raw) {
  let arr = raw;
  if (typeof raw === 'string') {
    try {
      arr = JSON.parse(raw || '[]');
    } catch (e) {
      arr = [];
    }
  }
  if (!Array.isArray(arr)) return [];
  return [...new Set(arr.map(normalizeBase).filter(Boolean))];
}

/** Mảng mã gốc đang bật NEW. Lỗi DB thì trả mảng rỗng (không được làm sập /api/subjects). */
export async function getFolderNewBadges() {
  try {
    const r = await db.execute({
      sql: 'select value from site_settings where key = ?',
      args: [FOLDER_NEW_BADGE_KEY]
    });
    return parseList(r.rows?.[0]?.value);
  } catch (e) {
    console.error('[folderBadges get]', e?.message || e);
    return [];
  }
}

/** Bật/tắt một thư mục, trả về danh sách mới. */
export async function setFolderNewBadge(base, enabled, userId) {
  const b = normalizeBase(base);
  if (!b) throw new Error('Thiếu mã gốc thư mục');
  const current = await getFolderNewBadges();
  const next = enabled ? [...new Set([...current, b])] : current.filter(x => x !== b);
  await db.execute({
    sql:
      'insert into site_settings (key, value, updated_at, updated_by) values (?, ?, ?, ?) ' +
      'on conflict(key) do update set value = excluded.value, updated_at = excluded.updated_at, updated_by = excluded.updated_by',
    args: [FOLDER_NEW_BADGE_KEY, JSON.stringify(next), new Date().toISOString(), userId || null]
  });
  return next;
}
