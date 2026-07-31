import { installSubjectDataLoader, installActiveSubjectCountSync, installAppStartupAutoLoad } from './subjects.js';
import { installSmartSearch, installAddQuestionDisplay } from './search.js';
import { installHODSupabaseAndAvatar, installUnifiedFetchAndAccess } from './auth.js';
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
function rebuild() {
  LHState.RAW = BASE.map(c => Object.assign(clone(c), edits[c.num] || {}));
  LHState.pool = LHState.pool.length
    ? LHState.pool.map(o => LHState.RAW.find(c => c.num === o.num) || o)
    : [...LHState.RAW];
}
rebuild();
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
  return (c.images || []).map(im => `<img src="${esc(im.src)}" alt="" loading="lazy" decoding="async">`).join('');
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
  setv('--imgmax', c.images && c.images.length ? '380px' : '0px');
  setv('--imgcol', c.images && c.images.length ? '620px' : '0px');
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
// xong thư viện vẫn hiện câu của MÔN CŨ (phải bấm lại tab hoặc F5 mới thấy môn mới).
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
function renderCard() {
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
  const __imgKey = JSON.stringify(
    (c.images || []).map(im =>
      String(
        (im && typeof im === 'object' ? im.src || im.url || im.secure_url || im.publicUrl || im.public_url : im) || '',
      ),
    ),
  );
  if (__imgEl.dataset.imgKey !== __imgKey) {
    __imgEl.innerHTML = imgsHTML(c);
    __imgEl.dataset.imgKey = __imgKey;
  }
  __imgEl.style.display = c.images && c.images.length ? 'flex' : 'none';
  document.querySelector('#fc .front')?.classList.toggle('hasImg', !!(c.images && c.images.length));
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
function restoreEditor() {
  delete edits[LHState.editDraft.num];
  localStorage.setItem(STORE, JSON.stringify(edits));
  rebuild();
  syncQuizSet();
  renderCard();
  renderQuiz();
  renderStudy();
  $('editModal').classList.add('hidden');
  notify('Đã khôi phục');
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
      rebuild();
      renderCard();
      renderQuiz();
      renderStudy();
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
function updateCardTools() {
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
      rebuild();
      renderCard();
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
(function () {
  const HUB_URL = window.APP_CONFIG?.SUPABASE_URL || '';
  const HUB_KEY = window.APP_CONFIG?.SUPABASE_ANON_KEY || '';
  const $ = id => document.getElementById(id);
  let supa = null;
  function client() {
    if (!window.supabase) return null;
    if (!supa) supa = window.supabase.createClient(HUB_URL, HUB_KEY);
    return supa;
  }
  function esc2(s) {
    return String(s ?? '').replace(
      /[&<>"']/g,
      c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );
  }

  function isLoggedIn() {
    return !!window.HODSupabase?.getUser?.();
  }
  function isAdminOrEditor() {
    const p = window.HODSupabase?.getProfile?.() || null;
    const role = String(p?.role || '').toLowerCase();
    return (
      isLoggedIn() &&
      (role === 'admin' || role === 'editor') &&
      !(p?.blocked || p?.is_blocked || p?.status === 'blocked')
    );
  }
  function canAdd() {
    const p = window.HODSupabase?.getProfile?.() || null;
    return isLoggedIn() && !(p?.blocked || p?.is_blocked || p?.status === 'blocked');
  }

  // Tiêm CSS động cho cấu trúc Tab mới trong bảng Chọn môn học
  function injectStyles() {
    let style = $('subjectTabsStyle');
    if (!style) {
      style = document.createElement('style');
      style.id = 'subjectTabsStyle';
      document.head.appendChild(style);
    }
    style.textContent = `
      .subjectGateTabs {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        margin: -5px 0 0 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        padding-bottom: 8px;
        flex-wrap: wrap;
      }
      body .polishedSubjectPanel > #subjectList {
        margin-top: -8px !important;
        padding-top: 12px !important;
      }
      body .polishedSubjectPanel > #subjectList.inFolder {
        margin-top: -10px !important;
        padding-top: 4px !important;
      }
      body .polishedSubjectPanel > #subjectList.inFolder .subjectFolderBar {
        margin-top: 0 !important;
      }
      body .polishedSubjectPanel .subjectGateFooter {
        margin-top: 4px !important;
        padding: 8px 14px !important;
        border-radius: 16px !important;
      }
      body .polishedSubjectPanel .subjectSelectedBox {
        padding: 2px 0 2px 42px !important;
      }
      body .polishedSubjectPanel .subjectSelectedBox::before {
        width: 28px !important;
        height: 28px !important;
        border-radius: 10px !important;
      }
      body .polishedSubjectPanel .subjectSelectedBox span {
        font-size: 0.68rem !important;
      }
      body .polishedSubjectPanel .subjectSelectedBox b,
      body .polishedSubjectPanel .subjectSelectedBox strong {
        font-size: 0.95rem !important;
      }
      body .polishedSubjectPanel #subjectEnter {
        height: 42px !important;
        min-height: 42px !important;
        border-radius: 12px !important;
        padding: 0 20px !important;
        font-size: 0.88rem !important;
      }
      .subjectGateTabsLeft {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .subjectGateTab {
        background: none;
        border: none;
        color: var(--mist, #a0aec0);
        padding: 10px 18px;
        font-size: 0.9rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        cursor: pointer;
        transition: all 0.2s ease;
        border-bottom: 2px solid transparent;
        margin-bottom: -1px;
      }
      .subjectGateTab.active {
        color: var(--gold, #e8d4a8);
        border-bottom: 2px solid var(--gold, #e8d4a8);
      }
      #subjectGateTabAdd {
        position: relative;
        overflow: hidden;
        background: rgba(200, 169, 110, 0.07);
        border: 1px solid rgba(232, 212, 168, 0.3);
        border-radius: 999px;
        padding: 7px 18px;
        color: var(--gold, #e8d4a8);
        font-size: 0.88rem;
        font-weight: 750;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        cursor: pointer;
        transition: all 0.25s ease;
      }
      #subjectGateTabAdd::before {
        content: '';
        position: absolute;
        top: 0;
        left: -110%;
        width: 100%;
        height: 100%;
        background: linear-gradient(
          120deg,
          transparent 0%,
          rgba(255, 235, 180, 0) 25%,
          rgba(255, 235, 180, 0.45) 46%,
          rgba(255, 255, 255, 0.85) 50%,
          rgba(255, 235, 180, 0.45) 54%,
          transparent 75%
        );
        animation: glitterShimmer 2.8s infinite ease-in-out;
        pointer-events: none;
      }
      #subjectGateTabAdd:hover {
        background: rgba(200, 169, 110, 0.15);
        border-color: rgba(232, 212, 168, 0.65);
        color: #fff;
        box-shadow: 0 0 14px rgba(232, 212, 168, 0.25);
      }
      #subjectGateTabAdd.active {
        color: var(--gold, #e8d4a8);
        border: 1px solid var(--gold, #e8d4a8);
        background: rgba(200, 169, 110, 0.2);
        box-shadow: 0 0 16px rgba(232, 212, 168, 0.35);
      }
      @keyframes glitterShimmer {
        0% { left: -110%; }
        32% { left: 140%; }
        100% { left: 140%; }
      }
      .subjectGateSearchWrap {
        flex: 1;
        min-width: 220px;
        max-width: 480px;
        display: flex;
        align-items: center;
      }
      .subjectGateSearchWrap input, #subjectSearch {
        width: 100%;
        background: rgba(0, 0, 0, 0.25);
        border: 1px solid rgba(200, 169, 110, 0.22);
        border-radius: 12px;
        padding: 8px 16px;
        color: #fff;
        font-size: 0.88rem;
        outline: none;
        transition: all 0.2s ease;
      }
      .subjectGateSearchWrap input:focus, #subjectSearch:focus {
        border-color: var(--gold2, #e8d4a8);
        box-shadow: 0 0 12px rgba(232, 212, 168, 0.2);
        background: rgba(0, 0, 0, 0.4);
      }
      .userAddSubjectWrap {
        animation: fadeInPane 0.25s ease-out;
        padding-top: 5px;
      }
      @keyframes fadeInPane {
        from { opacity: 0; transform: translateY(6px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `;
  }

  // Hàm chuyển đổi Tab thông minh chuyên biệt
  window.__switchSubjectGateTab = function (mode) {
    const isAdd = mode === 'add';
    localStorage.setItem('learninghub_subject_gate_tab_v1', mode);

    // Cập nhật trạng thái Active trên nút bấm Tab
    document.querySelectorAll('.subjectGateTab').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.sgtab === mode);
    });

    // Ẩn/Hiện toàn bộ các thành phần thuộc danh sách môn học cũ
    const listElements = [
      document.querySelector('.subjectGateSubline'),
      document.querySelector('.subjectGateTools'),
      $('subjectGateSearchWrap'),
      // SUBJECT_FOLDER_BAR_IN_TABS_20260729: thanh thư mục nay nằm TRONG hàng tab, nên phải
      // nằm trong danh sách ẩn/hiện này — không thì "← Tất cả môn" còn nổi ở tab Thêm môn mới.
      $('subjectFolderCrumb'),
      $('subjectFolderCrumbMeta'),
      $('subjectList'),
      $('subjectLoading'),
      $('subjectError'),
      $('subjectEmpty'),
      document.querySelector('.subjectGateFooter'),
    ];

    listElements.forEach(el => {
      if (el) el.style.setProperty('display', isAdd ? 'none' : '', isAdd ? 'important' : '');
    });

    // Quản lý Pane nội dung Form thêm môn học
    const form = $('addSubjectForm');
    if (form) {
      form.classList.toggle('hidden', !isAdd);
      if (isAdd) {
        form.innerHTML = getAddSubjectHTML();
        parsedQuestions = [];
        restoreAddSubjectState();
      }
    }
  };

  // Khởi tạo thanh Tab điều hướng nằm dưới Header Chọn môn học
  function ensureSubjectGateTabs() {
    const panel = document.querySelector('.polishedSubjectPanel');
    const header = document.querySelector('.subjectGateHeader');
    if (!panel || !header || $('subjectGateTabsBar')) return;

    injectStyles();

    const tabsBar = document.createElement('div');
    tabsBar.id = 'subjectGateTabsBar';
    tabsBar.className = 'subjectGateTabs';
    tabsBar.innerHTML = `
      <div class="subjectGateTabsLeft">
        <button type="button" class="subjectGateTab active" data-sgtab="list">Danh sách môn học</button>
        <button type="button" class="subjectGateTab" id="subjectGateTabAdd" data-sgtab="add" style="display:none;">Thêm môn mới</button>
      </div>
      <div class="subjectGateSearchWrap" id="subjectGateSearchWrap"></div>
    `;

    header.insertAdjacentElement('afterend', tabsBar);

    // Di chuyển ô tìm kiếm vào thanh Tab
    const searchInput = $('subjectSearch');
    const searchWrap = $('subjectGateSearchWrap');
    if (searchInput && searchWrap) {
      searchWrap.appendChild(searchInput);
    }
    const searchTools = document.querySelector('.subjectGateTools');
    if (searchTools) searchTools.style.display = 'none';

    // Bỏ nút + Thêm môn cũ bên phải ô tìm kiếm
    const addBtn = $('addSubjectBtn');
    if (addBtn) addBtn.remove();

    tabsBar.querySelectorAll('.subjectGateTab').forEach(btn => {
      btn.onclick = () => window.__switchSubjectGateTab(btn.dataset.sgtab);
    });

    const savedTab = localStorage.getItem('learninghub_subject_gate_tab_v1') || 'list';
    if (savedTab === 'add' && canAdd()) {
      window.__switchSubjectGateTab('add');
    } else {
      window.__switchSubjectGateTab('list');
    }
  }

  function showAddBtn() {
    ensureSubjectGateTabs();
    const btn = $('addSubjectBtn');
    const tabBtn = $('subjectGateTabAdd');
    const allowed = canAdd();
    if (btn) btn.classList.toggle('hidden', !allowed);

    const note = $('userApprovalNote');
    if (note) {
      note.style.setProperty('display', allowed && !isAdminOrEditor() ? 'block' : 'none', 'important');
    }

    if (tabBtn) {
      const wasHidden = tabBtn.style.display === 'none';
      tabBtn.style.display = allowed ? 'block' : 'none';
      if (allowed && wasHidden) {
        const savedTab = localStorage.getItem('learninghub_subject_gate_tab_v1') || 'list';
        if (savedTab === 'add') {
          window.__switchSubjectGateTab('add');
        }
      }
    }
  }

  const AI_PROMPT = `Bạn là trợ lý chuyển đổi ngân hàng câu hỏi trắc nghiệm sang JSON trong file Markdown.

ĐỌC FILE và chuyển đổi NGUYÊN VẸN (KHÔNG tự biên thêm, KHÔNG bỏ bớt).

QUY TẮC BATCH:

- Sau mỗi batch DỪNG và nói: "Gõ 'tiếp' để xuất câu X-Y."
- Khi nhận "tiếp", xuất batch tiếp theo, đánh số "num" liên tục.
- Mỗi batch xuất 1 file .md hoàn chỉnh, tải được ngay.

QUY TẮC CHUYỂN ĐỔI:
- Đáp án: chỉ lấy ký tự chữ cái đầu tiên sau "**Đáp án:**" (bỏ mọi chú thích phía sau).
- Nếu câu chỉ có A/B/C (không có D): bỏ key "D" khỏi object options.
- Giữ NGUYÊN nội dung câu hỏi và lựa chọn, KHÔNG paraphrase.
- "has_image": false (trừ khi câu đề cập hình ảnh/biểu đồ).
- "error_risk": "low" (câu ngắn, rõ) | "medium" (câu trung bình) | "high" (câu dài, phức tạp, dễ nhầm).

FORMAT FILE .MD OUTPUT:
---
# [Tên môn] - Batch [N] (Câu [X]-[Y])
> Xuất ngày: [ngày hôm nay] | Tổng: [số câu trong batch] câu
---

\`\`\`json
[
  {
    "num": 1,
    "question": "…?",
    "options": {
      "A": "…",
      "B": "…",
      "C": "…",
      "D": "…"
    },
    "answer": "B",
    "images": [],
    "has_image": false,
    "error_risk": "low"
  }
]
\`\`\`
---

KHÔNG thêm bất kỳ text giải thích nào bên ngoài cấu trúc trên.
Bắt đầu ngay từ câu 1.`;

  window.__ADD_SUBJECT_AI_PROMPT = AI_PROMPT;
  let parsedQuestions = [];

  function clearAddSubjectLocalStorage() {
    localStorage.removeItem('learninghub_add_subject_code_v1');
    localStorage.removeItem('learninghub_add_subject_name_v1');
    localStorage.removeItem('learninghub_add_subject_desc_v1');
    localStorage.removeItem('learninghub_add_subject_step_v1');
    localStorage.removeItem('learninghub_add_subject_file_name_v1');
    localStorage.removeItem('learninghub_add_subject_file_size_v1');
    localStorage.removeItem('learninghub_add_subject_file_data_v1');
    localStorage.removeItem('learninghub_add_subject_file_previewed_v1');
  }

  function restoreAddSubjectState() {
    const code = localStorage.getItem('learninghub_add_subject_code_v1') || '';
    const name = localStorage.getItem('learninghub_add_subject_name_v1') || '';
    const desc = localStorage.getItem('learninghub_add_subject_desc_v1') || '';
    const savedStep = parseInt(localStorage.getItem('learninghub_add_subject_step_v1') || '1');

    const codeInp = $('addSubjectCode');
    const nameInp = $('addSubjectName');
    const descInp = $('addSubjectDesc');

    if (codeInp) codeInp.value = code;
    if (nameInp) nameInp.value = name;
    if (descInp) descInp.value = desc;

    codeInp?.addEventListener('input', function () {
      this.value = this.value.toUpperCase().replace(/[^A-Z0-9_]/g, '');
      localStorage.setItem('learninghub_add_subject_code_v1', this.value);
    });
    nameInp?.addEventListener('input', function () {
      localStorage.setItem('learninghub_add_subject_name_v1', this.value);
    });
    // SUBJECT_DESC_LIMIT_20260728: 160 ký tự là đúng chỗ thẻ môn hiện được (.subjectCardDesc kẹp
    // 3 dòng). Trước đây form cho gõ 300 nhưng thẻ chỉ hiện ~110 nên phần dư mất hẳn.
    const syncDescCount = () => {
      const el = $('addSubjectDescCount');
      if (!el || !descInp) return;
      const n = descInp.value.length;
      el.textContent = n + '/160';
      el.classList.toggle('nearLimit', n >= 140 && n <= 160);
      el.classList.toggle('overLimit', n > 160);
    };
    syncDescCount();
    descInp?.addEventListener('input', function () {
      localStorage.setItem('learninghub_add_subject_desc_v1', this.value);
      syncDescCount();
    });

    const fileName = localStorage.getItem('learninghub_add_subject_file_name_v1');
    const fileSize = localStorage.getItem('learninghub_add_subject_file_size_v1');
    const fileData = localStorage.getItem('learninghub_add_subject_file_data_v1');

    if (fileName && fileData) {
      if ($('userImportData')) $('userImportData').value = fileData;
      const dropZone = $('importDropZone');
      const card = $('userImportFileCard');
      const nameEl = $('userImportFileName');
      const metaEl = $('userImportFileMeta');
      if (dropZone) dropZone.classList.add('hidden');
      if (card) card.classList.remove('hidden');
      if (nameEl) nameEl.textContent = fileName;
      if (metaEl)
        metaEl.textContent = Math.max(1, Math.round(parseInt(fileSize || '0') / 1024)) + ' KB · Sẵn sàng xem trước';
      const pv = $('previewImportBtn');
      if (pv) {
        pv.classList.remove('hidden');
        pv.disabled = false;
      }

      const wasPreviewed = localStorage.getItem('learninghub_add_subject_file_previewed_v1') === 'true';
      if (wasPreviewed) {
        setTimeout(() => {
          if (typeof window.__previewUserImport === 'function') {
            window.__previewUserImport();
          }
        }, 100);
      }
    }

    $('userImportFile')?.addEventListener('change', handleFileImport);

    if (savedStep > 1 && code && name) {
      setTimeout(() => {
        window.__switchStep(savedStep);
      }, 50);
    }
  }

  // MÃ MỚI: Giao diện form chia 3 bước (Stepper)
  function getAddSubjectHTML() {
    return `<div class="userAddSubjectWrap">
      <div class="subject-stepper" id="subjectStepper">
        <div class="step active" data-step="1"><span>1</span> Thông tin</div>
        <div class="step-line"></div>
        <div class="step" data-step="2"><span>2</span> Lấy Prompt</div>
        <div class="step-line"></div>
        <div class="step" data-step="3"><span>3</span> Import</div>
      </div>

      <div id="addStep1" class="add-step-content active">
        <div class="addSubjectFields">
          <div class="addSubjectField">
            <label>Mã môn <span class="req">*</span></label>
            <input id="addSubjectCode" type="text" placeholder="VD: ABC123" maxlength="20">
          </div>
          <div class="addSubjectField">
            <label>Tên môn <span class="req">*</span></label>
            <input id="addSubjectName" type="text" placeholder="VD: Tên môn học" maxlength="100">
          </div>
          <div class="addSubjectField full">
            <label>Mô tả ngắn <span class="descCounter" id="addSubjectDescCount">0/160</span></label>
            <textarea id="addSubjectDesc" placeholder="Mô tả môn học..." rows="2" maxlength="160"></textarea>
          </div>
        </div>
        <div class="step-actions right">
          <button class="primary" type="button" onclick="window.__switchStep(2)">Tiếp tục ➔</button>
        </div>
      </div>

      <div id="addStep2" class="add-step-content">
        <div class="aiStepCard" style="margin-bottom:0;">
          <p>Copy prompt dưới đây và dán vào AI (Gemini/ChatGPT/Claude) kèm theo tài liệu môn học của bạn.</p>
        </div>
        
        <div class="aiPromptActions">
          <button class="aiCopyBtn" type="button" onclick="window.__copyUserAIPrompt()" id="btnCopyPrompt">📋 Sao chép prompt</button>
          <button class="aiViewPromptBtn" type="button" onclick="window.__openUserAIPromptModal()" id="btnViewPrompt">👁 Xem prompt</button>
        </div>

        <div class="aiToolLinks" style="margin-bottom: 25px;">
          <a href="https://gemini.google.com" target="_blank" class="aiToolBtn gemini">✦ Gemini</a>
          <a href="https://chatgpt.com" target="_blank" class="aiToolBtn chatgpt">◉ ChatGPT</a>
          <a href="https://claude.ai" target="_blank" class="aiToolBtn claude">◈ Claude</a>
        </div>

        <div class="step-actions">
          <button class="btn" type="button" onclick="window.__switchStep(1)">⬅ Quay lại</button>
          <button class="primary" type="button" onclick="window.__switchStep(3)">Đã có file, Tiếp tục ➔</button>
        </div>
      </div>

      <div id="addStep3" class="add-step-content">
        <div class="importUnifiedBox">
          <div class="userFileInputWrap" id="importDropZone" onclick="document.getElementById('userImportFile').click()">
            <span class="icon">☁️</span>
            <p><b>Kéo thả file .json hoặc .zip (gồm JSON & hình ảnh) vào đây</b><br><span style="font-size:0.85rem; opacity:0.6;">Hoặc bấm để chọn file từ máy (.json, .zip, .md, .txt)</span></p>
            <input type="file" id="userImportFile" accept=".json,.zip,.md,.txt" style="display:none;">
          </div>

          <textarea id="userImportData" class="hiddenImportData" aria-hidden="true"></textarea>
          <div id="userImportFileCard" class="userImportFileCard hidden">
            <div class="fileIcon">📄</div>
            <div class="fileInfo">
              <b id="userImportFileName">Chưa chọn file</b>
              <span id="userImportFileMeta">File import câu hỏi</span>
            </div>
            <button class="removeFileBtn" type="button" onclick="window.__clearUserImportFile()">Xóa file</button>
          </div>

          <div class="step-actions importStepActions">
            <button class="btn" type="button" onclick="window.__switchStep(2)">⬅ Quay lại</button>
            <div>
              <button class="btn previewImportBtn hidden" type="button" id="previewImportBtn" onclick="window.__previewUserImport()">Xem trước</button>
              <button class="primary" type="button" id="userImportBtn" onclick="window.__submitSubjectRequest()" disabled>Lưu Môn Học</button>
            </div>
          </div>
        </div>
      </div>
      
      <div class="userApprovalNote" id="userApprovalNote" style="margin-top:15px; display:none;">⏳ Yêu cầu sẽ được gửi cho admin duyệt trước.</div>
    </div>`;
  }

  // Logic chuyển bước & Khởi tạo tính năng kéo thả
  window.__switchStep = function (step) {
    // Bắt buộc nhập mã môn + tên môn trước khi qua bước 2 (Prompt)
    if (step >= 2) {
      const code = (document.getElementById('addSubjectCode')?.value || '').trim();
      const name = (document.getElementById('addSubjectName')?.value || '').trim();
      if (!code) {
        alert('Vui lòng nhập mã môn trước khi tiếp tục.');
        document.getElementById('addSubjectCode')?.focus();
        return;
      }
      if (!name) {
        alert('Vui lòng nhập tên môn trước khi tiếp tục.');
        document.getElementById('addSubjectName')?.focus();
        return;
      }
    }

    localStorage.setItem('learninghub_add_subject_step_v1', step);

    // Ẩn tất cả các bước
    document.querySelectorAll('.add-step-content').forEach(el => el.classList.remove('active'));
    // Hiện bước hiện tại
    const target = document.getElementById('addStep' + step);
    if (target) target.classList.add('active');

    // Đổi màu thanh tiến trình
    document.querySelectorAll('.subject-stepper .step').forEach(el => {
      const s = parseInt(el.getAttribute('data-step'));
      if (s <= step) el.classList.add('active');
      else el.classList.remove('active');
    });

    // Kích hoạt tính năng kéo thả file ở Bước 3
    if (step === 3 && !window._dropZoneInit) {
      const dropZone = document.getElementById('importDropZone');
      const fileInput = document.getElementById('userImportFile');
      if (dropZone && fileInput) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evt => {
          dropZone.addEventListener(
            evt,
            e => {
              e.preventDefault();
              e.stopPropagation();
            },
            false,
          );
        });
        ['dragenter', 'dragover'].forEach(evt => {
          dropZone.addEventListener(evt, () => dropZone.classList.add('dragover'), false);
        });
        ['dragleave', 'drop'].forEach(evt => {
          dropZone.addEventListener(evt, () => dropZone.classList.remove('dragover'), false);
        });
        dropZone.addEventListener(
          'drop',
          e => {
            const dt = e.dataTransfer;
            if (dt.files && dt.files.length) {
              const one = new DataTransfer();
              one.items.add(dt.files[0]);
              fileInput.files = one.files;
              fileInput.dispatchEvent(new Event('change')); // Gọi hàm đọc file
            }
          },
          false,
        );
        window._dropZoneInit = true; // Đánh dấu đã khởi tạo
      }
    }
  };

  function handleFileImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.toLowerCase().endsWith('.zip')) {
      window.__selectedImportFile = file;
      localStorage.setItem('learninghub_add_subject_file_name_v1', file.name);
      localStorage.setItem('learninghub_add_subject_file_size_v1', String(file.size));
      localStorage.removeItem('learninghub_add_subject_file_data_v1');
      localStorage.removeItem('learninghub_add_subject_file_previewed_v1');

      const dropZone = $('importDropZone');
      const card = $('userImportFileCard');
      const nameEl = $('userImportFileName');
      const metaEl = $('userImportFileMeta');
      if (dropZone) dropZone.classList.add('hidden');
      if (card) card.classList.remove('hidden');
      if (nameEl) nameEl.textContent = file.name;
      if (metaEl)
        metaEl.textContent =
          (file.size / (1024 * 1024)).toFixed(1) + ' MB · File ZIP (JSON & ảnh) · Sẵn sàng xem trước';
      const pv = $('previewImportBtn');
      if (pv) {
        pv.classList.remove('hidden');
        pv.disabled = false;
      }
      const saveBtn = $('userImportBtn');
      if (saveBtn) saveBtn.disabled = true;
      parsedQuestions = [];
      notify('Đã chọn file ZIP ' + file.name + '. Bấm Xem trước để kiểm tra & giải nén.');
      return;
    }

    window.__selectedImportFile = null;
    const reader = new FileReader();
    reader.onload = function () {
      const text = reader.result;
      let jsonStr = text;
      const mdMatch = text.match(/```json\s*([\s\S]*?)```/);
      if (mdMatch) jsonStr = mdMatch[1];
      else {
        const jsonMatch = text.match(/```\s*([\s\S]*?)```/);
        if (jsonMatch) jsonStr = jsonMatch[1];
      }
      const cleanedData = jsonStr.trim();
      if ($('userImportData')) $('userImportData').value = cleanedData;

      // Lưu file data vào localStorage
      localStorage.setItem('learninghub_add_subject_file_name_v1', file.name);
      localStorage.setItem('learninghub_add_subject_file_size_v1', String(file.size));
      localStorage.setItem('learninghub_add_subject_file_data_v1', cleanedData);
      localStorage.removeItem('learninghub_add_subject_file_previewed_v1');

      const dropZone = $('importDropZone');
      const card = $('userImportFileCard');
      const nameEl = $('userImportFileName');
      const metaEl = $('userImportFileMeta');
      if (dropZone) dropZone.classList.add('hidden');
      if (card) card.classList.remove('hidden');
      if (nameEl) nameEl.textContent = file.name;
      if (metaEl) metaEl.textContent = Math.max(1, Math.round(file.size / 1024)) + ' KB · Sẵn sàng xem trước';
      const pv = $('previewImportBtn');
      if (pv) {
        pv.classList.remove('hidden');
        pv.disabled = false;
      }
      const saveBtn = $('userImportBtn');
      if (saveBtn) saveBtn.disabled = true;
      parsedQuestions = [];
      notify('Đã đọc file ' + file.name + '. Bấm Xem trước để kiểm tra.');
    };
    reader.readAsText(file);
  }

  // ===== QUIZLET_IMPORT_AUTODETECT_20260701 =====
  // Tự nhận diện & chuyển file export Quizlet sang format app: chấp nhận JSON {terms:[{term,definition}]},
  // mảng [{term,definition}], hoặc bảng Markdown | Term | Definition |. Trả null nếu không phải Quizlet.
  // Mỗi câu: error_risk='low' (do trích xuất từ web), has_image=true nếu văn bản nhắc tới ảnh/figure, images rỗng.
  window.__LHConvertQuizlet = function (raw) {
    function scanNeedsImage(t) {
      return /(hình vẽ|hình bên|hình sau|đồ thị|bảng biến thiên|sơ đồ|xem hình|picture shows|shows an image|this (picture|image|figure)|the (image|figure|picture|diagram) (below|above)|following (image|figure|picture|diagram)|shown below|pictured|in the (picture|image|figure))/i.test(
        String(t || ''),
      );
    }
    function parseTerm(term, def) {
      var re = /([A-Fa-f])\.(?=\s|[A-Z])/g,
        m,
        marks = [];
      while ((m = re.exec(term)) !== null) marks.push({ L: m[1].toUpperCase(), idx: m.index, end: m.index + 2 });
      var seq = [],
        expect = 65;
      marks.forEach(function (mk) {
        if (mk.L === String.fromCharCode(expect)) {
          seq.push(mk);
          expect++;
        }
      });
      if (seq.length < 2) return null;
      var question = term.slice(0, seq[0].idx).trim(),
        options = {};
      for (var i = 0; i < seq.length; i++) {
        var s = seq[i].end,
          e = i + 1 < seq.length ? seq[i + 1].idx : term.length;
        options[seq[i].L] = term.slice(s, e).trim().replace(/\s+/g, ' ').replace(/\.$/, '').trim();
      }
      var ams = (String(def || '').match(/(?:^|\s)([A-Fa-f])\.(?=\s|[A-Z]|$)/g) || []).map(function (x) {
        return x.trim()[0].toUpperCase();
      });
      var answer = ams.length
        ? Array.from(new Set(ams)).join('')
        : String(def || '')
            .toUpperCase()
            .replace(/[^A-F]/g, '');
      answer = Array.from(answer)
        .filter(function (a) {
          return options[a];
        })
        .join('');
      if (!question || !answer) return null;
      return { question: question, options: options, answer: answer };
    }
    var terms = null;
    try {
      var j = JSON.parse(raw);
      if (j && Array.isArray(j.terms))
        terms = j.terms.map(function (t) {
          return { term: t.term, def: t.definition };
        });
      else if (Array.isArray(j) && j.length && j[0] && 'term' in j[0] && 'definition' in j[0])
        terms = j.map(function (t) {
          return { term: t.term, def: t.definition };
        });
    } catch (e) {
      lhWarn('QUIZLET_IMPORT_AUTODETECT_20260701', e);
    }
    if (!terms) {
      var rows = [];
      raw.split(/\r?\n/).forEach(function (ln) {
        if (!ln.trim().startsWith('|')) return;
        var c = ln.split('|').map(function (s) {
          return s.trim();
        });
        if (!c[1] || c[1] === 'Term' || /^-+$/.test(c[1])) return;
        rows.push({ term: c[1], def: c[2] });
      });
      if (rows.length) terms = rows;
    }
    if (!terms || !terms.length) return null;
    var out = [],
      seen = {};
    terms.forEach(function (t) {
      var p = parseTerm(String(t.term || ''), String(t.def || ''));
      if (!p) return;
      var key = p.question.toLowerCase().replace(/\s+/g, ' ').slice(0, 90);
      if (seen[key]) return;
      seen[key] = 1;
      var needImg = scanNeedsImage(p.question + ' ' + Object.values(p.options).join(' '));
      out.push({
        question: p.question,
        options: p.options,
        answer: p.answer,
        images: [],
        has_image: needImg,
        error_risk: 'low',
        error_risk_reason: '',
      });
    });
    return out.length ? out : null;
  };
  // ===== END QUIZLET_IMPORT_AUTODETECT_20260701 =====

  window.__previewUserImport = async function () {
    if (window.__selectedImportFile && window.__selectedImportFile.name.toLowerCase().endsWith('.zip')) {
      try {
        const importer = window.LHSubjectImport;
        if (!importer) {
          alert('Module LHSubjectImport chưa sẵn sàng.');
          return;
        }

        const res = await importer.readAndValidateZipFile(window.__selectedImportFile);
        let parsedZipData = res;

        if (res.needSelectJson) {
          const selected = prompt(
            'File ZIP chứa nhiều file JSON câu hỏi:\n\n' +
              res.jsonCandidates.join('\n') +
              '\n\nVui lòng nhập đúng tên file JSON bạn muốn dùng:',
            res.jsonCandidates[0],
          );
          if (!selected) return;

          const chosen = res.jsonCandidates.find(p => p.toLowerCase() === selected.toLowerCase().trim());
          if (!chosen) {
            alert('File JSON đã chọn không có trong danh sách.');
            return;
          }

          const imageEntries = new Map();
          Object.keys(res.zipInstance.files).forEach(k => {
            const ext = k.slice(k.lastIndexOf('.')).toLowerCase();
            if (['.png', '.jpg', '.jpeg', '.webp', '.gif'].includes(ext)) {
              imageEntries.set(k, res.zipInstance.files[k]);
            }
          });

          parsedZipData = await importer.processSelectedJsonFromZip(
            res.zipInstance,
            chosen,
            imageEntries,
            res.zipFile.name,
          );
        }

        const questions = parsedZipData.questions;
        window.__previewImportData = questions;
        parsedQuestions = questions;
        localStorage.setItem('learninghub_add_subject_file_previewed_v1', 'true');

        const codeInp = $('addSubjectCode');
        if (codeInp && !codeInp.value.trim() && parsedZipData.suggestedCode) {
          codeInp.value = parsedZipData.suggestedCode;
        }

        const metaEl = $('userImportFileMeta');
        if (metaEl) metaEl.textContent = questions.length + ' câu hỏi đã kiểm tra · Sẵn sàng lưu';
        const btn = $('userImportBtn');
        if (btn) btn.disabled = false;

        // Mở giao diện Import chuẩn của Learning Hub
        window.__openImportPreviewModal(questions);
        notify('OK! ' + questions.length + ' câu hỏi sẵn sàng');
      } catch (err) {
        alert('Lỗi kiểm tra ZIP:\n' + (err.message || err));
      }
      return;
    }

    const raw = ($('userImportData')?.value || '').trim();
    const btn = $('userImportBtn');
    if (!raw) {
      alert('Bạn hãy chọn file .zip / .json / .md / .txt trước.');
      return;
    }

    let data;
    try {
      var quizletData = window.__LHConvertQuizlet ? window.__LHConvertQuizlet(raw) : null;
      if (quizletData && quizletData.length) {
        data = quizletData;
      } else {
        var jsonBlocks = raw.match(/```json\s*([\s\S]*?)```/g);
        if (jsonBlocks && jsonBlocks.length > 0) {
          data = [];
          jsonBlocks.forEach(function (block) {
            var cleaned = block.replace(/^```json\s*/, '').replace(/```\s*$/, '');
            var parsed = JSON.parse(cleaned);
            if (Array.isArray(parsed)) data = data.concat(parsed);
            else if (parsed.questions && Array.isArray(parsed.questions)) data = data.concat(parsed.questions);
          });
        } else {
          var cleaned = raw;
          if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```\w*\s*/, '').replace(/```\s*$/, '');
          data = JSON.parse(cleaned);
        }
      }
    } catch (e) {
      localStorage.removeItem('learninghub_add_subject_file_previewed_v1');
      alert('JSON không hợp lệ. Hãy kiểm tra lại format.\n\nLỗi: ' + e.message);
      return;
    }

    if (!Array.isArray(data)) {
      if (data.questions && Array.isArray(data.questions)) data = data.questions;
      else {
        localStorage.removeItem('learninghub_add_subject_file_previewed_v1');
        alert('Dữ liệu phải là mảng JSON [...]');
        return;
      }
    }

    const errors = [];
    data.forEach((q, i) => {
      if (!q.question) errors.push('Câu ' + (i + 1) + ': thiếu "question"');
      if (!q.options || typeof q.options !== 'object') errors.push('Câu ' + (i + 1) + ': thiếu "options"');
      if (!q.answer) errors.push('Câu ' + (i + 1) + ': thiếu "answer"');
    });
    if (errors.length) {
      localStorage.removeItem('learninghub_add_subject_file_previewed_v1');
      alert('Dữ liệu có lỗi:\n\n' + errors.slice(0, 10).join('\n'));
      return;
    }

    localStorage.setItem('learninghub_add_subject_file_previewed_v1', 'true');
    parsedQuestions = data;
    window.__previewSelections = {};
    const metaEl = $('userImportFileMeta');
    if (metaEl) metaEl.textContent = data.length + ' câu hỏi đã kiểm tra · Có thể lưu';
    if (btn) btn.disabled = false;
    window.__openImportPreviewModal(data);
    notify('OK! ' + data.length + ' câu hỏi sẵn sàng');
  };

  window.__closeImportPreviewModal = function () {
    document.getElementById('importPreviewModal')?.classList.add('hidden');
  };

  window.__submitSubjectRequest = async function () {
    const code = ($('addSubjectCode')?.value || '').trim().toUpperCase();
    const name = ($('addSubjectName')?.value || '').trim();
    const desc = ($('addSubjectDesc')?.value || '').trim();

    if (!code) {
      alert('Vui lòng nhập mã môn');
      $('addSubjectCode')?.focus();
      return;
    }
    if (!/^[A-Z0-9_]{2,20}$/.test(code)) {
      alert('Mã môn chỉ gồm chữ, số, gạch dưới (2-20 ký tự)');
      $('addSubjectCode')?.focus();
      return;
    }
    if (!name) {
      alert('Vui lòng nhập tên môn');
      $('addSubjectName')?.focus();
      return;
    }
    if (!parsedQuestions.length) {
      alert('Bạn cần chọn file và bấm Xem trước trước khi lưu môn học.');
      return;
    }

    const c = client();
    if (!c) {
      alert('Chưa kết nối Supabase');
      return;
    }

    const btn = $('userImportBtn');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Đang lưu...';
    }

    // Hiển thị thanh tiến trình ngay từ khi bắt đầu
    showProgress('Bắt đầu khởi tạo môn học...', 0, 100, 'Đang chuẩn bị dữ liệu...');
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      // Cho phép trùng mã môn + tên môn (nhiều bộ câu hỏi cùng mã)

      let successMsg = '';
      if (isAdminOrEditor()) {
        // Cho phép thêm nhiều môn cùng mã gốc: HOD102, HOD102_2, HOD102_3...
        // Như vậy không bị lỗi trùng câu số 1,2,3... trong database.
        // Tạo môn + nhập toàn bộ câu hỏi (kèm ảnh) trên Turso qua 1 action.
        showProgress('Đang lưu môn học...', 50, 100, 'Đang tạo môn và nhập câu hỏi lên máy chủ...');
        const u0 = window.HODSupabase?.getUser?.();
        const res = await fetch('/api/admin-action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
          body: JSON.stringify({
            user_id: u0?.id,
            action: 'add_subject',
            payload: { code, name: name || code, description: desc || '', questions: parsedQuestions || [] },
          }),
        });
        const out = await res.json().catch(() => ({}));
        if (!res.ok || out.error) {
          alert('Lỗi tạo môn: ' + (out.error || res.status));
          return;
        }
        const finalCode = out.code || code;
        const success = (parsedQuestions || []).length;
        successMsg = 'Đã thêm môn ' + finalCode + ' với ' + success + ' câu hỏi';
        try {
          const key = 'learninghub_subject_counts_cache_v3';
          const store = JSON.parse(localStorage.getItem(key) || '{}') || {};
          store.counts = store.counts || {};
          store.confirmed = store.confirmed || {};
          store.counts[finalCode] = success;
          store.confirmed[finalCode] = true;
          store.updated_at = new Date().toISOString();
          localStorage.setItem(key, JSON.stringify(store));
          localStorage.setItem('learninghub_subjects_dirty_v3', String(Date.now()));
          localStorage.removeItem('learninghub_subjects_cache_v1');
          sessionStorage.removeItem('learninghub_subject_counts_cache_v1');
          window.clearLearningHubSupabaseCache?.('subjects');
          window.clearLearningHubSupabaseCache?.('questions');
        } catch (e) {
          lhWarn('appCore', e);
        }
        alert(successMsg);
        notify(successMsg);
        window.__switchSubjectGateTab('list');
        try {
          $('subjectRefresh')?.click();
          setTimeout(() => $('subjectRefresh')?.click(), 5600);
          setTimeout(() => window.refreshSubjectCountsOnce?.(), 6500);
        } catch (e) {
          lhWarn('appCore', e);
        }
      } else {
        // Học viên/User gửi request: Hiển thị thanh tiến trình khi upload tệp tin lớn
        showProgress('Đang gửi yêu cầu tạo môn học...', 50, 100, 'Đang tải dữ liệu câu hỏi lên máy chủ...');
        await new Promise(resolve => setTimeout(resolve, 100));

        const u = window.HODSupabase?.getUser?.();
        const res = await fetch('/api/admin-action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
          body: JSON.stringify({
            user_id: u?.id,
            action: 'add_subject_request',
            payload: { code, name, description: desc || '', questions_data: parsedQuestions || [] },
          }),
        });
        const out = await res.json().catch(() => ({}));
        if (!res.ok || out.error) {
          alert('Lỗi gửi yêu cầu: ' + (out.error || res.status));
          return;
        }
        successMsg = 'Đã gửi yêu cầu thêm môn ' + code + '. Vui lòng chờ admin duyệt.';
        alert(successMsg);
        notify(successMsg);
        window.__switchSubjectGateTab('list');
      }

      parsedQuestions = [];
      document.getElementById('importPreviewModal')?.classList.add('hidden');
      clearAddSubjectLocalStorage();
    } catch (e) {
      console.warn('Add subject error:', e);
      alert('Lỗi khi lưu môn học: ' + (e?.message || e));
      notify('Lỗi khi lưu môn học');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Lưu Môn Học';
      }
      hideProgress();
    }
  };

  window.__closeAddSubject = function () {
    window.__switchSubjectGateTab('list');
  };

  function bind() {
    $('addSubjectBtn')?.addEventListener('click', () => window.__switchSubjectGateTab('add'));
    showAddBtn();
    setInterval(showAddBtn, 2000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
})();
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
    if (typeof syncUserSubjectToProfile === 'function') {
      try {
        syncUserSubjectToProfile(subject);
      } catch (e) {
        lhWarn('PATCH_NO_LOCAL_QUESTIONS_SUPABASE_ONLY', e);
      }
    }
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
        images: typeof cleanImages === 'function' ? cleanImages(r.images || []) : r.images || [],
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
        syncSubjectTexts?.();
        updateCardTools?.();
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
(function () {
  let canvas,
    ctx,
    w = 0,
    h = 0,
    dpr = 1,
    parts = [],
    raf = 0,
    uxInterval = 0,
    resizeT = 0,
    running = false;
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function gateActive() {
    const gate = document.getElementById('hodLoginGate');
    return !!gate && !gate.classList.contains('hidden') && getComputedStyle(gate).display !== 'none';
  }
  function ensureCanvas() {
    const gate = document.getElementById('hodLoginGate');
    if (!gate || reduce) return null;
    canvas = document.getElementById('landingParticles');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'landingParticles';
      gate.prepend(canvas);
    }
    ctx = canvas.getContext('2d');
    return gate;
  }
  function resize() {
    if (!canvas || !ctx) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    init();
  }
  function resizeDebounced() {
    clearTimeout(resizeT);
    resizeT = setTimeout(resize, 150);
  }
  function init() {
    // Giảm số hạt tối thiểu trên màn nhỏ (điện thoại) thay vì luôn ép sàn 55 hạt.
    const floorCount = w <= 480 ? 26 : w <= 860 ? 40 : 55;
    const count = Math.min(140, Math.max(floorCount, Math.floor((w * h) / 14000)));
    parts = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 0.7 + Math.random() * 2.4,
      vx: (Math.random() - 0.5) * 0.22,
      vy: -0.1 - Math.random() * 0.42,
      a: 0.18 + Math.random() * 0.55,
      p: Math.random() * Math.PI * 2,
      hue: Math.random() < 0.55 ? '255,255,255' : Math.random() < 0.5 ? '255,226,170' : '135,225,255',
    }));
  }
  function stop() {
    running = false;
    cancelAnimationFrame(raf);
    raf = 0;
    if (uxInterval) {
      clearInterval(uxInterval);
      uxInterval = 0;
    }
  }
  function draw() {
    if (!running) return;
    // Dừng hẳn (không chỉ tạm nghỉ) khi landing gate đã bị ẩn/đóng sau đăng nhập, tránh vòng lặp chạy nền vô thời hạn.
    if (!gateActive()) {
      stop();
      return;
    }
    if (!ctx || document.hidden) {
      raf = requestAnimationFrame(draw);
      return;
    }
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';
    for (const p of parts) {
      p.p += 0.012;
      p.x += p.vx + Math.sin(p.p) * 0.1;
      p.y += p.vy;
      if (p.y < -20) {
        p.y = h + 20;
        p.x = Math.random() * w;
      }
      if (p.x < -30) p.x = w + 30;
      if (p.x > w + 30) p.x = -30;
      const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 7);
      glow.addColorStop(0, `rgba(${p.hue},${p.a})`);
      glow.addColorStop(0.45, `rgba(${p.hue},${p.a * 0.22})`);
      glow.addColorStop(1, `rgba(${p.hue},0)`);
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(${p.hue},${Math.min(1, p.a + 0.15)})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    raf = requestAnimationFrame(draw);
  }
  function ux() {
    if (!gateActive()) {
      stop();
      return;
    }
    const b = document.getElementById('subjectEnter');
    if (b) b.textContent = 'Bắt đầu';
    const i = document.getElementById('subjectSearch');
    if (i) i.placeholder = 'Tìm môn học...';
    const l = document.getElementById('subjectLoading'),
      r = document.getElementById('subjectRefresh');
    if (l && r) {
      const on = !l.classList.contains('hidden');
      r.classList.toggle('is-loading', on);
      r.setAttribute('aria-busy', on ? 'true' : 'false');
    }
  }
  function parallax() {
    const g = document.getElementById('hodLoginGate');
    if (!g || g.__particles3d) return;
    g.__particles3d = true;
    g.addEventListener(
      'pointermove',
      e => {
        const r = g.getBoundingClientRect();
        const x = Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100));
        const y = Math.max(0, Math.min(100, ((e.clientY - r.top) / r.height) * 100));
        g.style.setProperty('--mx', x.toFixed(1) + '%');
        g.style.setProperty('--my', y.toFixed(1) + '%');
      },
      { passive: true },
    );
  }
  function boot() {
    ux();
    parallax();
    if (ensureCanvas()) {
      resize();
      cancelAnimationFrame(raf);
      running = true;
      draw();
      if (!uxInterval) uxInterval = setInterval(ux, 150);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  window.addEventListener('resize', resizeDebounced, { passive: true });
})();
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
// Thay khu vực "Báo cáo đã gửi" trong menu tài khoản thành nút bấm mở tab/modal xem báo cáo.
(function () {
  const $ = id => document.getElementById(id);
  const esc = s =>
    String(s ?? '').replace(
      /[&<>"']/g,
      c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );
  const user = () => window.HODSupabase?.getUser?.() || null;

  function ensureReportModal() {
    if ($('hodReportModal')) return;
    const modal = document.createElement('div');
    modal.id = 'hodReportModal';
    modal.className = 'modal hidden hodReportModal';
    modal.innerHTML = `
      <div class="box hodReportModalBox">
        <button class="modalX" id="hodReportModalClose" type="button" title="Đóng">×</button>
        <div class="hodReportModalHead">
          <div>
            <div class="hodReportModalLabel">BÁO CÁO ĐÃ GỬI</div>
            <h2>Danh sách báo cáo</h2>
            <p>Xem trạng thái các báo cáo/chỉnh sửa bạn đã gửi cho admin.</p>
          </div>
          <button id="hodReportModalReload" class="btn" type="button">Tải lại</button>
        </div>
        <div id="hodReportModalList" class="hodReportModalList">Chưa tải.</div>
      </div>`;
    document.body.appendChild(modal);
    $('hodReportModalClose')?.addEventListener('click', () => modal.classList.add('hidden'));
    $('hodReportModalReload')?.addEventListener('click', loadReportModalList);
    modal.addEventListener('mousedown', e => {
      if (e.target === modal) modal.classList.add('hidden');
    });
  }

  function ensureReportButton() {
    const menu = $('hodAccountMenu');
    if (!menu) return;
    let box = $('hodReportBox');
    if (!box) {
      box = document.createElement('div');
      box.id = 'hodReportBox';
      box.className = 'hodReportBox';
      const logout = $('hodLogoutBtn');
      logout ? menu.insertBefore(box, logout) : menu.appendChild(box);
    }
    box.innerHTML = `
      <button id="hodOpenReportsBtn" class="hodOpenReportsBtn" type="button">
        <span>Báo cáo đã gửi</span>
        <b>Xem</b>
      </button>`;
    $('hodOpenReportsBtn')?.addEventListener('click', openReportsTab);
  }

  function statusText(s) {
    return { pending: 'Đang chờ', approved: 'Đã duyệt', rejected: 'Từ chối' }[s] || s || 'Không rõ';
  }
  function statusClass(s) {
    return s === 'approved' ? 'approved' : s === 'rejected' ? 'rejected' : 'pending';
  }

  async function loadReportModalList() {
    ensureReportModal();
    const list = $('hodReportModalList');
    const u = user();
    if (!list) return;
    if (!u) {
      list.innerHTML = '<div class="hodReportEmpty">Đăng nhập để xem báo cáo.</div>';
      return;
    }
    list.innerHTML = '<div class="hodReportEmpty">Đang tải...</div>';
    // FIX_20260726: trước đây đọc thẳng client.from('edit_requests') của Supabase —
    // đường đó đã CHẾT (dữ liệu nằm ở Turso, Supabase chỉ còn dùng để auth) nên
    // danh sách luôn rỗng/lỗi. Dùng chung nguồn với chuông header: /api/my-edit-requests.
    let data = null;
    try {
      const res = await fetch('/api/my-edit-requests?ts=' + Date.now(), { cache: 'no-store' });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || !Array.isArray(out?.data)) throw new Error(out?.error || res.status);
      data = out.data;
    } catch (e) {
      console.warn('[reports] không tải được báo cáo:', e);
      list.innerHTML = '<div class="hodReportEmpty">Không tải được báo cáo.</div>';
      return;
    }
    if (!data || !data.length) {
      list.innerHTML = '<div class="hodReportEmpty">Bạn chưa gửi báo cáo nào.</div>';
      return;
    }
    list.innerHTML = data
      .map(
        r => `
      <div class="hodReportRow">
        <div class="hodReportRowTop">
          <b>Câu ${esc(r.question_num || '?')}</b>
          <span class="hodReportStatus ${statusClass(r.status)}">${esc(statusText(r.status))}</span>
        </div>
        <div class="hodReportTime">Gửi: ${esc(new Date(r.created_at).toLocaleString('vi-VN'))}</div>
        ${r.admin_note ? `<div class="hodReportNote">Ghi chú admin: ${esc(r.admin_note)}</div>` : ''}
      </div>`,
      )
      .join('');
  }

  async function openReportsTab() {
    ensureReportModal();
    $('hodAccountMenu')?.classList.add('hidden');
    $('hodReportModal')?.classList.remove('hidden');
    await loadReportModalList();
  }

  function boot() {
    ensureReportModal();
    ensureReportButton();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  setInterval(ensureReportButton, 700);
})();

// ===== MOBILE_FLASHCARD_NAVIGATION_20260702 (viết lại) =====
// Mobile: nút chuyển câu và vuốt trái/phải để đổi flashcard.
//
// Lý do viết lại: bản cũ trượt trực tiếp trên #card — nhưng #card mang class
// "dir-horizontal/dir-up/dir-down" + "flip" để lật thẻ bằng CSS:
//   #fc .card.dir-horizontal.flip{transform:rotateY(180deg) !important}
// Rule này có !important nên bất cứ khi nào thẻ đang ở trạng thái lật (đang xem
// đáp án), CSS đè hoàn toàn lên transform trượt (translateX) mà JS gán qua inline
// style — khiến thẻ không trượt đúng như tính toán, gây cảm giác "trượt sai hướng".
// Cách sửa: bọc #card trong 1 wrapper riêng (#cardSlideWrap) CHỈ lo việc trượt
// (translateX). #card bên trong vẫn tự lo việc lật (rotateY) như cũ, không đụng
// nhau nên không còn xung đột !important nữa.
(function () {
  function $(id) {
    return document.getElementById(id);
  }
  function goPrev() {
    if (typeof prev === 'function') prev();
  }
  function goNext() {
    if (typeof next === 'function') next();
  }
  const isMobile = () => window.matchMedia('(max-width:760px)').matches;

  // Bọc #card vào #cardSlideWrap 1 lần duy nhất, giữ nguyên #card và toàn bộ
  // logic lật/hiển thị đang có — chỉ thêm 1 lớp cha để xử lý trượt riêng.
  function ensureSlideWrap() {
    let wrap = $('cardSlideWrap');
    if (wrap) return wrap;
    const card = $('card');
    if (!card || !card.parentNode) return null;
    wrap = document.createElement('div');
    wrap.id = 'cardSlideWrap';
    wrap.style.cssText =
      'position:relative;width:100%;height:100%;display:flex;align-items:center;justify-content:center;min-height:0;flex:1;max-width:100%;margin:0 auto;';
    card.parentNode.insertBefore(wrap, card);
    wrap.appendChild(card);
    return wrap;
  }

  let __sliding = false;
  let __activeFinishSlide = null;
  // Trượt liền mạch: câu cũ (ghost) và câu mới (wrap) chạy song song cùng hướng.
  function slideChange(dir, isRepeat = false) {
    const zone = $('zone');
    // Chỉ bọc #card vào wrapper trên mobile — bọc trên desktop sẽ đổi #card từ flex item
    // trực tiếp của .zone thành con của 1 div thường, có thể làm lệch layout desktop.
    if (!zone) {
      dir === 'next' ? goNext() : goPrev();
      return;
    }
    const wrap = ensureSlideWrap();
    if (!wrap) {
      dir === 'next' ? goNext() : goPrev();
      return;
    }

    // Nếu đang trượt dở mà nhận thêm lệnh mới (ví dụ nhấp nhanh nhiều lần hoặc giữ phím),
    // kết thúc ngay slide trước để trả giao diện về vị trí chuẩn và tiến hành câu mới lập tức.
    if (__sliding && typeof __activeFinishSlide === 'function') {
      __activeFinishSlide();
    }

    // Khi giữ phím (isRepeat / e.repeat): chuyển câu trực tiếp không chạy animation trượt 220ms
    // để giao diện tua nhanh mượt mà ở tốc độ phím gõ (30-50ms/câu).
    if (isRepeat) {
      dir === 'next' ? goNext() : goPrev();
      return;
    }

    __sliding = true;
    window.__lhSuppressFlip = true;

    // Dọn các ghost cũ nếu còn sót lại trên DOM
    try {
      zone.querySelectorAll('.lhGhost').forEach(g => g.remove());
    } catch (e) {
      lhWarn('MOBILE_FLASHCARD_NAVIGATION_20260702', e);
    }

    const zr = zone.getBoundingClientRect();
    const r = wrap.getBoundingClientRect();
    // ghost = ảnh chụp câu cũ ngay tại vị trí đang thấy (kể cả khi đang kéo dở).
    // Clone nguyên wrap (gồm cả #card bên trong) nên giữ đúng trạng thái lật hiện tại.
    const ghost = wrap.cloneNode(true);
    ghost.removeAttribute('id');
    ghost.classList.add('lhGhost');
    ghost.style.cssText +=
      ';position:absolute;margin:0;pointer-events:none;z-index:6;left:' +
      (r.left - zr.left) +
      'px;top:' +
      (r.top - zr.top) +
      'px;width:' +
      r.width +
      'px;height:' +
      r.height +
      'px;transform:none;opacity:1;transition:none;';
    zone.appendChild(ghost);

    wrap.classList.remove('lhDragging');
    wrap.classList.add('lhSliding');
    wrap.style.transition = 'none';
    // Khi vào đây từ một cú vuốt, touchmove đã hạ opacity của wrap xuống thấp nhất .4
    // để tạo cảm giác thẻ mờ dần theo ngón tay. Phải trả lại 1 ngay tại đây, nếu không
    // câu MỚI trượt vào vẫn mang inline opacity cũ và bị tối đi vĩnh viễn.
    wrap.style.opacity = '1';
    dir === 'next' ? goNext() : goPrev(); // đổi nội dung #card bên trong wrap
    const fromX = dir === 'next' ? '100%' : '-100%'; // next: câu mới vào từ bên phải; prev: từ bên trái
    const toX = dir === 'next' ? '-100%' : '100%'; // câu cũ (ghost) ra cùng hướng vuốt
    wrap.style.transform = 'translateX(' + fromX + ')';

    let animFrame1 = null;
    let animFrame2 = null;
    let slideTimeout = null;
    let __slideDone = false;

    function finishSlide() {
      if (__slideDone) return;
      __slideDone = true;
      if (animFrame1) cancelAnimationFrame(animFrame1);
      if (animFrame2) cancelAnimationFrame(animFrame2);
      if (slideTimeout) clearTimeout(slideTimeout);
      wrap.removeEventListener('transitionend', finishSlide);
      ghost.remove();
      wrap.style.transition = '';
      wrap.style.transform = '';
      wrap.style.opacity = '';
      wrap.classList.remove('lhSliding');
      __sliding = false;
      window.__lhSuppressFlip = false;
      if (__activeFinishSlide === finishSlide) {
        __activeFinishSlide = null;
      }
    }

    __activeFinishSlide = finishSlide;

    // Double rAF: đảm bảo trình duyệt vẽ xong vị trí xuất phát ở 1 frame riêng
    // trước khi bắt đầu transition, tránh gộp frame/giật hình trên máy yếu.
    animFrame1 = requestAnimationFrame(() => {
      animFrame2 = requestAnimationFrame(() => {
        if (!__sliding || __slideDone) return;
        const ease = 'transform .22s cubic-bezier(.22,.61,.36,1)';
        wrap.style.transition = ease;
        ghost.style.transition = ease + ', opacity .22s ease';
        wrap.style.transform = 'translateX(0)'; // câu mới vào giữa
        ghost.style.transform = 'translateX(' + toX + ')'; // câu cũ ra
        ghost.style.opacity = '.35';
      });
    });

    wrap.addEventListener('transitionend', finishSlide);
    slideTimeout = setTimeout(finishSlide, 350);
  }

  // Bấm nhanh (tap): chuyển 1 câu có hiệu ứng trượt (slideChange).
  // Bấm giữ: sau 1 khoảng trễ ngắn, tự động chuyển câu liên tục (không hiệu ứng trượt,
  // để không bị dồn/giật animation) cho tới khi thả tay ra.
  function bindHoldRepeat(btn, dir) {
    if (!btn) return;
    const REPEAT_DELAY = 420; // chờ trước khi bắt đầu tua nhanh
    const REPEAT_INTERVAL = 130; // tốc độ tua khi giữ
    let startTimer = null,
      repeatTimer = null,
      repeated = false,
      touchActive = false;

    function stepOnce() {
      dir === 'next' ? goNext() : goPrev();
    }
    function clearTimers() {
      if (startTimer) {
        clearTimeout(startTimer);
        startTimer = null;
      }
      if (repeatTimer) {
        clearInterval(repeatTimer);
        repeatTimer = null;
      }
    }
    function startHold() {
      repeated = false;
      clearTimers();
      startTimer = setTimeout(() => {
        repeated = true;
        stepOnce();
        repeatTimer = setInterval(stepOnce, REPEAT_INTERVAL);
      }, REPEAT_DELAY);
    }
    function endHold() {
      clearTimers();
    }

    btn.addEventListener(
      'touchstart',
      e => {
        touchActive = true;
        e.stopPropagation();
        startHold();
      },
      { passive: true },
    );
    btn.addEventListener(
      'touchend',
      e => {
        e.stopPropagation();
        endHold();
        setTimeout(() => {
          touchActive = false;
        }, 400);
      },
      { passive: true },
    );
    btn.addEventListener(
      'touchcancel',
      e => {
        e.stopPropagation();
        endHold();
        setTimeout(() => {
          touchActive = false;
        }, 400);
      },
      { passive: true },
    );
    // mousedown/mouseup: phòng khi test bằng chuột trên desktop; touchActive chặn double-fire trên thiết bị vừa có touch vừa giả lập mouse.
    btn.addEventListener('mousedown', e => {
      if (touchActive) return;
      e.stopPropagation();
      startHold();
    });
    btn.addEventListener('mouseup', e => {
      if (touchActive) return;
      e.stopPropagation();
      endHold();
    });
    btn.addEventListener('mouseleave', () => {
      if (!touchActive) endHold();
    });
    btn.addEventListener('click', e => {
      e.stopPropagation();
      if (repeated) {
        repeated = false;
        return;
      } // đã tua rồi thì bỏ qua click cuối, tránh nhảy dư 1 câu
      slideChange(dir);
    });
  }

  function ensureMobileNav() {
    const zone = $('zone');
    if (!zone || $('mobileCardNav')) return;
    const nav = document.createElement('div');
    nav.id = 'mobileCardNav';
    nav.className = 'mobileCardNav';
    nav.innerHTML = `
      <button id="mobilePrev" type="button" aria-label="Câu trước"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg></button>
      <div class="mobileSwipeHint">Vuốt trái / phải để đổi câu</div>
      <button id="mobileNext" type="button" aria-label="Câu sau"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg></button>`;
    zone.appendChild(nav);
    try {
      if (localStorage.getItem('learninghub_swipe_hint_seen_v1') === '1') zone.classList.add('swiped');
    } catch (e) {
      lhWarn('MOBILE_FLASHCARD_NAVIGATION_20260702', e);
    }
    bindHoldRepeat($('mobilePrev'), 'prev');
    bindHoldRepeat($('mobileNext'), 'next');
  }

  // Kéo dính ngón realtime + búng/snap (giống Quizlet). Chỉ trên mobile.
  // Kéo trên wrap (không phải #card) để không đụng transform lật (rotateY) của #card.
  function bindDrag() {
    const zone = $('zone');
    if (!zone || zone.__mobileDragBound) return;
    zone.__mobileDragBound = true;
    let sx = 0,
      sy = 0,
      st = 0,
      dragging = false,
      decided = false,
      axis = null,
      moved = false;
    // true khi touch hiện tại bắt đầu trên nút/khu vực loại trừ (mobileCardNav, edit...).
    // Phải giữ nguyên trạng thái này xuyên suốt touchmove/touchend của CÙNG 1 lần chạm,
    // nếu không touchmove/touchend sẽ dùng sx/sy CŨ (của lần kéo trước đó) để tính khoảng
    // cách kéo, khiến việc giữ nút bị hiểu nhầm thành một cú vuốt và tự nhảy câu.
    let ignoreTouch = false;
    const W = () => zone.getBoundingClientRect().width || window.innerWidth || 360;
    function markSeen() {
      zone.classList.add('swiped');
      try {
        localStorage.setItem('learninghub_swipe_hint_seen_v1', '1');
      } catch (e) {
        lhWarn('MOBILE_FLASHCARD_NAVIGATION_20260702', e);
      }
    }

    zone.addEventListener(
      'touchstart',
      e => {
        const t = e.changedTouches && e.changedTouches[0];
        if (!t) return;
        ignoreTouch = !isMobile() || __sliding || !!e.target.closest('#cardTools, #editCard, .edit, .mobileCardNav');
        if (ignoreTouch) return;
        sx = t.clientX;
        sy = t.clientY;
        st = Date.now();
        dragging = false;
        decided = false;
        axis = null;
        moved = false;
      },
      { passive: true },
    );

    zone.addEventListener(
      'touchmove',
      e => {
        if (ignoreTouch || !isMobile() || __sliding) return;
        const t = e.changedTouches && e.changedTouches[0];
        if (!t) return;
        const dx = t.clientX - sx,
          dy = t.clientY - sy;
        if (!decided) {
          if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
          decided = true;
          axis = Math.abs(dx) > Math.abs(dy) * 1.2 ? 'x' : 'y'; // dọc -> để trình duyệt cuộn
          if (axis === 'x') {
            const w = ensureSlideWrap();
            if (w) {
              w.style.transition = 'none';
              w.classList.add('lhDragging');
            }
          }
        }
        if (dragging || axis === 'x') {
          dragging = true;
          e.preventDefault();
          if (Math.abs(dx) > 6) moved = true;
          const w = ensureSlideWrap();
          if (w) {
            w.style.transform = 'translateX(' + dx + 'px)';
            w.style.opacity = String(Math.max(0.4, 1 - Math.abs(dx) / (W() * 1.1)));
          }
        }
      },
      { passive: false },
    );

    function endDrag(e) {
      if (ignoreTouch || !dragging) return;
      dragging = false;
      const w = ensureSlideWrap();
      if (w) w.classList.remove('lhDragging');
      const t = e.changedTouches && e.changedTouches[0];
      const dx = t ? t.clientX - sx : 0;
      const dt = Date.now() - st;
      const commit = Math.abs(dx) > W() * 0.3 || (dt < 320 && Math.abs(dx) > 56);
      if (!w) return;
      if (commit) {
        markSeen();
        slideChange(dx < 0 ? 'next' : 'prev'); // ghost(câu cũ) + wrap(câu mới) chạy song song
      } else {
        // chưa đủ xa -> búng về chỗ cũ
        window.__lhSuppressFlip = moved;
        w.style.transition = 'transform .2s cubic-bezier(.22,.61,.36,1), opacity .2s ease';
        w.style.transform = 'translateX(0)';
        w.style.opacity = '1';
        setTimeout(() => {
          w.style.transition = '';
          w.style.transform = '';
          w.style.opacity = '';
          window.__lhSuppressFlip = false;
        }, 220);
      }
    }
    zone.addEventListener('touchend', endDrag, { passive: false });
    zone.addEventListener('touchcancel', endDrag, { passive: false });
    // Chặn lật thẻ nếu vừa kéo (tap mới được lật)
    zone.addEventListener(
      'click',
      e => {
        if (window.__lhSuppressFlip) {
          e.stopImmediatePropagation();
          e.preventDefault();
        }
      },
      true,
    );
  }

  function boot() {
    ensureSlideWrap();
    ensureMobileNav();
    bindHoldRepeat($('prev'), 'prev');
    bindHoldRepeat($('next'), 'next');
    bindHoldRepeat(document.querySelector('.arrow.left'), 'prev');
    bindHoldRepeat(document.querySelector('.arrow.right'), 'next');
    bindDrag();
  }
  window.slideChange = slideChange;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  setTimeout(boot, 300);
  setTimeout(boot, 1000);
})();

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
  const oldRenderCard = typeof renderCard === 'function' ? renderCard : null;
  if (oldRenderCard && !oldRenderCard.__keepAttrs) {
    renderCard = function () {
      normalizeAll();
      return oldRenderCard.apply(this, arguments);
    };
    renderCard.__keepAttrs = true;
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
(function () {
  if (window.__FIX_ADD_SUBJECT_FAST_PARALLEL_UPLOAD_20260701) return;
  window.__FIX_ADD_SUBJECT_FAST_PARALLEL_UPLOAD_20260701 = true;

  const $ = id => document.getElementById(id);
  const LARGE_LIMIT = 80;
  const CONCURRENCY = 8; // số câu gửi cùng lúc; đủ nhanh nhưng không ép server quá mạnh

  function user() {
    return window.HODSupabase?.getUser?.() || null;
  }
  function profile() {
    return window.HODSupabase?.getProfile?.() || null;
  }
  function canManage() {
    const role = String(profile()?.role || '').toLowerCase();
    return !!user() && (window.HODSupabase?.isAdmin?.() || role === 'admin' || role === 'editor');
  }
  function toast(msg) {
    try {
      if (typeof notify === 'function') notify(msg);
    } catch (e) {
      lhWarn('FIX_ADD_SUBJECT_FAST_PARALLEL_UPLOAD_20260701', e);
    }
  }
  function prog(title, current, total, detail) {
    try {
      if (typeof showProgress === 'function') showProgress(title, current, total, detail || '');
    } catch (e) {
      lhWarn('FIX_ADD_SUBJECT_FAST_PARALLEL_UPLOAD_20260701', e);
    }
  }
  function hideProg() {
    try {
      if (typeof hideProgress === 'function') hideProgress();
    } catch (e) {
      lhWarn('FIX_ADD_SUBJECT_FAST_PARALLEL_UPLOAD_20260701', e);
    }
  }

  function cleanQuestions(arr) {
    return (Array.isArray(arr) ? arr : [])
      .map((q, i) => {
        const opts = q && typeof q.options === 'object' && !Array.isArray(q.options) ? q.options : {};
        const answer = String(q?.answer || '')
          .toUpperCase()
          .replace(/[^A-Z]/g, '');
        const images = Array.isArray(q?.images) ? q.images : [];
        return {
          num: Number(q?.num) || i + 1,
          question: String(q?.question || '').trim(),
          options: opts,
          answer,
          answer_text:
            q?.answer_text ||
            answer
              .split('')
              .map(k => k + '. ' + (opts[k] || ''))
              .join('; '),
          images,
          has_image: !!(q?.has_image || images.length),
          error_risk: q?.error_risk || 'low',
          error_risk_reason: q?.error_risk_reason || null,
        };
      })
      .filter(q => q.question && q.answer && q.options);
  }

  function readQuestions() {
    let arr = window.__previewImportData || window.__LH_LAST_PREVIEW_IMPORT_DATA || [];
    if (!Array.isArray(arr) || !arr.length) {
      try {
        let s = String(
          $('userImportData')?.value || localStorage.getItem('learninghub_add_subject_file_data_v1') || '',
        ).trim();
        const m = s.match(/```json\s*([\s\S]*?)```/i) || s.match(/```\s*([\s\S]*?)```/);
        if (m) s = m[1].trim();
        const j = JSON.parse(s);
        arr = Array.isArray(j) ? j : Array.isArray(j?.questions) ? j.questions : [];
      } catch (e) {
        arr = [];
      }
    }
    return cleanQuestions(arr);
  }

  async function postAction(action, payload) {
    const res = await fetch('/api/admin-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({ user_id: user()?.id, action, payload }),
    });
    const out = await res.json().catch(() => ({}));
    if (!res.ok || out.error) throw new Error(out.error || 'HTTP ' + res.status);
    return out;
  }

  function cacheCount(code, count) {
    try {
      const key = 'learninghub_subject_counts_cache_v3';
      const store = JSON.parse(localStorage.getItem(key) || '{}') || {};
      store.counts = store.counts || {};
      store.confirmed = store.confirmed || {};
      store.counts[code] = count;
      store.confirmed[code] = true;
      store.updated_at = new Date().toISOString();
      localStorage.setItem(key, JSON.stringify(store));
      localStorage.setItem('learninghub_subjects_dirty_v3', String(Date.now()));
      localStorage.removeItem('learninghub_subjects_cache_v1');
      sessionStorage.removeItem('learninghub_subject_counts_cache_v1');
      window.clearLearningHubSupabaseCache?.('subjects');
      window.clearLearningHubSupabaseCache?.('questions');
      window.clearLearningHubQuestionCache?.();
    } catch (e) {
      lhWarn('FIX_ADD_SUBJECT_FAST_PARALLEL_UPLOAD_20260701', e);
    }
  }

  function clearState() {
    try {
      window.__previewImportData = [];
      window.__LH_LAST_PREVIEW_IMPORT_DATA = [];
      $('importPreviewModal')?.classList.add('hidden');
      [
        'learninghub_add_subject_file_name_v1',
        'learninghub_add_subject_file_size_v1',
        'learninghub_add_subject_file_data_v1',
        'learninghub_add_subject_file_previewed_v1',
      ].forEach(k => localStorage.removeItem(k));
    } catch (e) {
      lhWarn('FIX_ADD_SUBJECT_FAST_PARALLEL_UPLOAD_20260701', e);
    }
  }

  async function uploadOne(finalCode, q, i) {
    await postAction('add_question', {
      question_data: {
        subject_code: finalCode,
        num: Number(q.num) || i + 1,
        question: q.question,
        options: q.options || {},
        answer: q.answer,
        answer_text: q.answer_text || '',
        images: q.images || [],
        has_image: !!q.has_image,
        error_risk: q.error_risk || 'low',
        error_risk_reason: q.error_risk_reason || null,
        updated_at: new Date().toISOString(),
      },
    });
  }

  async function uploadParallel(finalCode, questions) {
    let done = 0;
    let next = 0;
    const total = questions.length;
    const errors = [];
    prog('Đang upload câu hỏi...', 0, total, 'Upload nhanh: gửi ' + CONCURRENCY + ' câu cùng lúc');

    async function worker() {
      while (next < total && !errors.length) {
        const i = next++;
        try {
          await uploadOne(finalCode, questions[i], i);
        } catch (e) {
          errors.push('Câu ' + (questions[i].num || i + 1) + ': ' + (e?.message || e));
          break;
        }
        done++;
        prog('Đang upload câu hỏi...', done, total, 'Đã gửi ' + done + '/' + total + ' câu');
      }
    }

    const workers = Array.from({ length: Math.min(CONCURRENCY, total) }, () => worker());
    await Promise.all(workers);
    if (errors.length) throw new Error(errors[0]);
    return done;
  }

  async function createLarge(code, name, desc, questions) {
    prog('Đang tạo môn học...', 0, questions.length, 'Tạo môn trước, rồi upload nhiều câu song song...');
    const created = await postAction('add_subject', {
      code,
      name: name || code,
      description: desc || '',
      questions: [],
    });
    const finalCode = created.code || created.subject_code || code;
    const success = await uploadParallel(finalCode, questions);
    cacheCount(finalCode, success);
    return { finalCode, success };
  }

  async function createSmall(code, name, desc, questions) {
    prog('Đang lưu môn học...', 0, 100, 'Đang tạo môn và nhập câu hỏi...');
    const out = await postAction('add_subject', { code, name: name || code, description: desc || '', questions });
    const finalCode = out.code || out.subject_code || code;
    cacheCount(finalCode, questions.length);
    prog('Đang lưu môn học...', 100, 100, 'Hoàn tất');
    return { finalCode, success: questions.length };
  }

  window.__submitSubjectRequest = async function () {
    const code = ($('addSubjectCode')?.value || '').trim().toUpperCase();
    const name = ($('addSubjectName')?.value || '').trim();
    const desc = ($('addSubjectDesc')?.value || '').trim();
    const questions = readQuestions();

    if (!code) {
      alert('Vui lòng nhập mã môn');
      $('addSubjectCode')?.focus();
      return;
    }
    if (!/^[A-Z0-9_]{2,20}$/.test(code)) {
      alert('Mã môn chỉ gồm chữ, số, gạch dưới (2-20 ký tự)');
      $('addSubjectCode')?.focus();
      return;
    }
    if (!name) {
      alert('Vui lòng nhập tên môn');
      $('addSubjectName')?.focus();
      return;
    }
    if (!questions.length) {
      alert('Bạn cần chọn file và bấm Xem trước trước khi lưu môn học.');
      return;
    }
    if (!user()) {
      alert('Bạn cần đăng nhập trước khi lưu môn học.');
      return;
    }

    const btn = $('userImportBtn');
    const old = btn ? btn.textContent : '';
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Đang lưu...';
    }

    try {
      if (window.LHSubjectImport?.prepareZipQuestionsBeforeSave) {
        await window.LHSubjectImport.prepareZipQuestionsBeforeSave(questions, (done, total, text) => {
          prog('Đang upload ảnh Cloudinary...', done, total, text);
        });
      }

      if (canManage()) {
        const rs =
          questions.length > LARGE_LIMIT
            ? await createLarge(code, name, desc, questions)
            : await createSmall(code, name, desc, questions);
        const ok = 'Đã thêm môn ' + rs.finalCode + ' với ' + rs.success + ' câu hỏi';
        prog('Hoàn tất upload', rs.success, rs.success, ok);
        alert(ok);
        toast(ok);
        clearState();
        window.__switchSubjectGateTab?.('list');
        try {
          $('subjectRefresh')?.click();
          setTimeout(() => $('subjectRefresh')?.click(), 5600);
          setTimeout(() => window.refreshSubjectCountsOnce?.(), 6500);
        } catch (e) {
          lhWarn('FIX_ADD_SUBJECT_FAST_PARALLEL_UPLOAD_20260701', e);
        }
      } else {
        prog('Đang gửi yêu cầu tạo môn học...', 0, 100, 'Đang tải dữ liệu câu hỏi...');
        await postAction('add_subject_request', { code, name, description: desc || '', questions_data: questions });
        prog('Hoàn tất', 100, 100, 'Đã gửi yêu cầu');
        const ok = 'Đã gửi yêu cầu thêm môn ' + code + '. Vui lòng chờ admin duyệt.';
        alert(ok);
        toast(ok);
        clearState();
        window.__switchSubjectGateTab?.('list');
      }
    } catch (e) {
      console.warn('Fast add subject upload error:', e);
      alert('Lỗi tạo môn: ' + (e?.message || e));
      toast('Lỗi tạo môn');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = old || 'Lưu Môn Học';
      }
      setTimeout(hideProg, 450);
    }
  };
})();
// ===== END FIX_ADD_SUBJECT_FAST_PARALLEL_UPLOAD_20260701 =====

