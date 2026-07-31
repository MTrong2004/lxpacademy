/**
 * npm run find <tên>
 *
 * Trả lời đúng một câu hỏi, câu hỏi tốn công nhất khi sửa lỗi ở repo này:
 * **hàm này bị gán ở những đâu, và bản nào đang thực sự chạy?**
 *
 * `openEditor` có 12 chỗ gán, `renderCard` 11, `saveEditor` 8. Không có script này thì
 * mỗi lần sửa phải grep rồi đọc nhiều vùng của file 14.9k dòng chỉ để loại mã chết —
 * rất tốn công cho người và tốn token cho AI.
 *
 * Phần lex nằm ở scripts/lib/lex-assignments.js (dùng chung với `npm run check:overrides`).
 *
 * Ví dụ:
 *   npm run find openEditor
 *   npm run find renderStudy
 *   npm run find learninghub_progress_      (tên chỉ có trong chuỗi -> tìm chuỗi)
 *
 * Suy luận "bản đang chạy" là HEURISTIC (xem cảnh báo cuối output). Muốn chắc chắn
 * thì mở Console: String(window.openEditor).slice(0, 200)
 */
import { readdirSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { splitBlocks, blockAt, OUTSIDE_BLOCK } from './lib/blocks.js';
import { collectSites, pickLive } from './lib/lex-assignments.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SEARCH_DIRS = ['src', 'api'];
const IDENT = /^[A-Za-z_$][\w$]*$/;
const EMPTY = { assigns: [], calls: [], refs: [] };

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith('.js')) out.push(full);
  }
  return out;
}

function snippet(lines, line) {
  const raw = (lines[line - 1] || '').trim();
  return raw.length > 74 ? raw.slice(0, 71) + '…' : raw;
}

/** Chỗ gán đã được chú thích là mã chết (marker nằm trong ~10 dòng phía trên). */
function deadMarked(lines, line) {
  for (let k = Math.max(1, line - 10); k <= line; k++) {
    if (/DEAD_OVERRIDE/.test(lines[k - 1] || '')) return true;
  }
  return false;
}

// ---------------------------------------------------------------- main

const target = process.argv[2];

if (!target) {
  console.error('Dùng: npm run find <tênHàm>        ví dụ: npm run find openEditor');
  console.error('      npm run find <chuỗi>         ví dụ: npm run find learninghub_progress_');
  process.exit(1);
}

const files = SEARCH_DIRS.flatMap(d => walk(path.join(root, d)));
const isIdent = IDENT.test(target);
let found = 0;

console.log(`\n🔎 ${target}\n`);

const filesWithAssigns = [];
let anyLive = false;

/** Đọc file kèm thông tin block — dùng cho cả hai kiểu tìm. */
function load(abs) {
  const text = readFileSync(abs, 'utf8');
  const lines = text.split('\n');
  const blocks = splitBlocks(lines);
  return { text, lines, blockName: line => blockAt(blocks, line)?.name ?? OUTSIDE_BLOCK };
}

/** Tìm chuỗi thẳng — cho khóa localStorage, endpoint, hoặc tên chỉ có trong chuỗi. */
function literalSearch() {
  let hitCount = 0;
  for (const abs of files) {
    const rel = path.relative(root, abs).replace(/\\/g, '/');
    const { lines, blockName } = load(abs);
    const hits = [];
    lines.forEach((l, idx) => {
      if (l.includes(target)) hits.push(idx + 1);
    });
    if (!hits.length) continue;
    hitCount += hits.length;
    console.log(`${rel} — ${hits.length} dòng khớp`);
    for (const line of hits.slice(0, 25)) {
      console.log(`   dòng ${String(line).padStart(6)}   ${blockName(line).padEnd(42)} ${snippet(lines, line)}`);
    }
    if (hits.length > 25) console.log(`   … còn ${hits.length - 25} dòng nữa`);
    console.log('');
  }
  return hitCount;
}

if (!isIdent) found += literalSearch();

/*
  Lex hết các file TRƯỚC khi in. "Có phải hàm không" phải tính trên toàn bộ các file,
  không phải từng file một: sau khi tách src/student/exam.js (docs/SPLIT_PLAN.md),
  `renderQuiz` có `function renderQuiz()` + 13 chỗ gọi bên appCore, còn bên exam.js chỉ
  có đúng một dòng `window.renderQuiz = function…` và không chỗ gọi nào. Xét riêng
  exam.js thì nó trông như biến thường, và bản ĐANG CHẠY thật bị in nhãn "chết".
*/
const perFile = [];
for (const abs of isIdent ? files : []) {
  const rel = path.relative(root, abs).replace(/\\/g, '/');
  const loaded = load(abs);
  const sites = collectSites(loaded.text, loaded.blockName).get(target) ?? EMPTY;
  if (!sites.assigns.length && !sites.calls.length && !sites.refs.length) continue;
  perFile.push({ rel, lines: loaded.lines, blockName: loaded.blockName, ...sites });
}

