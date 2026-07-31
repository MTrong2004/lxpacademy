/**
 * Device detection helper for client-side device & OS identification.
 */

/*
  DEVICE_ID_AND_SUBJECT_PER_DEVICE_20260731
  Trước đây mỗi bản ghi thiết bị chỉ có chuỗi mô tả ("💻 Windows · Chrome"), mà
  api/controllers/profile.js khử trùng lặp THEO CHUỖI ĐÓ — nên hai máy tính khác
  nhau cùng Windows + Chrome gộp thành một dòng, và modal lịch sử thiết bị không
  có gì để in ngoài id TÀI KHOẢN (mọi dòng giống hệt nhau).
  Nay mỗi trình duyệt tự cấp một ID ngẫu nhiên, lưu vĩnh viễn ở localStorage và
  gửi kèm mọi POST /api/profile. Server khoá lịch sử theo ID này, đồng thời nhớ
  môn đang học CỦA TỪNG THIẾT BỊ (cột current_subject chỉ có một ô nên trước đây
  điện thoại và máy tính ghi đè lẫn nhau).
  Xoá localStorage = coi như thiết bị mới; đó là hành vi chấp nhận được, không
  dùng fingerprint để né việc đó.
*/
const DEVICE_ID_STORE = 'learninghub_device_id_v1';
const DEVICE_ID_RE = /^[A-Za-z0-9_-]{6,64}$/;

export function getDeviceId() {
  try {
    const saved = localStorage.getItem(DEVICE_ID_STORE) || '';
    if (DEVICE_ID_RE.test(saved)) return saved;
    const rnd =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID().replace(/-/g, '')
        : Math.random().toString(36).slice(2) + Date.now().toString(36);
    const id = ('dev' + rnd).slice(0, 40);
    localStorage.setItem(DEVICE_ID_STORE, id);
    return id;
  } catch (e) {
    // Chế độ riêng tư chặn localStorage: trả rỗng, server tự lùi về cách cũ (khoá theo chuỗi mô tả).
    return '';
  }
}

export function getDeviceTypeString() {
  const ua = (typeof navigator !== 'undefined' && navigator.userAgent) || '';
  let os = 'Máy tính';
  if (/iPhone|iPad|iPod/i.test(ua)) os = '📱 iOS';
  else if (/Android/i.test(ua)) os = '📱 Android';
  else if (/Macintosh|Mac OS X/i.test(ua)) os = '💻 Mac';
  else if (/Windows/i.test(ua)) os = '💻 Windows';
  else if (/Linux/i.test(ua)) os = '💻 Linux';

  let browser = '';
  if (/Chrome|CriOS/i.test(ua) && !/Edge|Edg/i.test(ua)) browser = 'Chrome';
  else if (/Safari/i.test(ua) && !/Chrome|CriOS/i.test(ua)) browser = 'Safari';
  else if (/Firefox|FxMo/i.test(ua)) browser = 'Firefox';
  else if (/Edge|Edg/i.test(ua)) browser = 'Edge';

  return browser ? `${os} · ${browser}` : os;
}
