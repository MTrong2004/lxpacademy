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

async function main() {
  await rm(dist, { recursive: true, force: true });
  await mkdir(dist, { recursive: true });

  const buildVersion = getBuildVersion();
  const versionData = JSON.stringify({ version: buildVersion, timestamp: Date.now() }, null, 2);
  await writeFile(path.join(dist, 'version.json'), versionData);
  await writeFile(path.join(root, 'version.json'), versionData);
  console.log(`📌 Generated version.json (${buildVersion})`);

  for (const f of HTML_FILES) {
    await copyFile(path.join(root, f), path.join(dist, f));
  }
  try {
    await copyFile(path.join(root, 'public', 'background.webp'), path.join(dist, 'background.webp'));
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