/*
  Chỉ suy luận "bản đang chạy" cho HÀM. Với biến thường (`RAW`, `pool`, `ci`…) thì
  câu hỏi "bản nào thắng" không có nghĩa: nó bị gán lại liên tục trong lúc chạy, và
  chỗ gán cuối trong file thường nằm trong một nhánh điều kiện (RAW dòng 10984 nằm
  trong reloadCurrentQuestion, chỉ chạy khi người dùng bấm reload). Đánh dấu ● SỐNG
  ở đó là dẫn người đọc đi sai chỗ.
*/
const isFunctionLike = perFile.some(f => f.assigns.some(a => a.funcDecl) || f.calls.length > 0);

for (const { rel, lines, blockName, assigns, calls, refs } of perFile) {
  found += assigns.length + calls.length + refs.length;

  const live = isFunctionLike && assigns.length ? pickLive(assigns) : null;
  if (live) anyLive = true;
  if (assigns.length) filesWithAssigns.push(rel);

  const head = [
    `${assigns.length} chỗ gán`,
    `${calls.length} chỗ gọi`,
    live
      ? `bản ĐANG CHẠY: dòng ${live.line}`
      : assigns.length
        ? 'là BIẾN, không phải hàm — không suy luận bản nào thắng'
        : 'không có chỗ gán',
  ].join('  ·  ');
  console.log(`${rel} — ${head}`);

  for (const a of assigns) {
    const isLive = a === live;
    const tags = [];
    if (a.wrappers.length) tags.push(`[${[...new Set(a.wrappers)].join('>')}]`);
    if (a.funcDecl) tags.push('[function]');
    else if (a.declared) tags.push('[khai báo mới]');
    if (deadMarked(lines, a.line)) tags.push('[DEAD_OVERRIDE]');
    console.log(
      `   dòng ${String(a.line).padStart(6)} ${isLive ? '● SỐNG ' : '  chết '}` +
        ` ${blockName(a.line).padEnd(42)} ${tags.join(' ')}`,
    );
    console.log(`   ${' '.repeat(13)}${snippet(lines, a.line)}`);
  }

  if (calls.length) {
    const shown = calls.slice(0, 12).map(c => `${c.line} (${blockName(c.line)})`);
    console.log(`   gọi ở: dòng ${shown.join(', ')}${calls.length > 12 ? ` … +${calls.length - 12}` : ''}`);
  }
  if (refs.length) {
    const shown = refs.slice(0, 8).map(r => String(r.line));
    console.log(`   nhắc tên (không gọi): dòng ${shown.join(', ')}${refs.length > 8 ? ` … +${refs.length - 8}` : ''}`);
  }
  console.log('');
}

// Định danh không có chỗ gán/gọi nào có thể vẫn tồn tại dưới dạng CHUỖI
// (khóa localStorage, tên trong template) — lexer bỏ qua chuỗi nên phải tìm lại.
if (!found && isIdent) {
  console.log('Không thấy chỗ gán/gọi nào. Tìm như chuỗi:\n');
  found += literalSearch();
}

if (!found) {
  console.log('Không thấy gì. Tên gần giống:');
  const names = new Set();
  for (const abs of files) {
    const text = readFileSync(abs, 'utf8');
    for (const m of text.matchAll(/\bwindow\.([A-Za-z_$][\w$]*)\s*=(?!=)/g)) names.add(m[1]);
    for (const m of text.matchAll(/\bfunction\s+([A-Za-z_$][\w$]*)\s*\(/g)) names.add(m[1]);
  }
  const low = target.toLowerCase();
  const near = [...names]
    .filter(n => n.length >= 5)
    .filter(n => n.toLowerCase().includes(low) || low.includes(n.toLowerCase()))
    .slice(0, 15);
  console.log(near.length ? '   ' + near.join(', ') : '   (không có)');
  process.exit(1);
}

if (isIdent && filesWithAssigns.length) {
  if (filesWithAssigns.length > 1) {
    console.log(
      `⚠️  Tên này bị gán ở ${filesWithAssigns.length} file. Thứ tự thắng GIỮA các file phụ thuộc\n` +
        `    thứ tự import trong src/student/main.js hoặc src/admin/main.js — kiểm tra ở đó.`,
    );
  }
  if (!anyLive) {
    console.log(
      `ℹ️  Tên này là biến, không phải hàm — mỗi dòng ở trên là một lần gán TRONG LÚC CHẠY,\n` +
        `    không phải lớp ghi đè. Muốn biết giá trị hiện tại thì xem trong Console.`,
    );
    process.exit(0);
  }
  console.log(
    `ℹ️  "● SỐNG" là suy luận theo thứ tự CHẠY: gán đồng bộ chạy trước, gán trong\n` +
      `    setTimeout/DOMContentLoaded chạy sau, delay lớn hơn thì chạy sau nữa, bằng nhau thì\n` +
      `    bản ở dưới thắng. Script không mô phỏng được điều kiện if/gọi lồng nhau.\n` +
      `    Muốn chắc, mở Console:  String(window.${target}).slice(0, 200)`,
  );
}
