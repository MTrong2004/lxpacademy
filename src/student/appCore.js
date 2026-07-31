import { installSubjectDataLoader, installActiveSubjectCountSync, installAppStartupAutoLoad } from './subjects.js';
import { installSmartSearch, installAddQuestionDisplay } from './search.js';
import { installHODSupabaseAndAvatar, installUnifiedFetchAndAccess } from './auth.js';
import { installBookmarks, installHeaderBell } from './bookmarks.js';
import {
  installFloatingParticles,
  installReportButtonOpenTab,
  installMobileFlashcardNavigation,
} from './flashcards.js';
import {
  installAddSubjectFeature,
  installImportPreviewInlineEdit,
  installFastParallelUpload,
} from './subjectImport.js';
import { LHState, initState } from './state.js';
/* AI_JS_MAP_START
Mục đích: Bản đồ nhanh cho AI đọc app.js, tránh sửa nhầm và tránh vá chồng. Không ảnh hưởng chức năng web.
Quy tắc sửa: giữ nguyên 1 file app.js, chỉ sửa nhóm liên quan, ưu tiên gộp vào block đang dùng. KHÔNG ĐỤNG Discord webhook.

NHÓM CHÍNH TRONG app.js
1) Config / dữ liệu ban đầu
- Tìm: APP_CONFIG, HOD_DATA, data, BASE, RAW, pool, STORE, rebuild
- Dùng cho: cấu hình Supabase, Cloudinary, dữ liệu câu hỏi, localStorage.

2) Helper chung
- Tìm: clone, notify, showProgress, hideProgress, esc, sortAns, answerText, finalAnswerText, imgsHTML, optionsHTML
- Dùng cho: thông báo, progress, escape HTML, đáp án, ảnh.

3) Flashcard
- Tìm: renderCard, fit, fitVisible, applyCardFontSize, flip, next, prev, reset, triggerReset, setupCardTools, updateCardTools
- Dùng cho: thẻ học, lật thẻ, câu trước/sau, ẩn lựa chọn, cỡ chữ.

4) Tab / Study / Search
- Tìm: switchTab, smart, renderStudy, studyList, search, openStudyReport, compactStudyCard, FINAL_SMART_SEARCH_STOPWORDS_RELEVANCE
- Dùng cho: tab Thư viện, tìm kiếm, mở/thu gọn câu, báo cáo từ thư viện.

5) Quiz / Exam
- Tìm: renderQuiz, pickAns, checkAns, score, startTimer, stopTimer, __examOnlyRender, FINAL_EXAM_ONLY_QUIZ_UI
- Dùng cho: luyện tập, thi, timer, chấm điểm.

6) Editor / Report câu hỏi
- Tìm: openEditor, renderEditOptions, renderEditImages, saveEditor, restoreEditor, submitEditRequest, edit_requests, question_history
- Dùng cho: báo cáo câu sai, sửa trực tiếp admin/editor, lưu lịch sử.

7) Supabase Auth / Profile
- Tìm: HODSupabase, signInGoogle, signIn, signUp, signOut, loadProfile, loadQuestionsFromSupabase, applyOAuthHashSession, currentUser, currentProfile
- Dùng cho: đăng nhập Google, profile, phân quyền admin/editor/user.

8) Discord login notify
- Tìm: sendLoginToDiscord, notifyLoginToDiscordOnce, discord.com/api/webhooks
- Dùng cho: thông báo đăng nhập Discord. LƯU Ý: KHÔNG ĐỤNG webhook theo yêu cầu.

9) Admin / quyền / dashboard
- Tìm: isAdmin, openAdmin, applyAdminGuard, patchAdmin, adminOpenBtn, hodFloatAdmin, adminModal
- Dùng cho: ẩn/hiện quyền admin, mở admin.html.

10) Account UI
- Tìm: hodTopAvatar, hodAccountMenu, avatarHTML, updateAll, updateMenu, hodReportModal
- Dùng cho: avatar, menu tài khoản, đăng xuất, xem báo cáo đã gửi.

11) Subject / Chọn môn
- Tìm: SUBJECT_STORE, subjectGate, getSubjects, renderSubjects, refreshSubjects, loadBySubject, setSubject, subjectTopChip, hodChangeSubjectBtn
- Dùng cho: chọn môn, tải câu hỏi theo subject_code, lưu tiến độ từng môn.

12) Add Subject / Import câu hỏi
- Tìm: ADD_SUBJECT_FEATURE, AI_PROMPT, getAddSubjectHTML, handleFileImport, __previewUserImport, __submitSubjectRequest, parsedQuestions, IMPORT_PREVIEW_INLINE_EDIT
- Dùng cho: thêm môn, copy prompt AI, import JSON/MD/TXT, xem trước câu hỏi.

13) Add Question / Nút + Thư viện
- Tìm: COPILOT_MERGED_ADD_QUESTION_DISPLAY_VERSION_20260629, addQuestionFab, addQuestionModal, savePrettyQuestion, addImgUpload
- Dùng cho: admin/editor thêm câu hỏi trực tiếp. Đây là bản đã gộp, không thêm HOTFIX nút + mới nếu không cần.

14) Image / Cloudinary / Upload
- Tìm: CLOUDINARY, cleanImages, upload, image, imgUpload, user-upload, COPILOT_CLOUDINARY_IMAGE_FIX, CLEAN_IMAGE_REQUEST, __LHUploadCloudinary, __LHCleanImages
- Dùng cho: upload ảnh câu hỏi, sửa/đổi ảnh, chuẩn hóa URL ảnh.

15) Mobile / UX runtime
- Tìm: mobileCardNav, touchstart, touchend, landingParticles, landingBgMover, last_activity
- Dùng cho: vuốt flashcard mobile, nền landing, cập nhật hoạt động người dùng.

16) Cache / Supabase
- Tìm: APP_F5_SUPABASE_CACHE_20260629, APP_REALTIME_CACHE_INVALIDATE
- Dùng cho: giảm gọi Supabase, cache dữ liệu; không dùng bảng thống kê băng thông cũ.

17) Block vá cuối file
- Tìm: FINAL_, PATCH_, HOTFIX_, COPILOT_
- Dùng cho: bản vá runtime. Khi sửa, ưu tiên hợp nhất vào block chính thay vì thêm vá chồng.

GỢI Ý AI
- Lỗi flashcard: xem nhóm 2 + 3 + 14 + 15.
- Lỗi thư viện/tìm kiếm: xem nhóm 4 + 6 + 13.
- Lỗi quiz/thi: xem nhóm 5.
- Lỗi đăng nhập/quyền: xem nhóm 7 + 8 + 9 + 10.
- Lỗi chọn môn/thêm môn: xem nhóm 11 + 12 + 13.
- Lỗi ảnh/upload: xem nhóm 6 + 14.
- Lỗi cache/Supabase: xem nhóm 16.
- NOTE_20260629: Đã bỏ chức năng tự ghi/thống kê băng thông; không thêm lại cơ chế ghi băng thông tự động.
- NOTE_20260630: Lần cập nhật này CHỈ bổ sung note/bản đồ AI ở đầu file, không đổi logic chạy web.
- NOTE_20260630: app.js đang dùng Turso/API nội bộ làm nguồn dữ liệu chính cho profile/questions/subjects; khi sửa dữ liệu ưu tiên các hàm /api/profile, /api/questions, /api/subjects và loadCurrentSubjectOnly/loadBySubject.
- NOTE_20260630: Có 2 lớp giảm gọi dữ liệu: APP_API_DEDUPE_QUESTIONS_PROFILE_20260630 và APP_F5_SUPABASE_CACHE_20260629; nếu sửa tải câu hỏi/profile/cache thì kiểm tra cả 2 block này trước khi thêm vá mới.
- NOTE_20260630: Thư viện đã có nhiều block UI mới: IMPORT_PREVIEW_INLINE_EDIT, LIBRARY_*_20260627, FINAL_SMART_SEARCH_STOPWORDS_RELEVANCE, FINAL_DELETE_BUTTON_BESIDE_OPEN, FIX_DELETE_NO_TOGGLE. Nếu sửa tab Thư viện thì ưu tiên cập nhật các block này.
- NOTE_20260630: Thi/quiz đang có FINAL_EXAM_ONLY_QUIZ_UI_20260627 và PERSIST_LAST_TAB_AND_EXAM_20260628; nếu sửa thi thì kiểm tra lưu trạng thái, timer, chấm điểm, giao diện đáp án.
- NOTE_20260630: Ảnh chỉ nên lưu URL sau khi upload Cloudinary; xem COPILOT_CLOUDINARY_IMAGE_FIX, FINAL_URL_ONLY_IMAGES_AND_CURRENT_RELOAD, CLEAN_IMAGE_REQUEST_DELETE_OLD_CREATE_NEW, COPILOT_FIX_EDIT_SAVE_UPLOAD_DIRECT, __LHUploadCloudinary, __LHCleanImages. Tránh lưu base64/data URL.
- NOTE_20260630: Add Question đã gộp ở COPILOT_MERGED_ADD_QUESTION_DISPLAY_VERSION_20260629; không tạo thêm nút + hoặc modal mới nếu chỉ sửa nhỏ.
- NOTE_20260630: Add Subject/Import có nhiều vá UI bước 1/2/preview; nếu sửa prompt/import, kiểm tra ADD_SUBJECT_FEATURE, PROMPT_STEP_*, IMPORT_PREVIEW_INLINE_EDIT và các block LIBRARY_UX_*.
- NOTE_20260630: Admin/editor có thể sửa trực tiếp và ghi question_history; user thường gửi edit_requests. Khi sửa phần báo cáo/sửa câu, giữ đúng phân quyền này.
- NOTE_20260630: Không đụng Discord webhook/login notify nếu không được yêu cầu riêng.
- NOTE_20260630: Sửa lỗi reset/refresh mất ảnh: imgUpload không dùng FileReader/base64, ảnh upload Cloudinary, save direct ghi Turso qua /api/admin-action.
- NOTE_CLEANUP_20260630: Đã dọn dead code (các dòng setTimeout/setInterval/listener bị comment-out trong DOMContentLoaded) và bỏ các console.log debug Cloudinary. Giữ nguyên console.warn/console.error (xử lý lỗi thật) và fallback console.log trong các helper notify/msg. Không đổi logic chạy.
- QUY_ƯỚC_CẤU_TRÚC: File này là chuỗi bản vá theo ngày, mỗi block bọc bởi marker "// ===== TÊN_NGÀY =====" ... "// ===== END TÊN_NGÀY =====". KHÔNG xóa marker (chúng là điểm neo tìm kiếm theo nhóm ở trên). Khi sửa, tìm marker liên quan và sửa trong block đó, ưu tiên hợp nhất thay vì thêm vá chồng mới.
- KIẾN_TRÚC_20260701 (QUAN TRỌNG): Supabase CHỈ dùng để Auth (đăng nhập Google). MỌI dữ liệu (questions/subjects/profiles/edit_requests/...) đọc-ghi qua API Turso nội bộ: GET /api/questions, /api/subjects, /api/settings; POST /api/profile, /api/edit-requests, /api/admin-action (action: add_question, save_question_direct, delete_question, add_subject, add_subject_request, approve_request...). TUYỆT ĐỐI không thêm code ghi dữ liệu bằng client.from(...) của Supabase nữa.
- CODE_CHẾT (đừng tưởng đang chạy): còn vài chỗ client.from('questions').select cũ là FALLBACK đã bị đường /api thay thế, không xóa vì sợ vỡ thứ tự nhưng không nên dựa vào. Khi cần loader câu hỏi, dùng fetchTursoQuestions/loadSubjectLight (/api/questions). Số câu mỗi môn lấy từ /api/subjects; mã môn hiển thị đầy đủ hậu tố (displayCode trả nguyên).
- NOTE_20260705b (đổi môn reset bài kiểm tra): loadBySubject() gọi window.__examResetForSubjectChange()
  (định nghĩa trong FINAL_EXAM_ONLY_QUIZ_UI) để xóa qSet/qSel/qDone/examSubmitted trong bộ nhớ, tránh tab
  Kiểm tra hiện lại đề của môn trước. KHÔNG xóa EXAM_STORE (đã gắn subject) → quay lại môn cũ vẫn resume được.
- NOTE_20260705 (tab Kiểm tra / gộp môn): danh sách môn của tab Kiểm tra KHÔNG được phụ thuộc getSubjectsCache() — cache đó chỉ được nạp khi user mở bảng chọn môn (xem comment "Danh sách môn chỉ tải khi người dùng mở bảng chọn môn" ~dòng 1230). FINAL_EXAM_ONLY_QUIZ_UI đã có ensureExamSubjects() tự tải /api/subjects (TTL 60s) rồi vẽ lại setup() để chip "Gộp thêm môn" (HOD102 ↔ HOD102_1) hiện ngay khi vào tab. Key localStorage 'learninghub_subjects_cache_v1' là KEY CHẾT (chỉ bị remove, không ai ghi) — đừng đọc/ghi nó.
AI_JS_MAP_END */

// LH_ERROR_SURFACING_20260727: mọi catch trong file này dùng lhWarn('<TÊN_BLOCK>', e)
// thay cho catch rỗng. Xem lỗi đã bị catch: mở Console gõ  lhErrors()
import { lhWarn } from '../core/log.js';
// Hàm định dạng thuần, trước ở ngay trong file này (xem docs/SPLIT_PLAN.md).
import { sortAns, answerText, finalAnswerText, fmt, clone, esc } from './format.js';
// Tính năng Kiểm tra. `installExam()` được gọi ĐÚNG chỗ block cũ đứng (~dòng 8118),
// không phải ở đây — import thì bị đưa lên đầu file, gọi ở đây là đổi thứ tự chạy.
import { installExam } from './exam.js';
// Sửa / báo cáo câu hỏi. Cũng gọi đúng chỗ block cũ đứng (~dòng 7900 và ~11190).
import { installEditor, installEditorPasteUpload } from './editor.js';
// Ảnh + upload Cloudinary. Năm hàm install, mỗi hàm gọi đúng chỗ block cũ đứng.
import {
  installUploadDiagnostics,
  installUploadLock,
  installImageVisibleAfterSave,
  installEditImagesRender,
  installImgsHTML,
} from './images.js';
// Thư viện câu hỏi (tab "Thư viện").
import { installLibraryLabelFix, installLibrary } from './library.js';
// Cổng chọn môn + số câu mỗi môn. Năm hàm install, mỗi hàm gọi đúng chỗ block cũ đứng
// (~dòng 2344, 8449, 8460, 8749, 8946) — không gọi ở đây.
import {
  installSubjectGate,
  installGateAriaFix,
  installSubjectCountsCache,
  installClearAddSubjectDraft,
  installSubjectCountsFallback,
} from './subjectGate.js';

// ===== FIX_OAUTH_SESSION_FINAL_20260628 =====
if (location.hash && location.hash.includes('&amp;')) {
  history.replaceState(null, '', location.href.replace(/&amp;/g, '&'));
}
// ===== END FIX_OAUTH_SESSION_FINAL_20260628 =====

// ===== CONFIG LOADED FROM config.js =====
window.APP_CONFIG = window.APP_CONFIG || {
  SUPABASE_URL: 'https://kxyukiwhhorvxgxxxmfq.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_yOIciG2SCPyu8mP5KWE5RQ_qIgCd4-f',
  LOGIN_NOTIFY_ENDPOINT: 'https://kxyukiwhhorvxgxxxmfq.supabase.co/functions/v1/login-notify',
  CLOUDINARY_CLOUD_NAME: 'ddc4uvm7m',
  CLOUDINARY_UPLOAD_PRESET: 'learninghub_unsigned',
  CLOUDINARY_UPLOAD_FOLDER: 'learninghub/questions',
  CLOUDINARY_UPLOAD_URL: 'https://api.cloudinary.com/v1_1/ddc4uvm7m/image/upload',
};
// ===== END CONFIG FALLBACK =====

