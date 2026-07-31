/**
 * Learning Hub - Student Application Main Bundle Entry Point
 */

import { getDeviceTypeString } from '../core/device.js';
import { getSubjectCode, setSubject, syncUserSubjectToProfile } from './subjects.js';
import { fetchApi, fetchSubjects, fetchQuestions } from './api.js';
import { filterQuestions } from './search.js';
import { shuffleQuestions, formatFlashcardFront, formatFlashcardBack } from './flashcards.js';
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

import * as subjectImport from './subjectImport.js';
import * as bookmarks from './bookmarks.js';
import * as flashcards from './flashcards.js';
import * as auth from './auth.js';
import * as search from './search.js';

// Global helper attachments
window.LHSubjectImport = subjectImport;
window.LHBookmarks = bookmarks;
window.LHFlashcards = flashcards;
window.LHAuth = auth;
window.LHSearch = search;
window.getDeviceTypeString = getDeviceTypeString;
window.getSubjectCode = getSubjectCode;
window.setSubjectHelper = setSubject;
window.syncUserSubjectToProfileHelper = syncUserSubjectToProfile;
window.fetchApiHelper = fetchApi;
window.fetchSubjectsHelper = fetchSubjects;
window.fetchQuestionsHelper = fetchQuestions;
window.filterQuestionsHelper = filterQuestions;
window.shuffleQuestionsHelper = shuffleQuestions;
window.formatFlashcardFrontHelper = formatFlashcardFront;
window.formatFlashcardBackHelper = formatFlashcardBack;
