/**
 * IMPORT_SCHEMA_EXPORT_20260806 — một nguồn duy nhất để đưa câu hỏi VỀ đúng schema JSON của
 * `src/student/importPrompt.js`, dùng cho hai chỗ XUẤT file:
 *
 *   1. Web học, tab "Thêm môn mới": nút "⬇ Xuất JSON" của bảng chấm điểm — xuất đúng thứ mà
 *      parser PDF/Word (`docExtract.js`) vừa đọc được, để đem đi kiểm tra / sửa tay / nhập lại.
 *   2. Trang admin, "Xuất dữ liệu": xuất câu hỏi đang có trong Turso về dạng file import.
 *
 * Vì vậy phải là **hàm thuần** (không đụng DOM, không đụng window) và nằm ở `src/core/` — cả hai
 * bundle `app.js` và `admin.js` đều import được, không phải viết hai bản rồi lệch nhau.
 *
 * Hai dạng đầu vào, cùng ra một dạng:
 * - bản đã qua `normalizeImportedQuestions()` của client: `answer` là CHUỖI ("B" / "AC"), có thêm
 *   `answer_unknown`, `error_risk_reason`, `answer_text` — đều là trường phụ, không thuộc schema.
 * - dòng của bảng `questions` (Turso, qua `/api/questions`): thêm `id`, `subject_code`,
 *   `created_at`, `hidden`… cũng không thuộc schema.
 *
 * Ràng buộc cố ý:
 * - **`answer` trả lại thành ARRAY nhãn** (schema yêu cầu array; DB và client giữ chuỗi).
 * - **`answer_unknown` được GỘP LẠI vào `answer`.** Nhãn đó là nhãn có trong tài liệu gốc mà
 *   không có trong `options` — bỏ đi thì file xuất ra "sạch" hơn dữ liệu thật và nhập lại sẽ
 *   được chấm 0,5 điểm ("quên đáp án") thay vì chặn cứng ("đáp án trỏ sai"). Giữ lại thì
 *   xuất → nhập lại cho ra ĐÚNG một điểm số, tức file xuất ra dùng để kiểm tra được.
 * - **`num` rỗng thì BỎ HẲN khoá đó**, không ghi `null`: `IMPORT_NUM_BLANK_OK_20260805` —
 *   thiếu `num` là chuyện thường và cả hai chốt lưu tự đánh số.
 */

const RISKS = ['low', 'medium', 'high'];

/** Nhãn đáp án của một câu, theo thứ tự xuất hiện, không trùng. Gộp cả `answer_unknown`. */
function answerLabels(q) {
  const raw = Array.isArray(q.answer) ? q.answer.join('') : String(q.answer ?? '');
  const letters = (raw + String(q.answer_unknown ?? '')).toUpperCase().replace(/[^A-Z]/g, '');
  const out = [];
  for (const ch of letters) if (!out.includes(ch)) out.push(ch);
  return out;
}

/** Một câu → đúng 7 khoá của schema, thứ tự khoá cố định cho dễ đọc / dễ diff. */
export function toImportSchemaQuestion(q) {
  const src = q && typeof q === 'object' ? q : {};

  const rawOptions = src.options && typeof src.options === 'object' && !Array.isArray(src.options) ? src.options : {};
  const options = {};
  Object.keys(rawOptions)
    .map(k => String(k).trim().toUpperCase())
    .sort()
    .forEach(k => {
      const v = rawOptions[k] ?? rawOptions[k.toLowerCase()];
      options[k] = String(v ?? '').trim();
    });

  const images = Array.isArray(src.images) ? src.images.map(x => String(x ?? '')).filter(Boolean) : [];
  const risk = String(src.error_risk || '').toLowerCase();

  const out = {};
  // `num` chỉ ghi khi thật sự có (số nguyên hoặc biến thể "1.1").
  if (src.num !== null && src.num !== undefined && String(src.num).trim() !== '') out.num = src.num;
  out.question = String(src.question ?? '').trim();
  out.options = options;
  out.answer = answerLabels(src);
  out.images = images;
  out.has_image = !!src.has_image || images.length > 0;
  out.error_risk = RISKS.includes(risk) ? risk : 'low';
  return out;
}

/** Danh sách câu → chuỗi JSON (array) sẵn sàng ghi ra file, đúng thứ tự trong danh sách. */
export function questionsToImportJson(list) {
  const arr = Array.isArray(list) ? list : [];
  return JSON.stringify(arr.map(toImportSchemaQuestion), null, 2);
}

/** Tên file gợi ý: `<mã môn>_questions.json`, khớp mục ĐẦU RA của prompt. */
export function importJsonFileName(code) {
  const safe =
    String(code || '')
      .trim()
      .replace(/[^a-z0-9_.-]+/gi, '_')
      .replace(/^_+|_+$/g, '') || 'questions';
  return safe + '_questions.json';
}
