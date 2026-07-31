/**
 * npm run check:globals
 *
 * Chặn cái bẫy "cầu nối bị đứt" — lớp lỗi mà `check:catch`, `check:overrides`,
 * `check:installs` và cả `build` đều KHÔNG thấy, chỉ vỡ lúc người dùng bấm nút:
 *
 *   File B khai báo `function foo()` (biến của module B, không phơi ra window).
 *   File A gọi `foo()` theo TÊN. Hồi còn một file thì chạy tốt; tách ra là:
 *     · `foo()` trần        -> ReferenceError (thường bị một `.catch` ở trên nuốt mất)
 *     · `typeof foo === 'function'` -> luôn FALSE, im lặng rơi vào nhánh dự phòng
 *
 * Đã sập thật hai lần: `renderCard` (RENDER_CARD_WINDOW_BRIDGE_20260731) và
 * `cleanImages` (ảnh trong Thư viện không bao giờ nạp thêm).
 *
 * Cách kiểm (không cần phân tích scope, nên không có mảng tên có sẵn của JS/DOM):
 *   Chỉ soi những tên mà src/ CÓ khai báo ở đâu đó. Nếu file A gọi tên đó mà A
 *   không khai báo, không `import`, và KHÔNG nơi nào gán `window.<tên> =` -> báo đỏ.
 *   Tên của JS/DOM (`fetch`, `setTimeout`, …) không được src/ khai báo nên tự rơi ra ngoài.
 *
 * Cách sửa: phơi bản thật ra window ngay sau khi khai báo
 * (`window.foo = foo;`) rồi đổi chỗ gọi thành `window.foo?.()`, HOẶC `import` nếu thứ tự
 * chạy cho phép. Xem docs/SPLIT_PLAN.md mục 2 ("khi nào window.* khi nào import").
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOTS = ['src/student', 'src/admin', 'src/core'];

// Tên cố ý bỏ qua: đã xác minh KHÔNG phải cầu nối đứt. Thêm vào đây thì ghi kèm LÝ DO.
const IGNORE = new Set([
  // Hàm sẵn có của trình duyệt, trùng tên với một biến cục bộ ở subjectImport.js / library.js.
  'prompt',
  'open',
  'close',
  'print',
  'focus',
  'blur',
  'find',
  'stop',
  'scroll',
  'status',
  'name',
  'length',
]);

/**
 * Bỏ chú thích + nội dung chuỗi, nhưng GIỮ phần `${…}` của template literal (trong đó là
 * code thật, ví dụ `${esc(x)}`). Có nhận diện regex literal để `/["']/g` không mở nhầm chuỗi.
 *
 * Mọi đoạn bị bỏ đều được thay bằng ĐÚNG số `\n` của nó, để số dòng báo ra khớp với file
 * gốc — appCore có chuỗi HTML dài hàng chục dòng, nuốt luôn `\n` là lệch cả trăm dòng.
 */
function stripNoise(src) {
  let out = '';
  let i = 0;
  let prev = ''; // ký tự "có nghĩa" gần nhất — dùng để đoán `/` là regex hay phép chia
  const blank = s => s.replace(/[^\n]/g, '');
  while (i < src.length) {
    const c = src[i];
    const c2 = src[i + 1];
    const start = i;
    if (c === '/' && c2 === '/') {
      while (i < src.length && src[i] !== '\n') i++;
      continue;
    }
    if (c === '/' && c2 === '*') {
      i += 2;
      while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) i++;
      i += 2;
      out += blank(src.slice(start, i));
      continue;
    }
    if (c === '"' || c === "'") {
      i++;
      while (i < src.length && src[i] !== c) i += src[i] === '\\' ? 2 : 1;
      i++;
      out += ' ' + blank(src.slice(start, i));
      prev = ')'; // chuỗi đứng ở vị trí một giá trị -> `/` ngay sau là phép chia
      continue;
    }
    if (c === '`') {
      i++;
      let lit = start; // đầu đoạn chữ thuần đang gom
      while (i < src.length) {
        if (src[i] === '\\') {
          i += 2;
          continue;
        }
        if (src[i] === '`') {
          i++;
          break;
        }
        if (src[i] === '$' && src[i + 1] === '{') {
          out += blank(src.slice(lit, i));
          i += 2;
          const exprStart = i;
          let depth = 1;
          while (i < src.length && depth > 0) {
            if (src[i] === '{') depth++;
            else if (src[i] === '}') depth--;
            if (depth > 0) i++;
          }
          out += ' ' + stripNoise(src.slice(exprStart, i)) + ' ';
          i++; // qua dấu }
          lit = i;
          continue;
        }
        i++;
      }
      out += ' ' + blank(src.slice(lit, i));
      prev = ')';
      continue;
    }
    if (c === '/' && !/[\w$)\]]/.test(prev)) {
      // regex literal
      i++;
      let inClass = false;
      while (i < src.length) {
        if (src[i] === '\\') {
          i += 2;
          continue;
        }
        if (src[i] === '[') inClass = true;
        else if (src[i] === ']') inClass = false;
        else if (src[i] === '/' && !inClass) break;
        else if (src[i] === '\n') break;
        i++;
      }
      i++;
      while (i < src.length && /[gimsuy]/.test(src[i])) i++;
      out += ' ';
      prev = ')';
      continue;
    }
    out += c;
    if (!/\s/.test(c)) prev = c;
    i++;
  }
  return out;
}

