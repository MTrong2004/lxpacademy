/**
 * Learning Hub - Subject & Question Bank ZIP Import Module
 * Xử lý giải nén ZIP ở trình duyệt, bẫy bảo mật, validate JSON & ảnh,
 * tạo Blob Object URLs cho preview, upload Cloudinary giới hạn đồng thời (concurrency 3),
 * và nạp ngân hàng câu hỏi vào hệ thống thông qua giao diện Import chuẩn của Learning Hub.
 */

import JSZip from 'jszip';
import { esc } from './format.js';
import { LHState } from './state.js';
import { lhWarn } from '../core/log.js';

// Các giới hạn & hằng số bảo mật ZIP
const MAX_ZIP_SIZE = 30 * 1024 * 1024; // 30 MB
const MAX_ZIP_ENTRIES = 2000;
const MAX_UNCOMPRESSED_TOTAL = 100 * 1024 * 1024; // 100 MB
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB per image
const MAX_QUESTIONS_COUNT = 2000;

const ALLOWED_IMAGE_EXTS = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];
const DISALLOWED_EXTS = [
  '.exe',
  '.bat',
  '.cmd',
  '.sh',
  '.js',
  '.html',
  '.htm',
  '.svg',
  '.php',
  '.py',
  '.dll',
  '.vbs',
  '.msi',
  '.com',
  '.scr',
  '.jar',
];

// Lưu trữ các Object URL đã tạo để thu hồi khi đóng preview
let currentObjectUrls = [];
let currentZipImageBlobs = new Map(); // path -> { blob, url, size, mime }
let currentUploadedImageUrls = new Map(); // path -> cloudinaryUrl
let currentPreviewQuestions = [];

/**
 * Thu hồi toàn bộ Object URL đã tạo để tránh rò rỉ bộ nhớ
 */
export function revokeZipObjectUrls() {
  if (currentObjectUrls.length) {
    currentObjectUrls.forEach(url => {
      try {
        URL.revokeObjectURL(url);
      } catch (e) {
        lhWarn('subjectImport:revokeZipObjectUrls', e);
      }
    });
    currentObjectUrls = [];
  }
  currentZipImageBlobs.clear();
}

/**
 * Dọn dẹp trạng thái import khi hủy hoặc reset
 */
export function resetSubjectImportState() {
  revokeZipObjectUrls();
  currentUploadedImageUrls.clear();
  currentPreviewQuestions = [];
}

/**
 * Kiểm tra xem một đường dẫn file trong ZIP có an toàn không
 */
function isSafeZipPath(pathStr) {
  if (!pathStr || typeof pathStr !== 'string') return false;
  const normalized = pathStr.replace(/\\/g, '/');
  if (normalized.includes('../') || normalized.includes('./') || normalized.startsWith('/')) {
    return false;
  }
  if (/^[a-zA-Z]:/.test(normalized)) {
    return false;
  }
  const ext = normalized.slice(normalized.lastIndexOf('.')).toLowerCase();
  if (DISALLOWED_EXTS.includes(ext)) {
    return false;
  }
  return true;
}

/**
 * Đoán MIME type dựa trên phần mở rộng file
 */
function getMimeTypeFromExt(ext) {
  switch (ext.toLowerCase()) {
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.webp':
      return 'image/webp';
    case '.gif':
      return 'image/gif';
    default:
      return 'application/octet-stream';
  }
}

/**
 * Đọc file ZIP và trích xuất JSON + danh sách ảnh
 */
