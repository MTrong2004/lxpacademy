/**
 * node scripts/migrate-state.js --dry     xem trước, không ghi file
 * node scripts/migrate-state.js           ghi thật
 *
 * Bước 1 của `docs/SPLIT_PLAN.md`: chuyển 20 biến state dùng chung ở đầu
 * `src/student/appCore.js` (dòng 305–322) sang một object trong
 * `src/student/state.js`, rồi đổi mọi chỗ dùng `RAW` -> `LHState.RAW`.
 *
 * Vì sao cần: module ES không cho gán vào binding import từ file khác, nên chừng nào
 * `RAW`/`pool`/`ci` còn là `let` trong appCore thì không tách nổi block nào có ghi vào
 * chúng — mà đó đúng là các block lõi của library/exam/editor/images.
 *
 * Vì sao là script chứ không sửa tay: 498 chỗ. Và vì sao không dùng regex trên text
 * thô: appCore còn 30 dòng chuỗi HTML template dài trên 500 ký tự, bên trong có cả
 * `RAW`, dấu ngoặc, dấu bằng. Script dùng offset từ lexer thật
 * (`scripts/lib/lex-assignments.js`) nên chỉ chạm định danh trong VÙNG CODE.
 *
 * Bốn loại chỗ script CỐ Ý không đổi (đã đếm trước, xem SPLIT_PLAN.md):
 *   - `x.RAW`, `o.editDraft`… (dotted) — thuộc tính của object khác, không phải state.
 *   - Khai báo lại trong scope con: `timerInt` 8127, `examStart` 8128, `edits` 249.
 *   - Shorthand `{ RAW }` — đổi thành `LHState.RAW` sẽ sai cú pháp, script báo ra để sửa tay.
 *   - `editDraft` làm tham số hàm — biến local, không phải state.
 */
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { splitBlocks, blockAt, OUTSIDE_BLOCK } from './lib/blocks.js';
import { collectSites } from './lib/lex-assignments.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TARGET = path.join(root, 'src', 'student', 'appCore.js');
const STATE_FILE = path.join(root, 'src', 'student', 'state.js');
const dry = process.argv.includes('--dry');

/*
  Tên object state. KHÔNG dùng `S`: block FINAL_EXAM_ONLY_QUIZ_UI_20260627 đã có một
  hàm local tên `S` (appCore dòng 8140, gọi 12 lần), nên `S` import vào sẽ bị hàm đó
  che khuất ngay trong block exam — chỗ dùng state nhiều nhất. Đã kiểm `LHState` và
  `initState` chưa được dùng ở cả appCore.js lẫn adminCore.js.
*/
const OBJ = 'LHState';

/** 20 biến ở appCore dòng 305–322 + khối khai báo cần thay. */
const NAMES = [
  'RAW', 'pool', 'ci', 'flipped', 'flipDir', 'cardFontSize', 'flipMode', 'hideOptions',
  'randomActive', 'qCnt', 'qSet', 'qDone', 'qSel', 'quizMode', 'examSubmitted', 'timerInt',
  'examStart', 'editDraft',
];
/** BASE và edits KHÔNG chuyển: `edits` bị khai báo lại ở 249, `BASE` chỉ 1 block dùng. */
const DECL_FIRST_LINE = 305;
const DECL_LAST_LINE = 322;

/** Khai báo lại trong scope con — giữ nguyên, kèm lý do để ai đọc cũng hiểu. */
const KEEP_LOCAL = new Map([
  ['timerInt', [8127]],
  ['examStart', [8128]],
]);

const text = readFileSync(TARGET, 'utf8');
const lines = text.split('\n');
const blocks = splitBlocks(lines);
const blockName = line => blockAt(blocks, line)?.name ?? OUTSIDE_BLOCK;
const sites = collectSites(text, blockName);

/** Vùng scope con phải bỏ qua: từ dòng khai báo lại tới hết hàm chứa nó. */
function inKeptLocalScope(name, line) {
  const keep = KEEP_LOCAL.get(name);
  if (!keep) return false;
  // Chỉ cần bỏ qua chính dòng khai báo và các dòng rất gần nó trong cùng hàm.
  // Hai chỗ duy nhất (8127, 8128) nằm trong một hàm ~40 dòng.
  return keep.some(l => line >= l && line <= l + 40);
}

const edits = [];
const skipped = { dotted: 0, decl: 0, keptLocal: 0 };
const manual = [];

for (const name of NAMES) {
  const s = sites.get(name);
  if (!s) {
    console.error(`⚠️  Không thấy biến ${name} — danh sách NAMES đã lệch với appCore.js`);
    process.exit(1);
  }
  for (const site of [...(s.allAssigns || []), ...(s.allRefs || []), ...s.calls]) {
    if (site.dotted) { skipped.dotted++; continue; }
    if (site.line >= DECL_FIRST_LINE && site.line <= DECL_LAST_LINE) { skipped.decl++; continue; }
    if (inKeptLocalScope(name, site.line)) { skipped.keptLocal++; continue; }
    if (site.declared && !site.funcDecl) {
      manual.push(`${name} khai báo lại ở dòng ${site.line} (block ${blockName(site.line)})`);
      continue;
    }
    /*
      Hai dạng nằm trong object literal, đổi thành `S.RAW` là sai cú pháp:
        - shorthand `{ RAW }` / `{ RAW, pool }`
        - KHÓA của thuộc tính: `{ qSel: qSel || {} }` — chỗ đầu là khóa, chỗ sau là biến.
      Phân biệt với toán tử ba ngôi (`x ? RAW : y`, cũng có dấu `:` phía sau) bằng cách
      đòi ký tự có nghĩa PHÍA TRƯỚC phải là `{` hoặc `,`. Không tự đổi, báo ra để sửa tay.
    */
    const before = text.slice(Math.max(0, site.start - 40), site.start);
    const after = text.slice(site.end, site.end + 40);
    const afterOpenBrace = /[{,]\s*$/.test(before) && !/:\s*$/.test(before);
    if (afterOpenBrace && /^\s*[,}]/.test(after)) {
      manual.push(`dòng ${site.line}: \`${name}\` shorthand trong object -> sửa tay: { ${name}: ${OBJ}.${name} }`);
      continue;
    }
    if (afterOpenBrace && /^\s*:/.test(after)) {
      manual.push(`dòng ${site.line}: \`${name}\` là KHÓA thuộc tính -> giữ khóa, chỉ đổi giá trị`);
      continue;
    }
    edits.push({ start: site.start, end: site.end, name, line: site.line });
  }
}

