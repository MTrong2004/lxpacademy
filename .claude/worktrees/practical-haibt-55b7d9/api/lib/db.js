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

export const db = {
  execute(...args) {
    return getRealDb().execute(...args);
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
