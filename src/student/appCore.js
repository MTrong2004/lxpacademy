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
window.HODSupabase = (() => {
  const CONFIG = window.APP_CONFIG || {
    SUPABASE_URL: '',
    SUPABASE_ANON_KEY: '',
  };

  let client = null;
  let currentUser = null;
  let currentProfile = null;

  const configured = () => CONFIG.SUPABASE_URL.startsWith('https://') && !CONFIG.SUPABASE_ANON_KEY.startsWith('PASTE_');
  const isReady = () => !!client && !!currentUser;
  const isAdmin = () => currentProfile?.role === 'admin';
  const canOpenDashboard = () => ['admin', 'editor'].includes(currentProfile?.role);
  const $id = id => document.getElementById(id);

  function safeJson(obj) {
    try {
      return JSON.stringify(obj, null, 2);
    } catch (e) {
      return String(obj);
    }
  }

  function questionToRow(q) {
    const imgs = q.images || [];
    return {
      question: q.question,
      options: q.options || {},
      answer: q.answer,
      answer_text: finalAnswerText(q),
      images: imgs,
      has_image: !!(q.has_image || imgs.length),
      error_risk: q.error_risk || 'low',
      error_risk_reason: q.error_risk_reason || null,
    };
  }

  function rowToQuestion(row) {
    return {
      id: row.id,
      subject_code: row.subject_code,
      num: row.num,
      question: row.question,
      options: row.options || {},
      answer: row.answer,
      answer_text: row.answer_text,
      images: row.images || [],
      has_image: !!(row.has_image || (row.images || []).length),
      error_risk: row.error_risk || 'low',
      error_risk_reason: row.error_risk_reason || '',
      // Đánh dấu đã có đủ dữ liệu từ Turso, để các đoạn code cũ (fallback gọi
      // sang Supabase để "lazy load" ảnh/dữ liệu) không kích hoạt nữa - Supabase
      // giờ chỉ dùng cho Auth, mọi dữ liệu câu hỏi đều lấy từ Turso.
      __imagesChecked: true,
      __imagesLoaded: true,
    };
  }

  function notify2(msg) {
    if (typeof notify === 'function') notify(msg);
    else console.log('[HOD102]', msg);
  }

  function openAuth() {
    $id('authModal')?.classList.remove('hidden');
  }
  function closeAuth() {
    $id('authModal')?.classList.add('hidden');
  }
  function openAdmin() {
    if (!canOpenDashboard()) {
      alert('Tài khoản Google này chưa có quyền admin.');
      return;
    }
    window.open('admin.html', '_blank');
  }
  function closeAdmin() {
    $id('adminModal')?.classList.add('hidden');
  }

  function setupHeaderAuthUI() {
    const actions =
      document.querySelector('.globalTop .actions') ||
      document.querySelector('#fc .actions') ||
      document.querySelector('.actions');
    if (!actions || $id('authStatusBtn')) return;

    const adminBtn = document.createElement('button');
    adminBtn.id = 'adminOpenBtn';
    adminBtn.className = 'btn adminBtn hidden';
    adminBtn.title = 'Dashboard quản trị';
    adminBtn.textContent = '';
    adminBtn.style.display = 'none';
    adminBtn.onclick = () => window.open('admin.html', '_blank');

    const authBtn = document.createElement('button');
    authBtn.id = 'authStatusBtn';
    authBtn.className = 'btn authBtn';
    authBtn.title = 'Đăng nhập / Đăng xuất';
    authBtn.textContent = configured() ? 'Đăng nhập' : 'Local';
    authBtn.onclick = async () => {
      if (!configured()) return alert('Bạn cần điền SUPABASE_URL và SUPABASE_ANON_KEY trong file HTML trước.');
      if (currentUser) await signOut();
      else openAuth();
    };

    actions.prepend(authBtn);
    actions.prepend(adminBtn);
  }

  function updateAuthUI() {
    const authBtn = $id('authStatusBtn');
    const adminBtn = $id('adminOpenBtn');
    if (!authBtn) return;
    if (!configured()) {
      authBtn.textContent = 'Local';
      authBtn.classList.remove('userChip');
      adminBtn?.classList.add('hidden');
      return;
    }
    if (currentUser) {
      authBtn.textContent = currentProfile?.email || currentUser.email || 'User';
      authBtn.classList.add('userChip');
      const admin = canOpenDashboard();
      adminBtn?.classList.toggle('hidden', !admin);
      if (adminBtn) adminBtn.style.display = admin ? '' : 'none';
      const floatAdmin = $id('hodFloatAdmin');
      floatAdmin?.classList.toggle('hidden', !admin);
      if (floatAdmin) floatAdmin.style.display = admin ? '' : 'none';
      if (!admin) $id('adminModal')?.classList.add('hidden');
    } else {
      authBtn.textContent = 'Đăng nhập';
      authBtn.classList.remove('userChip');
      adminBtn?.classList.add('hidden');
      if (adminBtn) adminBtn.style.display = 'none';
      const floatAdmin = $id('hodFloatAdmin');
      floatAdmin?.classList.add('hidden');
      if (floatAdmin) floatAdmin.style.display = 'none';
      $id('adminModal')?.classList.add('hidden');
    }
  }

  /*
    ACCESS_GATE_STRICT_20260726
    Cổng truy cập fail-closed: chỉ mở web chính khi profile khẳng định
    approved === 1 VÀ blocked === 0. Thiếu profile, profile lỗi, hay /api/profile 500
    đều bị coi là KHÔNG có quyền.
  */
  const PENDING_DEFAULT_TITLE = 'Chờ phê duyệt';
  const PENDING_DEFAULT_MESSAGE =
    'Tài khoản của bạn đang chờ admin phê duyệt.<br>Bạn sẽ có thể sử dụng Learning Hub sau khi được duyệt.';
  const BLOCKED_TITLE = 'Tài khoản bị khóa';
  const BLOCKED_MESSAGE = 'Tài khoản của bạn đã bị quản trị viên khóa.<br>Bạn đã được đăng xuất khỏi hệ thống.';

  function truthyFlag(v) {
    return v === 1 || v === true || v === '1';
  }

  /*
    approved === 1 && blocked === 0 — không có ngoại lệ.
    Bản cũ có `if (['admin','editor'].includes(role)) return true;` ĐẶT TRƯỚC
    kiểm tra approved, nên editor bị thu hồi duyệt vẫn vào được giao diện chính.
    Nó khớp với lỗ tương ứng ở server (checkUserAccess cũ) — đã sửa cả hai phía.
    Đây chỉ là lớp hiển thị: quyền thật do server quyết định.
  */
  function hasFullAccess(profile) {
    if (!profile || typeof profile !== 'object') return false;
    if (truthyFlag(profile.blocked) || truthyFlag(profile.is_blocked) || profile.status === 'blocked') return false;
    return truthyFlag(profile.approved);
  }
  window.lhHasFullAccess = hasFullAccess;

  function showPendingApproval(opts) {
    const el = $id('hodPendingApproval');
    if (el) el.classList.remove('hidden');
    const titleEl = $id('hodPendingTitle');
    if (titleEl) titleEl.textContent = opts?.title || PENDING_DEFAULT_TITLE;
    const msgEl = $id('hodPendingMessage');
    if (msgEl) msgEl.innerHTML = opts?.message || PENDING_DEFAULT_MESSAGE;
    const emailEl = $id('hodPendingEmail');
    if (emailEl) emailEl.textContent = currentUser?.email || '';
    $id('hodLoginGate')?.classList.add('hidden');
    document.body?.classList.add('hod-locked');
    window.__LH_ACCESS_OK = false;
    /*
      PENDING_GATE_STICKY_20260726
      Cờ "gate đang do luồng quyền làm chủ". Các interval UI (avatar/nút admin,
      chạy mỗi 500ms) TUYỆT ĐỐI không được tự ẩn màn chờ duyệt khi cờ này bật —
      xem updateAll() ở block ACCOUNT AVATAR CLEAN FINAL.
    */
    window.__LH_GATE_LOCKED = true;
  }
  window.showPendingApproval = showPendingApproval;

  // /api/profile lỗi server (5xx) hoặc mất mạng: không kết luận được quyền => chặn.
  function showAccessCheckError() {
    showPendingApproval({
      title: 'Không thể kiểm tra quyền',
      message: 'Không thể kiểm tra quyền, vui lòng thử lại.',
    });
  }
  window.showAccessCheckError = showAccessCheckError;

  function hidePendingApproval() {
    const el = $id('hodPendingApproval');
    if (el) el.classList.add('hidden');
    document.body?.classList.remove('hod-locked');
    window.__LH_GATE_LOCKED = false;
  }

  // ===== APP_DIRECT_DISCORD_LOGIN_NOTIFY_20260627 =====
  // Gửi thông báo đăng nhập web qua /api/notify (server tự lấy webhook từ env, không lộ ra client).
  async function sendLoginToDiscord(email, role) {
    try {
      const res = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'login', user_id: currentUser?.id, email, role, source: 'web' }),
      });
      if (!res.ok) console.warn('Discord login notify failed:', res.status, await res.text().catch(() => ''));
    } catch (error) {
      console.warn('Lỗi gửi thông báo login web:', error);
    }
  }
  async function notifyLoginToDiscordOnce() {
    if (!currentUser) return;
    const key = 'hod_web_login_discord_notified_' + currentUser.id;
    if (sessionStorage.getItem(key)) return;
    await sendLoginToDiscord(currentProfile?.email || currentUser.email, currentProfile?.role || 'user');
    sessionStorage.setItem(key, 'true');
  }
  let lhApiAbortController = typeof AbortController !== 'undefined' ? new AbortController() : null;
  function getLhApiSignal() {
    return lhApiAbortController ? lhApiAbortController.signal : undefined;
  }
  window.getLhApiSignal = getLhApiSignal;

  function purgeOfflineQuestionCache() {
    try {
      LHState.RAW = [];
      LHState.pool = [];
      LHState.ci = 0;
      LHState.flipped = false;
      const q = $('question');
      if (q) q.textContent = 'Tài khoản chưa được duyệt hoặc đã bị khóa.';
      const opts = $('options');
      if (opts) opts.innerHTML = '';
      const imgs = $('images');
      if (imgs) imgs.innerHTML = '';
      const total = $('total');
      if (total) total.textContent = '0';
      const idx = $('idx');
      if (idx) idx.textContent = '0';
      if (typeof renderQuiz === 'function') renderQuiz();
      if (typeof renderStudy === 'function') renderStudy();

      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (
          k &&
          (k.startsWith('lh_question_') ||
            k.startsWith('lh_raw_') ||
            k.startsWith('lh_starred_') ||
            k.startsWith('learninghub_questions_'))
        ) {
          localStorage.removeItem(k);
        }
      }
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const k = sessionStorage.key(i);
        if (k && (k.startsWith('lh_') || k.startsWith('learninghub_'))) {
          sessionStorage.removeItem(k);
        }
      }
      if (typeof caches !== 'undefined' && caches.keys) {
        caches
          .keys()
          .then(names => {
            names.forEach(name => {
              if (name.includes('questions') || name.includes('learninghub')) caches.delete(name);
            });
          })
          .catch(() => {});
      }
      if (typeof indexedDB !== 'undefined' && indexedDB.databases) {
        indexedDB
          .databases()
          .then(dbs => {
            dbs.forEach(dbInfo => {
              if (dbInfo.name && dbInfo.name.includes('learninghub')) indexedDB.deleteDatabase(dbInfo.name);
            });
          })
          .catch(() => {});
      }
    } catch (e) {
      console.warn('purgeOfflineQuestionCache error:', e);
    }
  }

  /*
    VI + VII. Hai kịch bản thu hồi quyền, khác nhau ở CHỖ CÓ ĐĂNG XUẤT HAY KHÔNG.

      PENDING_APPROVAL (bị thu hồi duyệt): xóa sạch dữ liệu học, GIỮ phiên
        Supabase để user chờ được duyệt lại rồi bấm "Kiểm tra lại".
      BLOCKED (bị khóa): xóa sạch dữ liệu học VÀ đăng xuất Supabase.
      UNAUTHORIZED (phiên hỏng/hết hạn): dọn dữ liệu và đăng xuất, vì token
        không còn dùng được nữa.

    Bản cũ gọi showPendingApproval() với text mặc định cho cả ba, nên user bị
    khóa vẫn đọc thấy "Tài khoản của bạn đang chờ admin phê duyệt".
  */
  function handleAccessRevoked(reason, code = null) {
    if (window.__LH_REVOKING_ACCESS) return;
    window.__LH_REVOKING_ACCESS = true;
    console.warn('[LH Auth] Thu hồi quyền:', reason, '| code:', code);

    // 1. Hủy mọi request /api/ đang chạy.
    try {
      if (lhApiAbortController) {
        lhApiAbortController.abort('Access revoked');
        lhApiAbortController = typeof AbortController !== 'undefined' ? new AbortController() : null;
      }
    } catch (e) {
      lhWarn('APP_DIRECT_DISCORD_LOGIN_NOTIFY_20260627', e);
    }

    // 2. Xóa RAM, DOM, localStorage/sessionStorage/IndexedDB/Cache Storage.
    window.__LH_ACCESS_OK = false;
    currentProfile = null;
    purgeOfflineQuestionCache();

    // 3. Dừng timer nền và subscription.
    try {
      if (typeof window.lhTeardownAccessWatch === 'function') window.lhTeardownAccessWatch();
    } catch (e) {
      lhWarn('APP_DIRECT_DISCORD_LOGIN_NOTIFY_20260627', e);
    }

    const mustSignOut = code === 'BLOCKED' || code === 'UNAUTHORIZED';

    if (code === 'BLOCKED') {
      showPendingApproval({ title: BLOCKED_TITLE, message: BLOCKED_MESSAGE });
    } else if (code === 'UNAUTHORIZED') {
      showPendingApproval({
        title: 'Phiên đăng nhập đã hết hạn',
        message: 'Vui lòng đăng nhập lại để tiếp tục.',
      });
    } else {
      showPendingApproval({ title: PENDING_DEFAULT_TITLE, message: PENDING_DEFAULT_MESSAGE });
    }

    if (mustSignOut) {
      try {
        unsubscribeUserStatusRealtime();
      } catch (e) {
        lhWarn('APP_DIRECT_DISCORD_LOGIN_NOTIFY_20260627', e);
      }
      if (typeof signOut === 'function') signOut().catch(() => {});
    }

    updateAuthUI();
    setTimeout(() => {
      window.__LH_REVOKING_ACCESS = false;
    }, 3000);
  }
  window.handleAccessRevoked = handleAccessRevoked;

  /*
    V. SUPABASE REALTIME — CHỈ LÀ CƠ CHẾ BÁO THAY ĐỔI, KHÔNG PHẢI NGUỒN QUYỀN.

    Bản cũ quyết định quyền TRỰC TIẾP từ payload realtime:
      if (data.blocked === true) handleAccessRevoked(...)
      else if (data.approved === false) handleAccessRevoked(...)
    Ba vấn đề:
      1. Tin vào nội dung một message có thể bị giả mạo/ lỗi thời để khoá UI.
      2. Payload từ server đã từng sai thật: toggle_user_block gửi kèm
         `approved: !blocked`, nên mở khoá một tài khoản CHƯA DUYỆT lại báo cho
         client rằng nó đã được duyệt.
      3. Nó cũng nghe postgres_changes trên public.profiles của Supabase —
         nhưng bảng profiles thật nằm ở TURSO. Kênh đó hoặc không bao giờ bắn,
         hoặc bắn dữ liệu của một bảng đã lỗi thời. Đã bỏ hẳn.

    Nay: nhận tín hiệu -> chống trùng -> gọi ĐÚNG MỘT LẦN /api/profile ->
    xử lý theo kết quả thật từ Turso.
  */
  let statusRealtimeChannel = null;
  let lastRealtimeSignalAt = 0;

  function unsubscribeUserStatusRealtime() {
    if (!statusRealtimeChannel) return;
    try {
      statusRealtimeChannel.unsubscribe();
    } catch (e) {
      lhWarn('APP_DIRECT_DISCORD_LOGIN_NOTIFY_20260627', e);
    }
    statusRealtimeChannel = null;
    window.__lhRealtimeConnected = false;
  }
  window.lhUnsubscribeUserStatus = unsubscribeUserStatusRealtime;

  function onRealtimeSignal(reason) {
    // Chống xử lý sự kiện trùng: nhiều message dồn trong 2s chỉ tính là một.
    const now = Date.now();
    if (now - lastRealtimeSignalAt < 2000) return;
    lastRealtimeSignalAt = now;
    if (typeof window.lhRevalidateAccess === 'function') {
      window.lhRevalidateAccess('realtime:' + (reason || 'status_changed'));
    }
  }

  /*
    RELOAD_NOTICE_REALTIME_20260729 — kênh CHUNG cho "nhắc tất cả người dùng tải lại".

    Vì sao cần kênh riêng ngoài 'user-status-<id>': nhắc tất cả mà bắn lần lượt vào topic
    của từng người thì server phải gọi Supabase một lần cho MỖI user. Kênh chung: một lần
    bắn, mọi client đang mở đều nhận.

    Ở đây được phép tin payload vì việc duy nhất nó gây ra là hiện banner "hãy tải lại" —
    không liên quan quyền. Mọi thứ dính tới QUYỀN vẫn phải đi qua /api/profile
    (xem ghi chú V ở trên).
  */
  let globalRealtimeChannel = null;

  function subscribeGlobalRealtime() {
    if (globalRealtimeChannel) return;
    try {
      const supa = window.HODSupabase?.__client;
      if (!supa || typeof supa.channel !== 'function') return;
      globalRealtimeChannel = supa.channel('lh-global');
      globalRealtimeChannel.on('broadcast', { event: 'reload_notice' }, () => {
        window.lhHandleReloadNotice?.();
      });
      globalRealtimeChannel.subscribe(status => {
        if (status === 'SUBSCRIBED') console.log('[Realtime] đã theo dõi kênh chung lh-global');
      });
    } catch (e) {
      lhWarn('RELOAD_NOTICE_REALTIME_20260729', e);
      globalRealtimeChannel = null;
    }
  }

  function unsubscribeGlobalRealtime() {
    if (!globalRealtimeChannel) return;
    try {
      globalRealtimeChannel.unsubscribe();
    } catch (e) {
      lhWarn('RELOAD_NOTICE_REALTIME_20260729', e);
    }
    globalRealtimeChannel = null;
  }

  function subscribeUserStatusRealtime(userId) {
    // Một user chỉ có ĐÚNG MỘT subscription, kể cả khi lh:profile-ready bắn lại.
    if (!userId || statusRealtimeChannel) return;
    try {
      const supa = window.HODSupabase?.__client;
      if (!supa || typeof supa.channel !== 'function') return;

      // Client chỉ subscribe channel của CHÍNH user đang đăng nhập.
      statusRealtimeChannel = supa.channel('user-status-' + userId);

      statusRealtimeChannel.on('broadcast', { event: 'status_changed' }, msg => {
        const data = msg?.payload || {};
        /*
          RELOAD_NOTICE_REALTIME_20260729: admin nhắc RIÊNG người này tải lại. Vẫn gọi
          lhRevalidateAccess (nó đọc /api/profile check_only, chính chỗ trả reload_notice và
          xoá cờ), nhưng hiện banner ngay để không phải chờ vòng xác minh.
        */
        if (data.reason === 'reload_notice') window.lhHandleReloadNotice?.();
        onRealtimeSignal(data.reason);
      });

      statusRealtimeChannel.subscribe(status => {
        if (status === 'SUBSCRIBED') {
          console.log('[Realtime] đã theo dõi trạng thái tài khoản:', userId);
          window.__lhRealtimeConnected = true;
          if (typeof window.stopFallbackPolling === 'function') window.stopFallbackPolling();
          // Kết nối (lại) xong thì kiểm tra một lần, phòng khi có thay đổi
          // xảy ra đúng lúc kênh đang đứt.
          if (typeof window.lhRevalidateAccess === 'function') window.lhRevalidateAccess('realtime:subscribed');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.warn('[Realtime] mất kết nối:', status);
          window.__lhRealtimeConnected = false;
          if (document.visibilityState === 'visible' && typeof window.startFallbackPolling === 'function') {
            window.startFallbackPolling();
          }
        }
      });
    } catch (e) {
      console.warn('[Realtime] không đăng ký được kênh:', e);
      statusRealtimeChannel = null;
      window.__lhRealtimeConnected = false;
      if (document.visibilityState === 'visible' && typeof window.startFallbackPolling === 'function') {
        window.startFallbackPolling();
      }
    }
  }

  window.addEventListener('lh:profile-ready', () => {
    const u = window.HODSupabase?.getUser?.();
    if (u?.id) subscribeUserStatusRealtime(u.id);
    subscribeGlobalRealtime();
  });

  /*
    X. CHỐNG REQUEST TRÙNG
    activeProfilePromise: nếu /api/profile đang chạy thì mọi lời gọi khác dùng
    chung promise đó, KHÔNG tạo request thứ hai. init(), onAuthStateChange,
    visibilitychange, Realtime và polling đều đi qua đây.

    checkOnly = true -> gửi { check_only: true }: server chỉ ĐỌC trạng thái
    quyền (PK lookup, cột hẹp) và không ghi gì. Dùng cho mọi lần xác minh lại
    (Realtime / quay lại tab / polling), nên một tab mở cả ngày không còn tạo ra
    hàng loạt lượt ghi device_history + last_login vô nghĩa.
  */
  let activeProfilePromise = null;
  async function loadProfile(force = false, checkOnly = false) {
    window.loadProfile = loadProfile;
    if (!currentUser) {
      currentProfile = null;
      updateAuthUI();
      return null;
    }
    if (activeProfilePromise) return activeProfilePromise;
    activeProfilePromise = (async () => {
      try {
        const activeSubjectCode = (localStorage.getItem('learninghub_subject_code_merged_v1') || '').trim();
        const body = checkOnly
          ? { check_only: true }
          : {
              id: currentUser.id,
              email: currentUser.email || '',
              full_name: currentUser.user_metadata?.full_name || '',
              avatar_url: currentUser.user_metadata?.avatar_url || currentUser.user_metadata?.picture || '',
              current_subject: activeSubjectCode,
              device_info: typeof getDeviceTypeString === 'function' ? getDeviceTypeString() : undefined,
              last_login: new Date().toISOString(),
              last_activity: new Date().toISOString(),
            };
        const res = await fetch('/api/profile?turso=1&ts=' + Date.now(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
          body: JSON.stringify(body),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || json.error) {
          currentProfile = null;
          window.__LH_ACCESS_OK = false;
          /*
            VIII: chỉ 401/403 mới là "mất quyền". 500 và lỗi mạng chỉ có nghĩa là
            KHÔNG KẾT LUẬN ĐƯỢC -> hiện "Không thể kiểm tra quyền" kèm nút thử
            lại, tuyệt đối không xóa dữ liệu và không đăng xuất user.
          */
          if (res.status === 401 || res.status === 403) {
            handleAccessRevoked(
              json.error || 'Tài khoản chưa được duyệt hoặc đã bị khóa.',
              json.code || (res.status === 401 ? 'UNAUTHORIZED' : 'PENDING_APPROVAL'),
            );
          } else {
            showAccessCheckError();
            updateAuthUI();
          }
          throw new Error(json.error || `Không kiểm tra được quyền (HTTP ${res.status})`);
        }
        currentProfile = json.data || json.profile || json;
        /*
          RELOAD_NOTICE_CLIENT_20260729: chỉ hiện banner ở các lần XÁC MINH LẠI
          (checkOnly = true: realtime / quay lại tab / polling). Lần gọi đầy đủ chạy đúng
          lúc MỞ TRANG — vừa tải mới xong thì nhắc "hãy tải lại" là vô nghĩa.
        */
        if (checkOnly && json.reload_notice) showReloadNoticeNow();
        if (truthyFlag(currentProfile?.blocked)) {
          handleAccessRevoked('Tài khoản đã bị khóa', 'BLOCKED');
          return null;
        }
        // Fail-closed: chỉ đi tiếp khi approved === 1 && blocked === 0.
        // (Server đã trả 403 PENDING_APPROVAL trong trường hợp này; đây là lớp
        //  phòng thủ thứ hai phòng khi server cũ chưa kịp deploy.)
        if (!hasFullAccess(currentProfile)) {
          handleAccessRevoked('Tài khoản chưa được phê duyệt', 'PENDING_APPROVAL');
          return null;
        }
        if (!checkOnly) await notifyLoginToDiscordOnce();
        window.__LH_ACCESS_OK = true;
        hidePendingApproval();
        updateAuthUI();
        window.dispatchEvent(new CustomEvent('lh:profile-ready'));
        return currentProfile;
      } catch (e) {
        console.error('[Turso profile]', e);
        currentProfile = null;
        window.__LH_ACCESS_OK = false;
        // Lỗi mạng / JSON hỏng: cũng không được vào web chính.
        if (!document.getElementById('hodPendingApproval')?.classList.contains('hidden')) {
          // gate đã hiển thị ở nhánh trên, giữ nguyên thông điệp
        } else {
          showAccessCheckError();
        }
        updateAuthUI();
        return null;
      } finally {
        activeProfilePromise = null;
      }
    })();
    return activeProfilePromise;
  }

  /*
    V.3: điểm vào DUY NHẤT cho việc "xác minh lại quyền từ Turso".
    lhRevalidateAccess() (interceptor cuối file) gọi hàm này sau khi đã dedupe
    và debounce, nên một sự kiện Realtime chỉ sinh ra tối đa MỘT request.
  */
  window.lhCheckProfileOnce = function (reason) {
    console.debug('[LH access] xác minh lại quyền từ Turso, nguồn:', reason || 'unknown');
    return loadProfile(true, true);
  };

  async function loadQuestionsFromSupabase() {
    if (!currentUser) return false;
    // ACCESS_GATE_STRICT_20260726: fail-closed.
    if (!hasFullAccess(currentProfile)) {
      showPendingApproval();
      return false;
    }
    const activeSubject = localStorage.getItem('learninghub_subject_code_merged_v1') || '';
    if (!activeSubject) return false;
    try {
      const res = await fetch(
        '/api/questions?subject_code=' + encodeURIComponent(activeSubject) + '&ts=' + Date.now(),
        { cache: 'no-store' },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.error) throw new Error(json.error || 'Không tải được questions từ Turso');
      const rows = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
      LHState.RAW = rows.map(rowToQuestion);
      LHState.pool = [...LHState.RAW];
      var _sci = +localStorage.getItem('learninghub_progress_' + activeSubject) || 0;
      LHState.ci = Math.max(0, Math.min(_sci, Math.max(0, LHState.pool.length - 1)));
      LHState.flipped = false;
      if ($id('total')) $id('total').textContent = LHState.pool.length;
      try {
        renderCard();
      } catch (e) {
        lhWarn('APP_DIRECT_DISCORD_LOGIN_NOTIFY_20260627', e);
      }
      try {
        renderQuiz();
      } catch (e) {
        lhWarn('APP_DIRECT_DISCORD_LOGIN_NOTIFY_20260627', e);
      }
      try {
        renderStudy();
      } catch (e) {
        lhWarn('APP_DIRECT_DISCORD_LOGIN_NOTIFY_20260627', e);
      }
      notify2('Đã tải câu hỏi từ Turso');
      return true;
    } catch (e) {
      console.warn('[Turso questions]', e);
      notify2('Không tải được câu hỏi từ Turso.');
      return false;
    }
  }

  async function signInGoogle() {
    if (!window.supabase) return alert('Không tải được Supabase. Kiểm tra mạng hoặc CDN.');
    if (!client) return alert('Supabase chưa sẵn sàng.');
    const { error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.href.split('#')[0] },
    });
    if (error) alert(error.message);
  }

  async function signIn() {
    if (!client) return;
    const email = $id('authEmail')?.value.trim();
    const password = $id('authPassword')?.value;
    if (!email || !password) return alert('Nhập email và mật khẩu nha.');
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) return alert(error.message);
    currentUser = data.user;
    await loadProfile();
    await loadQuestionsFromSupabase();
    closeAuth();
    notify2('Đã đăng nhập');
  }

  async function signUp() {
    if (!client) return;
    const email = $id('authEmail')?.value.trim();
    const password = $id('authPassword')?.value;
    if (!email || !password) return alert('Nhập email và mật khẩu nha.');
    const { data, error } = await client.auth.signUp({ email, password });
    if (error) return alert(error.message);
    alert('Đã tạo tài khoản. Nếu Supabase yêu cầu xác nhận email, hãy xác nhận rồi đăng nhập.');
  }

  /*
    RELOAD_NOTICE_CLIENT_20260729 — THAY cho FORCE_LOGOUT_REALLY_SIGNS_OUT_20260726.

    Trước đây admin có nút "Đăng xuất người dùng": server set force_logout=1, client huỷ
    phiên Supabase + alert "Bạn đã được quản trị viên đăng xuất khỏi hệ thống" rồi reload.
    Nay đổi thành NHẮC TẢI LẠI: người dùng không bị mất phiên, không có alert chặn màn
    hình — chỉ hiện đúng banner "Hệ thống vừa cập nhật / Tải lại" như khi deploy bản mới,
    và họ tự bấm khi thuận tiện.

    Cờ ở DB (profiles.reload_notice) lo cho người đang offline; realtime lo cho người đang
    mở web. Banner nằm ở src/core/versionChecker.js (showAdminReloadNotice), main.js gán
    vào window.lhShowReloadNotice.
  */
  function showReloadNoticeNow() {
    if (window.__LH_RELOAD_NOTICE_SHOWN) return;
    window.__LH_RELOAD_NOTICE_SHOWN = true;
    try {
      if (typeof window.lhShowReloadNotice === 'function') window.lhShowReloadNotice();
    } catch (e) {
      lhWarn('RELOAD_NOTICE_CLIENT_20260729', e);
    }
  }
  window.lhHandleReloadNotice = showReloadNoticeNow;

  async function signOut() {
    if (!client) return;
    // IX: dọn subscription + timer khi đăng xuất, không để timer mồ côi chạy tiếp.
    try {
      unsubscribeUserStatusRealtime();
      unsubscribeGlobalRealtime(); // RELOAD_NOTICE_REALTIME_20260729
    } catch (e) {
      lhWarn('APP_DIRECT_DISCORD_LOGIN_NOTIFY_20260627', e);
    }
    try {
      if (typeof window.lhTeardownAccessWatch === 'function') window.lhTeardownAccessWatch();
    } catch (e) {
      lhWarn('APP_DIRECT_DISCORD_LOGIN_NOTIFY_20260627', e);
    }
    Object.keys(sessionStorage)
      .filter(k => k.startsWith('hod_web_login_discord_notified_'))
      .forEach(k => sessionStorage.removeItem(k));
    await client.auth.signOut();
    currentUser = null;
    currentProfile = null;
    window.__LH_ACCESS_OK = false;
    updateAuthUI();
    notify2('Đã đăng xuất');
  }

  async function submitEditRequest(newDraft, oldQ) {
    if (!client) return alert('Chưa cấu hình Supabase.');
    if (!currentUser) {
      openAuth();
      return;
    }
    if (!oldQ?.id) {
      alert(
        'Câu hỏi hiện đang lấy từ data local. Hãy đăng nhập và tải questions từ Supabase trước khi gửi yêu cầu sửa.',
      );
      return;
    }
    // Chờ upload ảnh Cloudinary (nếu đang chạy dở) rồi quét nốt ảnh base64 còn sót,
    // tránh trường hợp bấm gửi trước khi upload xong làm ảnh bị lọc mất khi gửi lên backend.
    try {
      if (typeof window.__LHGetPendingImageUpload === 'function') {
        const p = window.__LHGetPendingImageUpload();
        if (p) await p;
      }
      if (typeof window.__LHUploadPendingDataUrls === 'function') await window.__LHUploadPendingDataUrls();
    } catch (e) {
      console.warn('Chờ upload ảnh trước khi gửi yêu cầu sửa thất bại:', e);
    }
    const payload = {
      question_id: oldQ.id,
      question_num: oldQ.num,
      subject_code: oldQ.subject_code || newDraft.subject_code || '',
      user_id: currentUser.id,
      user_email: currentUser.email || currentProfile?.email || '',
      old_data: questionToRow(oldQ),
      new_data: questionToRow(newDraft),
      reason: '',
    };
    const res = await fetch('/api/edit-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify(payload),
    });
    const out = await res.json().catch(() => ({}));
    if (!res.ok || out.error) return alert('Gửi yêu cầu sửa thất bại: ' + (out.error || res.status));
    $id('editModal')?.classList.add('hidden');
    notify2('Đã gửi yêu cầu sửa, đang chờ admin duyệt');
  }

  async function loadPendingRequests() {
    if (!client || !isAdmin()) return;
    const list = $id('adminRequests');
    const count = $id('adminCount');
    if (list) list.innerHTML = '<div class="more">Đang tải...</div>';
    let data = [];
    try {
      const res = await fetch('/api/admin-dashboard', { cache: 'no-store' });
      const dash = await res.json().catch(() => ({}));
      if (!res.ok || dash.error) throw new Error(dash.error || res.status);
      data = (dash.requests || [])
        .filter(r => r.status === 'pending')
        .map(r => ({
          ...r,
          old_data: typeof r.old_data === 'string' ? JSON.parse(r.old_data || '{}') : r.old_data,
          new_data: typeof r.new_data === 'string' ? JSON.parse(r.new_data || '{}') : r.new_data,
        }));
    } catch (e) {
      if (list) list.innerHTML = '<div class="more">' + esc(e.message || 'Lỗi tải') + '</div>';
      return;
    }
    if (count) count.textContent = `${data.length} yêu cầu`;
    if (!list) return;
    list.innerHTML = data.length
      ? data
          .map(
            r => `
      <div class="adminReq" data-request-id="${r.id}">
        <div class="adminReqHead"><span>Request #${r.id} · Câu ${r.question_num || r.question_id}</span><span>${new Date(r.created_at).toLocaleString()}</span></div>
        <div class="compareGrid">
          <div class="compareBox"><h4>Nội dung cũ</h4><pre>${esc(safeJson(r.old_data))}</pre></div>
          <div class="compareBox"><h4>Nội dung đề xuất</h4><pre>${esc(safeJson(r.new_data))}</pre></div>
        </div>
        <div class="adminActions">
          <button class="btn approveBtn" data-approve="${r.id}">Duyệt</button>
          <button class="btn rejectBtn" data-reject="${r.id}">Từ chối</button>
        </div>
      </div>`,
          )
          .join('')
      : '<div class="more">Không có yêu cầu chờ duyệt.</div>';
    list.querySelectorAll('[data-approve]').forEach(
      btn =>
        (btn.onclick = () =>
          approveRequest(
            Number(btn.dataset.approve),
            data.find(x => x.id === Number(btn.dataset.approve)),
          )),
    );
    list
      .querySelectorAll('[data-reject]')
      .forEach(btn => (btn.onclick = () => rejectRequest(Number(btn.dataset.reject))));
  }

  async function approveRequest(id, req) {
    if (!isAdmin()) return alert('Chỉ admin mới duyệt được.');
    const res = await fetch('/api/admin-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({ user_id: currentUser.id, action: 'approve_request', payload: { request_id: id } }),
    });
    const out = await res.json().catch(() => ({}));
    if (!res.ok || out.error) return alert('Không duyệt được: ' + (out.error || res.status));
    if (typeof window.clearLearningHubQuestionCache === 'function') window.clearLearningHubQuestionCache();
    notify2('Đã duyệt yêu cầu');
    try {
      await loadPendingRequests();
    } catch (e) {
      console.warn('loadPendingRequests failed:', e);
    }
    try {
      await loadQuestionsFromSupabase();
    } catch (e) {
      console.warn('loadQuestions failed:', e);
    }
  }

  async function rejectRequest(id) {
    if (!isAdmin()) return alert('Chỉ admin mới từ chối được.');
    const note = prompt('Lý do từ chối (tuỳ chọn):') || '';
    const res = await fetch('/api/admin-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({
        user_id: currentUser.id,
        action: 'reject_request',
        payload: { request_id: id, admin_note: note },
      }),
    });
    const out = await res.json().catch(() => ({}));
    if (!res.ok || out.error) return alert('Không từ chối được: ' + (out.error || res.status));
    notify2('Đã từ chối yêu cầu');
    try {
      await loadPendingRequests();
    } catch (e) {
      console.warn('loadPendingRequests failed:', e);
    }
  }

  async function applyOAuthHashSession(supaClient) {
    try {
      let h = window.location.hash || '';
      if (!h) return false;
      h = h.replace(/^#/, '').replace(/&amp;/g, '&');
      const p = new URLSearchParams(h);
      const access_token = p.get('access_token');
      const refresh_token = p.get('refresh_token');
      if (!access_token || !refresh_token) return false;
      const { error } = await supaClient.auth.setSession({ access_token, refresh_token });
      if (error) {
        console.warn('setSession from hash failed:', error);
        return false;
      }
      history.replaceState(null, '', window.location.pathname + window.location.search);
      return true;
    } catch (e) {
      console.warn('applyOAuthHashSession error:', e);
      return false;
    }
  }
  async function init() {
    setupHeaderAuthUI();
    $id('authGoogle')?.addEventListener('click', signInGoogle);
    $id('authLogin')?.addEventListener('click', signIn);
    $id('authSignup')?.addEventListener('click', signUp);
    $id('authClose')?.addEventListener('click', closeAuth);
    $id('adminClose')?.addEventListener('click', closeAdmin);
    $id('adminReload')?.addEventListener('click', loadPendingRequests);
    $id('hodPendingRefresh')?.addEventListener('click', async () => {
      const btn = $id('hodPendingRefresh');
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Đang kiểm tra...';
      }
      await loadProfile();
      if (hasFullAccess(currentProfile)) await loadQuestionsFromSupabase();
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Kiểm tra lại';
      }
    });
    $id('hodPendingLogout')?.addEventListener('click', async () => {
      await signOut();
      hidePendingApproval();
    });

    if (!configured()) {
      updateAuthUI();
      return;
    }
    client = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
    await applyOAuthHashSession(client);
    const { data } = await client.auth.getSession();
    currentUser = data.session?.user || null;
    if (currentUser) {
      const prof = await loadProfile();
      if (prof) {
        await loadQuestionsFromTurso();
        if (typeof window.__LHTriggerSubjectCheck === 'function') window.__LHTriggerSubjectCheck();
      }
    } else updateAuthUI();

    client.auth.onAuthStateChange(async (_event, session) => {
      currentUser = session?.user || null;
      if (currentUser) {
        const prof = await loadProfile();
        if (prof) {
          await loadQuestionsFromTurso();
          if (typeof window.__LHTriggerSubjectCheck === 'function') window.__LHTriggerSubjectCheck();
        }
      } else {
        currentProfile = null;
        updateAuthUI();
      }
    });
  }

  // FIX_AUTO_LOAD_ON_SESSION_RESTORE_20260701: khi khoi phuc phien dang nhap luc mo lai trang,
  // uu tien goi thang loader Turso chuan (loadCurrentSubjectOnly) thay vi ham loadQuestionsFromSupabase
  // cu o tren (ham cu khong tu cap nhat lai man hinh khi loi, khien giao dien ket o "Dang cho du lieu Supabase...").
  async function loadQuestionsFromTurso() {
    if (typeof window.loadCurrentSubjectOnly === 'function') return window.loadCurrentSubjectOnly();
    return loadQuestionsFromSupabase();
  }

  document.addEventListener('DOMContentLoaded', init);

  return {
    init,
    isReady,
    isAdmin,
    canOpenDashboard,
    submitEditRequest,
    loadQuestionsFromSupabase,
    openAuth,
    openAdmin,
    signOut,
    signInGoogle,
    getUser: () => currentUser,
    getProfile: () => currentProfile,
    get __client() {
      return client;
    },
  };
})();

