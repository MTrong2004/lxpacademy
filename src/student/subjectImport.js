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

// Exported installation functions for appCore integration
export function installAddSubjectFeature() {
  // ===== ADD_SUBJECT_FEATURE_20260625 (UPGRADED TAB UX/UI) =====
  (function () {
    const HUB_URL = window.APP_CONFIG?.SUPABASE_URL || '';
    const HUB_KEY = window.APP_CONFIG?.SUPABASE_ANON_KEY || '';
    const $ = id => document.getElementById(id);
    let supa = null;
    function client() {
      if (!window.supabase) return null;
      if (!supa) supa = window.supabase.createClient(HUB_URL, HUB_KEY);
      return supa;
    }
    function esc2(s) {
      return String(s ?? '').replace(
        /[&<>"']/g,
        c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
      );
    }

    function isLoggedIn() {
      return !!window.HODSupabase?.getUser?.();
    }
    function isAdminOrEditor() {
      const p = window.HODSupabase?.getProfile?.() || null;
      const role = String(p?.role || '').toLowerCase();
      return (
        isLoggedIn() &&
        (role === 'admin' || role === 'editor') &&
        !(p?.blocked || p?.is_blocked || p?.status === 'blocked')
      );
    }
    function canAdd() {
      const p = window.HODSupabase?.getProfile?.() || null;
      return isLoggedIn() && !(p?.blocked || p?.is_blocked || p?.status === 'blocked');
    }

    // Tiêm CSS động cho cấu trúc Tab mới trong bảng Chọn môn học
    function injectStyles() {
      let style = $('subjectTabsStyle');
      if (!style) {
        style = document.createElement('style');
        style.id = 'subjectTabsStyle';
        document.head.appendChild(style);
      }
      style.textContent = `
      .subjectGateTabs {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        margin: -5px 0 0 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        padding-bottom: 8px;
        flex-wrap: wrap;
      }
      body .polishedSubjectPanel > #subjectList {
        margin-top: -8px !important;
        padding-top: 12px !important;
      }
      body .polishedSubjectPanel > #subjectList.inFolder {
        margin-top: -10px !important;
        padding-top: 4px !important;
      }
      body .polishedSubjectPanel > #subjectList.inFolder .subjectFolderBar {
        margin-top: 0 !important;
      }
      body .polishedSubjectPanel .subjectGateFooter {
        margin-top: 4px !important;
        padding: 8px 14px !important;
        border-radius: 16px !important;
      }
      body .polishedSubjectPanel .subjectSelectedBox {
        padding: 2px 0 2px 42px !important;
      }
      body .polishedSubjectPanel .subjectSelectedBox::before {
        width: 28px !important;
        height: 28px !important;
        border-radius: 10px !important;
      }
      body .polishedSubjectPanel .subjectSelectedBox span {
        font-size: 0.68rem !important;
      }
      body .polishedSubjectPanel .subjectSelectedBox b,
      body .polishedSubjectPanel .subjectSelectedBox strong {
        font-size: 0.95rem !important;
      }
      body .polishedSubjectPanel #subjectEnter {
        height: 42px !important;
        min-height: 42px !important;
        border-radius: 12px !important;
        padding: 0 20px !important;
        font-size: 0.88rem !important;
      }
      .subjectGateTabsLeft {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .subjectGateTab {
        background: none;
        border: none;
        color: var(--mist, #a0aec0);
        padding: 10px 18px;
        font-size: 0.9rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        cursor: pointer;
        transition: all 0.2s ease;
        border-bottom: 2px solid transparent;
        margin-bottom: -1px;
      }
      .subjectGateTab.active {
        color: var(--gold, #e8d4a8);
        border-bottom: 2px solid var(--gold, #e8d4a8);
      }
      #subjectGateTabAdd {
        position: relative;
        overflow: hidden;
        background: rgba(200, 169, 110, 0.07);
        border: 1px solid rgba(232, 212, 168, 0.3);
        border-radius: 999px;
        padding: 7px 18px;
        color: var(--gold, #e8d4a8);
        font-size: 0.88rem;
        font-weight: 750;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        cursor: pointer;
        transition: all 0.25s ease;
      }
      #subjectGateTabAdd::before {
        content: '';
        position: absolute;
        top: 0;
        left: -110%;
        width: 100%;
        height: 100%;
        background: linear-gradient(
          120deg,
          transparent 0%,
          rgba(255, 235, 180, 0) 25%,
          rgba(255, 235, 180, 0.45) 46%,
          rgba(255, 255, 255, 0.85) 50%,
          rgba(255, 235, 180, 0.45) 54%,
          transparent 75%
        );
        animation: glitterShimmer 2.8s infinite ease-in-out;
        pointer-events: none;
      }
      #subjectGateTabAdd:hover {
        background: rgba(200, 169, 110, 0.15);
        border-color: rgba(232, 212, 168, 0.65);
        color: #fff;
        box-shadow: 0 0 14px rgba(232, 212, 168, 0.25);
      }
      #subjectGateTabAdd.active {
        color: var(--gold, #e8d4a8);
        border: 1px solid var(--gold, #e8d4a8);
        background: rgba(200, 169, 110, 0.2);
        box-shadow: 0 0 16px rgba(232, 212, 168, 0.35);
      }
      @keyframes glitterShimmer {
        0% { left: -110%; }
        32% { left: 140%; }
        100% { left: 140%; }
      }
      .subjectGateSearchWrap {
        flex: 1;
        min-width: 220px;
        max-width: 480px;
        display: flex;
        align-items: center;
      }
      .subjectGateSearchWrap input, #subjectSearch {
        width: 100%;
        background: rgba(0, 0, 0, 0.25);
        border: 1px solid rgba(200, 169, 110, 0.22);
        border-radius: 12px;
        padding: 8px 16px;
        color: #fff;
        font-size: 0.88rem;
        outline: none;
        transition: all 0.2s ease;
      }
      .subjectGateSearchWrap input:focus, #subjectSearch:focus {
        border-color: var(--gold2, #e8d4a8);
        box-shadow: 0 0 12px rgba(232, 212, 168, 0.2);
        background: rgba(0, 0, 0, 0.4);
      }
      .userAddSubjectWrap {
        animation: fadeInPane 0.25s ease-out;
        padding-top: 5px;
      }
      @keyframes fadeInPane {
        from { opacity: 0; transform: translateY(6px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `;
    }

    // Hàm chuyển đổi Tab thông minh chuyên biệt
    window.__switchSubjectGateTab = function (mode) {
      const isAdd = mode === 'add';
      localStorage.setItem('learninghub_subject_gate_tab_v1', mode);

      // Cập nhật trạng thái Active trên nút bấm Tab
      document.querySelectorAll('.subjectGateTab').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.sgtab === mode);
      });

      // Ẩn/Hiện toàn bộ các thành phần thuộc danh sách môn học cũ
      const listElements = [
        document.querySelector('.subjectGateSubline'),
        document.querySelector('.subjectGateTools'),
        $('subjectGateSearchWrap'),
        // SUBJECT_FOLDER_BAR_IN_TABS_20260729: thanh thư mục nay nằm TRONG hàng tab, nên phải
        // nằm trong danh sách ẩn/hiện này — không thì "← Tất cả môn" còn nổi ở tab Thêm môn mới.
        $('subjectFolderCrumb'),
        $('subjectFolderCrumbMeta'),
        $('subjectList'),
        $('subjectLoading'),
        $('subjectError'),
        $('subjectEmpty'),
        document.querySelector('.subjectGateFooter'),
      ];

      listElements.forEach(el => {
        if (el) el.style.setProperty('display', isAdd ? 'none' : '', isAdd ? 'important' : '');
      });

      // Quản lý Pane nội dung Form thêm môn học
      const form = $('addSubjectForm');
      if (form) {
        form.classList.toggle('hidden', !isAdd);
        if (isAdd) {
          form.innerHTML = getAddSubjectHTML();
          parsedQuestions = [];
          restoreAddSubjectState();
        }
      }
    };

    // Khởi tạo thanh Tab điều hướng nằm dưới Header Chọn môn học
    function ensureSubjectGateTabs() {
      const panel = document.querySelector('.polishedSubjectPanel');
      const header = document.querySelector('.subjectGateHeader');
      if (!panel || !header || $('subjectGateTabsBar')) return;

      injectStyles();

      const tabsBar = document.createElement('div');
      tabsBar.id = 'subjectGateTabsBar';
      tabsBar.className = 'subjectGateTabs';
      tabsBar.innerHTML = `
      <div class="subjectGateTabsLeft">
        <button type="button" class="subjectGateTab active" data-sgtab="list">Danh sách môn học</button>
        <button type="button" class="subjectGateTab" id="subjectGateTabAdd" data-sgtab="add" style="display:none;">Thêm môn mới</button>
      </div>
      <div class="subjectGateSearchWrap" id="subjectGateSearchWrap"></div>
    `;

      header.insertAdjacentElement('afterend', tabsBar);

      // Di chuyển ô tìm kiếm vào thanh Tab
      const searchInput = $('subjectSearch');
      const searchWrap = $('subjectGateSearchWrap');
      if (searchInput && searchWrap) {
        searchWrap.appendChild(searchInput);
      }
      const searchTools = document.querySelector('.subjectGateTools');
      if (searchTools) searchTools.style.display = 'none';

      // Bỏ nút + Thêm môn cũ bên phải ô tìm kiếm
      const addBtn = $('addSubjectBtn');
      if (addBtn) addBtn.remove();

      tabsBar.querySelectorAll('.subjectGateTab').forEach(btn => {
        btn.onclick = () => window.__switchSubjectGateTab(btn.dataset.sgtab);
      });

      const savedTab = localStorage.getItem('learninghub_subject_gate_tab_v1') || 'list';
      if (savedTab === 'add' && canAdd()) {
        window.__switchSubjectGateTab('add');
      } else {
        window.__switchSubjectGateTab('list');
      }
    }

    function showAddBtn() {
      ensureSubjectGateTabs();
      const btn = $('addSubjectBtn');
      const tabBtn = $('subjectGateTabAdd');
      const allowed = canAdd();
      if (btn) btn.classList.toggle('hidden', !allowed);

      const note = $('userApprovalNote');
      if (note) {
        note.style.setProperty('display', allowed && !isAdminOrEditor() ? 'block' : 'none', 'important');
      }

      if (tabBtn) {
        const wasHidden = tabBtn.style.display === 'none';
        tabBtn.style.display = allowed ? 'block' : 'none';
        if (allowed && wasHidden) {
          const savedTab = localStorage.getItem('learninghub_subject_gate_tab_v1') || 'list';
          if (savedTab === 'add') {
            window.__switchSubjectGateTab('add');
          }
        }
      }
    }

    const AI_PROMPT = `Bạn là trợ lý chuyển đổi ngân hàng câu hỏi trắc nghiệm sang JSON trong file Markdown.

ĐỌC FILE và chuyển đổi NGUYÊN VẸN (KHÔNG tự biên thêm, KHÔNG bỏ bớt).

QUY TẮC BATCH:

- Sau mỗi batch DỪNG và nói: "Gõ 'tiếp' để xuất câu X-Y."
- Khi nhận "tiếp", xuất batch tiếp theo, đánh số "num" liên tục.
- Mỗi batch xuất 1 file .md hoàn chỉnh, tải được ngay.

QUY TẮC CHUYỂN ĐỔI:
- Đáp án: chỉ lấy ký tự chữ cái đầu tiên sau "**Đáp án:**" (bỏ mọi chú thích phía sau).
- Nếu câu chỉ có A/B/C (không có D): bỏ key "D" khỏi object options.
- Giữ NGUYÊN nội dung câu hỏi và lựa chọn, KHÔNG paraphrase.
- "has_image": false (trừ khi câu đề cập hình ảnh/biểu đồ).
- "error_risk": "low" (câu ngắn, rõ) | "medium" (câu trung bình) | "high" (câu dài, phức tạp, dễ nhầm).

FORMAT FILE .MD OUTPUT:
---
# [Tên môn] - Batch [N] (Câu [X]-[Y])
> Xuất ngày: [ngày hôm nay] | Tổng: [số câu trong batch] câu
---

\`\`\`json
[
  {
    "num": 1,
    "question": "…?",
    "options": {
      "A": "…",
      "B": "…",
      "C": "…",
      "D": "…"
    },
    "answer": "B",
    "images": [],
    "has_image": false,
    "error_risk": "low"
  }
]
\`\`\`
---

KHÔNG thêm bất kỳ text giải thích nào bên ngoài cấu trúc trên.
Bắt đầu ngay từ câu 1.`;

    window.__ADD_SUBJECT_AI_PROMPT = AI_PROMPT;
    let parsedQuestions = [];

    function clearAddSubjectLocalStorage() {
      localStorage.removeItem('learninghub_add_subject_code_v1');
      localStorage.removeItem('learninghub_add_subject_name_v1');
      localStorage.removeItem('learninghub_add_subject_desc_v1');
      localStorage.removeItem('learninghub_add_subject_step_v1');
      localStorage.removeItem('learninghub_add_subject_file_name_v1');
      localStorage.removeItem('learninghub_add_subject_file_size_v1');
      localStorage.removeItem('learninghub_add_subject_file_data_v1');
      localStorage.removeItem('learninghub_add_subject_file_previewed_v1');
    }

    function restoreAddSubjectState() {
      const code = localStorage.getItem('learninghub_add_subject_code_v1') || '';
      const name = localStorage.getItem('learninghub_add_subject_name_v1') || '';
      const desc = localStorage.getItem('learninghub_add_subject_desc_v1') || '';
      const savedStep = parseInt(localStorage.getItem('learninghub_add_subject_step_v1') || '1');

      const codeInp = $('addSubjectCode');
      const nameInp = $('addSubjectName');
      const descInp = $('addSubjectDesc');

      if (codeInp) codeInp.value = code;
      if (nameInp) nameInp.value = name;
      if (descInp) descInp.value = desc;

      codeInp?.addEventListener('input', function () {
        this.value = this.value.toUpperCase().replace(/[^A-Z0-9_]/g, '');
        localStorage.setItem('learninghub_add_subject_code_v1', this.value);
      });
      nameInp?.addEventListener('input', function () {
        localStorage.setItem('learninghub_add_subject_name_v1', this.value);
      });
      // SUBJECT_DESC_LIMIT_20260728: 160 ký tự là đúng chỗ thẻ môn hiện được (.subjectCardDesc kẹp
      // 3 dòng). Trước đây form cho gõ 300 nhưng thẻ chỉ hiện ~110 nên phần dư mất hẳn.
      const syncDescCount = () => {
        const el = $('addSubjectDescCount');
        if (!el || !descInp) return;
        const n = descInp.value.length;
        el.textContent = n + '/160';
        el.classList.toggle('nearLimit', n >= 140 && n <= 160);
        el.classList.toggle('overLimit', n > 160);
      };
      syncDescCount();
      descInp?.addEventListener('input', function () {
        localStorage.setItem('learninghub_add_subject_desc_v1', this.value);
        syncDescCount();
      });

      const fileName = localStorage.getItem('learninghub_add_subject_file_name_v1');
      const fileSize = localStorage.getItem('learninghub_add_subject_file_size_v1');
      const fileData = localStorage.getItem('learninghub_add_subject_file_data_v1');

      if (fileName && fileData) {
        if ($('userImportData')) $('userImportData').value = fileData;
        const dropZone = $('importDropZone');
        const card = $('userImportFileCard');
        const nameEl = $('userImportFileName');
        const metaEl = $('userImportFileMeta');
        if (dropZone) dropZone.classList.add('hidden');
        if (card) card.classList.remove('hidden');
        if (nameEl) nameEl.textContent = fileName;
        if (metaEl)
          metaEl.textContent = Math.max(1, Math.round(parseInt(fileSize || '0') / 1024)) + ' KB · Sẵn sàng xem trước';
        const pv = $('previewImportBtn');
        if (pv) {
          pv.classList.remove('hidden');
          pv.disabled = false;
        }

        const wasPreviewed = localStorage.getItem('learninghub_add_subject_file_previewed_v1') === 'true';
        if (wasPreviewed) {
          setTimeout(() => {
            if (typeof window.__previewUserImport === 'function') {
              window.__previewUserImport();
            }
          }, 100);
        }
      }

      $('userImportFile')?.addEventListener('change', handleFileImport);

      if (savedStep > 1 && code && name) {
        setTimeout(() => {
          window.__switchStep(savedStep);
        }, 50);
      }
    }

    // MÃ MỚI: Giao diện form chia 3 bước (Stepper)
    function getAddSubjectHTML() {
      return `<div class="userAddSubjectWrap">
      <div class="subject-stepper" id="subjectStepper">
        <div class="step active" data-step="1"><span>1</span> Thông tin</div>
        <div class="step-line"></div>
        <div class="step" data-step="2"><span>2</span> Lấy Prompt</div>
        <div class="step-line"></div>
        <div class="step" data-step="3"><span>3</span> Import</div>
      </div>

      <div id="addStep1" class="add-step-content active">
        <div class="addSubjectFields">
          <div class="addSubjectField">
            <label>Mã môn <span class="req">*</span></label>
            <input id="addSubjectCode" type="text" placeholder="VD: ABC123" maxlength="20">
          </div>
          <div class="addSubjectField">
            <label>Tên môn <span class="req">*</span></label>
            <input id="addSubjectName" type="text" placeholder="VD: Tên môn học" maxlength="100">
          </div>
          <div class="addSubjectField full">
            <label>Mô tả ngắn <span class="descCounter" id="addSubjectDescCount">0/160</span></label>
            <textarea id="addSubjectDesc" placeholder="Mô tả môn học..." rows="2" maxlength="160"></textarea>
          </div>
        </div>
        <div class="step-actions right">
          <button class="primary" type="button" onclick="window.__switchStep(2)">Tiếp tục ➔</button>
        </div>
      </div>

      <div id="addStep2" class="add-step-content">
        <div class="aiStepCard" style="margin-bottom:0;">
          <p>Copy prompt dưới đây và dán vào AI (Gemini/ChatGPT/Claude) kèm theo tài liệu môn học của bạn.</p>
        </div>
        
        <div class="aiPromptActions">
          <button class="aiCopyBtn" type="button" onclick="window.__copyUserAIPrompt()" id="btnCopyPrompt">📋 Sao chép prompt</button>
          <button class="aiViewPromptBtn" type="button" onclick="window.__openUserAIPromptModal()" id="btnViewPrompt">👁 Xem prompt</button>
        </div>

        <div class="aiToolLinks" style="margin-bottom: 25px;">
          <a href="https://gemini.google.com" target="_blank" class="aiToolBtn gemini">✦ Gemini</a>
          <a href="https://chatgpt.com" target="_blank" class="aiToolBtn chatgpt">◉ ChatGPT</a>
          <a href="https://claude.ai" target="_blank" class="aiToolBtn claude">◈ Claude</a>
        </div>

        <div class="step-actions">
          <button class="btn" type="button" onclick="window.__switchStep(1)">⬅ Quay lại</button>
          <button class="primary" type="button" onclick="window.__switchStep(3)">Đã có file, Tiếp tục ➔</button>
        </div>
      </div>

      <div id="addStep3" class="add-step-content">
        <div class="importUnifiedBox">
          <div class="userFileInputWrap" id="importDropZone" onclick="document.getElementById('userImportFile').click()">
            <span class="icon">☁️</span>
            <p><b>Kéo thả file .json hoặc .zip (gồm JSON & hình ảnh) vào đây</b><br><span style="font-size:0.85rem; opacity:0.6;">Hoặc bấm để chọn file từ máy (.json, .zip, .md, .txt)</span></p>
            <input type="file" id="userImportFile" accept=".json,.zip,.md,.txt" style="display:none;">
          </div>

          <textarea id="userImportData" class="hiddenImportData" aria-hidden="true"></textarea>
          <div id="userImportFileCard" class="userImportFileCard hidden">
            <div class="fileIcon">📄</div>
            <div class="fileInfo">
              <b id="userImportFileName">Chưa chọn file</b>
              <span id="userImportFileMeta">File import câu hỏi</span>
            </div>
            <button class="removeFileBtn" type="button" onclick="window.__clearUserImportFile()">Xóa file</button>
          </div>

          <div class="step-actions importStepActions">
            <button class="btn" type="button" onclick="window.__switchStep(2)">⬅ Quay lại</button>
            <div>
              <button class="btn previewImportBtn hidden" type="button" id="previewImportBtn" onclick="window.__previewUserImport()">Xem trước</button>
              <button class="primary" type="button" id="userImportBtn" onclick="window.__submitSubjectRequest()" disabled>Lưu Môn Học</button>
            </div>
          </div>
        </div>
      </div>
      
      <div class="userApprovalNote" id="userApprovalNote" style="margin-top:15px; display:none;">⏳ Yêu cầu sẽ được gửi cho admin duyệt trước.</div>
    </div>`;
    }

    // Logic chuyển bước & Khởi tạo tính năng kéo thả
    window.__switchStep = function (step) {
      // Bắt buộc nhập mã môn + tên môn trước khi qua bước 2 (Prompt)
      if (step >= 2) {
        const code = (document.getElementById('addSubjectCode')?.value || '').trim();
        const name = (document.getElementById('addSubjectName')?.value || '').trim();
        if (!code) {
          alert('Vui lòng nhập mã môn trước khi tiếp tục.');
          document.getElementById('addSubjectCode')?.focus();
          return;
        }
        if (!name) {
          alert('Vui lòng nhập tên môn trước khi tiếp tục.');
          document.getElementById('addSubjectName')?.focus();
          return;
        }
      }

      localStorage.setItem('learninghub_add_subject_step_v1', step);

      // Ẩn tất cả các bước
      document.querySelectorAll('.add-step-content').forEach(el => el.classList.remove('active'));
      // Hiện bước hiện tại
      const target = document.getElementById('addStep' + step);
      if (target) target.classList.add('active');

      // Đổi màu thanh tiến trình
      document.querySelectorAll('.subject-stepper .step').forEach(el => {
        const s = parseInt(el.getAttribute('data-step'));
        if (s <= step) el.classList.add('active');
        else el.classList.remove('active');
      });

      // Kích hoạt tính năng kéo thả file ở Bước 3
      if (step === 3 && !window._dropZoneInit) {
        const dropZone = document.getElementById('importDropZone');
        const fileInput = document.getElementById('userImportFile');
        if (dropZone && fileInput) {
          ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evt => {
            dropZone.addEventListener(
              evt,
              e => {
                e.preventDefault();
                e.stopPropagation();
              },
              false,
            );
          });
          ['dragenter', 'dragover'].forEach(evt => {
            dropZone.addEventListener(evt, () => dropZone.classList.add('dragover'), false);
          });
          ['dragleave', 'drop'].forEach(evt => {
            dropZone.addEventListener(evt, () => dropZone.classList.remove('dragover'), false);
          });
          dropZone.addEventListener(
            'drop',
            e => {
              const dt = e.dataTransfer;
              if (dt.files && dt.files.length) {
                const one = new DataTransfer();
                one.items.add(dt.files[0]);
                fileInput.files = one.files;
                fileInput.dispatchEvent(new Event('change')); // Gọi hàm đọc file
              }
            },
            false,
          );
          window._dropZoneInit = true; // Đánh dấu đã khởi tạo
        }
      }
    };

    function handleFileImport(e) {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.name.toLowerCase().endsWith('.zip')) {
        window.__selectedImportFile = file;
        localStorage.setItem('learninghub_add_subject_file_name_v1', file.name);
        localStorage.setItem('learninghub_add_subject_file_size_v1', String(file.size));
        localStorage.removeItem('learninghub_add_subject_file_data_v1');
        localStorage.removeItem('learninghub_add_subject_file_previewed_v1');

        const dropZone = $('importDropZone');
        const card = $('userImportFileCard');
        const nameEl = $('userImportFileName');
        const metaEl = $('userImportFileMeta');
        if (dropZone) dropZone.classList.add('hidden');
        if (card) card.classList.remove('hidden');
        if (nameEl) nameEl.textContent = file.name;
        if (metaEl)
          metaEl.textContent =
            (file.size / (1024 * 1024)).toFixed(1) + ' MB · File ZIP (JSON & ảnh) · Sẵn sàng xem trước';
        const pv = $('previewImportBtn');
        if (pv) {
          pv.classList.remove('hidden');
          pv.disabled = false;
        }
        const saveBtn = $('userImportBtn');
        if (saveBtn) saveBtn.disabled = true;
        parsedQuestions = [];
        window.notify('Đã chọn file ZIP ' + file.name + '. Bấm Xem trước để kiểm tra & giải nén.');
        return;
      }

      window.__selectedImportFile = null;
      const reader = new FileReader();
      reader.onload = function () {
        const text = reader.result;
        let jsonStr = text;
        const mdMatch = text.match(/```json\s*([\s\S]*?)```/);
        if (mdMatch) jsonStr = mdMatch[1];
        else {
          const jsonMatch = text.match(/```\s*([\s\S]*?)```/);
          if (jsonMatch) jsonStr = jsonMatch[1];
        }
        const cleanedData = jsonStr.trim();
        if ($('userImportData')) $('userImportData').value = cleanedData;

        // Lưu file data vào localStorage
        localStorage.setItem('learninghub_add_subject_file_name_v1', file.name);
        localStorage.setItem('learninghub_add_subject_file_size_v1', String(file.size));
        localStorage.setItem('learninghub_add_subject_file_data_v1', cleanedData);
        localStorage.removeItem('learninghub_add_subject_file_previewed_v1');

        const dropZone = $('importDropZone');
        const card = $('userImportFileCard');
        const nameEl = $('userImportFileName');
        const metaEl = $('userImportFileMeta');
        if (dropZone) dropZone.classList.add('hidden');
        if (card) card.classList.remove('hidden');
        if (nameEl) nameEl.textContent = file.name;
        if (metaEl) metaEl.textContent = Math.max(1, Math.round(file.size / 1024)) + ' KB · Sẵn sàng xem trước';
        const pv = $('previewImportBtn');
        if (pv) {
          pv.classList.remove('hidden');
          pv.disabled = false;
        }
        const saveBtn = $('userImportBtn');
        if (saveBtn) saveBtn.disabled = true;
        parsedQuestions = [];
        window.notify('Đã đọc file ' + file.name + '. Bấm Xem trước để kiểm tra.');
      };
      reader.readAsText(file);
    }

    // ===== QUIZLET_IMPORT_AUTODETECT_20260701 =====
    // Tự nhận diện & chuyển file export Quizlet sang format app: chấp nhận JSON {terms:[{term,definition}]},
    // mảng [{term,definition}], hoặc bảng Markdown | Term | Definition |. Trả null nếu không phải Quizlet.
    // Mỗi câu: error_risk='low' (do trích xuất từ web), has_image=true nếu văn bản nhắc tới ảnh/figure, images rỗng.
    window.__LHConvertQuizlet = function (raw) {
      function scanNeedsImage(t) {
        return /(hình vẽ|hình bên|hình sau|đồ thị|bảng biến thiên|sơ đồ|xem hình|picture shows|shows an image|this (picture|image|figure)|the (image|figure|picture|diagram) (below|above)|following (image|figure|picture|diagram)|shown below|pictured|in the (picture|image|figure))/i.test(
          String(t || ''),
        );
      }
      function parseTerm(term, def) {
        var re = /([A-Fa-f])\.(?=\s|[A-Z])/g,
          m,
          marks = [];
        while ((m = re.exec(term)) !== null) marks.push({ L: m[1].toUpperCase(), idx: m.index, end: m.index + 2 });
        var seq = [],
          expect = 65;
        marks.forEach(function (mk) {
          if (mk.L === String.fromCharCode(expect)) {
            seq.push(mk);
            expect++;
          }
        });
        if (seq.length < 2) return null;
        var question = term.slice(0, seq[0].idx).trim(),
          options = {};
        for (var i = 0; i < seq.length; i++) {
          var s = seq[i].end,
            e = i + 1 < seq.length ? seq[i + 1].idx : term.length;
          options[seq[i].L] = term.slice(s, e).trim().replace(/\s+/g, ' ').replace(/\.$/, '').trim();
        }
        var ams = (String(def || '').match(/(?:^|\s)([A-Fa-f])\.(?=\s|[A-Z]|$)/g) || []).map(function (x) {
          return x.trim()[0].toUpperCase();
        });
        var answer = ams.length
          ? Array.from(new Set(ams)).join('')
          : String(def || '')
              .toUpperCase()
              .replace(/[^A-F]/g, '');
        answer = Array.from(answer)
          .filter(function (a) {
            return options[a];
          })
          .join('');
        if (!question || !answer) return null;
        return { question: question, options: options, answer: answer };
      }
      var terms = null;
      try {
        var j = JSON.parse(raw);
        if (j && Array.isArray(j.terms))
          terms = j.terms.map(function (t) {
            return { term: t.term, def: t.definition };
          });
        else if (Array.isArray(j) && j.length && j[0] && 'term' in j[0] && 'definition' in j[0])
          terms = j.map(function (t) {
            return { term: t.term, def: t.definition };
          });
      } catch (e) {
        lhWarn('QUIZLET_IMPORT_AUTODETECT_20260701', e);
      }
      if (!terms) {
        var rows = [];
        raw.split(/\r?\n/).forEach(function (ln) {
          if (!ln.trim().startsWith('|')) return;
          var c = ln.split('|').map(function (s) {
            return s.trim();
          });
          if (!c[1] || c[1] === 'Term' || /^-+$/.test(c[1])) return;
          rows.push({ term: c[1], def: c[2] });
        });
        if (rows.length) terms = rows;
      }
      if (!terms || !terms.length) return null;
      var out = [],
        seen = {};
      terms.forEach(function (t) {
        var p = parseTerm(String(t.term || ''), String(t.def || ''));
        if (!p) return;
        var key = p.question.toLowerCase().replace(/\s+/g, ' ').slice(0, 90);
        if (seen[key]) return;
        seen[key] = 1;
        var needImg = scanNeedsImage(p.question + ' ' + Object.values(p.options).join(' '));
        out.push({
          question: p.question,
          options: p.options,
          answer: p.answer,
          images: [],
          has_image: needImg,
          error_risk: 'low',
          error_risk_reason: '',
        });
      });
      return out.length ? out : null;
    };
    // ===== END QUIZLET_IMPORT_AUTODETECT_20260701 =====

    window.__previewUserImport = async function () {
      if (window.__selectedImportFile && window.__selectedImportFile.name.toLowerCase().endsWith('.zip')) {
        try {
          const importer = window.LHSubjectImport;
          if (!importer) {
            alert('Module LHSubjectImport chưa sẵn sàng.');
            return;
          }

          const res = await importer.readAndValidateZipFile(window.__selectedImportFile);
          let parsedZipData = res;

          if (res.needSelectJson) {
            const selected = prompt(
              'File ZIP chứa nhiều file JSON câu hỏi:\n\n' +
                res.jsonCandidates.join('\n') +
                '\n\nVui lòng nhập đúng tên file JSON bạn muốn dùng:',
              res.jsonCandidates[0],
            );
            if (!selected) return;

            const chosen = res.jsonCandidates.find(p => p.toLowerCase() === selected.toLowerCase().trim());
            if (!chosen) {
              alert('File JSON đã chọn không có trong danh sách.');
              return;
            }

            const imageEntries = new Map();
            Object.keys(res.zipInstance.files).forEach(k => {
              const ext = k.slice(k.lastIndexOf('.')).toLowerCase();
              if (['.png', '.jpg', '.jpeg', '.webp', '.gif'].includes(ext)) {
                imageEntries.set(k, res.zipInstance.files[k]);
              }
            });

            parsedZipData = await importer.processSelectedJsonFromZip(
              res.zipInstance,
              chosen,
              imageEntries,
              res.zipFile.name,
            );
          }

          const questions = parsedZipData.questions;
          window.__previewImportData = questions;
          parsedQuestions = questions;
          localStorage.setItem('learninghub_add_subject_file_previewed_v1', 'true');

          const codeInp = $('addSubjectCode');
          if (codeInp && !codeInp.value.trim() && parsedZipData.suggestedCode) {
            codeInp.value = parsedZipData.suggestedCode;
          }

          const metaEl = $('userImportFileMeta');
          if (metaEl) metaEl.textContent = questions.length + ' câu hỏi đã kiểm tra · Sẵn sàng lưu';
          const btn = $('userImportBtn');
          if (btn) btn.disabled = false;

          // Mở giao diện Import chuẩn của Learning Hub
          window.__openImportPreviewModal(questions);
          window.notify('OK! ' + questions.length + ' câu hỏi sẵn sàng');
        } catch (err) {
          alert('Lỗi kiểm tra ZIP:\n' + (err.message || err));
        }
        return;
      }

      const raw = ($('userImportData')?.value || '').trim();
      const btn = $('userImportBtn');
      if (!raw) {
        alert('Bạn hãy chọn file .zip / .json / .md / .txt trước.');
        return;
      }

      let data;
      try {
        var quizletData = window.__LHConvertQuizlet ? window.__LHConvertQuizlet(raw) : null;
        if (quizletData && quizletData.length) {
          data = quizletData;
        } else {
          var jsonBlocks = raw.match(/```json\s*([\s\S]*?)```/g);
          if (jsonBlocks && jsonBlocks.length > 0) {
            data = [];
            jsonBlocks.forEach(function (block) {
              var cleaned = block.replace(/^```json\s*/, '').replace(/```\s*$/, '');
              var parsed = JSON.parse(cleaned);
              if (Array.isArray(parsed)) data = data.concat(parsed);
              else if (parsed.questions && Array.isArray(parsed.questions)) data = data.concat(parsed.questions);
            });
          } else {
            var cleaned = raw;
            if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```\w*\s*/, '').replace(/```\s*$/, '');
            data = JSON.parse(cleaned);
          }
        }
      } catch (e) {
        localStorage.removeItem('learninghub_add_subject_file_previewed_v1');
        alert('JSON không hợp lệ. Hãy kiểm tra lại format.\n\nLỗi: ' + e.message);
        return;
      }

      if (!Array.isArray(data)) {
        if (data.questions && Array.isArray(data.questions)) data = data.questions;
        else {
          localStorage.removeItem('learninghub_add_subject_file_previewed_v1');
          alert('Dữ liệu phải là mảng JSON [...]');
          return;
        }
      }

      const errors = [];
      data.forEach((q, i) => {
        if (!q.question) errors.push('Câu ' + (i + 1) + ': thiếu "question"');
        if (!q.options || typeof q.options !== 'object') errors.push('Câu ' + (i + 1) + ': thiếu "options"');
        if (!q.answer) errors.push('Câu ' + (i + 1) + ': thiếu "answer"');
      });
      if (errors.length) {
        localStorage.removeItem('learninghub_add_subject_file_previewed_v1');
        alert('Dữ liệu có lỗi:\n\n' + errors.slice(0, 10).join('\n'));
        return;
      }

      localStorage.setItem('learninghub_add_subject_file_previewed_v1', 'true');
      parsedQuestions = data;
      window.__previewSelections = {};
      const metaEl = $('userImportFileMeta');
      if (metaEl) metaEl.textContent = data.length + ' câu hỏi đã kiểm tra · Có thể lưu';
      if (btn) btn.disabled = false;
      window.__openImportPreviewModal(data);
      window.notify('OK! ' + data.length + ' câu hỏi sẵn sàng');
    };

    window.__closeImportPreviewModal = function () {
      document.getElementById('importPreviewModal')?.classList.add('hidden');
    };

    window.__submitSubjectRequest = async function () {
      const code = ($('addSubjectCode')?.value || '').trim().toUpperCase();
      const name = ($('addSubjectName')?.value || '').trim();
      const desc = ($('addSubjectDesc')?.value || '').trim();

      if (!code) {
        alert('Vui lòng nhập mã môn');
        $('addSubjectCode')?.focus();
        return;
      }
      if (!/^[A-Z0-9_]{2,20}$/.test(code)) {
        alert('Mã môn chỉ gồm chữ, số, gạch dưới (2-20 ký tự)');
        $('addSubjectCode')?.focus();
        return;
      }
      if (!name) {
        alert('Vui lòng nhập tên môn');
        $('addSubjectName')?.focus();
        return;
      }
      if (!parsedQuestions.length) {
        alert('Bạn cần chọn file và bấm Xem trước trước khi lưu môn học.');
        return;
      }

      const c = client();
      if (!c) {
        alert('Chưa kết nối Supabase');
        return;
      }

      const btn = $('userImportBtn');
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Đang lưu...';
      }

      // Hiển thị thanh tiến trình ngay từ khi bắt đầu
      window.showProgress('Bắt đầu khởi tạo môn học...', 0, 100, 'Đang chuẩn bị dữ liệu...');
      await new Promise(resolve => setTimeout(resolve, 100));

      try {
        // Cho phép trùng mã môn + tên môn (nhiều bộ câu hỏi cùng mã)

        let successMsg = '';
        if (isAdminOrEditor()) {
          // Cho phép thêm nhiều môn cùng mã gốc: HOD102, HOD102_2, HOD102_3...
          // Như vậy không bị lỗi trùng câu số 1,2,3... trong database.
          // Tạo môn + nhập toàn bộ câu hỏi (kèm ảnh) trên Turso qua 1 action.
          window.showProgress('Đang lưu môn học...', 50, 100, 'Đang tạo môn và nhập câu hỏi lên máy chủ...');
          const u0 = window.HODSupabase?.getUser?.();
          const res = await fetch('/api/admin-action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-store',
            body: JSON.stringify({
              user_id: u0?.id,
              action: 'add_subject',
              payload: { code, name: name || code, description: desc || '', questions: parsedQuestions || [] },
            }),
          });
          const out = await res.json().catch(() => ({}));
          if (!res.ok || out.error) {
            alert('Lỗi tạo môn: ' + (out.error || res.status));
            return;
          }
          const finalCode = out.code || code;
          const success = (parsedQuestions || []).length;
          successMsg = 'Đã thêm môn ' + finalCode + ' với ' + success + ' câu hỏi';
          try {
            const key = 'learninghub_subject_counts_cache_v3';
            const store = JSON.parse(localStorage.getItem(key) || '{}') || {};
            store.counts = store.counts || {};
            store.confirmed = store.confirmed || {};
            store.counts[finalCode] = success;
            store.confirmed[finalCode] = true;
            store.updated_at = new Date().toISOString();
            localStorage.setItem(key, JSON.stringify(store));
            localStorage.setItem('learninghub_subjects_dirty_v3', String(Date.now()));
            localStorage.removeItem('learninghub_subjects_cache_v1');
            sessionStorage.removeItem('learninghub_subject_counts_cache_v1');
            window.clearLearningHubSupabaseCache?.('subjects');
            window.clearLearningHubSupabaseCache?.('questions');
          } catch (e) {
            lhWarn('appCore', e);
          }
          alert(successMsg);
          window.notify(successMsg);
          window.__switchSubjectGateTab('list');
          try {
            $('subjectRefresh')?.click();
            setTimeout(() => $('subjectRefresh')?.click(), 5600);
            setTimeout(() => window.refreshSubjectCountsOnce?.(), 6500);
          } catch (e) {
            lhWarn('appCore', e);
          }
        } else {
          // Học viên/User gửi request: Hiển thị thanh tiến trình khi upload tệp tin lớn
          window.showProgress('Đang gửi yêu cầu tạo môn học...', 50, 100, 'Đang tải dữ liệu câu hỏi lên máy chủ...');
          await new Promise(resolve => setTimeout(resolve, 100));

          const u = window.HODSupabase?.getUser?.();
          const res = await fetch('/api/admin-action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-store',
            body: JSON.stringify({
              user_id: u?.id,
              action: 'add_subject_request',
              payload: { code, name, description: desc || '', questions_data: parsedQuestions || [] },
            }),
          });
          const out = await res.json().catch(() => ({}));
          if (!res.ok || out.error) {
            alert('Lỗi gửi yêu cầu: ' + (out.error || res.status));
            return;
          }
          successMsg = 'Đã gửi yêu cầu thêm môn ' + code + '. Vui lòng chờ admin duyệt.';
          alert(successMsg);
          window.notify(successMsg);
          window.__switchSubjectGateTab('list');
        }

        parsedQuestions = [];
        document.getElementById('importPreviewModal')?.classList.add('hidden');
        clearAddSubjectLocalStorage();
      } catch (e) {
        console.warn('Add subject error:', e);
        alert('Lỗi khi lưu môn học: ' + (e?.message || e));
        window.notify('Lỗi khi lưu môn học');
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Lưu Môn Học';
        }
        window.hideProgress();
      }
    };

    window.__closeAddSubject = function () {
      window.__switchSubjectGateTab('list');
    };

    function bind() {
      $('addSubjectBtn')?.addEventListener('click', () => window.__switchSubjectGateTab('add'));
      showAddBtn();
      setInterval(showAddBtn, 2000);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
    else bind();
  })();
  // ===== ADD_SUBJECT_FEATURE END =====
}

