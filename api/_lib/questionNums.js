/*
  IMPORT_QUALITY_GATE_20260805 — quyết định `questions.num` khi nhập một môn mới.

  Trước đây `add_subject` và `approve_subject_request` đều làm `let currentNum = 1; ... currentNum++`,
  tức là NÉM BỎ hoàn toàn `num` do file import mang tới. Hậu quả nhìn thấy được: prompt chuyển đổi
  câu hỏi đánh biến thể "Kiểu hỏi khác" là "1.1" đứng ngay sau câu gốc 1, nhưng sau khi lưu thì
  biến thể thành câu 2 và câu gốc số 2 bị dồn thành câu 3 — số câu trong app không còn khớp với
  số câu trong tài liệu gốc, người học báo lỗi "câu 5 sai" mà admin mở ra lại là câu khác.

  Nay num của file được TÔN TRỌNG:
    · số nguyên  -> giữ nguyên (1, 2, 3…)
    · "1.1"      -> lưu 1.1. Cột là `num integer` nhưng SQLite dùng type affinity: 1.1 không đổi
                    sang integer mà không mất dữ liệu nên được giữ REAL. `order by num asc` vẫn ra
                    đúng 1, 1.1, 1.2, 2 và `unique(subject_code, num)` vẫn phân biệt 1 với 1.1.
    · thiếu/rác/trùng -> cấp số nguyên còn trống nhỏ nhất (không làm vỡ ràng buộc unique).

  Không import `db` nên test được bằng node như folderBadges.js / deviceHistory.js:
    node -e "import('./api/lib/questionNums.js').then(m=>console.log(m.resolveImportNums([{num:1},{num:'1.1'},{num:2},{}])))"
*/

/** Đọc num thô -> { kind:'main'|'variant'|'invalid', value } (khớp parseImportNum của client). */
export function parseNum(raw) {
  if (raw === null || raw === undefined) return { kind: 'invalid', value: null };
  const s = String(raw).trim();
  if (!s) return { kind: 'invalid', value: null };

  let m = s.match(/^(\d+)$/);
  if (m) {
    const n = Number(m[1]);
    return n >= 1 ? { kind: 'main', value: n } : { kind: 'invalid', value: null };
  }

  m = s.match(/^(\d+)[.\-](\d+)$/);
  if (m) {
    const parent = Number(m[1]);
    const seq = Number(m[2]);
    if (parent < 1 || seq < 1 || seq > 99) return { kind: 'invalid', value: null };
    // Giữ đúng chữ số người đọc thấy: "1.1" -> 1.1 để app in ra "Câu 1.1", không phải "Câu 1.01".
    // Đổi lại "1.10" cũng ra 1.1 và trùng với "1.1"; ca đó (một câu gốc có hơn 9 biến thể) để
    // resolveImportNums xử lý như num trùng, tức cấp một số nguyên còn trống.
    return { kind: 'variant', value: Number(parent + '.' + seq) };
  }
  return { kind: 'invalid', value: null };
}

/**
 * Tính num cuối cùng cho từng câu trong danh sách nhập.
 * @param {Array} questions
 * @returns {number[]} cùng độ dài với `questions`
 */
export function resolveImportNums(questions) {
  const list = Array.isArray(questions) ? questions : [];
  const used = new Set();
  const out = new Array(list.length).fill(null);

  // Lượt 1: nhận các num hợp lệ và chưa trùng.
  list.forEach((q, i) => {
    const info = parseNum(q?.num);
    if (info.kind === 'invalid') return;
    if (used.has(info.value)) return;
    used.add(info.value);
    out[i] = info.value;
  });

  // Lượt 2: các câu còn lại nhận số nguyên trống nhỏ nhất.
  let next = 1;
  for (let i = 0; i < out.length; i++) {
    if (out[i] !== null) continue;
    while (used.has(next)) next++;
    used.add(next);
    out[i] = next;
    next++;
  }

  return out;
}
