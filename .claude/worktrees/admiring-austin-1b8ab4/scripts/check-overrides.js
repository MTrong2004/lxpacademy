/**
 * npm run check:overrides          kiểm tra
 * npm run check:overrides -- --update   chốt lại mốc sau khi đã dọn bớt
 *
 * Chặn nguồn gốc của mọi chi phí bảo trì ở repo này: **thêm một lớp gán mới cho hàm
 * đã có lớp cũ**. `openEditor` đã 12 lớp, `renderCard` 11 — mỗi lớp thêm vào là một
 * lần phải dò "bản nào đang chạy", và là một bug ghi đè tiềm năng (xem quy tắc số 3
 * trong CLAUDE.md).
 *
 * Script KHÔNG bắt lỗi số lớp hiện có — đó là nợ cũ, dọn dần. Nó chỉ báo đỏ khi số
 * lớp TĂNG so với mốc trong `docs/OVERRIDES_BASELINE.json`. Dọn bớt được thì chạy
 * `-- --update` để hạ mốc, và mốc chỉ có đường đi xuống.
 */
import { readdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { splitBlocks, blockAt, OUTSIDE_BLOCK } from './lib/blocks.js';
import { collectSites, pickLive, overrideLayers } from './lib/lex-assignments.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE = path.join(root, 'docs', 'OVERRIDES_BASELINE.json');
const update = process.argv.includes('--update');

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith('.js')) out.push(full);
  }
  return out;
}

/** { "src/student/appCore.js": { openEditor: { count, live, block } } } */
const current = {};

for (const abs of walk(path.join(root, 'src'))) {
  const rel = path.relative(root, abs).replace(/\\/g, '/');
  const text = readFileSync(abs, 'utf8');
  const lines = text.split('\n');
  const blocks = splitBlocks(lines);
  const blockName = line => blockAt(blocks, line)?.name ?? OUTSIDE_BLOCK;

  // Chỉ những file dùng kiểu "block patch xếp lớp" mới có vấn đề ghi đè. File module
  // nhỏ (core/*, student/api.js…) không có marker nào — cả file là "(ngoài block)",
  // nên mọi biến module sẽ bị tính oan.
  if (blocks.filter(b => b.name !== OUTSIDE_BLOCK).length < 2) continue;

  const perFile = {};
  for (const [name, sites] of collectSites(text, blockName)) {
    const layers = overrideLayers(sites, blockName); // bỏ biến/hàm riêng của từng block
    if (layers.length < 2) continue; // 1 lớp là bản gốc, không phải ghi đè
    const live = pickLive(layers);
    perFile[name] = { count: layers.length, live: live.line, block: blockName(live.line) };
  }
  if (Object.keys(perFile).length) current[rel] = perFile;
}

if (update) {
  const sorted = {};
  for (const file of Object.keys(current).sort()) {
    sorted[file] = {};
    for (const name of Object.keys(current[file]).sort()) sorted[file][name] = current[file][name].count;
  }
  writeFileSync(BASELINE, JSON.stringify(sorted, null, 2) + '\n');
  const total = Object.values(sorted).reduce((n, f) => n + Object.keys(f).length, 0);
  console.log(`📌 Đã chốt mốc: ${total} hàm có nhiều lớp gán -> docs/OVERRIDES_BASELINE.json`);
  process.exit(0);
}

let baseline;
try {
  baseline = JSON.parse(readFileSync(BASELINE, 'utf8'));
} catch {
  console.error('❌ Chưa có docs/OVERRIDES_BASELINE.json. Chốt mốc lần đầu:');
  console.error('   npm run check:overrides -- --update');
  process.exit(1);
}

const worse = [];
const better = [];

for (const [file, names] of Object.entries(current)) {
  for (const [name, info] of Object.entries(names)) {
    const was = baseline[file]?.[name] ?? 1; // chưa có trong mốc = trước đây chỉ 1 lớp
    if (info.count > was) worse.push({ file, name, was, now: info.count, ...info });
  }
}
for (const [file, names] of Object.entries(baseline)) {
  for (const [name, was] of Object.entries(names)) {
    const now = current[file]?.[name]?.count ?? 1;
    if (now < was) better.push({ file, name, was, now });
  }
}

if (better.length) {
  console.log(`✅ Dọn được ${better.length} chỗ so với mốc:`);
  for (const b of better) console.log(`   ${b.file} · ${b.name}: ${b.was} -> ${b.now} lớp`);
  console.log('   Hạ mốc lại bằng:  npm run check:overrides -- --update\n');
}

if (!worse.length) {
  console.log('✅ Không có hàm nào bị thêm lớp gán mới.');
  process.exit(0);
}

console.error(`❌ Có ${worse.length} hàm bị THÊM lớp gán mới so với mốc:\n`);
for (const w of worse) {
  console.error(`   ${w.file} · ${w.name}: ${w.was} -> ${w.now} lớp`);
  console.error(`      bản đang chạy: dòng ${w.live} (block ${w.block})`);
}
console.error(
  `\n   Quy tắc số 3 trong CLAUDE.md: đừng thêm lớp mới cho việc mà một block cũ đang làm.\n` +
    `   Hãy sửa vào bản ĐANG CHẠY. Xem chi tiết:  npm run find ${worse[0].name}\n` +
    `   Nếu lớp mới là cố ý (đã xóa lớp cũ ở nơi khác) thì chốt lại mốc:\n` +
    `   npm run check:overrides -- --update`,
);
process.exit(1);
