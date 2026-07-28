/**
 * Lex một file JS và thu MỌI chỗ gán / gọi / nhắc tên, kèm thông tin thứ tự chạy.
 *
 * Dùng chung cho `npm run find` (tra một tên) và `npm run check:overrides`
 * (đếm số lớp ghi đè của cả file). Hai lệnh phải hiểu code y hệt nhau, nếu không
 * thì lệnh này báo an toàn còn lệnh kia báo có ghi đè.
 *
 * Vì sao phải lex thật thay vì grep: `appCore.js` có 30 dòng chuỗi HTML template dài
 * trên 500 ký tự, bên trong đầy `{`, `(`, `=`, dấu nháy. Grep sẽ đếm cả những chỗ đó.
 * Lexer bỏ qua chuỗi, template literal, chú thích và regex literal.
 */
import { OUTSIDE_BLOCK } from './blocks.js';

/** Hàm bọc làm cho phần gán bên trong THẮNG MUỘN HƠN mọi block đồng bộ. */
const ASYNC_FNS = new Set([
  'setTimeout',
  'setInterval',
  'requestAnimationFrame',
  'requestIdleCallback',
  'queueMicrotask',
  'then',
]);
const LATE_EVENT = /^\(\s*['"`](DOMContentLoaded|load)['"`]/;
/** `setTimeout(apply, 900)` — callback truyền bằng TÊN, thân hàm nằm ở chỗ khác. */
const NAMED_CALLBACK = /^\(\s*([A-Za-z_$][\w$]*)\s*(?:,\s*(\d+)\s*)?\)/;
const KEYWORD_BEFORE_REGEX = new Set([
  'return',
  'typeof',
  'case',
  'in',
  'of',
  'delete',
  'void',
  'instanceof',
  'new',
  'do',
  'else',
  'yield',
  'await',
]);
const PREFIX_BEFORE_REGEX = new Set('(,=:[!&|?{};+-*%~^<>'.split(''));

const isIdentStart = c => /[A-Za-z_$]/.test(c);
const isIdentPart = c => /[\w$]/.test(c);

/**
 * @param {string} text  nội dung file
 * @param {(line:number)=>string} blockName  tên block chứa dòng đó
 * @returns {Map<string, {assigns:Array, calls:Array, refs:Array}>}
 *   assigns[i] = { line, viaWindow, declared, funcDecl, deferred, delay, wrappers }
 *   delay: -1 = gán đồng bộ (chạy ngay), >= 0 = chạy trong timer sau bấy nhiêu ms
 */
export function collectSites(text, blockName) {
  const N = text.length;
  /** @type {Map<string, {assigns:Array, calls:Array, refs:Array}>} */
  const byName = new Map();
  const entry = name => {
    let e = byName.get(name);
    if (!e) byName.set(name, (e = { assigns: [], calls: [], refs: [] }));
    return e;
  };

  let i = 0;
  let line = 1;
  let paren = 0;
  let brace = 0;
  const asyncStack = [];
  const modes = [{ t: 'code' }];
  let prevSig = '';
  let prevIdent = '';

  // Callback truyền bằng tên: `setTimeout(apply, 0)` -> mọi phép gán trong thân
  // `function apply()` cũng thắng muộn, dù thân hàm nằm ở chỗ khác trong file.
  // Khóa gồm cả tên block: `apply` là tên local phổ biến, nhiều block đều có một
  // `function apply()` riêng — ghép theo tên trần sẽ gán sai block.
  const lateCallbacks = new Map(); // "BLOCK::tên" -> { wrapper, delay }
  const funcRanges = []; // { name, start, end }
  const funcStack = [];
  let pendingFunc = null;

  const mode = () => modes[modes.length - 1];

  const advance = to => {
    const end = Math.min(to, N);
    for (let k = i; k < end; k++) if (text[k] === '\n') line++;
    i = end;
  };

  /** Chỉ số ký tự có nghĩa tiếp theo từ j (bỏ khoảng trắng + chú thích). */
  function nextSig(j) {
    while (j < N) {
      const c = text[j];
      if (c === ' ' || c === '\t' || c === '\r' || c === '\n') {
        j++;
        continue;
      }
      if (c === '/' && text[j + 1] === '/') {
        while (j < N && text[j] !== '\n') j++;
        continue;
      }
      if (c === '/' && text[j + 1] === '*') {
        const e = text.indexOf('*/', j + 2);
        j = e < 0 ? N : e + 2;
        continue;
      }
      return j;
    }
    return N;
  }

  /** Trả về chỉ số sau dấu nháy đóng, hoặc -1 nếu không đóng trên cùng dòng. */
  function scanString(start, quote) {
    for (let j = start + 1; j < N; j++) {
      const ch = text[j];
      if (ch === '\\') {
        j++;
        continue;
      }
      if (ch === '\n') return -1;
      if (ch === quote) return j + 1;
    }
    return -1;
  }

  /** Regex literal không xuống dòng được — gặp \n thì kết luận đó là phép chia. */
  function scanRegex(start) {
    let inClass = false;
    for (let j = start + 1; j < N; j++) {
      const ch = text[j];
      if (ch === '\\') {
        j++;
        continue;
      }
      if (ch === '\n') return -1;
      if (ch === '[') inClass = true;
      else if (ch === ']') inClass = false;
      else if (ch === '/' && !inClass) {
        let k = j + 1;
        while (k < N && /[a-z]/.test(text[k])) k++;
        return k;
      }
    }
    return -1;
  }

  while (i < N) {
    const c = text[i];

    // ---- trong template literal: chỉ tìm ` đóng hoặc ${ để quay lại vùng code ----
    if (mode().t === 'tpl') {
      if (c === '\\') {
        advance(i + 2);
        continue;
      }
      if (c === '`') {
        modes.pop();
        prevSig = '`';
        advance(i + 1);
        continue;
      }
      if (c === '$' && text[i + 1] === '{') {
        modes.push({ t: 'code', tplBrace: brace });
        brace++;
        prevSig = '{';
        advance(i + 2);
        continue;
      }
      advance(i + 1);
      continue;
    }

    // ---- vùng code ----
    if (c === '\n' || c === ' ' || c === '\t' || c === '\r') {
      advance(i + 1);
      continue;
    }

    if (c === '/' && text[i + 1] === '/') {
      const e = text.indexOf('\n', i);
      advance(e < 0 ? N : e);
      continue;
    }
    if (c === '/' && text[i + 1] === '*') {
      const e = text.indexOf('*/', i + 2);
      advance(e < 0 ? N : e + 2);
      continue;
    }

    if (c === '/' && (prevSig === '' || PREFIX_BEFORE_REGEX.has(prevSig) || KEYWORD_BEFORE_REGEX.has(prevIdent))) {
      const e = scanRegex(i);
      if (e > 0) {
        advance(e);
        prevSig = '/';
        continue;
      }
      // không phải regex -> rơi xuống nhánh toán tử ở cuối
    }

    if (c === '"' || c === "'") {
      const e = scanString(i, c);
      if (e > 0) {
        advance(e);
        prevSig = c;
        continue;
      }
      // không đóng -> coi như ký tự thường
    }

    if (c === '`') {
      modes.push({ t: 'tpl' });
      advance(i + 1);
      continue;
    }

    if (isIdentStart(c)) {
      let j = i + 1;
      while (j < N && isIdentPart(text[j])) j++;
      const name = text.slice(i, j);
      const atLine = line;
      const dotted = prevSig === '.';
      const owner = dotted ? prevIdent : '';
      const before = prevIdent;
      advance(j);

      const k = nextSig(i);
      const nc = k < N ? text[k] : '';

      // start/end: vị trí ký tự của chính định danh — cần cho việc đổi tên máy móc
      // (scripts/migrate-state.js). Dùng offset thay vì regex trên text thô để không
      // chạm vào chuỗi HTML template.
      const start = i - name.length;
      const end = i;

      const isAssign = nc === '=' && text[k + 1] !== '=' && text[k + 1] !== '>';
      if (isAssign) {
        entry(name).assigns.push({
          start,
          end,
          line: atLine,
          viaWindow: owner === 'window',
          dotted,
          declared: before === 'const' || before === 'let' || before === 'var',
          deferred: asyncStack.length > 0,
          delay: asyncStack.length > 0 ? 0 : -1,
          wrappers: asyncStack.map(w => w.name),
        });
      } else if (before === 'function' && !dotted && nc === '(') {
        entry(name).assigns.push({
          start,
          end,
          line: atLine,
          viaWindow: false,
          dotted: false,
          declared: true,
          funcDecl: true,
          deferred: asyncStack.length > 0,
          delay: asyncStack.length > 0 ? 0 : -1,
          wrappers: asyncStack.map(w => w.name),
        });
      } else if (nc === '(') {
        entry(name).calls.push({ start, end, line: atLine, dotted, viaWindow: owner === 'window' });
      } else {
        entry(name).refs.push({ start, end, line: atLine, dotted });
      }

      if (before === 'function' && nc === '(') pendingFunc = { name, start: atLine, parenAtDecl: paren };

      if (nc === '(') {
        let wrapper = null;
        if (ASYNC_FNS.has(name)) wrapper = name;
        else if (name === 'addEventListener') {
          const m = text.slice(k, k + 48).match(LATE_EVENT);
          if (m) wrapper = m[1];
        }
        if (wrapper) {
          asyncStack.push({ name: wrapper, paren });
          const cb = text.slice(k, k + 64).match(NAMED_CALLBACK);
          if (cb) {
            const key = `${blockName(atLine)}::${cb[1]}`;
            const delay = cb[2] === undefined ? 0 : Number(cb[2]);
            const prev = lateCallbacks.get(key);
            // Cùng một hàm có thể được hẹn nhiều lần (0ms rồi 900ms) — lần MUỘN
            // NHẤT mới là lần thắng cuối cùng.
            if (!prev || delay > prev.delay) lateCallbacks.set(key, { wrapper, delay });
          }
        }
      }

      prevIdent = name;
      prevSig = 'a';
      continue;
    }

    // Sau dấu câu thì "định danh đứng trước" hết hiệu lực, trừ dấu `.` (cần cho
    // `window.X`). Không reset thì `function(){}; foo(` sẽ bị hiểu là `function foo(`.
    if (c === '(') {
      paren++;
      prevSig = '(';
      prevIdent = '';
      advance(i + 1);
      continue;
    }
    if (c === ')') {
      paren--;
      while (asyncStack.length && asyncStack[asyncStack.length - 1].paren >= paren) asyncStack.pop();
      prevSig = ')';
      prevIdent = '';
      advance(i + 1);
      continue;
    }
    if (c === '{') {
      // Chỉ nhận `{` này là THÂN hàm khi danh sách tham số đã đóng — nếu không thì
      // object literal trong tham số mặc định `function f(a = {})` sẽ bị nhận nhầm.
      if (pendingFunc && paren === pendingFunc.parenAtDecl) {
        funcStack.push({ name: pendingFunc.name, start: pendingFunc.start, brace });
        pendingFunc = null;
      }
      brace++;
      prevSig = '{';
      prevIdent = '';
      advance(i + 1);
      continue;
    }
    if (c === '}') {
      brace--;
      const m = mode();
      if (m.tplBrace !== undefined && brace === m.tplBrace) modes.pop();
      if (funcStack.length && funcStack[funcStack.length - 1].brace === brace) {
        const f = funcStack.pop();
        funcRanges.push({ name: f.name, start: f.start, end: line });
      }
      prevSig = '}';
      prevIdent = '';
      advance(i + 1);
      continue;
    }

    /*
      `...` (spread/rest) KHÔNG phải truy cập thuộc tính. Nếu để prevSig = '.' thì
      `[...RAW]` bị hiểu là `x.RAW` rồi bị bỏ qua — đã làm sót đúng một chỗ trong
      migrate-state và app vỡ ngay lúc tải ("RAW is not defined" tại rebuild()).
      Coi vị trí sau spread như sau dấu phẩy: đứng sau nó là một biểu thức.
    */
    if (c === '.' && text[i + 1] === '.' && text[i + 2] === '.') {
      prevSig = ',';
      prevIdent = '';
      advance(i + 3);
      continue;
    }

    if (c !== '.') prevIdent = '';
    prevSig = c;
    advance(i + 1);
  }

  // Thân hàm được hẹn giờ bằng tên — nhỏ, nên quét tuyến tính cho mỗi chỗ gán là đủ nhanh.
  const lateRanges = funcRanges
    .filter(f => lateCallbacks.has(`${blockName(f.start)}::${f.name}`))
    .map(f => ({ ...f, ...lateCallbacks.get(`${blockName(f.start)}::${f.name}`) }))
    .sort((x, y) => x.end - x.start - (y.end - y.start));

  for (const e of byName.values()) {
    for (const a of e.assigns) {
      if (a.deferred) continue;
      const inside = lateRanges.find(f => a.line >= f.start && a.line <= f.end); // hàm bao gần nhất
      if (!inside) continue;
      a.deferred = true;
      a.delay = inside.delay;
      a.wrappers = [`${inside.wrapper}${inside.delay ? ' ' + inside.delay + 'ms' : ''}>${inside.name}()`];
    }

    // Bản CHƯA gộp, giữ đủ offset của từng lần xuất hiện — scripts/migrate-state.js
    // cần từng chỗ một để đổi tên, gộp theo dòng sẽ làm mất chỗ thứ hai trên cùng dòng.
    e.allAssigns = e.assigns.slice();
    e.allRefs = e.refs.slice();

    // `x = window.x = fn` sinh hai lần gán trên cùng một dòng — gộp lại cho gọn.
    const merged = [];
    for (const a of e.assigns) {
      const same = merged.find(m => m.line === a.line);
      if (same) {
        same.viaWindow = same.viaWindow || a.viaWindow;
        continue;
      }
      merged.push(a);
    }
    e.assigns = merged;

    const seen = new Set();
    e.refs = e.refs.filter(r => (seen.has(r.line) ? false : seen.add(r.line)));
  }

  return byName;
}

/**
 * Bản đang chạy: chạy MUỘN NHẤT thì thắng. Gán đồng bộ (delay -1) chạy trước mọi
 * gán trong timer; giữa các timer thì delay lớn hơn chạy sau; bằng nhau thì bản
 * xuất hiện sau trong file thắng.
 */
export function pickLive(assigns) {
  let best = null;
  for (const a of assigns) {
    if (!best || a.delay >= best.delay) best = a;
  }
  return best;
}

/**
 * Lọc ra những lần gán thực sự là "lớp ghi đè" — tức là ghi lên một tên DÙNG CHUNG
 * giữa các block, chứ không phải biến/hàm riêng của từng block.
 *
 * Mỗi block patch là một IIFE, nên `function card()` hay `const modal = …` bên trong
 * block chỉ thuộc block đó: `card` được khai báo riêng ở 41 block khác nhau mà không
 * block nào ghi đè block nào. Chỉ hai thứ cắt qua được ranh giới block:
 *   1. `window.X = …`  — kênh dùng chung thật sự giữa các block.
 *   2. Gán trần `X = …` (không const/let/var/function) — nhắm vào binding ở ngoài block.
 * Cộng thêm bản khai báo gốc nằm NGOÀI mọi block, tính là lớp nền.
 *
 * @param {{assigns:Array}} sites  kết quả của collectSites cho một tên
 * @param {(line:number)=>string} blockName
 */
export function overrideLayers(sites, blockName) {
  // Chỉ xét HÀM: quy tắc số 3 trong CLAUDE.md nói về hàm bị xếp lớp. Biến thường
  // (`let apiAction = ''` rồi gán lại trong switch — 21 lần trong adminCore) không
  // phải ghi đè. Nhận diện hàm bằng: có `function tên(` hoặc có chỗ gọi `tên(`.
  // (Hàm chỉ được gọi từ `onclick="..."` trong chuỗi HTML sẽ bị bỏ sót — chấp nhận.)
  const isFunction = sites.assigns.some(a => a.funcDecl) || sites.calls.length > 0;
  if (!isFunction) return [];

  const shared =
    sites.assigns.some(a => a.viaWindow) ||
    sites.assigns.some(a => (a.funcDecl || a.declared) && blockName(a.line) === OUTSIDE_BLOCK);
  if (!shared) return [];
  return sites.assigns.filter(a => a.viaWindow || !(a.declared || a.funcDecl) || blockName(a.line) === OUTSIDE_BLOCK);
}