if (manual.length) {
  console.log('✋ Những chỗ script KHÔNG tự đổi (sửa tay sau khi chạy):');
  for (const m of manual) console.log('   ' + m);
  console.log('');
}

// Áp dụng từ CUỐI file về đầu để offset phía trước không bị lệch.
edits.sort((a, b) => b.start - a.start);
let out = text;
for (const e of edits) {
  out = out.slice(0, e.start) + OBJ + '.' + e.name + out.slice(e.end);
}

// Thay khối khai báo bằng import. Giữ nguyên phần khởi tạo có đọc localStorage bằng
// cách chuyển sang state.js, nơi BASE cũng phải nhìn thấy được -> state.js nhận
// giá trị khởi tạo qua initState(BASE) do appCore gọi.
const declBlock = lines.slice(DECL_FIRST_LINE - 1, DECL_LAST_LINE).join('\n');
if (!declBlock.startsWith('let RAW')) {
  console.error('❌ Dòng 305 không còn là `let RAW = [],` — file đã đổi, dừng lại.');
  process.exit(1);
}
const outLines = out.split('\n');
outLines.splice(
  DECL_FIRST_LINE - 1,
  DECL_LAST_LINE - DECL_FIRST_LINE + 1,
  '// State dùng chung đã chuyển sang ./state.js (xem docs/SPLIT_PLAN.md bước 1).',
  '// Mọi chỗ dùng là LHState.<tên>; các file tính năng tách sau này import cùng object này.',
  'initState(BASE);',
);
out = outLines.join('\n');

/*
  Chèn import ở NGAY ĐẦU file, không phải sau dòng đầu: appCore.js mở đầu bằng khối
  chú thích `/* AI_JS_MAP_START` nhiều dòng, chèn sau dòng 1 là chèn vào GIỮA khối chú
  thích — import bị vô hiệu và LHState thành biến toàn cục undefined lúc chạy (esbuild
  vẫn bundle thành công, chỉ vỡ khi mở web). Câu import được hoisted nên đặt đầu file
  là hợp lệ.
*/
const importLine = `import { ${OBJ}, initState } from './state.js';`;
if (!out.includes(importLine)) out = importLine + '\n' + out;

const STATE_SRC = `/**
 * State dùng chung của app học sinh.
 *
 * Trước đây là 20 biến \`let\` ở đầu appCore.js (dòng 305–322). Module ES không cho gán
 * vào binding import từ file khác, nên chừng nào chúng còn là \`let\` trong appCore thì
 * không tách nổi block nào GHI vào chúng — mà đó đúng là các block lõi của
 * library / exam / editor / images (xem docs/SPLIT_PLAN.md).
 *
 * Gói trong một object để mọi file tách ra dùng CÙNG một tham chiếu:
 *   import { ${OBJ} } from './state.js';
 *   ${OBJ}.ci = 0;              // ghi được từ mọi file
 *
 * Tên là ${OBJ} chứ không phải S vì block FINAL_EXAM_ONLY_QUIZ_UI_20260627 đã có một
 * hàm local tên \`S\` — trùng tên thì trong block đó state bị che khuất.
 *
 * Đừng destructure khi cần ghi (\`const { ci } = ${OBJ}\` rồi gán \`ci\` là vô tác dụng).
 */

/** @type {Record<string, any>} */
export const ${OBJ} = {
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
 * \`ci\` cần biết độ dài BASE để kẹp giá trị đọc từ localStorage — BASE nằm trong
 * appCore nên appCore gọi hàm này một lần, đúng chỗ khai báo cũ.
 */
export function initState(BASE) {
  const len = Array.isArray(BASE) ? BASE.length : 0;
  ${OBJ}.ci = Math.max(0, Math.min(+localStorage.getItem('hod102_ci') || 0, len - 1));
}
`;

const changed = edits.length;
console.log(`Đổi ${changed} chỗ sang ${OBJ}.<tên>`);
console.log(`Bỏ qua: ${skipped.dotted} chỗ dotted (x.RAW…), ${skipped.decl} chỗ trong khối khai báo, ` +
  `${skipped.keptLocal} chỗ thuộc scope con giữ nguyên`);

if (dry) {
  console.log('\n(--dry: không ghi file)');
  const sample = edits.slice(0, 5).map(e => `   dòng ${e.line}: ${e.name} -> ${OBJ}.${e.name}`);
  console.log('Ví dụ:\n' + sample.join('\n'));
  process.exit(0);
}

writeFileSync(STATE_FILE, STATE_SRC);
writeFileSync(TARGET, out);
console.log('✅ Đã ghi src/student/state.js và cập nhật src/student/appCore.js');
console.log('   Chạy tiếp: npm run format && npm run build && kiểm ?mock=1 cả 3 tab');
