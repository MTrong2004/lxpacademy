/**
 * Learning Hub - Student Application Main Bundle Entry Point
 */

import { getDeviceTypeString } from '../core/device.js';
import { getSubjectCode, setSubject, syncUserSubjectToProfile } from './subjects.js';
// `./api.js` (3 hàm fetch bọc /api) và `./index.js` đã XÓA 20260731: cả hai chỉ gán vào
// `window.*Helper` mà không chỗ nào đọc, và index.js là bản chép trùng của khối gán dưới đây.
import { initVersionChecker, showAdminReloadNotice } from '../core/versionChecker.js';
// PHẢI đứng TRƯỚC './appCore.js'. Thân mock.js tự cài lớp fetch giả lúc import; đặt
// trước để lớp đó nằm BÊN TRONG lớp bọc fetch của appCore, nhờ vậy response 401/403
// giả vẫn đi qua handleAccessRevoked của appCore. Xem ghi chú trong src/core/mock.js.
import '../core/mock.js';
import './appCore.js';
// Phần auth thì ngược lại: phải gọi SAU appCore vì appCore gán window.HODSupabase ở
// dòng ~1094, gọi trước sẽ bị nó ghi đè.
import { installMock, clearMockLeftovers } from '../core/mock.js';

// Chế độ ?mock=1 (chỉ localhost) — tự bỏ qua nếu không có tham số.
const mocking = installMock();
if (!mocking) clearMockLeftovers();

// Initialize auto version checker
if (!mocking) initVersionChecker();

// RELOAD_NOTICE_20260729: banner "Hệ thống vừa cập nhật" khi admin nhắc tải lại.
// Gán KHÔNG phụ thuộc `mocking` để ?mock=1 test được banner này.
window.lhShowReloadNotice = showAdminReloadNotice;

// `window.LHSubjectImport` là BẮT BUỘC: nhánh nhập môn từ file .zip trong appCore
// (ADD_SUBJECT_FEATURE) gọi importer qua đúng tên này — xem appCore ~1964.
import * as subjectImport from './subjectImport.js';

// Global helper attachments
window.LHSubjectImport = subjectImport;
window.getDeviceTypeString = getDeviceTypeString;
window.getSubjectCode = getSubjectCode;
window.setSubjectHelper = setSubject;
window.syncUserSubjectToProfileHelper = syncUserSubjectToProfile;
