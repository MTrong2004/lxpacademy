import { transform, build } from 'esbuild';
import { mkdir, readFile, writeFile, copyFile, rm } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');

const HTML_FILES = ['index.html', 'admin.html'];
const CSS_FILES = ['app.css', 'admin.css', 'landing.css'];

function getBuildVersion() {
  if (process.env.VERCEL_GIT_COMMIT_SHA) {
    return process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 10);
  }
  if (process.env.VERCEL_DEPLOYMENT_ID) {
    return process.env.VERCEL_DEPLOYMENT_ID;
  }
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['pipe', 'pipe', 'ignore'] }).toString().trim();
  } catch (e) {
    return 'v_' + Date.now();
  }
}

function translateCommitToVietnamese(msg) {
  let str = String(msg || '').trim();
  if (!str) return '';

  if (/[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i.test(str)) {
    return str.replace(/^(feat|fix|refactor|docs|style|perf|chore)(\([^\)]+\))?:\s*/i, '');
  }

  let category = '✨ Cập nhật: ';
  if (/^feat/i.test(str)) category = '✨ Tính năng mới: ';
  else if (/^fix/i.test(str)) category = '🐛 Sửa lỗi: ';
  else if (/^refactor|^perf/i.test(str)) category = '⚡ Tối ưu hệ thống: ';
  else if (/^style/i.test(str)) category = '🎨 Giao diện: ';
  else if (/^docs/i.test(str)) category = '📝 Tài liệu: ';

  let body = str.replace(/^(feat|fix|refactor|docs|style|perf|chore)(\([^\)]+\))?:\s*/i, '').trim();

  const dict = [
    [/staff notification system.*pending edit requests/i, 'Thêm thông báo cho Admin khi học sinh gửi yêu cầu sửa câu hỏi'],
    [/staff notification/i, 'Thêm hệ thống thông báo cho Admin'],
    [/edit request bell|request bell|bell layout/i, 'Tối ưu giao diện chuông thông báo'],
    [/jump to question|search.*library/i, 'Thêm tính năng tra nhanh câu hỏi trực tiếp trong Thư viện'],
    [/release notes|changelog/i, 'Thêm Ghi chú cập nhật phiên bản mới'],
    [/modular.*student.*core|modularize admin and student core/i, 'Cải tiến giao diện và cấu trúc ứng dụng'],
    [/subject request/i, 'Quản lý yêu cầu môn học'],
    [/ai prompt/i, 'Cấu hình prompt trợ lý AI'],
    [/update application version|version hash/i, 'Cập nhật phiên bản hệ thống'],
    [/line-clamp|css/i, 'Tối ưu hiển thị văn bản'],
    [/document|readme/i, 'Cập nhật tài liệu hướng dẫn']
  ];

  for (const [pattern, translation] of dict) {
    if (pattern.test(body)) {
      return category + translation;
    }
  }

  body = body.charAt(0).toUpperCase() + body.slice(1);
  return category + body;
}

function processCommitText(rawText, commitsArr) {
  if (!rawText) return;
  const parts = rawText
    .split(/\r?\n|;|,|\band\b/i)
    .map(s => s.trim())
    .filter(s => s.length > 3);

  for (const p of parts) {
    if (!p.startsWith('Merge branch') && !p.startsWith('Merge pull request')) {
      const translated = translateCommitToVietnamese(p);
      if (translated && !commitsArr.includes(translated)) {
        commitsArr.push(translated);
      }
    }
  }
}

function getRecentCommits() {
  const commits = [];
  if (process.env.VERCEL_GIT_COMMIT_MESSAGE) {
    processCommitText(process.env.VERCEL_GIT_COMMIT_MESSAGE, commits);
  } else {
    try {
      const raw = execSync('git log -1 --pretty=format:"%B"', { stdio: ['pipe', 'pipe', 'ignore'] }).toString();
      processCommitText(raw, commits);
    } catch (e) {
      try {
        const rawSubject = execSync('git log -1 --pretty=format:"%s"', { stdio: ['pipe', 'pipe', 'ignore'] }).toString();
        processCommitText(rawSubject, commits);
      } catch (err) {}
    }
  }
  return commits;
}

async function main() {
  await rm(dist, { recursive: true, force: true });
  await mkdir(dist, { recursive: true });

  const buildVersion = getBuildVersion();
  const recentCommits = getRecentCommits();
  const versionData = JSON.stringify({
    version: buildVersion,
    timestamp: Date.now(),
    recent_commits: recentCommits
  }, null, 2);
  await writeFile(path.join(dist, 'version.json'), versionData);
  await writeFile(path.join(root, 'version.json'), versionData);
  console.log(`📌 Generated version.json (${buildVersion}) with ${recentCommits.length} commit notes`);

  for (const f of HTML_FILES) {
    let content = await readFile(path.join(root, f), 'utf8');
    content = content
      .replace(/app\.js\?v=[^"']+/g, `app.js?v=${buildVersion}`)
      .replace(/admin\.js\?v=[^"']+/g, `admin.js?v=${buildVersion}`)
      .replace(/app\.css\?v=[^"']+/g, `app.css?v=${buildVersion}`)
      .replace(/admin\.css\?v=[^"']+/g, `admin.css?v=${buildVersion}`);
    await writeFile(path.join(dist, f), content);
  }
  try {
    await copyFile(path.join(root, 'public', 'background.webp'), path.join(dist, 'background.webp'));
    await copyFile(path.join(root, 'public', 'Logo.png'), path.join(dist, 'Logo.png'));
  } catch (e) {}

  for (const f of CSS_FILES) {
    const src = await readFile(path.join(root, f), 'utf8');
    const out = await transform(src, { loader: 'css', minify: true });
    await writeFile(path.join(dist, f), out.code);
  }

  for (const f of ['config.js', 'landing.js']) {
    const src = await readFile(path.join(root, f), 'utf8');
    const out = await transform(src, {
      loader: 'js',
      minifyWhitespace: true,
      minifySyntax: true,
      minifyIdentifiers: false
    });
    await writeFile(path.join(dist, f), out.code);
  }

  // Bundle Student App from src/student/main.js -> app.js and dist/app.js
  console.log('📦 Bundling Student App from src/student/main.js...');
  await build({
    entryPoints: [path.join(root, 'src', 'student', 'main.js')],
    bundle: true,
    outfile: path.join(root, 'app.js'),
    target: 'es2020',
    minifyIdentifiers: false,
    define: {
      '__APP_VERSION__': JSON.stringify(buildVersion)
    }
  });
  await copyFile(path.join(root, 'app.js'), path.join(dist, 'app.js'));

  // Bundle Admin App from src/admin/main.js -> admin.js and dist/admin.js
  console.log('📦 Bundling Admin App from src/admin/main.js...');
  await build({
    entryPoints: [path.join(root, 'src', 'admin', 'main.js')],
    bundle: true,
    outfile: path.join(root, 'admin.js'),
    target: 'es2020',
    minifyIdentifiers: false,
    define: {
      '__APP_VERSION__': JSON.stringify(buildVersion)
    }
  });
  await copyFile(path.join(root, 'admin.js'), path.join(dist, 'admin.js'));

  console.log('🎉 Build xong -> dist/!');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});

