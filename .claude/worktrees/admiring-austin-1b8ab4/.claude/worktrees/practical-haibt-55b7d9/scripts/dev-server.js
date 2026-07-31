import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import esbuild from 'esbuild';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

// Đọc .env ở thư mục gốc
if (fs.existsSync(path.join(root, '.env'))) {
  const envContent = fs.readFileSync(path.join(root, '.env'), 'utf8');
  envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim().replace(/(^['"]|['"]$)/g, '');
      process.env[key] = val;
    }
  });
}

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp'
};

/*
  DEV_API_LOADER_FIX_20260726
  ---------------------------
  Bản cũ bundle api/index.js rồi `import("data:text/javascript;base64,...")`.
  Node KHÔNG resolve được bare specifier (vd "@libsql/client/web") từ một data: URL
  vì data: URL không có ngữ cảnh thư mục / package nào để tra node_modules.
  => TypeError [ERR_UNSUPPORTED_RESOLVE_REQUEST]:
       Failed to resolve module specifier "@libsql/client/web" from "data:text/javascript;base64,..."
  Lỗi này bị catch ở dưới và trả về browser dưới dạng JSON 500 { error: <message> },
  nên nó hiện ra trong Console của trình duyệt dù frontend không hề có data: URL nào.

  Cách sửa đúng: ghi bundle ra FILE THẬT nằm trong project rồi import bằng file:// URL.
  File thật có thư mục cha => Node resolve "@libsql/client/web" từ <root>/node_modules bình thường.
  Không còn base64, không còn data: URL, không còn dynamic import mã nguồn dạng chuỗi.
*/
const API_ENTRY = path.join(root, 'api', 'index.js');
const API_DIR = path.join(root, 'api');
const DEV_CACHE_DIR = path.join(root, '.dev-cache');

function latestApiMtime(dir) {
  let latest = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) latest = Math.max(latest, latestApiMtime(full));
    else if (entry.name.endsWith('.js')) latest = Math.max(latest, fs.statSync(full).mtimeMs);
  }
  return latest;
}

let cachedHandler = null;
let cachedStamp = 0;

async function loadApiHandler() {
  const stamp = Math.floor(latestApiMtime(API_DIR));
  if (cachedHandler && stamp === cachedStamp) return cachedHandler;

  const result = await esbuild.build({
    entryPoints: [API_ENTRY],
    bundle: true,
    write: false,
    format: 'esm',
    target: 'node18',
    platform: 'node',
    // Giữ external: dùng package thật trong node_modules, không nhúng vào bundle.
    external: ['@libsql/client', '@libsql/client/web']
  });

  fs.mkdirSync(DEV_CACHE_DIR, { recursive: true });
  const outFile = path.join(DEV_CACHE_DIR, `api-${stamp}.mjs`);
  fs.writeFileSync(outFile, result.outputFiles[0].text, 'utf8');

  // Dọn các bundle cũ để .dev-cache không phình ra.
  for (const f of fs.readdirSync(DEV_CACHE_DIR)) {
    if (f.startsWith('api-') && f !== path.basename(outFile)) {
      try { fs.unlinkSync(path.join(DEV_CACHE_DIR, f)); } catch (e) {}
    }
  }

  const mod = await import(pathToFileURL(outFile).href);
  cachedHandler = mod.default;
  cachedStamp = stamp;
  if (typeof cachedHandler !== 'function') {
    throw new Error('api/index.js phải export default một hàm handler(req) trả về Response');
  }
  return cachedHandler;
}

const server = http.createServer(async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // 1. Xử lý API
  if (req.url.startsWith('/api/')) {
    if (!fs.existsSync(API_ENTRY)) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
      return;
    }

    let bodyBuffer = [];
    req.on('data', chunk => {
      bodyBuffer.push(chunk);
    });

    req.on('end', async () => {
      const bodyStr = Buffer.concat(bodyBuffer).toString();
      try {
        const handler = await loadApiHandler();

        const headers = new Headers();
        Object.entries(req.headers).forEach(([k, v]) => {
          if (v) headers.set(k, Array.isArray(v) ? v.join(', ') : String(v));
        });

        const webReq = new Request(`http://localhost${req.url}`, {
          method: req.method,
          headers: headers,
          body: ['POST', 'PUT', 'PATCH'].includes(req.method) ? bodyStr : undefined
        });

        const webRes = await handler(webReq);
        if (!(webRes instanceof Response)) {
          throw new Error(`Handler cho ${req.url} không trả về Response`);
        }

        const resHeaders = {};
        webRes.headers.forEach((v, k) => {
          resHeaders[k] = v;
        });

        res.writeHead(webRes.status, resHeaders);
        const bodyText = await webRes.text();
        res.end(bodyText);
      } catch (e) {
        // Log lỗi thật (kèm stack) ở terminal server; chỉ trả message chung cho browser.
        console.error(`[dev-server] ${req.method} ${req.url} failed:`, e);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal Server Error', code: 'DEV_API_ERROR' }));
      }
    });
    return;
  }

  // 2. Serve static files (root trước, rồi tới public/ — nơi chứa các asset dùng chung với build)
  let safePath = req.url.split('?')[0];
  if (safePath === '/') safePath = '/index.html';
  let filePath = path.join(root, safePath);

  if (safePath === '/version.json') {
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
    });
    if (fs.existsSync(filePath)) {
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.end(JSON.stringify({ version: 'dev_' + Date.now(), timestamp: Date.now() }));
    }
    return;
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(root, 'public', safePath);
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`\n🚀 LOCAL DEV SERVER RUNNING AT: http://localhost:${PORT}`);
  console.log(`Database connected: ${process.env.TURSO_DATABASE_URL}\n`);
});
