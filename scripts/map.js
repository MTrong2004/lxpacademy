/**
 * npm run map  ->  docs/BLOCK_MAP.md
 *
 * appCore.js (~9.6k dòng) và adminCore.js (~5.7k dòng) là hàng trăm "block patch"
 * IIFE xếp lớp, nhiều block ghi đè cùng một hàm (renderStudy bị gán 15 lần).
 * Muốn biết bản nào đang chạy thì phải đọc cả file theo thứ tự — rất tốn thời gian
 * cho người và tốn token cho AI. Script này quét marker `// ===== TÊN =====` rồi
 * sinh ra bản đồ: block nào ở dòng nào, ghi đè hàm gì, dùng khóa localStorage nào,
 * gọi endpoint nào. Đọc bản đồ trước, rồi mở đúng vùng dòng cần sửa.
 *
 * Chạy lại sau mỗi lần thêm/xóa block để số dòng không bị lệch.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { splitBlocks, OUTSIDE_BLOCK } from './lib/blocks.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Các file tách ra theo docs/SPLIT_PLAN.md cũng phải có mặt ở đây, nếu không thì block
// vừa chuyển đi sẽ biến mất khỏi bản đồ (và khỏi chỗ tra tag lỗi của `lhErrors()`).
const FILES = [
  { file: 'src/student/appCore.js', label: 'appCore.js (bundle -> app.js)' },
  { file: 'src/student/exam.js', label: 'exam.js (tab Kiểm tra, tách khỏi appCore)' },
  { file: 'src/student/editor.js', label: 'editor.js (sửa/báo cáo câu hỏi, tách khỏi appCore)' },
  { file: 'src/student/images.js', label: 'images.js (ảnh + upload Cloudinary, tách khỏi appCore)' },
  { file: 'src/student/library.js', label: 'library.js (tab Thư viện, tách khỏi appCore)' },
  { file: 'src/student/subjectGate.js', label: 'subjectGate.js (cổng chọn môn + số câu, tách khỏi appCore)' },
  { file: 'src/admin/adminCore.js', label: 'adminCore.js (bundle -> admin.js)' },
];

function scan(text) {
  const out = { exports: new Set(), assigns: new Set(), keys: new Set(), api: new Set() };
  for (const m of text.matchAll(/\bwindow\.([A-Za-z_$][\w$]*)\s*=(?!=)/g)) out.exports.add(m[1]);
  // Gán LẠI (ghi đè), không tính khai báo mới: `const c = ...` / `let p = ...` bị loại,
  // nếu không thì mọi biến local trong IIFE đều bị báo là "ghi đè".
  for (const m of text.matchAll(/(?:^|[;{}(,\s])(const\s+|let\s+|var\s+)?([A-Za-z_$][\w$]*)\s*=(?!=)/g)) {
    if (!m[1]) out.assigns.add(m[2]);
  }
  // window.X = ... cũng là một lần "ghi đè" X vì các block khác gọi qua window.X().
  for (const x of out.exports) out.assigns.add(x);
  for (const m of text.matchAll(/localStorage\.(?:getItem|setItem|removeItem)\(\s*['"`]([^'"`]+)['"`]/g))
    out.keys.add(m[1]);
  for (const m of text.matchAll(/['"`](\/api\/[A-Za-z0-9\-_]+)/g)) out.api.add(m[1]);
  return out;
}

/*
  Bộ lọc nhiễu: nhiều block có biến local BỊ GÁN LẠI trùng tên với một hàm nào đó
  (`c`, `src`, `card`, `modal`...). Không có parser thật thì không phân biệt được
  scope, nên loại theo độ dài + danh sách tên local phổ biến. Tên đã export ra
  window.* thì luôn giữ, vì đó chắc chắn là API dùng chung giữa các block.
*/
const LOCAL_NOISE = new Set([
  'modal',
  'card',
  'code',
  'risk',
  'imgs',
  'list',
  'box',
  'row',
  'text',
  'html',
  'data',
  'item',
  'file',
  'opts',
  'opt',
  'cnt',
  'info',
  'meta',
  'body',
  'head',
  'main',
  'wrap',
  'btn',
  'icon',
  'line',
  'page',
  'part',
  'val',
  'key',
  'arr',
  'obj',
  'str',
  'num',
  'res',
  'req',
  'out',
  'tmp',
  'name',
  'type',
  'size',
  'idx',
  'total',
  'count',
]);

function isInterestingName(name, exported) {
  if (exported.has(name)) return true;
  return name.length >= 4 && !LOCAL_NOISE.has(name);
}

