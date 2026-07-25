/**
 * Admin Question Bank Management & Cloudinary Image Upload Helper
 */

export async function uploadImageToCloudinary(file, config = {}) {
  const cloudName = config.cloudName || window.APP_CONFIG?.CLOUDINARY_CLOUD_NAME || '';
  const uploadPreset = config.uploadPreset || window.APP_CONFIG?.CLOUDINARY_UPLOAD_PRESET || '';
  const uploadFolder = config.uploadFolder || window.APP_CONFIG?.CLOUDINARY_UPLOAD_FOLDER || 'learninghub/questions';
  const uploadUrl = config.uploadUrl || window.APP_CONFIG?.CLOUDINARY_UPLOAD_URL || (cloudName ? `https://api.cloudinary.com/v1_1/${cloudName}/image/upload` : '');

  if (!uploadUrl || !uploadPreset) {
    throw new Error('Thiếu cấu hình Cloudinary trong config.js.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', uploadFolder);

  const res = await fetch(uploadUrl, { method: 'POST', body: formData });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error?.message || 'Upload Cloudinary thất bại');
  }

  return {
    id: data.public_id,
    public_id: data.public_id,
    src: data.secure_url,
    url: data.secure_url,
    width: data.width,
    height: data.height,
    source: 'cloudinary'
  };
}

export function calculateQuestionErrorRisk(newQuestionText, answerStr, hasImagePlaceholder = false) {
  const text = String(newQuestionText || '');
  const needsImg = /(hình vẽ|hình bên|đồ thị|bảng biến thiên|sơ đồ)/gi.test(text);

  if (hasImagePlaceholder || (needsImg && !hasImagePlaceholder)) {
    return { risk: 'high', reason: 'Cần hình vẽ/ảnh minh họa nhưng chưa có ảnh thực tế' };
  } else if ((answerStr || '').length > 1) {
    return { risk: 'medium', reason: 'Câu chọn nhiều đáp án đúng, cần rà soát kỹ' };
  } else {
    return { risk: 'low', reason: null };
  }
}
