import { createClient } from '@libsql/client/web';

const clean = (val) => {
  if (!val) return '';
  return val.trim().replace(/(^['"]|['"]$)/g, '');
};

const rawUrl = clean(process.env.TURSO_DATABASE_URL);
const url = rawUrl.startsWith('libsql://')
  ? rawUrl.replace('libsql://', 'https://')
  : rawUrl;

let realDb = null;
function getRealDb() {
  if (!realDb) {
    realDb = createClient({
      url: url,
      authToken: clean(process.env.TURSO_AUTH_TOKEN)
    });
  }
  return realDb;
}

async function withRetry(fn, maxRetries = 3) {
  let delay = 150;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const msg = String(err?.message || err || '');
      const isTransient = /502|503|504|SERVER_ERROR|FETCH_ERROR|network|timeout|econnreset|socket/i.test(msg);
      if (isTransient && attempt < maxRetries) {
        console.warn(`[db retry] Transient DB error (attempt ${attempt + 1}/${maxRetries}): ${msg}. Retrying in ${delay}ms...`);
        await new Promise((res) => setTimeout(res, delay));
        delay *= 2;
        continue;
      }
      throw err;
    }
  }
}

export const db = {
  execute(...args) {
    return withRetry(() => getRealDb().execute(...args));
  },
  batch(...args) {
    return withRetry(() => getRealDb().batch(...args));
  }
};

export function json(res, status = 200) {
  return new Response(JSON.stringify(res), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store, no-cache, must-revalidate, max-age=0',
      'pragma': 'no-cache',
      'expires': '0'
    }
  });
}

export function cleanStr(val) {
  return clean(val);
}
