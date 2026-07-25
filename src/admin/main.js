/**
 * Learning Hub - Admin Application Main Bundle Entry Point
 */

import { renderUserRowSaaS, getUserTableHeadHTML } from './users.js';
import { uploadImageToCloudinary, calculateQuestionErrorRisk } from './questions.js';
import './adminCore.js';

// Global helper attachments
window.renderUserRowSaaS = renderUserRowSaaS;
window.getUserTableHeadHTML = getUserTableHeadHTML;
window.uploadImageToCloudinaryHelper = uploadImageToCloudinary;
window.calculateQuestionErrorRiskHelper = calculateQuestionErrorRisk;
