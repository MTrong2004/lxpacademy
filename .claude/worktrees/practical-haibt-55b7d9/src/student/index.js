/**
 * Main Student Module Entry Point
 */

import { getDeviceTypeString } from '../core/device.js';
import { getSubjectCode, setSubject, syncUserSubjectToProfile } from './subjects.js';
import { fetchApi, fetchSubjects, fetchQuestions } from './api.js';
import { filterQuestions } from './search.js';
import { shuffleQuestions, formatFlashcardFront, formatFlashcardBack } from './flashcards.js';

// Attach core helpers to global window scope for complete compatibility
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