// ===== HOD Login + Admin UI (added) =====
(function () {
  function $(id) {
    return document.getElementById(id);
  }
  function hideLanding() {
    $('hodLoginScreen')?.classList.add('hidden');
  }
  function openLogin() {
    hideLanding();
    if (window.HODSupabase?.openAuth) window.HODSupabase.openAuth();
    else alert('Supabase UI chưa sẵn sàng, hãy tải lại trang.');
  }
  function openAdmin() {
    hideLanding();
    if (window.HODSupabase?.canOpenDashboard?.()) window.HODSupabase.openAdmin();
    else {
      if (window.HODSupabase?.openAuth) window.HODSupabase.openAuth();
      setTimeout(() => alert('Đăng nhập tài khoản admin trước. Sau đó bấm nút Admin lại.'), 80);
    }
  }
  function bind() {
    $('hodGuestEnter')?.addEventListener('click', hideLanding);
    $('hodOpenLogin')?.addEventListener('click', openLogin);
    $('hodOpenAdmin')?.addEventListener('click', openAdmin);
    $('hodFloatLogin')?.addEventListener('click', openLogin);
    $('hodFloatAdmin')?.addEventListener('click', openAdmin);
    const box = document.querySelector('#authModal .box.authBox');
    if (box && !document.getElementById('hodAuthExtraHint')) {
      const hint = document.createElement('div');
      hint.id = 'hodAuthExtraHint';
      hint.className = 'hodAuthHint';
      hint.textContent =
        'Người học dùng Đăng nhập/Đăng ký. Admin đăng nhập bằng tài khoản đã được set role = admin trong Supabase.';
      box.appendChild(hint);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
})();

// ===== Admin visibility hard fix =====
(function () {
  function applyAdminGuard() {
    const isAdmin = !!window.HODSupabase?.canOpenDashboard?.();
    document.body?.classList.toggle('hod-is-admin', isAdmin);
    ['adminOpenBtn', 'hodFloatAdmin'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.classList.toggle('hidden', !isAdmin);
      el.style.display = isAdmin ? '' : 'none';
    });
    const modal = document.getElementById('adminModal');
    if (modal && !isAdmin) modal.classList.add('hidden');
  }
  function patchOpenAdmin() {
    if (!window.HODSupabase || window.HODSupabase.__adminGuardPatched) return;
    const oldOpen = window.HODSupabase.openAdmin;
    window.HODSupabase.openAdmin = function () {
      if (!window.HODSupabase.canOpenDashboard?.()) {
        document.getElementById('adminModal')?.classList.add('hidden');
        alert('Tài khoản Google này chưa có quyền admin.');
        applyAdminGuard();
        return;
      }
      return oldOpen?.apply(this, arguments);
    };
    window.HODSupabase.__adminGuardPatched = true;
  }
  function tick() {
    patchOpenAdmin();
    applyAdminGuard();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tick);
  else tick();
  setInterval(tick, 500);
})();

// ===== ACCOUNT AVATAR CLEAN FINAL =====
(function () {
  function $(id) {
    return document.getElementById(id);
  }
  function user() {
    return window.HODSupabase?.getUser?.() || null;
  }
  function profile() {
    return window.HODSupabase?.getProfile?.() || null;
  }
  function isAdmin() {
    return !!window.HODSupabase?.canOpenDashboard?.();
  }
  function email() {
    return profile()?.email || user()?.email || '';
  }
  function meta() {
    return user()?.user_metadata || {};
  }
  function avatarHTML() {
    const u = meta().avatar_url || meta().picture || '';
    const e = email();
    const l = (e || 'U').trim().charAt(0).toUpperCase();
    return u ? '<img src="' + esc(u) + '" alt="avatar" loading="lazy" decoding="async">' : l;
  }
  function ensureAvatar() {
    const actions =
      document.querySelector('.globalTop .actions') ||
      document.querySelector('#fc .actions') ||
      document.querySelector('.actions');
    if (!actions || $('hodTopAvatar')) return;
    const btn = document.createElement('button');
    btn.id = 'hodTopAvatar';
    btn.className = 'hodTopAvatar';
    btn.type = 'button';
    btn.onclick = toggleMenu;
    actions.appendChild(btn);
  }
  function toggleMenu() {
    if (!user()) return showLogin();
    updateMenu();
    $('hodAccountMenu')?.classList.toggle('hidden');
  }
  function showLogin() {
    if (window.__LOCAL_DEV_MODE) return;
    document.body?.classList.add('hod-locked');
    $('hodLoginGate')?.classList.remove('hidden');
    $('hodAccountMenu')?.classList.add('hidden');
    $('hodPendingApproval')?.classList.add('hidden');
  }
  function hideLogin() {
    document.body?.classList.remove('hod-locked');
    $('hodLoginGate')?.classList.add('hidden');
  }
  function login() {
    const api = window.HODSupabase;
    if (!api) {
      alert('Supabase chưa sẵn sàng, hãy tải lại trang.');
      return;
    }
    if (api.signInGoogle) {
      api.signInGoogle();
      return;
    }
    api.openAuth?.();
  }
  async function logout() {
    await window.HODSupabase?.signOut?.();
    showLogin();
    updateAll();
  }
  function openDash() {
    if (isAdmin()) window.open('admin.html', '_blank');
    else alert('Tài khoản này không có quyền admin.');
  }
  function updateMenu() {
    const admin = isAdmin();
    const pRole = profile()?.role || (email() === 'trongbm2004@gmail.com' ? 'admin' : 'user');
    const rawRole = String(pRole).toLowerCase();
    const mail = $('hodAccountEmail');
    if (mail) mail.textContent = email() || 'Chưa đăng nhập';
    const role = $('hodAccountRole');
    if (role)
      role.textContent =
        rawRole === 'admin' || email() === 'trongbm2004@gmail.com'
          ? 'Admin'
          : rawRole === 'editor'
            ? 'Editor'
            : 'Người học';
    const av = $('hodAccountAvatarBig');
    if (av) {
      const __avb = avatarHTML();
      if (av.dataset.av !== __avb) {
        av.innerHTML = __avb;
        av.dataset.av = __avb;
      }
    }
    $('hodAccountDashboard')?.classList.toggle('hidden', !admin);
  }
  /*
    PENDING_GATE_STICKY_20260726
    Bug: điều kiện cũ là `u && p && p.approved === false`. Từ khi /api/profile trả
    403 PENDING_APPROVAL thì user chưa duyệt KHÔNG bao giờ có profile nữa
    (handleAccessRevoked đặt currentProfile = null), nên p = null -> pending = false
    -> nhánh `else if (u)` của interval 500ms này ẩn luôn màn "Chờ phê duyệt" mà
    showPendingApproval() vừa mở và bỏ luôn class hod-locked. Kết quả: user chưa
    duyệt nhìn thấy giao diện chính rỗng với dòng "Tài khoản chưa được duyệt hoặc
    đã bị khóa." nằm trong khung câu hỏi (do purgeOfflineQuestionCache ghi vào
    #question), thay vì màn chờ duyệt.
    Nay: showPendingApproval()/hidePendingApproval() là chủ của gate
    (window.__LH_GATE_LOCKED); interval này chỉ đồng bộ theo, không tự đóng gate,
    và KHÔNG ghi đè title/message vì lý do chặn (chờ duyệt / bị khóa / hết phiên)
    do luồng quyền đặt.
  */
  function denied() {
    const u = user();
    if (!u) return false;
    if (window.__LH_GATE_LOCKED === true) return true;
    const p = profile();
    return !!p && !(window.lhHasFullAccess?.(p) ?? true);
  }
  function updateAll() {
    ensureAvatar();
    const u = user();
    const p = profile();
    const admin = isAdmin();
    const pending = denied();
    document.body?.classList.toggle('hod-is-admin-final', admin);
    if (pending) {
      $('hodLoginGate')?.classList.add('hidden');
      $('hodPendingApproval')?.classList.remove('hidden');
      document.body?.classList.add('hod-locked');
      const emailEl = $('hodPendingEmail');
      if (emailEl && !emailEl.textContent) emailEl.textContent = p?.email || u.email || '';
    } else if (u) {
      hideLogin();
      $('hodPendingApproval')?.classList.add('hidden');
    } else if (window.__LH_GATE_LOCKED === true) {
      /* BLOCKED: đã signOut nhưng vẫn phải đọc được lý do; chỉ nút "Đăng xuất" trong gate mới mở cờ này. */
    } else {
      showLogin();
    }
    const top = $('hodTopAvatar');
    if (top) {
      const __ah = avatarHTML();
      if (top.dataset.av !== __ah) {
        top.innerHTML = __ah;
        top.dataset.av = __ah;
      }
      top.style.display = u && !pending ? 'grid' : 'none';
    }
    const headerAdmin = $('adminOpenBtn');
    if (headerAdmin) {
      headerAdmin.remove();
    }
    if (!admin) $('adminModal')?.classList.add('hidden');
    updateMenu();
  }
  function patchAdmin() {
    if (!window.HODSupabase || window.HODSupabase.__avatarCleanPatch) return;
    const old = window.HODSupabase.openAdmin;
    window.HODSupabase.openAdmin = function () {
      if (!window.HODSupabase.canOpenDashboard?.()) {
        $('adminModal')?.classList.add('hidden');
        alert('Tài khoản này không có quyền admin.');
        return;
      }
      return old?.apply(this, arguments);
    };
    window.HODSupabase.__avatarCleanPatch = true;
  }
  function bind() {
    $('hodGateLoginBtn')?.addEventListener('click', login);
    $('hodLogoutBtn')?.addEventListener('click', logout);
    $('hodAccountDashboard')?.addEventListener('click', openDash);
    document.addEventListener('click', e => {
      const m = $('hodAccountMenu'),
        a = $('hodTopAvatar');
      if (m && !m.contains(e.target) && a && !a.contains(e.target)) m.classList.add('hidden');
    });
    setInterval(() => {
      patchAdmin();
      updateAll();
    }, 500);
    setTimeout(() => {
      patchAdmin();
      updateAll();
    }, 250);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
})();

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
// Search khôn hơn: bỏ từ rác như what/the/are, ưu tiên đúng cụm, ẩn câu không liên quan, chỉ highlight từ quan trọng.
(function () {
  const STOPWORDS = new Set([
    'a',
    'an',
    'the',
    'and',
    'or',
    'but',
    'if',
    'then',
    'else',
    'when',
    'where',
    'why',
    'how',
    'what',
    'which',
    'who',
    'whom',
    'whose',
    'is',
    'am',
    'are',
    'was',
    'were',
    'be',
    'been',
    'being',
    'do',
    'does',
    'did',
    'done',
    'have',
    'has',
    'had',
    'having',
    'can',
    'could',
    'should',
    'would',
    'will',
    'shall',
    'may',
    'might',
    'must',
    'in',
    'on',
    'at',
    'by',
    'for',
    'from',
    'to',
    'of',
    'with',
    'without',
    'into',
    'onto',
    'over',
    'under',
    'between',
    'among',
    'about',
    'as',
    'than',
    'that',
    'this',
    'these',
    'those',
    'it',
    'its',
    'their',
    'there',
    'here',
    'two',
    'three',
    'four',
    'five',
    'one',
    'option',
    'options',
    'choose',
    'check',
    'select',
    'following',
    'main',
    'la',
    'là',
    'cua',
    'của',
    'va',
    'và',
    'cac',
    'các',
    'nhung',
    'những',
    'mot',
    'một',
    'cho',
    'voi',
    'với',
    'trong',
    'ngoai',
    'ngoài',
    'duoc',
    'được',
    'khong',
    'không',
    'nao',
    'nào',
    'gi',
    'gì',
    'hay',
    'hoac',
    'hoặc',
    'dap',
    'an',
    'dapan',
    'dapán',
    'cau',
    'câu',
  ]);

  function normText(s) {
    return String(s ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9#:\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  function splitTokens(s) {
    return normText(s).split(/\s+/).filter(Boolean);
  }
  function meaningfulTokens(q) {
    const raw = splitTokens(q);
    return raw.filter(t => {
      if (!t) return false;
      if (STOPWORDS.has(t)) return false;
      if (t.length < 3 && !/^\d+$/.test(t)) return false;
      if (/^(answer|ans|multi|multiple|chon|nhieu|lua|dap|an|dapan)$/.test(t)) return false;
      if (t.includes(':')) return false;
      return true;
    });
  }
  function parseQuery(q) {
    const raw = String(q ?? '').trim();
    const n = normText(raw);
    const p = { raw, norm: n, num: null, answer: null, multi: false, tokens: [], numericOnly: false, phrase: '' };
    p.numericOnly = /^\d+$/.test(n);
    let m = n.match(/(?:^|\s)#\s*(\d+)(?:\s|$)/) || n.match(/(?:^|\s)cau\s*(\d+)(?:\s|$)/);
    if (m) p.num = Number(m[1]);
    if (p.numericOnly) p.num = Number(n);
    m = n.match(/(?:answer|ans|dap\s*an|dapan)\s*:\s*([a-e]+)/i);
    if (m) p.answer = m[1].toUpperCase().split('').sort().join('');
    p.multi = /(^|\s)(multi|multiple|chon nhieu|nhieu dap an|nhieu lua chon)(\s|$)/.test(n);
    p.tokens = meaningfulTokens(raw).filter(t => {
      if (/^#?\d+$/.test(t) && p.num !== null) return false;
      if (/^[a-e]+$/.test(t) && p.answer) return false;
      return true;
    });
    p.phrase = p.tokens.join(' ');
    return p;
  }
  function optionText(c) {
    return Object.values(c?.options || {}).join(' ');
  }
  function correctAnswerText(c) {
    const ans = String(c?.answer || '').toUpperCase();
    const opts = c?.options || {};
    return ans
      .split('')
      .map(k => opts[k] || '')
      .join(' ');
  }
  function hasWholeNumber(text, num) {
    return new RegExp('(^|\\D)' + String(num).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?=\\D|$)').test(
      String(text ?? ''),
    );
  }
  function editDistanceOne(a, b) {
    if (a === b) return true;
    if (Math.abs(a.length - b.length) > 1) return false;
    let i = 0,
      j = 0,
      ed = 0;
    while (i < a.length && j < b.length) {
      if (a[i] === b[j]) {
        i++;
        j++;
        continue;
      }
      ed++;
      if (ed > 1) return false;
      if (a.length > b.length) i++;
      else if (a.length < b.length) j++;
      else {
        i++;
        j++;
      }
    }
    return ed + (i < a.length ? 1 : 0) + (j < b.length ? 1 : 0) <= 1;
  }
  function tokenInText(token, textNorm) {
    if (!token) return true;
    if (textNorm.includes(token)) return true;
    if (token.length < 5) return false;
    const words = textNorm.split(/\s+/).filter(w => Math.abs(w.length - token.length) <= 1);
    return words.some(w => editDistanceOne(token, w));
  }
  function countMatches(tokens, textNorm) {
    let n = 0;
    for (const t of tokens) if (tokenInText(t, textNorm)) n++;
    return n;
  }
  function scoreQuestion(c, p) {
    if (!p.raw) return { ok: true, score: 0, auto: false };
    const ansSorted = sortAns(String(c.answer || '').toUpperCase());
    if (p.answer && ansSorted !== p.answer) return { ok: false, score: -1, auto: false };
    if (p.multi && String(c.answer || '').length <= 1) return { ok: false, score: -1, auto: false };

    const qNorm = normText(c.question || '');
    const optNorm = normText(optionText(c));
    const corNorm = normText(correctAnswerText(c));
    const ansLineNorm = normText([c.answer, c.answer_text, correctAnswerText(c)].join(' '));
    const allNorm = normText([c.num, c.question, c.answer, c.answer_text, optionText(c)].join(' '));
    let score = 0,
      auto = false;

    if (p.num !== null) {
      const exact = Number(c.num) === p.num;
      const answerHasNum = hasWholeNumber([c.answer_text, correctAnswerText(c)].join(' '), p.num);
      if (p.numericOnly) {
        if (!exact && !answerHasNum) return { ok: false, score: -1, auto: false };
        score += exact ? 2000 : 850;
        auto = answerHasNum;
      } else {
        if (!exact) return { ok: false, score: -1, auto: false };
        score += 2000;
      }
    }

    if (p.answer) {
      score += 900;
      auto = true;
    }
    if (p.multi) {
      score += 350;
    }

    const tokens = p.tokens;
    if (tokens.length) {
      const qHit = countMatches(tokens, qNorm);
      const optHit = countMatches(tokens, optNorm);
      const corHit = countMatches(tokens, corNorm);
      const allHit = countMatches(tokens, allNorm);

      // Nếu query có nhiều từ quan trọng, bắt buộc khớp phần lớn từ.
      const required = tokens.length <= 2 ? tokens.length : Math.ceil(tokens.length * 0.72);
      if (allHit < required) return { ok: false, score: -1, auto: false };

      // Ưu tiên đúng cụm liên tiếp.
      if (p.phrase && qNorm.includes(p.phrase)) score += 1200;
      if (p.phrase && optNorm.includes(p.phrase)) score += 850;
      if (p.phrase && corNorm.includes(p.phrase)) {
        score += 1000;
        auto = true;
      }

      score += qHit * 180 + optHit * 95 + corHit * 160;
      if (corHit > 0 || (p.phrase && ansLineNorm.includes(p.phrase))) auto = true;

      // Phạt nặng mấy câu chỉ trúng từ quá chung rải rác.
      if (tokens.length >= 3 && qHit === 0 && optHit < required) return { ok: false, score: -1, auto: false };
      if (tokens.length >= 4 && allHit < tokens.length) score -= (tokens.length - allHit) * 220;
    } else if (!p.num && !p.answer && !p.multi) {
      return { ok: false, score: -1, auto: false };
    }

    return { ok: true, score, auto };
  }
  function smartBetter(q) {
    const p = parseQuery(q);
    if (!p.raw) return LHState.RAW;
    return LHState.RAW.map(c => ({ c, m: scoreQuestion(c, p) }))
      .filter(x => x.m.ok)
      .sort((a, b) => b.m.score - a.m.score || Number(a.c.num) - Number(b.c.num))
      .map(x => Object.assign({}, x.c, { __autoOpenAnswer: x.m.auto }));
  }
  function markText(text, query, cls = 'tokenMark') {
    const parser = typeof parseQuery === 'function' ? parseQuery : parseQ;
    const p = parser(query);
    const source = String(text ?? '');

    function escLocal(s) {
      return esc(s);
    }

    function normWithMap(s) {
      let norm = '',
        map = [],
        lastSpace = true;
      for (let i = 0; i < s.length; i++) {
        const ch = s[i];
        const n = normText(ch);
        if (n) {
          for (const c of n) {
            norm += c;
            map.push(i);
          }
          lastSpace = false;
        } else if (!lastSpace) {
          norm += ' ';
          map.push(i);
          lastSpace = true;
        }
      }
      norm = norm.trimEnd();
      while (norm.startsWith(' ')) {
        norm = norm.slice(1);
        map.shift();
      }
      return { norm, map };
    }

    // Nếu người dùng tìm bằng cả cụm câu hỏi thì tô liền cả cụm, không tách từng từ.
    if (cls === 'phraseMark' && p.norm && p.norm.length >= 6 && !p.numericOnly && !p.answer && !p.multi) {
      const nm = normWithMap(source);
      const hit = nm.norm.indexOf(p.norm);
      if (hit >= 0) {
        const start = nm.map[hit] ?? 0;
        const end = (nm.map[hit + p.norm.length - 1] ?? source.length - 1) + 1;
        return (
          escLocal(source.slice(0, start)) +
          `<mark class="searchMark phraseMark">${escLocal(source.slice(start, end))}</mark>` +
          escLocal(source.slice(end))
        );
      }
    }

    const tokens = p.numericOnly ? [String(p.num)] : (p.tokens || []).slice(0, 10);
    if (!tokens.length) return escLocal(source);
    const parts = source.match(/[\p{L}\p{N}]+|[^\p{L}\p{N}]+/gu) || [source];
    return parts
      .map(part => {
        const np = normText(part);
        if (np && tokens.some(t => np === t || np.includes(t) || t.includes(np))) {
          return `<mark class="searchMark ${cls}">${escLocal(part)}</mark>`;
        }
        return escLocal(part);
      })
      .join('');
  }
  function optionStudy(c, q) {
    return Object.entries(c.options || {})
      .map(([k, v]) => {
        const right = String(c.answer || '').includes(k);
        return `<div class="sopt ${right ? 'ans correct' : ''}"><div class="skey">${right ? '✓' : esc(k)}</div><div>${esc(k + '. ')}${markText(v, q)}</div></div>`;
      })
      .join('');
  }
  function renderStudyBetter() {
    const input = $('search');
    const q = input ? input.value || '' : '';
    if (input) input.placeholder = 'Tìm câu / đáp án: adopted laws, #26, answer:BC, multi...';
    const arr = smartBetter(q);
    const max = arr.length;
    const html = arr
      .slice(0, max)
      .map(c => {
        const auto = !!c.__autoOpenAnswer;
        return `<div class="sitem compactStudyCard ${auto ? 'autoOpenAnswer open' : ''}" data-num="${esc(c.num)}" tabindex="0">
        <div class="compactCardLine">
          <div class="compactCardMeta"><span class="snum compactSubject">CÂU ${esc(c.num)}</span></div>
          <div class="sq compactQuestionText">${markText(c.question, q, 'phraseMark')}</div>
          <div class="compactCardRight">${auto ? '<span class="answerMatchChip">Khớp đáp án</span>' : ''}<button type="button" class="studyReportBtn" data-report-num="${esc(c.num)}" title="Báo cáo câu ${esc(c.num)}">!</button><span class="expandHint"></span></div>
        </div>
        <div class="compactCardDetails"><div class="qimgs">${imgsHTML(c)}</div><div class="sopts">${optionStudy(c, q)}</div></div>
      </div>`;
      })
      .join('');
    $('studyList').innerHTML =
      html +
      (arr.length > max
        ? `<div class="more">Đang hiển thị ${max} / ${arr.length} kết quả.</div>`
        : arr.length
          ? ''
          : '<div class="more">Không tìm thấy kết quả.</div>');
  }
  function bindBetterSearch() {
    const s = $('search');
    if (s) {
      s.oninput = renderStudyBetter;
      s.placeholder = 'Tìm câu / đáp án: adopted laws, #26, answer:BC, multi...';
    }
    const list = $('studyList');
    if (list && !list.__betterSearchBound) {
      list.__betterSearchBound = true;
      list.addEventListener(
        'click',
        function (e) {
          const rb = e.target.closest('[data-report-num]');
          if (rb) {
            e.preventDefault();
            e.stopImmediatePropagation();
            window.openStudyReport?.(rb.dataset.reportNum, e);
            return;
          }
          const it = e.target.closest('.sitem');
          if (!it) return;
          e.preventDefault();
          e.stopImmediatePropagation();
          it.classList.toggle('open');
          it.classList.remove('autoOpenAnswer');
        },
        true,
      );
    }
  }

  smart = smartBetter;
  // Hai dòng `renderStudy = renderStudyBetter` / `window.renderStudy = …` ĐÃ XÓA (20260727):
  // STEP1 (renderUnified, nay ở ./library.js) ghi đè renderStudy nên chúng không vẽ thư viện,
  // và phải xóa để hàm chuyển tiếp `renderStudy` (~dòng 613) không bị gán trần đè lên —
  // từ file khác thì library.js chỉ gán được `window.renderStudy`.
  // `smart = smartBetter` ngay trên vẫn SỐNG; `renderStudyBetter()` vẫn được gọi trực tiếp
  // ở DOMContentLoaded dưới đây, y như trước.
  document.addEventListener('DOMContentLoaded', function () {
    bindBetterSearch();
    setTimeout(bindBetterSearch, 100);
    setTimeout(bindBetterSearch, 600);
    try {
      renderStudyBetter();
    } catch (e) {
      lhWarn('FINAL_SMART_SEARCH_STOPWORDS_RELEVANCE_20260614', e);
    }
  });
})();

// ===== COPILOT_MERGED_ADD_QUESTION_DISPLAY_VERSION_20260629 =====
// Đã gộp các bản vá nút + / form thêm câu để tránh chồng lấn. Giữ giao diện đang hiển thị: form đẹp, nút + chỉ ở tab Thư viện và ẩn khi modal mở.
(function () {
  const SUBJECT_STORE = 'learninghub_subject_code_merged_v1';
  const $ = id => document.getElementById(id);
  const subjectCode = () => localStorage.getItem(SUBJECT_STORE) || '';
  const client = () => window.HODSupabase?.__client || null;
  const user = () => window.HODSupabase?.getUser?.() || null;
  const profile = () => window.HODSupabase?.getProfile?.() || null;
  const esc = s =>
    String(s ?? '').replace(
      /[&<>"']/g,
      c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );
  const ADD_IMG_DRAFT_KEY = 'learninghub_add_question_images_draft_v1';
  function saveAddImagesDraft() {
    try {
      localStorage.setItem(ADD_IMG_DRAFT_KEY, JSON.stringify(addImages));
    } catch (e) {
      lhWarn('COPILOT_MERGED_ADD_QUESTION_DISPLAY_VERSION_20260629', e);
    }
  }
  function loadAddImagesDraft() {
    try {
      return JSON.parse(localStorage.getItem(ADD_IMG_DRAFT_KEY) || '[]') || [];
    } catch (e) {
      return [];
    }
  }
  function clearAddImagesDraft() {
    try {
      localStorage.removeItem(ADD_IMG_DRAFT_KEY);
    } catch (e) {
      lhWarn('COPILOT_MERGED_ADD_QUESTION_DISPLAY_VERSION_20260629', e);
    }
  }
  let addImages = loadAddImagesDraft();
  let addUploading = 0;

  function canManage() {
    const p = profile();
    const role = String(p?.role || '').toLowerCase();
    return (
      !!user() && (role === 'admin' || role === 'editor') && !(p?.blocked || p?.is_blocked || p?.status === 'blocked')
    );
  }
  function isAllTab() {
    return $('study')?.classList.contains('active') || document.querySelector('.tab.active')?.dataset?.tab === 'study';
  }
  function nextNum() {
    const nums = (LHState.RAW || []).map(q => Number(q.num)).filter(Number.isFinite);
    return nums.length ? Math.max(...nums) + 1 : 1;
  }
  function notifyOk(msg) {
    if (typeof notify === 'function') notify(msg);
    else alert(msg);
  }

  function ensurePlus() {
    let btn = $('addQuestionFab');
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'addQuestionFab';
      btn.type = 'button';
      btn.title = 'Thêm câu hỏi';
      btn.textContent = '+';
      document.body.appendChild(btn);
    }
    btn.classList.add('prettyAddFab');
    btn.innerHTML = '<span>+</span>'; // khóa 1 icon, không tạo bóng/ghost
    btn.onclick = function (e) {
      e.preventDefault();
      e.stopPropagation();
      openPrettyAddModal();
    };
    return btn;
  }

  function modalOpen() {
    const m = $('addQuestionModal');
    return !!m && !m.classList.contains('hidden') && getComputedStyle(m).display !== 'none';
  }

  function updatePlus() {
    const btn = ensurePlus();
    const open = modalOpen();
    const show = canManage() && isAllTab() && !open;
    document.body.classList.toggle('add-question-visible', show);
    document.body.classList.toggle('add-question-modal-open', open);
    btn.classList.toggle('hidden', !show);
    btn.setAttribute('aria-hidden', show ? 'false' : 'true');
    btn.style.setProperty('display', show ? 'flex' : 'none', 'important');
    btn.style.setProperty('visibility', show ? 'visible' : 'hidden', 'important');
    btn.style.setProperty('opacity', show ? '1' : '0', 'important');
    btn.style.setProperty('pointer-events', show ? 'auto' : 'none', 'important');
    if (!canManage() || !isAllTab()) $('addQuestionModal')?.classList.add('hidden');
  }

  function cleanupLimitText() {
    const list = $('studyList');
    if (!list) return;
    list.querySelectorAll('.more').forEach(x => {
      if (/Đang hiển thị\s+\d+\s*\//i.test(x.textContent || '')) x.remove();
    });
  }

  function getImageFilesFromPaste(e) {
    const items = [...(e.clipboardData?.items || [])];
    return items
      .filter(item => item.kind === 'file' && String(item.type || '').startsWith('image/'))
      .map(item => item.getAsFile())
      .filter(Boolean);
  }

  async function uploadPrettyImageFiles(files, sourceLabel) {
    files = [...(files || [])].filter(file => file && String(file.type || '').startsWith('image/'));
    const st = $('addUploadStatus');
    const input = $('addImgUpload');
    const saveBtn = $('saveAddQuestion');
    if (!files.length) return;
    if (!window.__LHUploadCloudinary) {
      alert('Chưa sẵn sàng upload Cloudinary. Tải lại trang rồi thử lại.');
      return;
    }
    addUploading++;
    if (input) input.disabled = true;
    if (saveBtn) saveBtn.disabled = true;
    if (st) {
      st.style.display = 'block';
      st.textContent = 'Đang upload ' + files.length + ' ảnh lên Cloudinary...';
    }
    notifyOk(sourceLabel === 'paste' ? 'Đang upload ảnh vừa dán...' : 'Đang upload ảnh lên Cloudinary...');
    try {
      let done = 0;
      for (const file of files) {
        const uploaded = await window.__LHUploadCloudinary(file);
        if (uploaded) addImages.push(uploaded);
        done++;
        if (st) st.textContent = 'Đang upload ảnh ' + done + '/' + files.length + '...';
      }
      if (window.__LHCleanImages) addImages = window.__LHCleanImages(addImages);
      saveAddImagesDraft();
      renderPrettyImages();
      if (st) {
        st.textContent = 'Đã upload xong. URL nằm dưới ảnh.';
        setTimeout(() => {
          if (addUploading === 0) st.style.display = 'none';
        }, 2200);
      }
      notifyOk('Đã upload ảnh thành URL');
    } catch (err) {
      if (st) st.textContent = 'Upload lỗi: ' + (err.message || err);
      alert(err.message || err);
    } finally {
      addUploading = Math.max(0, addUploading - 1);
      if (addUploading === 0) {
        if (input) {
          input.disabled = false;
          input.value = '';
        }
        if (saveBtn) saveBtn.disabled = false;
      }
    }
  }

  function ensurePrettyModal() {
    let modal = $('addQuestionModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'addQuestionModal';
      modal.className = 'modal hidden addQuestionModal';
      document.body.appendChild(modal);
    }
    if (modal.dataset.prettyVersion === '20260614') return modal;
    modal.dataset.prettyVersion = '20260614';
    modal.className = 'modal hidden addQuestionModal';
    modal.innerHTML = `
      <div class="box editPreviewBox quizEditLayoutV2">
        <button type="button" class="modalX" id="addQuestionClose">×</button>
        <div class="v7Head editPreviewHead">
          <div>
            <span class="v7Label">THÊM MỚI</span>
            <h2>Thêm câu hỏi mới</h2>
            <p class="v7Hint">Nhập nội dung câu hỏi, các đáp án và upload ảnh nếu có.</p>
          </div>
        </div>
        <article class="v7Card editPreviewCard" style="margin:0!important; border:0!important; background:transparent!important; padding:0!important;">
          <div class="editPreviewTwoColumns">
            <div class="editPreviewLeftCol">
              <div class="v7Field">
                <label>Câu hỏi</label>
                <textarea id="addQuestionText" placeholder="Nhập nội dung câu hỏi..." style="min-height: 120px;"></textarea>
              </div>
              <div class="v7Field" style="margin-top: 10px;">
                <label>Đáp án đúng</label>
                <input id="addQuestionAnswer" placeholder="Ví dụ: A hoặc BC">
              </div>
              <div class="v7Field" style="margin-top: 10px;">
                <label>Số câu</label>
                <input id="addQuestionNum" type="number" min="1" placeholder="Tự lấy số tiếp theo nếu để trống">
              </div>
              <div class="v7Field" style="margin-top: 10px;">
                <label>Hình ảnh</label>
                <input id="addImgUpload" type="file" accept="image/*" multiple>
                <div class="pasteImageHint addPasteImageHint">Có thể chụp/copy ảnh rồi bấm Ctrl + V trong khung này để tự upload URL.</div>
                <div id="addUploadStatus" style="display:none;margin-top:7px;color:var(--gold2);font-weight:900;font-size:.86rem;">Đang upload ảnh...</div>
                <div id="addImgs" class="editImgs addImgs" style="margin-top: 8px;">Chưa có hình.</div>
              </div>
            </div>
            <div class="editPreviewRightCol">
              <div class="v7Field" style="margin: 0!important;">
                <label>Các đáp án</label>
                <div id="editPreviewOptions" class="v7Options">
                  <div class="v7OptRow">
                    <div class="v7Key">A</div>
                    <input id="addOptA" placeholder="Nhập đáp án A">
                    <button class="v7DelOpt" type="button" onclick="document.getElementById('addOptA').value=''">×</button>
                  </div>
                  <div class="v7OptRow" style="margin-top: 8px;">
                    <div class="v7Key">B</div>
                    <input id="addOptB" placeholder="Nhập đáp án B">
                    <button class="v7DelOpt" type="button" onclick="document.getElementById('addOptB').value=''">×</button>
                  </div>
                  <div class="v7OptRow" style="margin-top: 8px;">
                    <div class="v7Key">C</div>
                    <input id="addOptC" placeholder="Nhập đáp án C">
                    <button class="v7DelOpt" type="button" onclick="document.getElementById('addOptC').value=''">×</button>
                  </div>
                  <div class="v7OptRow" style="margin-top: 8px;">
                    <div class="v7Key">D</div>
                    <input id="addOptD" placeholder="Nhập đáp án D">
                    <button class="v7DelOpt" type="button" onclick="document.getElementById('addOptD').value=''">×</button>
                  </div>
                  <div class="v7OptRow" style="margin-top: 8px;">
                    <div class="v7Key">E</div>
                    <input id="addOptE" placeholder="Có thể bỏ trống (E)">
                    <button class="v7DelOpt" type="button" onclick="document.getElementById('addOptE').value=''">×</button>
                  </div>
                </div>
              </div>
              <div class="v7Bottom" style="margin-top: 20px; display: flex; justify-content: flex-end; gap: 8px; width: 100%;">
                <button type="button" class="btn" id="cancelAddQuestion">Đóng</button>
                <button type="button" class="primary" id="saveAddQuestion">Lưu câu hỏi</button>
              </div>
            </div>
          </div>
        </article>
      </div>`;

    $('addQuestionClose').onclick = closePrettyAddModal;
    $('cancelAddQuestion').onclick = closePrettyAddModal;
    $('saveAddQuestion').onclick = savePrettyQuestion;
    $('addImgUpload').onchange = e => uploadPrettyImageFiles(e.target.files, 'file');
    modal.addEventListener('paste', e => {
      const files = getImageFilesFromPaste(e);
      if (!files.length) return;
      e.preventDefault();
      uploadPrettyImageFiles(files, 'paste');
    });
    modal.addEventListener('dragover', e => {
      const hasFile = [...(e.dataTransfer?.items || [])].some(item => item.kind === 'file');
      if (!hasFile) return;
      e.preventDefault();
      modal.classList.add('dragImageOver');
    });
    modal.addEventListener('dragleave', () => modal.classList.remove('dragImageOver'));
    modal.addEventListener('drop', e => {
      const files = [...(e.dataTransfer?.files || [])].filter(file => String(file.type || '').startsWith('image/'));
      if (!files.length) return;
      e.preventDefault();
      modal.classList.remove('dragImageOver');
      uploadPrettyImageFiles(files, 'drop');
    });
    $('addImgs').onclick = e => {
      const b = e.target.closest('[data-add-rm]');
      if (!b) return;
      addImages.splice(Number(b.dataset.addRm), 1);
      saveAddImagesDraft();
      renderPrettyImages();
    };
    modal.addEventListener('mousedown', e => {
      if (e.target === modal) closePrettyAddModal();
    });
    return modal;
  }

  function renderPrettyImages() {
    const box = $('addImgs');
    if (!box) return;
    box.innerHTML = addImages.length
      ? addImages
          .map(
            (im, i) => `
      <div class="editImg addPreviewImg">
        <button type="button" class="rm" data-add-rm="${i}">×</button>
        <img src="${esc(im.src)}" alt="" loading="lazy" decoding="async">
        <input class="imgUrlBox" value="${esc(im.src)}" readonly onclick="this.select()" title="Bấm để chọn URL ảnh" style="margin-top:6px;width:100%;max-width:260px;border:1px solid rgba(200,169,110,.24);border-radius:10px;background:rgba(0,0,0,.22);color:var(--gold2);padding:7px;font-size:.72rem;">
      </div>`,
          )
          .join('')
      : 'Chưa có hình.';
  }

  function openPrettyAddModal() {
    if (!canManage()) return;
    if (!isAllTab()) return;
    const modal = ensurePrettyModal();
    addImages = loadAddImagesDraft();
    $('addQuestionNum').value = nextNum();
    $('addQuestionText').value = '';
    ['A', 'B', 'C', 'D', 'E'].forEach(k => {
      const el = $('addOpt' + k);
      if (el) el.value = '';
    });
    $('addQuestionAnswer').value = '';
    renderPrettyImages();
    modal.classList.remove('hidden');
    updatePlus();
    setTimeout(() => $('addQuestionText')?.focus(), 80);
  }
  function closePrettyAddModal() {
    $('addQuestionModal')?.classList.add('hidden');
    setTimeout(updatePlus, 30);
  }

  function answerTextLine(answer, options) {
    return String(answer || '')
      .toUpperCase()
      .split('')
      .filter(Boolean)
      .map(k => k + '. ' + (options[k] || ''))
      .join('; ');
  }
  async function savePrettyQuestion() {
    if (!canManage()) return alert('Tài khoản này không có quyền thêm câu hỏi.');
    if (addUploading > 0) return alert('Ảnh đang upload, chờ xong rồi lưu nha.');
    const c = client();
    if (!c) return alert('Chưa kết nối Supabase.');
    const subject = subjectCode();
    if (!subject) return alert('Bạn cần chọn môn trước.');

    const num = Number(($('addQuestionNum')?.value || '').trim()) || nextNum();
    const question = ($('addQuestionText')?.value || '').trim();
    const answer = ($('addQuestionAnswer')?.value || '')
      .trim()
      .toUpperCase()
      .replace(/[^A-E]/g, '');
    const options = {};
    ['A', 'B', 'C', 'D', 'E'].forEach(k => {
      const v = ($('addOpt' + k)?.value || '').trim();
      if (v) options[k] = v;
    });

    if (!question) return alert('Nhập câu hỏi trước.');
    if (Object.keys(options).length < 2) return alert('Nhập ít nhất 2 đáp án.');
    if (!answer) return alert('Nhập đáp án đúng, ví dụ A hoặc BC.');
    for (const k of answer) {
      if (!options[k]) return alert('Đáp án đúng ' + k + ' chưa có nội dung.');
    }

    // Ghi câu hỏi mới vào Turso qua /api/admin-action (nguồn dữ liệu chính khi F5).
    // Trước đây insert thẳng Supabase nên ảnh/câu hỏi không có khi reload (app đọc từ Turso).
    const imgs =
      typeof window.__LHCleanImages === 'function' ? window.__LHCleanImages(addImages || []) : addImages || [];
    const payload = {
      subject_code: subject,
      num,
      question,
      options,
      answer,
      answer_text: answerTextLine(answer, options),
      images: imgs,
      has_image: imgs.length > 0,
      updated_at: new Date().toISOString(),
    };
    const btn = $('saveAddQuestion');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Đang lưu...';
    }
    try {
      const u = user();
      const res = await fetch('/api/admin-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ user_id: u?.id, action: 'add_question', payload: { question_data: payload } }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || out.error) throw new Error(out.error || 'Không lưu được vào Turso (HTTP ' + res.status + ')');
      clearAddImagesDraft();
      addImages = [];
      closePrettyAddModal();
      notifyOk('Đã thêm câu hỏi');
      if (typeof window.clearLearningHubQuestionCache === 'function') window.clearLearningHubQuestionCache();
      if (typeof window.loadCurrentSubjectOnly === 'function') await window.loadCurrentSubjectOnly(true);
      else if (window.HODSupabase?.loadQuestionsFromSupabase) await window.HODSupabase.loadQuestionsFromSupabase();
      try {
        const idx = (LHState.RAW || []).findIndex(q => Number(q.num) === num);
        if (idx >= 0) {
          LHState.pool = [...LHState.RAW];
          LHState.ci = idx;
          LHState.flipped = false;
          renderCard?.();
          renderStudy?.();
        }
      } catch (e) {
        lhWarn('COPILOT_MERGED_ADD_QUESTION_DISPLAY_VERSION_20260629', e);
      }
    } catch (err) {
      alert('Thêm câu hỏi thất bại: ' + (err?.message || err));
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Lưu câu hỏi';
      }
    }
  }

  function boot() {
    ensurePlus();
    const modal = ensurePrettyModal();
    cleanupLimitText();
    updatePlus();
    if (modal && !modal.__mergedAddObserver) {
      modal.__mergedAddObserver = true;
      const obs = new MutationObserver(() => setTimeout(updatePlus, 30));
      obs.observe(modal, { attributes: true, attributeFilter: ['class', 'style'] });
      modal.addEventListener('click', () => setTimeout(updatePlus, 30), true);
      modal.addEventListener('mousedown', () => setTimeout(updatePlus, 30), true);
    }
    document.querySelectorAll('.tab').forEach(t => {
      if (t.__prettyAddTabBound) return;
      t.__prettyAddTabBound = true;
      t.addEventListener('click', () =>
        setTimeout(() => {
          cleanupLimitText();
          updatePlus();
        }, 80),
      );
    });
  }
  window.openAddQuestionModal = openPrettyAddModal;
  window.openPrettyAddModal = openPrettyAddModal;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  setTimeout(boot, 300);
  setTimeout(boot, 1000);
  setInterval(updatePlus, 250);
})();
// ===== END COPILOT_MERGED_ADD_QUESTION_DISPLAY_VERSION_20260629 =====

/*
  ===== FINAL_DELETE_BUTTON_BESIDE_OPEN_20260614 + FIX_DELETE_NO_TOGGLE_20260627 — ĐÃ XÓA (20260727) =====
  Chức năng "xóa câu" trong THƯ VIỆN của app học sinh đã được bỏ theo yêu cầu.
  Trước đó: FINAL_DELETE_BUTTON_BESIDE_OPEN gắn nút qua lớp bọc renderStudy (đã chết vì
  LIBRARY_UX_STEP1_STABLE_RENDER ghi đè trong setTimeout), FIX_DELETE_NO_TOGGLE giữ handler
  capture [data-delete-num] + POST /api/admin-action {action:"delete_question"}.
  Nay cả nút lẫn handler đều bỏ. Muốn xóa câu thì dùng TRANG ADMIN (adminCore vẫn có luồng
  riêng) — endpoint delete_question ở api/controllers/admin.js vẫn còn cho admin dùng.
  ĐỪNG thêm lại nút xóa vào card() của STEP1: đây là quyết định sản phẩm, không phải bug.
*/

// ===== FINAL_PROMPT_MODAL_RUNTIME_FIX_20260625 =====
(function () {
  function escPrompt(s) {
    return String(s ?? '').replace(
      /[&<>"']/g,
      c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );
  }
  function getPromptText() {
    return (
      window.__ADD_SUBJECT_AI_PROMPT ||
      window.AI_PROMPT ||
      document.getElementById('userAiPromptText')?.textContent ||
      ''
    );
  }
  window.__openUserAIPromptModal = function () {
    const prompt = getPromptText();
    let modal = document.getElementById('userPromptModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'userPromptModal';
      modal.className = 'modal userPromptModal hidden';
      modal.innerHTML = `<div class="box userPromptModalBox">
        <button class="modalX" type="button" id="userPromptModalClose">×</button>
        <div class="userPromptModalHead">
          <div>
            <span class="userPromptLabel">PROMPT TẠO CÂU HỎI</span>
            <h2>Xem prompt</h2>
            <p>Copy prompt này rồi dán vào Gemini / ChatGPT / Claude kèm tài liệu môn học.</p>
          </div>
          <button class="primary userPromptCopyTop" type="button" id="userPromptModalCopy">📋 Sao chép</button>
        </div>
        <pre class="userPromptModalPre" id="userPromptModalPre"></pre>
      </div>`;
      modal.addEventListener('mousedown', e => {
        if (e.target === modal) window.__closeUserAIPromptModal();
      });
      document.body.appendChild(modal);
      document.getElementById('userPromptModalClose')?.addEventListener('click', window.__closeUserAIPromptModal);
      document.getElementById('userPromptModalCopy')?.addEventListener('click', window.__copyUserAIPrompt);
    }
    const pre = document.getElementById('userPromptModalPre');
    if (pre) pre.textContent = prompt;
    modal.classList.remove('hidden');
  };
  window.__closeUserAIPromptModal = function () {
    document.getElementById('userPromptModal')?.classList.add('hidden');
  };
  window.__copyUserAIPrompt = function () {
    const prompt = getPromptText();
    const done = () => {
      const btn = document.getElementById('btnCopyPrompt');
      if (btn) {
        const oldText = btn.innerHTML;
        btn.innerHTML = '✅ Đã copy';
        setTimeout(() => {
          btn.innerHTML = oldText;
        }, 1800);
      }
      if (typeof notify === 'function') notify('Đã copy prompt!');
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(prompt)
        .then(done)
        .catch(() => {
          const ta = document.createElement('textarea');
          ta.value = prompt;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          ta.remove();
          done();
        });
    } else {
      const ta = document.createElement('textarea');
      ta.value = prompt;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      done();
    }
  };
  document.addEventListener(
    'click',
    function (e) {
      const viewBtn = e.target.closest && e.target.closest('#btnViewPrompt,.aiViewPromptBtn');
      if (viewBtn) {
        e.preventDefault();
        e.stopPropagation();
        window.__openUserAIPromptModal();
        return;
      }
      const copyBtn = e.target.closest && e.target.closest('#btnCopyPrompt');
      if (copyBtn) {
        e.preventDefault();
        e.stopPropagation();
        window.__copyUserAIPrompt();
      }
    },
    true,
  );
})();

// ===== FIX_DELETE_IMPORT_FILE_20260625 =====
// Sửa nút "Xóa file" trong bước Import môn học.
(function () {
  function $(id) {
    return document.getElementById(id);
  }
  function notifySafe(msg) {
    if (typeof notify === 'function') notify(msg);
    else console.log(msg);
  }
  window.__clearUserImportFile = function () {
    window.__selectedImportFile = null;
    if (window.LHSubjectImport) {
      window.LHSubjectImport.resetSubjectImportState();
    }

    const fileInput = $('userImportFile');
    const hiddenData = $('userImportData');
    const dropZone = $('importDropZone');
    const fileCard = $('userImportFileCard');
    const fileName = $('userImportFileName');
    const fileMeta = $('userImportFileMeta');
    const previewBtn = $('previewImportBtn');
    const saveBtn = $('userImportBtn');

    if (fileInput) fileInput.value = '';
    if (hiddenData) hiddenData.value = '';
    if (dropZone) dropZone.classList.remove('hidden');
    if (fileCard) fileCard.classList.add('hidden');
    if (fileName) fileName.textContent = 'Chưa chọn file';
    if (fileMeta) fileMeta.textContent = 'File import câu hỏi';
    if (previewBtn) {
      previewBtn.classList.add('hidden');
      previewBtn.disabled = true;
    }
    if (saveBtn) saveBtn.disabled = true;

    localStorage.removeItem('learninghub_add_subject_file_name_v1');
    localStorage.removeItem('learninghub_add_subject_file_size_v1');
    localStorage.removeItem('learninghub_add_subject_file_data_v1');
    localStorage.removeItem('learninghub_add_subject_file_previewed_v1');

    window.__previewSelections = {};
    try {
      window.__closeImportPreviewModal?.();
    } catch (e) {
      lhWarn('FIX_DELETE_IMPORT_FILE_20260625', e);
    }
    notifySafe('Đã xóa file import');
  };

  document.addEventListener(
    'click',
    function (e) {
      const btn = e.target.closest?.('.removeFileBtn');
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      window.__clearUserImportFile();
    },
    true,
  );
})();

// ===== PROMPT_STEP_UX_UI_POLISH_20260625 =====
// Nâng cấp giao diện bước "Lấy Prompt" trong form thêm môn.
(function () {
  function $(id) {
    return document.getElementById(id);
  }
  function enhancePromptStep() {
    const step = $('addStep2');
    if (!step || step.dataset.promptPolished === '1') return;
    step.dataset.promptPolished = '1';
    step.classList.add('promptPolished');
    step.innerHTML = `
      <div class="promptStepGrid">
        <section class="promptMainCard">
          <div class="promptEyebrow">Bước 2 · Tạo file câu hỏi</div>
          <h3 class="promptMainTitle">Lấy prompt rồi đưa tài liệu cho AI</h3>
          <p class="promptMainDesc">Bấm sao chép prompt, dán vào AI bạn muốn dùng, sau đó gửi kèm tài liệu môn học. AI sẽ trả về file câu hỏi để import ở bước tiếp theo.</p>

          <div class="promptActionGrid">
            <button class="aiCopyBtn" type="button" onclick="window.__copyUserAIPrompt()" id="btnCopyPrompt">📋 Sao chép prompt</button>
            <button class="aiViewPromptBtn" type="button" onclick="window.__openUserAIPromptModal()" id="btnViewPrompt">👁 Xem prompt</button>
          </div>

          <div class="promptMiniGuide">
            <div class="guideRow"><div class="guideNum">1</div><div><b>Copy prompt</b><span>Prompt đã có sẵn format JSON đúng cho hệ thống.</span></div></div>
            <div class="guideRow"><div class="guideNum">2</div><div><b>Dán vào AI + gửi tài liệu</b><span>Gửi PDF, Word, slide hoặc nội dung môn học cho AI.</span></div></div>
            <div class="guideRow"><div class="guideNum">3</div><div><b>Tải file .md / .txt</b><span>Sau khi AI tạo xong, qua bước Import để lưu môn học.</span></div></div>
          </div>
        </section>

        <aside class="promptSideCard">
          <div class="promptToolTitle">Chọn công cụ AI</div>
          <div class="promptToolGrid">
            <a href="https://gemini.google.com" target="_blank" class="aiToolBtn gemini">✦ Gemini</a>
            <a href="https://chatgpt.com" target="_blank" class="aiToolBtn chatgpt">◉ ChatGPT</a>
            <a href="https://claude.ai" target="_blank" class="aiToolBtn claude">◈ Claude</a>
          </div>
          <div class="promptNoteBox">Mẹo: nếu tài liệu dài, hãy yêu cầu AI tạo từng phần rồi gộp lại thành một file JSON.</div>
        </aside>
      </div>

      <div class="step-actions">
        <button class="btn" type="button" onclick="window.__switchStep(1)">⬅ Quay lại</button>
        <button class="primary" type="button" onclick="window.__switchStep(3)">Đã có file, tiếp tục ➔</button>
      </div>
    `;
  }
  const oldSwitch = window.__switchStep;
  window.__switchStep = function (step) {
    if (typeof oldSwitch === 'function') oldSwitch.apply(this, arguments);
    setTimeout(() => {
      if (Number(step) === 2) enhancePromptStep();
    }, 0);
  };
  document.addEventListener(
    'click',
    function (e) {
      const btn = e.target.closest?.('[onclick*="__switchStep(2)"]');
      if (btn) setTimeout(enhancePromptStep, 0);
    },
    true,
  );
  document.addEventListener('DOMContentLoaded', () => setTimeout(enhancePromptStep, 800));
})();

// ===== PROMPT_STEP_INSIDE_PANEL_FIX_20260625 =====
// Xóa nút "Sao chép prompt" bị trôi ra ngoài khung tab lớn.
(function () {
  function cleanStrayPromptButtons() {
    document
      .querySelectorAll(
        '.subjectGate .polishedSubjectPanel > .aiCopyBtn, .subjectGate .polishedSubjectPanel > #btnCopyPrompt, .subjectGate > .aiCopyBtn, .subjectGate > #btnCopyPrompt',
      )
      .forEach(btn => {
        if (!btn.closest('#addStep2')) btn.remove();
      });
  }
  document.addEventListener('DOMContentLoaded', () => {
    cleanStrayPromptButtons();
    setTimeout(cleanStrayPromptButtons, 300);
    setTimeout(cleanStrayPromptButtons, 1000);
  });
  document.addEventListener('click', () => setTimeout(cleanStrayPromptButtons, 0), true);
})();

// ===== REMOVE_PROMPT_GUIDE_ROWS_20260625 =====
// Bỏ 3 dòng hướng dẫn trong bước Lấy Prompt.
(function () {
  function removePromptGuideRows() {
    document.querySelectorAll('#addStep2 .promptMiniGuide').forEach(el => el.remove());
  }
  document.addEventListener('DOMContentLoaded', () => {
    removePromptGuideRows();
    setTimeout(removePromptGuideRows, 300);
    setTimeout(removePromptGuideRows, 1000);
  });
  document.addEventListener('click', () => setTimeout(removePromptGuideRows, 0), true);
})();

// ===== FIX_PROMPT_MODAL_SCOPE_REMOVE_TIP_20260625 =====
// Sửa modal "Xem prompt" để không ảnh hưởng khung lớn + bỏ ô mẹo.
(function () {
  function cleanPromptTip() {
    document.querySelectorAll('#addStep2 .promptNoteBox, .promptNoteBox').forEach(el => el.remove());
  }
  function patchPromptModal() {
    const modal = document.getElementById('userPromptModal');
    if (!modal) return;
    modal.classList.remove('modal');
    modal.classList.add('userPromptModal');
    const box = modal.querySelector('.userPromptModalBox');
    if (box) box.classList.remove('box');
  }
  const oldOpen = window.__openUserAIPromptModal;
  window.__openUserAIPromptModal = function () {
    if (typeof oldOpen === 'function') oldOpen.apply(this, arguments);
    setTimeout(() => {
      patchPromptModal();
      cleanPromptTip();
    }, 0);
  };
  document.addEventListener('DOMContentLoaded', () => {
    cleanPromptTip();
    patchPromptModal();
    setTimeout(() => {
      cleanPromptTip();
      patchPromptModal();
    }, 300);
    setTimeout(() => {
      cleanPromptTip();
      patchPromptModal();
    }, 1000);
  });
  document.addEventListener(
    'click',
    () =>
      setTimeout(() => {
        cleanPromptTip();
        patchPromptModal();
      }, 0),
    true,
  );
})();

// ===== IMPORT_PREVIEW_INLINE_EDIT_20260625 =====
// Sửa trực tiếp ngay trên card xem trước, không mở modal riêng.
(function () {
  function escHtml(s) {
    return String(s ?? '').replace(
      /[&<>"']/g,
      c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );
  }
  function getPreviewData(data) {
    const arr = data || window.__previewImportData || [];
    window.__previewImportData = arr;
    return arr;
  }
  function opt(q, k) {
    return q?.options?.[k] || '';
  }
  window.__previewQualityFilter = 'all';

  function autoDetectQuality(q) {
    const hasImg = !!(q.has_image || (q.images && q.images.length > 0));
    let risk = q.error_risk || '';
    let reason = q.error_risk_reason || '';
    if (!risk) {
      if (
        hasImg &&
        (!q.images ||
          !q.images.length ||
          q.images.some(im => {
            const src = typeof im === 'string' ? im : im.src || im.url || '';
            return !src || src.includes('URL_') || src.includes('MÔ_TẢ');
          }))
      ) {
        risk = 'high';
        reason = reason || 'Câu cần hình ảnh nhưng chưa có ảnh thực tế';
      } else if (String(q.answer || '').length > 1) {
        risk = 'medium';
        reason = reason || 'Câu có nhiều đáp án đúng, cần kiểm tra kỹ';
      } else {
        risk = 'low';
      }
    }
    q.has_image = hasImg;
    q.error_risk = risk;
    q.error_risk_reason = reason;
  }
  function riskLabel(r) {
    return { low: 'Thấp', medium: 'Trung bình', high: 'Cao' }[r] || r;
  }
  function riskColor(r) {
    return { low: '#27ae60', medium: '#f39c12', high: '#e74c3c' }[r] || '#999';
  }

  function renderQualityStats(data) {
    var stats = document.getElementById('importPreviewStats');
    if (!stats) return;
    var imgCount = data.filter(function (q) {
      return q.has_image;
    }).length;
    var highCount = data.filter(function (q) {
      return q.error_risk === 'high';
    }).length;
    var medCount = data.filter(function (q) {
      return q.error_risk === 'medium';
    }).length;
    var lowCount = data.filter(function (q) {
      return q.error_risk === 'low';
    }).length;
    var f = window.__previewQualityFilter;
    stats.textContent = '';
    var statRow = document.createElement('div');
    statRow.className = 'previewStatRow';
    var statItems = [
      { text: data.length + ' câu', color: '' },
      { text: imgCount + ' có ảnh', color: '#3498db' },
      { text: highCount + ' rủi ro cao', color: '#e74c3c' },
      { text: medCount + ' trung bình', color: '#f39c12' },
      { text: lowCount + ' thấp', color: '#27ae60' },
    ];
    statItems.forEach(function (item) {
      var span = document.createElement('span');
      span.className = 'previewStatItem';
      span.textContent = item.text;
      if (item.color) span.style.color = item.color;
      statRow.appendChild(span);
    });
    var filterRow = document.createElement('div');
    filterRow.className = 'previewFilterRow';
    var filters = [
      { key: 'all', label: 'Thư viện', border: '' },
      { key: 'has_image', label: '📷 Có ảnh', border: '' },
      { key: 'high', label: 'Rủi ro cao', border: '#e74c3c' },
      { key: 'medium', label: 'Trung bình', border: '#f39c12' },
      { key: 'low', label: 'Thấp', border: '#27ae60' },
    ];
    filters.forEach(function (fl) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'previewFilterBtn' + (f === fl.key ? ' active' : '');
      btn.textContent = fl.label;
      if (fl.border) btn.style.borderColor = fl.border;
      btn.addEventListener('click', function () {
        window.__setQualityFilter(fl.key);
      });
      filterRow.appendChild(btn);
    });
    stats.appendChild(statRow);
    stats.appendChild(filterRow);
  }

  window.__setQualityFilter = function (f) {
    window.__previewQualityFilter = f;
    const data = getPreviewData();
    renderQualityStats(data);
    renderQualityList(data);
  };

  window.__toggleQualityImage = function (i, val) {
    const data = getPreviewData();
    if (data[i]) {
      data[i].has_image = val;
      renderQualityStats(data);
    }
  };

  window.__setQualityRisk = function (i, val) {
    const data = getPreviewData();
    if (data[i]) {
      data[i].error_risk = val;
      renderQualityStats(data);
      const card = document.querySelector(`[data-pcard="${i}"]`);
      if (card) {
        card.style.borderLeftColor = riskColor(val);
        card.style.background =
          { low: 'rgba(39,174,96,0.08)', medium: 'rgba(243,156,18,0.08)', high: 'rgba(231,76,60,0.08)' }[val] || '';
        const badge = card.querySelector('.riskBadge');
        if (badge) {
          badge.style.background = riskColor(val);
          badge.textContent = riskLabel(val);
        }
      }
    }
  };

  function renderQualityList(data) {
    var list = document.getElementById('importPreviewList');
    if (!list) return;
    var f = window.__previewQualityFilter;
    var filtered = data.filter(function (q) {
      if (f === 'all') return true;
      if (f === 'has_image') return q.has_image;
      return q.error_risk === f;
    });
    list.textContent = '';
    if (!filtered.length) {
      var empty = document.createElement('div');
      empty.style.cssText = 'text-align:center;padding:30px;opacity:.6';
      empty.textContent = 'Không có câu hỏi nào phù hợp bộ lọc.';
      list.appendChild(empty);
      return;
    }
    filtered.forEach(function (q) {
      var i = data.indexOf(q);
      list.appendChild(buildCard(q, i));
    });
  }

  function renderPreviewInline(data) {
    data = getPreviewData(data);
    data.forEach(autoDetectQuality);
    window.__previewQualityFilter = 'all';
    let modal = document.getElementById('importPreviewModal');
    if (modal) {
      modal.remove();
      modal = null;
    }
    modal = document.createElement('div');
    modal.id = 'importPreviewModal';
    modal.className = 'modal importPreviewModal';
    var box = document.createElement('div');
    box.className = 'box importPreviewModalBox';
    var closeBtn = document.createElement('button');
    closeBtn.className = 'modalX';
    closeBtn.type = 'button';
    closeBtn.textContent = '×';
    closeBtn.onclick = function () {
      window.__closeImportPreviewModal();
    };
    var head = document.createElement('div');
    head.className = 'importPreviewHead';
    var headLeft = document.createElement('div');
    var label = document.createElement('span');
    label.className = 'importPreviewLabel';
    label.textContent = 'XEM TRƯỚC IMPORT';
    var h2 = document.createElement('h2');
    h2.textContent = 'Kiểm tra câu hỏi';
    var desc = document.createElement('p');
    desc.textContent = 'Đáp án đúng đã hiển thị sẵn. Đánh dấu câu có ảnh và mức rủi ro, bấm “Sửa” để chỉnh nội dung.';
    headLeft.appendChild(label);
    headLeft.appendChild(h2);
    headLeft.appendChild(desc);
    var saveBtn = document.createElement('button');
    saveBtn.className = 'primary importPreviewSaveTop';
    saveBtn.type = 'button';
    saveBtn.textContent = 'Lưu Môn Học';
    saveBtn.onclick = function () {
      window.__closeImportPreviewModal();
      window.__submitSubjectRequest();
    };
    head.appendChild(headLeft);
    head.appendChild(saveBtn);
    var stats = document.createElement('div');
    stats.id = 'importPreviewStats';
    stats.className = 'importPreviewStats';
    var list = document.createElement('div');
    list.id = 'importPreviewList';
    list.className = 'importPreviewList';
    box.appendChild(closeBtn);
    box.appendChild(head);
    box.appendChild(stats);
    box.appendChild(list);
    modal.appendChild(box);
    modal.addEventListener('mousedown', function (e) {
      if (e.target === modal) window.__closeImportPreviewModal();
    });
    document.body.appendChild(modal);
    renderQualityStats(data);
    renderQualityList(data);
    modal.classList.remove('hidden');
  }
  function buildCard(q, i) {
    var answer = String(q.answer || '').toUpperCase();
    var risk = q.error_risk || 'low';
    var riskBg =
      { low: 'rgba(39,174,96,0.08)', medium: 'rgba(243,156,18,0.08)', high: 'rgba(231,76,60,0.08)' }[risk] || '';
    var card = document.createElement('article');
    card.className = 'previewQuestionCard';
    card.dataset.pcard = i;
    card.style.borderLeft = '4px solid ' + riskColor(risk);
    card.style.background = riskBg;
    // Header
    var top = document.createElement('div');
    top.className = 'previewQuestionTop';
    var numB = document.createElement('b');
    numB.textContent = 'Câu ' + (q.num || i + 1);
    var actions = document.createElement('div');
    actions.className = 'previewTopActions';
    if (q.has_image) {
      var imgBadge = document.createElement('span');
      imgBadge.className = 'previewBadge imgBadge';
      imgBadge.textContent = '📷 Có ảnh';
      actions.appendChild(imgBadge);
    }
    var rBadge = document.createElement('span');
    rBadge.className = 'previewBadge riskBadge';
    rBadge.style.background = riskColor(risk);
    rBadge.style.color = '#fff';
    rBadge.textContent = riskLabel(risk);
    actions.appendChild(rBadge);
    var ansBadge = document.createElement('span');
    ansBadge.className = 'previewAnswerBadge';
    ansBadge.textContent = 'Đáp án: ' + (answer || '?');
    actions.appendChild(ansBadge);
    var editBtn = document.createElement('button');
    editBtn.className = 'previewEditBtn';
    editBtn.type = 'button';
    editBtn.textContent = 'Sửa';
    editBtn.addEventListener('click', function () {
      window.__editImportPreviewQuestion(i);
    });
    actions.appendChild(editBtn);
    top.appendChild(numB);
    top.appendChild(actions);
    card.appendChild(top);
    // Risk reason
    if (q.error_risk_reason) {
      var reasonDiv = document.createElement('div');
      reasonDiv.className = 'previewRiskReason';
      reasonDiv.textContent = '⚠ ' + q.error_risk_reason;
      card.appendChild(reasonDiv);
    }
    // Question text
    var qText = document.createElement('div');
    qText.className = 'previewQuestionText';
    qText.textContent = q.question || '';
    card.appendChild(qText);
    // Images area (always show for upload)
    var imgArea = document.createElement('div');
    imgArea.className = 'previewImgArea';
    imgArea.dataset.imgIdx = i;
    function renderImgThumbs() {
      imgArea.textContent = '';
      var imgs = q.images || [];
      if (imgs.length) {
        var thumbRow = document.createElement('div');
        thumbRow.className = 'previewQuestionImages';
        imgs.forEach(function (im, idx) {
          var src = typeof im === 'string' ? im : im.src || im.url || '';
          if (!src) return;
          var wrap = document.createElement('div');
          wrap.className = 'previewImgThumb';
          var img = document.createElement('img');
          img.src = src;
          img.alt = 'Ảnh ' + (idx + 1);
          img.loading = 'lazy';
          var rmBtn = document.createElement('button');
          rmBtn.className = 'previewImgRm';
          rmBtn.type = 'button';
          rmBtn.textContent = '×';
          rmBtn.addEventListener('click', function () {
            q.images.splice(idx, 1);
            renderImgThumbs();
            renderQualityStats(getPreviewData());
          });
          wrap.appendChild(rmBtn);
          wrap.appendChild(img);
          thumbRow.appendChild(wrap);
        });
        imgArea.appendChild(thumbRow);
      }
      var uploadRow = document.createElement('div');
      uploadRow.className = 'previewImgUploadRow';
      var fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*';
      fileInput.multiple = true;
      fileInput.className = 'previewImgFileInput';
      fileInput.addEventListener('change', function (e) {
        var files = e.target.files || [];
        Array.prototype.forEach.call(files, function (file) {
          var fr = new FileReader();
          fr.onload = function () {
            if (!q.images) q.images = [];
            q.images.push({
              id: 'prev_' + Date.now() + '_' + Math.random().toString(16).slice(2),
              src: fr.result,
              source: 'user-upload',
              name: file.name,
            });
            if (!q.has_image) {
              q.has_image = true;
            }
            renderImgThumbs();
            renderQualityStats(getPreviewData());
          };
          fr.readAsDataURL(file);
        });
        e.target.value = '';
      });
      var uploadBtn = document.createElement('button');
      uploadBtn.className = 'previewImgUploadBtn';
      uploadBtn.type = 'button';
      uploadBtn.textContent = '📷 Thêm ảnh';
      uploadBtn.addEventListener('click', function () {
        fileInput.click();
      });
      uploadRow.appendChild(fileInput);
      uploadRow.appendChild(uploadBtn);
      if (q.images && q.images.length) {
        var countSpan = document.createElement('span');
        countSpan.className = 'previewImgCount';
        countSpan.textContent = q.images.length + ' ảnh';
        uploadRow.appendChild(countSpan);
      }
      imgArea.appendChild(uploadRow);
    }
    renderImgThumbs();
    card.appendChild(imgArea);
    // Options grid
    var grid = document.createElement('div');
    grid.className = 'previewAnswerGrid';
    Object.entries(q.options || {}).forEach(function (entry) {
      var k = entry[0],
        v = entry[1];
      var key = String(k).toUpperCase();
      var isCorrect = answer.includes(key);
      var optDiv = document.createElement('div');
      optDiv.className = 'previewAnswerOption' + (isCorrect ? ' correct' : '');
      optDiv.dataset.pi = i;
      optDiv.dataset.k = key;
      var b = document.createElement('b');
      b.textContent = key;
      var s = document.createElement('span');
      s.textContent = v;
      optDiv.appendChild(b);
      optDiv.appendChild(s);
      grid.appendChild(optDiv);
    });
    card.appendChild(grid);
    // Quality controls
    var controls = document.createElement('div');
    controls.className = 'previewQualityControls';
    var toggleLabel = document.createElement('label');
    toggleLabel.className = 'previewToggle';
    var cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = !!q.has_image;
    cb.addEventListener('change', function () {
      window.__toggleQualityImage(i, this.checked);
    });
    var cbText = document.createElement('span');
    cbText.textContent = 'Có ảnh';
    toggleLabel.appendChild(cb);
    toggleLabel.appendChild(cbText);
    var riskDiv = document.createElement('div');
    riskDiv.className = 'previewRiskSelect';
    var riskSpan = document.createElement('span');
    riskSpan.textContent = 'Rủi ro:';
    var sel = document.createElement('select');
    ['low', 'medium', 'high'].forEach(function (val) {
      var opt = document.createElement('option');
      opt.value = val;
      opt.textContent = { low: 'Thấp', medium: 'Trung bình', high: 'Cao' }[val];
      if (risk === val) opt.selected = true;
      sel.appendChild(opt);
    });
    sel.addEventListener('change', function () {
      window.__setQualityRisk(i, this.value);
    });
    riskDiv.appendChild(riskSpan);
    riskDiv.appendChild(sel);
    controls.appendChild(toggleLabel);
    controls.appendChild(riskDiv);
    card.appendChild(controls);
    return card;
  }
  window.__openImportPreviewModal = renderPreviewInline;
})();

// ===== FINAL_INLINE_EDIT_KEEP_EXISTING_CARD_20260625 =====
// Sửa tại chỗ trên đúng layout card hiện tại, không thay card thành form nên không bị co/bung.
(function () {
  const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
  function escHtml(s) {
    return String(s ?? '').replace(
      /[&<>"']/g,
      c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );
  }
  function getData() {
    return window.__previewImportData || [];
  }
  function optionKeys(q) {
    const keys = Object.keys(q?.options || {}).map(k => String(k).toUpperCase());
    return LETTERS.filter(k => keys.includes(k));
  }
  function nextKey(keys) {
    return LETTERS.find(k => !keys.includes(k));
  }
  function markCorrect(card, answer) {
    card.querySelectorAll('.previewAnswerOption').forEach(opt => {
      const k = String(opt.dataset.k || '').toUpperCase();
      opt.classList.toggle('correct', answer.includes(k));
    });
  }
  function refreshCardOnly(i) {
    const q = getData()[i];
    if (!q) return;
    const open = window.__openImportPreviewModal;
    if (typeof open === 'function') {
      // render lại toàn preview để đồng bộ, nhưng giữ đúng layout xem
      open(getData());
    }
  }

  window.__editImportPreviewQuestion = function (i) {
    const data = getData();
    const q = data[i];
    const card = document.querySelector(`[data-pcard="${i}"]`);
    if (!q || !card) return;
    if (card.classList.contains('inlineEditing')) return;

    card.dataset.backupHtml = card.innerHTML;
    card.classList.add('inlineEditing');

    const questionEl = card.querySelector('.previewQuestionText');
    if (questionEl) {
      questionEl.setAttribute('contenteditable', 'true');
      questionEl.dataset.field = 'question';
    }

    card.querySelectorAll('.previewAnswerOption').forEach(opt => {
      const span = opt.querySelector('span');
      if (span) {
        span.setAttribute('contenteditable', 'true');
        span.dataset.optText = opt.dataset.k || '';
      }
    });

    const badge = card.querySelector('.previewAnswerBadge');
    if (badge) {
      badge.innerHTML = `Đáp án đúng: <input class="inlineCorrectInput" value="${escHtml(String(q.answer || '').toUpperCase())}" oninput="this.value=this.value.toUpperCase().replace(/[^A-Z]/g,'')">`;
      const input = badge.querySelector('input');
      input?.addEventListener('input', () => markCorrect(card, String(input.value || '').toUpperCase()));
    }

    const grid = card.querySelector('.previewAnswerGrid');
    if (grid && !card.querySelector('.inlineAddOptionMini')) {
      grid.insertAdjacentHTML(
        'afterend',
        `<button class="inlineAddOptionMini" type="button" title="Thêm đáp án" onclick="window.__inlineAddPreviewOption(${i})">+</button>`,
      );
    }
    if (!card.querySelector('.inlineEditActionsMini')) {
      card.insertAdjacentHTML(
        'beforeend',
        `<div class="inlineEditActionsMini"><button class="btn" type="button" onclick="window.__cancelInlineKeepEdit(${i})">Hủy</button><button class="primary" type="button" onclick="window.__saveInlineKeepEdit(${i})">Lưu sửa</button></div>`,
      );
    }
    questionEl?.focus();
  };

  window.__inlineAddPreviewOption = function (i) {
    const card = document.querySelector(`[data-pcard="${i}"]`);
    const grid = card?.querySelector('.previewAnswerGrid');
    if (!card || !grid) return;
    const keys = Array.from(grid.querySelectorAll('.previewAnswerOption')).map(x =>
      String(x.dataset.k || '').toUpperCase(),
    );
    const k = nextKey(keys);
    if (!k) return alert('Đã đủ số lựa chọn.');
    grid.insertAdjacentHTML(
      'beforeend',
      `<div class="previewAnswerOption" data-pi="${i}" data-k="${k}"><b>${k}</b><span contenteditable="true" data-opt-text="${k}"></span></div>`,
    );
    grid.querySelector(`[data-k="${k}"] span`)?.focus();
  };

  window.__cancelInlineKeepEdit = function (i) {
    const card = document.querySelector(`[data-pcard="${i}"]`);
    if (!card) return;
    card.innerHTML = card.dataset.backupHtml || card.innerHTML;
    card.classList.remove('inlineEditing');
    delete card.dataset.backupHtml;
  };

  window.__saveInlineKeepEdit = function (i) {
    const data = getData();
    const q = data[i];
    const card = document.querySelector(`[data-pcard="${i}"]`);
    if (!q || !card) return;

    const question = (card.querySelector('.previewQuestionText')?.textContent || '').trim();
    const answer = (card.querySelector('.inlineCorrectInput')?.value || '').trim().toUpperCase();
    if (!question) return alert('Câu hỏi không được để trống.');
    if (!answer) return alert('Đáp án đúng không được để trống.');

    const options = {};
    card.querySelectorAll('.previewAnswerOption').forEach(opt => {
      const k = String(opt.dataset.k || '').toUpperCase();
      const v = (opt.querySelector('span')?.textContent || '').trim();
      if (k && v) options[k] = v;
    });
    if (!Object.keys(options).length) return alert('Cần có ít nhất một đáp án lựa chọn.');

    q.question = question;
    q.options = options;
    q.answer = answer;
    refreshCardOnly(i);
    if (typeof notify === 'function') notify('Đã cập nhật câu hỏi');
  };
})();

// ===== INLINE_DELETE_OPTION_20260625 =====
// Thêm nút xóa từng đáp án khi sửa trực tiếp trong Xem trước import.
(function () {
  function ensureDeleteButtons(card) {
    if (!card) return;
    card.querySelectorAll('.previewAnswerOption').forEach(opt => {
      if (opt.querySelector('.inlineDeleteOptionBtn')) return;
      const k = opt.dataset.k || '';
      opt.insertAdjacentHTML(
        'beforeend',
        `<button class="inlineDeleteOptionBtn" type="button" title="Xóa đáp án ${k}" onclick="window.__deleteInlinePreviewOption(this)">×</button>`,
      );
    });
  }
  window.__deleteInlinePreviewOption = function (btn) {
    const opt = btn?.closest?.('.previewAnswerOption');
    const card = btn?.closest?.('.previewQuestionCard');
    if (!opt || !card) return;
    const count = card.querySelectorAll('.previewAnswerOption').length;
    if (count <= 1) return alert('Phải còn ít nhất 1 đáp án.');
    const k = String(opt.dataset.k || '').toUpperCase();
    const input = card.querySelector('.inlineCorrectInput');
    if (input && k) {
      input.value = String(input.value || '')
        .toUpperCase()
        .replaceAll(k, '');
      card.querySelectorAll('.previewAnswerOption').forEach(o => {
        const ok = String(input.value || '').includes(String(o.dataset.k || '').toUpperCase());
        o.classList.toggle('correct', ok);
      });
    }
    opt.remove();
  };

  const oldEdit = window.__editImportPreviewQuestion;
  window.__editImportPreviewQuestion = function (i) {
    if (typeof oldEdit === 'function') oldEdit.apply(this, arguments);
    setTimeout(() => ensureDeleteButtons(document.querySelector(`[data-pcard="${i}"]`)), 0);
  };

  const oldAdd = window.__inlineAddPreviewOption;
  window.__inlineAddPreviewOption = function (i) {
    if (typeof oldAdd === 'function') oldAdd.apply(this, arguments);
    setTimeout(() => ensureDeleteButtons(document.querySelector(`[data-pcard="${i}"]`)), 0);
  };
})();

// ===== IMPORT PREVIEW COMPACT UX PATCH 20260626 =====
(function () {
  const STORE = 'learninghub_import_preview_compact_v1';
  function applyCompact(modal, compact) {
    if (!modal) return;
    modal.classList.toggle('compactMode', !!compact);
    const btn = modal.querySelector('.previewCompactToggle');
    if (btn) {
      btn.classList.toggle('active', !!compact);
      btn.textContent = compact ? 'Chi tiết' : 'Danh sách nhanh';
      btn.title = compact ? 'Bấm để xem đầy đủ đáp án và công cụ' : 'Bấm để xem nhiều câu hơn';
    }
  }
  function enhanceImportPreview() {
    const modal = document.getElementById('importPreviewModal');
    if (!modal || modal.dataset.compactEnhanced === '1') return;
    const save = modal.querySelector('.importPreviewSaveTop');
    if (!save || !save.parentNode) return;
    modal.dataset.compactEnhanced = '1';
    let compact = localStorage.getItem(STORE);
    compact = compact === null ? true : compact === '1';
    const actions = document.createElement('div');
    actions.className = 'importPreviewHeadActions';
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'previewCompactToggle';
    toggle.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      compact = !modal.classList.contains('compactMode');
      localStorage.setItem(STORE, compact ? '1' : '0');
      applyCompact(modal, compact);
    });
    save.parentNode.insertBefore(actions, save);
    actions.appendChild(toggle);
    actions.appendChild(save);
    applyCompact(modal, compact);
  }
  function start() {
    enhanceImportPreview();
    if (window.MutationObserver && document.body) {
      new MutationObserver(enhanceImportPreview).observe(document.body, { childList: true, subtree: true });
    }
    setInterval(enhanceImportPreview, 700);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();

// SIMPLE_IMPORT_PREVIEW_ANSWER_ONLY_FINAL_20260626
(function () {
  const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  function esc(s) {
    return String(s ?? '').replace(
      /[&<>"']/g,
      c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );
  }
  function getData(data) {
    const arr = data || window.__previewImportData || [];
    window.__previewImportData = arr;
    return arr;
  }
  function normAns(q) {
    return String(q?.answer || '')
      .toUpperCase()
      .replace(/[^A-Z]/g, '');
  }
  function correctText(q) {
    const ans = normAns(q);
    if (!ans) return 'Chưa có đáp án';
    return ans
      .split('')
      .map(k => k + '. ' + (q.options?.[k] || ''))
      .join(' | ');
  }
  function nextKey(opts) {
    const used = new Set(Object.keys(opts || {}).map(k => String(k).toUpperCase()));
    return LETTERS.find(k => !used.has(k));
  }
  function renderCard(q, i) {
    const ans = normAns(q) || '?';
    return `<article class="simplePreviewCard" data-simple-card="${i}"><div class="simplePreviewRow"><div class="simplePreviewNum">Câu ${esc(q.num || i + 1)}</div><div class="simplePreviewMain"><div class="simplePreviewQuestion">${esc(q.question || '')}</div><div class="simplePreviewCorrect"><b>Đáp án: ${esc(ans)}</b><span>${esc(correctText(q))}</span></div></div><button class="simplePreviewEditBtn" type="button" data-simple-edit="${i}">Sửa</button></div></article>`;
  }
  function renderEditCard(q, i) {
    const opts = q.options || {};
    const optionRows = Object.keys(opts)
      .sort()
      .map(
        k =>
          `<div class="simpleEditOption" data-opt-row="${esc(k)}"><div class="simpleEditKey">${esc(k)}</div><input value="${esc(opts[k] || '')}" data-edit-opt="${esc(k)}"><button class="simpleEditDel" type="button" data-del-opt="${esc(k)}">×</button></div>`,
      )
      .join('');
    return `<article class="simplePreviewCard simpleEditCard" data-simple-card="${i}"><div class="simpleEditHead"><div class="simpleEditTitle">Sửa toàn bộ Câu ${esc(q.num || i + 1)}</div></div><div class="simpleEditGrid"><div class="simpleEditField"><label>Câu hỏi</label><textarea data-edit-question>${esc(q.question || '')}</textarea></div><div class="simpleEditField"><label>Đáp án đúng</label><input data-edit-answer value="${esc(normAns(q))}" placeholder="VD: A hoặc AC"></div></div><div class="simpleEditField" style="margin-top:10px"><label>Các đáp án</label><div class="simpleEditOptions">${optionRows}</div></div><div class="simpleEditBottom"><button class="btn" type="button" data-add-opt="${i}">+ Thêm đáp án</button><div class="simpleEditMiniActions"><button class="btn" type="button" data-cancel-simple="${i}">Hủy</button><button class="primary" type="button" data-save-simple="${i}">Lưu sửa</button></div></div></article>`;
  }
  function renderList(data) {
    const list = document.getElementById('simplePreviewList');
    if (list) list.innerHTML = data.map(renderCard).join('');
  }
  function openSimplePreview(data) {
    data = getData(data);
    let modal = document.getElementById('importPreviewModal');
    if (modal) modal.remove();
    modal = document.createElement('div');
    modal.id = 'importPreviewModal';
    modal.className = 'modal simpleImportPreviewModal';
    modal.innerHTML = `<div class="box simpleImportPreviewBox"><button class="modalX" type="button" data-simple-close>×</button><div class="simplePreviewHead"><div><span class="simplePreviewLabel">XEM TRƯỚC IMPORT</span><h2>Kiểm tra câu hỏi</h2><p class="simplePreviewHint">Chỉ hiện câu hỏi và đáp án đúng. Bấm “Sửa” để chỉnh toàn bộ câu và các đáp án.</p></div><div class="simplePreviewActions"><button class="primary simplePreviewSave" type="button" data-simple-save>Lưu Môn Học</button></div></div><div class="simplePreviewCount">${data.length} câu hỏi</div><div id="simplePreviewList" class="simplePreviewList"></div></div>`;
    document.body.appendChild(modal);
    renderList(data);
  }
  function saveEdit(i) {
    const data = getData();
    const q = data[i];
    const card = document.querySelector(`[data-simple-card="${i}"]`);
    if (!q || !card) return;
    const question = (card.querySelector('[data-edit-question]')?.value || '').trim();
    const answer = (card.querySelector('[data-edit-answer]')?.value || '')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z]/g, '');
    if (!question) return alert('Câu hỏi không được để trống.');
    if (!answer) return alert('Đáp án đúng không được để trống.');
    const options = {};
    card.querySelectorAll('[data-edit-opt]').forEach(inp => {
      const k = String(inp.dataset.editOpt || '').toUpperCase();
      const v = (inp.value || '').trim();
      if (k && v) options[k] = v;
    });
    if (!Object.keys(options).length) return alert('Cần ít nhất 1 đáp án.');
    for (const k of answer.split('')) {
      if (!options[k]) return alert('Đáp án đúng ' + k + ' chưa có nội dung.');
    }
    q.question = question;
    q.answer = answer;
    q.options = options;
    q.answer_text = answer
      .split('')
      .map(k => k + '. ' + (options[k] || ''))
      .join('; ');
    renderList(data);
    if (typeof notify === 'function') notify('Đã lưu sửa câu ' + (q.num || i + 1));
  }
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-simple-close]')) {
      document.getElementById('importPreviewModal')?.classList.add('hidden');
      return;
    }
    if (e.target.closest('[data-simple-save]')) {
      document.getElementById('importPreviewModal')?.classList.add('hidden');
      window.__submitSubjectRequest?.();
      return;
    }
    const edit = e.target.closest('[data-simple-edit]');
    if (edit) {
      const i = +edit.dataset.simpleEdit;
      const data = getData();
      const card = document.querySelector(`[data-simple-card="${i}"]`);
      if (card && data[i]) {
        card.outerHTML = renderEditCard(data[i], i);
        document.querySelector(`[data-simple-card="${i}"] textarea`)?.focus();
      }
      return;
    }
    const cancel = e.target.closest('[data-cancel-simple]');
    if (cancel) {
      renderList(getData());
      return;
    }
    const save = e.target.closest('[data-save-simple]');
    if (save) {
      saveEdit(+save.dataset.saveSimple);
      return;
    }
    const add = e.target.closest('[data-add-opt]');
    if (add) {
      const i = +add.dataset.addOpt;
      const data = getData();
      const q = data[i];
      const k = nextKey(q.options || {});
      if (!k) return alert('Đã đủ số đáp án.');
      q.options = q.options || {};
      q.options[k] = '';
      const card = document.querySelector(`[data-simple-card="${i}"]`);
      if (card) {
        card.outerHTML = renderEditCard(q, i);
        document.querySelector(`[data-simple-card="${i}"] [data-edit-opt="${k}"]`)?.focus();
      }
      return;
    }
    const del = e.target.closest('[data-del-opt]');
    if (del) {
      const card = del.closest('[data-simple-card]');
      const i = +(card?.dataset.simpleCard || 0);
      const q = getData()[i];
      const k = del.dataset.delOpt;
      if (q?.options && k) {
        delete q.options[k];
        card.outerHTML = renderEditCard(q, i);
      }
      return;
    }
  });
  window.__openImportPreviewModal = openSimplePreview;
  window.__editImportPreviewQuestion = function (i) {
    const data = getData();
    const card = document.querySelector(`[data-simple-card="${i}"]`);
    if (card && data[i]) card.outerHTML = renderEditCard(data[i], i);
  };
})();

// FILTERED_ANSWER_ONLY_PREVIEW_20260626
(function () {
  const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  let currentFilter = 'all';
  function esc(s) {
    return String(s ?? '').replace(
      /[&<>"']/g,
      c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );
  }
  function getData(data) {
    const arr = data || window.__previewImportData || [];
    window.__previewImportData = arr;
    arr.forEach(detect);
    return arr;
  }
  function normAns(q) {
    return String(q?.answer || '')
      .toUpperCase()
      .replace(/[^A-Z]/g, '');
  }
  function detect(q) {
    q.has_image = !!(q.has_image || (q.images && q.images.length));
    if (!q.error_risk) q.error_risk = normAns(q).length > 1 ? 'medium' : 'low';
    return q;
  }
  function correctText(q) {
    const ans = normAns(q);
    if (!ans) return 'Chưa có đáp án';
    return ans
      .split('')
      .map(k => k + '. ' + (q.options?.[k] || ''))
      .join(' | ');
  }
  function riskColor(r) {
    return { high: '#e74c3c', medium: '#f39c12', low: '#27ae60' }[r] || '#999';
  }
  function riskLabel(r) {
    return { high: 'Cao', medium: 'Trung bình', low: 'Thấp' }[r] || r;
  }
  function nextKey(opts) {
    const used = new Set(Object.keys(opts || {}).map(k => String(k).toUpperCase()));
    return LETTERS.find(k => !used.has(k));
  }
  function pass(q) {
    if (currentFilter === 'all') return true;
    if (currentFilter === 'has_image') return !!q.has_image;
    return q.error_risk === currentFilter;
  }
  function stat(data) {
    return {
      total: data.length,
      img: data.filter(q => q.has_image).length,
      high: data.filter(q => q.error_risk === 'high').length,
      medium: data.filter(q => q.error_risk === 'medium').length,
      low: data.filter(q => q.error_risk === 'low').length,
    };
  }
  function renderStats(data) {
    const s = stat(data);
    const box = document.getElementById('simplePreviewStats');
    if (!box) return;
    const filters = [
      ['all', 'Thư viện'],
      ['has_image', '📷 Có ảnh'],
      ['high', 'Rủi ro cao'],
      ['medium', 'Trung bình'],
      ['low', 'Thấp'],
    ];
    box.innerHTML = `<div class="simplePreviewStatLine"><span class="simplePreviewStatItem">${s.total} câu</span><span class="simplePreviewStatItem" style="color:#3498db">${s.img} có ảnh</span><span class="simplePreviewStatItem" style="color:#e74c3c">${s.high} rủi ro cao</span><span class="simplePreviewStatItem" style="color:#f39c12">${s.medium} trung bình</span><span class="simplePreviewStatItem" style="color:#27ae60">${s.low} thấp</span></div><div class="simplePreviewFilterLine">${filters.map(f => `<button type="button" class="simpleFilterBtn ${currentFilter === f[0] ? 'active' : ''}" data-filter="${f[0]}">${f[1]}</button>`).join('')}</div>`;
  }
  function renderCard(q, i) {
    const ans = normAns(q) || '?';
    return `<article class="simplePreviewCard" data-simple-card="${i}" style="border-left-color:${riskColor(q.error_risk)}!important"><div class="simplePreviewRow"><div class="simplePreviewNum">Câu ${esc(q.num || i + 1)}</div><div class="simplePreviewMain"><div class="simplePreviewQuestion">${esc(q.question || '')}</div><div class="simplePreviewCorrect"><b>Đáp án: ${esc(ans)}</b><span>${esc(correctText(q))}</span></div></div><div class="simplePreviewMetaMini"><span class="simplePreviewRiskDot" style="background:${riskColor(q.error_risk)}" title="Rủi ro: ${esc(riskLabel(q.error_risk))}"></span>${q.has_image ? '<span class="simplePreviewImgMark">📷</span>' : ''}<button class="simplePreviewEditBtn" type="button" data-simple-edit="${i}">Sửa</button></div></div></article>`;
  }
  function renderEditCard(q, i) {
    const opts = q.options || {};
    const optionRows = Object.keys(opts)
      .sort()
      .map(
        k =>
          `<div class="simpleEditOption" data-opt-row="${esc(k)}"><div class="simpleEditKey">${esc(k)}</div><input value="${esc(opts[k] || '')}" data-edit-opt="${esc(k)}"><button class="simpleEditDel" type="button" data-del-opt="${esc(k)}">×</button></div>`,
      )
      .join('');
    return `<article class="simplePreviewCard simpleEditCard" data-simple-card="${i}"><div class="simpleEditHead"><div class="simpleEditTitle">Sửa toàn bộ Câu ${esc(q.num || i + 1)}</div></div><div class="simpleEditGrid"><div class="simpleEditField"><label>Câu hỏi</label><textarea data-edit-question>${esc(q.question || '')}</textarea></div><div class="simpleEditField"><label>Đáp án đúng</label><input data-edit-answer value="${esc(normAns(q))}" placeholder="VD: A hoặc AC"></div></div><div class="simpleEditField" style="margin-top:10px"><label>Các đáp án</label><div class="simpleEditOptions">${optionRows}</div></div><div class="simpleEditBottom"><button class="btn" type="button" data-add-opt="${i}">+ Thêm đáp án</button><div class="simpleEditMiniActions"><button class="btn" type="button" data-cancel-simple="${i}">Hủy</button><button class="primary" type="button" data-save-simple="${i}">Lưu sửa</button></div></div></article>`;
  }
  function renderList(data) {
    const list = document.getElementById('simplePreviewList');
    if (!list) return;
    const filtered = data.map((q, i) => ({ q, i })).filter(x => pass(x.q));
    list.innerHTML = filtered.length
      ? filtered.map(x => renderCard(x.q, x.i)).join('')
      : '<div class="simplePreviewEmpty">Không có câu nào phù hợp bộ lọc.</div>';
    renderStats(data);
  }
  function openSimplePreview(data) {
    data = getData(data);
    let modal = document.getElementById('importPreviewModal');
    if (modal) modal.remove();
    modal = document.createElement('div');
    modal.id = 'importPreviewModal';
    modal.className = 'modal simpleImportPreviewModal';
    modal.innerHTML = `<div class="box simpleImportPreviewBox"><button class="modalX" type="button" data-simple-close>×</button><div class="simplePreviewHead"><div><span class="simplePreviewLabel">XEM TRƯỚC IMPORT</span><h2>Kiểm tra câu hỏi</h2><p class="simplePreviewHint">Chỉ hiện câu hỏi và đáp án đúng. Dùng bộ lọc để xem câu có ảnh hoặc câu dễ sai.</p></div><div class="simplePreviewActions"><button class="primary simplePreviewSave" type="button" data-simple-save>Lưu Môn Học</button></div></div><div id="simplePreviewStats" class="simplePreviewStats"></div><div id="simplePreviewList" class="simplePreviewList"></div></div>`;
    document.body.appendChild(modal);
    renderList(data);
  }
  function saveEdit(i) {
    const data = getData();
    const q = data[i];
    const card = document.querySelector(`[data-simple-card="${i}"]`);
    if (!q || !card) return;
    const question = (card.querySelector('[data-edit-question]')?.value || '').trim();
    const answer = (card.querySelector('[data-edit-answer]')?.value || '')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z]/g, '');
    if (!question) return alert('Câu hỏi không được để trống.');
    if (!answer) return alert('Đáp án đúng không được để trống.');
    const options = {};
    card.querySelectorAll('[data-edit-opt]').forEach(inp => {
      const k = String(inp.dataset.editOpt || '').toUpperCase();
      const v = (inp.value || '').trim();
      if (k && v) options[k] = v;
    });
    if (!Object.keys(options).length) return alert('Cần ít nhất 1 đáp án.');
    for (const k of answer.split('')) {
      if (!options[k]) return alert('Đáp án đúng ' + k + ' chưa có nội dung.');
    }
    q.question = question;
    q.answer = answer;
    q.options = options;
    q.answer_text = answer
      .split('')
      .map(k => k + '. ' + (options[k] || ''))
      .join('; ');
    renderList(data);
    if (typeof notify === 'function') notify('Đã lưu sửa câu ' + (q.num || i + 1));
  }
  document.addEventListener('click', function (e) {
    const filter = e.target.closest('.simpleFilterBtn');
    if (filter) {
      currentFilter = filter.dataset.filter || 'all';
      renderList(getData());
      return;
    }
    if (e.target.closest('[data-simple-close]')) {
      document.getElementById('importPreviewModal')?.classList.add('hidden');
      return;
    }
    if (e.target.closest('[data-simple-save]')) {
      document.getElementById('importPreviewModal')?.classList.add('hidden');
      window.__submitSubjectRequest?.();
      return;
    }
    const edit = e.target.closest('[data-simple-edit]');
    if (edit) {
      const i = +edit.dataset.simpleEdit;
      const data = getData();
      const card = document.querySelector(`[data-simple-card="${i}"]`);
      if (card && data[i]) {
        card.outerHTML = renderEditCard(data[i], i);
        document.querySelector(`[data-simple-card="${i}"] textarea`)?.focus();
      }
      return;
    }
    const cancel = e.target.closest('[data-cancel-simple]');
    if (cancel) {
      renderList(getData());
      return;
    }
    const save = e.target.closest('[data-save-simple]');
    if (save) {
      saveEdit(+save.dataset.saveSimple);
      return;
    }
    const add = e.target.closest('[data-add-opt]');
    if (add) {
      const i = +add.dataset.addOpt;
      const data = getData();
      const q = data[i];
      const k = nextKey(q.options || {});
      if (!k) return alert('Đã đủ số đáp án.');
      q.options = q.options || {};
      q.options[k] = '';
      const card = document.querySelector(`[data-simple-card="${i}"]`);
      if (card) {
        card.outerHTML = renderEditCard(q, i);
        document.querySelector(`[data-simple-card="${i}"] [data-edit-opt="${k}"]`)?.focus();
      }
      return;
    }
    const del = e.target.closest('[data-del-opt]');
    if (del) {
      const card = del.closest('[data-simple-card]');
      const i = +(card?.dataset.simpleCard || 0);
      const q = getData()[i];
      const k = del.dataset.delOpt;
      if (q?.options && k) {
        delete q.options[k];
        card.outerHTML = renderEditCard(q, i);
      }
      return;
    }
  });
  window.__openImportPreviewModal = openSimplePreview;
  window.__editImportPreviewQuestion = function (i) {
    const data = getData();
    const card = document.querySelector(`[data-simple-card="${i}"]`);
    if (card && data[i]) card.outerHTML = renderEditCard(data[i], i);
  };
})();

// IMAGE_THUMB_PREVIEW_TOP_EDIT_ACTIONS_20260626
(function () {
  const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  let currentFilter = 'all';
  function esc(s) {
    return String(s ?? '').replace(
      /[&<>"']/g,
      c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );
  }
  function getData(data) {
    const arr = data || window.__previewImportData || [];
    window.__previewImportData = arr;
    arr.forEach(detect);
    return arr;
  }
  function normAns(q) {
    return String(q?.answer || '')
      .toUpperCase()
      .replace(/[^A-Z]/g, '');
  }
  function detect(q) {
    q.images = q.images || [];
    q.has_image = !!(q.has_image || (q.images && q.images.length));
    if (!q.error_risk) q.error_risk = normAns(q).length > 1 ? 'medium' : 'low';
    return q;
  }
  function correctText(q) {
    const ans = normAns(q);
    if (!ans) return 'Chưa có đáp án';
    return ans
      .split('')
      .map(k => k + '. ' + (q.options?.[k] || ''))
      .join(' | ');
  }
  function riskColor(r) {
    return { high: '#e74c3c', medium: '#f39c12', low: '#27ae60' }[r] || '#999';
  }
  function riskLabel(r) {
    return { high: 'Cao', medium: 'Trung bình', low: 'Thấp' }[r] || r;
  }
  function nextKey(opts) {
    const used = new Set(Object.keys(opts || {}).map(k => String(k).toUpperCase()));
    return LETTERS.find(k => !used.has(k));
  }
  function imgSrc(im) {
    return typeof im === 'string' ? im : im?.src || im?.url || '';
  }
  function pass(q) {
    if (currentFilter === 'all') return true;
    if (currentFilter === 'has_image') return !!q.has_image;
    return q.error_risk === currentFilter;
  }
  function stat(data) {
    return {
      total: data.length,
      img: data.filter(q => q.has_image).length,
      high: data.filter(q => q.error_risk === 'high').length,
      medium: data.filter(q => q.error_risk === 'medium').length,
      low: data.filter(q => q.error_risk === 'low').length,
    };
  }
  function renderStats(data) {
    const s = stat(data),
      box = document.getElementById('simplePreviewStats');
    if (!box) return;
    const filters = [
      ['all', 'Thư viện'],
      ['has_image', '📷 Có ảnh'],
      ['high', 'Rủi ro cao'],
      ['medium', 'Trung bình'],
      ['low', 'Thấp'],
    ];
    box.innerHTML = `<div class="simplePreviewStatLine"><span class="simplePreviewStatItem">${s.total} câu</span><span class="simplePreviewStatItem" style="color:#3498db">${s.img} có ảnh</span><span class="simplePreviewStatItem" style="color:#e74c3c">${s.high} rủi ro cao</span><span class="simplePreviewStatItem" style="color:#f39c12">${s.medium} trung bình</span><span class="simplePreviewStatItem" style="color:#27ae60">${s.low} thấp</span></div><div class="simplePreviewFilterLine">${filters.map(f => `<button type="button" class="imagePreviewFilterBtn ${currentFilter === f[0] ? 'active' : ''}" data-imgui-filter="${f[0]}">${f[1]}</button>`).join('')}</div>`;
  }
  function miniImages(q) {
    const imgs = (q.images || []).map(imgSrc).filter(Boolean);
    if (!imgs.length) return '<div class="imageMiniPreview"></div>';
    return `<div class="imageMiniPreview"><img src="${esc(imgs[0])}" alt="Ảnh preview" loading="lazy" decoding="async">${imgs.length > 1 ? `<span class="imageMiniCount">+${imgs.length - 1}</span>` : ''}</div>`;
  }
  function renderCard(q, i) {
    const ans = normAns(q) || '?';
    return `<article class="simplePreviewCard" data-imgui-card="${i}" style="border-left-color:${riskColor(q.error_risk)}!important"><div class="imagePreviewListRow"><div class="simplePreviewNum">Câu ${esc(q.num || i + 1)}</div><div class="simplePreviewMain"><div class="simplePreviewQuestion">${esc(q.question || '')}</div><div class="simplePreviewCorrect"><b>Đáp án: ${esc(ans)}</b><span>${esc(correctText(q))}</span></div></div>${miniImages(q)}<div class="simplePreviewMetaMini"><span class="simplePreviewRiskDot" style="background:${riskColor(q.error_risk)}" title="Rủi ro: ${esc(riskLabel(q.error_risk))}"></span><button class="simplePreviewEditBtn" type="button" data-imgui-edit="${i}">Sửa</button></div></div></article>`;
  }
  function renderImages(q, i) {
    const imgs = q.images || [];
    return `<div class="simpleEditImages"><div class="simpleEditImagesHead"><span>Ảnh của câu hỏi</span><button class="simpleImageUploadBtn" type="button" data-imgui-pick-img="${i}">+ Thêm ảnh</button><input class="simpleImgHiddenInput" type="file" accept="image/*" multiple data-imgui-input="${i}"></div><div class="simpleImageThumbs">${imgs.length ? imgs.map((im, idx) => `<div class="simpleImageThumb"><button class="simpleImageRemove" type="button" data-imgui-rm-img="${idx}">×</button><img src="${esc(imgSrc(im))}" alt="Ảnh ${idx + 1}" loading="lazy" decoding="async"></div>`).join('') : '<div class="simpleNoImage">Chưa có ảnh. Bấm “+ Thêm ảnh” nếu câu này cần hình.</div>'}</div></div>`;
  }
  function renderEditCard(q, i) {
    const opts = q.options || {};
    const optionRows = Object.keys(opts)
      .sort()
      .map(
        k =>
          `<div class="simpleEditOption" data-opt-row="${esc(k)}"><div class="simpleEditKey">${esc(k)}</div><input value="${esc(opts[k] || '')}" data-imgui-opt="${esc(k)}"><button class="simpleEditDel" type="button" data-imgui-del-opt="${esc(k)}">×</button></div>`,
      )
      .join('');
    return `<article class="simplePreviewCard simpleEditCard" data-imgui-card="${i}"><div class="simpleEditHead imageEditHeadTop"><div class="simpleEditTitle">Sửa toàn bộ Câu ${esc(q.num || i + 1)}</div><div class="imageEditHeadActions"><button class="btn" type="button" data-imgui-cancel="${i}">Hủy</button><button class="primary" type="button" data-imgui-save="${i}">Lưu sửa</button></div></div><div class="simpleEditGrid"><div class="simpleEditField"><label>Câu hỏi</label><textarea data-imgui-question>${esc(q.question || '')}</textarea></div><div class="simpleEditField"><label>Đáp án đúng</label><input data-imgui-answer value="${esc(normAns(q))}" placeholder="VD: A hoặc AC"></div></div><div class="simpleEditField" style="margin-top:10px"><label>Các đáp án</label><div class="simpleEditOptions">${optionRows}</div></div>${renderImages(q, i)}<div class="simpleEditBottom imageEditBottomOnlyAdd"><button class="btn" type="button" data-imgui-add-opt="${i}">+ Thêm đáp án</button></div></article>`;
  }
  function renderList(data) {
    const list = document.getElementById('simplePreviewList');
    if (!list) return;
    const filtered = data.map((q, i) => ({ q, i })).filter(x => pass(x.q));
    list.innerHTML = filtered.length
      ? filtered.map(x => renderCard(x.q, x.i)).join('')
      : '<div class="simplePreviewEmpty">Không có câu nào phù hợp bộ lọc.</div>';
    renderStats(data);
  }
  function openPreview(data) {
    data = getData(data);
    let modal = document.getElementById('importPreviewModal');
    if (modal) modal.remove();
    modal = document.createElement('div');
    modal.id = 'importPreviewModal';
    modal.className = 'modal simpleImportPreviewModal';
    modal.innerHTML = `<div class="box simpleImportPreviewBox"><button class="modalX" type="button" data-imgui-close>×</button><div class="simplePreviewHead"><div><span class="simplePreviewLabel">XEM TRƯỚC IMPORT</span><h2>Kiểm tra câu hỏi</h2><p class="simplePreviewHint">Chỉ hiện câu hỏi và đáp án đúng. Câu có ảnh sẽ hiện preview nhỏ.</p></div><div class="simplePreviewActions"><button class="primary simplePreviewSave" type="button" data-imgui-submit>Lưu Môn Học</button></div></div><div id="simplePreviewStats" class="simplePreviewStats"></div><div id="simplePreviewList" class="simplePreviewList"></div></div>`;
    document.body.appendChild(modal);
    renderList(data);
  }
  function saveEdit(i) {
    const data = getData();
    const q = data[i];
    const card = document.querySelector(`[data-imgui-card="${i}"]`);
    if (!q || !card) return;
    const question = (card.querySelector('[data-imgui-question]')?.value || '').trim();
    const answer = (card.querySelector('[data-imgui-answer]')?.value || '')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z]/g, '');
    if (!question) return alert('Câu hỏi không được để trống.');
    if (!answer) return alert('Đáp án đúng không được để trống.');
    const options = {};
    card.querySelectorAll('[data-imgui-opt]').forEach(inp => {
      const k = String(inp.dataset.imguiOpt || '').toUpperCase();
      const v = (inp.value || '').trim();
      if (k && v) options[k] = v;
    });
    if (!Object.keys(options).length) return alert('Cần ít nhất 1 đáp án.');
    for (const k of answer.split('')) {
      if (!options[k]) return alert('Đáp án đúng ' + k + ' chưa có nội dung.');
    }
    q.question = question;
    q.answer = answer;
    q.options = options;
    q.answer_text = answer
      .split('')
      .map(k => k + '. ' + (options[k] || ''))
      .join('; ');
    q.has_image = !!(q.images && q.images.length);
    renderList(data);
    if (typeof notify === 'function') notify('Đã lưu sửa câu ' + (q.num || i + 1));
  }
  document.addEventListener('click', function (e) {
    const filter = e.target.closest('[data-imgui-filter]');
    if (filter) {
      currentFilter = filter.dataset.imguiFilter || 'all';
      renderList(getData());
      return;
    }
    if (e.target.closest('[data-imgui-close]')) {
      document.getElementById('importPreviewModal')?.classList.add('hidden');
      return;
    }
    if (e.target.closest('[data-imgui-submit]')) {
      document.getElementById('importPreviewModal')?.classList.add('hidden');
      window.__submitSubjectRequest?.();
      return;
    }
    const edit = e.target.closest('[data-imgui-edit]');
    if (edit) {
      const i = +edit.dataset.imguiEdit;
      const data = getData();
      const card = document.querySelector(`[data-imgui-card="${i}"]`);
      if (card && data[i]) {
        card.outerHTML = renderEditCard(data[i], i);
        document.querySelector(`[data-imgui-card="${i}"] textarea`)?.focus();
      }
      return;
    }
    const cancel = e.target.closest('[data-imgui-cancel]');
    if (cancel) {
      renderList(getData());
      return;
    }
    const save = e.target.closest('[data-imgui-save]');
    if (save) {
      saveEdit(+save.dataset.imguiSave);
      return;
    }
    const pick = e.target.closest('[data-imgui-pick-img]');
    if (pick) {
      document.querySelector(`[data-imgui-input="${pick.dataset.imguiPickImg}"]`)?.click();
      return;
    }
    const rm = e.target.closest('[data-imgui-rm-img]');
    if (rm) {
      const card = rm.closest('[data-imgui-card]');
      const i = +(card?.dataset.imguiCard || 0);
      const q = getData()[i];
      if (q?.images) {
        q.images.splice(+rm.dataset.imguiRmImg, 1);
        q.has_image = !!q.images.length;
        card.outerHTML = renderEditCard(q, i);
      }
      return;
    }
    const add = e.target.closest('[data-imgui-add-opt]');
    if (add) {
      const i = +add.dataset.imguiAddOpt;
      const data = getData();
      const q = data[i];
      const k = nextKey(q.options || {});
      if (!k) return alert('Đã đủ số đáp án.');
      q.options = q.options || {};
      q.options[k] = '';
      const card = document.querySelector(`[data-imgui-card="${i}"]`);
      if (card) {
        card.outerHTML = renderEditCard(q, i);
        document.querySelector(`[data-imgui-card="${i}"] [data-imgui-opt="${k}"]`)?.focus();
      }
      return;
    }
    const del = e.target.closest('[data-imgui-del-opt]');
    if (del) {
      const card = del.closest('[data-imgui-card]');
      const i = +(card?.dataset.imguiCard || 0);
      const q = getData()[i];
      const k = del.dataset.imguiDelOpt;
      if (q?.options && k) {
        delete q.options[k];
        card.outerHTML = renderEditCard(q, i);
      }
      return;
    }
  });
  document.addEventListener('change', async function (e) {
    const inp = e.target.closest('[data-imgui-input]');
    if (!inp) return;
    const i = +inp.dataset.imguiInput;
    const q = getData()[i];
    if (!q) return;
    q.images = q.images || [];
    const files = Array.from(inp.files || []);
    if (!files.length) return;
    inp.disabled = true;
    if (typeof notify === 'function') notify('Đang upload ảnh...');
    try {
      for (const file of files) {
        if (window.__LHUploadCloudinary) {
          const uploaded = await window.__LHUploadCloudinary(file);
          if (uploaded) q.images.push(uploaded);
        } else {
          const fr = new FileReader();
          const p = new Promise(resolve => {
            fr.onload = function () {
              q.images.push({
                id: 'import_' + Date.now() + '_' + Math.random().toString(16).slice(2),
                src: fr.result,
                source: 'user-upload',
                name: file.name,
              });
              resolve();
            };
            fr.readAsDataURL(file);
          });
          await p;
        }
      }
      q.has_image = true;
      const card = document.querySelector(`[data-imgui-card="${i}"]`);
      if (card) card.outerHTML = renderEditCard(q, i);
      if (typeof notify === 'function') notify('Đã upload ảnh thành URL');
    } catch (err) {
      alert(err.message || err);
    } finally {
      inp.disabled = false;
      inp.value = '';
    }
  });
  window.__openImportPreviewModal = openPreview;
  window.__editImportPreviewQuestion = function (i) {
    const data = getData();
    const card = document.querySelector(`[data-imgui-card="${i}"]`);
    if (card && data[i]) card.outerHTML = renderEditCard(data[i], i);
  };
})();