const code = {}; // đã bỏ chuỗi + chú thích — dùng cho mọi phép dò
const withStrings = {}; // chỉ bỏ chú thích — cần để đọc `=== 'function'` bên trong dấu nháy
for (const dir of ROOTS) {
  for (const f of readdirSync(dir).filter(x => x.endsWith('.js'))) {
    const path = join(dir, f).replace(/\\/g, '/');
    const src = readFileSync(join(dir, f), 'utf8');
    code[path] = stripNoise(src);
    withStrings[path] = src.replace(/\/\*[\s\S]*?\*\//g, s => s.replace(/[^\n]/g, '')).replace(/(?<!:)\/\/[^\n]*/g, '');
  }
}

/** Mọi tên được KHAI BÁO trong file (ở bất kỳ độ sâu nào — gọi từ file khác đều hỏng như nhau). */
function declaredIn(text) {
  const names = new Set();
  for (const m of text.matchAll(/\b(?:async\s+)?function\s*\*?\s*([A-Za-z_$][\w$]*)/g)) names.add(m[1]);
  for (const m of text.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g)) names.add(m[1]);
  for (const m of text.matchAll(/\bclass\s+([A-Za-z_$][\w$]*)/g)) names.add(m[1]);
  for (const m of text.matchAll(/\bcatch\s*\(\s*([A-Za-z_$][\w$]*)/g)) names.add(m[1]);
  // Khai báo phá cấu trúc: const { a, b: c } = … / const [a, b] = …
  for (const m of text.matchAll(/\b(?:const|let|var)\s*[{[]([^}\]]*)[}\]]/g)) {
    for (const part of m[1].split(',')) {
      const n = part.split(':').pop().split('=')[0].trim().replace(/^\.\.\./, '');
      if (/^[A-Za-z_$][\w$]*$/.test(n)) names.add(n);
    }
  }
  // THAM SỐ. Bắt rộng tay (mọi định danh trong danh sách tham số) là cố ý: bắt sót một
  // tham số sẽ thành báo động giả hàng loạt với các tên ngắn (`fn`, `im`, `q`, `s`, `err`).
  const KEYWORD = /^(?:if|for|while|switch|catch|return|typeof|function|await|new|do|else|case|delete|void|in|of|yield|throw|instanceof|true|false|null|undefined)$/;
  const addParams = list => {
    for (const p of list.matchAll(/(?<![.\w$])([A-Za-z_$][\w$]*)/g)) if (!KEYWORD.test(p[1])) names.add(p[1]);
  };
  for (const m of text.matchAll(/\bfunction\s*\*?\s*[\w$]*\s*\(([^()]*)\)/g)) addParams(m[1]);
  for (const m of text.matchAll(/\(([^()]*)\)\s*=>/g)) addParams(m[1]);
  for (const m of text.matchAll(/(?<![.\w$])([A-Za-z_$][\w$]*)\s*=>/g)) if (!KEYWORD.test(m[1])) names.add(m[1]);
  // Rút gọn phương thức / hàm trong object: `ten(a, b) {`
  for (const m of text.matchAll(/(?<![.\w$])([A-Za-z_$][\w$]*)\s*\(([^()]*)\)\s*\{/g)) {
    if (!KEYWORD.test(m[1])) addParams(m[2]);
  }
  return names;
}

function importedIn(text) {
  const names = new Set();
  for (const m of text.matchAll(/import\s*\{([^}]+)\}\s*from/g)) {
    for (const s of m[1].split(',')) names.add(s.trim().split(/\s+as\s+/).pop());
  }
  for (const m of text.matchAll(/import\s+([A-Za-z_$][\w$]*)\s*(?:,|from)/g)) names.add(m[1]);
  for (const m of text.matchAll(/import\s*\*\s*as\s+([A-Za-z_$][\w$]*)/g)) names.add(m[1]);
  return names;
}

const declared = {}; // file -> Set tên
const imported = {}; // file -> Set tên
const exposed = new Set(); // tên có `window.<tên> =` ở đâu đó trong src/
const declaredSomewhere = new Map(); // tên -> [file, …]