// ===== PATCH_MOBILE_PERF_PAUSE_INTERVALS_20260702 =====
// Mục đích: tối ưu hiệu năng/pin trên điện thoại. File này có nhiều setInterval (watchdog UI,
// tự gắn lại nút, polling...) chạy liên tục kể cả khi tab bị ẩn / màn hình khoá, gây hao pin và giật máy.
// Cách làm: chặn TẤT CẢ setInterval ở tầng window - callback chỉ chạy khi document.hidden === false.
// Khi tab hiện lại (visibilitychange), lần tick kế tiếp sẽ tự chạy bình thường, không cần reload trang.
// AN TOÀN: không đổi delay, không đổi logic bên trong từng interval, không xoá bất kỳ setInterval nào.
// Đặt patch này NGAY SAU config, TRƯỚC mọi code khác trong file để áp dụng cho toàn bộ setInterval phía sau.
// KHÔNG XOÁ patch này nếu còn muốn giữ tối ưu pin/CPU trên mobile.
(function () {
  const nativeSetInterval = window.setInterval;
  window.setInterval = function (fn, delay, ...args) {
    if (typeof fn !== 'function') return nativeSetInterval(fn, delay, ...args);
    function wrapped() {
      if (document.hidden) return;
      return fn.apply(this, arguments);
    }
    return nativeSetInterval(wrapped, delay, ...args);
  };
})();
// ===== END PATCH_MOBILE_PERF_PAUSE_INTERVALS_20260702 =====

// ===== PATCH_TAB_ISOLATED_SUBJECT_SESSION_20260701 =====
// Mục đích: cho phép mở nhiều tab để so sánh nhiều môn học cùng lúc mà không bị "nhảy" môn khi F5 (reload).
// Cách làm: key localStorage 'learninghub_subject_code_merged_v1' (môn đang chọn) được tách làm 2 lớp:
//  - sessionStorage: riêng cho từng tab, luôn được đọc trước -> F5 đúng tab đó không đổi môn.
//  - localStorage: vẫn ghi song song, chỉ dùng làm giá trị mặc định cho TAB MỚI mở (tab chưa từng chọn môn).
// Toàn bộ code còn lại trong file vẫn gọi localStorage.getItem/setItem/removeItem như cũ (kể cả qua biến
// SUBJECT_STORE/STORE), không cần sửa từng chỗ; patch này chỉ "chặn" riêng đúng 1 key ở tầng Storage.prototype,
// không đổi hành vi các key khác (progress, cache, ...).
// KHÔNG XÓA patch này nếu còn muốn giữ tính năng nhiều tab độc lập theo môn.
(function () {
  const KEY = 'learninghub_subject_code_merged_v1';
  const nativeGet = Storage.prototype.getItem;
  const nativeSet = Storage.prototype.setItem;
  const nativeRemove = Storage.prototype.removeItem;

  Storage.prototype.getItem = function (key) {
    if (this === window.localStorage && key === KEY) {
      const tabVal = nativeGet.call(window.sessionStorage, KEY);
      if (tabVal !== null) return tabVal;
      return nativeGet.call(window.localStorage, KEY);
    }
    return nativeGet.call(this, key);
  };

  Storage.prototype.setItem = function (key, value) {
    if (this === window.localStorage && key === KEY) {
      nativeSet.call(window.sessionStorage, KEY, value);
    }
    return nativeSet.call(this, key, value);
  };

  Storage.prototype.removeItem = function (key) {
    if (this === window.localStorage && key === KEY) {
      nativeRemove.call(window.sessionStorage, KEY);
    }
    return nativeRemove.call(this, key);
  };
})();
// ===== END PATCH_TAB_ISOLATED_SUBJECT_SESSION_20260701 =====

/*
  ===== APP_API_DEDUPE_QUESTIONS_PROFILE_20260630 — ĐÃ XÓA (VIII) =====
  Đây là lớp ghi đè window.fetch thứ nhất trong bốn lớp. Nó cache RESPONSE của
  POST /api/profile trong 30 giây và GET /api/questions trong 60 giây ở phía
  client.

  Vì sao phải xóa hẳn chứ không vá tiếp:
  - Nó vô hiệu hóa chính cơ chế thu hồi quyền. Admin khóa tài khoản -> Realtime
    báo -> loadProfile(true) gọi lại /api/profile -> lớp này trả về BẢN 200 CŨ
    còn trong cache, tối đa 30 giây. Tệ hơn: nếu 403 được cache thì user vừa
    được duyệt lại vẫn bị chặn.
  - Nó cache cả response lỗi, không phân biệt status.
  - Việc chống gọi trùng /api/profile nay nằm đúng chỗ của nó: hàng rào
    lhRevalidateAccess() (dedupe request đang chạy + debounce 3s) ở cuối file.
  Chống gọi trùng /api/questions do server lo (cache 5 phút phía Edge), client
  không cần cache thêm.
*/

window.HOD_DATA = [];
(function () {
  var s = document.createElement('script');
  s.type = 'application/json';
  s.id = 'data';
  s.textContent = '[]';
  document.head.appendChild(s);
})();

// === LOCAL DEV BYPASS: skip login when opened from file:// ===
if (location.protocol === 'file:') {
  window.__LOCAL_DEV_MODE = true;
  document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('hodLoginGate')?.classList.add('hidden');
    document.getElementById('hodPendingApproval')?.classList.add('hidden');
    document.body?.classList.remove('hod-locked');
    var sg = document.getElementById('subjectGate');
    if (sg) {
      sg.classList.remove('hidden');
      sg.setAttribute('aria-hidden', 'false');
      document.body.classList.add('has-subject-gate');
    }
  });
}

/*
  ===== APP_F5_SUPABASE_CACHE_20260629 — ĐÃ XÓA (VIII) =====
  Lớp ghi đè window.fetch thứ hai. Cache GET Supabase REST (/rest/v1/questions,
  subjects, profiles, site_settings) trong sessionStorage với TTL 10 phút.
  Đã lỗi thời: dữ liệu học nay đọc từ Turso qua /api/*, Supabase chỉ còn dùng cho
  Auth + Realtime. Riêng việc cache /rest/v1/profiles 10 phút còn nguy hiểm —
  đó chính là bảng trạng thái quyền cũ.
  Phần cache Supabase REST còn cần thiết (ảnh/câu hỏi trong form sửa của
  editor) đã được gộp vào interceptor duy nhất ở cuối file.
  Các hàm window.clearLearningHubQuestionCache / clearLearningHubSupabaseCache
  vẫn tồn tại (do nhiều nơi khác gọi) và được định nghĩa lại ở interceptor đó.
*/

/* ===== merged app logic ===== */

('use strict');
const dataEl = document.getElementById('data'),
  BASE = [],
  STORE = 'hod102_user_edits_v1';
let edits = {};
try {
  edits = JSON.parse(localStorage.getItem(STORE) || '{}');
} catch (e) {
  lhWarn('merged', e);
}
// `clone` đã chuyển sang ./format.js (import ở đầu file) để ./editor.js dùng chung.
function notify(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.remove('hidden');
  t.classList.add('show');
  clearTimeout(t._tid);
  t._tid = setTimeout(() => {
    t.classList.add('hidden');
    t.classList.remove('show');
  }, 2200);
}

function showProgress(title, current, total, detail = '') {
  let el = document.getElementById('adminProgressOverlay');
  if (!el) {
    el = document.createElement('div');
    el.id = 'adminProgressOverlay';
    el.className = 'adminProgressOverlay hidden';
    el.innerHTML = `
      <div class="adminProgressBox">
        <h3 id="adminProgressTitle">Đang xử lý...</h3>
        <div class="adminProgressTrack">
          <div id="adminProgressBar" class="adminProgressBar"></div>
        </div>
        <div class="adminProgressSub">
          <span id="adminProgressPercent" class="adminProgressPercent">0% (0/0)</span>
          <span id="adminProgressDetail" class="adminProgressDetail"></span>
        </div>
      </div>
    `;
    document.body.appendChild(el);
  }

  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  document.getElementById('adminProgressTitle').textContent = title;
  document.getElementById('adminProgressBar').style.width = pct + '%';
  document.getElementById('adminProgressPercent').textContent = pct + '% (' + current + '/' + total + ')';
  document.getElementById('adminProgressDetail').textContent = detail;
  el.classList.remove('hidden');
}

function hideProgress() {
  const el = document.getElementById('adminProgressOverlay');
  if (el) el.classList.add('hidden');
}
// Phơi ra window để ./exam.js gọi được (nó nằm ngoài file này nên không thấy binding
// module). Không phải lớp ghi đè: hai hàm này chỉ được khai báo đúng một lần.
window.showProgress = showProgress;
window.hideProgress = hideProgress;

// State dùng chung đã chuyển sang ./state.js (xem docs/SPLIT_PLAN.md bước 1).
// Mọi chỗ dùng là LHState.<tên>; các file tính năng tách sau này import cùng object này.
initState(BASE);
/**
 * REBUILD_DEAD_LOCAL_20260731 — ĐỔI TÊN, đừng đặt lại thành `rebuild`.
 *
 * Hàm này dựng `LHState.RAW` từ `BASE` + `edits` (bản sửa để trong localStorage). Từ khi dữ
 * liệu chỉ lấy ở Turso thì `BASE` luôn là `[]`, nên nó chỉ còn tác dụng đúng một lần: gieo
 * state rỗng lúc nạp file. Bản đang chạy của cái tên `rebuild` là `window.rebuild` của block
 * PATCH_NO_LOCAL_QUESTIONS_SUPABASE_ONLY (~1310) — cũng đặt RAW = [].
 *
 * Trước đây nó tên `rebuild`, nên BA chỗ gọi trần `rebuild()` bên dưới (restoreEditor,
 * importEditsFile, clearEdits) đều rơi vào ĐÂY và **xoá trắng thư viện thành "0 / 0 câu"**.
 * Cả hai bản đều làm RAW rỗng, nên đổi sang `window.rebuild?.()` KHÔNG chữa được — ba chỗ đó
 * nay tải lại từ Turso.
 */
function seedStateFromBase() {
  LHState.RAW = BASE.map(c => Object.assign(clone(c), edits[c.num] || {}));
  LHState.pool = LHState.pool.length
    ? LHState.pool.map(o => LHState.RAW.find(c => c.num === o.num) || o)
    : [...LHState.RAW];
}
seedStateFromBase();
/**
 * Dựng lại danh sách câu sau khi đụng vào `edits` (khôi phục / nhập / xoá bản sửa local).
 * Nguồn thật là Turso nên phải TẢI LẠI, không dựng từ `BASE`.
 */