function declaredFunctions(text) {
  const names = new Set();
  for (const m of text.matchAll(/\bfunction\s+([A-Za-z_$][\w$]*)\s*\(/g)) names.add(m[1]);
  return names;
}

function table(head, rows) {
  if (!rows.length) return '_(không có)_\n';
  const line = a => '| ' + a.join(' | ') + ' |';
  return [line(head), line(head.map(() => '---')), ...rows.map(line)].join('\n') + '\n';
}

function short(set, max = 6) {
  const arr = [...set];
  if (!arr.length) return '';
  const head = arr
    .slice(0, max)
    .map(x => '`' + x + '`')
    .join(', ');
  return arr.length > max ? `${head} …+${arr.length - max}` : head;
}

let md = `# BẢN ĐỒ BLOCK — sinh tự động bằng \`npm run map\`

> **Đừng sửa tay file này.** Chạy \`npm run map\` sau khi thêm/xóa/di chuyển block.
>
> Cách dùng khi sửa lỗi:
> 1. Tìm tính năng trong bảng "Danh sách block" (hoặc tra \`lhErrors()\` trong Console —
>    tag lỗi chính là tên block ở đây).
> 2. Xem bảng "Hàm bị ghi đè": **bản gán CUỐI CÙNG mới là bản đang chạy**, các bản trước là mã chết.
> 3. Chỉ đọc/sửa đúng vùng dòng của block đó, đừng đọc cả file.
>
> ⚠️ Bảng ghi đè tính theo thứ tự xuất hiện trong file (tức thứ tự chạy đồng bộ).
> Block nào gán trong \`setTimeout\` / \`DOMContentLoaded\` sẽ thắng MUỘN HƠN mọi block
> khác — ví dụ \`renderStudy\` thực tế do \`LIBRARY_UX_STEP1_STABLE_RENDER\` gán trong
> \`setTimeout(apply, 0)\`. Muốn biết chắc bản nào đang chạy, mở Console và xem thân hàm:
>
> \`\`\`js
> String(window.renderStudy).slice(0, 200)
> \`\`\`
`;

for (const { file, label } of FILES) {
  const abs = path.join(root, file);
  const text = readFileSync(abs, 'utf8');
  const lines = text.split('\n');
  const blocks = splitBlocks(lines);
  const funcs = declaredFunctions(text);
  const exportedAnywhere = new Set([...text.matchAll(/\bwindow\.([A-Za-z_$][\w$]*)\s*=(?!=)/g)].map(m => m[1]));

  const outsideName = OUTSIDE_BLOCK;
  const assignedBy = new Map(); // tên hàm -> [block theo thứ tự]
  const keyUsedBy = new Map(); // khóa localStorage -> Set(block)
  const apiUsedBy = new Map(); // endpoint -> Set(block)
  const rows = [];

  for (const b of blocks) {
    const body = lines.slice(b.start - 1, b.end).join('\n');
    const s = scan(body);
    const name = b.name || outsideName;

    for (const fn of s.assigns) {
      if (!funcs.has(fn)) continue; // chỉ tính hàm thật, bỏ biến thường
      if (!isInterestingName(fn, exportedAnywhere)) continue; // bỏ biến local trùng tên hàm
      const list = assignedBy.get(fn) || [];
      if (list[list.length - 1] !== name) list.push(name);
      assignedBy.set(fn, list);
    }
    for (const k of s.keys) {
      if (!keyUsedBy.has(k)) keyUsedBy.set(k, new Set());
      keyUsedBy.get(k).add(name);
    }
    for (const a of s.api) {
      if (!apiUsedBy.has(a)) apiUsedBy.set(a, new Set());
      apiUsedBy.get(a).add(name);
    }

    rows.push(['`' + name + '`', `${b.start}–${b.end}`, String(b.end - b.start + 1), short(s.exports, 5) || '—']);
  }

  const overrides = [...assignedBy.entries()]
    .filter(([, list]) => list.length > 1)
    .sort((a, b) => b[1].length - a[1].length);

  md += `\n---\n\n## ${label}\n\n`;
  md += `${lines.length} dòng · ${blocks.length} block\n\n`;

  md += `### Hàm bị ghi đè nhiều lần (bản CUỐI = bản đang chạy)\n\n`;
  md += table(
    ['Hàm', 'Số block gán', 'Thứ tự block (cuối cùng thắng)'],
    overrides.map(([fn, list]) => {
      const marked = list.map((b, i) => (i === list.length - 1 ? '**' + b + '**' : b));
      const chain =
        marked.length > 6
          ? [...marked.slice(0, 2), `…${marked.length - 4} block nữa…`, ...marked.slice(-2)].join(' → ')
          : marked.join(' → ');
      return ['`' + fn + '`', String(list.length), chain];
    }),
  );

  md += `\n### Danh sách block\n\n`;
  md += table(['Block', 'Dòng', 'Số dòng', 'Gán ra window.*'], rows);

  md += `\n### Khóa localStorage\n\n`;
  md += table(
    ['Khóa', 'Block dùng'],
    [...keyUsedBy.entries()].sort().map(([k, set]) => ['`' + k + '`', [...set].join(', ')]),
  );

  md += `\n### Endpoint API\n\n`;
  md += table(
    ['Endpoint', 'Block gọi'],
    [...apiUsedBy.entries()].sort().map(([a, set]) => ['`' + a + '`', [...set].join(', ')]),
  );
}

mkdirSync(path.join(root, 'docs'), { recursive: true });
const outFile = path.join(root, 'docs', 'BLOCK_MAP.md');
writeFileSync(outFile, md);
console.log('🗺  docs/BLOCK_MAP.md đã cập nhật (' + md.split('\n').length + ' dòng)');
