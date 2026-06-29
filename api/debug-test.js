import { json } from './_db.js';

export default async function handler() {
  return json({
    url: process.env.TURSO_DATABASE_URL,
    token: process.env.TURSO_AUTH_TOKEN
  });
}
