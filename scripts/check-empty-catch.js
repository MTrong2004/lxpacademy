/**
 * npm run check:catch
 *
 * Giữ thành quả của LH_ERROR_SURFACING_20260727: không để `catch` rỗng quay lại
 * trong mã chạy ở browser (src/). Catch rỗng = lỗi biến mất không dấu vết, đó là
 * lý do bug "đổi môn nhưng thư viện vẫn hiện môn cũ" phải soi tay hàng nghìn dòng.
 *
 * Sửa: thay `catch (e) { }` bằng `catch (e) { lhWarn('TÊN_BLOCK', e) }`.
 * (api/ là mã server chạy trên Vercel Edge — dùng console.warn, không thuộc phạm vi này.)
 */
import { readdirSync, readFileSync, statSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EMPTY_CATCH = /catch\s*(?:\(\s*[A-Za-z_$][\w$]*\s*\)\s*)?\{\s*\}/g;

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith('.js')) out.push(full);
  }
  return out;
}

const offenders = [];
for (const file of walk(path.join(root, 'src'))) {
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    const t = line.trim();
    if (t.startsWith('//') || t.startsWith('*') || t.startsWith('/*')) return; // bỏ dòng chú thích
    EMPTY_CATCH.lastIndex = 0;
    const hits = line.match(EMPTY_CATCH);
    if (hits) offenders.push({ file: path.relative(root, file), line: i + 1, count: hits.length });
  });
}

if (!offenders.length) {
  console.log('✅ Không có catch rỗng nào trong src/');
  process.exit(0);
}

console.error(`❌ Còn ${offenders.reduce((n, o) => n + o.count, 0)} catch rỗng — hãy dùng lhWarn('TÊN_BLOCK', e):`);
offenders.forEach(o => console.error(`   ${o.file}:${o.line}` + (o.count > 1 ? ` (${o.count} chỗ)` : '')));
process.exit(1);
