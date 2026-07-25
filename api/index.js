/* 
  Learning Hub Edge API Router
  - Edge Runtime Function (/api/index.js)
  - Controller Modules: api/controllers/*
  - Utility Modules: api/lib/*
*/

export const config = { runtime: 'edge' };

import { json } from './lib/db.js';
import { verifyUser } from './lib/auth.js';
import { handleSubjects } from './controllers/subjects.js';
import { handleQuestions } from './controllers/questions.js';
import { handleProfile } from './controllers/profile.js';
import { handleEditRequests, handleMyEditRequests, handleStaffEditRequests } from './controllers/editRequests.js';
import { handleSettings } from './controllers/settings.js';
import { handleNotify } from './controllers/notify.js';
import { handleAdminDashboard, handleAdminAction } from './controllers/admin.js';

export default async function handler(req) {
  const parsedUrl = new URL(req.url);
  const path = parsedUrl.pathname.replace('/api/', '').split('/')[0];

  try {
    const NEEDS_AUTH = new Set(['subjects', 'questions', 'profile', 'edit-requests', 'my-edit-requests', 'staff-edit-requests', 'admin-dashboard', 'admin-action', 'notify']);
    let authUser = null;
    if (NEEDS_AUTH.has(path)) {
      authUser = await verifyUser(req);
      if (!authUser) return json({ error: 'Chưa đăng nhập hoặc phiên đã hết hạn.' }, 401);
    }

    switch (path) {
      case 'subjects':
        return await handleSubjects(req, authUser);
      case 'questions':
        return await handleQuestions(req, authUser, parsedUrl);
      case 'profile':
        return await handleProfile(req, authUser);
      case 'edit-requests':
        return await handleEditRequests(req, authUser);
      case 'my-edit-requests':
        return await handleMyEditRequests(req, authUser);
      case 'staff-edit-requests':
        return await handleStaffEditRequests(req, authUser);
      case 'settings':
        return await handleSettings(req);
      case 'notify':
        return await handleNotify(req, authUser);
      case 'admin-dashboard':
        return await handleAdminDashboard(req, authUser);
      case 'admin-action':
        return await handleAdminAction(req, authUser);
      default:
        return json({ error: 'Endpoint not found' }, 404);
    }
  } catch (e) {
    console.error('API Error:', e);
    return json({ error: e.message || 'Internal Server Error' }, 500);
  }
}
