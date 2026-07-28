/**
 * Main Admin Module Entry Point
 */

import { renderUserRowSaaS, getUserTableHeadHTML } from './users.js';
import { uploadImageToCloudinary, calculateQuestionErrorRisk } from './questions.js';

window.renderUserRowSaaS = renderUserRowSaaS;
window.getUserTableHeadHTML = getUserTableHeadHTML;
window.uploadImageToCloudinaryHelper = uploadImageToCloudinary;
window.calculateQuestionErrorRiskHelper = calculateQuestionErrorRisk;