export async function readAndValidateZipFile(file) {
  resetSubjectImportState();

  if (!file) throw new Error('Chưa chọn file import.');
  const fileName = file.name || '';
  if (!fileName.toLowerCase().endsWith('.zip')) {
    throw new Error('Chỉ chấp nhận file định dạng .zip.');
  }
  if (file.size > MAX_ZIP_SIZE) {
    throw new Error(
      `Dung lượng file ZIP vượt quá giới hạn 30 MB (Hiện tại: ${(file.size / (1024 * 1024)).toFixed(1)} MB).`,
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  const entries = Object.keys(zip.files);
  if (entries.length > MAX_ZIP_ENTRIES) {
    throw new Error(`File ZIP chứa quá nhiều entry (${entries.length} > ${MAX_ZIP_ENTRIES}).`);
  }

  let totalUncompressedSize = 0;
  const jsonCandidates = [];
  const imageEntries = new Map();

  for (const entryPath of entries) {
    const zipObj = zip.files[entryPath];
    if (zipObj.dir) continue;

    if (!isSafeZipPath(entryPath)) {
      throw new Error(`Phát hiện đường dẫn không an toàn hoặc định dạng không cho phép trong ZIP: "${entryPath}".`);
    }

    const uncompressedSize = zipObj._data?.uncompressedSize || 0;
    totalUncompressedSize += uncompressedSize;
    if (totalUncompressedSize > MAX_UNCOMPRESSED_TOTAL) {
      throw new Error(`Tổng dung lượng sau giải nén vượt quá 100 MB.`);
    }

    const lowerPath = entryPath.toLowerCase();
    const fileNameOnly = lowerPath.split('/').pop();

    // Bỏ qua folder __MACOSX hoặc file hệ thống rác
    if (lowerPath.includes('__macosx/') || fileNameOnly.startsWith('._')) {
      continue;
    }

    // Bỏ qua conversion_report.json
    if (fileNameOnly === 'conversion_report.json') {
      continue;
    }

    if (fileNameOnly.endsWith('.json')) {
      jsonCandidates.push(entryPath);
    } else {
      const ext = fileNameOnly.slice(fileNameOnly.lastIndexOf('.'));
      if (ALLOWED_IMAGE_EXTS.includes(ext)) {
        if (uncompressedSize > MAX_IMAGE_SIZE) {
          throw new Error(`Ảnh "${entryPath}" vượt quá dung lượng tối đa 10 MB.`);
        }
        imageEntries.set(entryPath, zipObj);
        // Lưu cả đường dẫn chuẩn hóa
        const normPath = entryPath.replace(/^\/+/, '');
        if (normPath !== entryPath) {
          imageEntries.set(normPath, zipObj);
        }
      }
    }
  }

  if (jsonCandidates.length === 0) {
    throw new Error('Không tìm thấy file JSON câu hỏi chính trong file ZIP.');
  }

  let selectedJsonPath = null;
  if (jsonCandidates.length === 1) {
    selectedJsonPath = jsonCandidates[0];
  } else {
    // Ưu tiên file có hậu tố "_questions.json"
    const questionJsonMatches = jsonCandidates.filter(p => p.toLowerCase().endsWith('_questions.json'));
    if (questionJsonMatches.length === 1) {
      selectedJsonPath = questionJsonMatches[0];
    } else {
      return {
        needSelectJson: true,
        jsonCandidates,
        zipInstance: zip,
        imageEntriesCount: imageEntries.size,
        zipFile: file,
      };
    }
  }

  return await processSelectedJsonFromZip(zip, selectedJsonPath, imageEntries, file.name);
}

/**
 * Xử lý file JSON chính đã được xác định từ ZIP
 */
export async function processSelectedJsonFromZip(zip, jsonPath, imageEntries, zipFileName = '') {
  const jsonZipObj = zip.files[jsonPath];
  if (!jsonZipObj) throw new Error(`Không đọc được file JSON "${jsonPath}" trong ZIP.`);

  const jsonText = await jsonZipObj.async('text');
  let rawJson = null;
  try {
    rawJson = JSON.parse(jsonText);
  } catch (e) {
    throw new Error(`File JSON "${jsonPath}" bị sai cú pháp cấu trúc: ${e.message}`);
  }

  const rawQuestions = Array.isArray(rawJson) ? rawJson : Array.isArray(rawJson?.questions) ? rawJson.questions : null;
  if (!rawQuestions) {
    throw new Error('Dữ liệu JSON trong ZIP phải là một mảng (Array) danh sách câu hỏi.');
  }
  if (rawQuestions.length > MAX_QUESTIONS_COUNT) {
    throw new Error(`Số lượng câu hỏi trong file vượt quá giới hạn 2.000 câu (${rawQuestions.length} câu).`);
  }

  // Chuyển đổi các file ảnh trong ZIP thành Blob và Object URL cho Preview
  revokeZipObjectUrls();
  const imageEntriesMap = imageEntries || new Map();

  for (const [imgPath, zipObj] of imageEntriesMap.entries()) {
    try {
      const ext = imgPath.slice(imgPath.lastIndexOf('.')).toLowerCase();
      const mime = getMimeTypeFromExt(ext);
      const blob = await zipObj.async('blob');
      const blobWithType = new Blob([blob], { type: mime });
      const blobUrl = URL.createObjectURL(blobWithType);
      currentObjectUrls.push(blobUrl);

      const item = {
        blob: blobWithType,
        url: blobUrl,
        size: blob.size,
        mime,
        path: imgPath,
      };
      currentZipImageBlobs.set(imgPath, item);
      const cleanPath = imgPath.replace(/^\/+/, '');
      currentZipImageBlobs.set(cleanPath, item);
    } catch (err) {
      lhWarn('subjectImport:blobCreateError', imgPath, err);
    }
  }

  // Giai đoạn Mapping & Validation chi tiết từng câu hỏi
  const validatedQuestions = [];
  const usedNums = new Set();
  let expectedNum = 1;

  for (let i = 0; i < rawQuestions.length; i++) {
    const item = rawQuestions[i];
    const num = Number(item?.num) || i + 1;
    const questionText = String(item?.question || '').trim();
    const rawOptions =
      item?.options && typeof item.options === 'object' && !Array.isArray(item.options) ? item.options : {};
    let answer = item?.answer !== undefined && item?.answer !== null ? String(item.answer).trim().toUpperCase() : null;
    if (answer === '') answer = null;

    const rawImages = Array.isArray(item?.images) ? item.images : [];
    const errorRisk = String(item?.error_risk || 'low').toLowerCase();

    // Map options
    const cleanedOptions = {};
    for (const [k, v] of Object.entries(rawOptions)) {
      const optKey = String(k).trim().toUpperCase();
      cleanedOptions[optKey] = String(v || '').trim();
    }

    // Map images
    const mappedImages = [];
    for (const imgRef of rawImages) {
      const pathStr = typeof imgRef === 'string' ? imgRef.trim() : (imgRef?.src || imgRef?.url || '').trim();
      if (!pathStr) continue;

      let zipImg = currentZipImageBlobs.get(pathStr) || currentZipImageBlobs.get(pathStr.replace(/^\/+/, ''));
      if (!zipImg) {
        const baseName = pathStr.split('/').pop();
        for (const [k, v] of currentZipImageBlobs.entries()) {
          if (k.split('/').pop() === baseName) {
            zipImg = v;
            break;
          }
        }
      }

      if (zipImg) {
        mappedImages.push({
          rawPath: pathStr,
          zipPath: zipImg.path,
          src: zipImg.url,
          url: zipImg.url,
          previewUrl: zipImg.url,
          blob: zipImg.blob,
        });
      }
    }

    // Format answer_text
    let answerText = '';
    if (answer && cleanedOptions[answer]) {
      answerText = `${answer}. ${cleanedOptions[answer]}`;
    }

    validatedQuestions.push({
      num,
      question: questionText,
      options: cleanedOptions,
      answer: answer || '',
      answer_text: answerText,
      images: mappedImages,
      has_image: mappedImages.length > 0,
      error_risk: ['low', 'medium', 'high'].includes(errorRisk) ? errorRisk : 'low',
      error_risk_reason: item?.error_risk_reason || null,
    });
  }

  // Đoán mã môn từ tên ZIP hoặc file JSON
  let suggestedCode = '';
  const cleanZipName = zipFileName.replace(/_questions_import\.zip$/i, '').replace(/\.zip$/i, '');
  if (/^[A-Za-z0-9_]{2,20}$/.test(cleanZipName)) {
    suggestedCode = cleanZipName.toUpperCase();
  }

  currentPreviewQuestions = validatedQuestions;

  return {
    jsonPath,
    zipFileName,
    suggestedCode,
    questions: validatedQuestions,
  };
}

/**
 * Thao tác Upload ảnh lên Cloudinary đồng thời (concurrency = 3)
 */
export async function uploadZipImagesToCloudinary(onProgress) {
  const isMock = window.HOD_MOCK_MODE || new URLSearchParams(window.location.search).get('mock') === '1';

  // Gom toàn bộ ảnh độc nhất từ danh sách câu hỏi xem trước
  const uniqueImagesToUpload = new Map(); // zipPath -> blob
  currentPreviewQuestions.forEach(q => {
    if (q.images && q.images.length) {
      q.images.forEach(img => {
        const pathKey = img.zipPath || img.rawPath || img.src || '';
        if (img.blob && pathKey && !currentUploadedImageUrls.has(pathKey)) {
          uniqueImagesToUpload.set(pathKey, img.blob);
        }
      });
    }
  });

  const totalToUpload = uniqueImagesToUpload.size;
  let completedCount = 0;
  const failedUploads = new Map(); // zipPath -> error message

  if (totalToUpload === 0) {
    if (onProgress) onProgress(0, 0, 'Không có ảnh nào cần upload.');
    return { success: true, uploadedMap: currentUploadedImageUrls, failedMap: failedUploads };
  }

  const imageEntries = Array.from(uniqueImagesToUpload.entries());
  const CONCURRENCY = 3;
  let nextIndex = 0;

  async function uploadWorker() {
    while (nextIndex < imageEntries.length) {
      const currentIndex = nextIndex++;
      const [zipPath, blob] = imageEntries[currentIndex];
      const fileName = zipPath.split('/').pop() || 'image.png';

      try {
        let cloudinaryUrl = '';
        if (isMock) {
          await new Promise(r => setTimeout(r, 150));
          cloudinaryUrl = `https://res.cloudinary.com/mock/image/upload/v1234567890/learninghub/mock_${fileName}`;
        } else {
          const uploader = window.__LHUploadCloudinary;
          if (!uploader) throw new Error('Hàm upload Cloudinary (window.__LHUploadCloudinary) chưa sẵn sàng.');
          const res = await uploader(blob, fileName);
          cloudinaryUrl = res?.src || res?.url || res?.secure_url || '';
          if (!cloudinaryUrl) throw new Error('API Cloudinary không trả về URL ảnh.');
        }

        currentUploadedImageUrls.set(zipPath, cloudinaryUrl);
      } catch (err) {
        failedUploads.set(zipPath, err.message || 'Lỗi upload Cloudinary.');
        lhWarn('subjectImport:uploadError', zipPath, err);
      } finally {
        completedCount++;
        if (onProgress) {
          onProgress(completedCount, totalToUpload, `Đang upload ${completedCount}/${totalToUpload} ảnh...`);
        }
      }
    }
  }

  const workers = Array.from({ length: Math.min(CONCURRENCY, totalToUpload) }, () => uploadWorker());
  await Promise.all(workers);

  const hasFailures = failedUploads.size > 0;
  return {
    success: !hasFailures,
    uploadedMap: currentUploadedImageUrls,
    failedMap: failedUploads,
  };
}

/**
 * Chuẩn bị dữ liệu câu hỏi trước khi lưu (Tự động upload ảnh ZIP còn tồn đọng lên Cloudinary)
 */
export async function prepareZipQuestionsBeforeSave(questions, onProgress) {
  if (!questions || !questions.length) return questions;

  let needsUpload = false;
  questions.forEach(q => {
    if (q.images && q.images.length) {
      q.images.forEach(img => {
        if (img && (img.blob || img.zipPath || (typeof img.src === 'string' && img.src.startsWith('blob:')))) {
          needsUpload = true;
        }
      });
    }
  });

  if (!needsUpload) return questions;

  const uploadRes = await uploadZipImagesToCloudinary(onProgress);
  if (!uploadRes.success) {
    const failedNames = Array.from(uploadRes.failedMap.keys()).join(', ');
    throw new Error(`Upload một số ảnh lên Cloudinary thất bại: ${failedNames}. Vui lòng thử lại.`);
  }

  // Update questions array with Cloudinary URLs
  questions.forEach(q => {
    if (q.images && q.images.length) {
      const finalImgs = [];
      q.images.forEach(img => {
        const pathKey = img.zipPath || img.rawPath || img.path || '';
        const cloudUrl = uploadRes.uploadedMap.get(pathKey) || (typeof img === 'string' ? img : img.src || img.url);
        if (cloudUrl && !cloudUrl.startsWith('blob:')) {
          finalImgs.push({ src: cloudUrl, url: cloudUrl });
        }
      });
      q.images = finalImgs;
      q.has_image = finalImgs.length > 0;
    }
  });

  return questions;
}