// FINAL_CLEAN_IMPORT_PREVIEW_V7_20260626
(function () {
  const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  let currentFilter = 'all';
  function esc(s) {
    return String(s ?? '').replace(
      /[&<>"']/g,
      c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );
  }
  function getData(data) {
    const arr = data || window.__previewImportData || [];
    window.__previewImportData = arr;
    arr.forEach(detect);
    return arr;
  }
  function normAns(q) {
    return String(q?.answer || '')
      .toUpperCase()
      .replace(/[^A-Z]/g, '');
  }
  function detect(q) {
    q.images = q.images || [];
    q.has_image = !!(q.has_image || (q.images && q.images.length));
    if (!q.error_risk) q.error_risk = normAns(q).length > 1 ? 'medium' : 'low';
    return q;
  }
  function correctText(q) {
    const ans = normAns(q);
    if (!ans) return 'Chưa có đáp án';
    return ans
      .split('')
      .map(k => k + '. ' + (q.options?.[k] || ''))
      .join(' | ');
  }
  function riskColor(r) {
    return { high: '#e74c3c', medium: '#f39c12', low: '#27ae60' }[r] || '#999';
  }
  function riskLabel(r) {
    return { high: 'Cao', medium: 'Trung bình', low: 'Thấp' }[r] || r;
  }
  function nextKey(opts) {
    const used = new Set(Object.keys(opts || {}).map(k => String(k).toUpperCase()));
    return LETTERS.find(k => !used.has(k));
  }
  function imgSrc(im) {
    return typeof im === 'string' ? im : im?.src || im?.url || '';
  }
  function pass(q) {
    if (currentFilter === 'all') return true;
    if (currentFilter === 'has_image') return !!q.has_image;
    return q.error_risk === currentFilter;
  }
  function stats(data) {
    return {
      total: data.length,
      img: data.filter(q => q.has_image).length,
      high: data.filter(q => q.error_risk === 'high').length,
      medium: data.filter(q => q.error_risk === 'medium').length,
      low: data.filter(q => q.error_risk === 'low').length,
    };
  }
  function renderStats(data) {
    const s = stats(data),
      box = document.getElementById('v7Stats');
    if (!box) return;
    const filters = [
      ['all', 'Thư viện'],
      ['has_image', '📷 Có ảnh'],
      ['high', 'Rủi ro cao'],
      ['medium', 'Trung bình'],
      ['low', 'Thấp'],
    ];
    box.innerHTML = `<div class="v7StatLine"><span class="v7StatItem">${s.total} câu</span><span class="v7StatItem" style="color:#3498db">${s.img} có ảnh</span><span class="v7StatItem" style="color:#e74c3c">${s.high} rủi ro cao</span><span class="v7StatItem" style="color:#f39c12">${s.medium} trung bình</span><span class="v7StatItem" style="color:#27ae60">${s.low} thấp</span></div><div class="v7FilterLine">${filters.map(f => `<button type="button" class="v7FilterBtn ${currentFilter === f[0] ? 'active' : ''}" data-v7-filter="${f[0]}">${f[1]}</button>`).join('')}</div>`;
  }
  function miniImages(q) {
    const imgs = (q.images || []).map(imgSrc).filter(Boolean);
    if (!imgs.length) return '<div class="v7MiniImgs"></div>';
    return `<div class="v7MiniImgs"><img src="${esc(imgs[0])}" alt="Ảnh preview" loading="lazy" decoding="async">${imgs.length > 1 ? `<span class="v7ImgCount">+${imgs.length - 1}</span>` : ''}</div>`;
  }
  function renderCard(q, i) {
    const ans = normAns(q) || '?';
    return `<article class="v7Card" data-v7-card="${i}" style="border-left-color:${riskColor(q.error_risk)}!important"><div class="v7Row"><div class="v7Num">Câu ${esc(q.num || i + 1)}</div><div class="v7Main"><div class="v7Question">${esc(q.question || '')}</div><div class="v7Answer"><b>Đáp án: ${esc(ans)}</b><span>${esc(correctText(q))}</span></div></div>${miniImages(q)}<div class="v7Meta"><span class="v7RiskDot" style="background:${riskColor(q.error_risk)}" title="Rủi ro: ${esc(riskLabel(q.error_risk))}"></span><button class="v7EditBtn" type="button" data-v7-edit="${i}">Sửa</button></div></div></article>`;
  }
  function renderImages(q, i) {
    const imgs = q.images || [];
    return `<div class="v7Images"><div class="v7ImagesHead"><span>Ảnh của câu hỏi</span><button class="v7UploadBtn" type="button" data-v7-pick-img="${i}">+ Thêm ảnh</button><input class="v7HiddenInput" type="file" accept="image/*" multiple data-v7-input="${i}"></div><div class="v7Thumbs">${imgs.length ? imgs.map((im, idx) => `<div class="v7Thumb"><button class="v7RemoveImg" type="button" data-v7-rm-img="${idx}">×</button><img src="${esc(imgSrc(im))}" alt="Ảnh ${idx + 1}" loading="lazy" decoding="async"></div>`).join('') : '<div class="v7NoImage">Chưa có ảnh. Bấm “+ Thêm ảnh” nếu câu này cần hình.</div>'}</div></div>`;
  }
  function renderEditCard(q, i) {
    const opts = q.options || {};
    const optionRows = Object.keys(opts)
      .sort()
      .map(
        k =>
          `<div class="v7OptRow"><div class="v7Key">${esc(k)}</div><input value="${esc(opts[k] || '')}" data-v7-opt="${esc(k)}"><button class="v7DelOpt" type="button" data-v7-del-opt="${esc(k)}">×</button></div>`,
      )
      .join('');
    return `<article class="v7Card" data-v7-card="${i}"><div class="v7EditHead"><div class="v7EditTitle">Sửa toàn bộ Câu ${esc(q.num || i + 1)}</div><div class="v7EditHeadActions"><button class="btn" type="button" data-v7-cancel="${i}">Hủy</button><button class="primary" type="button" data-v7-save="${i}">Lưu sửa</button></div></div><div class="v7EditGrid"><div class="v7Field"><label>Câu hỏi</label><textarea data-v7-question>${esc(q.question || '')}</textarea></div><div class="v7Field"><label>Đáp án đúng</label><input data-v7-answer value="${esc(normAns(q))}" placeholder="VD: A hoặc AC"></div></div><div class="v7Field" style="margin-top:10px"><label>Các đáp án</label><div class="v7Options">${optionRows}</div></div>${renderImages(q, i)}<div class="v7Bottom"><button class="btn" type="button" data-v7-add-opt="${i}">+ Thêm đáp án</button></div></article>`;
  }
  function renderList(data) {
    const list = document.getElementById('v7List');
    if (!list) return;
    const filtered = data.map((q, i) => ({ q, i })).filter(x => pass(x.q));
    list.innerHTML = filtered.length
      ? filtered.map(x => renderCard(x.q, x.i)).join('')
      : '<div class="v7Empty">Không có câu nào phù hợp bộ lọc.</div>';
    renderStats(data);
  }
  function openPreview(data) {
    data = getData(data);
    let modal = document.getElementById('importPreviewModal');
    if (modal) modal.remove();
    modal = document.createElement('div');
    modal.id = 'importPreviewModal';
    modal.className = 'modal v7ImportModal';
    modal.innerHTML = `<div class="box v7ImportBox"><button class="modalX" type="button" data-v7-close>×</button><div class="v7Head"><div><span class="v7Label">XEM TRƯỚC IMPORT</span><h2>Kiểm tra câu hỏi</h2><p class="v7Hint">Chỉ hiện câu hỏi và đáp án đúng. Câu có ảnh sẽ hiện preview nhỏ.</p></div><div class="v7TopActions"><button class="primary v7SaveTop" type="button" data-v7-submit>Lưu Môn Học</button></div></div><div id="v7Stats" class="v7Stats"></div><div id="v7List" class="v7List"></div></div>`;
    document.body.appendChild(modal);
    renderList(data);
  }
  function saveEdit(i) {
    const data = getData();
    const q = data[i];
    const card = document.querySelector(`[data-v7-card="${i}"]`);
    if (!q || !card) return;
    const question = (card.querySelector('[data-v7-question]')?.value || '').trim();
    const answer = (card.querySelector('[data-v7-answer]')?.value || '')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z]/g, '');
    if (!question) return alert('Câu hỏi không được để trống.');
    if (!answer) return alert('Đáp án đúng không được để trống.');
    const options = {};
    card.querySelectorAll('[data-v7-opt]').forEach(inp => {
      const k = String(inp.dataset.v7Opt || '').toUpperCase();
      const v = (inp.value || '').trim();
      if (k && v) options[k] = v;
    });
    if (!Object.keys(options).length) return alert('Cần ít nhất 1 đáp án.');
    for (const k of answer.split('')) {
      if (!options[k]) return alert('Đáp án đúng ' + k + ' chưa có nội dung.');
    }
    q.question = question;
    q.answer = answer;
    q.options = options;
    q.answer_text = answer
      .split('')
      .map(k => k + '. ' + (options[k] || ''))
      .join('; ');
    q.has_image = !!(q.images && q.images.length);
    renderList(data);
    if (typeof notify === 'function') notify('Đã lưu sửa câu ' + (q.num || i + 1));
  }
  document.addEventListener('click', function (e) {
    const filter = e.target.closest('[data-v7-filter]');
    if (filter) {
      currentFilter = filter.dataset.v7Filter || 'all';
      renderList(getData());
      return;
    }
    if (e.target.closest('[data-v7-close]')) {
      document.getElementById('importPreviewModal')?.classList.add('hidden');
      return;
    }
    if (e.target.closest('[data-v7-submit]')) {
      document.getElementById('importPreviewModal')?.classList.add('hidden');
      window.__submitSubjectRequest?.();
      return;
    }
    const edit = e.target.closest('[data-v7-edit]');
    if (edit) {
      const i = +edit.dataset.v7Edit;
      const data = getData();
      const card = document.querySelector(`[data-v7-card="${i}"]`);
      if (card && data[i]) {
        card.outerHTML = renderEditCard(data[i], i);
        document.querySelector(`[data-v7-card="${i}"] textarea`)?.focus();
      }
      return;
    }
    const cancel = e.target.closest('[data-v7-cancel]');
    if (cancel) {
      renderList(getData());
      return;
    }
    const save = e.target.closest('[data-v7-save]');
    if (save) {
      saveEdit(+save.dataset.v7Save);
      return;
    }
    const pick = e.target.closest('[data-v7-pick-img]');
    if (pick) {
      document.querySelector(`[data-v7-input="${pick.dataset.v7PickImg}"]`)?.click();
      return;
    }
    const rm = e.target.closest('[data-v7-rm-img]');
    if (rm) {
      const card = rm.closest('[data-v7-card]');
      const i = +(card?.dataset.v7Card || 0);
      const q = getData()[i];
      if (q?.images) {
        q.images.splice(+rm.dataset.v7RmImg, 1);
        q.has_image = !!q.images.length;
        card.outerHTML = renderEditCard(q, i);
      }
      return;
    }
    const add = e.target.closest('[data-v7-add-opt]');
    if (add) {
      const i = +add.dataset.v7AddOpt;
      const data = getData();
      const q = data[i];
      const k = nextKey(q.options || {});
      if (!k) return alert('Đã đủ số đáp án.');
      q.options = q.options || {};
      q.options[k] = '';
      const card = document.querySelector(`[data-v7-card="${i}"]`);
      if (card) {
        card.outerHTML = renderEditCard(q, i);
        document.querySelector(`[data-v7-card="${i}"] [data-v7-opt="${k}"]`)?.focus();
      }
      return;
    }
    const del = e.target.closest('[data-v7-del-opt]');
    if (del) {
      const card = del.closest('[data-v7-card]');
      const i = +(card?.dataset.v7Card || 0);
      const q = getData()[i];
      const k = del.dataset.v7DelOpt;
      if (q?.options && k) {
        delete q.options[k];
        card.outerHTML = renderEditCard(q, i);
      }
      return;
    }
  });
  document.addEventListener('change', async function (e) {
    const inp = e.target.closest('[data-v7-input]');
    if (!inp) return;
    const i = +inp.dataset.v7Input;
    const q = getData()[i];
    if (!q) return;
    q.images = q.images || [];
    const files = Array.from(inp.files || []);
    if (!files.length) return;
    inp.disabled = true;
    if (typeof notify === 'function') notify('Đang upload ảnh...');
    try {
      for (const file of files) {
        if (window.__LHUploadCloudinary) {
          const uploaded = await window.__LHUploadCloudinary(file);
          if (uploaded) q.images.push(uploaded);
        } else {
          const fr = new FileReader();
          const p = new Promise(resolve => {
            fr.onload = function () {
              q.images.push({
                id: 'import_' + Date.now() + '_' + Math.random().toString(16).slice(2),
                src: fr.result,
                source: 'user-upload',
                name: file.name,
              });
              resolve();
            };
            fr.readAsDataURL(file);
          });
          await p;
        }
      }
      q.has_image = true;
      const card = document.querySelector(`[data-v7-card="${i}"]`);
      if (card) card.outerHTML = renderEditCard(q, i);
      if (typeof notify === 'function') notify('Đã upload ảnh thành URL');
    } catch (err) {
      alert(err.message || err);
    } finally {
      inp.disabled = false;
      inp.value = '';
    }
  });
  window.__openImportPreviewModal = openPreview;
  window.__editImportPreviewQuestion = function (i) {
    const data = getData();
    const card = document.querySelector(`[data-v7-card="${i}"]`);
    if (card && data[i]) card.outerHTML = renderEditCard(data[i], i);
  };
})();

