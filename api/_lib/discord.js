/*
  DISCORD_NOTIFICATION_TOGGLES_20260729

  Trước đây mỗi controller có một bản `postDiscordEmbed` riêng và gửi vô điều kiện, nên
  không có cách nào tắt bớt loại thông báo mà không sửa code. Nay:
    - Webhook URL vẫn CHỈ đọc từ env DISCORD_WEBHOOK_URL (không đưa ra client, không đổi).
    - Bật/tắt theo từng loại, lưu ở site_settings key 'discord_notifications'.
    - Chỉ admin hệ thống đổi được (chặn ở api/controllers/admin.js).

  Thêm loại mới: khai báo trong DISCORD_NOTIFICATION_KINDS rồi truyền đúng `kind` khi gọi
  postDiscordEmbed — trang admin tự sinh công tắc theo danh sách này.
*/
import { db } from './db.js';

export const SETTINGS_KEY = 'discord_notifications';

/** Danh sách loại thông báo + mặc định. Trang admin đọc đúng mảng này để vẽ công tắc. */
export const DISCORD_NOTIFICATION_KINDS = [
  {
    key: 'login',
    label: 'Đăng nhập',
    description: 'Có người đăng nhập web học hoặc trang admin.',
    default: true
  },
  {
    key: 'action',
    label: 'Hành động của admin / editor',
    description: 'Duyệt, từ chối, block, đổi vai trò, xoá môn… mỗi thao tác một tin.',
    default: true
  },
  {
    key: 'edit_request',
    label: 'Yêu cầu sửa câu hỏi',
    description: 'Người học gửi báo cáo / đề xuất sửa một câu hỏi.',
    default: true
  },
  {
    key: 'question_edit',
    label: 'Nội dung câu hỏi bị đổi (admin thường / editor)',
    description:
      'Admin thường hoặc editor thêm / sửa / xoá / ẩn một câu hỏi, kể cả khi duyệt yêu cầu sửa. ' +
      'Thao tác của admin hệ thống KHÔNG gửi tin (đỡ tự báo cho chính mình).',
    default: true
  },
  {
    key: 'new_user',
    label: 'Người dùng mới đăng ký',
    description: 'Có tài khoản Google mới vào hệ thống — kèm trạng thái chờ duyệt hay được duyệt tự động.',
    default: true
  },
  {
    key: 'role_change',
    label: 'Đổi quyền / khoá người dùng',
    description: 'Cấp hoặc gỡ admin / editor, khoá – mở khoá, duyệt – từ chối – thu hồi duyệt tài khoản.',
    default: true
  },
  {
    key: 'destructive',
    label: 'Thao tác nặng trên môn học (xoá / đổi mã)',
    description: 'Xoá môn, xoá vĩnh viễn môn kèm toàn bộ câu hỏi, đổi mã môn.',
    default: true
  },
  {
    key: 'subject_request',
    label: 'Yêu cầu thêm môn của người học',
    description: 'Người học gửi một môn mới chờ admin duyệt.',
    default: true
  },
  {
    key: 'server_error',
    label: 'Lỗi server (500)',
    description:
      'API ném exception (trả 500 INTERNAL_ERROR). Cùng một lỗi chỉ gửi 1 tin mỗi 5 phút, ' +
      'lần gửi sau kèm số lần đã bị dồn — tránh spam khi lỗi lặp liên tục.',
    default: true
  }
];

export function defaultDiscordSettings() {
  const out = {};
  for (const k of DISCORD_NOTIFICATION_KINDS) out[k.key] = k.default;
  return out;
}

/** Chỉ nhận đúng các khoá đã khai báo, giá trị luôn là boolean. */
export function normalizeDiscordSettings(raw) {
  let obj = raw;
  if (typeof obj === 'string') {
    try {
      obj = JSON.parse(obj);
    } catch (e) {
      obj = null;
    }
  }
  const out = defaultDiscordSettings();
  if (obj && typeof obj === 'object') {
    for (const k of DISCORD_NOTIFICATION_KINDS) {
      if (Object.prototype.hasOwnProperty.call(obj, k.key)) out[k.key] = !!obj[k.key];
    }
  }
  return out;
}

// Cache ngắn: mỗi lần đăng nhập / mỗi hành động admin đều hỏi bảng này, không cần đọc lại
// liên tục. 30s đủ để bật/tắt có hiệu lực gần như tức thì mà không tốn reads.
let _cache = null;
let _cacheAt = 0;
const _TTL = 30 * 1000;

