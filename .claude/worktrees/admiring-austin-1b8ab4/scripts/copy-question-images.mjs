/*
  COPY_QUESTION_IMAGES_20260726
  -----------------------------
  Copy mảng `images` (URL Cloudinary) từ các môn nguồn sang môn đích, khớp theo
  nội dung câu hỏi đã chuẩn hoá. Dùng khi import Quizlet tạo môn mới: file export
  không mang URL ảnh nên `images = []` dù `has_image` được đoán = 1
  (xem scanNeedsImage ở src/student/appCore.js).

  KHÔNG ghi đè câu đã có ảnh. KHÔNG đổi has_image. Luôn ghi backup trước khi apply.

  Dry-run:  node scripts/copy-question-images.mjs --to HOD102_3 --from HOD102,HOD102_2
  Apply:    node scripts/copy-question-images.mjs --to HOD102_3 --from HOD102,HOD102_2 --apply
*/
import fs from 'fs';
import path from 'path';
import { createClient } from '@libsql/client';

const root = path.resolve(import.meta.dirname, '..');

// Đọc .env giống scripts/dev-server.js
if (fs.existsSync(path.join(root, '.env'))) {
  for (const line of fs.readFileSync(path.join(root, '.env'), 'utf8').split('\n')) {
    const parts = line.split('=');
    if (parts.length < 2) continue;
    process.env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/(^['"]|['"]$)/g, '');
  }
}

function arg(name, fallback = '') {
  const i = process.argv.indexOf('--' + name);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
const APPLY = process.argv.includes('--apply');
const TO = arg('to').toUpperCase().trim();
const FROM = arg('from').toUpperCase().split(',').map(s => s.trim()).filter(Boolean);

if (!TO || !FROM.length) {
  console.error('Thiếu tham số: --to <MÃ_MÔN_ĐÍCH> --from <MÃ1,MÃ2>');
  process.exit(1);
}

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

// Chuẩn hoá để khớp: bỏ dấu câu, gộp khoảng trắng, lấy 80 ký tự đầu.
const norm = s => String(s || '')
  .toLowerCase()
  .replace(/[^\p{L}\p{N} ]/gu, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .slice(0, 80);

function parseImages(v) {
  if (Array.isArray(v)) return v;
  if (!v) return [];
  try { const a = JSON.parse(v); return Array.isArray(a) ? a : []; } catch { return []; }
}

const codes = [TO, ...FROM];
const placeholders = codes.map(() => '?').join(',');
const { rows } = await db.execute({
  sql: `select id, upper(trim(subject_code)) as sc, num, question, options, images, has_image
        from questions
        where upper(trim(subject_code)) in (${placeholders})`,
  args: codes
});

// Nguồn: khớp theo text; nếu nhiều câu trùng thì giữ câu có nhiều ảnh nhất.
const sources = new Map();
for (const r of rows) {
  if (r.sc === TO) continue;
  const imgs = parseImages(r.images);
  if (!imgs.length) continue;
  const k = norm(r.question);
  const prev = sources.get(k);
  if (!prev || imgs.length > prev.imgs.length) {
    sources.set(k, { imgs, from: `${r.sc}#${r.num}` });
  }
}

const targets = rows.filter(r => r.sc === TO);
const plan = [];
const skippedHasImages = [];
const unmatchedFlagged = [];

for (const t of targets) {
  const existing = parseImages(t.images);
  const hit = sources.get(norm(t.question));
  if (existing.length) {
    if (hit) skippedHasImages.push(t.num);
    continue;
  }
  if (!hit) {
    if (t.has_image) unmatchedFlagged.push(t.num);
    continue;
  }
  plan.push({ id: t.id, num: t.num, count: hit.imgs.length, from: hit.from, images: hit.imgs });
}

console.log(`Nguồn có ảnh: ${sources.size} câu (${FROM.join(', ')})`);
console.log(`Đích ${TO}: ${targets.length} câu, ${targets.filter(t => t.has_image).length} câu has_image=1`);
console.log(`→ Sẽ cập nhật: ${plan.length} câu`);
console.log(`→ Bỏ qua vì đã có ảnh: ${skippedHasImages.length}`);
console.log(`→ has_image=1 nhưng không khớp nguồn (phải upload tay): ${unmatchedFlagged.length}` +
  (unmatchedFlagged.length ? ` → câu ${unmatchedFlagged.join(', ')}` : ''));
console.log('');
for (const p of plan) console.log(`  câu ${p.num} ← ${p.from} (${p.count} ảnh)`);

if (!APPLY) {
  console.log('\n[DRY-RUN] Chưa ghi gì. Thêm --apply để thực thi.');
  process.exit(0);
}

// Backup toàn bộ state hiện tại của môn đích trước khi ghi.
const backupDir = path.join(root, 'migrations', 'backups');
fs.mkdirSync(backupDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupFile = path.join(backupDir, `${TO}_images_before_${stamp}.json`);
fs.writeFileSync(backupFile, JSON.stringify(
  targets.map(t => ({ id: t.id, num: t.num, images: t.images, has_image: t.has_image })), null, 2
), 'utf8');
console.log(`\nBackup: ${path.relative(root, backupFile)}`);

const now = new Date().toISOString();
let ok = 0;
for (const p of plan) {
  // Điều kiện images rỗng lặp lại trong WHERE: an toàn nếu có ai vừa upload ảnh giữa lúc chạy.
  const res = await db.execute({
    sql: `update questions
          set images = ?, updated_at = ?
          where id = ? and coalesce(trim(images), '') in ('', '[]', 'null')`,
    args: [JSON.stringify(p.images), now, p.id]
  });
  if (Number(res.rowsAffected) > 0) ok++;
  else console.log(`  ! bỏ qua câu ${p.num} (id ${p.id}): images không còn rỗng`);
}
console.log(`\nĐã cập nhật ${ok}/${plan.length} câu.`);
console.log('Cache: /api/questions có TTL 5 phút; trên trình duyệt chạy');
console.log(`  localStorage.removeItem('learninghub_questions_cache_v1_${TO}'); location.reload();`);
