/**
 * Device detection helper for client-side device & OS identification.
 */

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
