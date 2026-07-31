/**
 * Learning Hub - Admin Application Main Bundle Entry Point
 */

import { renderUserRowSaaS, getUserTableHeadHTML } from './users.js';
import { uploadImageToCloudinary, calculateQuestionErrorRisk } from './questions.js';
import { initVersionChecker } from '../core/versionChecker.js';
// Phải đứng TRƯỚC './adminCore.js' — adminCore cũng bọc fetch (interceptor duy nhất
// LH_UNIFIED_SINGLE_FETCH_INTERCEPTOR_20260726). Xem ghi chú trong src/core/mock.js.
import '../core/mock.js';
import './adminCore.js';
// Phần auth phải gọi SAU adminCore — xem ghi chú trong src/core/mock.js.
import { installMock, clearMockLeftovers } from '../core/mock.js';

// Chế độ ?mock=1 (chỉ localhost) — tự bỏ qua nếu không có tham số.
const mocking = installMock();
if (!mocking) clearMockLeftovers();

// Initialize auto version checker
if (!mocking) initVersionChecker();

// Global helper attachments
window.renderUserRowSaaS = renderUserRowSaaS;
window.getUserTableHeadHTML = getUserTableHeadHTML;
window.uploadImageToCloudinaryHelper = uploadImageToCloudinary;
window.calculateQuestionErrorRiskHelper = calculateQuestionErrorRisk;