export function clearDiscordSettingsCache() {
  _cache = null;
  _cacheAt = 0;
}

export async function getDiscordSettings() {
  if (_cache && Date.now() - _cacheAt < _TTL) return _cache;
  let value = null;
  try {
    const r = await db.execute({
      sql: 'select value from site_settings where key = ?',
      args: [SETTINGS_KEY]
    });
    value = r.rows?.[0]?.value ?? null;
  } catch (e) {
    console.warn('[discord settings] không đọc được site_settings:', e?.message || e);
  }
  _cache = normalizeDiscordSettings(value);
  _cacheAt = Date.now();
  return _cache;
}

export async function saveDiscordSettings(raw) {
  const next = normalizeDiscordSettings(raw);
  await db.execute({
    sql: `insert into site_settings (key, value, updated_at) values (?, ?, ?)
          on conflict(key) do update set value = excluded.value, updated_at = excluded.updated_at`,
    args: [SETTINGS_KEY, JSON.stringify(next), new Date().toISOString()]
  });
  clearDiscordSettingsCache();
  return next;
}

function webhookUrl() {
  return (process.env.DISCORD_WEBHOOK_URL || '').trim().replace(/(^['"]|['"]$)/g, '');
}

/**
 * Gửi một embed lên Discord nếu loại thông báo đó đang được bật.
 * @param {object} embed  payload embed của Discord.
 * @param {string} kind   một trong DISCORD_NOTIFICATION_KINDS.key.
 * @returns {Promise<boolean>} true nếu đã gửi, false nếu bị tắt / thiếu webhook / lỗi.
 */
export async function postDiscordEmbed(embed, kind) {
  const url = webhookUrl();
  if (!url) return false;
  if (kind) {
    const settings = await getDiscordSettings();
    if (settings[kind] === false) return false;
  }
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] })
    });
    return true;
  } catch (e) {
    console.warn('Discord notify failed:', e);
    return false;
  }
}

/*
  SERVER_ERROR_DISCORD_20260729
  Lỗi 500 hay đi thành chùm (một bug + F5 vài lần + polling 60s = hàng chục tin giống nhau),
  nên gộp: mỗi "chữ ký lỗi" (endpoint + thông điệp) chỉ gửi 1 tin mỗi 5 phút, những lần bị
  dồn được đếm lại và báo kèm ở tin kế tiếp.

  Lưu ý cùng bản chất với các cache khác trong dự án: Map này là biến module trong MỘT
  isolate. Isolate khác vẫn có thể gửi thêm một tin cho cùng lỗi — chấp nhận được, vì mục
  tiêu là chặn chùm hàng chục tin, không phải bảo đảm đúng-một-tin.
*/
const _errThrottle = new Map();
const _ERR_TTL = 5 * 60 * 1000;
const _ERR_MAX_KEYS = 50;

export async function postServerErrorEmbed(path, err) {
  const msg = String(err?.message || err || 'Không có thông điệp').slice(0, 400);
  const key = `${path}|${msg}`;
  const prev = _errThrottle.get(key);
  const nowMs = Date.now();
  if (prev && nowMs - prev.at < _ERR_TTL) {
    prev.skipped += 1;
    return false;
  }
  const skipped = prev?.skipped || 0;
  // Đừng để Map phình vô hạn khi thông điệp lỗi có id/thời gian thay đổi liên tục.
  if (_errThrottle.size >= _ERR_MAX_KEYS) _errThrottle.clear();
  _errThrottle.set(key, { at: nowMs, skipped: 0 });

  const fields = [
    { name: 'Endpoint', value: `\`/api/${path || '?'}\``, inline: true },
    {
      name: 'Thời gian',
      value: new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
      inline: true
    },
    { name: 'Thông điệp', value: `\`\`\`${msg}\`\`\``, inline: false }
  ];
  if (skipped > 0) {
    fields.push({ name: 'Đã dồn', value: `${skipped} lần giống hệt trong 5 phút trước`, inline: false });
  }

  return postDiscordEmbed(
    {
      title: '🔥 LỖI SERVER 500',
      color: 14431557,
      description: 'API ném exception. Chi tiết stack nằm trong log Vercel / log `npm run dev`.',
      fields,
      footer: { text: 'Learning Hub · Lỗi hệ thống' },
      timestamp: new Date().toISOString()
    },
    'server_error'
  );
}
