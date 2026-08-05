/* 
  Learning Hub Edge API Router
  - Edge Runtime Function (/api/index.js)
  - Controller Modules: api/controllers/*
  - Utility Modules: api/lib/*
*/

export const config = { runtime: 'edge' };

import { json } from './_lib/db.js';
import { verifyUserDetailed } from './_lib/auth.js';
import { handleSubjects } from './_controllers/subjects.js';
import { handleQuestions } from './_controllers/questions.js';
import { handleProfile } from './_controllers/profile.js';
import { handleEditRequests, handleMyEditRequests, handleStaffEditRequests } from './_controllers/editRequests.js';
import { handleSettings } from './_controllers/settings.js';
import { handleNotify } from './_controllers/notify.js';
import { handleAdminDashboard, handleAdminAction } from './_controllers/admin.js';
// BOOKMARK_SYNC_PER_PART_20260806: "Lưu câu 🔖" đồng bộ giữa các thiết bị.
import { handleBookmarks } from './_controllers/bookmarks.js';
import { postServerErrorEmbed } from './_lib/discord.js';

export default async function handler(req) {
  const parsedUrl = new URL(req.url);
  const path = parsedUrl.pathname.replace('/api/', '').split('/')[0];

  try {
    const NEEDS_AUTH = new Set(['subjects', 'questions', 'profile', 'edit-requests', 'my-edit-requests', 'staff-edit-requests', 'admin-dashboard', 'admin-action', 'notify', 'bookmarks']);
    let authUser = null;
    if (NEEDS_AUTH.has(path)) {
      const verified = await verifyUserDetailed(req);
      authUser = verified.user;
      if (!authUser) {
        /*
          AUTH_VERIFY_INCONCLUSIVE_20260805: hai kết cục khác nhau, đừng gộp lại.
          - AUTH_CHECK_FAILED = không hỏi được Supabase (mạng/timeout/5xx/429). Client
            phải hiện "thử lại" và GIỮ NGUYÊN phiên đăng nhập -> 503, KHÔNG phải 401.
            Trả 401 ở đây là tự tay đăng xuất người dùng còn phiên tốt nguyên.
          - UNAUTHORIZED = thiếu token / Supabase khẳng định token sai -> 401 như cũ.
        */
        if (verified.code === 'AUTH_CHECK_FAILED') {
          // Cả hệ thống không kết luận được quyền: đúng loại lỗi cần biết ngay.
          // postServerErrorEmbed tự gộp tin trùng (1 tin / 5 phút / chữ ký lỗi).
          try {
            await postServerErrorEmbed(path + ' (verifyUser)', verified.error || new Error('AUTH_CHECK_FAILED'));
          } catch (notifyErr) {
            console.warn('[server_error discord] không gửi được:', notifyErr?.message || notifyErr);
          }
          return json(
            { error: 'Không xác minh được phiên đăng nhập, vui lòng thử lại.', code: 'AUTH_CHECK_FAILED' },
            503
          );
        }
        // III: thiếu token / token không hợp lệ -> 401 UNAUTHORIZED (có code để
        // interceptor phía client phân biệt được với lỗi hệ thống).
        return json({ error: 'Phiên đăng nhập không hợp lệ', code: 'UNAUTHORIZED' }, 401);
      }
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
      case 'bookmarks':
        return await handleBookmarks(req, authUser);
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
