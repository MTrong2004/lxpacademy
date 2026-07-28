/**
 * Learning Hub - Student Application Main Bundle Entry Point
 */

import { getDeviceTypeString } from '../core/device.js';
import { getSubjectCode, setSubject, syncUserSubjectToProfile } from './subjects.js';
import { fetchApi, fetchSubjects, fetchQuestions } from './api.js';
import { filterQuestions } from './search.js';
import { shuffleQuestions, formatFlashcardFront, formatFlashcardBack } from './flashcards.js';
import { initVersionChecker } from '../core/versionChecker.js';
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

// Global helper attachments
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
