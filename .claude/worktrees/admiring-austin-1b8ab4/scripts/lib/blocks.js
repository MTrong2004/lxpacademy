/**
 * Chia file core thành các "block patch" theo marker `// ===== TÊN =====`.
 *
 * Dùng chung cho `npm run map` (scripts/map.js) và `npm run find`
 * (scripts/find-symbol.js) — hai script phải cắt block y hệt nhau, nếu không
 * số dòng trong BLOCK_MAP.md và tên block mà `find` in ra sẽ lệch nhau.
 */

const MARKER = /^\s*(?:\/\/|\/\*)\s*=+\s*(.+?)\s*=+\s*(?:\*\/)?\s*$/;

function isEndMarker(raw) {
  return /^END\b/i.test(raw) || /\bEND$/i.test(raw) || /ĐÃ XÓA/i.test(raw);
}

/** Loại các dòng chỉ toàn dấu = (`// ==========`) — không phải marker block. */
function isRealMarker(raw) {
  return raw.replace(/=/g, '').trim().length >= 3;
}

function slug(raw) {
  return raw.trim().replace(/\s+/g, '_');
}

export const OUTSIDE_BLOCK = '(ngoài block)';

/**
 * Cắt file thành các block theo marker. Vùng ngoài marker gộp thành "(ngoài block)".
 * Trả về [{ name, start, end }] với start/end là số dòng 1-based, end là dòng cuối.
 */
export function splitBlocks(lines) {
  const blocks = [];
  let current = null;
  const closeAt = i => {
    if (current) {
      current.end = i;
      blocks.push(current);
      current = null;
    }
  };

  lines.forEach((line, i) => {
    const m = line.match(MARKER);
    if (!m) return;
    const raw = m[1].trim();
    if (!isRealMarker(raw)) return;
    if (isEndMarker(raw)) {
      closeAt(i + 1);
      return;
    }
    closeAt(i);
    current = { name: slug(raw), start: i + 1, end: lines.length };
  });
  closeAt(lines.length);
  return blocks;
}

/** Tên block chứa dòng `line` (1-based). */
export function blockAt(blocks, line) {
  for (const b of blocks) {
    if (line >= b.start && line <= b.end) return b;
  }
  return null;
}
