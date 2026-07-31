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
import { postServerErrorEmbed } from './lib/discord.js';

export default async function handler(req) {
  const parsedUrl = new URL(req.url);
  const path = parsedUrl.pathname.replace('/api/', '').split('/')[0];

  try {
    const NEEDS_AUTH = new Set(['subjects', 'questions', 'profile', 'edit-requests', 'my-edit-requests', 'staff-edit-requests', 'admin-dashboard', 'admin-action', 'notify']);
    let authUser = null;
    if (NEEDS_AUTH.has(path)) {
      authUser = await verifyUser(req);
      // III: thiếu token / token không hợp lệ -> 401 UNAUTHORIZED (có code để
      // interceptor phía client phân biệt được với lỗi hệ thống).
      if (!authUser) return json({ error: 'Phiên đăng nhập không hợp lệ', code: 'UNAUTHORIZED' }, 401);
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
        return json({ error: 'Endpoint not found', code: 'NOT_FOUND' }, 404);
    }
  } catch (e) {
    /*
      III: chỉ exception thật mới là 500, và KHÔNG trả e.message ra browser.
      e.message của @libsql/client thường kèm URL database và đôi khi cả phần
      đầu auth token -> log ở server, gửi về client thông điệp chung chung.
      Client coi 500 là "không kết luận được quyền", KHÔNG coi là bị thu hồi quyền.
    */
    console.error('[API Error]', path, e?.stack || e?.message || e);
    /*
      SERVER_ERROR_DISCORD_20260729 — đây là chốt 500 DUY NHẤT của router, nên chỉ cần
      một lời gọi. Bọc try/catch riêng: webhook lỗi thì vẫn phải trả 500 đúng hình dạng
      (client dựa vào code INTERNAL_ERROR để hiện "thử lại", không được coi là mất quyền).
      postServerErrorEmbed tự gộp tin trùng và tự tôn trọng công tắc 'server_error'.
    */
    try {
      await postServerErrorEmbed(path, e);
    } catch (notifyErr) {
      console.warn('[server_error discord] không gửi được:', notifyErr?.message || notifyErr);
    }
    return json({ error: 'Đã xảy ra lỗi hệ thống', code: 'INTERNAL_ERROR' }, 500);
  }
}
