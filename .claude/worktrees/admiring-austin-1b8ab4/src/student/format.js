/**
 * Hàm THUẦN (không đọc DOM, không đụng state) dùng chung giữa appCore.js và các file tính
 * năng tách ra theo docs/SPLIT_PLAN.md.
 *
 * Trước đây nằm trong appCore: `sortAns` / `answerText` / `finalAnswerText` / `clone` ở
 * block `merged_app_logic` (~dòng 320–336 và 261), `fmt` ở vùng ngoài block (~536).
 *
 * Vì sao import tĩnh mà không phải `window.*` như phần lớn hàm dùng chung khác: bốn
 * hàm này chỉ được khai báo MỘT lần trong cả appCore, không block nào ghi đè, nên
 * không có chuyện "bản nào đang chạy" — lấy bản import là đúng bản duy nhất.
 * (`answerText` và `finalAnswerText` còn được khai báo lại BÊN TRONG hai block IIFE
 * ở appCore — đó là biến local của block, che khuất bản này y như trước khi tách.)
 */

/** 'CA' -> 'AC' — so đáp án nhiều lựa chọn không phụ thuộc thứ tự nhập. */
export function sortAns(s) {
  return (s || '').split('').sort().join('');
}

/** 'A' -> 'A. nội dung A' ; 'AC' -> 'A. … ; C. …' */
export function answerText(c) {
  return (c.answer || '')
    .split('')
    .map(ch => ch + '. ' + (c.options?.[ch] || ''))
    .join('; ');
}

/**
 * Lời giải để hiển thị: ưu tiên `answer_text` do người soạn viết, nhưng nếu nó chỉ là
 * chuỗi chữ cái đáp án (hoặc trùng `answer`) thì coi như chưa có giải thích -> dựng lại
 * từ danh sách lựa chọn.
 */
export function finalAnswerText(c) {
  const raw = String(c?.answer_text ?? '').trim();
  const ans = String(c?.answer ?? '')
    .trim()
    .toUpperCase();
  if (!raw || raw.toUpperCase() === ans || /^[A-E]+$/i.test(raw)) return answerText(c);
  return raw;
}

/**
 * Escape 4 ký tự HTML. Nhiều block trong appCore tự khai báo `const esc` riêng (có bản
 * escape cả dấu nháy đơn) — những bản đó là biến local của block, không liên quan bản này.
 */
export function esc(s) {
  return String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
}

/** Bản sao sâu bằng JSON — chỉ dùng cho dữ liệu câu hỏi (thuần JSON, không hàm/Date). */
export function clone(x) {
  return JSON.parse(JSON.stringify(x));
}

/** Số ms -> 'mm:ss' (đồng hồ bài kiểm tra). */
export function fmt(ms) {
  let s = Math.floor(ms / 1000),
    m = Math.floor(s / 60);
  s %= 60;
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}