export function installImportPreviewInlineEdit() {
  // ===== FINAL_PROMPT_MODAL_RUNTIME_FIX_20260625 =====
  (function () {
    function escPrompt(s) {
      return String(s ?? '').replace(
        /[&<>"']/g,
        c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
      );
    }
    function getPromptText() {
      return (
        window.__ADD_SUBJECT_AI_PROMPT ||
        window.AI_PROMPT ||
        document.getElementById('userAiPromptText')?.textContent ||
        ''
      );
    }
    window.__openUserAIPromptModal = function () {
      const prompt = getPromptText();
      let modal = document.getElementById('userPromptModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'userPromptModal';
        modal.className = 'modal userPromptModal hidden';
        modal.innerHTML = `<div class="box userPromptModalBox">
        <button class="modalX" type="button" id="userPromptModalClose">×</button>
        <div class="userPromptModalHead">
          <div>
            <span class="userPromptLabel">PROMPT TẠO CÂU HỎI</span>
            <h2>Xem prompt</h2>
            <p>Copy prompt này rồi dán vào Gemini / ChatGPT / Claude kèm tài liệu môn học.</p>
          </div>
          <button class="primary userPromptCopyTop" type="button" id="userPromptModalCopy">📋 Sao chép</button>
        </div>
        <pre class="userPromptModalPre" id="userPromptModalPre"></pre>
      </div>`;
        modal.addEventListener('mousedown', e => {
          if (e.target === modal) window.__closeUserAIPromptModal();
        });
        document.body.appendChild(modal);
        document.getElementById('userPromptModalClose')?.addEventListener('click', window.__closeUserAIPromptModal);
        document.getElementById('userPromptModalCopy')?.addEventListener('click', window.__copyUserAIPrompt);
      }
      const pre = document.getElementById('userPromptModalPre');
      if (pre) pre.textContent = prompt;
      modal.classList.remove('hidden');
    };
    window.__closeUserAIPromptModal = function () {
      document.getElementById('userPromptModal')?.classList.add('hidden');
    };
    window.__copyUserAIPrompt = function () {
      const prompt = getPromptText();
      const done = () => {
        const btn = document.getElementById('btnCopyPrompt');
        if (btn) {
          const oldText = btn.innerHTML;
          btn.innerHTML = '✅ Đã copy';
          setTimeout(() => {
            btn.innerHTML = oldText;
          }, 1800);
        }
        if (typeof notify === 'function') window.notify('Đã copy prompt!');
      };
      if (navigator.clipboard?.writeText) {
        navigator.clipboard
          .writeText(prompt)
          .then(done)
          .catch(() => {
            const ta = document.createElement('textarea');
            ta.value = prompt;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            ta.remove();
            done();
          });
      } else {
        const ta = document.createElement('textarea');
        ta.value = prompt;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
        done();
      }
    };
    document.addEventListener(
      'click',
      function (e) {
        const viewBtn = e.target.closest && e.target.closest('#btnViewPrompt,.aiViewPromptBtn');
        if (viewBtn) {
          e.preventDefault();
          e.stopPropagation();
          window.__openUserAIPromptModal();
          return;
        }
        const copyBtn = e.target.closest && e.target.closest('#btnCopyPrompt');
        if (copyBtn) {
          e.preventDefault();
          e.stopPropagation();
          window.__copyUserAIPrompt();
        }
      },
      true,
    );
  })();

  // ===== FIX_DELETE_IMPORT_FILE_20260625 =====
  // Sửa nút "Xóa file" trong bước Import môn học.
  (function () {
    function $(id) {
      return document.getElementById(id);
    }
    function notifySafe(msg) {
      if (typeof notify === 'function') window.notify(msg);
      else console.log(msg);
    }
    window.__clearUserImportFile = function () {
      window.__selectedImportFile = null;
      if (window.LHSubjectImport) {
        window.LHSubjectImport.resetSubjectImportState();
      }

      const fileInput = $('userImportFile');
      const hiddenData = $('userImportData');
      const dropZone = $('importDropZone');
      const fileCard = $('userImportFileCard');
      const fileName = $('userImportFileName');
      const fileMeta = $('userImportFileMeta');
      const previewBtn = $('previewImportBtn');
      const saveBtn = $('userImportBtn');

      if (fileInput) fileInput.value = '';
      if (hiddenData) hiddenData.value = '';
      if (dropZone) dropZone.classList.remove('hidden');
      if (fileCard) fileCard.classList.add('hidden');
      if (fileName) fileName.textContent = 'Chưa chọn file';
      if (fileMeta) fileMeta.textContent = 'File import câu hỏi';
      if (previewBtn) {
        previewBtn.classList.add('hidden');
        previewBtn.disabled = true;
      }
      if (saveBtn) saveBtn.disabled = true;

      localStorage.removeItem('learninghub_add_subject_file_name_v1');
      localStorage.removeItem('learninghub_add_subject_file_size_v1');
      localStorage.removeItem('learninghub_add_subject_file_data_v1');
      localStorage.removeItem('learninghub_add_subject_file_previewed_v1');

      window.__previewSelections = {};
      try {
        window.__closeImportPreviewModal?.();
      } catch (e) {
        lhWarn('FIX_DELETE_IMPORT_FILE_20260625', e);
      }
      notifySafe('Đã xóa file import');
    };

    document.addEventListener(
      'click',
      function (e) {
        const btn = e.target.closest?.('.removeFileBtn');
        if (!btn) return;
        e.preventDefault();
        e.stopPropagation();
        window.__clearUserImportFile();
      },
      true,
    );
  })();

  // ===== PROMPT_STEP_UX_UI_POLISH_20260625 =====
  // Nâng cấp giao diện bước "Lấy Prompt" trong form thêm môn.
  (function () {
    function $(id) {
      return document.getElementById(id);
    }
    function enhancePromptStep() {
      const step = $('addStep2');
      if (!step || step.dataset.promptPolished === '1') return;
      step.dataset.promptPolished = '1';
      step.classList.add('promptPolished');
      step.innerHTML = `
      <div class="promptStepGrid">
        <section class="promptMainCard">
          <div class="promptEyebrow">Bước 2 · Tạo file câu hỏi</div>
          <h3 class="promptMainTitle">Lấy prompt rồi đưa tài liệu cho AI</h3>
          <p class="promptMainDesc">Bấm sao chép prompt, dán vào AI bạn muốn dùng, sau đó gửi kèm tài liệu môn học. AI sẽ trả về file câu hỏi để import ở bước tiếp theo.</p>

          <div class="promptActionGrid">
            <button class="aiCopyBtn" type="button" onclick="window.__copyUserAIPrompt()" id="btnCopyPrompt">📋 Sao chép prompt</button>
            <button class="aiViewPromptBtn" type="button" onclick="window.__openUserAIPromptModal()" id="btnViewPrompt">👁 Xem prompt</button>
          </div>

          <div class="promptMiniGuide">
            <div class="guideRow"><div class="guideNum">1</div><div><b>Copy prompt</b><span>Prompt đã có sẵn format JSON đúng cho hệ thống.</span></div></div>
            <div class="guideRow"><div class="guideNum">2</div><div><b>Dán vào AI + gửi tài liệu</b><span>Gửi PDF, Word, slide hoặc nội dung môn học cho AI.</span></div></div>
            <div class="guideRow"><div class="guideNum">3</div><div><b>Tải file .md / .txt</b><span>Sau khi AI tạo xong, qua bước Import để lưu môn học.</span></div></div>
          </div>
        </section>

        <aside class="promptSideCard">
          <div class="promptToolTitle">Chọn công cụ AI</div>
          <div class="promptToolGrid">
            <a href="https://gemini.google.com" target="_blank" class="aiToolBtn gemini">✦ Gemini</a>
            <a href="https://chatgpt.com" target="_blank" class="aiToolBtn chatgpt">◉ ChatGPT</a>
            <a href="https://claude.ai" target="_blank" class="aiToolBtn claude">◈ Claude</a>
          </div>
          <div class="promptNoteBox">Mẹo: nếu tài liệu dài, hãy yêu cầu AI tạo từng phần rồi gộp lại thành một file JSON.</div>
        </aside>
      </div>

      <div class="step-actions">
        <button class="btn" type="button" onclick="window.__switchStep(1)">⬅ Quay lại</button>
        <button class="primary" type="button" onclick="window.__switchStep(3)">Đã có file, tiếp tục ➔</button>
      </div>
    `;
    }
    const oldSwitch = window.__switchStep;
    window.__switchStep = function (step) {
      if (typeof oldSwitch === 'function') oldSwitch.apply(this, arguments);
      setTimeout(() => {
        if (Number(step) === 2) enhancePromptStep();
      }, 0);
    };
    document.addEventListener(
      'click',
      function (e) {
        const btn = e.target.closest?.('[onclick*="__switchStep(2)"]');
        if (btn) setTimeout(enhancePromptStep, 0);
      },
      true,
    );
    document.addEventListener('DOMContentLoaded', () => setTimeout(enhancePromptStep, 800));
  })();

  // ===== PROMPT_STEP_INSIDE_PANEL_FIX_20260625 =====
  // Xóa nút "Sao chép prompt" bị trôi ra ngoài khung tab lớn.
  (function () {
    function cleanStrayPromptButtons() {
      document
        .querySelectorAll(
          '.subjectGate .polishedSubjectPanel > .aiCopyBtn, .subjectGate .polishedSubjectPanel > #btnCopyPrompt, .subjectGate > .aiCopyBtn, .subjectGate > #btnCopyPrompt',
        )
        .forEach(btn => {
          if (!btn.closest('#addStep2')) btn.remove();
        });
    }
    document.addEventListener('DOMContentLoaded', () => {
      cleanStrayPromptButtons();
      setTimeout(cleanStrayPromptButtons, 300);
      setTimeout(cleanStrayPromptButtons, 1000);
    });
    document.addEventListener('click', () => setTimeout(cleanStrayPromptButtons, 0), true);
  })();

  // ===== REMOVE_PROMPT_GUIDE_ROWS_20260625 =====
  // Bỏ 3 dòng hướng dẫn trong bước Lấy Prompt.
  (function () {
    function removePromptGuideRows() {
      document.querySelectorAll('#addStep2 .promptMiniGuide').forEach(el => el.remove());
    }
    document.addEventListener('DOMContentLoaded', () => {
      removePromptGuideRows();
      setTimeout(removePromptGuideRows, 300);
      setTimeout(removePromptGuideRows, 1000);
    });
    document.addEventListener('click', () => setTimeout(removePromptGuideRows, 0), true);
  })();

  // ===== FIX_PROMPT_MODAL_SCOPE_REMOVE_TIP_20260625 =====
  // Sửa modal "Xem prompt" để không ảnh hưởng khung lớn + bỏ ô mẹo.
  (function () {
    function cleanPromptTip() {
      document.querySelectorAll('#addStep2 .promptNoteBox, .promptNoteBox').forEach(el => el.remove());
    }
    function patchPromptModal() {
      const modal = document.getElementById('userPromptModal');
      if (!modal) return;
      modal.classList.remove('modal');
      modal.classList.add('userPromptModal');
      const box = modal.querySelector('.userPromptModalBox');
      if (box) box.classList.remove('box');
    }
    const oldOpen = window.__openUserAIPromptModal;
    window.__openUserAIPromptModal = function () {
      if (typeof oldOpen === 'function') oldOpen.apply(this, arguments);
      setTimeout(() => {
        patchPromptModal();
        cleanPromptTip();
      }, 0);
    };
    document.addEventListener('DOMContentLoaded', () => {
      cleanPromptTip();
      patchPromptModal();
      setTimeout(() => {
        cleanPromptTip();
        patchPromptModal();
      }, 300);
      setTimeout(() => {
        cleanPromptTip();
        patchPromptModal();
      }, 1000);
    });
    document.addEventListener(
      'click',
      () =>
        setTimeout(() => {
          cleanPromptTip();
          patchPromptModal();
        }, 0),
      true,
    );
  })();

  // ===== IMPORT_PREVIEW_INLINE_EDIT_20260625 =====
  // Sửa trực tiếp ngay trên card xem trước, không mở modal riêng.
  (function () {
    function escHtml(s) {
      return String(s ?? '').replace(
        /[&<>"']/g,
        c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
      );
    }
    function getPreviewData(data) {
      const arr = data || window.__previewImportData || [];
      window.__previewImportData = arr;
      return arr;
    }
    function opt(q, k) {
      return q?.options?.[k] || '';
    }
    window.__previewQualityFilter = 'all';

    function autoDetectQuality(q) {
      const hasImg = !!(q.has_image || (q.images && q.images.length > 0));
      let risk = q.error_risk || '';
      let reason = q.error_risk_reason || '';
      if (!risk) {
        if (
          hasImg &&
          (!q.images ||
            !q.images.length ||
            q.images.some(im => {
              const src = typeof im === 'string' ? im : im.src || im.url || '';
              return !src || src.includes('URL_') || src.includes('MÔ_TẢ');
            }))
        ) {
          risk = 'high';
          reason = reason || 'Câu cần hình ảnh nhưng chưa có ảnh thực tế';
        } else if (String(q.answer || '').length > 1) {
          risk = 'medium';
          reason = reason || 'Câu có nhiều đáp án đúng, cần kiểm tra kỹ';
        } else {
          risk = 'low';
        }
      }
      q.has_image = hasImg;
      q.error_risk = risk;
      q.error_risk_reason = reason;
    }
    function riskLabel(r) {
      return { low: 'Thấp', medium: 'Trung bình', high: 'Cao' }[r] || r;
    }
    function riskColor(r) {
      return { low: '#27ae60', medium: '#f39c12', high: '#e74c3c' }[r] || '#999';
    }

    function renderQualityStats(data) {
      var stats = document.getElementById('importPreviewStats');
      if (!stats) return;
      var imgCount = data.filter(function (q) {
        return q.has_image;
      }).length;
      var highCount = data.filter(function (q) {
        return q.error_risk === 'high';
      }).length;
      var medCount = data.filter(function (q) {
        return q.error_risk === 'medium';
      }).length;
      var lowCount = data.filter(function (q) {
        return q.error_risk === 'low';
      }).length;
      var f = window.__previewQualityFilter;
      stats.textContent = '';
      var statRow = document.createElement('div');
      statRow.className = 'previewStatRow';
      var statItems = [
        { text: data.length + ' câu', color: '' },
        { text: imgCount + ' có ảnh', color: '#3498db' },
        { text: highCount + ' rủi ro cao', color: '#e74c3c' },
        { text: medCount + ' trung bình', color: '#f39c12' },
        { text: lowCount + ' thấp', color: '#27ae60' },
      ];
      statItems.forEach(function (item) {
        var span = document.createElement('span');
        span.className = 'previewStatItem';
        span.textContent = item.text;
        if (item.color) span.style.color = item.color;
        statRow.appendChild(span);
      });
      var filterRow = document.createElement('div');
      filterRow.className = 'previewFilterRow';
      var filters = [
        { key: 'all', label: 'Thư viện', border: '' },
        { key: 'has_image', label: '📷 Có ảnh', border: '' },
        { key: 'high', label: 'Rủi ro cao', border: '#e74c3c' },
        { key: 'medium', label: 'Trung bình', border: '#f39c12' },
        { key: 'low', label: 'Thấp', border: '#27ae60' },
      ];
      filters.forEach(function (fl) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'previewFilterBtn' + (f === fl.key ? ' active' : '');
        btn.textContent = fl.label;
        if (fl.border) btn.style.borderColor = fl.border;
        btn.addEventListener('click', function () {
          window.__setQualityFilter(fl.key);
        });
        filterRow.appendChild(btn);
      });
      stats.appendChild(statRow);
      stats.appendChild(filterRow);
    }

    window.__setQualityFilter = function (f) {
      window.__previewQualityFilter = f;
      const data = getPreviewData();
      renderQualityStats(data);
      renderQualityList(data);
    };

    window.__toggleQualityImage = function (i, val) {
      const data = getPreviewData();
      if (data[i]) {
        data[i].has_image = val;
        renderQualityStats(data);
      }
    };

    window.__setQualityRisk = function (i, val) {
      const data = getPreviewData();
      if (data[i]) {
        data[i].error_risk = val;
        renderQualityStats(data);
        const card = document.querySelector(`[data-pcard="${i}"]`);
        if (card) {
          card.style.borderLeftColor = riskColor(val);
          card.style.background =
            { low: 'rgba(39,174,96,0.08)', medium: 'rgba(243,156,18,0.08)', high: 'rgba(231,76,60,0.08)' }[val] || '';
          const badge = card.querySelector('.riskBadge');
          if (badge) {
            badge.style.background = riskColor(val);
            badge.textContent = riskLabel(val);
          }
        }
      }
    };

    function renderQualityList(data) {
      var list = document.getElementById('importPreviewList');
      if (!list) return;
      var f = window.__previewQualityFilter;
      var filtered = data.filter(function (q) {
        if (f === 'all') return true;
        if (f === 'has_image') return q.has_image;
        return q.error_risk === f;
      });
      list.textContent = '';
      if (!filtered.length) {
        var empty = document.createElement('div');
        empty.style.cssText = 'text-align:center;padding:30px;opacity:.6';
        empty.textContent = 'Không có câu hỏi nào phù hợp bộ lọc.';
        list.appendChild(empty);
        return;
      }
      filtered.forEach(function (q) {
        var i = data.indexOf(q);
        list.appendChild(buildCard(q, i));
      });
    }

    function renderPreviewInline(data) {
      data = getPreviewData(data);
      data.forEach(autoDetectQuality);
      window.__previewQualityFilter = 'all';
      let modal = document.getElementById('importPreviewModal');
      if (modal) {
        modal.remove();
        modal = null;
      }
      modal = document.createElement('div');
      modal.id = 'importPreviewModal';
      modal.className = 'modal importPreviewModal';
      var box = document.createElement('div');
      box.className = 'box importPreviewModalBox';
      var closeBtn = document.createElement('button');
      closeBtn.className = 'modalX';
      closeBtn.type = 'button';
      closeBtn.textContent = '×';
      closeBtn.onclick = function () {
        window.__closeImportPreviewModal();
      };
      var head = document.createElement('div');
      head.className = 'importPreviewHead';
      var headLeft = document.createElement('div');
      var label = document.createElement('span');
      label.className = 'importPreviewLabel';
      label.textContent = 'XEM TRƯỚC IMPORT';
      var h2 = document.createElement('h2');
      h2.textContent = 'Kiểm tra câu hỏi';
      var desc = document.createElement('p');
      desc.textContent = 'Đáp án đúng đã hiển thị sẵn. Đánh dấu câu có ảnh và mức rủi ro, bấm “Sửa” để chỉnh nội dung.';
      headLeft.appendChild(label);
      headLeft.appendChild(h2);
      headLeft.appendChild(desc);
      var saveBtn = document.createElement('button');
      saveBtn.className = 'primary importPreviewSaveTop';
      saveBtn.type = 'button';
      saveBtn.textContent = 'Lưu Môn Học';
      saveBtn.onclick = function () {
        window.__closeImportPreviewModal();
        window.__submitSubjectRequest();
      };
      head.appendChild(headLeft);
      head.appendChild(saveBtn);
      var stats = document.createElement('div');
      stats.id = 'importPreviewStats';
      stats.className = 'importPreviewStats';
      var list = document.createElement('div');
      list.id = 'importPreviewList';
      list.className = 'importPreviewList';
      box.appendChild(closeBtn);
      box.appendChild(head);
      box.appendChild(stats);
      box.appendChild(list);
      modal.appendChild(box);
      modal.addEventListener('mousedown', function (e) {
        if (e.target === modal) window.__closeImportPreviewModal();
      });
      document.body.appendChild(modal);
      renderQualityStats(data);
      renderQualityList(data);
      modal.classList.remove('hidden');
    }
    function buildCard(q, i) {
      var answer = String(q.answer || '').toUpperCase();
      var risk = q.error_risk || 'low';
      var riskBg =
        { low: 'rgba(39,174,96,0.08)', medium: 'rgba(243,156,18,0.08)', high: 'rgba(231,76,60,0.08)' }[risk] || '';
      var card = document.createElement('article');
      card.className = 'previewQuestionCard';
      card.dataset.pcard = i;
      card.style.borderLeft = '4px solid ' + riskColor(risk);
      card.style.background = riskBg;
      // Header
      var top = document.createElement('div');
      top.className = 'previewQuestionTop';
      var numB = document.createElement('b');
      numB.textContent = 'Câu ' + (q.num || i + 1);
      var actions = document.createElement('div');
      actions.className = 'previewTopActions';
      if (q.has_image) {
        var imgBadge = document.createElement('span');
        imgBadge.className = 'previewBadge imgBadge';
        imgBadge.textContent = '📷 Có ảnh';
        actions.appendChild(imgBadge);
      }
      var rBadge = document.createElement('span');
      rBadge.className = 'previewBadge riskBadge';
      rBadge.style.background = riskColor(risk);
      rBadge.style.color = '#fff';
      rBadge.textContent = riskLabel(risk);
      actions.appendChild(rBadge);
      var ansBadge = document.createElement('span');
      ansBadge.className = 'previewAnswerBadge';
      ansBadge.textContent = 'Đáp án: ' + (answer || '?');
      actions.appendChild(ansBadge);
      var editBtn = document.createElement('button');
      editBtn.className = 'previewEditBtn';
      editBtn.type = 'button';
      editBtn.textContent = 'Sửa';
      editBtn.addEventListener('click', function () {
        window.__editImportPreviewQuestion(i);
      });
      actions.appendChild(editBtn);
      top.appendChild(numB);
      top.appendChild(actions);
      card.appendChild(top);
      // Risk reason
      if (q.error_risk_reason) {
        var reasonDiv = document.createElement('div');
        reasonDiv.className = 'previewRiskReason';
        reasonDiv.textContent = '⚠ ' + q.error_risk_reason;
        card.appendChild(reasonDiv);
      }
      // Question text
      var qText = document.createElement('div');
      qText.className = 'previewQuestionText';
      qText.textContent = q.question || '';
      card.appendChild(qText);
      // Images area (always show for upload)
      var imgArea = document.createElement('div');
      imgArea.className = 'previewImgArea';
      imgArea.dataset.imgIdx = i;
      function renderImgThumbs() {
        imgArea.textContent = '';
        var imgs = q.images || [];
        if (imgs.length) {
          var thumbRow = document.createElement('div');
          thumbRow.className = 'previewQuestionImages';
          imgs.forEach(function (im, idx) {
            var src = typeof im === 'string' ? im : im.src || im.url || '';
            if (!src) return;
            var wrap = document.createElement('div');
            wrap.className = 'previewImgThumb';
            var img = document.createElement('img');
            img.src = src;
            img.alt = 'Ảnh ' + (idx + 1);
            img.loading = 'lazy';
            var rmBtn = document.createElement('button');
            rmBtn.className = 'previewImgRm';
            rmBtn.type = 'button';
            rmBtn.textContent = '×';
            rmBtn.addEventListener('click', function () {
              q.images.splice(idx, 1);
              renderImgThumbs();
              renderQualityStats(getPreviewData());
            });
            wrap.appendChild(rmBtn);
            wrap.appendChild(img);
            thumbRow.appendChild(wrap);
          });
          imgArea.appendChild(thumbRow);
        }
        var uploadRow = document.createElement('div');
        uploadRow.className = 'previewImgUploadRow';
        var fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.multiple = true;
        fileInput.className = 'previewImgFileInput';
        fileInput.addEventListener('change', function (e) {
          var files = e.target.files || [];
          Array.prototype.forEach.call(files, function (file) {
            var fr = new FileReader();
            fr.onload = function () {
              if (!q.images) q.images = [];
              q.images.push({
                id: 'prev_' + Date.now() + '_' + Math.random().toString(16).slice(2),
                src: fr.result,
                source: 'user-upload',
                name: file.name,
              });
              if (!q.has_image) {
                q.has_image = true;
              }
              renderImgThumbs();
              renderQualityStats(getPreviewData());
            };
            fr.readAsDataURL(file);
          });
          e.target.value = '';
        });
        var uploadBtn = document.createElement('button');
        uploadBtn.className = 'previewImgUploadBtn';
        uploadBtn.type = 'button';
        uploadBtn.textContent = '📷 Thêm ảnh';
        uploadBtn.addEventListener('click', function () {
          fileInput.click();
        });
        uploadRow.appendChild(fileInput);
        uploadRow.appendChild(uploadBtn);
        if (q.images && q.images.length) {
          var countSpan = document.createElement('span');
          countSpan.className = 'previewImgCount';
          countSpan.textContent = q.images.length + ' ảnh';
          uploadRow.appendChild(countSpan);
        }
        imgArea.appendChild(uploadRow);
      }
      renderImgThumbs();
      card.appendChild(imgArea);
      // Options grid
      var grid = document.createElement('div');
      grid.className = 'previewAnswerGrid';
      Object.entries(q.options || {}).forEach(function (entry) {
        var k = entry[0],
          v = entry[1];
        var key = String(k).toUpperCase();
        var isCorrect = answer.includes(key);
        var optDiv = document.createElement('div');
        optDiv.className = 'previewAnswerOption' + (isCorrect ? ' correct' : '');
        optDiv.dataset.pi = i;
        optDiv.dataset.k = key;
        var b = document.createElement('b');
        b.textContent = key;
        var s = document.createElement('span');
        s.textContent = v;
        optDiv.appendChild(b);
        optDiv.appendChild(s);
        grid.appendChild(optDiv);
      });
      card.appendChild(grid);
      // Quality controls
      var controls = document.createElement('div');
      controls.className = 'previewQualityControls';
      var toggleLabel = document.createElement('label');
      toggleLabel.className = 'previewToggle';
      var cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = !!q.has_image;
      cb.addEventListener('change', function () {
        window.__toggleQualityImage(i, this.checked);
      });
      var cbText = document.createElement('span');
      cbText.textContent = 'Có ảnh';
      toggleLabel.appendChild(cb);
      toggleLabel.appendChild(cbText);
      var riskDiv = document.createElement('div');
      riskDiv.className = 'previewRiskSelect';
      var riskSpan = document.createElement('span');
      riskSpan.textContent = 'Rủi ro:';
      var sel = document.createElement('select');
      ['low', 'medium', 'high'].forEach(function (val) {
        var opt = document.createElement('option');
        opt.value = val;
        opt.textContent = { low: 'Thấp', medium: 'Trung bình', high: 'Cao' }[val];
        if (risk === val) opt.selected = true;
        sel.appendChild(opt);
      });
      sel.addEventListener('change', function () {
        window.__setQualityRisk(i, this.value);
      });
      riskDiv.appendChild(riskSpan);
      riskDiv.appendChild(sel);
      controls.appendChild(toggleLabel);
      controls.appendChild(riskDiv);
      card.appendChild(controls);
      return card;
    }
    window.__openImportPreviewModal = renderPreviewInline;
  })();

  // ===== FINAL_INLINE_EDIT_KEEP_EXISTING_CARD_20260625 =====
  // Sửa tại chỗ trên đúng layout card hiện tại, không thay card thành form nên không bị co/bung.
  (function () {
    const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
    function escHtml(s) {
      return String(s ?? '').replace(
        /[&<>"']/g,
        c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
      );
    }
    function getData() {
      return window.__previewImportData || [];
    }
    function optionKeys(q) {
      const keys = Object.keys(q?.options || {}).map(k => String(k).toUpperCase());
      return LETTERS.filter(k => keys.includes(k));
    }
    function nextKey(keys) {
      return LETTERS.find(k => !keys.includes(k));
    }
    function markCorrect(card, answer) {
      card.querySelectorAll('.previewAnswerOption').forEach(opt => {
        const k = String(opt.dataset.k || '').toUpperCase();
        opt.classList.toggle('correct', answer.includes(k));
      });
    }
    function refreshCardOnly(i) {
      const q = getData()[i];
      if (!q) return;
      const open = window.__openImportPreviewModal;
      if (typeof open === 'function') {
        // render lại toàn preview để đồng bộ, nhưng giữ đúng layout xem
        open(getData());
      }
    }

    window.__editImportPreviewQuestion = function (i) {
      const data = getData();
      const q = data[i];
      const card = document.querySelector(`[data-pcard="${i}"]`);
      if (!q || !card) return;
      if (card.classList.contains('inlineEditing')) return;

      card.dataset.backupHtml = card.innerHTML;
      card.classList.add('inlineEditing');

      const questionEl = card.querySelector('.previewQuestionText');
      if (questionEl) {
        questionEl.setAttribute('contenteditable', 'true');
        questionEl.dataset.field = 'question';
      }

      card.querySelectorAll('.previewAnswerOption').forEach(opt => {
        const span = opt.querySelector('span');
        if (span) {
          span.setAttribute('contenteditable', 'true');
          span.dataset.optText = opt.dataset.k || '';
        }
      });

      const badge = card.querySelector('.previewAnswerBadge');
      if (badge) {
        badge.innerHTML = `Đáp án đúng: <input class="inlineCorrectInput" value="${escHtml(String(q.answer || '').toUpperCase())}" oninput="this.value=this.value.toUpperCase().replace(/[^A-Z]/g,'')">`;
        const input = badge.querySelector('input');
        input?.addEventListener('input', () => markCorrect(card, String(input.value || '').toUpperCase()));
      }

      const grid = card.querySelector('.previewAnswerGrid');
      if (grid && !card.querySelector('.inlineAddOptionMini')) {
        grid.insertAdjacentHTML(
          'afterend',
          `<button class="inlineAddOptionMini" type="button" title="Thêm đáp án" onclick="window.__inlineAddPreviewOption(${i})">+</button>`,
        );
      }
      if (!card.querySelector('.inlineEditActionsMini')) {
        card.insertAdjacentHTML(
          'beforeend',
          `<div class="inlineEditActionsMini"><button class="btn" type="button" onclick="window.__cancelInlineKeepEdit(${i})">Hủy</button><button class="primary" type="button" onclick="window.__saveInlineKeepEdit(${i})">Lưu sửa</button></div>`,
        );
      }
      questionEl?.focus();
    };

    window.__inlineAddPreviewOption = function (i) {
      const card = document.querySelector(`[data-pcard="${i}"]`);
      const grid = card?.querySelector('.previewAnswerGrid');
      if (!card || !grid) return;
      const keys = Array.from(grid.querySelectorAll('.previewAnswerOption')).map(x =>
        String(x.dataset.k || '').toUpperCase(),
      );
      const k = nextKey(keys);
      if (!k) return alert('Đã đủ số lựa chọn.');
      grid.insertAdjacentHTML(
        'beforeend',
        `<div class="previewAnswerOption" data-pi="${i}" data-k="${k}"><b>${k}</b><span contenteditable="true" data-opt-text="${k}"></span></div>`,
      );
      grid.querySelector(`[data-k="${k}"] span`)?.focus();
    };

    window.__cancelInlineKeepEdit = function (i) {
      const card = document.querySelector(`[data-pcard="${i}"]`);
      if (!card) return;
      card.innerHTML = card.dataset.backupHtml || card.innerHTML;
      card.classList.remove('inlineEditing');
      delete card.dataset.backupHtml;
    };

    window.__saveInlineKeepEdit = function (i) {
      const data = getData();
      const q = data[i];
      const card = document.querySelector(`[data-pcard="${i}"]`);
      if (!q || !card) return;

      const question = (card.querySelector('.previewQuestionText')?.textContent || '').trim();
      const answer = (card.querySelector('.inlineCorrectInput')?.value || '').trim().toUpperCase();
      if (!question) return alert('Câu hỏi không được để trống.');
      if (!answer) return alert('Đáp án đúng không được để trống.');

      const options = {};
      card.querySelectorAll('.previewAnswerOption').forEach(opt => {
        const k = String(opt.dataset.k || '').toUpperCase();
        const v = (opt.querySelector('span')?.textContent || '').trim();
        if (k && v) options[k] = v;
      });
      if (!Object.keys(options).length) return alert('Cần có ít nhất một đáp án lựa chọn.');

      q.question = question;
      q.options = options;
      q.answer = answer;
      refreshCardOnly(i);
      if (typeof notify === 'function') window.notify('Đã cập nhật câu hỏi');
    };
  })();

  // ===== INLINE_DELETE_OPTION_20260625 =====
  // Thêm nút xóa từng đáp án khi sửa trực tiếp trong Xem trước import.
  (function () {
    function ensureDeleteButtons(card) {
      if (!card) return;
      card.querySelectorAll('.previewAnswerOption').forEach(opt => {
        if (opt.querySelector('.inlineDeleteOptionBtn')) return;
        const k = opt.dataset.k || '';
        opt.insertAdjacentHTML(
          'beforeend',
          `<button class="inlineDeleteOptionBtn" type="button" title="Xóa đáp án ${k}" onclick="window.__deleteInlinePreviewOption(this)">×</button>`,
        );
      });
    }
    window.__deleteInlinePreviewOption = function (btn) {
      const opt = btn?.closest?.('.previewAnswerOption');
      const card = btn?.closest?.('.previewQuestionCard');
      if (!opt || !card) return;
      const count = card.querySelectorAll('.previewAnswerOption').length;
      if (count <= 1) return alert('Phải còn ít nhất 1 đáp án.');
      const k = String(opt.dataset.k || '').toUpperCase();
      const input = card.querySelector('.inlineCorrectInput');
      if (input && k) {
        input.value = String(input.value || '')
          .toUpperCase()
          .replaceAll(k, '');
        card.querySelectorAll('.previewAnswerOption').forEach(o => {
          const ok = String(input.value || '').includes(String(o.dataset.k || '').toUpperCase());
          o.classList.toggle('correct', ok);
        });
      }
      opt.remove();
    };

    const oldEdit = window.__editImportPreviewQuestion;
    window.__editImportPreviewQuestion = function (i) {
      if (typeof oldEdit === 'function') oldEdit.apply(this, arguments);
      setTimeout(() => ensureDeleteButtons(document.querySelector(`[data-pcard="${i}"]`)), 0);
    };

    const oldAdd = window.__inlineAddPreviewOption;
    window.__inlineAddPreviewOption = function (i) {
      if (typeof oldAdd === 'function') oldAdd.apply(this, arguments);
      setTimeout(() => ensureDeleteButtons(document.querySelector(`[data-pcard="${i}"]`)), 0);
    };
  })();

  // ===== IMPORT PREVIEW COMPACT UX PATCH 20260626 =====
  (function () {
    const STORE = 'learninghub_import_preview_compact_v1';
    function applyCompact(modal, compact) {
      if (!modal) return;
      modal.classList.toggle('compactMode', !!compact);
      const btn = modal.querySelector('.previewCompactToggle');
      if (btn) {
        btn.classList.toggle('active', !!compact);
        btn.textContent = compact ? 'Chi tiết' : 'Danh sách nhanh';
        btn.title = compact ? 'Bấm để xem đầy đủ đáp án và công cụ' : 'Bấm để xem nhiều câu hơn';
      }
    }
    function enhanceImportPreview() {
      const modal = document.getElementById('importPreviewModal');
      if (!modal || modal.dataset.compactEnhanced === '1') return;
      const save = modal.querySelector('.importPreviewSaveTop');
      if (!save || !save.parentNode) return;
      modal.dataset.compactEnhanced = '1';
      let compact = localStorage.getItem(STORE);
      compact = compact === null ? true : compact === '1';
      const actions = document.createElement('div');
      actions.className = 'importPreviewHeadActions';
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'previewCompactToggle';
      toggle.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        compact = !modal.classList.contains('compactMode');
        localStorage.setItem(STORE, compact ? '1' : '0');
        applyCompact(modal, compact);
      });
      save.parentNode.insertBefore(actions, save);
      actions.appendChild(toggle);
      actions.appendChild(save);
      applyCompact(modal, compact);
    }
    function start() {
      enhanceImportPreview();
      if (window.MutationObserver && document.body) {
        new MutationObserver(enhanceImportPreview).observe(document.body, { childList: true, subtree: true });
      }
      setInterval(enhanceImportPreview, 700);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else start();
  })();

  // SIMPLE_IMPORT_PREVIEW_ANSWER_ONLY_FINAL_20260626
  (function () {
    const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    function esc(s) {
      return String(s ?? '').replace(
        /[&<>"']/g,
        c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
      );
    }
    function getData(data) {
      const arr = data || window.__previewImportData || [];
      window.__previewImportData = arr;
      return arr;
    }
    function normAns(q) {
      return String(q?.answer || '')
        .toUpperCase()
        .replace(/[^A-Z]/g, '');
    }
    function correctText(q) {
      const ans = normAns(q);
      if (!ans) return 'Chưa có đáp án';
      return ans
        .split('')
        .map(k => k + '. ' + (q.options?.[k] || ''))
        .join(' | ');
    }
    function nextKey(opts) {
      const used = new Set(Object.keys(opts || {}).map(k => String(k).toUpperCase()));
      return LETTERS.find(k => !used.has(k));
    }
    function renderCard(q, i) {
      const ans = normAns(q) || '?';
      return `<article class="simplePreviewCard" data-simple-card="${i}"><div class="simplePreviewRow"><div class="simplePreviewNum">Câu ${esc(q.num || i + 1)}</div><div class="simplePreviewMain"><div class="simplePreviewQuestion">${esc(q.question || '')}</div><div class="simplePreviewCorrect"><b>Đáp án: ${esc(ans)}</b><span>${esc(correctText(q))}</span></div></div><button class="simplePreviewEditBtn" type="button" data-simple-edit="${i}">Sửa</button></div></article>`;
    }
    function renderEditCard(q, i) {
      const opts = q.options || {};
      const optionRows = Object.keys(opts)
        .sort()
        .map(
          k =>
            `<div class="simpleEditOption" data-opt-row="${esc(k)}"><div class="simpleEditKey">${esc(k)}</div><input value="${esc(opts[k] || '')}" data-edit-opt="${esc(k)}"><button class="simpleEditDel" type="button" data-del-opt="${esc(k)}">×</button></div>`,
        )
        .join('');
      return `<article class="simplePreviewCard simpleEditCard" data-simple-card="${i}"><div class="simpleEditHead"><div class="simpleEditTitle">Sửa toàn bộ Câu ${esc(q.num || i + 1)}</div></div><div class="simpleEditGrid"><div class="simpleEditField"><label>Câu hỏi</label><textarea data-edit-question>${esc(q.question || '')}</textarea></div><div class="simpleEditField"><label>Đáp án đúng</label><input data-edit-answer value="${esc(normAns(q))}" placeholder="VD: A hoặc AC"></div></div><div class="simpleEditField" style="margin-top:10px"><label>Các đáp án</label><div class="simpleEditOptions">${optionRows}</div></div><div class="simpleEditBottom"><button class="btn" type="button" data-add-opt="${i}">+ Thêm đáp án</button><div class="simpleEditMiniActions"><button class="btn" type="button" data-cancel-simple="${i}">Hủy</button><button class="primary" type="button" data-save-simple="${i}">Lưu sửa</button></div></div></article>`;
    }
    function renderList(data) {
      const list = document.getElementById('simplePreviewList');
      if (list) list.innerHTML = data.map(renderCard).join('');
    }
    function openSimplePreview(data) {
      data = getData(data);
      let modal = document.getElementById('importPreviewModal');
      if (modal) modal.remove();
      modal = document.createElement('div');
      modal.id = 'importPreviewModal';
      modal.className = 'modal simpleImportPreviewModal';
      modal.innerHTML = `<div class="box simpleImportPreviewBox"><button class="modalX" type="button" data-simple-close>×</button><div class="simplePreviewHead"><div><span class="simplePreviewLabel">XEM TRƯỚC IMPORT</span><h2>Kiểm tra câu hỏi</h2><p class="simplePreviewHint">Chỉ hiện câu hỏi và đáp án đúng. Bấm “Sửa” để chỉnh toàn bộ câu và các đáp án.</p></div><div class="simplePreviewActions"><button class="primary simplePreviewSave" type="button" data-simple-save>Lưu Môn Học</button></div></div><div class="simplePreviewCount">${data.length} câu hỏi</div><div id="simplePreviewList" class="simplePreviewList"></div></div>`;
      document.body.appendChild(modal);
      renderList(data);
    }
    function saveEdit(i) {
      const data = getData();
      const q = data[i];
      const card = document.querySelector(`[data-simple-card="${i}"]`);
      if (!q || !card) return;
      const question = (card.querySelector('[data-edit-question]')?.value || '').trim();
      const answer = (card.querySelector('[data-edit-answer]')?.value || '')
        .trim()
        .toUpperCase()
        .replace(/[^A-Z]/g, '');
      if (!question) return alert('Câu hỏi không được để trống.');
      if (!answer) return alert('Đáp án đúng không được để trống.');
      const options = {};
      card.querySelectorAll('[data-edit-opt]').forEach(inp => {
        const k = String(inp.dataset.editOpt || '').toUpperCase();
        const v = (inp.value || '').trim();
        if (k && v) options[k] = v;
      });
      if (!Object.keys(options).length) return alert('Cần ít nhất 1 đáp án.');
      for (const k of answer.split('')) {
        if (!options[k]) return alert('Đáp án đúng ' + k + ' chưa có nội dung.');
      }
      q.question = question;
      q.answer = answer;
      q.options = options;
      q.answer_text = answer
        .split('')
        .map(k => k + '. ' + (options[k] || ''))
        .join('; ');
      renderList(data);
      if (typeof notify === 'function') window.notify('Đã lưu sửa câu ' + (q.num || i + 1));
    }
    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-simple-close]')) {
        document.getElementById('importPreviewModal')?.classList.add('hidden');
        return;
      }
      if (e.target.closest('[data-simple-save]')) {
        document.getElementById('importPreviewModal')?.classList.add('hidden');
        window.__submitSubjectRequest?.();
        return;
      }
      const edit = e.target.closest('[data-simple-edit]');
      if (edit) {
        const i = +edit.dataset.simpleEdit;
        const data = getData();
        const card = document.querySelector(`[data-simple-card="${i}"]`);
        if (card && data[i]) {
          card.outerHTML = renderEditCard(data[i], i);
          document.querySelector(`[data-simple-card="${i}"] textarea`)?.focus();
        }
        return;
      }
      const cancel = e.target.closest('[data-cancel-simple]');
      if (cancel) {
        renderList(getData());
        return;
      }
      const save = e.target.closest('[data-save-simple]');
      if (save) {
        saveEdit(+save.dataset.saveSimple);
        return;
      }
      const add = e.target.closest('[data-add-opt]');
      if (add) {
        const i = +add.dataset.addOpt;
        const data = getData();
        const q = data[i];
        const k = nextKey(q.options || {});
        if (!k) return alert('Đã đủ số đáp án.');
        q.options = q.options || {};
        q.options[k] = '';
        const card = document.querySelector(`[data-simple-card="${i}"]`);
        if (card) {
          card.outerHTML = renderEditCard(q, i);
          document.querySelector(`[data-simple-card="${i}"] [data-edit-opt="${k}"]`)?.focus();
        }
        return;
      }
      const del = e.target.closest('[data-del-opt]');
      if (del) {
        const card = del.closest('[data-simple-card]');
        const i = +(card?.dataset.simpleCard || 0);
        const q = getData()[i];
        const k = del.dataset.delOpt;
        if (q?.options && k) {
          delete q.options[k];
          card.outerHTML = renderEditCard(q, i);
        }
        return;
      }
    });
    window.__openImportPreviewModal = openSimplePreview;
    window.__editImportPreviewQuestion = function (i) {
      const data = getData();
      const card = document.querySelector(`[data-simple-card="${i}"]`);
      if (card && data[i]) card.outerHTML = renderEditCard(data[i], i);
    };
  })();

  // FILTERED_ANSWER_ONLY_PREVIEW_20260626
  (function () {
    const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    let currentFilter = 'all';
    function esc(s) {
      return String(s ?? '').replace(
        /[&<>"']/g,
        c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
      );
    }
    function getData(data) {
      const arr = data || window.__previewImportData || [];
      window.__previewImportData = arr;
      arr.forEach(detect);
      return arr;
    }
    function normAns(q) {
      return String(q?.answer || '')
        .toUpperCase()
        .replace(/[^A-Z]/g, '');
    }
    function detect(q) {
      q.has_image = !!(q.has_image || (q.images && q.images.length));
      if (!q.error_risk) q.error_risk = normAns(q).length > 1 ? 'medium' : 'low';
      return q;
    }
    function correctText(q) {
      const ans = normAns(q);
      if (!ans) return 'Chưa có đáp án';
      return ans
        .split('')
        .map(k => k + '. ' + (q.options?.[k] || ''))
        .join(' | ');
    }
    function riskColor(r) {
      return { high: '#e74c3c', medium: '#f39c12', low: '#27ae60' }[r] || '#999';
    }
    function riskLabel(r) {
      return { high: 'Cao', medium: 'Trung bình', low: 'Thấp' }[r] || r;
    }
    function nextKey(opts) {
      const used = new Set(Object.keys(opts || {}).map(k => String(k).toUpperCase()));
      return LETTERS.find(k => !used.has(k));
    }
    function pass(q) {
      if (currentFilter === 'all') return true;
      if (currentFilter === 'has_image') return !!q.has_image;
      return q.error_risk === currentFilter;
    }
    function stat(data) {
      return {
        total: data.length,
        img: data.filter(q => q.has_image).length,
        high: data.filter(q => q.error_risk === 'high').length,
        medium: data.filter(q => q.error_risk === 'medium').length,
        low: data.filter(q => q.error_risk === 'low').length,
      };
    }
    function renderStats(data) {
      const s = stat(data);
      const box = document.getElementById('simplePreviewStats');
      if (!box) return;
      const filters = [
        ['all', 'Thư viện'],
        ['has_image', '📷 Có ảnh'],
        ['high', 'Rủi ro cao'],
        ['medium', 'Trung bình'],
        ['low', 'Thấp'],
      ];
      box.innerHTML = `<div class="simplePreviewStatLine"><span class="simplePreviewStatItem">${s.total} câu</span><span class="simplePreviewStatItem" style="color:#3498db">${s.img} có ảnh</span><span class="simplePreviewStatItem" style="color:#e74c3c">${s.high} rủi ro cao</span><span class="simplePreviewStatItem" style="color:#f39c12">${s.medium} trung bình</span><span class="simplePreviewStatItem" style="color:#27ae60">${s.low} thấp</span></div><div class="simplePreviewFilterLine">${filters.map(f => `<button type="button" class="simpleFilterBtn ${currentFilter === f[0] ? 'active' : ''}" data-filter="${f[0]}">${f[1]}</button>`).join('')}</div>`;
    }
    function renderCard(q, i) {
      const ans = normAns(q) || '?';
      return `<article class="simplePreviewCard" data-simple-card="${i}" style="border-left-color:${riskColor(q.error_risk)}!important"><div class="simplePreviewRow"><div class="simplePreviewNum">Câu ${esc(q.num || i + 1)}</div><div class="simplePreviewMain"><div class="simplePreviewQuestion">${esc(q.question || '')}</div><div class="simplePreviewCorrect"><b>Đáp án: ${esc(ans)}</b><span>${esc(correctText(q))}</span></div></div><div class="simplePreviewMetaMini"><span class="simplePreviewRiskDot" style="background:${riskColor(q.error_risk)}" title="Rủi ro: ${esc(riskLabel(q.error_risk))}"></span>${q.has_image ? '<span class="simplePreviewImgMark">📷</span>' : ''}<button class="simplePreviewEditBtn" type="button" data-simple-edit="${i}">Sửa</button></div></div></article>`;
    }
    function renderEditCard(q, i) {
      const opts = q.options || {};
      const optionRows = Object.keys(opts)
        .sort()
        .map(
          k =>
            `<div class="simpleEditOption" data-opt-row="${esc(k)}"><div class="simpleEditKey">${esc(k)}</div><input value="${esc(opts[k] || '')}" data-edit-opt="${esc(k)}"><button class="simpleEditDel" type="button" data-del-opt="${esc(k)}">×</button></div>`,
        )
        .join('');
      return `<article class="simplePreviewCard simpleEditCard" data-simple-card="${i}"><div class="simpleEditHead"><div class="simpleEditTitle">Sửa toàn bộ Câu ${esc(q.num || i + 1)}</div></div><div class="simpleEditGrid"><div class="simpleEditField"><label>Câu hỏi</label><textarea data-edit-question>${esc(q.question || '')}</textarea></div><div class="simpleEditField"><label>Đáp án đúng</label><input data-edit-answer value="${esc(normAns(q))}" placeholder="VD: A hoặc AC"></div></div><div class="simpleEditField" style="margin-top:10px"><label>Các đáp án</label><div class="simpleEditOptions">${optionRows}</div></div><div class="simpleEditBottom"><button class="btn" type="button" data-add-opt="${i}">+ Thêm đáp án</button><div class="simpleEditMiniActions"><button class="btn" type="button" data-cancel-simple="${i}">Hủy</button><button class="primary" type="button" data-save-simple="${i}">Lưu sửa</button></div></div></article>`;
    }
    function renderList(data) {
      const list = document.getElementById('simplePreviewList');
      if (!list) return;
      const filtered = data.map((q, i) => ({ q, i })).filter(x => pass(x.q));
      list.innerHTML = filtered.length
        ? filtered.map(x => renderCard(x.q, x.i)).join('')
        : '<div class="simplePreviewEmpty">Không có câu nào phù hợp bộ lọc.</div>';
      renderStats(data);
    }
    function openSimplePreview(data) {
      data = getData(data);
      let modal = document.getElementById('importPreviewModal');
      if (modal) modal.remove();
      modal = document.createElement('div');
      modal.id = 'importPreviewModal';
      modal.className = 'modal simpleImportPreviewModal';
      modal.innerHTML = `<div class="box simpleImportPreviewBox"><button class="modalX" type="button" data-simple-close>×</button><div class="simplePreviewHead"><div><span class="simplePreviewLabel">XEM TRƯỚC IMPORT</span><h2>Kiểm tra câu hỏi</h2><p class="simplePreviewHint">Chỉ hiện câu hỏi và đáp án đúng. Dùng bộ lọc để xem câu có ảnh hoặc câu dễ sai.</p></div><div class="simplePreviewActions"><button class="primary simplePreviewSave" type="button" data-simple-save>Lưu Môn Học</button></div></div><div id="simplePreviewStats" class="simplePreviewStats"></div><div id="simplePreviewList" class="simplePreviewList"></div></div>`;
      document.body.appendChild(modal);
      renderList(data);
    }
    function saveEdit(i) {
      const data = getData();
      const q = data[i];
      const card = document.querySelector(`[data-simple-card="${i}"]`);
      if (!q || !card) return;
      const question = (card.querySelector('[data-edit-question]')?.value || '').trim();
      const answer = (card.querySelector('[data-edit-answer]')?.value || '')
        .trim()
        .toUpperCase()
        .replace(/[^A-Z]/g, '');
      if (!question) return alert('Câu hỏi không được để trống.');
      if (!answer) return alert('Đáp án đúng không được để trống.');
      const options = {};
      card.querySelectorAll('[data-edit-opt]').forEach(inp => {
        const k = String(inp.dataset.editOpt || '').toUpperCase();
        const v = (inp.value || '').trim();
        if (k && v) options[k] = v;
      });
      if (!Object.keys(options).length) return alert('Cần ít nhất 1 đáp án.');
      for (const k of answer.split('')) {
        if (!options[k]) return alert('Đáp án đúng ' + k + ' chưa có nội dung.');
      }
      q.question = question;
      q.answer = answer;
      q.options = options;
      q.answer_text = answer
        .split('')
        .map(k => k + '. ' + (options[k] || ''))
        .join('; ');
      renderList(data);
      if (typeof notify === 'function') window.notify('Đã lưu sửa câu ' + (q.num || i + 1));
    }
    document.addEventListener('click', function (e) {
      const filter = e.target.closest('.simpleFilterBtn');
      if (filter) {
        currentFilter = filter.dataset.filter || 'all';
        renderList(getData());
        return;
      }
      if (e.target.closest('[data-simple-close]')) {
        document.getElementById('importPreviewModal')?.classList.add('hidden');
        return;
      }
      if (e.target.closest('[data-simple-save]')) {
        document.getElementById('importPreviewModal')?.classList.add('hidden');
        window.__submitSubjectRequest?.();
        return;
      }
      const edit = e.target.closest('[data-simple-edit]');
      if (edit) {
        const i = +edit.dataset.simpleEdit;
        const data = getData();
        const card = document.querySelector(`[data-simple-card="${i}"]`);
        if (card && data[i]) {
          card.outerHTML = renderEditCard(data[i], i);
          document.querySelector(`[data-simple-card="${i}"] textarea`)?.focus();
        }
        return;
      }
      const cancel = e.target.closest('[data-cancel-simple]');
      if (cancel) {
        renderList(getData());
        return;
      }
      const save = e.target.closest('[data-save-simple]');
      if (save) {
        saveEdit(+save.dataset.saveSimple);
        return;
      }
      const add = e.target.closest('[data-add-opt]');
      if (add) {
        const i = +add.dataset.addOpt;
        const data = getData();
        const q = data[i];
        const k = nextKey(q.options || {});
        if (!k) return alert('Đã đủ số đáp án.');
        q.options = q.options || {};
        q.options[k] = '';
        const card = document.querySelector(`[data-simple-card="${i}"]`);
        if (card) {
          card.outerHTML = renderEditCard(q, i);
          document.querySelector(`[data-simple-card="${i}"] [data-edit-opt="${k}"]`)?.focus();
        }
        return;
      }
      const del = e.target.closest('[data-del-opt]');
      if (del) {
        const card = del.closest('[data-simple-card]');
        const i = +(card?.dataset.simpleCard || 0);
        const q = getData()[i];
        const k = del.dataset.delOpt;
        if (q?.options && k) {
          delete q.options[k];
          card.outerHTML = renderEditCard(q, i);
        }
        return;
      }
    });
    window.__openImportPreviewModal = openSimplePreview;
    window.__editImportPreviewQuestion = function (i) {
      const data = getData();
      const card = document.querySelector(`[data-simple-card="${i}"]`);
      if (card && data[i]) card.outerHTML = renderEditCard(data[i], i);
    };
  })();

  // IMAGE_THUMB_PREVIEW_TOP_EDIT_ACTIONS_20260626
  (function () {
    const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    let currentFilter = 'all';
    function esc(s) {
      return String(s ?? '').replace(
        /[&<>"']/g,
        c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
      );
    }
    function getData(data) {
      const arr = data || window.__previewImportData || [];
      window.__previewImportData = arr;
      arr.forEach(detect);
      return arr;
    }
    function normAns(q) {
      return String(q?.answer || '')
        .toUpperCase()
        .replace(/[^A-Z]/g, '');
    }
    function detect(q) {
      q.images = q.images || [];
      q.has_image = !!(q.has_image || (q.images && q.images.length));
      if (!q.error_risk) q.error_risk = normAns(q).length > 1 ? 'medium' : 'low';
      return q;
    }
    function correctText(q) {
      const ans = normAns(q);
      if (!ans) return 'Chưa có đáp án';
      return ans
        .split('')
        .map(k => k + '. ' + (q.options?.[k] || ''))
        .join(' | ');
    }
    function riskColor(r) {
      return { high: '#e74c3c', medium: '#f39c12', low: '#27ae60' }[r] || '#999';
    }
    function riskLabel(r) {
      return { high: 'Cao', medium: 'Trung bình', low: 'Thấp' }[r] || r;
    }
    function nextKey(opts) {
      const used = new Set(Object.keys(opts || {}).map(k => String(k).toUpperCase()));
      return LETTERS.find(k => !used.has(k));
    }
    function imgSrc(im) {
      return typeof im === 'string' ? im : im?.src || im?.url || '';
    }
    function pass(q) {
      if (currentFilter === 'all') return true;
      if (currentFilter === 'has_image') return !!q.has_image;
      return q.error_risk === currentFilter;
    }
    function stat(data) {
      return {
        total: data.length,
        img: data.filter(q => q.has_image).length,
        high: data.filter(q => q.error_risk === 'high').length,
        medium: data.filter(q => q.error_risk === 'medium').length,
        low: data.filter(q => q.error_risk === 'low').length,
      };
    }
    function renderStats(data) {
      const s = stat(data),
        box = document.getElementById('simplePreviewStats');
      if (!box) return;
      const filters = [
        ['all', 'Thư viện'],
        ['has_image', '📷 Có ảnh'],
        ['high', 'Rủi ro cao'],
        ['medium', 'Trung bình'],
        ['low', 'Thấp'],
      ];
      box.innerHTML = `<div class="simplePreviewStatLine"><span class="simplePreviewStatItem">${s.total} câu</span><span class="simplePreviewStatItem" style="color:#3498db">${s.img} có ảnh</span><span class="simplePreviewStatItem" style="color:#e74c3c">${s.high} rủi ro cao</span><span class="simplePreviewStatItem" style="color:#f39c12">${s.medium} trung bình</span><span class="simplePreviewStatItem" style="color:#27ae60">${s.low} thấp</span></div><div class="simplePreviewFilterLine">${filters.map(f => `<button type="button" class="imagePreviewFilterBtn ${currentFilter === f[0] ? 'active' : ''}" data-imgui-filter="${f[0]}">${f[1]}</button>`).join('')}</div>`;
    }
    function miniImages(q) {
      const imgs = (q.images || []).map(imgSrc).filter(Boolean);
      if (!imgs.length) return '<div class="imageMiniPreview"></div>';
      return `<div class="imageMiniPreview"><img src="${esc(imgs[0])}" alt="Ảnh preview" loading="lazy" decoding="async">${imgs.length > 1 ? `<span class="imageMiniCount">+${imgs.length - 1}</span>` : ''}</div>`;
    }
    function renderCard(q, i) {
      const ans = normAns(q) || '?';
      return `<article class="simplePreviewCard" data-imgui-card="${i}" style="border-left-color:${riskColor(q.error_risk)}!important"><div class="imagePreviewListRow"><div class="simplePreviewNum">Câu ${esc(q.num || i + 1)}</div><div class="simplePreviewMain"><div class="simplePreviewQuestion">${esc(q.question || '')}</div><div class="simplePreviewCorrect"><b>Đáp án: ${esc(ans)}</b><span>${esc(correctText(q))}</span></div></div>${miniImages(q)}<div class="simplePreviewMetaMini"><span class="simplePreviewRiskDot" style="background:${riskColor(q.error_risk)}" title="Rủi ro: ${esc(riskLabel(q.error_risk))}"></span><button class="simplePreviewEditBtn" type="button" data-imgui-edit="${i}">Sửa</button></div></div></article>`;
    }
    function renderImages(q, i) {
      const imgs = q.images || [];
      return `<div class="simpleEditImages"><div class="simpleEditImagesHead"><span>Ảnh của câu hỏi</span><button class="simpleImageUploadBtn" type="button" data-imgui-pick-img="${i}">+ Thêm ảnh</button><input class="simpleImgHiddenInput" type="file" accept="image/*" multiple data-imgui-input="${i}"></div><div class="simpleImageThumbs">${imgs.length ? imgs.map((im, idx) => `<div class="simpleImageThumb"><button class="simpleImageRemove" type="button" data-imgui-rm-img="${idx}">×</button><img src="${esc(imgSrc(im))}" alt="Ảnh ${idx + 1}" loading="lazy" decoding="async"></div>`).join('') : '<div class="simpleNoImage">Chưa có ảnh. Bấm “+ Thêm ảnh” nếu câu này cần hình.</div>'}</div></div>`;
    }
    function renderEditCard(q, i) {
      const opts = q.options || {};
      const optionRows = Object.keys(opts)
        .sort()
        .map(
          k =>
            `<div class="simpleEditOption" data-opt-row="${esc(k)}"><div class="simpleEditKey">${esc(k)}</div><input value="${esc(opts[k] || '')}" data-imgui-opt="${esc(k)}"><button class="simpleEditDel" type="button" data-imgui-del-opt="${esc(k)}">×</button></div>`,
        )
        .join('');
      return `<article class="simplePreviewCard simpleEditCard" data-imgui-card="${i}"><div class="simpleEditHead imageEditHeadTop"><div class="simpleEditTitle">Sửa toàn bộ Câu ${esc(q.num || i + 1)}</div><div class="imageEditHeadActions"><button class="btn" type="button" data-imgui-cancel="${i}">Hủy</button><button class="primary" type="button" data-imgui-save="${i}">Lưu sửa</button></div></div><div class="simpleEditGrid"><div class="simpleEditField"><label>Câu hỏi</label><textarea data-imgui-question>${esc(q.question || '')}</textarea></div><div class="simpleEditField"><label>Đáp án đúng</label><input data-imgui-answer value="${esc(normAns(q))}" placeholder="VD: A hoặc AC"></div></div><div class="simpleEditField" style="margin-top:10px"><label>Các đáp án</label><div class="simpleEditOptions">${optionRows}</div></div>${renderImages(q, i)}<div class="simpleEditBottom imageEditBottomOnlyAdd"><button class="btn" type="button" data-imgui-add-opt="${i}">+ Thêm đáp án</button></div></article>`;
    }
    function renderList(data) {
      const list = document.getElementById('simplePreviewList');
      if (!list) return;
      const filtered = data.map((q, i) => ({ q, i })).filter(x => pass(x.q));
      list.innerHTML = filtered.length
        ? filtered.map(x => renderCard(x.q, x.i)).join('')
        : '<div class="simplePreviewEmpty">Không có câu nào phù hợp bộ lọc.</div>';
      renderStats(data);
    }
    function openPreview(data) {
      data = getData(data);
      let modal = document.getElementById('importPreviewModal');
      if (modal) modal.remove();
      modal = document.createElement('div');
      modal.id = 'importPreviewModal';
      modal.className = 'modal simpleImportPreviewModal';
      modal.innerHTML = `<div class="box simpleImportPreviewBox"><button class="modalX" type="button" data-imgui-close>×</button><div class="simplePreviewHead"><div><span class="simplePreviewLabel">XEM TRƯỚC IMPORT</span><h2>Kiểm tra câu hỏi</h2><p class="simplePreviewHint">Chỉ hiện câu hỏi và đáp án đúng. Câu có ảnh sẽ hiện preview nhỏ.</p></div><div class="simplePreviewActions"><button class="primary simplePreviewSave" type="button" data-imgui-submit>Lưu Môn Học</button></div></div><div id="simplePreviewStats" class="simplePreviewStats"></div><div id="simplePreviewList" class="simplePreviewList"></div></div>`;
      document.body.appendChild(modal);
      renderList(data);
    }
    function saveEdit(i) {
      const data = getData();
      const q = data[i];
      const card = document.querySelector(`[data-imgui-card="${i}"]`);
      if (!q || !card) return;
      const question = (card.querySelector('[data-imgui-question]')?.value || '').trim();
      const answer = (card.querySelector('[data-imgui-answer]')?.value || '')
        .trim()
        .toUpperCase()
        .replace(/[^A-Z]/g, '');
      if (!question) return alert('Câu hỏi không được để trống.');
      if (!answer) return alert('Đáp án đúng không được để trống.');
      const options = {};
      card.querySelectorAll('[data-imgui-opt]').forEach(inp => {
        const k = String(inp.dataset.imguiOpt || '').toUpperCase();
        const v = (inp.value || '').trim();
        if (k && v) options[k] = v;
      });
      if (!Object.keys(options).length) return alert('Cần ít nhất 1 đáp án.');
      for (const k of answer.split('')) {
        if (!options[k]) return alert('Đáp án đúng ' + k + ' chưa có nội dung.');
      }
      q.question = question;
      q.answer = answer;
      q.options = options;
      q.answer_text = answer
        .split('')
        .map(k => k + '. ' + (options[k] || ''))
        .join('; ');
      q.has_image = !!(q.images && q.images.length);
      renderList(data);
      if (typeof notify === 'function') window.notify('Đã lưu sửa câu ' + (q.num || i + 1));
    }
    document.addEventListener('click', function (e) {
      const filter = e.target.closest('[data-imgui-filter]');
      if (filter) {
        currentFilter = filter.dataset.imguiFilter || 'all';
        renderList(getData());
        return;
      }
      if (e.target.closest('[data-imgui-close]')) {
        document.getElementById('importPreviewModal')?.classList.add('hidden');
        return;
      }
      if (e.target.closest('[data-imgui-submit]')) {
        document.getElementById('importPreviewModal')?.classList.add('hidden');
        window.__submitSubjectRequest?.();
        return;
      }
      const edit = e.target.closest('[data-imgui-edit]');
      if (edit) {
        const i = +edit.dataset.imguiEdit;
        const data = getData();
        const card = document.querySelector(`[data-imgui-card="${i}"]`);
        if (card && data[i]) {
          card.outerHTML = renderEditCard(data[i], i);
          document.querySelector(`[data-imgui-card="${i}"] textarea`)?.focus();
        }
        return;
      }
      const cancel = e.target.closest('[data-imgui-cancel]');
      if (cancel) {
        renderList(getData());
        return;
      }
      const save = e.target.closest('[data-imgui-save]');
      if (save) {
        saveEdit(+save.dataset.imguiSave);
        return;
      }
      const pick = e.target.closest('[data-imgui-pick-img]');
      if (pick) {
        document.querySelector(`[data-imgui-input="${pick.dataset.imguiPickImg}"]`)?.click();
        return;
      }
      const rm = e.target.closest('[data-imgui-rm-img]');
      if (rm) {
        const card = rm.closest('[data-imgui-card]');
        const i = +(card?.dataset.imguiCard || 0);
        const q = getData()[i];
        if (q?.images) {
          q.images.splice(+rm.dataset.imguiRmImg, 1);
          q.has_image = !!q.images.length;
          card.outerHTML = renderEditCard(q, i);
        }
        return;
      }
      const add = e.target.closest('[data-imgui-add-opt]');
      if (add) {
        const i = +add.dataset.imguiAddOpt;
        const data = getData();
        const q = data[i];
        const k = nextKey(q.options || {});
        if (!k) return alert('Đã đủ số đáp án.');
        q.options = q.options || {};
        q.options[k] = '';
        const card = document.querySelector(`[data-imgui-card="${i}"]`);
        if (card) {
          card.outerHTML = renderEditCard(q, i);
          document.querySelector(`[data-imgui-card="${i}"] [data-imgui-opt="${k}"]`)?.focus();
        }
        return;
      }
      const del = e.target.closest('[data-imgui-del-opt]');
      if (del) {
        const card = del.closest('[data-imgui-card]');
        const i = +(card?.dataset.imguiCard || 0);
        const q = getData()[i];
        const k = del.dataset.imguiDelOpt;
        if (q?.options && k) {
          delete q.options[k];
          card.outerHTML = renderEditCard(q, i);
        }
        return;
      }
    });
    document.addEventListener('change', async function (e) {
      const inp = e.target.closest('[data-imgui-input]');
      if (!inp) return;
      const i = +inp.dataset.imguiInput;
      const q = getData()[i];
      if (!q) return;
      q.images = q.images || [];
      const files = Array.from(inp.files || []);
      if (!files.length) return;
      inp.disabled = true;
      if (typeof notify === 'function') window.notify('Đang upload ảnh...');
      try {
        for (const file of files) {
          if (window.__LHUploadCloudinary) {
            const uploaded = await window.__LHUploadCloudinary(file);
            if (uploaded) q.images.push(uploaded);
          } else {
            const fr = new FileReader();
            const p = new Promise(resolve => {
              fr.onload = function () {
                q.images.push({
                  id: 'import_' + Date.now() + '_' + Math.random().toString(16).slice(2),
                  src: fr.result,
                  source: 'user-upload',
                  name: file.name,
                });
                resolve();
              };
              fr.readAsDataURL(file);
            });
            await p;
          }
        }
        q.has_image = true;
        const card = document.querySelector(`[data-imgui-card="${i}"]`);
        if (card) card.outerHTML = renderEditCard(q, i);
        if (typeof notify === 'function') window.notify('Đã upload ảnh thành URL');
      } catch (err) {
        alert(err.message || err);
      } finally {
        inp.disabled = false;
        inp.value = '';
      }
    });
    window.__openImportPreviewModal = openPreview;
    window.__editImportPreviewQuestion = function (i) {
      const data = getData();
      const card = document.querySelector(`[data-imgui-card="${i}"]`);
      if (card && data[i]) card.outerHTML = renderEditCard(data[i], i);
    };
  })();

  // FINAL_CLEAN_IMPORT_PREVIEW_V7_20260626
  (function () {
    const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    let currentFilter = 'all';
    function esc(s) {
      return String(s ?? '').replace(
        /[&<>"']/g,
        c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
      );
    }
    function getData(data) {
      const arr = data || window.__previewImportData || [];
      window.__previewImportData = arr;
      arr.forEach(detect);
      return arr;
    }
    function normAns(q) {
      return String(q?.answer || '')
        .toUpperCase()
        .replace(/[^A-Z]/g, '');
    }
    function detect(q) {
      q.images = q.images || [];
      q.has_image = !!(q.has_image || (q.images && q.images.length));
      if (!q.error_risk) q.error_risk = normAns(q).length > 1 ? 'medium' : 'low';
      return q;
    }
    function correctText(q) {
      const ans = normAns(q);
      if (!ans) return 'Chưa có đáp án';
      return ans
        .split('')
        .map(k => k + '. ' + (q.options?.[k] || ''))
        .join(' | ');
    }
    function riskColor(r) {
      return { high: '#e74c3c', medium: '#f39c12', low: '#27ae60' }[r] || '#999';
    }
    function riskLabel(r) {
      return { high: 'Cao', medium: 'Trung bình', low: 'Thấp' }[r] || r;
    }
    function nextKey(opts) {
      const used = new Set(Object.keys(opts || {}).map(k => String(k).toUpperCase()));
      return LETTERS.find(k => !used.has(k));
    }
    function imgSrc(im) {
      return typeof im === 'string' ? im : im?.src || im?.url || '';
    }
    function pass(q) {
      if (currentFilter === 'all') return true;
      if (currentFilter === 'has_image') return !!q.has_image;
      return q.error_risk === currentFilter;
    }
    function stats(data) {
      return {
        total: data.length,
        img: data.filter(q => q.has_image).length,
        high: data.filter(q => q.error_risk === 'high').length,
        medium: data.filter(q => q.error_risk === 'medium').length,
        low: data.filter(q => q.error_risk === 'low').length,
      };
    }
    function renderStats(data) {
      const s = stats(data),
        box = document.getElementById('v7Stats');
      if (!box) return;
      const filters = [
        ['all', 'Thư viện'],
        ['has_image', '📷 Có ảnh'],
        ['high', 'Rủi ro cao'],
        ['medium', 'Trung bình'],
        ['low', 'Thấp'],
      ];
      box.innerHTML = `<div class="v7StatLine"><span class="v7StatItem">${s.total} câu</span><span class="v7StatItem" style="color:#3498db">${s.img} có ảnh</span><span class="v7StatItem" style="color:#e74c3c">${s.high} rủi ro cao</span><span class="v7StatItem" style="color:#f39c12">${s.medium} trung bình</span><span class="v7StatItem" style="color:#27ae60">${s.low} thấp</span></div><div class="v7FilterLine">${filters.map(f => `<button type="button" class="v7FilterBtn ${currentFilter === f[0] ? 'active' : ''}" data-v7-filter="${f[0]}">${f[1]}</button>`).join('')}</div>`;
    }
    function miniImages(q) {
      const imgs = (q.images || []).map(imgSrc).filter(Boolean);
      if (!imgs.length) return '<div class="v7MiniImgs"></div>';
      return `<div class="v7MiniImgs"><img src="${esc(imgs[0])}" alt="Ảnh preview" loading="lazy" decoding="async">${imgs.length > 1 ? `<span class="v7ImgCount">+${imgs.length - 1}</span>` : ''}</div>`;
    }
    function renderCard(q, i) {
      const ans = normAns(q) || '?';
      return `<article class="v7Card" data-v7-card="${i}" style="border-left-color:${riskColor(q.error_risk)}!important"><div class="v7Row"><div class="v7Num">Câu ${esc(q.num || i + 1)}</div><div class="v7Main"><div class="v7Question">${esc(q.question || '')}</div><div class="v7Answer"><b>Đáp án: ${esc(ans)}</b><span>${esc(correctText(q))}</span></div></div>${miniImages(q)}<div class="v7Meta"><span class="v7RiskDot" style="background:${riskColor(q.error_risk)}" title="Rủi ro: ${esc(riskLabel(q.error_risk))}"></span><button class="v7EditBtn" type="button" data-v7-edit="${i}">Sửa</button></div></div></article>`;
    }
    function renderImages(q, i) {
      const imgs = q.images || [];
      return `<div class="v7Images"><div class="v7ImagesHead"><span>Ảnh của câu hỏi</span><button class="v7UploadBtn" type="button" data-v7-pick-img="${i}">+ Thêm ảnh</button><input class="v7HiddenInput" type="file" accept="image/*" multiple data-v7-input="${i}"></div><div class="v7Thumbs">${imgs.length ? imgs.map((im, idx) => `<div class="v7Thumb"><button class="v7RemoveImg" type="button" data-v7-rm-img="${idx}">×</button><img src="${esc(imgSrc(im))}" alt="Ảnh ${idx + 1}" loading="lazy" decoding="async"></div>`).join('') : '<div class="v7NoImage">Chưa có ảnh. Bấm “+ Thêm ảnh” nếu câu này cần hình.</div>'}</div></div>`;
    }
    function renderEditCard(q, i) {
      const opts = q.options || {};
      const optionRows = Object.keys(opts)
        .sort()
        .map(
          k =>
            `<div class="v7OptRow"><div class="v7Key">${esc(k)}</div><input value="${esc(opts[k] || '')}" data-v7-opt="${esc(k)}"><button class="v7DelOpt" type="button" data-v7-del-opt="${esc(k)}">×</button></div>`,
        )
        .join('');
      return `<article class="v7Card" data-v7-card="${i}"><div class="v7EditHead"><div class="v7EditTitle">Sửa toàn bộ Câu ${esc(q.num || i + 1)}</div><div class="v7EditHeadActions"><button class="btn" type="button" data-v7-cancel="${i}">Hủy</button><button class="primary" type="button" data-v7-save="${i}">Lưu sửa</button></div></div><div class="v7EditGrid"><div class="v7Field"><label>Câu hỏi</label><textarea data-v7-question>${esc(q.question || '')}</textarea></div><div class="v7Field"><label>Đáp án đúng</label><input data-v7-answer value="${esc(normAns(q))}" placeholder="VD: A hoặc AC"></div></div><div class="v7Field" style="margin-top:10px"><label>Các đáp án</label><div class="v7Options">${optionRows}</div></div>${renderImages(q, i)}<div class="v7Bottom"><button class="btn" type="button" data-v7-add-opt="${i}">+ Thêm đáp án</button></div></article>`;
    }
    function renderList(data) {
      const list = document.getElementById('v7List');
      if (!list) return;
      const filtered = data.map((q, i) => ({ q, i })).filter(x => pass(x.q));
      list.innerHTML = filtered.length
        ? filtered.map(x => renderCard(x.q, x.i)).join('')
        : '<div class="v7Empty">Không có câu nào phù hợp bộ lọc.</div>';
      renderStats(data);
    }
    function openPreview(data) {
      data = getData(data);
      let modal = document.getElementById('importPreviewModal');
      if (modal) modal.remove();
      modal = document.createElement('div');
      modal.id = 'importPreviewModal';
      modal.className = 'modal v7ImportModal';
      modal.innerHTML = `<div class="box v7ImportBox"><button class="modalX" type="button" data-v7-close>×</button><div class="v7Head"><div><span class="v7Label">XEM TRƯỚC IMPORT</span><h2>Kiểm tra câu hỏi</h2><p class="v7Hint">Chỉ hiện câu hỏi và đáp án đúng. Câu có ảnh sẽ hiện preview nhỏ.</p></div><div class="v7TopActions"><button class="primary v7SaveTop" type="button" data-v7-submit>Lưu Môn Học</button></div></div><div id="v7Stats" class="v7Stats"></div><div id="v7List" class="v7List"></div></div>`;
      document.body.appendChild(modal);
      renderList(data);
    }
    function saveEdit(i) {
      const data = getData();
      const q = data[i];
      const card = document.querySelector(`[data-v7-card="${i}"]`);
      if (!q || !card) return;
      const question = (card.querySelector('[data-v7-question]')?.value || '').trim();
      const answer = (card.querySelector('[data-v7-answer]')?.value || '')
        .trim()
        .toUpperCase()
        .replace(/[^A-Z]/g, '');
      if (!question) return alert('Câu hỏi không được để trống.');
      if (!answer) return alert('Đáp án đúng không được để trống.');
      const options = {};
      card.querySelectorAll('[data-v7-opt]').forEach(inp => {
        const k = String(inp.dataset.v7Opt || '').toUpperCase();
        const v = (inp.value || '').trim();
        if (k && v) options[k] = v;
      });
      if (!Object.keys(options).length) return alert('Cần ít nhất 1 đáp án.');
      for (const k of answer.split('')) {
        if (!options[k]) return alert('Đáp án đúng ' + k + ' chưa có nội dung.');
      }
      q.question = question;
      q.answer = answer;
      q.options = options;
      q.answer_text = answer
        .split('')
        .map(k => k + '. ' + (options[k] || ''))
        .join('; ');
      q.has_image = !!(q.images && q.images.length);
      renderList(data);
      if (typeof notify === 'function') window.notify('Đã lưu sửa câu ' + (q.num || i + 1));
    }
    document.addEventListener('click', function (e) {
      const filter = e.target.closest('[data-v7-filter]');
      if (filter) {
        currentFilter = filter.dataset.v7Filter || 'all';
        renderList(getData());
        return;
      }
      if (e.target.closest('[data-v7-close]')) {
        document.getElementById('importPreviewModal')?.classList.add('hidden');
        return;
      }
      if (e.target.closest('[data-v7-submit]')) {
        document.getElementById('importPreviewModal')?.classList.add('hidden');
        window.__submitSubjectRequest?.();
        return;
      }
      const edit = e.target.closest('[data-v7-edit]');
      if (edit) {
        const i = +edit.dataset.v7Edit;
        const data = getData();
        const card = document.querySelector(`[data-v7-card="${i}"]`);
        if (card && data[i]) {
          card.outerHTML = renderEditCard(data[i], i);
          document.querySelector(`[data-v7-card="${i}"] textarea`)?.focus();
        }
        return;
      }
      const cancel = e.target.closest('[data-v7-cancel]');
      if (cancel) {
        renderList(getData());
        return;
      }
      const save = e.target.closest('[data-v7-save]');
      if (save) {
        saveEdit(+save.dataset.v7Save);
        return;
      }
      const pick = e.target.closest('[data-v7-pick-img]');
      if (pick) {
        document.querySelector(`[data-v7-input="${pick.dataset.v7PickImg}"]`)?.click();
        return;
      }
      const rm = e.target.closest('[data-v7-rm-img]');
      if (rm) {
        const card = rm.closest('[data-v7-card]');
        const i = +(card?.dataset.v7Card || 0);
        const q = getData()[i];
        if (q?.images) {
          q.images.splice(+rm.dataset.v7RmImg, 1);
          q.has_image = !!q.images.length;
          card.outerHTML = renderEditCard(q, i);
        }
        return;
      }
      const add = e.target.closest('[data-v7-add-opt]');
      if (add) {
        const i = +add.dataset.v7AddOpt;
        const data = getData();
        const q = data[i];
        const k = nextKey(q.options || {});
        if (!k) return alert('Đã đủ số đáp án.');
        q.options = q.options || {};
        q.options[k] = '';
        const card = document.querySelector(`[data-v7-card="${i}"]`);
        if (card) {
          card.outerHTML = renderEditCard(q, i);
          document.querySelector(`[data-v7-card="${i}"] [data-v7-opt="${k}"]`)?.focus();
        }
        return;
      }
      const del = e.target.closest('[data-v7-del-opt]');
      if (del) {
        const card = del.closest('[data-v7-card]');
        const i = +(card?.dataset.v7Card || 0);
        const q = getData()[i];
        const k = del.dataset.v7DelOpt;
        if (q?.options && k) {
          delete q.options[k];
          card.outerHTML = renderEditCard(q, i);
        }
        return;
      }
    });
    document.addEventListener('change', async function (e) {
      const inp = e.target.closest('[data-v7-input]');
      if (!inp) return;
      const i = +inp.dataset.v7Input;
      const q = getData()[i];
      if (!q) return;
      q.images = q.images || [];
      const files = Array.from(inp.files || []);
      if (!files.length) return;
      inp.disabled = true;
      if (typeof notify === 'function') window.notify('Đang upload ảnh...');
      try {
        for (const file of files) {
          if (window.__LHUploadCloudinary) {
            const uploaded = await window.__LHUploadCloudinary(file);
            if (uploaded) q.images.push(uploaded);
          } else {
            const fr = new FileReader();
            const p = new Promise(resolve => {
              fr.onload = function () {
                q.images.push({
                  id: 'import_' + Date.now() + '_' + Math.random().toString(16).slice(2),
                  src: fr.result,
                  source: 'user-upload',
                  name: file.name,
                });
                resolve();
              };
              fr.readAsDataURL(file);
            });
            await p;
          }
        }
        q.has_image = true;
        const card = document.querySelector(`[data-v7-card="${i}"]`);
        if (card) card.outerHTML = renderEditCard(q, i);
        if (typeof notify === 'function') window.notify('Đã upload ảnh thành URL');
      } catch (err) {
        alert(err.message || err);
      } finally {
        inp.disabled = false;
        inp.value = '';
      }
    });
    window.__openImportPreviewModal = openPreview;
    window.__editImportPreviewQuestion = function (i) {
      const data = getData();
      const card = document.querySelector(`[data-v7-card="${i}"]`);
      if (card && data[i]) card.outerHTML = renderEditCard(data[i], i);
    };
  })();

  // IMAGE_LIGHTBOX_PREVIEW_CLICK_20260626
  (function () {
    function ensureLightbox() {
      let lb = document.getElementById('v7ImageLightbox');
      if (lb) return lb;
      lb = document.createElement('div');
      lb.id = 'v7ImageLightbox';
      lb.className = 'v7Lightbox hidden';
      lb.innerHTML =
        '<div class="v7LightboxInner"><button class="v7LightboxClose" type="button" aria-label="Đóng">×</button><img class="v7LightboxImg" alt="Ảnh phóng to" loading="lazy" decoding="async"></div>';
      document.body.appendChild(lb);
      return lb;
    }
    function openImg(src) {
      if (!src) return;
      const lb = ensureLightbox();
      const img = lb.querySelector('.v7LightboxImg');
      if (img) img.src = src;
      lb.classList.remove('hidden');
    }
    function closeImg() {
      const lb = document.getElementById('v7ImageLightbox');
      if (!lb) return;
      lb.classList.add('hidden');
      const img = lb.querySelector('.v7LightboxImg');
      if (img) img.removeAttribute('src');
    }
    document.addEventListener(
      'click',
      function (e) {
        const thumb = e.target.closest('.v7MiniImgs img, .v7Thumb img');
        if (thumb) {
          e.preventDefault();
          e.stopPropagation();
          openImg(thumb.currentSrc || thumb.src);
          return;
        }
        if (e.target.closest('.v7LightboxClose') || e.target.id === 'v7ImageLightbox') {
          closeImg();
        }
      },
      true,
    );
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeImg();
    });
  })(); /* FINAL APP CLEANUP 20260627: remove old/duplicate UI shells after load */

  (function () {
    window.__APP_UI_CLEAN_FINAL__ = '20260627';
    function cleanupOldUI() {
      [
        '#hodLoginScreen',
        '#hodRoleBar',
        '#hodUserDock',
        '#hodFinalRoleBar',
        '#hodFinalLogin',
        '.hodAuthLanding',
        '.hodFloatingAuth',
        '.legacyLogin',
        '.legacyAuth',
        '.oldLanding',
      ].forEach(function (s) {
        document.querySelectorAll(s).forEach(function (el) {
          el.remove();
        });
      });
      // Giữ 1 avatar/menu/chip cuối, tránh patch cũ tạo trùng.
      ['#hodTopAvatar', '#subjectTopChip', '#hodAccountMenu'].forEach(function (s) {
        var arr = Array.from(document.querySelectorAll(s));
        arr.slice(0, Math.max(0, arr.length - 1)).forEach(function (el) {
          el.remove();
        });
      });
      // Không cho nút admin cũ/float hiện với user thường.
      if (!window.HODSupabase?.canOpenDashboard?.()) {
        document.querySelectorAll('#adminOpenBtn,#hodFloatAdmin').forEach(function (el) {
          el.remove();
        });
        document.getElementById('adminModal')?.classList.add('hidden');
      }
      // Tắt nút random nếu theme cũ còn inject lại.
      document.querySelectorAll('#shuffle,#stShuffle').forEach(function (el) {
        el.style.display = 'none';
        el.disabled = true;
      });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', cleanupOldUI);
    else cleanupOldUI();
    setTimeout(cleanupOldUI, 300);
    setTimeout(cleanupOldUI, 1200);
  })();
}

export function installFastParallelUpload() {
  // ===== FIX_ADD_SUBJECT_FAST_PARALLEL_UPLOAD_20260701 =====
  // Tăng tốc upload môn lớn: vẫn tránh 504 nhưng gửi nhiều câu song song có giới hạn.
  (function () {
    if (window.__FIX_ADD_SUBJECT_FAST_PARALLEL_UPLOAD_20260701) return;
    window.__FIX_ADD_SUBJECT_FAST_PARALLEL_UPLOAD_20260701 = true;

    const $ = id => document.getElementById(id);
    const LARGE_LIMIT = 80;
    const CONCURRENCY = 8; // số câu gửi cùng lúc; đủ nhanh nhưng không ép server quá mạnh

    function user() {
      return window.HODSupabase?.getUser?.() || null;
    }
    function profile() {
      return window.HODSupabase?.getProfile?.() || null;
    }
    function canManage() {
      const role = String(profile()?.role || '').toLowerCase();
      return !!user() && (window.HODSupabase?.isAdmin?.() || role === 'admin' || role === 'editor');
    }
    function toast(msg) {
      try {
        if (typeof notify === 'function') window.notify(msg);
      } catch (e) {
        lhWarn('FIX_ADD_SUBJECT_FAST_PARALLEL_UPLOAD_20260701', e);
      }
    }
    function prog(title, current, total, detail) {
      try {
        if (typeof showProgress === 'function') window.showProgress(title, current, total, detail || '');
      } catch (e) {
        lhWarn('FIX_ADD_SUBJECT_FAST_PARALLEL_UPLOAD_20260701', e);
      }
    }
    function hideProg() {
      try {
        if (typeof hideProgress === 'function') window.hideProgress();
      } catch (e) {
        lhWarn('FIX_ADD_SUBJECT_FAST_PARALLEL_UPLOAD_20260701', e);
      }
    }

    function cleanQuestions(arr) {
      return (Array.isArray(arr) ? arr : [])
        .map((q, i) => {
          const opts = q && typeof q.options === 'object' && !Array.isArray(q.options) ? q.options : {};
          const answer = String(q?.answer || '')
            .toUpperCase()
            .replace(/[^A-Z]/g, '');
          const images = Array.isArray(q?.images) ? q.images : [];
          return {
            num: Number(q?.num) || i + 1,
            question: String(q?.question || '').trim(),
            options: opts,
            answer,
            answer_text:
              q?.answer_text ||
              answer
                .split('')
                .map(k => k + '. ' + (opts[k] || ''))
                .join('; '),
            images,
            has_image: !!(q?.has_image || images.length),
            error_risk: q?.error_risk || 'low',
            error_risk_reason: q?.error_risk_reason || null,
          };
        })
        .filter(q => q.question && q.answer && q.options);
    }

    function readQuestions() {
      let arr = window.__previewImportData || window.__LH_LAST_PREVIEW_IMPORT_DATA || [];
      if (!Array.isArray(arr) || !arr.length) {
        try {
          let s = String(
            $('userImportData')?.value || localStorage.getItem('learninghub_add_subject_file_data_v1') || '',
          ).trim();
          const m = s.match(/```json\s*([\s\S]*?)```/i) || s.match(/```\s*([\s\S]*?)```/);
          if (m) s = m[1].trim();
          const j = JSON.parse(s);
          arr = Array.isArray(j) ? j : Array.isArray(j?.questions) ? j.questions : [];
        } catch (e) {
          arr = [];
        }
      }
      return cleanQuestions(arr);
    }

    async function postAction(action, payload) {
      const res = await fetch('/api/admin-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ user_id: user()?.id, action, payload }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || out.error) throw new Error(out.error || 'HTTP ' + res.status);
      return out;
    }

    function cacheCount(code, count) {
      try {
        const key = 'learninghub_subject_counts_cache_v3';
        const store = JSON.parse(localStorage.getItem(key) || '{}') || {};
        store.counts = store.counts || {};
        store.confirmed = store.confirmed || {};
        store.counts[code] = count;
        store.confirmed[code] = true;
        store.updated_at = new Date().toISOString();
        localStorage.setItem(key, JSON.stringify(store));
        localStorage.setItem('learninghub_subjects_dirty_v3', String(Date.now()));
        localStorage.removeItem('learninghub_subjects_cache_v1');
        sessionStorage.removeItem('learninghub_subject_counts_cache_v1');
        window.clearLearningHubSupabaseCache?.('subjects');
        window.clearLearningHubSupabaseCache?.('questions');
        window.clearLearningHubQuestionCache?.();
      } catch (e) {
        lhWarn('FIX_ADD_SUBJECT_FAST_PARALLEL_UPLOAD_20260701', e);
      }
    }

    function clearState() {
      try {
        window.__previewImportData = [];
        window.__LH_LAST_PREVIEW_IMPORT_DATA = [];
        $('importPreviewModal')?.classList.add('hidden');
        [
          'learninghub_add_subject_file_name_v1',
          'learninghub_add_subject_file_size_v1',
          'learninghub_add_subject_file_data_v1',
          'learninghub_add_subject_file_previewed_v1',
        ].forEach(k => localStorage.removeItem(k));
      } catch (e) {
        lhWarn('FIX_ADD_SUBJECT_FAST_PARALLEL_UPLOAD_20260701', e);
      }
    }

    async function uploadOne(finalCode, q, i) {
      await postAction('add_question', {
        question_data: {
          subject_code: finalCode,
          num: Number(q.num) || i + 1,
          question: q.question,
          options: q.options || {},
          answer: q.answer,
          answer_text: q.answer_text || '',
          images: q.images || [],
          has_image: !!q.has_image,
          error_risk: q.error_risk || 'low',
          error_risk_reason: q.error_risk_reason || null,
          updated_at: new Date().toISOString(),
        },
      });
    }

    async function uploadParallel(finalCode, questions) {
      let done = 0;
      let next = 0;
      const total = questions.length;
      const errors = [];
      prog('Đang upload câu hỏi...', 0, total, 'Upload nhanh: gửi ' + CONCURRENCY + ' câu cùng lúc');

      async function worker() {
        while (next < total && !errors.length) {
          const i = next++;
          try {
            await uploadOne(finalCode, questions[i], i);
          } catch (e) {
            errors.push('Câu ' + (questions[i].num || i + 1) + ': ' + (e?.message || e));
            break;
          }
          done++;
          prog('Đang upload câu hỏi...', done, total, 'Đã gửi ' + done + '/' + total + ' câu');
        }
      }

      const workers = Array.from({ length: Math.min(CONCURRENCY, total) }, () => worker());
      await Promise.all(workers);
      if (errors.length) throw new Error(errors[0]);
      return done;
    }

    async function createLarge(code, name, desc, questions) {
      prog('Đang tạo môn học...', 0, questions.length, 'Tạo môn trước, rồi upload nhiều câu song song...');
      const created = await postAction('add_subject', {
        code,
        name: name || code,
        description: desc || '',
        questions: [],
      });
      const finalCode = created.code || created.subject_code || code;
      const success = await uploadParallel(finalCode, questions);
      cacheCount(finalCode, success);
      return { finalCode, success };
    }

    async function createSmall(code, name, desc, questions) {
      prog('Đang lưu môn học...', 0, 100, 'Đang tạo môn và nhập câu hỏi...');
      const out = await postAction('add_subject', { code, name: name || code, description: desc || '', questions });
      const finalCode = out.code || out.subject_code || code;
      cacheCount(finalCode, questions.length);
      prog('Đang lưu môn học...', 100, 100, 'Hoàn tất');
      return { finalCode, success: questions.length };
    }

    window.__submitSubjectRequest = async function () {
      const code = ($('addSubjectCode')?.value || '').trim().toUpperCase();
      const name = ($('addSubjectName')?.value || '').trim();
      const desc = ($('addSubjectDesc')?.value || '').trim();
      const questions = readQuestions();

      if (!code) {
        alert('Vui lòng nhập mã môn');
        $('addSubjectCode')?.focus();
        return;
      }
      if (!/^[A-Z0-9_]{2,20}$/.test(code)) {
        alert('Mã môn chỉ gồm chữ, số, gạch dưới (2-20 ký tự)');
        $('addSubjectCode')?.focus();
        return;
      }
      if (!name) {
        alert('Vui lòng nhập tên môn');
        $('addSubjectName')?.focus();
        return;
      }
      if (!questions.length) {
        alert('Bạn cần chọn file và bấm Xem trước trước khi lưu môn học.');
        return;
      }
      if (!user()) {
        alert('Bạn cần đăng nhập trước khi lưu môn học.');
        return;
      }

      const btn = $('userImportBtn');
      const old = btn ? btn.textContent : '';
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Đang lưu...';
      }

      try {
        if (window.LHSubjectImport?.prepareZipQuestionsBeforeSave) {
          await window.LHSubjectImport.prepareZipQuestionsBeforeSave(questions, (done, total, text) => {
            prog('Đang upload ảnh Cloudinary...', done, total, text);
          });
        }

        if (canManage()) {
          const rs =
            questions.length > LARGE_LIMIT
              ? await createLarge(code, name, desc, questions)
              : await createSmall(code, name, desc, questions);
          const ok = 'Đã thêm môn ' + rs.finalCode + ' với ' + rs.success + ' câu hỏi';
          prog('Hoàn tất upload', rs.success, rs.success, ok);
          alert(ok);
          toast(ok);
          clearState();
          window.__switchSubjectGateTab?.('list');
          try {
            $('subjectRefresh')?.click();
            setTimeout(() => $('subjectRefresh')?.click(), 5600);
            setTimeout(() => window.refreshSubjectCountsOnce?.(), 6500);
          } catch (e) {
            lhWarn('FIX_ADD_SUBJECT_FAST_PARALLEL_UPLOAD_20260701', e);
          }
        } else {
          prog('Đang gửi yêu cầu tạo môn học...', 0, 100, 'Đang tải dữ liệu câu hỏi...');
          await postAction('add_subject_request', { code, name, description: desc || '', questions_data: questions });
          prog('Hoàn tất', 100, 100, 'Đã gửi yêu cầu');
          const ok = 'Đã gửi yêu cầu thêm môn ' + code + '. Vui lòng chờ admin duyệt.';
          alert(ok);
          toast(ok);
          clearState();
          window.__switchSubjectGateTab?.('list');
        }
      } catch (e) {
        console.warn('Fast add subject upload error:', e);
        alert('Lỗi tạo môn: ' + (e?.message || e));
        toast('Lỗi tạo môn');
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.textContent = old || 'Lưu Môn Học';
        }
        setTimeout(hideProg, 450);
      }
    };
  })();
  // ===== END FIX_ADD_SUBJECT_FAST_PARALLEL_UPLOAD_20260701 =====
}