// ===== LH_UNIFIED_FETCH_AND_ACCESS_20260726 =====
installUnifiedFetchAndAccess();
// ===== END LH_UNIFIED_FETCH_AND_ACCESS_20260726 =====

// ===== BOOKMARK_QUESTIONS_FEATURE_20260726 =====
// Tính năng lưu câu hỏi (🔖 Bookmark Ribbon SVG): lưu câu hỏi yêu thích từ flashcard, xem lại ở Thư viện.
(function () {
  const BOOKMARK_PREFIX = 'lh_starred_v1_';

  const SVG_UNSAVED = `<svg class="bmIcon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>`;
  const SVG_SAVED = `<svg class="bmIcon" width="18" height="18" viewBox="0 0 24 24" fill="#f5c518" stroke="#f5c518" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>`;

  const SVG_LIB_UNSAVED = `<svg class="bmLibIcon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>`;
  const SVG_LIB_SAVED = `<svg class="bmLibIcon" width="14" height="14" viewBox="0 0 24 24" fill="#f5c518" stroke="#f5c518" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>`;

  function getSubjectCode() {
    if (
      typeof LHState.RAW !== 'undefined' &&
      Array.isArray(LHState.RAW) &&
      LHState.RAW[0] &&
      LHState.RAW[0].subject_code
    ) {
      return String(LHState.RAW[0].subject_code).trim();
    }
    return localStorage.getItem('learninghub_subject_code_merged_v1') || 'default_subject';
  }

  function bookmarkKey() {
    return BOOKMARK_PREFIX + getSubjectCode();
  }

  // Định danh nhất quán cho từng câu hỏi (ưu tiên num, fallback id)
  function getQKey(q) {
    if (!q) return null;
    if (typeof q === 'string' || typeof q === 'number') return 'num_' + String(q);
    if (q.num !== undefined && q.num !== null && q.num !== '') return 'num_' + String(q.num);
    if (q.id !== undefined && q.id !== null && q.id !== '') return 'id_' + String(q.id);
    if (q.question) return 'q_' + String(q.question).trim().slice(0, 50);
    return null;
  }

  function loadBookmarks() {
    try {
      const primaryKey = bookmarkKey();
      const primaryArr = JSON.parse(localStorage.getItem(primaryKey) || '[]');
      const backupArr = JSON.parse(localStorage.getItem('lh_starred_v1_backup_all') || '[]');
      const merged = new Set(
        [...(Array.isArray(primaryArr) ? primaryArr : []), ...(Array.isArray(backupArr) ? backupArr : [])].map(x =>
          String(x),
        ),
      );
      return merged;
    } catch (e) {
      return new Set();
    }
  }

  function saveBookmarks(set) {
    try {
      const arr = [...set].map(x => String(x));
      localStorage.setItem(bookmarkKey(), JSON.stringify(arr));
      localStorage.setItem('lh_starred_v1_backup_all', JSON.stringify(arr));
    } catch (e) {
      lhWarn('BOOKMARK_QUESTIONS_FEATURE_20260726', e);
    }
  }

  function isBookmarked(qOrKey) {
    if (!qOrKey) return false;
    const key = typeof qOrKey === 'object' ? getQKey(qOrKey) : String(qOrKey);
    if (!key) return false;
    return loadBookmarks().has(key);
  }

  function toggleBookmarkFn(qOrKey) {
    if (!qOrKey) return false;
    const key = typeof qOrKey === 'object' ? getQKey(qOrKey) : String(qOrKey);
    if (!key) return false;
    const s = loadBookmarks();
    let added;
    if (s.has(key)) {
      s.delete(key);
      added = false;
    } else {
      s.add(key);
      added = true;
    }
    saveBookmarks(s);
    return added;
  }

  function countBookmarks() {
    return loadBookmarks().size;
  }

  // Gắn helpers ra window để Thư viện gọi trực tiếp trong template
  window.__isBookmarked = isBookmarked;
  window.__countBookmarks = countBookmarks;
  window.__getBookmarkBtnHTML = function (q) {
    const key = getQKey(q);
    if (!key) return '';
    const bookmarked = isBookmarked(key);
    const esc2 = s =>
      String(s ?? '').replace(
        /[&<>"']/g,
        c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
      );
    return `<button type="button" class="libBookmarkBtn${bookmarked ? ' bookmarked' : ''}" data-lib-bookmark="${esc2(key)}" title="${bookmarked ? 'Bỏ lưu câu này' : 'Lưu câu hỏi này'}">${bookmarked ? SVG_LIB_SAVED : SVG_LIB_UNSAVED}</button>`;
  };

  // ── CSS inject ────────────────────────────────────────────────────────────
  (function injectBookmarkCSS() {
    if (document.getElementById('__bookmarkQCSS')) return;
    const s = document.createElement('style');
    s.id = '__bookmarkQCSS';
    s.textContent = `
      #bookmarkBtn {
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px 6px;
        border-radius: 8px;
        color: rgba(232,212,168,.65);
        transition: color .18s, transform .15s, filter .18s;
        user-select: none;
        display: flex; align-items: center; justify-content: center;
      }
      #bookmarkBtn .bmIcon { transition: stroke .18s, fill .18s, transform .15s; }
      #bookmarkBtn.bookmarked {
        color: #f5c518;
        filter: drop-shadow(0 0 7px rgba(245,197,24,.65));
      }
      #bookmarkBtn:hover { transform: scale(1.18); color: #f5c518; }
      #bookmarkBtn:active { transform: scale(.9); }
      @keyframes bookmarkPop {
        0%   { transform: scale(1); }
        40%  { transform: scale(1.42); }
        70%  { transform: scale(.88); }
        100% { transform: scale(1); }
      }
      #bookmarkBtn.pop { animation: bookmarkPop .32s ease; }

      .libBookmarkBtn {
        background: rgba(255,255,255,.03);
        border: 1px solid rgba(200,169,110,.25);
        border-radius: 7px;
        cursor: pointer;
        font-size: .82rem;
        padding: 4px 9px;
        color: rgba(232,212,168,.75);
        display: inline-flex; align-items: center; gap: 4px;
        transition: color .15s, border-color .15s, background .15s, transform .12s;
        line-height: 1;
        white-space: nowrap;
      }
      .libBookmarkBtn.bookmarked {
        color: #f5c518;
        border-color: rgba(245,197,24,.55);
        background: rgba(245,197,24,.09);
      }
      .libBookmarkBtn:hover { transform: scale(1.06); color: #f5c518; border-color: rgba(245,197,24,.5); }

      .v7FilterBtn[data-library-filter="starred"] .bookmarkCount {
        font-size: .75em;
        opacity: .88;
        margin-left: 4px;
      }
    `;
    document.head.appendChild(s);
  })();

  // ── Flashcard: lấy chính xác câu hiện tại ─────────────────────────────────
  function getCurrentCard() {
    try {
      const arr =
        typeof LHState.pool !== 'undefined' && Array.isArray(LHState.pool) && LHState.pool.length
          ? LHState.pool
          : typeof LHState.RAW !== 'undefined'
            ? LHState.RAW
            : [];
      if (!arr.length) return null;
      const index = Math.max(0, Math.min(typeof LHState.ci === 'number' ? LHState.ci : 0, arr.length - 1));
      return arr[index] || null;
    } catch (e) {
      return null;
    }
  }

  function updateBookmarkBtn() {
    const btn = document.getElementById('bookmarkBtn');
    if (!btn) return;
    const card = getCurrentCard();
    if (!card) return;
    const key = getQKey(card);
    if (!key) return;
    const bookmarked = isBookmarked(key);
    btn.classList.toggle('bookmarked', bookmarked);
    btn.innerHTML = bookmarked ? SVG_SAVED : SVG_UNSAVED;
    btn.title = bookmarked ? 'Bỏ lưu câu này' : 'Lưu câu hỏi này';
  }
  window.updateBookmarkBtn = updateBookmarkBtn;

  function addBookmarkButtonToCard() {
    if (document.getElementById('bookmarkBtn')) {
      updateBookmarkBtn();
      return;
    }
    const cardTools = document.getElementById('cardTools');
    if (!cardTools) return;
    const btn = document.createElement('button');
    btn.id = 'bookmarkBtn';
    btn.type = 'button';
    btn.className = 'cardToolBtn';
    btn.innerHTML = SVG_UNSAVED;
    btn.title = 'Lưu câu hỏi này';
    btn.setAttribute('aria-label', 'Lưu câu hỏi yêu thích');
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      const card = getCurrentCard();
      if (!card) return;
      const key = getQKey(card);
      if (!key) return;
      const added = toggleBookmarkFn(key);
      btn.classList.toggle('bookmarked', added);
      btn.innerHTML = added ? SVG_SAVED : SVG_UNSAVED;
      btn.title = added ? 'Bỏ lưu câu này' : 'Lưu câu hỏi này';
      btn.classList.remove('pop');
      void btn.offsetWidth;
      btn.classList.add('pop');
      btn.addEventListener('animationend', () => btn.classList.remove('pop'), { once: true });
      const displayNum = card.num || (typeof LHState.ci === 'number' ? LHState.ci : 0) + 1;
      try {
        notify(added ? `🔖 Đã lưu câu ${displayNum}` : `Đã bỏ lưu câu ${displayNum}`);
      } catch (err) {
        lhWarn('BOOKMARK_QUESTIONS_FEATURE_20260726', err);
      }
      // Nếu thư viện đang hiển thị thì render lại thư viện
      if (typeof window.renderStudy === 'function') window.renderStudy();
    });
    cardTools.appendChild(btn);
    updateBookmarkBtn();
  }

  const _origUpdateCardTools = typeof updateCardTools === 'function' ? updateCardTools : null;
  window.updateCardTools = function () {
    if (_origUpdateCardTools) _origUpdateCardTools.apply(this, arguments);
    updateBookmarkBtn();
  };

  // ── Thư viện: Event listener cho nút Bookmark trên Card ───────────────────
  function bindLibraryClickEvents() {
    document.addEventListener(
      'click',
      function (e) {
        const btn = e.target.closest('[data-lib-bookmark]');
        if (!btn) return;
        e.stopPropagation();
        const key = btn.dataset.libBookmark;
        if (!key) return;
        const added = toggleBookmarkFn(key);
        btn.classList.toggle('bookmarked', added);
        btn.innerHTML = added ? SVG_LIB_SAVED : SVG_LIB_UNSAVED;
        btn.title = added ? 'Bỏ lưu' : 'Lưu câu này';
        btn.classList.remove('pop');
        void btn.offsetWidth;
        btn.classList.add('pop');
        btn.addEventListener('animationend', () => btn.classList.remove('pop'), { once: true });
        try {
          notify(added ? `🔖 Đã lưu câu hỏi` : `Đã bỏ lưu câu hỏi`);
        } catch (ex) {
          lhWarn('BOOKMARK_QUESTIONS_FEATURE_20260726', ex);
        }

        // Re-render thư viện để cập nhật danh sách và số đếm bộ lọc
        if (typeof window.renderStudy === 'function') window.renderStudy();
        updateBookmarkBtn();
      },
      false,
    );
  }

  function init() {
    addBookmarkButtonToCard();
    bindLibraryClickEvents();
    if (typeof renderUnified === 'function') {
      try {
        renderUnified();
      } catch (e) {
        lhWarn('BOOKMARK_QUESTIONS_FEATURE_20260726', e);
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 100));
  } else {
    setTimeout(init, 100);
  }

  window.addEventListener('lh:subject-changed', () => {
    setTimeout(updateBookmarkBtn, 100);
    if (typeof renderUnified === 'function') {
      try {
        renderUnified();
      } catch (e) {
        lhWarn('BOOKMARK_QUESTIONS_FEATURE_20260726', e);
      }
    } else if (typeof window.renderStudy === 'function') {
      try {
        window.renderStudy();
      } catch (e) {
        lhWarn('BOOKMARK_QUESTIONS_FEATURE_20260726', e);
      }
    }
  });
})();
// ===== BOOKMARK_QUESTIONS_FEATURE_20260726 END =====