async function reloadAfterLocalEditChange(tag) {
  try {
    if (typeof window.loadCurrentSubjectOnly === 'function') {
      await window.loadCurrentSubjectOnly(true);
      return;
    }
  } catch (e) {
    lhWarn(tag, e);
  }
  renderAllSafe();
}
const $ = id => document.getElementById(id);
// `esc` đã chuyển sang ./format.js (import ở đầu file) để ./images.js dùng chung.
// sortAns / answerText / finalAnswerText đã chuyển sang ./format.js (import ở đầu file)
// để exam.js dùng chung. Cách gọi không đổi.
function optionsHTML(c) {
  return Object.entries(c.options || {})
    .map(([k, v]) => `<div class="opt"><div class="letter">${k}</div><div class="ot">${esc(v)}</div></div>`)
    .join('');
}
/*
  HÀM CHUYỂN TIẾP + thân dự phòng. Bản ĐANG CHẠY là `window.imgsHTML` do ./images.js gán
  (installImgsHTML — nó lọc bỏ ảnh `data:` và đọc nhiều tên field khác nhau).

  Vẫn giữ thân gốc bên dưới làm dự phòng, KHÔNG xóa: `installImgsHTML()` chạy ở khoảng dòng
  11200, còn hàm này có thể bị gọi sớm hơn trong lúc appCore đang nạp.
*/
function imgsHTML(c) {
  const liveImgsHTML = window.imgsHTML;
  if (typeof liveImgsHTML === 'function' && liveImgsHTML !== imgsHTML) return liveImgsHTML(c);
  let raw = c?.images || [];
  if (typeof raw === 'string') {
    const s = raw.trim();
    if ((s.startsWith('[') && s.endsWith(']')) || (s.startsWith('{') && s.endsWith('}'))) {
      try {
        raw = JSON.parse(s);
      } catch (e) {
        raw = [s];
      }
    } else if (s) raw = [s];
    else raw = [];
  }
  if (!Array.isArray(raw)) raw = [raw];
  return raw
    .map(im => {
      if (!im) return '';
      const src =
        typeof im === 'string' ? im : im.src || im.url || im.secure_url || im.publicUrl || im.public_url || '';
      if (!src || String(src).startsWith('data:image/')) return '';
      return `<img src="${esc(src)}" alt="" loading="lazy" decoding="async">`;
    })
    .join('');
}
function setv(k, v) {
  document.documentElement.style.setProperty(k, v);
}
function fit(c) {
  setv('--qfs', '1.08rem');
  setv('--ofs', '.92rem');
  setv('--qlh', '1.32');
  setv('--olh', '1.36');
  setv('--afs', '1rem');
  const imgHtml = imgsHTML(c);
  const hasImg = !!(imgHtml && imgHtml.trim().length > 0);
  setv('--imgmax', hasImg ? '380px' : '0px');
  setv('--imgcol', hasImg ? '620px' : '0px');
  setv('--frontpad', '14px 18px');
  setv('--optgap', '6px');
  setv('--optpad', '7px 10px');
  setv('--qmb', '8px');
  setv('--imgmb', '7px');
  setv('--tagmb', '6px');
  setv('--letter', '25px');
  setv('--letterfs', '.76rem');
  setv('--tagfs', '.62rem');
  setv('--tagpad', '3px 10px');
  setv('--ogap', '8px');
}
function fitVisible() {
  return;
}
// ===== FIX_LIBRARY_STALE_AFTER_SUBJECT_CHANGE_20260727 =====
// Gọi 3 render ĐỘC LẬP nhau. Trước đây các luồng tải câu hỏi đều viết
//   try { renderCard(); renderQuiz(); renderStudy(); } catch (e) { lhWarn('FIX_LIBRARY_STALE_AFTER_SUBJECT_CHANGE_20260727', e) }
// nên chỉ cần renderCard ném lỗi là renderStudy() không bao giờ chạy -> đổi môn
// xong thư viện vẫn hiện câu của MÔN CÚ (phải bấm lại tab hoặc F5 mới thấy môn mới).
// Lỗi hay gặp: đang ở tab Thư viện/Kiểm tra thì fixCounter (FINAL_HEADER_SUBJECT_DYNAMIC_FIX)
// ghi lại .counter thành "<b id=subjectTotalCount>N</b> câu" -> #idx/#total bị xóa khỏi DOM
// -> renderCard chạm $('idx').textContent trên null. Xem thêm guard trong renderCard.
function renderAllSafe() {
  try {
    renderCard?.();
  } catch (e) {
    console.warn('[renderCard]', e);
  }
  try {
    renderQuiz?.();
  } catch (e) {
    console.warn('[renderQuiz]', e);
  }
  try {
    renderStudy?.();
  } catch (e) {
    console.warn('[renderStudy]', e);
  }
}
window.renderAllSafe = renderAllSafe;
// ===== FIX_LIBRARY_STALE_AFTER_SUBJECT_CHANGE_20260727 END =====
function renderCardBase() {
  let c = LHState.pool[LHState.ci] || LHState.RAW[0];
  if (!c) return;
  fit(c);
  applyCardFontSize();
  const __idxEl = $('idx');
  if (__idxEl) __idxEl.textContent = LHState.ci + 1;
  const __totalEl = $('total');
  if (__totalEl) __totalEl.textContent = LHState.pool.length;
  const __barEl = $('bar');
  if (__barEl) __barEl.style.width = (LHState.pool.length ? ((LHState.ci + 1) / LHState.pool.length) * 100 : 0) + '%';
  const __tagEl = $('tag');
  if (__tagEl) __tagEl.textContent = 'CÂU ' + c.num;
  const __qEl = $('question');
  if (__qEl) __qEl.textContent = c.question;
  const __imgEl = $('images');
  if (__imgEl) {
    const __imgHtml = imgsHTML(c);
    const __hasImg = !!__imgHtml.trim();
    __imgEl.innerHTML = __imgHtml;
    __imgEl.style.display = __hasImg ? 'flex' : 'none';
    document.querySelector('#fc .front')?.classList.toggle('hasImg', __hasImg);
  }
  $('options').innerHTML = optionsHTML(c);
  $('options').classList.remove('hide');
  LHState.hideOptions = false;
  applyCardFontSize();
  updateCardTools();
  if (typeof window.updateBookmarkBtn === 'function') window.updateBookmarkBtn();
  $('ansLetter').textContent = (c.answer || '').split('').join(', ');
  $('ansText').innerHTML = esc(c.answer_text || answerText(c)).replace(/; /g, '<br>');
  $('card').classList.remove('dir-horizontal', 'dir-up', 'dir-down');
  $('card').classList.add('dir-' + LHState.flipDir);
  $('card').classList.toggle('flip', LHState.flipped);
  $('mode').textContent = LHState.flipMode === 'single' ? '1x' : '2x';
  var _sc = localStorage.getItem('learninghub_subject_code_merged_v1') || '';
  localStorage.setItem('hod102_ci', LHState.ci);
  if (_sc) localStorage.setItem('learninghub_progress_' + _sc, LHState.ci);
  localStorage.setItem('hod102_flip_mode', LHState.flipMode);
}
/*
  RENDER_CARD_WINDOW_BRIDGE_20260731

  `renderCard` bị xếp lớp Ở FILE KHÁC (subjects.js: 3 lớp — lazy ảnh của
  FINAL_URL_ONLY_IMAGES_AND_CURRENT_RELOAD_20260628 và đồng bộ số câu của
  ACTIVE_SUBJECT_COUNT_SYNC_20260629). Hồi còn một file, chúng gán thẳng vào binding
  `renderCard` nên 16 chỗ gọi trong appCore đều nhận đủ chuỗi lớp. Tách file xong thì
  module ES không cho gán chéo: `renderCard` trong subjects.js là BIẾN TOÀN CỤC
  (window.renderCard) — mà appCore chưa từng phơi tên này ra window, nên
  `typeof renderCard === 'function'` ở đó trả false và CẢ BA lớp đều không được cài,
  đồng thời `window.renderCard` không bao giờ tồn tại → 6 chỗ gọi `window.renderCard?.()`
  (editor.js, images.js, library.js, subjectGate.js) thành no-op im lặng. Triệu chứng:
  thêm/xóa ảnh trong form sửa xong thẻ Flashcard KHÔNG vẽ lại, phải lật thẻ hoặc qua câu
  khác rồi quay lại mới thấy.

  Cách nối lại: bản THẬT đặt tên `renderCardBase` và phơi ra `window.renderCard` ngay tại
  đây (trước installSubjectDataLoader() ~3582 và installActiveSubjectCountSync() ~4018 —
  đúng chỗ các lớp cũ đứng). `renderCard` giữ nguyên tên nhưng chỉ còn là hàm CHUYỂN TIẾP
  đọc `window.renderCard` LÚC GỌI, giống cách renderQuiz/renderStudy/openEditor đang làm.
  Nhờ vậy cả lời gọi trong appCore lẫn lời gọi từ module khác đều đi qua cùng một chuỗi lớp.
  Lớp cuối (COPILOT_KEEP_IMPORT_QUESTION_ATTRIBUTES_20260629 ~4222) cũng phải bọc
  window.renderCard, đừng bọc lại binding này.
*/
window.renderCard = renderCardBase;
function renderCard() {
  return (window.renderCard || renderCardBase).apply(this, arguments);
}
function flip(dir = 'horizontal') {
  LHState.flipDir = dir;
  LHState.flipped = !LHState.flipped;
  renderCard();
}
function next() {
  LHState.ci = (LHState.ci + 1) % LHState.pool.length;
  LHState.flipped = false;
  LHState.flipDir = 'horizontal';
  renderCard();
}
function prev() {
  LHState.ci = (LHState.ci - 1 + LHState.pool.length) % LHState.pool.length;
  LHState.flipped = false;
  LHState.flipDir = 'horizontal';
  renderCard();
}
function shuffle() {
  for (let i = LHState.pool.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [LHState.pool[i], LHState.pool[j]] = [LHState.pool[j], LHState.pool[i]];
  }
  LHState.ci = 0;
  LHState.flipped = false;
  LHState.flipDir = 'horizontal';
  LHState.randomActive = false;
  localStorage.setItem('hod102_random_active', '0');
  renderCard();
  let sh = $('shuffle');
  if (sh) {
    sh.classList.add('flash');
    setTimeout(() => sh.classList.remove('flash'), 650);
  }
}
let __allowUserReset = false;
function reset(force) {
  if (force !== true && __allowUserReset !== true) {
    try {
      renderCard();
    } catch (e) {
      lhWarn('appCore', e);
    }
    return;
  }
  __allowUserReset = false;
  LHState.pool = [...LHState.RAW];
  LHState.ci = 0;
  LHState.flipped = false;
  LHState.flipDir = 'horizontal';
  LHState.randomActive = false;
  localStorage.setItem('hod102_random_active', '0');
  renderCard();
}
function triggerReset() {
  __allowUserReset = true;
  reset(true);
}
function switchTab(n, b) {
  try {
    localStorage.setItem('learninghub_last_tab_v1', n);
  } catch (e) {
    lhWarn('appCore', e);
  }
  document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
  if (b) b.classList.add('active');
  document.querySelectorAll('.pane').forEach(x => x.classList.remove('active'));
  const targetPane = $(n);
  if (targetPane) targetPane.classList.add('active');

  const portal = document.getElementById('kizspyExamPortal');
  if (n !== 'quiz') {
    document.body.classList.remove('kizspy-active');
    if (portal) portal.remove();
  }

  if (n === 'study') renderStudy();
  if (n === 'quiz')
    try {
      renderQuiz();
    } catch (e) {
      lhWarn('appCore', e);
    }
  if (typeof window.fixCounter === 'function') window.fixCounter();
}
// Phơi ra window cho ./bookmarks.js (chuông thông báo bấm vào một yêu cầu sửa thì nhảy
// sang tab Thư viện). KHÔNG ai bọc thêm lớp cho switchTab nên chỉ cần gán thẳng.
window.switchTab = switchTab;
// `sample()` chuyển sang ./exam.js (chỉ bài kiểm tra gọi), `fmt()` sang ./format.js.
function startTimer() {
  clearInterval(LHState.timerInt);
  LHState.examStart = Date.now();
  LHState.timerInt = setInterval(() => ($('timer').textContent = fmt(Date.now() - LHState.examStart)), 1000);
}
function stopTimer() {
  clearInterval(LHState.timerInt);
}
function syncQuizSet() {
  if (LHState.qSet && LHState.qSet.length) {
    LHState.qSet = LHState.qSet.map(c => LHState.RAW.find(x => x.num === c.num) || c);
  }
}
/*
  Hàm CHUYỂN TIẾP, không phải bản vẽ thật. Bản thật nằm trong ./exam.js và tự gán vào
  `window.renderQuiz` (trước khi tách exam.js, nó gán thẳng vào binding module này —
  từ file khác thì module ES không cho gán nữa).

  Vẫn cần hàm này vì ~15 chỗ trong appCore gọi `renderQuiz()` theo tên, không qua window.
  So `!== renderQuiz` để nếu có ai gán window.renderQuiz = chính hàm này thì không đệ quy.
*/
function renderQuiz() {
  // Tên riêng cho từng hàm chuyển tiếp: scripts/check-overrides.js không phân biệt scope,
  // ba biến local cùng tên `live` ngoài block bị nó tính thành 3 lớp ghi đè.
  const liveRenderQuiz = window.renderQuiz;
  if (typeof liveRenderQuiz === 'function' && liveRenderQuiz !== renderQuiz) return liveRenderQuiz();
  if (typeof window.__examOnlyRender === 'function') return window.__examOnlyRender();
  const body = $('quizBody');
  if (body) body.innerHTML = '';
}
function pickAns(i, k) {
  if ((LHState.quizMode === 'practice' && LHState.qDone[i]) || LHState.examSubmitted) return;
  let c = LHState.qSet[i];
  if (c.answer.length > 1) {
    let set = new Set((LHState.qSel[i] || '').split('').filter(Boolean));
    set.has(k) ? set.delete(k) : set.add(k);
    LHState.qSel[i] = [...set].sort().join('');
  } else LHState.qSel[i] = k;
  renderQuiz();
}
function checkAns(i) {
  if (!LHState.qSel[i]) {
    alert('Bạn chọn đáp án trước nha.');
    return;
  }
  LHState.qDone[i] = true;
  renderQuiz();
}
function score() {
  /* old practice score overlay removed */
}
function smart(q) {
  q = q.trim().toLowerCase();
  if (!q) return LHState.RAW;
  let m = q.match(/^#(\d+)$/);
  if (m) return LHState.RAW.filter(c => c.num === +m[1]);
  m = q.match(/^answer\s*:\s*([a-e]+)$/i);
  if (m) return LHState.RAW.filter(c => sortAns(c.answer) === sortAns(m[1].toUpperCase()));
  if (['multi', 'multiple', 'chọn nhiều'].includes(q)) return LHState.RAW.filter(c => c.answer.length > 1);
  return LHState.RAW.filter(c =>
    (
      String(c.num) +
      ' ' +
      c.question +
      ' ' +
      c.answer +
      ' ' +
      (c.answer_text || '') +
      ' ' +
      Object.values(c.options).join(' ')
    )
      .toLowerCase()
      .includes(q),
  );
}
/*
  HÀM CHUYỂN TIẾP + thân dự phòng (như imgsHTML). Bản ĐANG CHẠY là `renderUnified` của
  ./library.js, tự gán vào `window.renderStudy`. 11 chỗ trong appCore gọi `renderStudy()`
  theo TÊN nên phải có hàm này.

  Thân gốc bên dưới giữ làm dự phòng cho quãng trước khi `installLibrary()` chạy — không
  xóa. Trước 20260727 quãng đó do `renderStudyBetter` (FINAL_SMART_SEARCH) đảm nhiệm; hai
  lớp gán trần của nó đã xóa vì từ file khác không gán được binding module này nữa.
*/
function renderStudy() {
  const liveRenderStudy = window.renderStudy;
  if (typeof liveRenderStudy === 'function' && liveRenderStudy !== renderStudy) return liveRenderStudy();
  let arr = smart($('search').value || ''),
    max = arr.length;
  $('studyList').innerHTML =
    arr
      .slice(0, max)
      .map(
        c =>
          `<div class="sitem"><div class="snum">CÂU ${c.num}</div><div class="sq">${esc(c.question)}</div><div class="qimgs">${imgsHTML(c)}</div><div class="sopts">${Object.entries(
            c.options,
          )
            .map(
              ([k, v]) =>
                `<div class="sopt ${c.answer.includes(k) ? 'ans' : ''}"><div class="skey">${c.answer.includes(k) ? '✓' : k}</div><div>${esc(k + '. ' + v)}</div></div>`,
            )
            .join('')}</div></div>`,
      )
      .join('') +
    (arr.length > max
      ? `<div class="more">Đang hiển thị ${max} / ${arr.length} kết quả.</div>`
      : arr.length
        ? ''
        : '<div class="more">Không tìm thấy kết quả.</div>');
}
/*
  DEAD_OVERRIDE_20260727 — CHÚ THÍCH GỐC cho cả nhóm sửa câu hỏi, các chỗ khác trỏ về đây.

  THÂN hàm này là mã chết, nhưng KHAI BÁO phải giữ: 8 chỗ khác trong file gán trần
  `openEditor = …` (không const/let), trong module ES thì không có khai báo là ReferenceError.

  Bản ĐANG CHẠY là `openEditPreview` (và `saveEditPreview`) của block
  LIBRARY_FILTER_AND_EDIT_PREVIEW_LAYOUT_20260627. Lý do: block đó gọi `apply()` ba lần —
  trực tiếp, `setTimeout(apply, 0)` và `setTimeout(apply, 900)` — và `apply()` gán VÔ ĐIỀU KIỆN
  `openEditor = openEditPreview` / `saveEditor = saveEditPreview`. Mọi lớp gán ĐỒNG BỘ đều
  chạy xong trước cả hai timer đó, nên tất cả đều bị ghi đè.

  Xác minh 20260727 trên app đang chạy (không phải suy luận của script):
    String(window.openEditor).slice(0, 60)   -> "function openEditPreview() { … }"
    String(window.saveEditor).slice(0, 60)   -> "async function saveEditPreview() { … }"

  Vậy nên: **sửa lỗi editor / upload ảnh thì sửa vào openEditPreview & saveEditPreview**.
  Vá vào các lớp dưới đây là vá vào chỗ không bao giờ chạy — đó chính là kiểu lỗi
  "lúc được lúc không" đã đi tìm suốt.

  Cẩn thận khi dọn: các block đánh dấu chết Ở ĐÂY vẫn còn phần SỐNG (chúng bind
  `#imgUpload.onchange`, `#saveEdit.onclick` trong `setTimeout(boot, 1500)` và phơi
  `__LHCleanImages` / `__LHUploadCloudinary` / `__LHGetPendingImageUpload` ra window cho
  6 chỗ khác gọi). Chỉ lớp gán openEditor/saveEditor là chết, KHÔNG phải cả block.
  Kế hoạch xóa + phép thử phải chạy khi đã đăng nhập: docs/SPLIT_PLAN.md bước 3.
*/
/*
  HÀM CHUYỂN TIẾP (20260727). Thân cũ — bản editor "cổ" bám vào #editTitle / #editQuestion /
  #editOptions — đã xóa: nó là mã chết (xem khối trên) và mọi id đó bị openEditPreview xóa
  khỏi DOM. Bản thật nằm trong ./editor.js, tự gán vào `window.openEditor`.

  Vẫn cần hàm này vì 5 chỗ trong appCore gọi `openEditor()` theo TÊN (nút "!" trên Flashcard
  ~938/945, #stEdit, phím `e` ~1087, openStudyReport ~4768, ~8757) — module ES không cho
  ./editor.js gán vào binding này.
*/
function openEditor() {
  const liveOpenEditor = window.openEditor;
  if (typeof liveOpenEditor === 'function' && liveOpenEditor !== openEditor) return liveOpenEditor();
  console.warn('[openEditor] chưa có bản thật từ ./editor.js');
}
// HÀM CHUYỂN TIẾP + thân dự phòng, như imgsHTML ở trên. Bản đang chạy là
// `window.renderEditImages` do ./images.js gán (installEditImagesRender — bản có guard null).
function renderEditImages() {
  const liveRenderEditImages = window.renderEditImages;
  if (typeof liveRenderEditImages === 'function' && liveRenderEditImages !== renderEditImages)
    return liveRenderEditImages();
  let box = $('editImgs');
  if (!box) {
    const input = $('imgUpload');
    if (!input) return;
    box = document.createElement('div');
    box.id = 'editImgs';
    box.className = 'editImgs';
    input.insertAdjacentElement('afterend', box);
  }
  box.innerHTML =
    (LHState.editDraft.images || [])
      .map((im, i) => {
        const src =
          im && typeof im === 'object' ? im.src || im.url || im.secure_url || im.publicUrl || im.public_url || '' : im;
        return `<div class="editImg"><button class="rm" data-rm="${i}">×</button><img src="${esc(src)}" loading="lazy" decoding="async"><input class="imgUrlBox" value="${esc(src)}" readonly onclick="this.select()" title="Bấm để chọn URL ảnh" style="margin-top:6px;width:100%;max-width:260px;border:1px solid rgba(200,169,110,.24);border-radius:10px;background:rgba(0,0,0,.22);color:var(--gold2);padding:7px;font-size:.72rem;"></div>`;
      })
      .join('') || '<p style="color:var(--mist)">Chưa có hình.</p>';
}
// HÀM CHUYỂN TIẾP (20260727), cùng lý do như openEditor ở trên. Thân cũ đã xóa (mã chết).
// Chỗ duy nhất còn dùng tên này trong appCore là `$('saveEdit').onclick = saveEditor` (~950).
function saveEditor() {
  const liveSaveEditor = window.saveEditor;
  if (typeof liveSaveEditor === 'function' && liveSaveEditor !== saveEditor) return liveSaveEditor();
  console.warn('[saveEditor] chưa có bản thật từ ./editor.js');
}
/**
 * Lưu bản sửa vào localStorage khi KHÔNG có kết nối duyệt (nhánh dự phòng của editor).
 * Phải là hàm chứ không phơi thẳng `edits` ra window: `edits` bị GÁN LẠI lúc chạy
 * (nhập file sửa ~dòng 752, xóa hết ~1053) nên ./editor.js giữ tham chiếu cũ là ghi nhầm
 * vào object đã bị thay.
 */
function saveLocalEdit(num, patch) {
  edits[num] = patch;
  localStorage.setItem(STORE, JSON.stringify(edits));
}
window.__LHSaveLocalEdit = saveLocalEdit;
async function restoreEditor() {
  delete edits[LHState.editDraft.num];
  localStorage.setItem(STORE, JSON.stringify(edits));
  $('editModal').classList.add('hidden');
  notify('Đã khôi phục');
  // REBUILD_DEAD_LOCAL_20260731: trước đây gọi `rebuild()` -> rơi vào hàm local dựng RAW từ
  // `BASE` (rỗng) nên bấm "Khôi phục" là thư viện về "0 / 0 câu". Bản gốc của câu nằm ở
  // Turso, nên khôi phục = tải lại, không phải dựng lại từ localStorage.
  await reloadAfterLocalEditChange('RESTORE_EDITOR');
  syncQuizSet();
}
// Phơi ra window cho ./editor.js (nút "Khôi phục" trong editor gọi hàm này) và cho
// `notify`. Tên có tiền tố __LH để check:overrides không tưởng là thêm lớp ghi đè cho
// `restoreEditor` — nó không phân biệt scope, thấy hàm khai báo ngoài block CỘNG một lần
// gán window là báo 2 lớp.
window.__LHRestoreEditor = restoreEditor;
window.notify = notify;
function exportEdits() {
  let blob = new Blob([JSON.stringify(edits, null, 2)], { type: 'application/json' }),
    a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'hod102_user_edits.json';
  a.click();
  URL.revokeObjectURL(a.href);
}
function importEditsFile(f) {
  let fr = new FileReader();
  fr.onload = () => {
    try {
      edits = JSON.parse(fr.result) || {};
      localStorage.setItem(STORE, JSON.stringify(edits));
      // REBUILD_DEAD_LOCAL_20260731: xem chú thích ở seedStateFromBase — `rebuild()` cũ xoá
      // trắng danh sách câu.
      reloadAfterLocalEditChange('IMPORT_EDITS_FILE');
      notify('Đã nhập file sửa');
    } catch (e) {
      alert('File JSON không hợp lệ');
    }
  };
  fr.readAsText(f);
}
function applyCardFontSize() {
  let n = parseFloat(LHState.cardFontSize || '1');
  if (!isFinite(n)) n = 1;
  n = Math.max(0.8, Math.min(1.3, n));
  LHState.cardFontSize = String(n);
  let root = document.documentElement,
    fc = $('fc');
  let set = (k, v) => {
    root.style.setProperty(k, v);
    if (fc) fc.style.setProperty(k, v);
  };
  let base = 1.08 * n;
  set('--card-qfs', (1.05 * base).toFixed(3) + 'rem');
  set('--card-ofs', (0.88 * base).toFixed(3) + 'rem');
  set('--card-afs', (0.95 * base).toFixed(3) + 'rem');
  set('--card-letter', (24 * Math.min(1.2, base)).toFixed(0) + 'px');
  set('--card-letterfs', (0.72 * base).toFixed(3) + 'rem');
  localStorage.setItem('hod102_card_font_size_v3', String(n));
  if ($('stCardFont')) $('stCardFont').value = Math.round(n * 100);
  if ($('stCardFontState')) $('stCardFontState').textContent = Math.round(n * 100) + '%';
}
function updateCardToolsBase() {
  LHState.hideOptions = false;
  try {
    localStorage.removeItem('hod102_hide_options');
  } catch (e) {
    lhWarn('appCore', e);
  }
  let sh = $('shuffle'),
    eye = $('toggleOpts');
  if (sh) {
    sh.classList.remove('active');
    sh.title = 'Xáo ngẫu nhiên';
  }
  if (eye) eye.remove();
}
/*
  Cùng khuôn với RENDER_CARD_WINDOW_BRIDGE_20260731 (xem chú thích ở renderCardBase):
  `updateCardTools` bị BOOKMARK_QUESTIONS_FEATURE_20260726 bọc thêm một lớp (vẽ nút 🔖 lên
  thẻ). Block đó đã dọn sang ./bookmarks.js, mà module khác không gán được vào binding của
  appCore — nên bản THẬT phải nằm ở `window.updateCardTools`, còn tên này chỉ là hàm CHUYỂN
  TIẾP đọc window lúc gọi. Bọc thêm lớp thì bọc `window.updateCardTools`, đừng bọc binding.
*/
window.updateCardTools = updateCardToolsBase;
function updateCardTools() {
  return (window.updateCardTools || updateCardToolsBase).apply(this, arguments);
}
function setupGlobalHeader() {
  let top = document.querySelector('#fc .top');
  let tabs = document.querySelector('.tabs');
  if (top && !top.classList.contains('globalTop')) {
    top.classList.add('globalTop');
    document.body.insertBefore(top, tabs || document.body.firstChild);
  }
}
function setupCardTools() {
  let card = $('card');
  if (!card || $('cardTools')) return;
  let tools = document.createElement('div');
  tools.id = 'cardTools';
  tools.className = 'cardTools';
  let sh = $('shuffle'),
    eye = $('toggleOpts'),
    ed = $('editCard');
  if (eye) eye.remove();
  if (sh) {
    sh.textContent = '⚂';
    sh.classList.add('cardToolBtn', 'diceBtn');
    tools.appendChild(sh);
  }
  tools.addEventListener('click', e => e.stopPropagation());
  tools.addEventListener('mousedown', e => e.stopPropagation());
  card.insertBefore(tools, ed);
  updateCardTools();
}
function updateSettingsUI() {
  if (!$('stFlipState')) return;
  $('stFlipState').textContent =
    'Đang dùng: ' + (LHState.flipMode === 'single' ? '1x - bấm 1 lần để lật' : '2x - hạn chế lật nhầm');
  if ($('stOptState')) $('stOptState').textContent = 'Đang hiện lựa chọn';
  if ($('stToggleOpts')) $('stToggleOpts').style.display = 'none';
  if ($('stGoInput')) $('stGoInput').value = LHState.pool[LHState.ci]?.num || '';
  applyCardFontSize();
  updateCardTools();
}
function toggleFlipMode() {
  LHState.flipMode = LHState.flipMode === 'single' ? 'double' : 'single';
  LHState.flipped = false;
  renderCard();
  updateSettingsUI();
}
function goToQuestionNum() {
  let n = +$('stGoInput').value;
  if (!n) {
    alert('Nhập số câu trước nha.');
    return;
  }
  let i = LHState.pool.findIndex(c => c.num === n);
  if (i < 0) i = LHState.RAW.findIndex(c => c.num === n);
  if (i < 0) {
    alert('Không tìm thấy câu ' + n);
    return;
  }
  if (!LHState.pool.find(c => c.num === n)) LHState.pool = [...LHState.RAW];
  LHState.ci = i;
  LHState.flipped = false;
  renderCard();
  updateSettingsUI();
  $('settingsModal').classList.add('hidden');
}
function init() {
  setupGlobalHeader();
  document.querySelectorAll('.tab').forEach(btn => (btn.onclick = () => switchTab(btn.dataset.tab, btn)));
  $('shuffle').onclick = shuffle;
  $('reset').onclick = () => triggerReset();
  if ($('toggleOpts')) $('toggleOpts').remove();
  try {
    localStorage.removeItem('hod102_hide_options');
  } catch (e) {
    lhWarn('appCore', e);
  }
  $('openSettings').onclick = () => {
    $('settingsModal').classList.remove('hidden');
    updateSettingsUI();
  };
  $('closeSettings').onclick = () => $('settingsModal').classList.add('hidden');
  document.querySelectorAll('.modal,.overlay').forEach(m => {
    m.addEventListener('mousedown', e => {
      if (e.target === m) m.classList.add('hidden');
    });
  });
  document.querySelectorAll('.modal .box,.overlay .box').forEach(box => {
    if (!box.querySelector('.modalX')) {
      let x = document.createElement('button');
      x.className = 'modalX';
      x.type = 'button';
      x.textContent = '×';
      x.title = 'Đóng';
      x.onclick = e => {
        e.stopPropagation();
        box.closest('.modal,.overlay')?.classList.add('hidden');
      };
      box.prepend(x);
    }
  });
  setupCardTools();
  if ($('toggleGuide'))
    $('toggleGuide').onclick = () => {
      let g = $('guidePanel'),
        open = g.classList.toggle('hidden') === false;
      $('toggleGuide').textContent = open ? 'Ẩn hướng dẫn' : 'Mở hướng dẫn';
    };
  if ($('stCardFont'))
    $('stCardFont').oninput = e => {
      LHState.cardFontSize = (+e.target.value / 100).toFixed(2);
      applyCardFontSize();
      renderCard();
    };
  if ($('stCardFontReset'))
    $('stCardFontReset').onclick = () => {
      LHState.cardFontSize = '1';
      applyCardFontSize();
      renderCard();
      updateSettingsUI();
    };
  if ($('stToggleFlipMode')) $('stToggleFlipMode').onclick = toggleFlipMode;
  if ($('stToggleOpts')) $('stToggleOpts').style.display = 'none';
  if ($('stShuffle'))
    $('stShuffle').onclick = () => {
      shuffle();
      updateSettingsUI();
    };
  if ($('stReset'))
    $('stReset').onclick = () => {
      triggerReset();
      updateSettingsUI();
    };
  if ($('stGo')) $('stGo').onclick = goToQuestionNum;
  if ($('stGoInput'))
    $('stGoInput').onkeydown = e => {
      if (e.key === 'Enter') goToQuestionNum();
    };
  if ($('stEdit'))
    $('stEdit').onclick = () => {
      openEditor();
      $('settingsModal').classList.add('hidden');
    };
  $('editCard').title = 'Báo cáo / đề xuất sửa câu';
  $('editCard').textContent = '!';
  $('editCard').onclick = e => {
    e.stopPropagation();
    openEditor();
  };
  $('prev').onclick = prev;
  $('next').onclick = next;
  $('mode').onclick = toggleFlipMode;
  const handleCardClick = e => {
    if (e.target.closest('#editCard') || e.target.closest('#cardTools') || e.target.closest('.modal')) return;
    if (LHState.flipMode === 'single') {
      flip('horizontal');
    }
  };

  $('zone').onclick = e => {
    const cardNode = $('card');
    if (cardNode && !cardNode.contains(e.target)) {
      let r = cardNode.getBoundingClientRect();
      typeof slideChange === 'function'
        ? slideChange(e.clientX < r.left ? 'prev' : 'next')
        : e.clientX < r.left
          ? prev()
          : next();
      return;
    }
  };

  const cardEl = $('card');
  if (cardEl) {
    cardEl.onclick = e => {
      e.stopPropagation();
      handleCardClick(e);
    };
    cardEl.ondblclick = e => {
      e.stopPropagation();
      if (LHState.flipMode === 'double') {
        flip('horizontal');
      }
    };
  }
  /* old Practice/Exam quiz UI bindings removed */ $('search').oninput = renderStudy;
  $('studyList').onclick = e => {
    let it = e.target.closest('.sitem');
    if (it) it.classList.toggle('open');
  };
  $('closeEdit').onclick = () => $('editModal').classList.add('hidden');
  $('saveEdit').onclick = saveEditor;
  $('restoreEdit').onclick = restoreEditor;
  $('editImgs').onclick = e => {
    let b = e.target.closest('[data-rm]');
    if (b) {
      LHState.editDraft.images.splice(+b.dataset.rm, 1);
      renderEditImages();
    }
  };
  $('imgUpload').onchange = async e => {
    const files = [...e.target.files];
    if (!files.length) return;
    window.__LH_EDIT_IMAGE_UPLOADING = (window.__LH_EDIT_IMAGE_UPLOADING || 0) + files.length;
    const saveBtn = $('saveEdit');
    if (saveBtn) saveBtn.disabled = true;
    if (typeof notify === 'function') notify('Đang tải ảnh lên Cloudinary...');
    try {
      for (const file of files) {
        try {
          const config = window.APP_CONFIG;
          if (!config || !config.CLOUDINARY_UPLOAD_URL)
            throw new Error('Thiếu cấu hình Cloudinary trong config.js hoặc app.js');
          const formData = new FormData();
          formData.append('file', file);
          formData.append('upload_preset', config.CLOUDINARY_UPLOAD_PRESET);
          formData.append('folder', config.CLOUDINARY_UPLOAD_FOLDER);
          const res = await fetch(config.CLOUDINARY_UPLOAD_URL, { method: 'POST', body: formData });
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error?.message || 'Upload Cloudinary thất bại');
          }
          const data = await res.json();
          LHState.editDraft.images = LHState.editDraft.images || [];
          LHState.editDraft.images.push({
            id: data.public_id,
            src: data.secure_url,
            url: data.secure_url,
            secure_url: data.secure_url,
            source: 'cloudinary',
            name: file.name,
          });
          if (typeof window.__LHCleanImages === 'function')
            LHState.editDraft.images = window.__LHCleanImages(LHState.editDraft.images);
          renderEditImages();
          if (typeof notify === 'function') notify('Đã upload ảnh lên Cloudinary');
        } catch (err) {
          console.error('[Upload Error]:', err);
          alert('Không thể tải ảnh lên: ' + err.message);
        } finally {
          window.__LH_EDIT_IMAGE_UPLOADING = Math.max(0, (window.__LH_EDIT_IMAGE_UPLOADING || 1) - 1);
        }
      }
    } finally {
      e.target.value = '';
      if (saveBtn) saveBtn.disabled = window.__LH_EDIT_IMAGE_UPLOADING > 0;
    }
  };
  $('exportEdits').onclick = exportEdits;
  $('importEdits').onclick = () => $('importFile').click();
  $('importFile').onchange = e => {
    if (e.target.files[0]) importEditsFile(e.target.files[0]);
  };
  $('clearEdits').onclick = () => {
    if (confirm('Xóa tất cả chỉnh sửa đã lưu?')) {
      edits = {};
      localStorage.removeItem(STORE);
      // REBUILD_DEAD_LOCAL_20260731: xem chú thích ở seedStateFromBase.
      reloadAfterLocalEditChange('CLEAR_EDITS');
      notify('Đã xóa tất cả sửa');
    }
  };
  window.onkeydown = e => {
    if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if ($('quiz') && $('quiz').classList.contains('active')) {
      return;
    }
    if (e.code === 'Space') {
      e.preventDefault();
      flip('horizontal');
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      flip('up');
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      flip('down');
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      typeof slideChange === 'function' ? slideChange('next', e.repeat) : next();
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      typeof slideChange === 'function' ? slideChange('prev', e.repeat) : prev();
    }
    if (e.key.toLowerCase() === 'r') triggerReset();
    if (e.key.toLowerCase() === 'e') openEditor();
    if (e.key === '1') document.querySelector('[data-tab="fc"]').click();
    if (e.key === '2') document.querySelector('[data-tab="quiz"]').click();
    if (e.key === '3') document.querySelector('[data-tab="study"]').click();
  };
  applyCardFontSize();
  setupCardTools();
  renderCard();
  renderQuiz();
}
document.addEventListener('DOMContentLoaded', init);

