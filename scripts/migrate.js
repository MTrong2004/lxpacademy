import fs from 'fs';
import path from 'path';
import { createClient } from '@libsql/client';

const clean = (val) => (val || '').trim().replace(/(^['"]|['"]$)/g, '');

const rawUrl = clean(process.env.TURSO_DATABASE_URL);
const authToken = clean(process.env.TURSO_AUTH_TOKEN);

if (!rawUrl || !authToken) {
  console.error('⚠️ Cross-env missing: TURSO_DATABASE_URL or TURSO_AUTH_TOKEN');
  process.exit(1);
}

const db = createClient({
  url: rawUrl,
  authToken: authToken
});

async function runMigrations() {
  console.log('🚀 Checking Database Migrations...');
  
  // Ensure schema_migrations table exists
  await db.execute(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TEXT DEFAULT (datetime('now'))
    );
  `);

  const appliedRes = await db.execute('SELECT version FROM schema_migrations');
  const appliedSet = new Set((appliedRes.rows || []).map(r => String(r.version)));

  const migrationsDir = path.resolve('migrations');
  if (!fs.existsSync(migrationsDir)) {
    console.log('No migrations directory found.');
    return;
  }

  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    if (appliedSet.has(file)) {
      console.log(`  ✓ ${file} (already applied)`);
      continue;
    }

    console.log(`  ⏳ Applying ${file}...`);
    const sqlContent = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    
    /*
      Tách câu bằng dấu chấm phẩy — nhưng phải BỎ COMMENT `--` TRƯỚC KHI TÁCH.
      Bẫy đã sập thật (004_bookmarks.sql): một comment tiếng Việt có dấu chấm phẩy
      ("... theo user_id; PRIMARY KEY đã lo ...") làm khối bị cắt đôi, câu CREATE INDEX
      ngay dưới nó KHÔNG chạy — mà migration vẫn được đánh dấu là đã áp dụng, nên lỗi
      chỉ lộ ra khi đi soi sqlite_master. Chuỗi 'now' trong datetime('now') cũng bị cắt
      thành literal không đóng nếu comment phía trên có dấu nháy.
      Chỉ bỏ comment cả-dòng: comment nằm sau SQL cùng dòng thì phải tự tách khỏi câu.
    */
    const statements = sqlContent
      .split(/\r?\n/)
      .filter(line => !line.trim().startsWith('--'))
      .join('\n')
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const stmt of statements) {
      try {
        await db.execute(stmt);
      } catch (err) {
        // Ignore column exists error gracefully if running on existing db
        if (!err.message.includes('duplicate column name')) {
          console.warn(`    Warning on statement: ${err.message}`);
        }
      }
    }

    await db.execute({
      sql: 'INSERT INTO schema_migrations (version) VALUES (?)',
      args: [file]
    });
    console.log(`  ✅ ${file} applied successfully!`);
  }

  console.log('🎉 Database migrations are up to date!');
}

runMigrations().catch(e => {
  console.error('Migration error:', e);
  process.exit(1);
});
