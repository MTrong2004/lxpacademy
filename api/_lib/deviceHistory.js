/*
  DEVICE_ID_AND_SUBJECT_PER_DEVICE_20260731
  Lịch sử thiết bị của một người dùng: cột `profiles.device_history`, JSON mảng
  các bản ghi { id, device, code, time } xếp mới nhất lên đầu, tối đa 30 dòng.

    id     ID trình duyệt do client sinh (localStorage, xem src/core/device.js).
           null với dữ liệu ghi trước 20260731 hoặc client chặn localStorage.
    device chuỗi mô tả để hiển thị, ví dụ "💻 Windows · Chrome".
    code   MÔN mà thiết bị đó đang học.
    time   ISO string lần ghi gần nhất.

  Vì sao cần `id`: bản cũ khử trùng lặp theo `device`, mà chuỗi đó chỉ có OS +
  trình duyệt — hai máy tính Windows/Chrome khác nhau của cùng một người gộp
  thành một dòng, và modal admin không có gì để in ngoài id TÀI KHOẢN (nên mọi
  dòng, kể cả điện thoại lẫn máy tính, hiện cùng một ID).

  Vì sao cần `code`: `profiles.current_subject` chỉ có MỘT ô, thiết bị nào POST
  sau thì thắng — điện thoại chỉ cần F5 là đè môn của máy tính, admin không thể
  biết mỗi thiết bị đang mở môn gì.

  Để ở lib/ (không import db) để test được bằng node, giống api/lib/folderBadges.js.
*/

/** ID do client gửi lên nên phải lọc: chỉ nhận chuỗi ngắn, ký tự an toàn. */
export function safeDeviceId(raw) {
  const s = String(raw || '').trim();
  return /^[A-Za-z0-9_-]{6,64}$/.test(s) ? s : null;
}

/**
 * Đưa thiết bị vừa gửi request lên đầu lịch sử.
 * Khớp theo `id` khi có; dòng cũ chưa có `id` thì khớp theo `device` như trước.
 * `code` rỗng (POST không kèm môn, ví dụ ping hoạt động) => giữ môn cũ CỦA CHÍNH
 * thiết bị đó, không lấy môn của thiết bị khác.
 */
export function touchDeviceHistory(history, { id, device, code, time }) {
  const list = Array.isArray(history) ? history.filter(x => x && typeof x === 'object') : [];
  const idx = id ? list.findIndex(x => x.id === id) : list.findIndex(x => !x.id && x.device === device);

  const item = idx >= 0 ? list.splice(idx, 1)[0] : {};
  list.unshift({
    id: id || item.id || null,
    device: device || item.device || 'Chưa rõ',
    code: code || item.code || null,
    time
  });

  const seen = new Set();
  const unique = [];
  for (const x of list) {
    const key = x.id ? 'id:' + x.id : 'dev:' + x.device;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(x);
  }
  return unique.slice(0, 30);
}