// ===============================
// HOD102 + Supabase MVP bridge
// 1-file frontend. Fill SUPABASE_URL and SUPABASE_ANON_KEY after creating your Supabase project.
// IMPORTANT: Never paste service_role key here. Use anon key only.
// ===============================
// ===== HOD102 + Supabase MVP bridge & Avatar =====
installHODSupabaseAndAvatar();
// ===== END HOD102 + Supabase MVP bridge & Avatar =====

// ===== LEARNING HUB MERGED SUBJECT PATCH START =====
// Thân block đã chuyển sang ./subjectGate.js. Gọi đúng chỗ cũ để thứ tự chạy không đổi.
installSubjectGate();
// ===== LEARNING HUB MERGED SUBJECT PATCH END =====

// ===== ADD_SUBJECT_FEATURE_20260625 (UPGRADED TAB UX/UI) =====
// Thân block đã chuyển sang ./subjectImport.js. Gọi đúng chỗ block cũ đứng.
installAddSubjectFeature();
// ===== ADD_SUBJECT_FEATURE END =====

// ===== PATCH_NO_LOCAL_QUESTIONS_SUPABASE_ONLY =====
(function () {
  const SUBJECT_STORE = 'learninghub_subject_code_merged_v1';
  const $ = id => document.getElementById(id);
  const code = () => localStorage.getItem(SUBJECT_STORE) || '';
  const supa = () => window.HODSupabase?.__client || null;
  const logged = () => !!window.HODSupabase?.getUser?.();
  function empty(msg) {
    try {
      LHState.RAW = [];
      LHState.pool = [];
      LHState.ci = 0;
      LHState.flipped = false;
      LHState.randomActive = false;
      localStorage.setItem('hod102_random_active', '0');
    } catch (e) {
      lhWarn('PATCH_NO_LOCAL_QUESTIONS_SUPABASE_ONLY', e);
    }
    try {
      if ($('idx')) $('idx').textContent = '0';
      if ($('total')) $('total').textContent = '0';
      if ($('bar')) $('bar').style.width = '0%';
      if ($('question')) $('question').textContent = msg || 'Chưa tải dữ liệu từ Supabase';
      if ($('options')) $('options').innerHTML = '';
      if ($('images')) $('images').innerHTML = '';
      renderQuiz?.();
      renderStudy?.();
    } catch (e) {
      lhWarn('PATCH_NO_LOCAL_QUESTIONS_SUPABASE_ONLY', e);
    }
  }
  async function loadSubjectOnly() {
    const subject = code();
    if (!logged()) {
      empty('Đăng nhập để tải dữ liệu từ Turso');
      return false;
    }
    if (!subject) {
      empty('Chọn môn để tải dữ liệu từ Turso');
      return false;
    }
    // ACCESS_GATE_STRICT_20260726: fail-closed.
    if (!window.lhHasFullAccess?.(window.HODSupabase?.getProfile?.() || null)) {
      empty('Tài khoản đang chờ duyệt');
      return false;
    }
    // GLOBALS_BRIDGE_20260731: bỏ khối `if (typeof syncUserSubjectToProfile === 'function')`
    // ở đây. Bản thật nằm ở subjectGate.js (~114) nên tên trần luôn cho `undefined` —
    // khối này CHƯA TỪNG chạy kể từ lúc tách file. Không nối cầu vì `setSubject()` của
    // subjectGate đã POST /api/profile mỗi lần đổi môn rồi; nối lại chỉ là gửi trùng một
    // request ghi mỗi lần tải câu. Cần bật lại thì dùng `window.syncUserSubjectToProfile`.
    try {
      const res = await fetch('/api/questions?subject_code=' + encodeURIComponent(subject) + '&ts=' + Date.now(), {
        cache: 'no-store',
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.error) throw new Error(json.error || 'Không tải được questions từ Turso');
      const data = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
      LHState.RAW = data.map(r => ({
        id: r.id,
        subject_code: r.subject_code || subject,
        num: r.num,
        question: r.question,
        options: r.options || {},
        answer: r.answer,
        answer_text: r.answer_text,
        // GLOBALS_BRIDGE_20260731: qua window — bản thật ở subjects.js, `typeof cleanImages`
        // trần luôn false từ lúc tách file nên ảnh chưa từng được lọc ở đây.
        images: window.cleanImages?.(r.images || []) ?? r.images ?? [],
        has_image: !!(r.has_image || (r.images || []).length),
        error_risk: r.error_risk || 'low',
        error_risk_reason: r.error_risk_reason || '',
        __imagesChecked: true,
        __imagesLoaded: true,
      }));
      LHState.pool = [...LHState.RAW];
      var _saved2 = +localStorage.getItem('learninghub_progress_' + subject) || 0;
      LHState.ci = Math.max(0, Math.min(_saved2, Math.max(0, LHState.pool.length - 1)));
      LHState.flipped = false;
      LHState.randomActive = false;
      localStorage.setItem('hod102_random_active', '0');
      try {
        if ($('total')) $('total').textContent = String(LHState.RAW.length);
      } catch (e) {
        lhWarn('PATCH_NO_LOCAL_QUESTIONS_SUPABASE_ONLY', e);
      }
      renderAllSafe(); // FIX_LIBRARY_STALE_AFTER_SUBJECT_CHANGE_20260727
      try {
        // GLOBALS_BRIDGE_20260731: cả hai đều là hàm của file khác. `syncSubjectTexts` trần
        // ném ReferenceError (bản thật ở subjectGate.js) và kéo theo `updateCardTools` không
        // bao giờ chạy — đổi môn xong là mất nút 🔖 trên thẻ.
        window.syncSubjectTexts?.();
        window.updateCardTools?.();
      } catch (e) {
        console.warn('[Turso render]', e);
      }
      return true;
    } catch (e) {
      console.warn('[Turso current subject]', e);
      empty('Không tải được dữ liệu Turso');
      return false;
    }
  }
  window.loadCurrentSubjectOnly = loadSubjectOnly;
  function patchLoaders() {
    try {
      window.rebuild = function () {
        LHState.RAW = [];
        LHState.pool = [];
        return LHState.RAW;
      };
    } catch (e) {
      lhWarn('PATCH_NO_LOCAL_QUESTIONS_SUPABASE_ONLY', e);
    }
    if (window.HODSupabase) {
      window.HODSupabase.loadQuestionsFromSupabase = loadSubjectOnly;
    }
  }
  function enforceNoLocal() {
    patchLoaders();
    const subject = code();
    try {
      if (!Array.isArray(LHState.RAW) || !LHState.RAW.length) {
        if (logged() && subject) loadSubjectOnly();
        return;
      }
      if (LHState.RAW.some(q => !q.id || !q.subject_code || q.subject_code !== subject)) loadSubjectOnly();
    } catch (e) {
      lhWarn('PATCH_NO_LOCAL_QUESTIONS_SUPABASE_ONLY', e);
    }
  }
  document.addEventListener('DOMContentLoaded', () => {
    empty('Đang tải dữ liệu từ Turso...');
    patchLoaders();
    // Tắt tự load lặp lại: chỉ load khi đăng nhập/chọn môn.
  });
  patchLoaders();
})();

// ===== PATCH_REMOVE_RANDOM_FEATURE_FINAL =====
(function () {
  function $(id) {
    return document.getElementById(id);
  }
  function hide() {
    ['shuffle', 'stShuffle'].forEach(id => {
      let e = $(id);
      if (e) {
        e.style.display = 'none';
        e.disabled = true;
        e.onclick = () => false;
      }
    });
    try {
      LHState.randomActive = false;
      localStorage.setItem('hod102_random_active', '0');
    } catch (e) {
      lhWarn('PATCH_REMOVE_RANDOM_FEATURE_FINAL', e);
    }
  }
  window.shuffle = shuffle = function () {
    hide();
    return false;
  };
  document.addEventListener('DOMContentLoaded', () => {
    hide();
    setTimeout(hide, 300);
    setTimeout(hide, 1000);
  });
  hide();
})();

// ===== PATCH_SUPABASE_SINGLE_SOURCE_ONLY =====
(function () {
  try {
    window.HOD_DATA = [];
  } catch (e) {
    lhWarn('PATCH_SUPABASE_SINGLE_SOURCE_ONLY', e);
  }
  try {
    const dataNode = document.getElementById('data');
    if (dataNode) dataNode.textContent = '[]';
  } catch (e) {
    lhWarn('PATCH_SUPABASE_SINGLE_SOURCE_ONLY', e);
  }
})();

// ===== FINAL_FLOATING_PARTICLES_CANVAS_20260613 =====
if (typeof finalAnswerText !== 'function') {
  function finalAnswerText(c) {
    const raw = String(c?.answer_text ?? '').trim();
    const ans = String(c?.answer ?? '')
      .trim()
      .toUpperCase();
    if (!raw || raw.toUpperCase() === ans || /^[A-E]+$/i.test(raw)) return answerText(c);
    return raw;
  }
}
// Thân block đã chuyển sang ./flashcards.js. Gọi đúng chỗ block cũ đứng để thứ tự chạy không đổi.
installFloatingParticles();
/*
  ===== IIFE "lưu trực tiếp" cũ trong FINAL_FLOATING_PARTICLES_CANVAS_20260613 — ĐÃ XÓA (20260727) =====
  171 dòng. Block này lẽ ra chỉ vẽ hạt nền (canvas), nhưng có một IIFE thứ hai vá luồng
  sửa câu hỏi: bọc saveEditor để admin/editor "lưu trực tiếp", bọc openEditor để đổi chữ
  nút. Cả hai lớp chết vì apply() của LIBRARY_FILTER_AND_EDIT_PREVIEW_LAYOUT ghi đè ở mốc
  900ms, và mọi thứ nó chạm (#editQuestion, #editAnswer, #editTitle, #saveEdit,
  #restoreEdit) đều bị openEditPreview xóa khỏi DOM khi dựng lại #editModal.
  Không mất hành vi: saveEditPreview lo "lưu trực tiếp" cho admin/editor.
*/

// ===== FINAL_REPORT_BUTTON_OPEN_TAB_20260613 =====
// Thân block đã chuyển sang ./flashcards.js. Gọi đúng chỗ block cũ đứng để thứ tự chạy không đổi.
installReportButtonOpenTab();
// ===== END FINAL_REPORT_BUTTON_OPEN_TAB_20260613 =====

// ===== MOBILE_FLASHCARD_NAVIGATION_20260702 (viết lại) =====
// Thân block đã chuyển sang ./flashcards.js. Gọi đúng chỗ block cũ đứng để thứ tự chạy không đổi.
installMobileFlashcardNavigation();
// ===== END MOBILE_FLASHCARD_NAVIGATION_20260702 =====

// ===== FINAL_USER_LAST_ACTIVITY_TRACKING_20260613 =====
// Cập nhật hoạt động gần nhất của người dùng trên web.
(function () {
  if (window.__LH_FINAL_USER_LAST_ACTIVITY_BOUND_20260613) return;
  window.__LH_FINAL_USER_LAST_ACTIVITY_BOUND_20260613 = true;

  const MIN_GAP = 60 * 1000; // tối đa 1 lần / 1 phút
  const GLOBAL_KEY = '__LH_LAST_ACTIVITY_SENT_AT_20260613';
  let sending = false;

  function client() {
    return window.HODSupabase?.__client || null;
  }
  function user() {
    return window.HODSupabase?.getUser?.() || null;
  }
  function lastSent() {
    return Number(window[GLOBAL_KEY] || 0);
  }
  function markSent(t) {
    window[GLOBAL_KEY] = t || Date.now();
  }

  async function touchActivity(force = false) {
    const u = user();
    if (!u || sending) return;
    const nowMs = Date.now();
    if (!force && nowMs - lastSent() < MIN_GAP) return;
    sending = true;
    markSent(nowMs);
    try {
      const md = u?.user_metadata || {};
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({
          id: u.id,
          email: u.email || '',
          full_name: md.full_name || md.name || '',
          avatar_url: md.avatar_url || md.picture || '',
        }),
      });
      const json = await res.json().catch(() => ({}));
      // RELOAD_NOTICE_CLIENT_20260729: admin nhắc tải lại -> hiện banner, KHÔNG đăng xuất.
      if (json && (json.reload_notice || json.data?.reload_notice)) {
        window.lhHandleReloadNotice?.();
      }
    } catch (e) {
      console.warn('[last_activity]', e);
    } finally {
      sending = false;
    }
  }

  function bindActivityEvents() {
    ['click', 'touchstart', 'keydown'].forEach(ev => {
      window.addEventListener(ev, () => touchActivity(false), { passive: true });
    });
    // Tắt ping activity khi focus/interval để giảm gọi Supabase.
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindActivityEvents);
  else bindActivityEvents();
  setTimeout(() => touchActivity(true), 2500);

  // === Polling 60s: nhận cờ "nhắc tải lại" kể cả khi người dùng không thao tác gì ===
  setInterval(async () => {
    const u = user();
    if (!u) return;
    try {
      const md = u?.user_metadata || {};
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({
          id: u.id,
          email: u.email || '',
          full_name: md.full_name || md.name || '',
          avatar_url: md.avatar_url || md.picture || '',
        }),
      });
      const json = await res.json().catch(() => ({}));
      // RELOAD_NOTICE_CLIENT_20260729: admin nhắc tải lại -> hiện banner, KHÔNG đăng xuất.
      if (json && (json.reload_notice || json.data?.reload_notice)) {
        window.lhHandleReloadNotice?.();
      }
    } catch (e) {
      lhWarn('RELOAD_NOTICE_POLL_20260729', e);
    }
  }, 60000);
})();