// IMAGE_LIGHTBOX_PREVIEW_CLICK_20260626
(function () {
  function ensureLightbox() {
    let lb = document.getElementById('v7ImageLightbox');
    if (lb) return lb;
    lb = document.createElement('div');
    lb.id = 'v7ImageLightbox';
    lb.className = 'v7Lightbox hidden';
    lb.innerHTML =
      '<div class="v7LightboxInner"><button class="v7LightboxClose" type="button" aria-label="Đóng">×</button><img class="v7LightboxImg" alt="Ảnh phóng to" loading="lazy" decoding="async"></div>';
    document.body.appendChild(lb);
    return lb;
  }
  function openImg(src) {
    if (!src) return;
    const lb = ensureLightbox();
    const img = lb.querySelector('.v7LightboxImg');
    if (img) img.src = src;
    lb.classList.remove('hidden');
  }
  function closeImg() {
    const lb = document.getElementById('v7ImageLightbox');
    if (!lb) return;
    lb.classList.add('hidden');
    const img = lb.querySelector('.v7LightboxImg');
    if (img) img.removeAttribute('src');
  }
  document.addEventListener(
    'click',
    function (e) {
      const thumb = e.target.closest('.v7MiniImgs img, .v7Thumb img');
      if (thumb) {
        e.preventDefault();
        e.stopPropagation();
        openImg(thumb.currentSrc || thumb.src);
        return;
      }
      if (e.target.closest('.v7LightboxClose') || e.target.id === 'v7ImageLightbox') {
        closeImg();
      }
    },
    true,
  );
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeImg();
  });
})(); /* FINAL APP CLEANUP 20260627: remove old/duplicate UI shells after load */