// ===== HEADER_EDIT_REQUEST_BELL_20260726 =====
// Chuông thông báo yêu cầu sửa câu hỏi.
//
// Vị trí: NGOÀI header (.globalTop .actions), nằm bên trái nút "Đổi môn" ->
// thứ tự trên thanh trên cùng là: [chuông] [Đổi môn] [Cài đặt] [Avatar].
// Nút và modal đã có sẵn trong index.html (#hodEditRequestBell,
// #hodEditRequestModal) cùng CSS cho .globalTop, nhưng trước đây không có JS nào
// gắn vào nên nút nằm im trong menu tài khoản và không bấm được.
//
// Điện thoại: KHÔNG xử lý ở JS. app.css đã có
//   @media (max-width:760px){ .globalTop #hodEditRequestBell{display:none!important} }
// nên chuông tự ẩn trên mobile (báo cáo vẫn xem được qua menu tài khoản ->
// "Báo cáo đã gửi"). Đừng thêm inline style.display cho nút này, vì inline
// (không !important) sẽ thua rule !important trong CSS và ngược lại setProperty
// important sẽ đè luôn media query mobile.
//
// Dữ liệu: GET /api/my-edit-requests (Turso). Supabase chỉ dùng để auth, token
// do lớp patch fetch tự gắn Authorization - xem LH_FETCH_AUTH ở dưới file.
(function () {
  const SEEN_KEY = 'lh_edit_request_seen_v1';
  const POLL_MS = 60000;
  const MIN_GAP_MS = 15000;

  const $ = id => document.getElementById(id);
  const esc = s =>
    String(s ?? '').replace(
      /[&<>"']/g,
      c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );
  const user = () => window.HODSupabase?.getUser?.() || null;

  let bell = null; // giữ tham chiếu vì khi đăng xuất ta tháo nút khỏi DOM
  let items = [];
  let staffPendingItems = []; // yêu cầu của học sinh chờ admin duyệt
  let loading = false;
  let inflight = null; // promise của lần gọi API đang chạy (chống gọi trùng)
  let lastFetch = 0; // mốc lần GỌI gần nhất (kể cả lỗi) để không spam API
  let loadedOk = false; // đã từng lấy được danh sách -> phân biệt rỗng vs lỗi
  let watchedUser = null; // id user đang theo dõi, đổi user thì nạp lại từ đầu

  function isStaff() {
    const role = String(window.HODSupabase?.getProfile?.()?.role || '').toLowerCase();
    return !!user() && (window.HODSupabase?.isAdmin?.() || role === 'admin' || role === 'editor');
  }

  function actionsBar() {
    return (
      document.querySelector('.globalTop .actions') ||
      document.querySelector('#fc .actions') ||
      document.querySelector('.actions')
    );
  }

  function readSeen() {
    try {
      return JSON.parse(localStorage.getItem(SEEN_KEY) || '{}') || {};
    } catch (e) {
      return {};
    }
  }
  function writeSeen(map) {
    try {
      localStorage.setItem(SEEN_KEY, JSON.stringify(map));
    } catch (e) {
      lhWarn('HEADER_EDIT_REQUEST_BELL_20260726', e);
    }
  }
  // Mốc "đã xem" theo trạng thái + thời điểm duyệt: admin duyệt lại lần nữa thì
  // lại tính là thông báo mới.
  function stampOf(r) {
    return String(r.status || '') + '|' + String(r.reviewed_at || r.created_at || '');
  }
  function isFresh(r, seen) {
    if (String(r.status || 'pending') === 'pending') return false;
    return seen[String(r.id)] !== stampOf(r);
  }

  function statusText(s) {
    return { pending: 'Đang chờ', approved: 'Đã duyệt', rejected: 'Từ chối' }[s] || s || 'Không rõ';
  }
  function statusClass(s) {
    return s === 'approved' ? 'approved' : s === 'rejected' ? 'rejected' : 'pending';
  }
  function timeText(v) {
    if (!v) return '';
    const d = new Date(v);
    return isNaN(d.getTime()) ? String(v) : d.toLocaleString('vi-VN');
  }

  // Đưa chuông ra thanh header, ngay trước nút Đổi môn / Cài đặt.
  function mount() {
    if (!bell) bell = $('hodEditRequestBell');
    if (!bell) return;
    if (!user()) {
      if (bell.isConnected) bell.remove();
      return;
    }
    const actions = actionsBar();
    if (!actions) return;
    const anchor = $('subjectTopChip') || $('openSettings');
    if (anchor && anchor.parentNode === actions) {
      if (anchor.previousElementSibling !== bell) actions.insertBefore(bell, anchor);
    } else if (bell.parentNode !== actions) {
      actions.prepend(bell);
    }
  }

  function paint() {
    if (!bell || !bell.isConnected) return;
    const seen = readSeen();
    const myFreshCount = items.filter(r => isFresh(r, seen)).length;
    const staffPendingCount = isStaff() ? staffPendingItems.length : 0;
    const totalNew = myFreshCount + staffPendingCount;

    const badge = $('hodEditRequestBadge');
    if (badge) {
      badge.textContent = totalNew > 9 ? '9+' : String(totalNew);
      badge.classList.toggle('hidden', totalNew === 0);
    }
    bell.classList.toggle('hasNewRequest', totalNew > 0);

    let titleText = 'Thông báo yêu cầu sửa câu hỏi';
    if (staffPendingCount > 0 && myFreshCount > 0) {
      titleText = `${staffPendingCount} yêu cầu học sinh chờ duyệt & ${myFreshCount} phản hồi mới`;
    } else if (staffPendingCount > 0) {
      titleText = `${staffPendingCount} yêu cầu sửa từ học sinh đang chờ duyệt`;
    } else if (myFreshCount > 0) {
      titleText = `${myFreshCount} yêu cầu sửa vừa có phản hồi`;
    }
    bell.title = titleText;
  }

  function isModalOpen() {
    return !!$('hodEditRequestModal') && !$('hodEditRequestModal').classList.contains('hidden');
  }

  function fetchNow() {
    loading = true;
    return (async () => {
      try {
        const promises = [
          fetch('/api/my-edit-requests?ts=' + Date.now(), { cache: 'no-store' })
            .then(res => (res.ok ? res.json() : {}))
            .catch(() => ({})),
        ];
        if (isStaff()) {
          promises.push(
            fetch('/api/staff-edit-requests?ts=' + Date.now(), { cache: 'no-store' })
              .then(res => (res.ok ? res.json() : {}))
              .catch(() => ({})),
          );
        }
        const [myOut, staffOut] = await Promise.all(promises);
        if (Array.isArray(myOut?.data)) {
          items = myOut.data;
          loadedOk = true;
        }
        if (staffOut && Array.isArray(staffOut?.data)) {
          staffPendingItems = staffOut.data;
        } else if (!isStaff()) {
          staffPendingItems = [];
        }
      } catch (e) {
        console.warn('[bell] không tải được yêu cầu sửa:', e);
      } finally {
        loading = false;
        inflight = null;
        paint();
        // Modal đang mở thì vẽ lại: nếu chỉ paint() thì danh sách treo ở "Đang tải...".
        if (isModalOpen()) renderList();
      }
    })();
  }

  // Trả về promise của lần gọi ĐANG chạy để openModal await đúng lần đó, thay vì
  // thoát sớm rồi render lúc dữ liệu chưa về.
  function load(force) {
    if (!user()) {
      items = [];
      staffPendingItems = [];
      return Promise.resolve();
    }
    if (inflight) return inflight;
    if (!force && Date.now() - lastFetch < MIN_GAP_MS) return Promise.resolve();
    lastFetch = Date.now();
    inflight = fetchNow();
    return inflight;
  }

  window.jumpToQuestionInLibrary = function (num, subjectCode) {
    closeModal();

    // 1. Reset bộ lọc thư viện về "Tất cả" (all)
    try {
      localStorage.setItem('learninghub_library_filter_v1', 'all');
    } catch (e) {
      lhWarn('HEADER_EDIT_REQUEST_BELL_20260726', e);
    }

    // 2. Tự động chuyển sang môn học tương ứng nếu câu hỏi thuộc môn khác
    const targetSubject = String(subjectCode || '').trim();
    const currentSubject = (localStorage.getItem('learninghub_subject_code_merged_v1') || '').trim();
    let needReloadSubject = false;

    if (targetSubject && targetSubject !== currentSubject) {
      try {
        localStorage.setItem('learninghub_subject_code_merged_v1', targetSubject);
        needReloadSubject = true;
        if ($('subjectInlineText')) $('subjectInlineText').textContent = targetSubject;
        if ($('hodAccountSubjectText')) $('hodAccountSubjectText').textContent = targetSubject;
      } catch (e) {
        lhWarn('HEADER_EDIT_REQUEST_BELL_20260726', e);
      }
    }

    // 3. Chuyển tab sang Thư viện (study)
    const tabBtn = document.querySelector('.tab[data-tab="study"]');
    if (typeof switchTab === 'function') {
      switchTab('study', tabBtn);
    } else if (tabBtn) {
      tabBtn.click();
    }

    // 4. Nếu đổi môn, gọi nạp lại dữ liệu môn mới
    if (needReloadSubject) {
      if (typeof window.loadCurrentSubjectOnly === 'function') {
        window.loadCurrentSubjectOnly(true);
      } else if (typeof window.loadSubjectLight === 'function') {
        window.loadSubjectLight(true);
      }
    }

    // 5. Điền mã câu vào ô tìm kiếm (#num)
    const searchInput = document.getElementById('search') || document.getElementById('studySearch');
    if (searchInput) {
      searchInput.value = '#' + num;
      try {
        localStorage.setItem('learninghub_library_search_v1', '#' + num);
      } catch (e) {
        lhWarn('OPEN_QUESTION_LOCALLY_LOCALSTORAGE_SAVE', e);
      }
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      searchInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // 6. Vẽ lại giao diện Thư viện & cuộn tới câu hỏi
    if (typeof window.renderStudy === 'function') {
      try {
        window.renderStudy();
      } catch (e) {
        lhWarn('HEADER_EDIT_REQUEST_BELL_20260726', e);
      }
    }
    setTimeout(() => {
      const list = document.getElementById('studyList') || document.getElementById('study');
      if (list) list.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  };

  function renderList() {
    const box = $('hodEditRequestList');
    if (!box) return;
    if (!user()) {
      box.innerHTML = '<div class="hodReportEmpty">Đăng nhập để xem thông báo.</div>';
      return;
    }

    let staffHtml = '';
    if (isStaff()) {
      if (staffPendingItems.length > 0) {
        staffHtml = `
        <div class="hodStaffPendingBlock" style="margin-bottom: 14px; padding: 12px 14px; background: rgba(200, 169, 110, 0.08); border: 1px solid rgba(200, 169, 110, 0.35); border-radius: 14px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <strong style="color:var(--gold2, #e8d4a8); font-size:13px; display:flex; align-items:center; gap:6px; font-weight:700;">
              <span>📌</span> Có ${staffPendingItems.length} yêu cầu từ học sinh chờ duyệt
            </strong>
            <a href="admin.html?tab=requests" target="_blank" style="font-size:12px; font-weight:700; color:#111111; text-decoration:none; background:linear-gradient(135deg, #c8a96e, #e8d4a8); padding:5px 12px; border-radius:8px; border:none; display:inline-flex; align-items:center; gap:3px; box-shadow:0 2px 8px rgba(200, 169, 110, 0.3);">
              Duyệt ngay ↗
            </a>
          </div>
          ${staffPendingItems
            .slice(0, 3)
            .map(r => {
              const n = r.question_num || r.new_data?.num || '?';
              const sc = r.subject_code || r.new_data?.subject_code || '';
              return `
            <div style="font-size:12px; color:#e2d8c3; margin-top:6px; padding-top:6px; border-top:1px dashed rgba(200, 169, 110, 0.2); line-height:1.45; display:flex; justify-content:space-between; align-items:center; gap:8px;">
              <div>
                <b style="color:#ffffff;">Câu ${esc(n)}</b> (${esc(sc)}) - <span style="color:var(--gold2, #e8d4a8); font-weight:500;">${esc(r.user_email || 'Học sinh')}</span>: <span style="color:#c8bba6; font-style:italic;">"${esc(r.reason || 'Đề xuất sửa câu hỏi')}"</span>
              </div>
              ${n !== '?' ? `<button type="button" onclick="window.jumpToQuestionInLibrary('${esc(n)}', '${esc(sc)}')" style="font-size:11px; font-weight:600; padding:2px 8px; border-radius:6px; background:rgba(200, 169, 110, 0.15); border:1px solid rgba(200, 169, 110, 0.3); color:var(--gold2, #e8d4a8); cursor:pointer; white-space:nowrap;">Tra câu ↗</button>` : ''}
            </div>`;
            })
            .join('')}
          ${staffPendingItems.length > 3 ? `<div style="font-size:11px; color:#c8bba6; margin-top:6px; font-style:italic;">...và ${staffPendingItems.length - 3} yêu cầu khác</div>` : ''}
        </div>`;
      } else {
        staffHtml = `
        <div class="hodStaffPendingBlock" style="margin-bottom: 12px; padding: 10px 14px; background: rgba(114, 197, 140, 0.08); border: 1px solid rgba(114, 197, 140, 0.25); border-radius: 12px; font-size:12px; display:flex; justify-content:space-between; align-items:center;">
          <span style="color:#9ee5b2; font-weight:600; display:flex; align-items:center; gap:6px;">✓ Không có yêu cầu học sinh nào đang chờ duyệt</span>
          <a href="admin.html?tab=requests" target="_blank" style="color:var(--gold2, #e8d4a8); font-weight:700; text-decoration:none;">Trang Admin ↗</a>
        </div>`;
      }
    }

    if (!items.length) {
      // Phân biệt "chưa gửi gì" với "gọi API lỗi" để không báo sai cho người học.
      const emptyMsg = loading
        ? '<div class="hodReportEmpty">Đang tải...</div>'
        : loadedOk
          ? '<div class="hodReportEmpty">Bạn chưa gửi yêu cầu sửa nào.</div>'
          : '<div class="hodReportEmpty">Không tải được thông báo. Thử lại sau.</div>';
      box.innerHTML = staffHtml + emptyMsg;
      return;
    }
    const seen = readSeen();
    const myItemsHtml = items
      .map(r => {
        const fresh = isFresh(r, seen);
        const num = r.question_num || r.new_data?.num || '?';
        const code = r.subject_code || r.new_data?.subject_code || '';
        return `
      <div class="hodEditRequestItem${fresh ? ' is-new' : ''}">
        <div class="hodEditRequestHead">
          <b>Câu ${esc(num)}${code ? ' · ' + esc(code) : ''}</b>
          <span class="hodEditRequestStatus ${statusClass(r.status)}">${esc(statusText(r.status))}</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px; gap:8px;">
          <p class="hodEditRequestMeta" style="margin:0;">Gửi: ${esc(timeText(r.created_at))}${r.reviewed_at ? ' · Phản hồi: ' + esc(timeText(r.reviewed_at)) : ''}</p>
          ${
            num !== '?'
              ? `
          <button type="button" class="hodJumpStudyBtn" data-num="${esc(num)}" data-subject="${esc(code)}" style="font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 6px; background: rgba(200, 169, 110, 0.15); border: 1px solid rgba(200, 169, 110, 0.35); color: var(--gold2, #e8d4a8); cursor: pointer; display: inline-flex; align-items: center; gap: 3px; white-space: nowrap; flex-shrink: 0;">
            🔍 Tra câu ↗
          </button>`
              : ''
          }
        </div>
        ${r.admin_note ? `<p class="hodEditRequestNote" style="margin-top:4px;">Ghi chú admin: ${esc(r.admin_note)}</p>` : ''}
        ${fresh ? '<span class="hodEditRequestNew">Mới</span>' : ''}
      </div>`;
      })
      .join('');

    box.innerHTML = staffHtml + myItemsHtml;
  }

  // Mở modal = đã đọc: xoá badge nhưng vẫn giữ nhãn "Mới" của lần mở này.
  function markAllSeen() {
    const seen = readSeen();
    items.forEach(r => {
      if (String(r.status || 'pending') !== 'pending') seen[String(r.id)] = stampOf(r);
    });
    writeSeen(seen);
  }

  function closeModal() {
    $('hodEditRequestModal')?.classList.add('hidden');
  }

  async function openModal() {
    const modal = $('hodEditRequestModal');
    if (!modal) return;
    $('hodAccountMenu')?.classList.add('hidden');
    modal.classList.remove('hidden');
    renderList();
    await load(true);
    renderList();
    markAllSeen();
    paint();
  }

  function bind() {
    if (!bell) bell = $('hodEditRequestBell');
    if (bell && !bell.__lhBellBound) {
      bell.__lhBellBound = true;
      bell.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        openModal();
      });
    }
    const closeBtn = $('hodEditRequestClose');
    if (closeBtn && !closeBtn.__lhBellBound) {
      closeBtn.__lhBellBound = true;
      closeBtn.addEventListener('click', closeModal);
    }
    const modal = $('hodEditRequestModal');
    if (modal && !modal.__lhBellBound) {
      modal.__lhBellBound = true;
      modal.addEventListener('mousedown', e => {
        if (e.target === modal) closeModal();
      });
    }
    const listEl = $('hodEditRequestList');
    if (listEl && !listEl.__lhJumpBound) {
      listEl.__lhJumpBound = true;
      listEl.addEventListener('click', e => {
        const btn = e.target.closest('.hodJumpStudyBtn');
        if (btn) {
          const num = btn.dataset.num;
          const subject = btn.dataset.subject || '';
          if (num && num !== '?') window.jumpToQuestionInLibrary(num, subject);
        }
      });
    }
  }

  function tick() {
    mount();
    bind();
    const uid = user()?.id || null;
    if (uid !== watchedUser) {
      watchedUser = uid;
      items = [];
      loadedOk = false;
      lastFetch = 0;
      if (uid) load(true);
    }
    paint();
  }

  function boot() {
    tick();
    // Lúc boot user thường CHƯA đăng nhập xong (auth async) nên tick đầu tháo nút
    // ra; các mốc dưới đây gắn lại ngay khi có user, không phải chờ interval.
    [300, 1200, 3000].forEach(ms => setTimeout(tick, ms));
    setInterval(tick, 700);
    setInterval(() => load(false), POLL_MS);
    // PATCH_MOBILE_PERF_PAUSE_INTERVALS chặn setInterval khi tab bị ẩn, nên khi
    // tab hiện lại phải tick tay một nhịp thay vì chờ interval.
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) tick();
    });
    window.addEventListener('focus', () => {
      tick();
      load(false);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
// ===== HEADER_EDIT_REQUEST_BELL_20260726 END =====
