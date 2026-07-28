/**
 * State dùng chung của app học sinh.
 *
 * Trước đây là 20 biến `let` ở đầu appCore.js (dòng 305–322). Module ES không cho gán
 * vào binding import từ file khác, nên chừng nào chúng còn là `let` trong appCore thì
 * không tách nổi block nào GHI vào chúng — mà đó đúng là các block lõi của
 * library / exam / editor / images (xem docs/SPLIT_PLAN.md).
 *
 * Gói trong một object để mọi file tách ra dùng CÙNG một tham chiếu:
 *   import { LHState } from './state.js';
 *   LHState.ci = 0;              // ghi được từ mọi file
 *
 * Tên là LHState chứ không phải S vì block FINAL_EXAM_ONLY_QUIZ_UI_20260627 đã có một
 * hàm local tên `S` — trùng tên thì trong block đó state bị che khuất.
 *
 * Đừng destructure khi cần ghi (`const { ci } = LHState` rồi gán `ci` là vô tác dụng).
 */

/** @type {Record<string, any>} */
export const LHState = {
  RAW: [],
  pool: [],
  ci: 0,
  flipped: false,
  flipDir: 'horizontal',
  cardFontSize: localStorage.getItem('hod102_card_font_size_v3') || '1',
  flipMode: localStorage.getItem('hod102_flip_mode') || 'single',
  hideOptions: false,
  randomActive: localStorage.getItem('hod102_random_active') === '1',
  qCnt: 20,
  qSet: [],
  qDone: {},
  qSel: {},
  quizMode: 'practice',
  examSubmitted: false,
  timerInt: null,
  examStart: 0,
  editDraft: null,
};

/**
 * `ci` cần biết độ dài BASE để kẹp giá trị đọc từ localStorage — BASE nằm trong
 * appCore nên appCore gọi hàm này một lần, đúng chỗ khai báo cũ.
 */
export function initState(BASE) {
  const len = Array.isArray(BASE) ? BASE.length : 0;
  LHState.ci = Math.max(0, Math.min(+localStorage.getItem('hod102_ci') || 0, len - 1));
}
