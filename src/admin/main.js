/**
 * Learning Hub - Admin Application Main Bundle Entry Point
 */

import { renderUserRowSaaS, getUserTableHeadHTML } from './users.js';
import { uploadImageToCloudinary, calculateQuestionErrorRisk } from './questions.js';
import { initVersionChecker } from '../core/versionChecker.js';
import './adminCore.js';

// Initialize auto version checker
initVersionChecker();

// Global helper attachments
window.renderUserRowSaaS = renderUserRowSaaS;
window.getUserTableHeadHTML = getUserTableHeadHTML;
window.uploadImageToCloudinaryHelper = uploadImageToCloudinary;
window.calculateQuestionErrorRiskHelper = calculateQuestionErrorRisk;

