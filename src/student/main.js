/**
 * Learning Hub - Student Application Main Bundle Entry Point
 */

import { getDeviceTypeString } from '../core/device.js';
import { getSubjectCode, setSubject, syncUserSubjectToProfile } from './subjects.js';
import { fetchApi, fetchSubjects, fetchQuestions } from './api.js';
import { filterQuestions } from './search.js';
import { shuffleQuestions, formatFlashcardFront, formatFlashcardBack } from './flashcards.js';
import { initVersionChecker } from '../core/versionChecker.js';
import './appCore.js';

// Initialize auto version checker
initVersionChecker();

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