(function () {
  window.__APP_UI_CLEAN_FINAL__ = '20260627';
  function cleanupOldUI() {
    [
      '#hodLoginScreen',
      '#hodRoleBar',
      '#hodUserDock',
      '#hodFinalRoleBar',
      '#hodFinalLogin',
      '.hodAuthLanding',
      '.hodFloatingAuth',
      '.legacyLogin',
      '.legacyAuth',
      '.oldLanding',
    ].forEach(function (s) {
      document.querySelectorAll(s).forEach(function (el) {
        el.remove();
      });
    });
    // Giữ 1 avatar/menu/chip cuối, tránh patch cũ tạo trùng.
    ['#hodTopAvatar', '#subjectTopChip', '#hodAccountMenu'].forEach(function (s) {
      var arr = Array.from(document.querySelectorAll(s));
      arr.slice(0, Math.max(0, arr.length - 1)).forEach(function (el) {
        el.remove();
      });
    });
    // Không cho nút admin cũ/float hiện với user thường.
    if (!window.HODSupabase?.canOpenDashboard?.()) {
      document.querySelectorAll('#adminOpenBtn,#hodFloatAdmin').forEach(function (el) {
        el.remove();
      });
      document.getElementById('adminModal')?.classList.add('hidden');
    }
    // Tắt nút random nếu theme cũ còn inject lại.
    document.querySelectorAll('#shuffle,#stShuffle').forEach(function (el) {
      el.style.display = 'none';
      el.disabled = true;
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', cleanupOldUI);
  else cleanupOldUI();
  setTimeout(cleanupOldUI, 300);
  setTimeout(cleanupOldUI, 1200);
})();

// ===== FINAL_EXAM_ONLY_QUIZ_UI_20260627 =====
// Thân block đã chuyển sang ./exam.js (bước 2 của docs/SPLIT_PLAN.md). Gọi ĐÚNG chỗ cũ
// để thứ tự chạy không đổi: block này vốn chạy sau 8000 dòng đầu của appCore, còn
// `import` thì luôn bị đưa lên đầu file.
installExam();
// ===== FINAL_EXAM_ONLY_QUIZ_UI_20260627 END =====

// ===== LIBRARY_LABEL_AND_UI_FIX_20260627 =====
// Thân block đã chuyển sang ./library.js. Gọi đúng chỗ cũ để thứ tự chạy không đổi.
installLibraryLabelFix();
// ===== LIBRARY_LABEL_AND_UI_FIX_20260627 END =====

// ===== LIBRARY_FILTER_AND_EDIT_PREVIEW_LAYOUT_20260627 =====
// Thân block (editor đang chạy: openEditPreview / saveEditPreview) đã chuyển sang
// ./editor.js — bước 3 của docs/SPLIT_PLAN.md. Gọi ĐÚNG chỗ cũ để thứ tự chạy không đổi:
// `import` thì luôn bị đưa lên đầu file.
installEditor();
// ===== LIBRARY_FILTER_AND_EDIT_PREVIEW_LAYOUT_20260627 END =====

/*
  ===== LIBRARY_UX_STEP2_PREVIEW_CARDS_20260627 — ĐÃ XÓA (20260727) =====
  Block này gán `renderStudy = render` lúc parse, nhưng
  LIBRARY_UX_STEP1_STABLE_RENDER gán lại `renderStudy = renderUnified` trong
  setTimeout(apply, 0) -> bản của STEP2 không bao giờ chạy sau mốc đó.
  Hệ quả cũ: setTimeout(render, 500) của nó vẽ một lượt thẻ kiểu cũ vào
  #studyList rồi bị STEP1 vẽ lại, và để lại #libraryQuestionFilters mồ côi
  (app.css:1965 phải dán `display:none!important` để che). Các handler
  data-library-study / data-library-report / data-library-toggle cũng chết vì
  thẻ do STEP1 sinh ra dùng data-stable-*.
  Toàn bộ tính năng tương ứng nằm trong LIBRARY_UX_STEP1_STABLE_RENDER_20260627.
*/

// ===== LIBRARY_UX_STEP1_STABLE_RENDER_20260627 =====
// Thân block đã chuyển sang ./library.js. Gọi đúng chỗ cũ để thứ tự chạy không đổi.
installLibrary();
// ===== LIBRARY_UX_STEP1_STABLE_RENDER_20260627 END =====

// ===== COPILOT_CLOUDINARY_IMAGE_FIX_20260627 =====
// Ảnh mới sẽ upload lên Cloudinary, KHÔNG lưu Base64 vào Supabase nữa.
(function () {
  const CLOUDINARY_CLOUD_NAME = window.APP_CONFIG?.CLOUDINARY_CLOUD_NAME || '';
  const CLOUDINARY_UPLOAD_PRESET = window.APP_CONFIG?.CLOUDINARY_UPLOAD_PRESET || '';
  const CLOUDINARY_UPLOAD_FOLDER = window.APP_CONFIG?.CLOUDINARY_UPLOAD_FOLDER || 'learninghub/questions';
  const CLOUDINARY_UPLOAD_URL =
    window.APP_CONFIG?.CLOUDINARY_UPLOAD_URL ||
    (CLOUDINARY_CLOUD_NAME ? `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload` : '');
  const SUBJECT_STORE = 'learninghub_subject_code_merged_v1';
  const QUESTION_LIGHT_COLUMNS =
    'id,subject_code,num,question,options,answer,answer_text,images,is_active,updated_at,has_image,error_risk,error_risk_reason,has_image,error_risk,error_risk_reason';
  function $(id) {
    return document.getElementById(id);
  }
  function supa() {
    return window.HODSupabase?.__client || null;
  }
  function user() {
    return window.HODSupabase?.getUser?.() || null;
  }
  function subject() {
    return localStorage.getItem(SUBJECT_STORE) || '';
  }
  function notifyX(t) {
    if (typeof notify === 'function') notify(t);
    else console.log(t);
  }
  async function uploadCloudinary(file) {
    if (!CLOUDINARY_UPLOAD_URL || !CLOUDINARY_UPLOAD_PRESET) throw new Error('Thiếu Cloudinary trong config.js.');
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    fd.append('folder', CLOUDINARY_UPLOAD_FOLDER);
    const res = await fetch(CLOUDINARY_UPLOAD_URL, { method: 'POST', body: fd });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error?.message || 'Upload Cloudinary thất bại');
    return {
      id: data.public_id,
      public_id: data.public_id,
      src: data.secure_url,
      url: data.secure_url,
      width: data.width,
      height: data.height,
      source: 'cloudinary',
    };
  }
  async function loadSubjectLight(force = false) {
    const code = subject();
    if (!code) return false;
    try {
      if (typeof window.__examResetForSubjectChange === 'function') window.__examResetForSubjectChange();
    } catch (e) {
      lhWarn('COPILOT_CLOUDINARY_IMAGE_FIX_20260627', e);
    }
    try {
      const res = await fetch('/api/questions?subject_code=' + encodeURIComponent(code) + '&ts=' + Date.now(), {
        cache: 'no-store',
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.error) throw new Error(json.error || 'Không tải được câu hỏi từ Turso');
      const data = Array.isArray(json.data) ? json.data : [];
      LHState.RAW = data.map(r => {
        const images = typeof cleanImages === 'function' ? cleanImages(r.images || []) : r.images || [];
        return {
          id: r.id,
          subject_code: r.subject_code || code,
          num: r.num,
          question: r.question,
          options: r.options || {},
          answer: r.answer || '',
          answer_text: r.answer_text || '',
          images,
          has_image: !!(r.has_image || images.length),
          error_risk: r.error_risk,
          error_risk_reason: r.error_risk_reason,
          __imagesChecked: true,
          __imagesLoaded: true,
        };
      });
      LHState.pool = [...LHState.RAW];
      const saved = +localStorage.getItem('learninghub_progress_' + code) || 0;
      LHState.ci = Math.max(0, Math.min(saved, Math.max(0, LHState.pool.length - 1)));
      LHState.flipped = false;
      renderAllSafe(); // FIX_LIBRARY_STALE_AFTER_SUBJECT_CHANGE_20260727
      return true;
    } catch (e) {
      console.warn('[light load]', e);
      return false;
    }
  }
  window.loadCurrentSubjectOnly = loadSubjectLight;
  function patchApi() {
    if (window.HODSupabase) window.HODSupabase.loadQuestionsFromSupabase = loadSubjectLight;
  }
  patchApi();
  setTimeout(patchApi, 500);
  setTimeout(patchApi, 1500);

  async function fetchImagesForCurrent() {
    const c = supa();
    const q = (LHState.pool && LHState.pool[LHState.ci]) || null;
    if (!c || !q || !q.id || q.__imagesChecked) return;
    q.__imagesChecked = true;
    const { data, error } = await c.from('questions').select('id,images').eq('id', q.id).maybeSingle();
    if (!error && data) {
      q.images = data.images || [];
      q.__imagesLoaded = true;
      try {
        renderCard();
      } catch (e) {
        lhWarn('COPILOT_CLOUDINARY_IMAGE_FIX_20260627', e);
      }
    }
  }
  const oldRenderCard = typeof renderCard === 'function' ? renderCard : null;
  if (oldRenderCard && !oldRenderCard.__cloudinaryLazy) {
    renderCard = function () {
      oldRenderCard.apply(this, arguments);
    }; // tắt auto fetch ảnh để tránh nhấp nháy
    renderCard.__cloudinaryLazy = true;
    window.renderCard = renderCard;
  }

  function bindEditorUpload() {
    const inp = $('imgUpload');
    if (!inp || inp.__cloudinaryBound) return;
    inp.__cloudinaryBound = true;
    inp.onchange = async function (e) {
      const files = Array.from(e.target.files || []);
      if (!files.length) return;
      inp.disabled = true;
      notifyX('Đang upload ảnh lên Cloudinary...');
      try {
        LHState.editDraft.images = LHState.editDraft.images || [];
        for (const file of files) {
          LHState.editDraft.images.push(await uploadCloudinary(file));
        }
        if (typeof renderEditImages === 'function') renderEditImages();
        notifyX('Đã upload ảnh lên Cloudinary');
      } catch (err) {
        alert(err.message || err);
      } finally {
        inp.disabled = false;
        e.target.value = '';
      }
    };
  }
  // Lớp bọc openEditor của block này đã XÓA (20260727): chết vì apply() ở mốc 900ms.
  // Bỏ luôn được một đường đọc THẲNG Supabase từ client (c.from("questions")) mà
  // CLAUDE.md nói phải chuyển dần sang /api/*. loadCurrentSubjectOnly / renderCard của
  // block này vẫn sống.
  document.addEventListener('DOMContentLoaded', () => {
    patchApi();
    setTimeout(bindEditorUpload, 300);
  });
})();

// ===== FINAL_URL_ONLY_IMAGES_AND_CURRENT_RELOAD_20260628 =====
// Mục tiêu: không lưu Base64 mới, chỉ lưu URL ảnh, tải câu nhẹ, có nút/tự reload câu hiện tại.
(function () {
  const CLOUD_NAME = window.APP_CONFIG?.CLOUDINARY_CLOUD_NAME || '';
  const UPLOAD_PRESET = window.APP_CONFIG?.CLOUDINARY_UPLOAD_PRESET || '';
  const UPLOAD_FOLDER = window.APP_CONFIG?.CLOUDINARY_UPLOAD_FOLDER || 'learninghub/questions';
  const UPLOAD_URL =
    window.APP_CONFIG?.CLOUDINARY_UPLOAD_URL ||
    (CLOUD_NAME ? `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload` : '');
  const SUBJECT_STORE = 'learninghub_subject_code_merged_v1';
  const LIGHT_COLUMNS =
    'id,subject_code,num,question,options,answer,answer_text,is_active,updated_at,has_image,error_risk,error_risk_reason';
  const FULL_COLUMNS =
    'id,subject_code,num,question,options,answer,answer_text,images,is_active,updated_at,has_image,error_risk,error_risk_reason,has_image,error_risk,error_risk_reason';
  let lastAutoReload = 0;

  function $(id) {
    return document.getElementById(id);
  }
  function supa() {
    return window.HODSupabase?.__client || null;
  }
  function user() {
    return window.HODSupabase?.getUser?.() || null;
  }
  function subject() {
    return localStorage.getItem(SUBJECT_STORE) || '';
  }
  function notifyX(msg) {
    if (typeof notify === 'function') notify(msg);
    else console.log(msg);
  }

  function isDataImage(s) {
    return /^data:image\//i.test(String(s || ''));
  }
  function isLikelyBase64(s) {
    s = String(s || '').trim();
    return s.length > 500 && /^(iVBORw0KGgo|\/9j\/|R0lGOD|UklGR)/.test(s);
  }
  function cleanImageOne(im) {
    if (!im) return null;
    if (typeof im === 'string') {
      const s = im.trim();
      if (!s || isDataImage(s) || isLikelyBase64(s)) return null;
      if (/^https?:\/\//i.test(s)) return { src: s, url: s, source: 'url' };
      return null;
    }
    if (typeof im === 'object') {
      const raw =
        im.secure_url ||
        im.src ||
        im.url ||
        im.publicUrl ||
        im.public_url ||
        im.image_url ||
        im.imageUrl ||
        im.file_url ||
        im.fileUrl ||
        im.href ||
        im.path ||
        '';
      if (!raw || isDataImage(raw) || isLikelyBase64(raw)) return null;
      if (!/^https?:\/\//i.test(String(raw))) return null;
      return {
        id: im.public_id || im.id || undefined,
        public_id: im.public_id || im.id || undefined,
        src: String(raw),
        url: String(raw),
        width: im.width || undefined,
        height: im.height || undefined,
        source: im.source || 'url',
      };
    }
    return null;
  }
  function cleanImages(arr) {
    let raw = arr || [];
    if (typeof raw === 'string') {
      const s = raw.trim();
      if ((s.startsWith('[') && s.endsWith(']')) || (s.startsWith('{') && s.endsWith('}'))) {
        try {
          raw = JSON.parse(s);
        } catch (e) {
          raw = [raw];
        }
      } else raw = [raw];
    }
    if (!Array.isArray(raw)) raw = [raw];
    return raw.map(cleanImageOne).filter(Boolean);
  }
  function imageUrl(im) {
    const c = cleanImageOne(im);
    return c?.src || '';
  }

  async function uploadCloudinary(file) {
    if (!UPLOAD_URL || !UPLOAD_PRESET) throw new Error('Thiếu Cloudinary trong config.js.');
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', UPLOAD_PRESET);
    fd.append('folder', UPLOAD_FOLDER);
    const res = await fetch(UPLOAD_URL, { method: 'POST', body: fd });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error?.message || 'Upload ảnh lên Cloudinary thất bại');
    return cleanImageOne({
      public_id: data.public_id,
      secure_url: data.secure_url,
      width: data.width,
      height: data.height,
      source: 'cloudinary',
    });
  }

  window.__LHCleanImages = cleanImages;
  window.__LHUploadCloudinary = uploadCloudinary;

  function optimizeImageUrl(src) {
    if (!src) return '';
    if (src.includes('res.cloudinary.com/') && src.includes('/image/upload/')) {
      if (!src.includes('q_auto') && !src.includes('f_auto')) {
        return src.replace('/image/upload/', '/image/upload/c_limit,w_600,q_auto,f_auto/');
      }
    }
    return src;
  }

  // Hiển thị ảnh chỉ từ URL hợp lệ.
  window.imgsHTML = imgsHTML = function (c) {
    return cleanImages(c?.images || [])
      .map(im => `<img src="${esc(optimizeImageUrl(im.src))}" alt="" loading="lazy" decoding="async">`)
      .join('');
  };

  function bindEditorUpload() {
    const inp = $('imgUpload');
    if (!inp || inp.__urlOnlyBound) return;
    inp.__urlOnlyBound = true;
    inp.onchange = async function (e) {
      const files = Array.from(e.target.files || []);
      if (!files.length) return;
      inp.disabled = true;
      notifyX('Đang upload ảnh...');
      try {
        LHState.editDraft.images = cleanImages(LHState.editDraft.images);
        for (const file of files) {
          const uploaded = await uploadCloudinary(file);
          if (uploaded) LHState.editDraft.images.push(uploaded);
        }
        if (typeof renderEditImages === 'function') renderEditImages();
        notifyX('Đã upload ảnh bằng URL');
      } catch (err) {
        alert(err.message || err);
      } finally {
        inp.disabled = false;
        inp.value = '';
      }
    };
  }

  // Không cho render/sửa ảnh Base64 cũ ở form.
  const oldRenderEditImages = typeof renderEditImages === 'function' ? renderEditImages : null;
  renderEditImages = window.renderEditImages = function () {
    const box = $('editImgs');
    if (!box) return oldRenderEditImages ? oldRenderEditImages() : undefined;
    LHState.editDraft.images = cleanImages(LHState.editDraft.images);
    box.innerHTML = LHState.editDraft.images.length
      ? LHState.editDraft.images
          .map(
            (im, i) =>
              `<div class="editImg"><button class="rm" data-rm="${i}">×</button><img src="${esc(im.src)}" loading="lazy" decoding="async"></div>`,
          )
          .join('')
      : '<p style="color:var(--mist)">Chưa có hình.</p>';
  };

  // Lớp bọc openEditor của block này đã XÓA (20260727): chết vì apply() ở mốc 900ms.
  // Nó nạp trước ảnh của câu từ Turso rồi lọc lại editDraft.images — việc nạp ảnh nay do
  // thư viện (LIBRARY_UX_STEP1_STABLE_RENDER) làm. __LHCleanImages vẫn sống.

  // Chặn Base64 trước mọi luồng gửi báo cáo/sửa.
  if (window.HODSupabase?.submitEditRequest && !window.HODSupabase.submitEditRequest.__urlOnlyPatch) {
    const oldSubmit = window.HODSupabase.submitEditRequest.bind(window.HODSupabase);
    window.HODSupabase.submitEditRequest = async function (newDraft, oldQ) {
      if (newDraft) newDraft.images = cleanImages(newDraft.images);
      if (oldQ) oldQ.images = cleanImages(oldQ.images);
      return oldSubmit(newDraft, oldQ);
    };
    window.HODSupabase.submitEditRequest.__urlOnlyPatch = true;
  }

  const CACHE_TTL = 12 * 60 * 60 * 1000; // 12 giờ
  /*
    QUESTION_CACHE_REVALIDATE_20260726
    Key đổi v1 -> v2 để bỏ các cache v1 đã "nhiễm độc": chúng được ghi lúc DB còn
    images = [] và sống tới 12 giờ, nên ảnh mới thêm vào DB không bao giờ hiện ra
    (F5 cũng vô ích vì boot dùng loadSubjectLight(false) = đọc cache).
    Cache giờ chỉ để render tức thì, luôn kèm revalidate ngầm (xem revalidateQuestions).
  */
  function cacheKey(code) {
    return 'learninghub_questions_cache_v2_' + code;
  }
  function readQuestionCache(code) {
    try {
      const raw = localStorage.getItem(cacheKey(code));
      if (!raw) return null;
      const obj = JSON.parse(raw);
      if (!obj || !obj.savedAt || !Array.isArray(obj.rows)) return null;
      if (Date.now() - obj.savedAt > CACHE_TTL) return null;
      return obj.rows;
    } catch (e) {
      return null;
    }
  }
  function writeQuestionCache(code, rows) {
    try {
      localStorage.setItem(cacheKey(code), JSON.stringify({ savedAt: Date.now(), rows: rows || [] }));
    } catch (e) {
      lhWarn('FINAL_URL_ONLY_IMAGES_AND_CURRENT_RELOAD_20260628', e);
    }
  }
  async function fetchTursoQuestions(code, fresh = false) {
    // fresh=1: bỏ qua cả cache 5 phút phía server (_questionsCache trong
    // api/controllers/questions.js). `cache:'no-store'` chỉ bỏ cache của browser.
    const res = await fetch(
      '/api/questions?subject_code=' + encodeURIComponent(code) + (fresh ? '&fresh=1' : '') + '&ts=' + Date.now(),
      { cache: 'no-store' },
    );
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.error) throw new Error(json.error || 'Không tải được câu hỏi từ Turso');
    return Array.isArray(json.data) ? json.data : [];
  }
  function mapTursoRow(r, code) {
    const images = cleanImages(r.images || []);
    return {
      id: r.id,
      subject_code: r.subject_code || code,
      num: r.num,
      question: r.question,
      options: r.options || {},
      answer: r.answer || '',
      answer_text: r.answer_text || '',
      images,
      is_active: r.is_active !== false && r.is_active !== 0 && r.is_active !== '0',
      updated_at: r.updated_at,
      has_image: !!(r.has_image || images.length),
      error_risk: r.error_risk || 'low',
      error_risk_reason: r.error_risk_reason || '',
      __imagesChecked: true,
      __imagesLoaded: true,
    };
  }
  function applyQuestionRows(rows, code) {
    LHState.RAW = (rows || []).map(r => mapTursoRow(r, code));
    LHState.pool = [...LHState.RAW];
    const saved = +localStorage.getItem('learninghub_progress_' + code) || 0;
    LHState.ci = Math.max(0, Math.min(saved, Math.max(0, LHState.pool.length - 1)));
    LHState.flipped = false;
    renderAllSafe(); // FIX_LIBRARY_STALE_AFTER_SUBJECT_CHANGE_20260727
  }

  /*
    QUESTION_CACHE_REVALIDATE_20260726
    Render ngay từ cache rồi đối chiếu lại với server ở background. Vá TẠI CHỖ
    (Object.assign lên đúng object trong RAW/pool) thay vì applyQuestionRows để
    không reset ci -> người dùng không bị nhảy về câu khác giữa lúc đang học.
    Fetch KHÔNG dùng fresh=1: cache 5 phút của server đủ mới cho lần đối chiếu này
    và không tốn thêm read Turso (xem OPTIM_TURSO_READS_20260726).
  */
  let revalidating = {};
  async function revalidateQuestions(code) {
    if (revalidating[code]) return;
    revalidating[code] = true;
    try {
      const rows = await fetchTursoQuestions(code);
      if (!rows.length || subject() !== code) return;
      writeQuestionCache(code, rows);
      const byId = new Map(rows.map(r => [String(r.id), mapTursoRow(r, code)]));
      let changed = 0;
      const patch = row => {
        const next = byId.get(String(row?.id));
        if (!next) return row;
        if (
          row.question !== next.question ||
          row.answer !== next.answer ||
          JSON.stringify(row.images || []) !== JSON.stringify(next.images || [])
        )
          changed++;
        return Object.assign(row, next);
      };
      LHState.RAW = (LHState.RAW || []).map(patch);
      LHState.pool = (LHState.pool || []).map(patch);
      if (changed) {
        console.info('[revalidateQuestions] ' + code + ': cập nhật ' + changed + ' câu từ server');
        renderAllSafe(); // FIX_LIBRARY_STALE_AFTER_SUBJECT_CHANGE_20260727
      }
    } catch (e) {
      console.warn('[revalidateQuestions]', e);
    } finally {
      delete revalidating[code];
    }
  }

  let activeLoadPromises = {};
  async function loadSubjectLight(force = false) {
    const code = subject();
    if (!user() || !code) return false;
    if (!force) {
      const cached = readQuestionCache(code);
      if (cached && cached.length && cached.every(r => Object.prototype.hasOwnProperty.call(r, 'images'))) {
        applyQuestionRows(cached, code);
        revalidateQuestions(code); // cố ý không await: hiện dữ liệu cache trước, sửa sau
        return true;
      }
    }
    if (activeLoadPromises[code]) return activeLoadPromises[code];
    if (typeof window.showLibrarySkeleton === 'function') window.showLibrarySkeleton();
    activeLoadPromises[code] = (async () => {
      try {
        const data = await fetchTursoQuestions(code, force);
        writeQuestionCache(code, data);
        applyQuestionRows(data, code);
        return true;
      } catch (e) {
        console.warn('[loadSubjectLight]', e);
        return false;
      } finally {
        delete activeLoadPromises[code];
      }
    })();
    return activeLoadPromises[code];
  }

  async function fetchImagesForCurrent(force = false) {
    const q = (LHState.pool && LHState.pool[LHState.ci]) || null;
    const code = subject();
    if (!q?.id || !code) return false;
    if (!force && q.__imagesLoaded) return true;
    if (q.__imagesLoading) return true;
    if (!force && q.images && q.images.length) {
      q.__imagesLoaded = true;
      return true;
    }
    if (!force && !q.has_image) {
      q.images = [];
      q.__imagesLoaded = true;
      return true;
    }
    q.__imagesLoading = true;
    try {
      const rows = await fetchTursoQuestions(code);
      const data = rows.find(r => String(r.id) === String(q.id));
      if (data) {
        const mapped = mapTursoRow(data, code);
        Object.assign(q, mapped);
        try {
          writeQuestionCache(
            code,
            LHState.pool.map(x => ({
              id: x.id,
              subject_code: x.subject_code,
              num: x.num,
              question: x.question,
              options: x.options,
              answer: x.answer,
              answer_text: x.answer_text,
              images: x.images,
              is_active: x.is_active,
              updated_at: x.updated_at,
              has_image: x.has_image,
              error_risk: x.error_risk,
              error_risk_reason: x.error_risk_reason,
            })),
          );
        } catch (e) {
          lhWarn('FINAL_URL_ONLY_IMAGES_AND_CURRENT_RELOAD_20260628', e);
        }
        renderAllSafe(); // FIX_LIBRARY_STALE_AFTER_SUBJECT_CHANGE_20260727
      }
      q.__imagesLoaded = true;
      return !!data;
    } catch (e) {
      q.__imagesLoaded = true;
      return false;
    } finally {
      q.__imagesLoading = false;
    }
  }

  async function reloadCurrentQuestion(silent = false) {
    const q = (LHState.pool && LHState.pool[LHState.ci]) || null;
    const code = subject();
    if (!q?.id || !code) return false;
    try {
      const rows = await fetchTursoQuestions(code, true); // người dùng bấm reload => phải lấy bản mới nhất
      const data = rows.find(r => String(r.id) === String(q.id));
      if (!data) {
        if (!silent) alert('Không reload được câu hiện tại.');
        return false;
      }
      const clean = mapTursoRow(data, code);
      const upd = row => (String(row.id) === String(clean.id) ? Object.assign(row, clean) : row);
      LHState.RAW = (LHState.RAW || []).map(upd);
      LHState.pool = (LHState.pool || []).map(upd);
      renderAllSafe(); // FIX_LIBRARY_STALE_AFTER_SUBJECT_CHANGE_20260727
      if (!silent) notifyX('Đã reload câu hiện tại');
      return true;
    } catch (e) {
      if (!silent) alert('Không reload được câu hiện tại.');
      return false;
    }
  }

  window.loadCurrentSubjectOnly = loadSubjectLight;
  window.reloadCurrentQuestion = reloadCurrentQuestion;
  if (window.HODSupabase) window.HODSupabase.loadQuestionsFromSupabase = loadSubjectLight;

  let lazyLoadTimeout = null;
  const oldRenderCard = typeof renderCard === 'function' ? renderCard : null;
  if (oldRenderCard && !oldRenderCard.__urlOnlyLazy) {
    renderCard = window.renderCard = function () {
      oldRenderCard.apply(this, arguments);
      // Gọi fetchImagesForCurrent tự động sau khi render có debounce 300ms
      if (lazyLoadTimeout) clearTimeout(lazyLoadTimeout);
      lazyLoadTimeout = setTimeout(() => {
        fetchImagesForCurrent(false);
      }, 300);
    };
    renderCard.__urlOnlyLazy = true;
  }

  function ensureReloadButton() {
    return;
  }

  function autoReloadCurrent() {
    const now = Date.now();
    if (now - lastAutoReload < 45000) return;
    lastAutoReload = now;
    reloadCurrentQuestion(true);
  }

  // Tắt tự reload câu hiện tại sau mỗi 60 giây/focus (chỉ load khi chọn môn).
})();
// ===== END FINAL_URL_ONLY_IMAGES_AND_CURRENT_RELOAD_20260628 =====

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
// Nếu môn đang chọn đã load câu hỏi, số câu trên thẻ môn phải lấy từ RAW/pool ngay, không để cache 0 đè lên.
(function () {
  if (window.__ACTIVE_SUBJECT_COUNT_SYNC_20260629) return;
  window.__ACTIVE_SUBJECT_COUNT_SYNC_20260629 = true;

  const STORE = 'learninghub_subject_counts_cache_v3';
  const SUBJECT_STORE = 'learninghub_subject_code_merged_v1';

  function code() {
    return localStorage.getItem(SUBJECT_STORE) || '';
  }
  function read() {
    try {
      return JSON.parse(localStorage.getItem(STORE) || '{}') || {};
    } catch (e) {
      return {};
    }
  }
  function write(x) {
    try {
      localStorage.setItem(STORE, JSON.stringify(x || {}));
    } catch (e) {
      lhWarn('ACTIVE_SUBJECT_COUNT_SYNC_20260629', e);
    }
  }
  function cssEscape(s) {
    try {
      return CSS.escape(String(s));
    } catch (e) {
      return String(s).replace(/"/g, '\\"');
    }
  }
  function loadedCount() {
    try {
      if (Array.isArray(LHState.RAW) && LHState.RAW.length) return LHState.RAW.length;
      if (Array.isArray(LHState.pool) && LHState.pool.length) return LHState.pool.length;
    } catch (e) {
      lhWarn('ACTIVE_SUBJECT_COUNT_SYNC_20260629', e);
    }
    return 0;
  }
  function setCardCount(subject, n) {
    if (!subject || !Number.isFinite(Number(n)) || Number(n) <= 0) return;
    const count = Number(n);
    document.querySelectorAll('.subjectCard[data-code="' + cssEscape(subject) + '"]').forEach(card => {
      const meta = card.querySelector('.subjectMeta span:first-child');
      if (meta) meta.textContent = count + ' câu';
      card.title = (card.title || subject).replace(/(?:\d+|—|0) câu/g, count + ' câu');
    });
    const store = read();
    store.counts = store.counts || {};
    store.confirmed = store.confirmed || {};
    store.counts[subject] = count;
    store.confirmed[subject] = true;
    store.updated_at = new Date().toISOString();
    write(store);
  }
  function syncActiveSubjectCount() {
    const subject = code();
    const n = loadedCount();
    if (subject && n > 0) setCardCount(subject, n);
  }

  window.syncActiveSubjectCount = syncActiveSubjectCount;

  const oldLoadCurrent = window.loadCurrentSubjectOnly;
  if (typeof oldLoadCurrent === 'function' && !oldLoadCurrent.__activeCountPatched) {
    window.loadCurrentSubjectOnly = async function () {
      const out = await oldLoadCurrent.apply(this, arguments);
      setTimeout(syncActiveSubjectCount, 50);
      setTimeout(syncActiveSubjectCount, 300);
      return out;
    };
    window.loadCurrentSubjectOnly.__activeCountPatched = true;
  }

  const oldLoadBySubject = window.loadBySubject;
  if (typeof oldLoadBySubject === 'function' && !oldLoadBySubject.__activeCountPatched) {
    window.loadBySubject = async function () {
      const out = await oldLoadBySubject.apply(this, arguments);
      setTimeout(syncActiveSubjectCount, 50);
      setTimeout(syncActiveSubjectCount, 300);
      return out;
    };
    window.loadBySubject.__activeCountPatched = true;
  }

  const oldRenderCard = typeof renderCard === 'function' ? renderCard : null;
  if (oldRenderCard && !window.__renderCardActiveCountPatched) {
    window.__renderCardActiveCountPatched = true;
    renderCard = function () {
      const out = oldRenderCard.apply(this, arguments);
      setTimeout(syncActiveSubjectCount, 0);
      return out;
    };
    window.renderCard = renderCard;
  }

  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(syncActiveSubjectCount, 500);
    setTimeout(syncActiveSubjectCount, 1500);
  });
  setInterval(() => {
    const gate = document.getElementById('subjectGate');
    if (gate && !gate.classList.contains('hidden')) syncActiveSubjectCount();
  }, 800);
})();
// ===== END ACTIVE_SUBJECT_COUNT_SYNC_20260629 =====

// SUBJECTS_CACHE_BUST_AFTER_ADD_20260629 đã bị xóa (20260702): chỉ tác dụng khi có
// request GET /rest/v1/subjects (Supabase REST trực tiếp), nhưng subjects giờ luôn
// lấy qua /api/subjects (xem NOTE_20260630 đầu file) nên nhánh đó không bao giờ chạy.

// ===== REMOVE_EYE_HIDE_OPTIONS_20260629 =====
// Xóa nút con mắt và tắt hẳn chức năng ẩn/hiện lựa chọn.
(function () {
  function apply() {
    try {
      localStorage.removeItem('hod102_hide_options');
    } catch (e) {
      lhWarn('REMOVE_EYE_HIDE_OPTIONS_20260629', e);
    }
    var opt = document.getElementById('options');
    if (opt) opt.classList.remove('hide');
    var eye = document.getElementById('toggleOpts');
    if (eye) eye.remove();
    var st = document.getElementById('stToggleOpts');
    if (st) st.style.display = 'none';
    var stText = document.getElementById('stOptState');
    if (stText) stText.textContent = 'Đang hiện lựa chọn';
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply);
  else apply();
  setTimeout(apply, 300);
})();
// ===== END REMOVE_EYE_HIDE_OPTIONS_20260629 =====

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
// Fix nhẹ: mới vào web tự tải câu hỏi + thư viện, không cần F5. Không chạy vòng lặp dài.
(function () {
  if (window.__APP_STARTUP_AUTO_LOAD_QUESTIONS_SUBJECTS_20260630) return;
  window.__APP_STARTUP_AUTO_LOAD_QUESTIONS_SUBJECTS_20260630 = true;

  const SUBJECT_STORE = 'learninghub_subject_code_merged_v1';
  let running = false;
  let doneFor = '';
  function subject() {
    return localStorage.getItem(SUBJECT_STORE) || '';
  }
  function user() {
    return window.HODSupabase?.getUser?.() || null;
  }
  function profile() {
    return window.HODSupabase?.getProfile?.() || null;
  }
  function approved() {
    // ACCESS_GATE_STRICT_20260726: fail-closed.
    return !!window.lhHasFullAccess?.(profile());
  }
  function dataOk(code) {
    try {
      return (
        !!code &&
        Array.isArray(LHState.RAW) &&
        LHState.RAW.length > 0 &&
        LHState.RAW.some(q => String(q.subject_code || code).toUpperCase() === String(code).toUpperCase())
      );
    } catch (e) {
      return false;
    }
  }
  function renderAll() {
    try {
      renderCard?.();
    } catch (e) {
      lhWarn('APP_STARTUP_AUTO_LOAD_QUESTIONS_SUBJECTS_20260630', e);
    }
    try {
      renderQuiz?.();
    } catch (e) {
      lhWarn('APP_STARTUP_AUTO_LOAD_QUESTIONS_SUBJECTS_20260630', e);
    }
    try {
      renderStudy?.();
    } catch (e) {
      lhWarn('APP_STARTUP_AUTO_LOAD_QUESTIONS_SUBJECTS_20260630', e);
    }
  }
  async function loadOnce(reason) {
    const code = subject();
    if (!code || !user() || !approved() || running) return false;
    if (dataOk(code)) {
      doneFor = code;
      renderAll();
      return true;
    }
    if (doneFor === code) return true;
    running = true;
    try {
      let ok = false;
      if (typeof window.loadCurrentSubjectOnly === 'function') ok = await window.loadCurrentSubjectOnly(false);
      else if (window.HODSupabase?.loadQuestionsFromSupabase) ok = await window.HODSupabase.loadQuestionsFromSupabase();
      if (ok || dataOk(code)) {
        doneFor = code;
        renderAll();
        return true;
      }
    } catch (e) {
      console.warn('[startup auto load]', reason, e);
    } finally {
      running = false;
    }
    return false;
  }
  function schedule(reason) {
    [300, 1300, 3500].forEach(ms => setTimeout(() => loadOnce(reason + ':' + ms), ms));
  }
  function boot() {
    schedule('boot');
    document.querySelectorAll('.tab').forEach(btn => {
      if (btn.__startupAutoLoadBound) return;
      btn.__startupAutoLoadBound = true;
      btn.addEventListener('click', () => setTimeout(() => loadOnce('tab'), 120));
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  // OPTIM_TURSO_READS_20260726: Bỏ reload khi focus/visible.
  // Data đã cache trong RAM (RAW), không cần gọi API lại mỗi lần đổi tab.
  // Giữ boot retry 3 lần khi mới mở trang là đủ.
})();
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
/*
  INTERCEPTOR FETCH DUY NHẤT của app học sinh (mục VIII) + hàng rào xác minh
  quyền (mục V, VI, VII, IX, X).

  Trước đây file này ghi đè window.fetch BỐN lần (APP_API_DEDUPE,
  APP_F5_SUPABASE_CACHE, COPILOT_CLEAN_RUNTIME_GUARD, LH_AUTH_FETCH). Ba lớp đầu
  đã bị xóa; đây là lớp duy nhất còn lại.

  Nguyên tắc:
  - originalFetch được lưu ĐÚNG MỘT LẦN, cờ __LH_UNIFIED_FETCH_INSTALLED chống
    cài lại khi init / auth state thay đổi.
  - Chỉ gắn Authorization cho request /api/ CÙNG ORIGIN. Token phải là chuỗi
    không rỗng, không chứa ký tự xuống dòng (header injection).
  - Header chuẩn hóa bằng new Headers(init.headers || {}).
  - Response được clone() trước khi đọc JSON, hàm gọi phía sau vẫn dùng được body.
  - Chỉ 401 UNAUTHORIZED / 403 BLOCKED / 403 PENDING_APPROVAL / 403
    INSUFFICIENT_ROLE mới kích hoạt luồng thu hồi quyền. Lỗi mạng và 5xx KHÔNG
    bị coi là mất quyền.
*/
(function () {
  if (window.__LH_UNIFIED_FETCH_INSTALLED) return;
  window.__LH_UNIFIED_FETCH_INSTALLED = true;

  var originalFetch = typeof window.fetch === 'function' ? window.fetch.bind(window) : null;
  if (!originalFetch) return;
  window.__lhOriginalFetch = originalFetch;

  // ---------- Token ----------
  function validToken(t) {
    return typeof t === 'string' && t.trim().length > 0 && !/[\r\n]/.test(t);
  }

  function readTokenFromStorage(raw) {
    if (!raw) return '';
    var v;
    try {
      v = JSON.parse(raw);
    } catch (e) {
      return '';
    }
    var tok =
      v && (v.access_token || (v.currentSession && v.currentSession.access_token) || (Array.isArray(v) && v[0]));
    var exp = v && (v.expires_at || (v.currentSession && v.currentSession.expires_at));
    if (!validToken(tok)) return '';
    // Token hết hạn: không gắn header rác, để server trả 401 sạch sẽ.
    if (exp && Date.now() / 1000 > exp - 10) return '';
    return tok.trim();
  }

  /*
    LH_SESSION_REFRESH_20260729 — RỜI WEB LÂU QUAY LẠI KHÔNG BỊ ĐĂNG XUẤT NỮA.

    Bệnh cũ: access_token của Supabase sống 1 giờ. readTokenFromStorage() thấy token hết hạn
    thì trả '' (đúng — không gắn header rác), request /api/ đi ra không có Authorization,
    server trả 401 UNAUTHORIZED, handleAccessRevoked('UNAUTHORIZED') GỌI signOut() luôn.
    Trong khi refresh_token trong localStorage vẫn còn dùng được hàng chục ngày.
    Máy sleep / tab bị treo mấy tiếng là timer tự làm mới của supabase-js không kịp chạy trước
    request đầu tiên -> người dùng phải chọn lại mail Google dù chưa hề hết phiên thật.

    Nay: token thiếu/hết hạn thì LÀM MỚI TRƯỚC khi gọi, và 401 thì làm mới rồi THỬ LẠI ĐÚNG
    MỘT LẦN. Chỉ khi làm mới cũng thất bại (refresh_token hết hạn / bị thu hồi) mới coi là
    UNAUTHORIZED và đăng xuất. Nhiều request 401 cùng lúc dùng chung một lần làm mới
    (refreshInFlight), không bắn n request refresh song song.
  */
  function storedSession() {
    try {
      var url = (window.APP_CONFIG && window.APP_CONFIG.SUPABASE_URL) || '';
      var m = /https:\/\/([a-z0-9]+)\.supabase\./i.exec(url);
      var keys = [];
      if (m) keys.push('sb-' + m[1] + '-auth-token');
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.slice(0, 3) === 'sb-' && k.slice(-11) === '-auth-token' && keys.indexOf(k) === -1) keys.push(k);
      }
      for (var j = 0; j < keys.length; j++) {
        var raw = localStorage.getItem(keys[j]);
        if (!raw) continue;
        var v = JSON.parse(raw);
        var s = v && v.currentSession ? v.currentSession : v;
        if (s && (s.access_token || s.refresh_token)) return s;
      }
    } catch (e) {
      lhWarn('LH_SESSION_REFRESH_20260729', e);
    }
    return null;
  }
  function hasRefreshToken() {
    var s = storedSession();
    return !!(s && typeof s.refresh_token === 'string' && s.refresh_token.length > 0);
  }
  function authClient() {
    try {
      var c = window.HODSupabase && window.HODSupabase.__client;
      return c && c.auth ? c : null;
    } catch (e) {
      return null;
    }
  }
  function freshTokenOf(session) {
    if (!session) return '';
    var tok = session.access_token;
    if (!validToken(tok)) return '';
    if (session.expires_at && Date.now() / 1000 > session.expires_at - 10) return '';
    return tok.trim();
  }
  var refreshInFlight = null;
  function lhRefreshToken() {
    if (refreshInFlight) return refreshInFlight;
    var c = authClient();
    // Không có client (chưa init) hoặc không có refresh_token: không có gì để làm mới.
    if (!c || !hasRefreshToken()) return Promise.resolve('');
    refreshInFlight = Promise.resolve()
      .then(function () {
        // getSession() của supabase-js v2 tự làm mới khi token đã hết hạn.
        return c.auth.getSession();
      })
      .then(function (r) {
        var tok = freshTokenOf(r && r.data && r.data.session);
        if (tok) return tok;
        return c.auth.refreshSession().then(function (r2) {
          return freshTokenOf(r2 && r2.data && r2.data.session);
        });
      })
      .catch(function (e) {
        lhWarn('LH_SESSION_REFRESH_20260729', e);
        return '';
      })
      .then(function (tok) {
        refreshInFlight = null;
        return tok;
      });
    return refreshInFlight;
  }
  window.__lhRefreshAccessToken = lhRefreshToken;

  function lhToken() {
    try {
      var url = (window.APP_CONFIG && window.APP_CONFIG.SUPABASE_URL) || '';
      var m = /https:\/\/([a-z0-9]+)\.supabase\./i.exec(url);
      var ref = m ? m[1] : '';
      if (ref) {
        var t = readTokenFromStorage(localStorage.getItem('sb-' + ref + '-auth-token'));
        if (t) return t;
      }
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.slice(0, 3) === 'sb-' && k.slice(-11) === '-auth-token') {
          var t2 = readTokenFromStorage(localStorage.getItem(k));
          if (t2) return t2;
        }
      }
    } catch (e) {
      lhWarn('LH_UNIFIED_FETCH_AND_ACCESS_20260726', e);
    }
    return '';
  }
  window.__lhAccessToken = lhToken;

  // ---------- Nhận dạng URL ----------
  function toUrl(input) {
    try {
      var raw = typeof input === 'string' ? input : (input && input.url) || '';
      if (!raw) return null;
      return new URL(raw, location.href);
    } catch (e) {
      return null;
    }
  }
  function isOwnApi(url) {
    return !!url && url.origin === location.origin && url.pathname.indexOf('/api/') === 0;
  }
  function methodOf(input, init) {
    if (init && init.method) return String(init.method).toUpperCase();
    if (input && typeof input === 'object' && input.method) return String(input.method).toUpperCase();
    return 'GET';
  }

  // ---------- Cache Supabase REST (giữ từ COPILOT_CLEAN_RUNTIME_GUARD) ----------
  /*
    Editor sửa câu hỏi vẫn còn vài chỗ đọc Supabase REST (tra id câu hỏi, ảnh).
    Chỉ cache GET, chỉ trên host Supabase, và KHÔNG BAO GIỜ cache /rest/v1/profiles
    — đó là bảng trạng thái, cache nó là tự tạo lại đúng lỗ hổng vừa xóa.
  */
  var restCache = new Map();
  var restPending = new Map();

  function supabaseOrigin() {
    try {
      return new URL((window.APP_CONFIG && window.APP_CONFIG.SUPABASE_URL) || '').origin;
    } catch (e) {
      return '';
    }
  }
  function restTtl(url, method) {
    if (method !== 'GET') return 0;
    var origin = supabaseOrigin();
    if (!origin || url.origin !== origin) return 0;
    var p = url.pathname;
    if (p.indexOf('/rest/v1/') !== 0 && p.indexOf('/rest/v1/') === -1) return 0;
    if (p.indexOf('/rest/v1/profiles') !== -1) return 0; // KHÔNG cache trạng thái quyền
    if (p.indexOf('/rest/v1/questions') !== -1) return 2 * 60 * 1000;
    if (p.indexOf('/rest/v1/subjects') !== -1) return 2 * 60 * 1000;
    if (p.indexOf('/rest/v1/site_settings') !== -1) return 60 * 1000;
    return 0;
  }
  function restKey(url) {
    var params = Array.from(url.searchParams.entries()).sort(function (a, b) {
      return (a[0] + '=' + a[1]).localeCompare(b[0] + '=' + b[1]);
    });
    return (
      url.origin +
      url.pathname +
      '?' +
      params
        .map(function (x) {
          return x[0] + '=' + x[1];
        })
        .join('&')
    );
  }
  function matchKind(text, kind) {
    if (!kind || kind === 'all') return true;
    return text.indexOf('/' + kind) !== -1;
  }
  function clearRestCache(kind) {
    Array.from(restCache.keys()).forEach(function (k) {
      if (matchKind(k, kind)) restCache.delete(k);
    });
    Array.from(restPending.keys()).forEach(function (k) {
      if (matchKind(k, kind)) restPending.delete(k);
    });
    try {
      // Dọn nốt các key sessionStorage do những bản cache cũ để lại.
      Object.keys(sessionStorage).forEach(function (k) {
        if (k.indexOf('lh_f5_cache:') === 0) sessionStorage.removeItem(k);
      });
    } catch (e) {
      lhWarn('LH_UNIFIED_FETCH_AND_ACCESS_20260726', e);
    }
  }
  window.clearLearningHubSupabaseCache = clearRestCache;

  // ---------- Điều phối 401/403 ----------
  var REVOKE_CODES = { UNAUTHORIZED: 1, BLOCKED: 1, PENDING_APPROVAL: 1, INSUFFICIENT_ROLE: 1 };

  function dispatchDenial(code, message) {
    /*
      INSUFFICIENT_ROLE nghĩa là phiên vẫn hợp lệ, chỉ là thao tác vừa rồi vượt
      quyền (vd người học gọi nhầm endpoint quản trị). Xóa sạch dữ liệu học và
      đá về màn hình chờ duyệt trong trường hợp này là sai — chỉ báo lỗi.
    */
    if (code === 'INSUFFICIENT_ROLE') {
      if (typeof notify === 'function') notify(message || 'Bạn không có quyền thực hiện thao tác này');
      return;
    }
    if (typeof window.handleAccessRevoked === 'function') {
      window.handleAccessRevoked(message || 'Tài khoản bị từ chối truy cập.', code);
    }
  }

  function inspectDenial(res) {
    // Clone trước khi đọc: body gốc vẫn còn nguyên cho hàm gọi phía sau.
    res
      .clone()
      .json()
      .then(function (data) {
        var code = data && data.code;
        if (code && REVOKE_CODES[code]) dispatchDenial(code, data.error);
        else if (!code) {
          // 401/403 không có code: coi như phiên hỏng, nhưng không đoán BLOCKED.
          dispatchDenial(res.status === 401 ? 'UNAUTHORIZED' : 'PENDING_APPROVAL', null);
        }
      })
      .catch(function () {
        dispatchDenial(res.status === 401 ? 'UNAUTHORIZED' : 'PENDING_APPROVAL', null);
      });
  }

  /*
    Gắn Authorization + signal chung vào một request /api/. Trả về [input, init] để gọi
    originalFetch.apply(). Tách riêng vì phải dùng LẠI khi thử lại sau khi làm mới token
    (LH_SESSION_REFRESH_20260729) — trước đây phần này viết thẳng trong interceptor.
  */
  function withAuth(input, init, tok, force) {
    try {
      if (input instanceof Request) {
        if (tok && (force || !input.headers.has('Authorization'))) {
          var h = new Headers(input.headers);
          h.set('Authorization', 'Bearer ' + tok);
          input = new Request(input, { headers: h });
        }
        return [input, init];
      }
      init = init ? Object.assign({}, init) : {};
      var hh = new Headers(init.headers || {});
      // Lần đầu: KHÔNG ghi đè Authorization do hàm gọi tự đặt. Lúc thử lại (force) thì phải
      // ghi đè, vì header cũ chính là token vừa hết hạn.
      if (tok && (force || !hh.has('Authorization'))) hh.set('Authorization', 'Bearer ' + tok);
      init.headers = hh;
      // VI: mọi request /api/ đều gắn signal chung để hủy được hàng loạt
      // ngay khi quyền bị thu hồi.
      if (!init.signal && typeof window.getLhApiSignal === 'function') {
        var sig = window.getLhApiSignal();
        if (sig) init.signal = sig;
      }
      return [input, init];
    } catch (e) {
      console.warn('[LH fetch] không gắn được Authorization:', e);
      return [input, init];
    }
  }

  // ---------- Interceptor ----------
  window.fetch = function (input, init) {
    var url = toUrl(input);
    var method = methodOf(input, init);
    var ownApi = isOwnApi(url);

    if (ownApi) {
      /*
        VI: khi đã BIẾT CHẮC không có quyền (=== false), chặn ngay ở client mọi
        request dữ liệu học. Server vẫn tự bảo vệ bằng checkUserAccess() — đây chỉ
        là lớp chặn sớm để khỏi gọi thừa và không rò dữ liệu vào UI.
        Chỉ chặn khi === false, không chặn lúc chưa rõ (undefined), tránh chặn nhầm
        request chạy song song trước khi /api/profile trả về.
      */
      if (window.__LH_ACCESS_OK === false && /\/api\/(subjects|questions)\b/.test(url.pathname)) {
        return Promise.resolve(
          new Response(JSON.stringify({ error: 'Tài khoản chưa được phê duyệt', code: 'PENDING_APPROVAL' }), {
            status: 403,
            headers: { 'content-type': 'application/json' },
          }),
        );
      }

      // Bản chưa dùng, giữ để THỬ LẠI được sau khi làm mới token (body của Request chỉ đọc
      // được một lần nên phải clone TRƯỚC lần gọi đầu).
      var retrySrc = input instanceof Request ? input.clone() : input;
      var retryInit = init;
      var tok = lhToken();
      // Token thiếu/hết hạn nhưng còn refresh_token: làm mới TRƯỚC khi gọi, đừng để server
      // trả 401 rồi đăng xuất người dùng (LH_SESSION_REFRESH_20260729).
      var pre = tok || !hasRefreshToken() ? Promise.resolve(tok) : lhRefreshToken();

      return pre.then(function (token) {
        return originalFetch.apply(null, withAuth(input, init, token)).then(function (res) {
          if (url.pathname.indexOf('/api/version.json') !== -1) return res;
          if (res.status === 401) {
            // 401 CÓ THỂ chỉ là token vừa hết hạn. Làm mới rồi thử lại đúng một lần.
            return lhRefreshToken().then(function (fresh) {
              if (!fresh || fresh === token) {
                inspectDenial(res);
                return res;
              }
              var args = withAuth(retrySrc, retryInit, fresh, true);
              return originalFetch.apply(null, args).then(function (res2) {
                if (res2.status === 401 || res2.status === 403) inspectDenial(res2);
                return res2;
              });
            });
          }
          if (res.status === 403) inspectDenial(res);
          return res;
        });
      });
      // Lỗi mạng: để promise reject tự nhiên. KHÔNG coi là thu hồi quyền (VIII).
    }

    // ----- Nhánh Supabase REST: cache GET nhẹ, không đụng tới header -----
    var ttl = url ? restTtl(url, method) : 0;
    if (!ttl) return originalFetch(input, init);

    var key = restKey(url);
    var hit = restCache.get(key);
    if (hit && Date.now() - hit.at < ttl) return Promise.resolve(hit.res.clone());

    if (restPending.has(key)) {
      return restPending.get(key).then(function (r) {
        return r.clone();
      });
    }
    var job = originalFetch(input, init)
      .then(function (res) {
        if (res.ok) restCache.set(key, { at: Date.now(), res: res.clone() });
        restPending.delete(key);
        return res;
      })
      .catch(function (err) {
        restPending.delete(key);
        throw err;
      });
    restPending.set(
      key,
      job.then(function (r) {
        return r.clone();
      }),
    );
    return job;
  };

  /*
    ============================================================
    HÀNG RÀO XÁC MINH QUYỀN (V.3, X)
    ============================================================
    Mọi tín hiệu (Realtime, quay lại tab, polling fallback) đều đi qua đây, và
    đây là nơi DUY NHẤT gọi /api/profile để xác minh lại:
      - Đang có request chạy  -> dùng chung, không tạo request thứ hai.
      - Vừa xác minh xong < 3s -> bỏ qua (debounce).
      - Một sự kiện Realtime  -> tối đa một lần kiểm tra.
  */
  var inflight = null;
  var lastCheckAt = 0;
  var MIN_INTERVAL = 3000; // 3 giây (spec: 2-5s)

  function lhRevalidateAccess(reason, force) {
    if (inflight) return inflight;
    if (!force && Date.now() - lastCheckAt < MIN_INTERVAL) return Promise.resolve(null);

    var api = window.HODSupabase;
    if (!api || typeof api.getUser !== 'function' || !api.getUser()) return Promise.resolve(null);
    if (typeof window.lhCheckProfileOnce !== 'function') return Promise.resolve(null);

    lastCheckAt = Date.now();
    inflight = Promise.resolve(window.lhCheckProfileOnce(reason))
      .catch(function (e) {
        console.warn('[LH access] kiểm tra thất bại:', e);
        return null;
      })
      .then(function (r) {
        inflight = null;
        lastCheckAt = Date.now();
        return r;
      });
    return inflight;
  }
  window.lhRevalidateAccess = lhRevalidateAccess;

  /*
    IX. DỰ PHÒNG KHI REALTIME MẤT KẾT NỐI
    Realtime là cơ chế chính. Polling chỉ chạy khi: Realtime disconnected VÀ tab
    visible VÀ còn phiên Supabase. Chỉ tồn tại duy nhất một timer.
  */
  var pollTimer = null;
  var POLL_MS = 90 * 1000; // 90s, nằm trong khoảng 60-120s

  function startFallbackPolling() {
    if (pollTimer) return; // chống tạo nhiều interval sau mỗi lần render/đăng nhập
    if (window.__lhRealtimeConnected) return;
    console.log('[LH access] Realtime mất kết nối -> bật polling dự phòng', POLL_MS / 1000 + 's');
    pollTimer = setInterval(function () {
      if (window.__lhRealtimeConnected) {
        stopFallbackPolling();
        return;
      }
      if (document.visibilityState !== 'visible') return;
      var api = window.HODSupabase;
      if (!api || typeof api.getUser !== 'function' || !api.getUser()) return;
      lhRevalidateAccess('polling');
    }, POLL_MS);
  }

  function stopFallbackPolling() {
    if (!pollTimer) return;
    console.log('[LH access] Realtime đã kết nối lại -> tắt polling dự phòng');
    clearInterval(pollTimer);
    pollTimer = null;
  }

  window.startFallbackPolling = startFallbackPolling;
  window.stopFallbackPolling = stopFallbackPolling;
  // Dùng khi đăng xuất / khởi tạo lại app: dọn timer, tránh timer mồ côi.
  window.lhTeardownAccessWatch = function () {
    stopFallbackPolling();
    inflight = null;
    lastCheckAt = 0;
  };

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') {
      lhRevalidateAccess('visibilitychange');
      if (!window.__lhRealtimeConnected) startFallbackPolling();
    } else {
      // Không kiểm tra gì khi tab ẩn.
      stopFallbackPolling();
    }
  });
})();
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