// ===== FINAL_HEADER_SUBJECT_DYNAMIC_FIX_20260613 =====
// Mã môn + counter. Flashcard: "Câu X / Y". Kiểm tra & Thư viện: "Y câu" (Y = tổng câu của môn).
(function () {
  const STORE = 'learninghub_subject_code_merged_v1';
  let _lastCounterHTML = '',
    _lastBrandHTML = '';
  function $(id) {
    return document.getElementById(id);
  }
  function escStr(s) {
    return String(s ?? '').replace(
      /[\&<>"']/g,
      c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );
  }
  function currentCode() {
    return localStorage.getItem(STORE) || 'MLN122_3';
  }
  function fixCounter() {
    const counter =
      document.querySelector('.globalTop .counter') ||
      document.querySelector('#fc .top .counter') ||
      document.querySelector('.counter');
    if (!counter) return;
    const tab = document.querySelector('.tab.active')?.dataset?.tab || 'fc';
    const rawLen =
      typeof LHState.RAW !== 'undefined' && Array.isArray(LHState.RAW) ? String(LHState.RAW.length) : '637';
    let html;
    if (tab === 'fc') {
      const idx = $('idx')?.textContent || '1';
      const total = $('total')?.textContent || rawLen;
      html = 'Câu <b id="idx">' + idx + '</b> / <b id="total">' + total + '</b>';
    } else {
      html = '<b id="subjectTotalCount">' + rawLen + '</b> câu';
    }
    if (_lastCounterHTML !== html) {
      counter.innerHTML = html;
      _lastCounterHTML = html;
    }
  }
  function fixBrand() {
    const brand =
      document.querySelector('.globalTop .brand') ||
      document.querySelector('#fc .top .brand') ||
      document.querySelector('.brand');
    if (!brand) return;
    const code = currentCode();
    const html = `<div class="brandSubjectBox"><span class="brandCodeTitle">${escStr(code)}</span></div>`;
    if (_lastBrandHTML !== html) {
      brand.innerHTML = html;
      _lastBrandHTML = html;
    }
  }
  window.fixCounter = fixCounter;
  window.fixBrand = fixBrand;
  function run() {
    fixCounter();
    fixBrand();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
  document.addEventListener('click', e => {
    if (e.target.closest('.tab')) setTimeout(run, 0);
  });
  setTimeout(run, 50);
  setTimeout(run, 300);
  setInterval(run, 500);
})();

// ===== FINAL_MOVE_SUBJECT_BUTTON_LEFT_OF_SETTINGS_20260613 =====
// Đưa nút Đổi môn nằm ngay bên trái nút Cài đặt.
(function () {
  function $(id) {
    return document.getElementById(id);
  }
  function moveSubjectButton() {
    const actions =
      document.querySelector('.globalTop .actions') ||
      document.querySelector('#fc .actions') ||
      document.querySelector('.actions');
    if (!actions) return;
    let btn = $('subjectTopChip');
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'subjectTopChip';
      btn.type = 'button';
      btn.className = 'subjectChip';
      btn.onclick = function () {
        $('hodChangeSubjectBtn')?.click();
      };
    }
    btn.textContent = 'Đổi môn';
    btn.classList.remove('hidden');
    btn.style.display = 'inline-flex';
    const settings = $('openSettings');
    if (settings && settings.parentNode === actions) {
      if (settings.previousElementSibling !== btn) actions.insertBefore(btn, settings);
    } else if (!actions.contains(btn)) {
      actions.prepend(btn);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', moveSubjectButton);
  else moveSubjectButton();
  setTimeout(moveSubjectButton, 200);
  setTimeout(moveSubjectButton, 800);
  setInterval(moveSubjectButton, 700);
})();

// ===== FINAL_APP_REPORT_BUTTON_NO_TOGGLE_20260614 =====
// Nút báo cáo ở tab Thư viện: không toggle thẻ, mở form báo cáo đúng câu như nút ! ở Flashcard.
(function () {
  function getQuestionByNum(num) {
    num = Number(num);
    return (
      (LHState.RAW || []).find(c => Number(c.num) === num) ||
      (LHState.pool || []).find(c => Number(c.num) === num) ||
      null
    );
  }
  function setCurrentQuestionByNum(num) {
    num = Number(num);
    let idx = (LHState.pool || []).findIndex(c => Number(c.num) === num);
    if (idx < 0) {
      const rawIdx = (LHState.RAW || []).findIndex(c => Number(c.num) === num);
      if (rawIdx >= 0) {
        LHState.pool = [...LHState.RAW];
        idx = rawIdx;
      }
    }
    if (idx >= 0) {
      LHState.ci = idx;
      LHState.flipped = false;
      LHState.flipDir = 'horizontal';
      try {
        renderCard();
      } catch (e) {
        lhWarn('FINAL_APP_REPORT_BUTTON_NO_TOGGLE_20260614', e);
      }
      return true;
    }
    return false;
  }
  window.openStudyReport = function (num, ev) {
    if (ev) {
      ev.preventDefault?.();
      ev.stopPropagation?.();
      ev.stopImmediatePropagation?.();
    }
    const q = getQuestionByNum(num);
    if (!q) return alert('Không tìm thấy câu ' + num);
    if (!setCurrentQuestionByNum(num)) return alert('Không mở được câu ' + num);
    // Mở cùng form báo cáo/sửa như nút ! bên Flashcard
    try {
      openEditor();
    } catch (e) {
      alert('Không mở được báo cáo câu ' + num);
    }
    return false;
  };

  function hardBindReportButtons() {
    const list = document.getElementById('studyList');
    if (!list) return;

    // Chặn sớm từ document để không bị handler toggle khác bắt tiếp
    if (!document.__studyReportNoToggleDoc) {
      document.__studyReportNoToggleDoc = true;
      document.addEventListener(
        'click',
        function (e) {
          const btn = e.target.closest && e.target.closest('.studyReportBtn,[data-report-num]');
          if (!btn) return;
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          window.openStudyReport(btn.dataset.reportNum, e);
          return false;
        },
        true,
      );
      document.addEventListener(
        'pointerdown',
        function (e) {
          const btn = e.target.closest && e.target.closest('.studyReportBtn,[data-report-num]');
          if (!btn) return;
          e.stopPropagation();
          e.stopImmediatePropagation();
        },
        true,
      );
      document.addEventListener(
        'mousedown',
        function (e) {
          const btn = e.target.closest && e.target.closest('.studyReportBtn,[data-report-num]');
          if (!btn) return;
          e.stopPropagation();
          e.stopImmediatePropagation();
        },
        true,
      );
    }

    list.querySelectorAll('.studyReportBtn,[data-report-num]').forEach(btn => {
      btn.setAttribute('type', 'button');
      btn.onclick = function (e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return window.openStudyReport(this.dataset.reportNum, e);
      };
      btn.onmousedown = function (e) {
        e.stopPropagation();
        e.stopImmediatePropagation();
      };
      btn.onpointerdown = function (e) {
        e.stopPropagation();
        e.stopImmediatePropagation();
      };
      btn.ontouchstart = function (e) {
        e.stopPropagation();
      };
    });
  }

  // Gắn lại sau mỗi lần renderStudy vì danh sách được dựng lại bằng innerHTML
  // DEAD_OVERRIDE_20260727: lớp bọc renderStudy dưới đây KHÔNG BAO GIỜ CHẠY —
  // LIBRARY_UX_STEP1_STABLE_RENDER gán renderStudy = renderUnified trong setTimeout(0)
  // nên nó thắng mọi lớp bọc gán lúc parse. Nút báo cáo trong thư viện hiện do
  // handler [data-stable-report] của STEP1 lo. Đừng thêm lớp bọc mới ở đây.
  // Lớp bọc renderStudy của block này ĐÃ XÓA (20260727): STEP1 (renderUnified, nay ở
  // ./library.js) ghi đè renderStudy nên lớp bọc không bao giờ chạy, và nút báo cáo trong
  // thư viện do handler [data-stable-report] của STEP1 lo. `hardBindReportButtons` vẫn
  // SỐNG — nó được gọi ở DOMContentLoaded ngay dưới đây. `openStudyReport` cũng vẫn sống.
  // Phải xóa để hàm chuyển tiếp `renderStudy` (~dòng 613) không bị gán trần đè lên.

  document.addEventListener('DOMContentLoaded', function () {
    hardBindReportButtons();
    setTimeout(hardBindReportButtons, 100);
    setTimeout(hardBindReportButtons, 500);
    setInterval(hardBindReportButtons, 1000);
  });
})();

// ===== FINAL_LANDING_BG_MOVER_SLIGHT_PLUS_20260614 =====
// Tăng biên độ nền landing lên nhẹ một chút, vẫn chậm và mềm.
(function () {
  let raf = 0,
    running = false,
    bootT = 0;

  function injectStyle() {
    let st = document.getElementById('landingBgMoverRuntimeStyle');
    if (!st) {
      st = document.createElement('style');
      st.id = 'landingBgMoverRuntimeStyle';
      document.head.appendChild(st);
    }
    st.textContent = `
      #hodLoginGate{
        position:fixed!important;
        inset:0!important;
        overflow:hidden!important;
        background:#03070d!important;
        isolation:isolate!important;
      }
      #hodLoginGate::before,#hodLoginGate:before,
      #hodLoginGate::after,#hodLoginGate:after{
        display:none!important;
        content:none!important;
        animation:none!important;
        background:none!important;
      }
      #landingBgMover{
        position:absolute!important;
        left:-9vw!important;
        top:-9vh!important;
        width:118vw!important;
        height:118vh!important;
        z-index:0!important;
        pointer-events:none!important;
        background-image:linear-gradient(180deg,rgba(3,7,13,.08),rgba(3,7,13,.42)),url('background.webp')!important;
        background-repeat:no-repeat!important;
        background-position:center center!important;
        background-size:cover!important;
        transform-origin:center center!important;
        will-change:transform,filter!important;
      }
      #landingBgShade{
        position:absolute!important;
        inset:0!important;
        z-index:1!important;
        pointer-events:none!important;
        background:linear-gradient(90deg,rgba(3,10,20,.22),rgba(3,10,20,.04),rgba(3,10,20,.14))!important;
        opacity:.18!important;
      }
      #landingParticles{z-index:2!important;}
      .hodLoginGatePanel.simpleLanding{position:relative!important;z-index:3!important;}
    `;
  }

  function ensureLayer() {
    const gate = document.getElementById('hodLoginGate');
    if (!gate) return null;
    injectStyle();
    let bg = document.getElementById('landingBgMover');
    if (!bg) {
      bg = document.createElement('div');
      bg.id = 'landingBgMover';
      gate.insertBefore(bg, gate.firstChild);
    }
    let shade = document.getElementById('landingBgShade');
    if (!shade) {
      shade = document.createElement('div');
      shade.id = 'landingBgShade';
      gate.insertBefore(shade, bg.nextSibling);
    }
    return bg;
  }

  function isVisible() {
    const gate = document.getElementById('hodLoginGate');
    return !!gate && !gate.classList.contains('hidden') && getComputedStyle(gate).display !== 'none';
  }

  function frame(t) {
    if (!running) return;
    const gateOn = isVisible();
    // Dừng hẳn vòng lặp (không chỉ ngừng vẽ) khi landing gate đã đóng sau đăng nhập,
    // tránh getComputedStyle/rAF chạy vô thời hạn trong nền suốt phiên dùng app.
    if (!gateOn) {
      running = false;
      cancelAnimationFrame(raf);
      raf = 0;
      return;
    }
    const bg = ensureLayer();
    if (bg) {
      const x = Math.sin(t / 4200) * 12;
      const y = Math.cos(t / 5200) * 8;
      const r = Math.sin(t / 6800) * 0.08;
      const s = 1.048 + Math.sin(t / 7600) * 0.008;
      bg.style.transform = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) scale(${s.toFixed(4)}) rotate(${r.toFixed(3)}deg)`;
      bg.style.filter = `saturate(${(1.04 + Math.sin(t / 6200) * 0.018).toFixed(3)}) contrast(1.02) brightness(${(1 + Math.cos(t / 7000) * 0.008).toFixed(3)})`;
    }
    raf = requestAnimationFrame(frame);
  }

  function boot() {
    if (!isVisible()) return; // không khởi động lại loop nếu landing gate không còn hiển thị
    cancelAnimationFrame(raf);
    ensureLayer();
    running = true;
    raf = requestAnimationFrame(frame);
  }

  function bootDebounced() {
    clearTimeout(bootT);
    bootT = setTimeout(boot, 150);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  window.addEventListener('focus', bootDebounced);
  window.addEventListener('resize', bootDebounced, { passive: true });
})();

// ===== FINAL_SMART_SEARCH_STOPWORDS_RELEVANCE_20260614 =====
installSmartSearch();
// ===== END FINAL_SMART_SEARCH_STOPWORDS_RELEVANCE_20260614 =====

// ===== COPILOT_MERGED_ADD_QUESTION_DISPLAY_VERSION_20260629 =====
installAddQuestionDisplay();
// ===== END COPILOT_MERGED_ADD_QUESTION_DISPLAY_VERSION_20260629 =====

// ===== IMPORT_PREVIEW_INLINE_EDIT_20260625 (và 8 block cùng nhóm) =====
// Thân block ở ./subjectImport.js. Gọi ĐÚNG chỗ nhóm block cũ đứng: ngay sau
// COPILOT_MERGED_ADD_QUESTION_DISPLAY_VERSION_20260629, trước IMPORT_PREVIEW_COMPACT_UX_PATCH.
// Nhóm này gán 14 hàm window.__* mà UI "Thêm môn" của ADD_SUBJECT_FEATURE gọi bằng inline
// onclick — thiếu lời gọi này thì 3 nút "Xem prompt AI" / "Copy prompt" / "Xóa file đã chọn"
// ném TypeError khi bấm (đã xảy ra thật từ commit tách file, xem RENDER_CARD_WINDOW_BRIDGE_20260731).
installImportPreviewInlineEdit();
// ===== END IMPORT_PREVIEW_INLINE_EDIT_20260625 =====

// ===== FINAL_EXAM_ONLY_QUIZ_UI_20260627 =====
installExam();
// ===== FINAL_EXAM_ONLY_QUIZ_UI_20260627 END =====

// ===== LIBRARY_LABEL_AND_UI_FIX_20260627 =====
installLibraryLabelFix();
// ===== LIBRARY_LABEL_AND_UI_FIX_20260627 END =====

// ===== LIBRARY_FILTER_AND_EDIT_PREVIEW_LAYOUT_20260627 =====
installEditor();
// ===== LIBRARY_FILTER_AND_EDIT_PREVIEW_LAYOUT_20260627 END =====

// ===== LIBRARY_UX_STEP1_STABLE_RENDER_20260627 =====
installLibrary();
// ===== LIBRARY_UX_STEP1_STABLE_RENDER_20260627 END =====

// ===== COPILOT_CLOUDINARY_IMAGE_FIX_20260627 =====
installSubjectDataLoader();
// ===== END COPILOT_CLOUDINARY_IMAGE_FIX_20260627 =====

// ===== FINAL_UI_DEDUP_CLEANER_20260628 =====
// Dọn rác giao diện do nhiều patch cũ tạo trùng: avatar, report box, nút đổi môn, nút tải câu, modal report.
(function () {
  function all(sel) {
    return Array.from(document.querySelectorAll(sel));
  }
  function keepFirstById(id) {
    const arr = all('#' + id);
    arr.slice(1).forEach(x => x.remove());
    return arr[0] || null;
  }
  function removeAll(id) {
    all('#' + id).forEach(x => x.remove());
  }
  function cleanButtons() {
    // Nút tải/reload câu: xóa hẳn được xử lý ở REMOVE_ANY_RELOAD_TEXT_BUTTON_20260628.

    // Chỉ giữ 1 avatar tài khoản.
    const avatar = keepFirstById('hodTopAvatar');
    if (avatar) {
      avatar.style.display = avatar.style.display === 'none' ? '' : avatar.style.display;
      avatar.classList.remove('ghost', 'duplicate');
    }

    // Chỉ giữ 1 menu report và 1 modal report.
    keepFirstById('hodReportBox');
    keepFirstById('hodReportModal');

    // Chỉ giữ 1 nút đổi môn, đặt nằm trước nút cài đặt nếu có.
    const chip = keepFirstById('subjectTopChip');
    const actions =
      document.querySelector('.globalTop .actions') ||
      document.querySelector('#fc .actions') ||
      document.querySelector('.actions');
    const settings = document.getElementById('openSettings');
    if (chip && actions) {
      chip.textContent = 'Đổi môn';
      chip.classList.remove('hidden', 'ghost', 'duplicate');
      chip.style.display = 'inline-flex';
      if (settings && settings.parentNode === actions && settings.previousElementSibling !== chip) {
        actions.insertBefore(chip, settings);
      } else if (!actions.contains(chip)) {
        actions.prepend(chip);
      }
    }

    // Bỏ nút admin header cũ nếu có, tránh chồng với menu avatar.
    removeAll('adminOpenBtn');

    // Chỉ giữ 1 nút login status nếu code cũ tạo trùng.
    keepFirstById('authStatusBtn');

    // Chỉ giữ 1 canvas hạt nền và 1 mobile nav.
    keepFirstById('landingParticles');
    keepFirstById('mobileCardNav');

    // Chỉ giữ 1 thanh tab trong chọn môn.
    keepFirstById('subjectGateTabsBar');
  }

  function cleanModals() {
    // Nếu có nhiều modal report trùng class/id thì giữ cái đầu tiên.
    const reportModals = all('.hodReportModal');
    reportModals.slice(1).forEach(x => x.remove());

    // Xóa các nút đóng modalX bị tạo trùng trong cùng một box.
    document.querySelectorAll('.modal .box, .overlay .box').forEach(box => {
      const xs = Array.from(box.querySelectorAll(':scope > .modalX'));
      xs.slice(1).forEach(x => x.remove());
    });
  }

  function cleanAddQuestionGhosts() {
    // Tránh nhiều nút + Thêm câu hỏi bị hiện cùng lúc trong tab thư viện.
    const buttons = all('.addQuestionFloat, .lhAddQuestionFloat, #addQuestionFloatBtn, #lhAddQuestionBtn');
    const visible = buttons.filter(b => !b.classList.contains('hidden') && b.style.display !== 'none');
    visible.slice(1).forEach(b => b.remove());
  }

  function runCleaner() {
    cleanButtons();
    cleanModals();
    cleanAddQuestionGhosts();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', runCleaner);
  else runCleaner();
  setTimeout(runCleaner, 100);
  setTimeout(runCleaner, 500);
  setTimeout(runCleaner, 1500);
  setInterval(runCleaner, 3000);
})();
// ===== END FINAL_UI_DEDUP_CLEANER_20260628 =====

// ===== REMOVE_ANY_RELOAD_TEXT_BUTTON_20260628 =====
(function () {
  function kill() {
    document.querySelectorAll('button').forEach(function (b) {
      const txt = (b.textContent || '').trim().toLowerCase();
      const title = (b.getAttribute('title') || '').toLowerCase();
      if (
        b.id === 'reloadCurrentQuestionBtn' ||
        txt === '↻ câu' ||
        title.includes('reload câu') ||
        title.includes('tải câu')
      )
        b.remove();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', kill);
  else kill();
  setTimeout(kill, 50);
  setTimeout(kill, 200);
  setTimeout(kill, 800);
  setInterval(kill, 500);
})();
// ===== END REMOVE_ANY_RELOAD_TEXT_BUTTON_20260628 =====

/*
  ===== FINAL_ADMIN_EDITOR_SKIP_APPROVAL_APP_20260628 — ĐÃ XOÁ 2026-07-26 =====
  Block cũ "Admin / Editor không cần chờ phê duyệt": nó tự set
  `p.approved = true; p.blocked = false` trên object profile của client rồi ẩn
  màn chờ duyệt. Xoá vì cả ba lý do:

  1. Trái mô hình fail-closed hiện tại: điều kiện truy cập là
     `approved === 1 && blocked === 0` cho MỌI role, không ngoại lệ cho
     editor/admin (xem hasFullAccess() và checkUserAccess() phía server). Việc
     auto-duyệt hợp lệ duy nhất là khi admin thăng quyền (`set_user_role`), và
     nó chạy Ở SERVER.
  2. Nó ghi `update({approved, blocked})` vào bảng `profiles` của SUPABASE,
     nhưng nguồn quyền thật là TURSO. Mọi lệnh ghi phải đi qua /api/admin-action.
  3. Nó gọi `classList.add('hidden')` trực tiếp lên #hodPendingApproval, xung
     đột với cờ window.__LH_GATE_LOCKED (PENDING_GATE_STICKY_20260726) — gate chỉ
     được đóng/mở qua showPendingApproval() / hidePendingApproval().

  Thực tế block này đã thành code chết trước khi xoá: user bị 403 thì
  getProfile() trả null nên `isPrivileged(p)` false và hàm return ngay.
  ĐỪNG thêm lại: editor/admin chưa duyệt phải được admin duyệt như user thường.
*/

// ===== FINAL_RESET_KEEP_CURRENT_TAB_20260628 =====
// Bấm Reset chỉ reset câu/thứ tự, không nhảy tab. Đang ở Flashcard/Kiểm tra/Thư viện thì giữ nguyên tab đó.
(function () {
  function currentTabId() {
    return document.querySelector('.pane.active')?.id || document.querySelector('.tab.active')?.dataset?.tab || 'fc';
  }
  function restoreTab(id) {
    if (!id) return;
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === id));
    document.querySelectorAll('.pane').forEach(p => p.classList.toggle('active', p.id === id));
  }
  function doResetKeepTab() {
    const tab = currentTabId();
    try {
      if (Array.isArray(LHState.RAW)) LHState.pool = [...LHState.RAW];
      LHState.ci = 0;
      LHState.flipped = false;
      LHState.flipDir = 'horizontal';
      LHState.randomActive = false;
      localStorage.setItem('hod102_random_active', '0');
      const subject = localStorage.getItem('learninghub_subject_code_merged_v1') || '';
      if (subject) localStorage.setItem('learninghub_progress_' + subject, '0');
      localStorage.setItem('hod102_ci', '0');
      if (typeof renderCard === 'function') renderCard();
      if (typeof renderQuiz === 'function') renderQuiz();
      if (typeof renderStudy === 'function') renderStudy();
      if (typeof updateSettingsUI === 'function') updateSettingsUI();
    } catch (e) {
      console.warn('[reset keep tab]', e);
    }
    restoreTab(tab);
    if (typeof notify === 'function') notify('Đã reset');
  }

  window.resetKeepCurrentTab = doResetKeepTab;
  if (typeof reset === 'function')
    reset = window.reset = function () {
      doResetKeepTab();
    };
  if (typeof triggerReset === 'function')
    triggerReset = window.triggerReset = function () {
      doResetKeepTab();
    };

  function bindReset() {
    ['reset', 'stReset'].forEach(id => {
      const btn = document.getElementById(id);
      if (!btn || btn.__keepTabBound) return;
      btn.__keepTabBound = true;
      btn.onclick = function (e) {
        e.preventDefault();
        e.stopPropagation();
        doResetKeepTab();
        return false;
      };
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindReset);
  else bindReset();
  setTimeout(bindReset, 300);
  setTimeout(bindReset, 1000);
  setInterval(bindReset, 2000);
})();
// ===== END FINAL_RESET_KEEP_CURRENT_TAB_20260628 =====

// ===== FINAL_IMAGE_NO_FLICKER_HARD_FIX_20260628 =====
// Tải trước ảnh câu gần kề và không gọi lại Supabase mỗi lần chuyển câu.
(function () {
  function srcOf(im) {
    return typeof im === 'string' ? im : im?.src || im?.url || im?.secure_url || im?.publicUrl || im?.public_url || '';
  }
  function preloadQuestionImages(q) {
    try {
      (q?.images || [])
        .map(srcOf)
        .filter(Boolean)
        .forEach(src => {
          if (window.__LH_PRELOADED_IMAGES?.has(src)) return;
          window.__LH_PRELOADED_IMAGES = window.__LH_PRELOADED_IMAGES || new Set();
          window.__LH_PRELOADED_IMAGES.add(src);
          const img = new Image();
          img.decoding = 'async';
          img.loading = 'eager';
          img.src = src;
        });
    } catch (e) {
      lhWarn('FINAL_IMAGE_NO_FLICKER_HARD_FIX_20260628', e);
    }
  }
  function preloadAround() {
    try {
      if (!Array.isArray(LHState.pool) || !LHState.pool.length) return;
      preloadQuestionImages(LHState.pool[LHState.ci]);
      preloadQuestionImages(LHState.pool[(LHState.ci + 1) % LHState.pool.length]);
      preloadQuestionImages(LHState.pool[(LHState.ci - 1 + LHState.pool.length) % LHState.pool.length]);
    } catch (e) {
      lhWarn('FINAL_IMAGE_NO_FLICKER_HARD_FIX_20260628', e);
    }
  }
  const oldNext = typeof next === 'function' ? next : null;
  const oldPrev = typeof prev === 'function' ? prev : null;
  if (oldNext && !oldNext.__noFlicker) {
    next = function () {
      oldNext.apply(this, arguments);
      setTimeout(preloadAround, 0);
    };
    next.__noFlicker = true;
    window.next = next;
  }
  if (oldPrev && !oldPrev.__noFlicker) {
    prev = function () {
      oldPrev.apply(this, arguments);
      setTimeout(preloadAround, 0);
    };
    prev.__noFlicker = true;
    window.prev = prev;
  }
  document.addEventListener('DOMContentLoaded', () => setTimeout(preloadAround, 800));
})();
// ===== END FINAL_IMAGE_NO_FLICKER_HARD_FIX_20260628 =====

// ===== PERSIST_LAST_TAB_AND_EXAM_20260628 =====
(function () {
  const TAB_STORE = 'learninghub_last_tab_v1';
  function restoreLastTab() {
    let tab = '';
    try {
      tab = localStorage.getItem(TAB_STORE) || '';
    } catch (e) {
      lhWarn('PERSIST_LAST_TAB_AND_EXAM_20260628', e);
    }
    if (!/^(fc|quiz|study)$/.test(tab)) return;
    const btn = document.querySelector(`.tab[data-tab="${tab}"],[data-tab="${tab}"]`);
    if (btn && !btn.classList.contains('active')) btn.click();
  }
  document.addEventListener(
    'click',
    e => {
      const t = e.target.closest('[data-tab]');
      if (t?.dataset?.tab) {
        const tabId = t.dataset.tab;
        try {
          localStorage.setItem(TAB_STORE, tabId);
        } catch (_e) {
          lhWarn('PERSIST_LAST_TAB_AND_EXAM_20260628', _e);
        }
        switchTab(tabId, t);
      }
    },
    true,
  );
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(restoreLastTab, 250);
      setTimeout(restoreLastTab, 1200);
      setTimeout(restoreLastTab, 2500);
    });
  else {
    setTimeout(restoreLastTab, 250);
    setTimeout(restoreLastTab, 1200);
    setTimeout(restoreLastTab, 2500);
  }
})();
// ===== END PERSIST_LAST_TAB_AND_EXAM_20260628 =====

// ===== SUPABASE_CACHE_CLEAR_HELPER_20260628 =====
// Dùng trong Console nếu cần tải mới: clearLearningHubQuestionCache(); location.reload();
window.clearLearningHubQuestionCache = function () {
  try {
    const code = localStorage.getItem('learninghub_subject_code_merged_v1') || '';
    // Xoá cả v1 (bản cũ còn sót) và v2 — xem QUESTION_CACHE_REVALIDATE_20260726.
    if (code) {
      localStorage.removeItem('learninghub_questions_cache_v1_' + code);
      localStorage.removeItem('learninghub_questions_cache_v2_' + code);
    }
    if (typeof window.clearLearningHubSupabaseCache === 'function') window.clearLearningHubSupabaseCache('questions');
  } catch (e) {
    lhWarn('SUPABASE_CACHE_CLEAR_HELPER_20260628', e);
  }
};
// ===== END SUPABASE_CACHE_CLEAR_HELPER_20260628 =====

/*
  ===== CLEAN_IMAGE_REQUEST_DELETE_OLD_CREATE_NEW_20260628 — ĐÃ XÓA (20260727) =====
  248 dòng, chết toàn bộ. Xác minh: hàm `saveClean` của nó chỉ tới được qua lớp gán
  `saveEditor = saveClean` (bị apply() của LIBRARY_FILTER_AND_EDIT_PREVIEW_LAYOUT ghi đè ở
  mốc 900ms) hoặc qua `bind()` gắn vào `#saveEdit` — id đó bị openEditPreview xóa khỏi DOM
  ngay lần mở editor đầu tiên (Console lúc editor mở: getElementById('saveEdit') -> null).
  Kèm theo là một `setInterval(bind, 1000)` chạy không tải mãi mãi, nay cũng hết.

  Không mất hành vi nào:
  - "Lưu trực tiếp" cho admin/editor: saveEditPreview làm y hệt (cùng /api/admin-action
    action save_question_direct, xóa cache, tải lại môn).
  - "Gửi yêu cầu sửa" cho người thường: submitEditRequest (~dòng 1809) POST cùng
    /api/edit-requests.
  - "Xóa request pending cũ của cùng câu rồi tạo mới" (đúng như tên block): việc này nằm ở
    SERVER, api/controllers/editRequests.js POST — nó tìm request pending cùng
    (user_id, question_id, subject_code), UPDATE bản đó rồi DELETE các bản trùng. Client
    nào POST endpoint đó cũng được dedup, nên không cần chép lại vào appCore.
*/

// ===== COPILOT_FINAL_UPLOAD_DIAGNOSTIC_LOCK_20260628 =====
// Thân block đã chuyển sang ./images.js. Gọi đúng chỗ cũ để thứ tự chạy không đổi.
installUploadDiagnostics();
// ===== END COPILOT_FINAL_UPLOAD_DIAGNOSTIC_LOCK_20260628 =====

/*
  ===== COPILOT_FIX_EDIT_SAVE_UPLOAD_DIRECT_20260628 — ĐÃ XÓA (20260727) =====
  197 dòng, chết toàn bộ, cùng một lý do: cả block bám vào `#imgUpload` và `#saveEdit` của
  index.html, còn openEditPreview dựng LẠI toàn bộ innerHTML của `#editModal` với bộ id mới
  (`editPreviewImgInput`, `[data-edit-preview-save]`). Hai lớp gán openEditor/saveEditor của
  nó thì bị apply() ghi đè ở mốc 900ms.

  Phần duy nhất không trùng lặp là `uploadPendingEditImages()` (upload ảnh data: URL lên
  Cloudinary TRƯỚC khi lưu) — đã bỏ theo quyết định 20260727: editor đang chạy upload NGAY
  lúc chọn file qua `window.__LHUploadCloudinary` (handler change của #editPreviewImgInput)
  và Ctrl+V dán ảnh cũng vậy (EDIT_PREVIEW_CTRL_V_IMAGE_UPLOAD_20260629), nên chỉ còn nhánh
  dự phòng khi thiếu Cloudinary config là sinh ra ảnh data: — không đáng giữ 197 dòng.
  `__LHUploadCloudinary` / `__LHCleanImages` KHÔNG bị xóa, chúng ở block khác và vẫn sống.
*/

// ===== COPILOT_ULTRA_FINAL_EDIT_UPLOAD_LOCK_20260628 =====
// Thân block đã chuyển sang ./images.js. Gọi đúng chỗ cũ để thứ tự chạy không đổi.
installUploadLock();
// ===== END COPILOT_ULTRA_FINAL_EDIT_UPLOAD_LOCK_20260628 =====

// ===== COPILOT_CLEAN_RUNTIME_GUARD_20260628 (đã rút gọn) =====
/*
  VIII: đây từng là lớp ghi đè window.fetch THỨ BA — một bản cache Supabase REST
  gần như trùng lặp với APP_F5_SUPABASE_CACHE (lớp thứ hai). Phần fetch đã được
  gộp vào interceptor duy nhất ở cuối file; chỉ giữ lại đoạn cache mềm
  getProfile bên dưới vì các interval UI (nút admin, avatar...) gọi nó liên tục.
*/
(function () {
  if (window.__COPILOT_CLEAN_RUNTIME_GUARD_20260628) return;
  window.__COPILOT_CLEAN_RUNTIME_GUARD_20260628 = true;

  // Cache mềm getProfile để các interval UI không gây kiểm tra quyền quá dày.
  // Chỉ là bộ nhớ đệm HIỂN THỊ; quyền thật luôn do server quyết định.
  setTimeout(function patchProfileGetter() {
    const api = window.HODSupabase;
    if (!api || !api.getProfile || api.__cleanProfileCached) return;
    const oldGetProfile = api.getProfile.bind(api);
    let last = null,
      at = 0;
    api.getProfile = function () {
      const now = Date.now();
      const p = oldGetProfile();
      if (p) {
        last = p;
        at = now;
        return p;
      }
      // Sau khi bị thu hồi quyền, currentProfile = null: KHÔNG trả bản cũ nữa.
      if (window.__LH_ACCESS_OK === false) {
        last = null;
        return p;
      }
      if (last && now - at < 10000) return last;
      return p;
    };
    api.__cleanProfileCached = true;
  }, 0);
})();
// ===== END COPILOT_CLEAN_RUNTIME_GUARD_20260628 =====

// ===== COPILOT_FIX_EDIT_IMAGE_VISIBLE_AFTER_SAVE_20260628 =====
// Thân block đã chuyển sang ./images.js. Gọi đúng chỗ cũ để thứ tự chạy không đổi.
installImageVisibleAfterSave();
// ===== END COPILOT_FIX_EDIT_IMAGE_VISIBLE_AFTER_SAVE_20260628 =====

/*
  ===== APP_REALTIME_CACHE_INVALIDATE_20260629 — ĐÃ XÓA (XV) =====
  Khối này tạo MỘT KÊNH REALTIME THỨ HAI (learninghub-cache-invalidate-v1) nghe
  postgres_changes trên public.questions/subjects của Supabase để xóa cache.
  Nó đã chết từ lâu: hàm start() mở đầu bằng  kể từ khi dữ liệu chuyển
  sang Turso, nên phần còn lại không bao giờ chạy — chỉ còn một client Supabase
  thừa và một listener visibilitychange rỗng.
  Cache câu hỏi nay do server lo (clearQuestionsCache/clearSubjectsCache trong
  /api/admin-action) và window.clearLearningHubQuestionCache phía client.
*/

// ===== FIX_ARIA_HIDDEN_SUBJECT_GATE_20260629 =====
// Thân block đã chuyển sang ./subjectGate.js. Gọi đúng chỗ cũ để thứ tự chạy không đổi.
installGateAriaFix();
// ===== END FIX_ARIA_HIDDEN_SUBJECT_GATE_20260629 =====

// ===== SUBJECT_COUNTS_ONCE_CACHE_20260629 =====
// Thân block đã chuyển sang ./subjectGate.js. Gọi đúng chỗ cũ để thứ tự chạy không đổi.
installSubjectCountsCache();
// ===== END SUBJECT_COUNTS_ONCE_CACHE_20260629 =====

// ===== ACTIVE_SUBJECT_COUNT_SYNC_20260629 =====
installActiveSubjectCountSync();
// ===== END ACTIVE_SUBJECT_COUNT_SYNC_20260629 =====

// ===== EXAM_UI_STYLE_MERGED_20260702 =====
// Gộp 5 patch CSS cũ (FIX_EXAM_BOTTOM_BLANK, SOFTEN_EXAM_TEXT, FIX_EXAM_UX_BALANCE,
// FIX_EXAM_CENTER_LAYOUT, FIX_EXAM_SHIFT_RIGHT_SMALLER_Q — tất cả 20260629) thành 1 khối.
// Giữ nguyên đúng giá trị cuối cùng theo thứ tự cascade gốc (patch sau đè patch trước),
// không đổi bất kỳ giá trị hiển thị nào — chỉ gộp code, giao diện y hệt trước khi gộp.
(function () {
  function injectExamStyle() {
    if (document.getElementById('examUiStyleMerged')) return;
    var style = document.createElement('style');
    style.id = 'examUiStyleMerged';
    style.textContent = `
      #quiz.pane.active,
      #quiz.active {
        padding-bottom: 0 !important;
        margin-bottom: 0 !important;
      }

      #quizBody {
        padding-bottom: 0 !important;
        margin-bottom: 0 !important;
      }

      .examOnlyGridContainer {
        min-height: calc(100dvh - var(--headH,112px) - 8px) !important;
        height: calc(100dvh - var(--headH,112px) - 8px) !important;
        align-items: stretch !important;
        margin-bottom: 0 !important;
        width: min(1728px, calc(100vw - 96px)) !important;
        max-width: none !important;
      }

      .examOnlyCard,
      .examOnlySidebar {
        height: 100% !important;
        min-height: 0 !important;
        box-sizing: border-box !important;
      }

      .examOnlyCard {
        display: flex !important;
        flex-direction: column !important;
      }

      .examOnlyContentBody {
        flex: 1 1 auto !important;
        min-height: 0 !important;
      }

      .examOnlyFooter {
        flex: 0 0 auto !important;
        margin-top: 20px !important;
      }

      .examSidebarGrid,
      .examOnlyQuestionZone,
      .examOnlyRightZone {
        min-height: 0 !important;
      }

      #quiz .examOnlyCard .qq,
      #quiz .examOnlyQuestionZone .qq,
      #quiz .qq{
        color:rgba(245,240,232,.78)!important;
        -webkit-text-fill-color:rgba(245,240,232,.78)!important;
        text-shadow:none!important;
        font-size:clamp(1.00rem,1.04vw,1.18rem)!important;
        line-height:1.42!important;
        font-weight:580!important;
      }
      #quiz .examOnlyOption .qtxt,
      #quiz .examOnlyCard .qtxt{
        color:rgba(245,240,232,.60)!important;
        font-weight:480!important;
        text-shadow:none!important;
      }
      #quiz .examOnlyOption.sel{
        background:linear-gradient(135deg,rgba(200,169,110,.075),rgba(232,212,168,.032))!important;
        border-color:rgba(232,212,168,.42)!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.045)!important;
      }
      #quiz .examOnlyOption.sel .qtxt{
        color:rgba(245,240,232,.76)!important;
        font-weight:520!important;
      }
      #quiz .examOnlyOption.sel .qkey{
        color:#14100b!important;
        background:linear-gradient(135deg,rgba(232,212,168,.80),rgba(200,169,110,.76))!important;
        box-shadow:0 1px 6px rgba(232,212,168,.12)!important;
      }

      @media (max-width: 900px) {
        .examOnlyGridContainer {
          height: auto !important;
          min-height: 0 !important;
        }
        .examOnlyCard,
        .examOnlySidebar {
          height: auto !important;
        }
      }

      @media (min-width:901px){
        #quiz .examOnlyContentBody{
          display:flex!important;
          flex-direction:column!important;
          gap:16px!important;
          align-items:stretch!important;
          overflow-y:auto!important;
          overflow-x:hidden!important;
          padding-right:6px!important;
        }
        #quiz .examOnlyQuestionZone,#quiz .examOnlyRightZone{
          max-height:none!important;
          overflow:visible!important;
          padding:0!important;
          flex:0 0 auto!important;
        }
        #quiz .examOnlyOptions{padding:0!important;gap:11px!important;}

        #quiz.pane.scroll.active,
        #quiz.pane.active,
        #quiz.scroll{
          padding-left:0!important;
          padding-right:0!important;
          align-items:center!important;
        }

        #quizBody{
          width:min(1580px,calc(100vw - 220px))!important;
          max-width:1580px!important;
          margin-left:auto!important;
          margin-right:auto!important;
          transform:translateX(34px)!important;
        }
        #quiz .examOnlyGridContainer{
          width:100%!important;
          max-width:1580px!important;
          grid-template-columns:minmax(0,1fr) 360px!important;
          gap:26px!important;
          margin-left:auto!important;
          margin-right:auto!important;
        }
        #quiz .examOnlyCard{max-width:none!important;}
      }
    `;
    document.head.appendChild(style);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', injectExamStyle);
  else injectExamStyle();
})();
// ===== END EXAM_UI_STYLE_MERGED_20260702 =====

// ===== CLEAR_ADD_SUBJECT_DRAFT_NEW_SESSION_20260629 =====
// Thân block đã chuyển sang ./subjectGate.js. Gọi đúng chỗ cũ để thứ tự chạy không đổi.
installClearAddSubjectDraft();
// ===== END CLEAR_ADD_SUBJECT_DRAFT_NEW_SESSION_20260629 =====

// ===== COPILOT_KEEP_IMPORT_QUESTION_ATTRIBUTES_20260629 =====
// Giữ thuộc tính câu hỏi sau khi import môn rồi mở Thư viện/Kiểm tra câu hỏi.
(function () {
  if (window.__COPILOT_KEEP_IMPORT_QUESTION_ATTRIBUTES_20260629) return;
  window.__COPILOT_KEEP_IMPORT_QUESTION_ATTRIBUTES_20260629 = true;
  function normalizeQuestionAttrs(q) {
    if (!q || typeof q !== 'object') return q;
    const imgs = Array.isArray(q.images) ? q.images : [];
    q.has_image = !!(q.has_image || imgs.length);
    q.error_risk = q.error_risk || 'low';
    q.error_risk_reason = q.error_risk_reason || '';
    return q;
  }
  window.__LHNormalizeQuestionAttrs = normalizeQuestionAttrs;
  /*
    RESTORE_LIBRARY_NORMALIZE_20260727
    normalizeAll phải gọi được từ ngoài: lớp bọc renderStudy phía dưới đã chết (STEP1 ghi đè
    trong setTimeout) nên thư viện từng vẽ bằng dữ liệu CHƯA chuẩn hóa -> has_image/error_risk
    thiếu sau khi import môn, làm bộ lọc "Có ảnh"/"Rủi ro" đếm sai. renderUnified của STEP1
    nay gọi window.__LHNormalizeAll() ở đầu mỗi lần vẽ.
  */
  function normalizeAll() {
    try {
      if (Array.isArray(LHState.RAW)) LHState.RAW.forEach(normalizeQuestionAttrs);
    } catch (e) {
      lhWarn('COPILOT_KEEP_IMPORT_QUESTION_ATTRIBUTES_20260629', e);
    }
    try {
      if (Array.isArray(LHState.pool)) LHState.pool.forEach(normalizeQuestionAttrs);
    } catch (e) {
      lhWarn('COPILOT_KEEP_IMPORT_QUESTION_ATTRIBUTES_20260629', e);
    }
    try {
      if (Array.isArray(LHState.qSet)) LHState.qSet.forEach(normalizeQuestionAttrs);
    } catch (e) {
      lhWarn('COPILOT_KEEP_IMPORT_QUESTION_ATTRIBUTES_20260629', e);
    }
  }
  window.__LHNormalizeAll = normalizeAll;
  /*
    Lớp bọc renderStudy CŨ đã xóa (20260727): nó bị STEP1 ghi đè trong setTimeout nên không
    bao giờ chạy. Thay bằng lời gọi window.__LHNormalizeAll() ngay đầu renderUnified của
    LIBRARY_UX_STEP1_STABLE_RENDER — đúng chỗ dữ liệu được đọc để vẽ.
  */
  // RENDER_CARD_WINDOW_BRIDGE_20260731: bọc window.renderCard, KHÔNG bọc binding `renderCard`
  // của appCore (nó chỉ là hàm chuyển tiếp — bọc vào đó thì các module khác gọi
  // window.renderCard sẽ mất lớp normalizeAll này).
  const oldRenderCard = typeof window.renderCard === 'function' ? window.renderCard : null;
  if (oldRenderCard && !oldRenderCard.__keepAttrs) {
    const keepAttrsRenderCard = function () {
      normalizeAll();
      return oldRenderCard.apply(this, arguments);
    };
    keepAttrsRenderCard.__keepAttrs = true;
    window.renderCard = keepAttrsRenderCard;
  }
  normalizeAll();
})();
// ===== END COPILOT_KEEP_IMPORT_QUESTION_ATTRIBUTES_20260629 =====

// ===== EDIT_RENDER_NULL_GUARD_20260629 =====
// Thân block đã chuyển sang ./images.js. Gọi đúng chỗ cũ để thứ tự chạy không đổi.
installEditImagesRender();
// ===== END EDIT_RENDER_NULL_GUARD_20260629 =====

// ===== EDIT_PREVIEW_CTRL_V_IMAGE_UPLOAD_20260629 =====
// Thân block đã chuyển sang ./editor.js. Gọi đúng chỗ cũ để thứ tự chạy không đổi.
installEditorPasteUpload();
// ===== END EDIT_PREVIEW_CTRL_V_IMAGE_UPLOAD_20260629 =====

// ===== IMPORT_PREVIEW_CTRL_V_IMAGE_UPLOAD_20260629 =====
// Cho khung "Kiểm tra câu hỏi" Ctrl+V/kéo thả ảnh giống form sửa/thêm câu.
(function () {
  function msg(t) {
    if (typeof notify === 'function') notify(t);
    else console.log(t);
  }
  function modal() {
    return document.getElementById('importPreviewModal');
  }
  function isOpen() {
    const m = modal();
    return !!m && !m.classList.contains('hidden') && getComputedStyle(m).display !== 'none';
  }
  function filesFromPaste(e) {
    return [...(e.clipboardData?.items || [])]
      .filter(item => item.kind === 'file' && String(item.type || '').startsWith('image/'))
      .map(item => item.getAsFile())
      .filter(Boolean);
  }
  function filesFromDrop(e) {
    return [...(e.dataTransfer?.files || [])].filter(file => String(file.type || '').startsWith('image/'));
  }
  function activeCard() {
    const m = modal();
    if (!m) return null;
    return (
      document.activeElement?.closest?.('[data-v7-card],[data-imgui-card]') ||
      m.querySelector('[data-v7-card]:has([data-v7-input]),[data-imgui-card]:has([data-imgui-input])')
    );
  }
  function activeInput() {
    const c = activeCard();
    const inp = c?.querySelector?.('[data-v7-input],[data-imgui-input]');
    if (inp) return inp;
    return modal()?.querySelector?.('[data-v7-input],[data-imgui-input]') || null;
  }
  function ensureHints() {
    const m = modal();
    if (!m || !isOpen()) return;
    m.querySelectorAll('.v7Images,.simpleEditImages').forEach(box => {
      if (box.querySelector('.importPasteImageHint')) return;
      const head = box.querySelector('.v7ImagesHead,.simpleEditImagesHead') || box.firstElementChild;
      const hint = document.createElement('div');
      hint.className = 'pasteImageHint importPasteImageHint';
      hint.textContent = 'Có thể chụp/copy ảnh rồi bấm Ctrl + V tại khung này để tự upload URL.';
      if (head) head.insertAdjacentElement('afterend', hint);
      else box.prepend(hint);
    });
  }
  function uploadByInput(files, source) {
    files = [...(files || [])].filter(file => file && String(file.type || '').startsWith('image/'));
    if (!files.length || !isOpen()) return false;
    const input = activeInput();
    if (!input) {
      alert('Bấm Sửa ở câu cần thêm ảnh trước, rồi dán ảnh lại nha.');
      return true;
    }
    try {
      const dt = new DataTransfer();
      files.forEach(file => dt.items.add(file));
      input.files = dt.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      msg(source === 'paste' ? 'Đang upload ảnh vừa dán...' : 'Đang upload ảnh...');
    } catch (err) {
      alert('Trình duyệt không hỗ trợ dán ảnh kiểu này. Hãy bấm + Thêm ảnh để chọn file.');
    }
    return true;
  }
  function bind() {
    const m = modal();
    if (!m) return;
    ensureHints();
    if (m.__importPreviewPasteBound) return;
    m.__importPreviewPasteBound = true;
    m.addEventListener(
      'paste',
      e => {
        const files = filesFromPaste(e);
        if (!files.length) return;
        e.preventDefault();
        uploadByInput(files, 'paste');
      },
      true,
    );
    m.addEventListener(
      'dragover',
      e => {
        const has = [...(e.dataTransfer?.items || [])].some(item => item.kind === 'file');
        if (!has) return;
        e.preventDefault();
        m.classList.add('dragImageOver');
        ensureHints();
      },
      true,
    );
    m.addEventListener('dragleave', () => m.classList.remove('dragImageOver'), true);
    m.addEventListener(
      'drop',
      e => {
        const files = filesFromDrop(e);
        if (!files.length) return;
        e.preventDefault();
        m.classList.remove('dragImageOver');
        uploadByInput(files, 'drop');
      },
      true,
    );
  }
  function boot() {
    bind();
    ensureHints();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  document.addEventListener('click', () => setTimeout(boot, 0), true);
  setInterval(boot, 700);
})();
// ===== END IMPORT_PREVIEW_CTRL_V_IMAGE_UPLOAD_20260629 =====

// ===== TURSO_ONLY_DATA_SOURCE_20260630 =====
window.APP_CONFIG = window.APP_CONFIG || {};
window.APP_CONFIG.USE_TURSO_API = true;
// Supabase chỉ dùng Auth; dữ liệu/profile/subjects/questions tải qua /api Turso.
// ===== END TURSO_ONLY_DATA_SOURCE_20260630 =====

// ===== TURSO_SUBJECT_COUNTS_FALLBACK_20260630 =====
// Thân block đã chuyển sang ./subjectGate.js. Gọi đúng chỗ cũ để thứ tự chạy không đổi.
installSubjectCountsFallback();
// ===== END TURSO_SUBJECT_COUNTS_FALLBACK_20260630 =====

// ===== APP_STARTUP_AUTO_LOAD_QUESTIONS_SUBJECTS_20260630 =====
installAppStartupAutoLoad();
// ===== END APP_STARTUP_AUTO_LOAD_QUESTIONS_SUBJECTS_20260630 =====

// ===== COPILOT_FIX_IMAGE_RESET_LOSS_FINAL_20260630 =====
// Thân block đã chuyển sang ./images.js. Gọi đúng chỗ cũ để thứ tự chạy không đổi.
installImgsHTML();
// ===== END COPILOT_FIX_IMAGE_RESET_LOSS_FINAL_20260630 =====

// ===== FIX_ADD_SUBJECT_FAST_PARALLEL_UPLOAD_20260701 =====
// Tăng tốc upload môn lớn: vẫn tránh 504 nhưng gửi nhiều câu song song có giới hạn.
// Thân block đã chuyển sang ./subjectImport.js. Gọi đúng chỗ block cũ đứng.
installFastParallelUpload();
// ===== END FIX_ADD_SUBJECT_FAST_PARALLEL_UPLOAD_20260701 =====

// ===== LH_UNIFIED_FETCH_AND_ACCESS_20260726 =====
installUnifiedFetchAndAccess();
// ===== END LH_UNIFIED_FETCH_AND_ACCESS_20260726 =====

// ===== BOOKMARK_QUESTIONS_FEATURE_20260726 =====
// Thân block đã chuyển sang ./bookmarks.js. Gọi đúng chỗ block cũ đứng để thứ tự chạy không đổi.
installBookmarks();
// ===== BOOKMARK_QUESTIONS_FEATURE_20260726 END =====

// ===== HEADER_EDIT_REQUEST_BELL_20260726 =====
// Thân block đã chuyển sang ./bookmarks.js. Gọi đúng chỗ block cũ đứng để thứ tự chạy không đổi.
installHeaderBell();
// ===== HEADER_EDIT_REQUEST_BELL_20260726 END =====
