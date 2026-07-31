/**
 * npm run check:installs
 *
 * Chặn đúng cái bẫy đã sập ngày 20260730: tách một block ra file riêng, đặt tên
 * `export function installX()`, nhưng QUÊN thêm lời gọi `installX()` trong appCore/adminCore.
 * Khi đó `npm run build`, `format`, `check:catch`, `check:overrides` đều XANH — file mới nằm
 * chết trong bundle, còn bản đang chạy vẫn là bản cũ trong core. Lần đó mất 4.900 dòng vào
 * hư không và 3 nút inline `onclick` của UI "Thêm môn" ném TypeError khi bấm.
 *
 * Kiểm hai chiều:
 *   1. Mọi `export function install*` phải có ít nhất một chỗ GỌI.
 *   2. Mọi lời gọi `installX()` phải có dòng `import` tương ứng — thiếu import thì esbuild
 *      báo lỗi, nhưng bắt sớm ở đây thì đọc thông báo dễ hơn.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOTS = ['src/student', 'src/admin', 'src/core'];

// Bỏ chú thích trước khi dò lời gọi — nếu không, một dòng bị comment lại
// (`// installHeaderBell();`) vẫn bị tính là "đã gọi" và check thành vô dụng.
// `(?<!:)` để không cắt nhầm phần sau `https://`.
const stripComments = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(?<!:)\/\/[^\n]*/g, '');

const files = {}; // nguyên văn — dùng để dò `export` và `import`
const code = {}; // đã bỏ chú thích — dùng để dò lời gọi
for (const dir of ROOTS) {
  for (const f of readdirSync(dir).filter(x => x.endsWith('.js'))) {
    const path = join(dir, f).replace(/\\/g, '/');
    files[path] = readFileSync(join(dir, f), 'utf8');
    code[path] = stripComments(files[path]);
  }
}

const calledIn = name => {
  const re = new RegExp('(?<![.\\w$])' + name + '\\s*\\(');
  return Object.entries(code)
    .filter(([path, text]) => !new RegExp('^export (?:async )?function ' + name + '\\b', 'm').test(text) && re.test(text))
    .map(([path]) => path);
};

const importedIn = (name, text) => {
  for (const m of text.matchAll(/import\s*\{([^}]+)\}\s*from/g)) {
    if (m[1].split(',').some(s => s.trim().split(/\s+as\s+/).pop() === name)) return true;
  }
  return false;
};

const problems = [];
let total = 0;

for (const [path, text] of Object.entries(files)) {
  for (const m of text.matchAll(/^export (?:async )?function (install[A-Za-z_$][\w$]*)/gm)) {
    const name = m[1];
    total++;
    const callers = calledIn(name);
    if (!callers.length) {
      problems.push(`${path} · ${name}()  ->  KHÔNG chỗ nào gọi. Thân block này KHÔNG chạy.`);
      continue;
    }
    for (const caller of callers) {
      if (!importedIn(name, files[caller])) {
        problems.push(`${caller} gọi ${name}() nhưng THIẾU dòng import từ ${path}.`);
      }
    }
  }
}

if (problems.length) {
  console.error(`\n❌ ${problems.length} hàm install*() chưa được nối:\n`);
  problems.forEach(p => console.error('   ' + p));
  console.error(
    '\n   Cách sửa: thêm `import { installX } from \'./file.js\'` ở đầu core, rồi gọi `installX();`\n' +
      '   ĐÚNG CHỖ block cũ đứng — thứ tự chạy giữa các block là có ý nghĩa (docs/SPLIT_PLAN.md mục 2).\n' +
      '   Nếu block đó cố ý bỏ đi thì xóa hẳn hàm, đừng để nằm chết trong bundle.\n',
  );
  process.exit(1);
}

console.log(`\n✅ ${total} hàm install*() đều được import VÀ gọi.`);
