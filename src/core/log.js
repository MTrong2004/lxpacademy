/**
 * LH_ERROR_SURFACING_20260727
 * ---------------------------
 * Trước đây codebase có 163 chỗ `catch (e) { }` rỗng. Lỗi thật bị nuốt hoàn toàn,
 * nên mỗi lần bảo trì phải đọc hàng nghìn dòng để đoán chỗ nào ném lỗi (ví dụ bug
 * "đổi môn nhưng thư viện vẫn hiện môn cũ": renderCard ném TypeError trong một try
 * chung với renderStudy, catch rỗng ăn mất, không có dấu vết nào trong Console).
 *
 * lhWarn thay cho catch rỗng:
 * - In Console lần ĐẦU của mỗi (tag + message) -> không spam dù nằm trong setInterval.
 * - Giữ 80 lỗi gần nhất trong RAM để xem lại bằng lhErrors() trong Console.
 * - Không bao giờ ném lỗi tiếp (helper này phải an toàn tuyệt đối vì nằm trong catch).
 *
 * Cách dùng khi báo lỗi web: mở Console (F12) -> gõ  lhErrors()  -> gửi bảng đó đi.
 */

const MAX_KEEP = 80; // số LOẠI lỗi khác nhau được giữ lại
const index = new Map(); // key = tag|message -> { tag, error, count, at, seq }
let seq = 0; // thứ tự lần gặp gần nhất, để lhErrors() xếp mới nhất lên đầu

function describe(err) {
  if (!err) return String(err);
  if (err instanceof Error) return (err.name || 'Error') + ': ' + (err.message || '');
  if (typeof err === 'object') {
    try {
      return JSON.stringify(err);
    } catch (_e) {
      return Object.prototype.toString.call(err);
    }
  }
  return String(err);
}

export function lhWarn(tag, err) {
  try {
    const label = String(tag || 'unknown');
    const msg = describe(err);
    const key = label + '|' + msg;

    let row = index.get(key);
    if (!row) {
      row = { tag: label, error: msg, count: 0, at: '', seq: 0 };
      index.set(key, row);
      if (index.size > MAX_KEEP) {
        let oldestKey = null,
          oldestSeq = Infinity;
        for (const [k, v] of index)
          if (v.seq < oldestSeq) {
            oldestSeq = v.seq;
            oldestKey = k;
          }
        if (oldestKey !== null) index.delete(oldestKey);
      }
    }
    row.count++;
    row.at = new Date().toLocaleTimeString('vi-VN');
    row.seq = ++seq;

    // Lần đầu in đầy đủ (có stack -> biết chính xác dòng nào). Sau đó chỉ nhắc ở mốc 10/100/1000
    // để một lỗi trong setInterval không làm ngập Console.
    if (row.count === 1) console.warn('[' + label + ']', err);
    else if (row.count === 10 || row.count === 100 || row.count === 1000) {
      console.warn('[' + label + '] lặp lại ' + row.count + ' lần:', msg);
    }
  } catch (_e) {
    /* helper trong catch: tuyệt đối không được ném thêm */
  }
}

/** Xem lại các lỗi đã bị catch, gộp theo (block + lỗi), mới nhất lên đầu. Gõ lhErrors() trong Console. */
export function lhErrors() {
  const rows = [...index.values()]
    .sort((a, b) => b.seq - a.seq)
    .map(r => ({ tag: r.tag, error: r.error, count: r.count, at: r.at }));
  try {
    console.table(rows);
  } catch (_e) {
    console.log(rows);
  }
  return rows;
}

/** Xoá lịch sử, để test lại từ trạng thái sạch. */
export function lhClearErrors() {
  index.clear();
  seq = 0;
  return true;
}

if (typeof window !== 'undefined') {
  window.lhWarn = lhWarn;
  window.lhErrors = lhErrors;
  window.lhClearErrors = lhClearErrors;

  // Lỗi KHÔNG bị catch cũng gom về cùng một chỗ để lhErrors() thấy hết.
  window.addEventListener('error', e => lhWarn('window.onerror', e?.error || e?.message || e));
  window.addEventListener('unhandledrejection', e => lhWarn('unhandledRejection', e?.reason || e));
}