for (const [path, text] of Object.entries(code)) {
  declared[path] = declaredIn(text);
  imported[path] = importedIn(text);
  for (const n of declared[path]) {
    if (!declaredSomewhere.has(n)) declaredSomewhere.set(n, []);
    declaredSomewhere.get(n).push(path);
  }
  for (const m of text.matchAll(/\b(?:window|globalThis|self)\s*\.\s*([A-Za-z_$][\w$]*)\s*(?:=[^=]|\|\|=|\?\?=)/g)) {
    exposed.add(m[1]);
  }
  for (const m of text.matchAll(/\b(?:window|globalThis|self)\s*\[\s*['"]([^'"]+)['"]\s*\]\s*=[^=]/g)) {
    exposed.add(m[1]);
  }
  // Object.defineProperty(window, 'ten', …) — cổng gate của mock.js dùng cách này.
  for (const m of text.matchAll(/defineProperty\s*\(\s*(?:window|globalThis|self)\s*,\s*['"]([^'"]+)['"]/g)) {
    exposed.add(m[1]);
  }
}

const broken = []; // gọi trần -> ReferenceError
const silent = []; // typeof … === 'function' -> luôn false

function lineOf(text, index) {
  return text.slice(0, index).split('\n').length;
}

for (const [path, text] of Object.entries(code)) {
  const seen = new Set();
  const isSuspect = name =>
    !IGNORE.has(name) &&
    !declared[path].has(name) &&
    !imported[path].has(name) &&
    !exposed.has(name) &&
    declaredSomewhere.has(name) &&
    !declaredSomewhere.get(name).includes(path);

  // `typeof X` với X không tồn tại KHÔNG ném — nó trả 'undefined', nên cả nhánh im lặng
  // không chạy. Quét trước để phân loại: tên nào đã bị bọc `typeof` thì lời gọi bên trong
  // nhánh đó không ném, đừng xếp vào nhóm ReferenceError.
  const guarded = new Set();
  for (const m of text.matchAll(/typeof\s+([A-Za-z_$][\w$]*)\b/g)) if (isSuspect(m[1])) guarded.add(m[1]);
  // Chỉ BÁO những guard đang hỏi "có phải hàm không" — đó là cầu nối gãy. Guard kiểu
  // `typeof x === 'undefined'` là phòng thủ có chủ ý, không phải lỗi.
  const reported = new Set();
  for (const m of withStrings[path].matchAll(/typeof\s+([A-Za-z_$][\w$]*)\s*[=!]==?\s*['"]function['"]/g)) {
    const name = m[1];
    if (!isSuspect(name) || reported.has(name)) continue;
    reported.add(name);
    silent.push({ path, line: lineOf(withStrings[path], m.index), name, where: declaredSomewhere.get(name) });
  }

  // Gọi trần: `ten(` hoặc `ten?.(`, không đứng sau dấu chấm (đó là gọi thuộc tính).
  // `?.()` KHÔNG cứu được: đọc một tên chưa khai báo là ném ReferenceError ngay.
  for (const m of text.matchAll(/(?<![.\w$])([A-Za-z_$][\w$]*)\s*(?:\?\.)?\s*\(/g)) {
    const name = m[1];
    if (
      /^(?:if|for|while|switch|catch|return|typeof|function|await|new|do|else|case|delete|void|in|of|yield|throw)$/.test(
        name,
      )
    )
      continue;
    if (!isSuspect(name) || guarded.has(name)) continue;
    const key = name + '@' + lineOf(text, m.index);
    if (seen.has(key)) continue;
    seen.add(key);
    broken.push({ path, line: lineOf(text, m.index), name, where: declaredSomewhere.get(name) });
  }
}

const fmt = p => `   ${p.path}:${p.line}  ·  ${p.name}()  ->  chỉ khai báo ở ${p.where.join(', ')}`;

if (broken.length || silent.length) {
  console.error(`\n❌ ${broken.length + silent.length} chỗ gọi hàm của file khác mà KHÔNG có cầu nối window.*\n`);
  if (broken.length) {
    console.error(`   ── Gọi trần -> ném ReferenceError lúc chạy (${broken.length}):`);
    broken.forEach(p => console.error(fmt(p)));
  }
  if (silent.length) {
    console.error(`\n   ── typeof … === 'function' -> LUÔN false, im lặng bỏ qua (${silent.length}):`);
    silent.forEach(p => console.error(fmt(p)));
  }
  console.error(
    '\n   Cách sửa: ở file khai báo, thêm `window.<tên> = <tên>;` NGAY SAU khi khai báo, rồi đổi\n' +
      '   chỗ gọi thành `window.<tên>?.()`. Nếu thứ tự chạy cho phép thì `import` sạch hơn.\n' +
      '   Nếu là tham số / biến cục bộ trùng tên (không phải cầu nối đứt) thì thêm vào IGNORE\n' +
      '   trong scripts/check-globals.js kèm lý do.\n',
  );
  process.exit(1);
}

console.log(`\n✅ Không có chỗ gọi nào bị đứt cầu nối (đã soi ${Object.keys(code).length} file).`);
