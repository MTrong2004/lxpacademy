# CLAUDE.md — Learning Hub (lxpacademy)

Web ôn thi trắc nghiệm: flashcard, kiểm tra, thư viện câu hỏi + trang admin.
Frontend thuần JS (không framework), API Vercel Edge, DB Turso, auth Supabase, ảnh Cloudinary.

## Lệnh

| Lệnh | Việc |
|---|---|
| `npm run dev` | Dev server + API thật ở http://localhost:3000 (đặt `PORT=…` nếu 3000 đang bị chiếm) |
| `npm run build` | Bundle `src/` → `app.js`, `admin.js`, `dist/` (esbuild) |
| `npm run map` | Sinh lại `docs/BLOCK_MAP.md` (bản đồ block) |
| `npm run find <tên>` | Hàm bị gán ở đâu, **bản nào đang chạy** — dùng TRƯỚC khi đọc code |
| `npm run check:catch` | Chặn `catch` rỗng quay lại trong `src/` |
| `npm run check:overrides` | Chặn **thêm lớp ghi đè mới** cho hàm đã có lớp cũ (quy tắc 3) |
| `npm run check:installs` | Chặn `export function install*()` **nằm chết vì quên gọi** trong appCore/adminCore |
| `npm run check:globals` | Chặn **cầu nối đứt**: file A gọi `foo()` của file B mà không ai gán `window.foo` |
| `npm run format` | Prettier cho `src/**/*.js` (chạy trước khi commit) |
| `npm run migrate` | Chạy migration Turso |

## Quy tắc bắt buộc

1. **Chỉ sửa trong `src/`.** `app.js` và `admin.js` ở gốc là **build output** của
   `src/student/main.js` và `src/admin/main.js`. Sửa trực tiếp app.js sẽ mất khi build.
2. **Sau khi sửa phải `npm run build`**, rồi hard refresh (Ctrl+Shift+R) — `index.html`
   nạp `app.js?v=...` nên browser cache rất dai.
3. **Không tạo block patch mới cho việc mà một block cũ đang làm.** Sửa vào block đang chạy.
   File đã có 137 block xếp lớp; thêm lớp nữa là tự tạo bug ghi đè.
   `npm run check:overrides` canh việc này: nó so với mốc trong `docs/OVERRIDES_BASELINE.json`
   (hiện 33 hàm bị xếp lớp) và báo đỏ khi số lớp TĂNG. Dọn bớt được thì hạ mốc bằng
   `npm run check:overrides -- --update` — mốc chỉ đi xuống, không đi lên.
4. **Không dùng `catch` rỗng.** Dùng `lhWarn('TÊN_BLOCK', e)` (xem phần Debug).
5. **Không đụng Discord webhook** trong appCore/adminCore. URL webhook chỉ đọc từ env
   `DISCORD_WEBHOOK_URL` ở server. Muốn tắt bớt thông báo thì dùng công tắc ở trang admin
   **Thông báo Discord** (`api/lib/discord.js`), đừng xoá lời gọi trong code.
   Thêm loại mới = khai báo trong `DISCORD_NOTIFICATION_KINDS` (**nhớ copy sang
   `MOCK_DISCORD_KINDS` + `mockDiscordSettings` của `src/core/mock.js`**) rồi truyền đúng
   `kind` khi gọi `postDiscordEmbed` — trang admin tự sinh công tắc. Cấu hình cũ trong DB
   thiếu khoá mới thì `normalizeDiscordSettings` lấy `default` của khoá đó (đang là bật).

   **9 loại và chỗ bắn tin:**

   | `kind` | Bắn ở đâu |
   |---|---|
   | `login`, `action` | `api/controllers/notify.js` — do **CLIENT** gọi `/api/notify`, chặn request là mất tin |
   | `edit_request` | `api/controllers/editRequests.js` (người học gửi báo cáo/đề xuất sửa) |
   | `question_edit`, `role_change`, `destructive` | **một chốt duy nhất** trong `logAdminAction` của `api/controllers/admin.js` (`notifyDiscordForAction`) — thêm action mới chỉ cần thêm tên vào đúng `Set` |
   | `subject_request` | case `add_subject_request` — case này là thao tác của người học nên KHÔNG ghi `admin_logs`, phải gọi thẳng |
   | `new_user` | `api/controllers/profile.js`, nhánh `else` (chưa có dòng trong `profiles`), gửi **trước** `accessDenialResponse` vì ca chờ duyệt trả 403 |
   | `server_error` | `postServerErrorEmbed` ở **BA** chốt 500: `api/index.js` (catch chung), `api/controllers/profile.js` (catch riêng), `api/lib/auth.js: checkUserAccess` (trả object, không ném nên chốt chung không thấy) |

   Hai điều cố ý, đừng "sửa lại":
   - **`question_edit` im lặng với admin hệ thống** (`QUESTION_EDIT_DISCORD_20260729`): chỉ bắn
     khi người sửa là admin thường / editor. Admin hệ thống tự sửa câu rồi không thấy tin là
     ĐÚNG. `role_change` và `destructive` thì bắn với MỌI cấp.
   - **`server_error` gộp tin**: mỗi chữ ký lỗi (endpoint + thông điệp) 1 tin / 5 phút, tin sau
     kèm số lần đã dồn. Turso sập không làm nổ kênh Discord.
6. **Ảnh chỉ lưu URL** (Cloudinary), không bao giờ nhúng base64 vào DB.

## Sửa một lỗi thì gõ `/fix <mô tả lỗi>`

Slash command `/fix` (`.claude/commands/fix.md`) đóng băng đúng thứ tự đỡ tốn token nhất:
khoanh vùng bằng `lhErrors()` + `npm run find` → loại ba nguyên nhân "không phải lỗi code"
(ghi đè / cache / quyết định sản phẩm) → sửa bản đang chạy → 4 lệnh kiểm → test app thật.
Khỏi phải nhắc lại quy tắc ở mỗi phiên.

## Đọc code kiểu nào cho đỡ tốn công

`src/student/appCore.js` **2,7k dòng** (từng là 14,9k), `src/admin/adminCore.js` ~6,9k dòng
(đã format Prettier 120 cột).

Đã tách khỏi appCore (xem `docs/SPLIT_PLAN.md`):

| File | Chứa gì |
|---|---|
| `src/student/state.js` | 18 biến state dùng chung (object `LHState`) |
| `src/student/exam.js` | **toàn bộ tab Kiểm tra** |
| `src/student/editor.js` | **sửa / báo cáo câu hỏi** (`openEditPreview`/`saveEditPreview`) + Ctrl+V dán ảnh |
| `src/student/library.js` | **tab Thư viện** (`renderUnified`: danh sách, lọc, tìm kiếm, mở/thu gọn, nút Học/Lưu/Báo cáo) |
| `src/student/subjectGate.js` | **cổng chọn môn** (`#subjectGate`, `renderSubjects`, `enterSubject`, `setSubject`, `loadBySubject`, chip môn đang học) + **số câu mỗi môn** (`refreshSubjectCountsOnce`) |
| `src/student/images.js` | **ảnh + upload Cloudinary**: `imgsHTML`, `renderEditImages`, `__LHUploadCloudinary`, `__LHGetPendingImageUpload`, `__LHUploadPendingDataUrls`, `__LHTestCloudinaryConfig` |
| `src/student/format.js` | `sortAns`, `answerText`, `finalAnswerText`, `fmt`, `clone`, `esc` |
| `src/student/subjects.js` | **tải câu hỏi + cache**: `loadCurrentSubjectOnly`, `revalidateQuestions`, `fetchImagesForCurrent`, `reloadCurrentQuestion`, đồng bộ số câu thẻ môn |
| `src/student/search.js` | **tìm kiếm thông minh** (`smartBetter`: bỏ stopword, chấm điểm liên quan) + hiển thị thêm câu |
| `src/student/auth.js` | `window.HODSupabase` + avatar, lớp fetch gắn token, xác minh quyền / thu hồi quyền |
| `src/student/bookmarks.js` | **lưu câu 🔖** (nút trên flashcard + trong Thư viện) và **chuông thông báo yêu cầu sửa** |
| `src/student/flashcards.js` | hạt nền `#landingParticles`, nút "Báo cáo đã gửi", **điều hướng flashcard trên điện thoại** (nút + vuốt) |
| `src/student/subjectImport.js` | **"Thêm môn" trọn gói**: `ADD_SUBJECT_FEATURE`, prompt AI, xem trước + sửa tại chỗ file import, `QUIZLET_IMPORT_AUTODETECT`, upload song song, **và import file .zip** (giải nén trong browser, chặn zip-slip/zip-bomb, upload Cloudinary) |

`npm run find` và `npm run map` đã bao các file này. Sửa tính năng kiểm tra thì mở
`exam.js`, sửa form sửa câu hỏi thì mở `editor.js`, sửa ảnh/upload thì `images.js`, sửa thư viện thì `library.js`,
sửa cổng chọn môn / số câu mỗi môn thì `subjectGate.js`, sửa "Thêm môn"/import thì
`subjectImport.js` — đừng tìm trong appCore.

**Trong appCore, 6 hàm này chỉ còn là hàm CHUYỂN TIẾP sang `window.*`** — bản thật ở các
file trên, đừng "sửa lỗi" vào chúng: `openEditor`, `saveEditor`, `renderQuiz` (thân cũ đã xóa
hẳn) · `imgsHTML`, `renderEditImages`, `renderStudy` (còn giữ thân gốc làm dự phòng cho
quãng trước khi `install*()` chạy).

- **Sửa một hàm thì chạy `npm run find <tênHàm>` TRƯỚC TIÊN.** Nó in mọi chỗ gán kèm
  tên block, số dòng, và đánh dấu `● SỐNG` cho bản đang chạy — kể cả bản nằm trong
  `setTimeout(apply, 900)` (nó so cả delay giữa các timer). Một lệnh thay cho vài vòng
  grep + đọc file. Ví dụ: `npm run find openEditor`.
  Tên không phải định danh cũng tra được: `npm run find learninghub_progress_`.
- **Mở `docs/BLOCK_MAP.md`** khi cần bức tranh tổng: block nào ở dòng nào, block nào ghi đè
  hàm nào, khóa localStorage nào thuộc block nào, endpoint nào block nào gọi. Đọc bản đồ
  rồi mới đọc đúng vùng dòng — đừng đọc cả file.
- **Luôn chạy `npm run format` sau khi sửa** để file không quay về dạng một-dòng-khổng-lồ.
- Còn 30 dòng trên 500 ký tự là **chuỗi HTML template** — Prettier không cắt được chuỗi.
  Khi grep vào vùng đó thì thêm `-o` để chỉ in phần khớp.
- **Một hàm bị gán nhiều lần thì bản CUỐI thắng** — nhưng block gán trong `setTimeout` /
  `DOMContentLoaded` thắng muộn hơn tất cả. Kiểm tra bản đang chạy bằng Console:
  `String(window.renderStudy).slice(0, 200)`.
- **`grep -n DEAD_OVERRIDE_20260727`** để thấy ngay các chỗ ghi đè đã xác nhận là code chết
  (đã chú thích tại chỗ kèm lý do). Đừng bọc thêm lớp mới ở những chỗ đó — vô tác dụng.
- Đầu mỗi file core có sẵn khối `AI_JS_MAP` / `AI_ADMIN_JS_MAP` liệt kê nhóm chức năng
  và các NOTE_* về bẫy đã gặp — đọc kèm bản đồ.

## Kiến trúc dữ liệu

- **Turso là nguồn duy nhất cho dữ liệu VÀ quyền.** `api/lib/auth.js: checkUserAccess()`
  đọc bảng `profiles` (cache 10s/isolate). Không bao giờ tin `role`/`approved`/`blocked`
  từ client, localStorage hay JWT metadata.
- **Supabase chỉ để đăng nhập Google + phát token.** Client gắn `Authorization: Bearer`,
  server xác thực qua `/auth/v1/user`. Còn sót vài đường đọc trực tiếp Supabase trong
  appCore (ví dụ lazy-load ảnh trong `LIBRARY_UX_STEP1_STABLE_RENDER`) — **đừng thêm mới**,
  gặp thì chuyển dần sang `/api/*`.
- **Mọi thao tác GHI đi qua `POST /api/admin-action`** (nó tự xóa cache server). Không ghi
  thẳng Supabase từ client — từng gây mất ảnh.
- Routes (`api/index.js`): `subjects`, `questions`, `profile`, `edit-requests`,
  `my-edit-requests`, `staff-edit-requests`, `settings`, `notify`, `admin-dashboard`,
  `admin-action`. Tất cả trừ `settings` đều cần token.
- **Hai cấp admin** (`ADMIN_TWO_TIERS_20260729`, `api/lib/auth.js`): *admin hệ thống* là
  email trong `getSystemAdminEmails()` — mặc định `trongbm2004@gmail.com` +
  `trongbm1009@gmail.com`, đổi được bằng env `SYSTEM_ADMIN_EMAILS` (phân cách dấu phẩy);
  *admin thường* là `role='admin'` trong Turso. Khác nhau duy nhất: chỉ admin hệ thống đổi
  được cấu hình thông báo Discord (`SYSTEM_ADMIN_ONLY_ACTIONS` trong `admin-action`).
  Cấp bậc do SERVER tính theo email đã verify và trả về ở khoá `is_system_admin` của
  `/api/admin-dashboard`; client chỉ dùng để vẽ giao diện: chip header của admin hệ thống
  màu **TÍM** (`.chip.isSystemAdmin` + `body.role-system-admin` trong `admin.css`, biến
  `--purple`/`--purple2`), admin thường giữ màu vàng của cả trang.
- **401 KHÔNG đăng xuất ngay: làm mới token rồi thử lại một lần**
  (`LH_SESSION_REFRESH_20260729`, lớp fetch duy nhất trong appCore). `access_token` Supabase
  sống 1 giờ, `refresh_token` sống hàng chục ngày. Trước đây token hết hạn →
  `readTokenFromStorage` trả `''` → server 401 → `handleAccessRevoked('UNAUTHORIZED')` gọi
  `signOut()`, nên **rời web lâu quay lại là phải chọn lại mail Google** dù phiên chưa hết thật
  (máy sleep / tab bị treo thì timer tự làm mới của supabase-js không kịp chạy trước request
  đầu tiên). Nay: token thiếu/hết hạn mà còn `refresh_token` thì `lhRefreshToken()`
  (`getSession()` → fallback `refreshSession()`) chạy TRƯỚC khi gọi; gặp 401 thì làm mới rồi
  gọi lại đúng một lần với `withAuth(..., force = true)`. Chỉ khi làm mới cũng thất bại (hoặc
  trả lại y nguyên token cũ) mới coi là `UNAUTHORIZED`. Nhiều request 401 cùng lúc dùng chung
  một lần làm mới (`refreshInFlight`). Không có `refresh_token` thì không gọi refresh — giữ
  đúng hành vi cũ. Đừng bỏ `input.clone()` ở `retrySrc`: body của `Request` chỉ đọc được một lần.
- **Mã lỗi API có ý nghĩa cố định:** `401 UNAUTHORIZED` = chưa/hết phiên;
  `403 PENDING_APPROVAL | BLOCKED | INSUFFICIENT_ROLE` = quyền thật sự không đủ;
  `500 INTERNAL_ERROR` = **không kết luận được quyền**, client phải hiện "thử lại",
  KHÔNG được coi là bị thu hồi quyền.

- **Thiết bị có ID thật, và MÔN được nhớ theo TỪNG THIẾT BỊ**
  (`DEVICE_ID_AND_SUBJECT_PER_DEVICE_20260731`). `profiles.current_subject` chỉ có MỘT ô nên
  nó là "môn của lần ghi cuối", không phải "môn đang học": điện thoại mở môn khác — hoặc chỉ
  F5, vì `loadProfile` bản đầy đủ gửi kèm môn từ localStorage — là đè môn của máy tính.
  Cùng lúc, `device_history` khử trùng lặp theo **chuỗi mô tả** (`"💻 Windows · Chrome"`) nên
  hai máy cùng OS + trình duyệt gộp làm một, còn modal admin in `p.id` (id TÀI KHOẢN) nên mọi
  dòng hiện cùng một ID.
  - Mỗi trình duyệt tự cấp `learninghub_device_id_v1` (`getDeviceId()` trong
    `src/core/device.js`), gửi kèm `device_id` ở **cả 3** chỗ POST `/api/profile`:
    `auth.js` (loadProfile đầy đủ), `subjectGate.js` (`syncUserSubjectToProfile` — bản sống,
    chạy mỗi lần đổi môn), `subjects.js`.
  - Bản ghi lịch sử nay là `{ id, device, code, time }`; logic gộp nằm ở
    **`api/lib/deviceHistory.js`** (`safeDeviceId` + `touchDeviceHistory`) — để ở `lib/` vì
    không import `db`, test được bằng node như `folderBadges.js`. Khoá theo `id` khi có, dòng
    cũ chưa có `id` thì khớp theo `device` như trước; POST không kèm môn (ping hoạt động) thì
    **giữ môn cũ của chính thiết bị đó**, không lấy môn của thiết bị khác.
  - Admin: chip "MÔN ĐANG HỌC" thành nút → `showUserSubjectByDeviceModal` (môn theo từng thiết
    bị, cảnh báo khi đang mở nhiều môn); chip thiết bị vẫn là `showUserDeviceHistoryModal` nhưng
    in ID thiết bị. Cả hai đọc `device_history` qua **một hàm duy nhất**: `parseDeviceHistory`
    của `src/admin/users.js` (bridge `window.parseDeviceHistory` ở `src/admin/main.js`).
  - **Nhiều tab CÙNG một máy thì không tách được** và đó là cố ý: mã môn nằm ở localStorage
    dùng chung, tab thứ hai đổi môn là ghi đè khoá của tab thứ nhất (tab cũ vẫn vẽ môn cũ vì
    không ai nghe event `storage`). Muốn tách phải chuyển sang `sessionStorage` mỗi tab một
    "thiết bị" — danh sách sẽ phình theo số lần mở tab, đừng làm.

### 3 tầng cache câu hỏi (nhớ khi dữ liệu "không chịu mới")

1. localStorage `learninghub_questions_cache_v2_<MÃ_MÔN>` — TTL 12 giờ, render tức thì
   rồi `revalidateQuestions()` đối chiếu server ngầm.
2. Cache server trong `api/controllers/questions.js` — TTL 5 phút, key theo mã môn,
   bị xóa khi ghi qua `/api/admin-action`.
3. Browser HTTP cache — bị chặn bằng `cache:'no-store'` + `&ts=`.

Muốn bỏ qua cả (1) và (2): gọi `loadCurrentSubjectOnly(true)` → thêm `&fresh=1`.
Trong Console: `clearLearningHubQuestionCache(); location.reload()`.

## Test UI không cần đăng nhập: `?mock=1`

`src/core/mock.js` — **chỉ chạy trên localhost**, tên miền thật bỏ qua hoàn toàn.
Không cần DB, không cần Google login, không ghi gì thật (`admin-action` chỉ trả `ok`).

| URL | Để kiểm |
|---|---|
| `localhost:3000/?mock=1` | Thư viện / Flashcard / Kiểm tra với môn MOCK1 (4 câu), MOCK2 (2 câu) + 4 môn "chương" MOCK1_C1…C4 (34/12/8/20 câu) để test khối **"Gộp thêm môn"** và **khoảng câu** của tab Kiểm tra (MOCK2 khác mã gốc nên không hiện trong khối gộp) |
| `?mock=1&role=admin` (hoặc `editor`) | Quyền mở dashboard |
| `admin.html?mock=1&role=admin` | Trang admin **dùng được thật** — mock cấp phiên giả nên `isEditor()` đúng, `cache.*` có dữ liệu (Quản lý môn học, Câu hỏi, Người dùng…) |
| `admin.html?mock=1&role=admin&sysadmin=0` | Giả lập **admin thường**: trang "Thông báo Discord" bị ẩn khỏi menu sidebar (mặc định vai admin trong mock là admin hệ thống) |
| `?mock=1&reload_notice=1` | Banner "Hệ thống vừa cập nhật — Cập nhật ngay" (nhắc tải lại). Banner hiện ở lần xác minh quyền, không phải ngay lúc mở trang — gọi `lhRevalidateAccess('test')` trong Console cho nhanh |
| `?mock=1&pending=1` / `&blocked=1` | Đúng hai màn 403 khác nhau: "Chờ phê duyệt" vs "Tài khoản bị khóa" |
| `?mock=1&fail=500` | 500 phải ra fallback "thử lại", KHÔNG được coi là mất quyền |
| `?mock=1&subject=MOCK2` | Đổi môn mặc định |

**Chạy thử một lượt thi:** nút "Bắt đầu kiểm tra" mở hộp chọn giao diện — hộp này nằm
NGOÀI `<main>` nên nếu chỉ đọc phần thân trang thì tưởng bấm không có tác dụng. Chọn giao
diện rồi bấm "Bắt đầu làm bài ▶" là vào đề (4 câu MOCK1 chạy đủ tới bảng kết quả).
Nút "Nộp bài" dùng `confirm()` của trình duyệt, nên script tự động phải tạm
`window.confirm = () => true`, không thì coi như bấm Hủy.

Năm điều dễ làm sai khi sửa file này:

- **Trang admin KHÔNG đi qua `window.HODSupabase`.** `init()` (adminCore ~651) tự gọi
  `supabase.createClient(...).auth.getSession()`. Không có phiên thì `user` undefined →
  `profile` mãi null → `isEditor()` false → mọi trang admin chỉ bật alert "Admin hoặc Editor
  mới được…". `fakeAdminAuthSession()` bọc `createClient` để trả phiên giả, **chỉ đụng
  `.auth`** (phần `.from()` đã được adminCore bọc bằng `createTursoClientMock` → đi qua `/api`).
- **`/api/admin-dashboard` trả các khóa ở TẦNG TRÊN CÙNG**, không bọc trong `data`
  (`window.__fetchAdminDashboardJSON` đọc thẳng `JSON.parse(text)`). Trả `{data:{…}}` là
  `cache.subjects` rỗng và mọi trang admin trắng trơn — `mockAdminDashboard()` khớp đúng
  hình dạng của `api/controllers/admin.js`.

- **Thứ tự import trong `main.js` có ý nghĩa.** `import '../core/mock.js'` phải nằm
  **trước** `import './appCore.js'` (lớp fetch giả tự cài lúc import, cần nằm BÊN TRONG
  lớp bọc fetch của appCore để response 401/403 giả vẫn đi qua `handleAccessRevoked`);
  còn `installMock()` phải gọi **sau** vì appCore gán `window.HODSupabase` ở dòng ~1094.
- Cổng gate mở bằng cách định nghĩa `window.__LH_ACCESS_OK` thành accessor luôn trả
  `true`, nên 6 chỗ ghi `= false` trong appCore thành no-op. Không sửa appCore dòng nào.
- Mock ghi `learninghub_subject_code_merged_v1` = `MOCK1`. Khóa này dùng chung với chế độ
  thật, nên khi chạy không có `?mock=1` thì `clearMockLeftovers()` xóa lại.

## Debug (dùng cái này trước khi đọc code)

- Mọi `catch` trong `appCore.js`/`adminCore.js` đều gọi `lhWarn('TÊN_BLOCK', e)`
  (`src/core/log.js`). Lỗi in Console lần đầu kèm stack, gộp đếm nếu lặp; lỗi không ai
  catch cũng gom vào cùng chỗ.
- **Người dùng báo lỗi → hỏi ngay kết quả `lhErrors()` trong Console.** Tag lỗi chính là
  tên block trong `docs/BLOCK_MAP.md`, tức là đọc 1 bảng thay vì dò cả file.
  Mẫu báo lỗi đầy đủ (5 mục): `docs/BUG_REPORT.md` — thiếu mục nào là mất thêm một vòng hỏi lại.
- **`lhErrors()` rỗng mà UI vẫn sai** thì không phải lỗi JS ném ra: hoặc là **ghi đè**
  (chạy `npm run find <tênHàm>` xem bản nào sống), hoặc là **cache** (xem 3 tầng cache ở trên).
- Lỗi phía server (`api/`) nằm trong log của `npm run dev` hoặc log Vercel.

## Quyết định sản phẩm (đừng "sửa lại" thành bug)

- **Trang admin KHÔNG còn tab "Câu hỏi"** (xoá 20260729, chốt với chủ dự án). Nút nav
  `data-page="questions"` vốn đã bị `n.remove()` từ trước nên cả trang không có đường vào;
  nay xoá hẳn ~870 dòng: danh sách/phân trang/lọc môn, **thêm câu, sửa trực tiếp + upload
  Cloudinary, ẩn/hiện, xoá câu**. Sửa câu hỏi giờ chỉ đi qua duyệt "Yêu cầu sửa" của học
  sinh. Cũng xoá khối **"Thêm môn học bằng AI"** (`openAddSubjectAI` không có nút gọi).
  **Nguyên văn code đã xoá: `docs/REMOVED_20260729.md`** — đừng thêm lại nếu không có yêu
  cầu rõ ràng.
- **Admin KHÔNG đăng xuất người dùng nữa** (`RELOAD_NOTICE_20260729`). Hai nút cũ
  ("Đăng xuất tất cả" / "Đăng xuất người này") đổi thành **nhắc tải lại trang**:
  `notify_reload_all` / `notify_reload_user` đặt cờ `profiles.reload_notice`, client hiện
  đúng banner "Hệ thống vừa cập nhật — Cập nhật ngay" của `src/core/versionChecker.js`.
  Người dùng **giữ nguyên phiên đăng nhập, không có alert chặn màn hình**. Đừng thêm lại
  `signOut()` vào luồng này.
  - Đường đi: cờ trong DB lo cho người offline (đọc ở `/api/profile`, cờ **dùng một lần**),
    realtime lo cho người đang mở web — kênh riêng `user-status-<id>` (reason
    `reload_notice`) cho một người, kênh chung `lh-global` cho tất cả.
  - `loadProfile` bản đầy đủ (lúc mở trang) **bỏ qua** cờ này: vừa tải mới xong thì nhắc
    tải lại là vô nghĩa. Chỉ các lần xác minh lại (`check_only`) + ping hoạt động + polling
    60s mới hiện banner.
- **Panel "Quản lý môn học" KHÔNG còn tiêu đề / mô tả / nút "Tải lại môn"**
  (`SUBJECT_ADMIN_COMPACT_HEAD_20260729`): cả ba đều trùng với header trang (tên trang +
  `#refreshBtn`, mà `COPILOT_ADMIN_RELOAD_FIX_20260630` đã cho gọi lại `loadSubjectsAdmin` khi
  đang ở trang này), bỏ đi để danh sách được thêm ~90px. CSS `.subjectAdminHead` đã xoá ở cả 4
  chỗ (`admin.css` 2 rule + media query, `injectCompactSubjectStyle` và block polish trong
  `adminCore.js`) — đừng thêm lại khối `.subjectAdminHead` vào `ensureSubjectAdminPage`.
- **Tab Kiểm tra KHÔNG còn chip "KIỂM TRA"** (`EXAM_MERGE_LIST_TALLER_20260729`). Chip
  `.examOnlyBadge` ở đầu `.examOnlyStart` nhắc lại đúng tên tab đang mở, nên bỏ khỏi
  `exam.js`; hàng `badge` đã xoá khỏi **cả 4** `grid-template-areas` của
  `#quiz .examOnlyStart` (2 bản desktop + 2 bản `max-width:760px`) — sót một cái là hàng đó
  thành dòng grid ẩn và lệch cả bảng. Chip của **bảng kết quả** ("KẾT QUẢ KIỂM TRA", cùng
  class) thì GIỮ. Cùng lúc bỏ `padding:24px` của `.examOnlyStart`: bảng không có nền riêng
  nên padding đó chỉ cộng vào 18px của `.setup`. Hai việc này trả 80px cho danh sách
  **"Gộp thêm môn"** → cap `max-height` nới từ `100vh - 380px` lên `100vh - 300px`
  (màn cao 589/670/900 → 289/370/600px). Đừng hạ dưới 300px: `#quiz` là `overflow:hidden`
  ở ≥901px nên tràn là cắt mất đáy khung, `-296px` đã thử và tràn 5px. Số đo + cách kiểm
  lại ghi trong `app.css`, khối `EXAM_MERGE_LIST_TALL_COLUMN_20260728`.
- **Email đang đăng nhập LUÔN hiện ở cổng chọn môn** (`GATE_EMAIL_KEEP_VISIBLE_20260729).
  `@media (max-height:680px)` từng `display:none` cho `#subjectUserEmail` để "ép gọn theo chiều
  cao", nhưng nó nằm CÙNG hàng flex với avatar 32px nên ẩn đi không tiết kiệm một pixel nào —
  chỉ làm người dùng không biết mình đang đăng nhập bằng mail nào. Nay chỉ thu nhỏ + cắt bằng
  `ellipsis`. Đừng ẩn lại.
- **`closeModal` phải gọi qua `lhCloseModal()` trong inline `onclick`**
  (`FIX_CLOSE_MODAL_INLINE_20260729`). `admin.html` có `<button id="closeModal">` nên
  `window.closeModal` LÀ phần tử DOM đó → gọi trần `closeModal()` ném
  "closeModal is not a function" và modal không đóng được. Đừng gán `window.closeModal`.

- **App học sinh KHÔNG có chức năng xóa câu** (bỏ 20260727). Hai block
  `FINAL_DELETE_BUTTON_BESIDE_OPEN_20260614` và `FIX_DELETE_NO_TOGGLE_20260627` đã xóa khỏi
  `appCore.js`. Xóa câu chỉ làm ở **trang admin**; endpoint `delete_question` giữ cho admin.
  Đừng thêm nút xóa vào `card()` của STEP1 dù thấy CSS `.studyDeleteAction` còn sót.

- **Mô tả môn giới hạn 160 ký tự** (`SUBJECT_DESC_LIMIT_20260728`). Con số này đo từ CSS, không
  phải chọn bừa: `.subjectCardDesc` kẹp 3 dòng (4 dòng khi ≤1000px) và thẻ hẹp nhất là 390px.
  Ba ô nhập đều `maxlength="160"` kèm bộ đếm `.descCounter`: `addSubjectDesc` (appCore ~2674),
  `editSubjectDesc` bản sống (adminCore ~5017) và bản chết (~2787). Đổi giới hạn thì phải đo lại
  số cột / bề rộng thẻ trong `app.css`, đừng chỉ sửa `maxlength`.
- **Môn cùng mã gốc là một THƯ MỤC, bấm mới sổ ra** (`SUBJECT_FOLDER_DRILLDOWN_20260728`,
  thay `SUBJECT_GROUP_BY_BASE_20260728` — khung `.subjectGroup` mở sẵn đã bỏ, CSS cũ đã xóa).
  Quy tắc mã gốc (`baseCode`/`baseOf`) nằm ở **BA chỗ phải khớp nhau**: `subjectGate.js`,
  `exam.js` (~96) và `adminCore.js` (block `COPILOT_COMPACT_DRAG_SUBJECT_ORDER_20260630`).
  - **Web học** (`subjectGate.js`): ngoài cùng là lưới thẻ — cụm ≥2 môn thành một
    `.subjectFolderCard`, cụm 1 môn là thẻ trần. Bấm thư mục → `openBase`. Mở cổng lên thì
    thư mục chứa môn đang học được mở sẵn. **Đang gõ tìm kiếm thì bỏ thư mục, trải phẳng kết
    quả**; xóa ô tìm kiếm quay lại đúng thư mục cũ.
  - **Thanh thư mục nằm TRONG hàng tab, không chiếm hàng riêng của lưới**
    (`SUBJECT_FOLDER_BAR_IN_TABS_20260729`): `syncFolderCrumb` đặt nút "← Tất cả môn" + mã gốc
    vào `#subjectFolderCrumb` (trong `.subjectGateTabsLeft`, cạnh tab "Danh sách môn học") và
    "N môn · M câu" vào `#subjectFolderCrumbMeta` (bên phải ô tìm kiếm) — danh sách môn được
    thêm ~65px. `folderBarHTML` (`.subjectFolderBar` trong lưới) chỉ còn là **bản dự phòng** cho
    lúc `ensureSubjectGateTabs()` của appCore chưa dựng xong thanh tab; đừng xoá nó, cũng đừng
    quay lại vẽ thanh vào lưới. Hai chỗ phải sửa kèm khi đổi: danh sách ẩn/hiện của
    `__switchSubjectGateTab` (appCore ~2615, không thêm thì tab "Thêm môn mới" vẫn thấy nút lùi
    ra) và `order:-1` ở `max-width:760px` (hàng tab cuộn ngang, để nguyên thứ tự thì nút
    "← Tất cả môn" nằm ngoài màn hình).
  - **Nút "Tải lại" giữ nguyên chỗ người dùng đang đứng**
    (`SUBJECT_REFRESH_KEEP_FOLDER_20260729`): `refreshSubjects(force, autoOpenPickedFolder)` chỉ
    mở sẵn thư mục của môn đang học khi `autoOpenPickedFolder = true` — và **chỉ `openGate()`
    truyền true**. Trước đây `refreshSubjects` luôn tính lại `openBase` theo `pickedCode`, nên
    đang đứng ở "Tất cả môn" mà bấm Tải lại là bị nhảy vào thư mục của môn đang học. Nếu thư
    mục đang mở biến mất sau khi tải lại (bị xoá / còn 1 môn) thì tự lùi ra ngoài.
  - **Trang admin** (`renderSubjectAdminList`): ngoài cùng là hàng thư mục
    `.subjectAdminFolder` (mã gốc, danh sách mã con, số môn, số câu, nút `NEW`, nút Mở)
    xen với hàng môn lẻ; bấm Mở → `openSubjectFolderAdmin(base)`. Kéo thả ở ngoài đổi chỗ
    **cả khối thư mục**, ở trong đổi chỗ môn con — cả hai đều ghi lại `sort_order` phẳng
    1..N qua `commitGroupOrder` nên các môn cùng gốc luôn nằm liền nhau.
  - **NEW của thư mục là cờ RIÊNG** (`SUBJECT_FOLDER_NEW_BADGE_20260729`, thay cách cũ "suy ra
    từ môn con"). Bấm NEW ở hàng thư mục **không đụng một môn con nào**, và bật NEW cho môn con
    cũng không làm thẻ thư mục sáng — hai cờ độc lập, cố ý, đừng "sửa lại".
    - Thư mục không phải một dòng trong `subjects`, nên cờ lưu ở `site_settings` khoá
      `subject_folder_new_badges` = **JSON mảng mã gốc đang bật** (`api/lib/folderBadges.js`,
      một dòng cho tất cả thư mục: đọc 1 query, ghi 1 query).
    - Ghi qua action `set_subject_folder_new_badge` (`{base, enabled}`); quyền như
      `set_subject_new_badge` (editor cũng được). Đọc: `/api/subjects` và `/api/admin-dashboard`
      đều trả thêm khoá **`folder_new_badges`** ở tầng trên cùng → admin dùng
      `cache.folder_new_badges`, web học dùng `folderNewBadges` (module `subjectGate.js`, nhặt từ
      CẢ HAI chỗ gọi `/api/subjects`: `getSubjects` và `tursoCounts`).
    - Cờ NEW của từng môn vẫn nằm trong `subjects.cover` (`set_subject_new_badge`) như cũ.
    - `?mock=1` mặc định bật NEW cho thư mục MOCK1 trong khi mọi môn con đều tắt — đúng ca cần
      kiểm; mock nhớ cờ trong phiên (`mockFolderNewBadges`).
  - Số cột `.subjectList`: 4 (>1500px) → 3 (≤1500) → 2 (≤1150) → 1 (≤760); thẻ cao 150px,
    134px khi màn ≤900px — đo để **luôn thấy đủ 3 hàng** mà không phải cuộn. Đổi số cột thì
    phải đo lại `.subjectCardDesc` (đang kẹp 2 dòng, xem `SUBJECT_DESC_LIMIT_20260728`).

## Bẫy đã gặp thật

- **Tách file làm ĐỨT chuỗi lớp của `renderCard`** (`RENDER_CARD_WINDOW_BRIDGE_20260731`, đã sửa).
  `renderCard` bị xếp 3 lớp ở `subjects.js`; hồi còn một file chúng gán thẳng vào binding nên
  16 chỗ gọi trong appCore đều nhận đủ chuỗi. Tách ra thì `renderCard` trong subjects.js là
  **biến toàn cục** (`window.renderCard`) — mà appCore chưa từng phơi tên này ra window, nên
  `typeof renderCard === 'function'` trả false, **cả ba lớp im lặng không được cài** và
  `window.renderCard` KHÔNG BAO GIỜ tồn tại → 6 chỗ gọi `window.renderCard?.()`
  (editor.js, images.js, library.js, subjectGate.js) thành no-op. Triệu chứng thật:
  thêm/xóa ảnh trong form sửa xong **thẻ Flashcard không vẽ lại**, phải lật thẻ hoặc qua câu
  khác rồi quay lại mới thấy (`updateLocal` của `COPILOT_FIX_EDIT_IMAGE_VISIBLE_AFTER_SAVE_20260628`
  chỉ vá LHState rồi gọi `window.renderCard?.()` — nay `saveEditPreview` gọi nó qua
  `window.__LHUpdateQuestionLocal` TRƯỚC khi tải lại môn, xem `EDIT_SAVE_SINGLE_PATH_20260731`).
  Nay bản thật tên `renderCardBase`, phơi ra `window.renderCard` ngay sau khi khai báo, còn
  `renderCard` chỉ là hàm CHUYỂN TIẾP; **mọi lớp bọc phải bọc `window.renderCard`**, kể cả lớp
  trong chính appCore. Cách kiểm nhanh sau mỗi lần tách: mở Console gõ
  `typeof window.renderCard` — `undefined` là đứt. **Từ 20260731 khỏi phải nhớ tên nào cần
  kiểm: chạy `npm run check:globals`** — nó quét cả `src/`, tìm mọi lời gọi `foo()` của file
  khác mà không nơi nào gán `window.foo`, tách riêng hai mức hậu quả (`ReferenceError` vs
  `typeof foo === 'function'` luôn false). Lần đầu chạy nó lôi ra **7 chỗ đứt có sẵn**, xem
  mục *Việc còn nợ*. Báo động giả (tham số trùng tên, hàm sẵn có của trình duyệt) thì thêm
  vào `IGNORE` trong `scripts/check-globals.js` KÈM LÝ DO, đừng nới lỏng luật quét.
  **Hai hàm nữa cùng khuôn cầu nối này, đừng bọc vào binding của appCore:**
  `updateCardTools` (bookmarks.js bọc để vẽ nút 🔖 — mất cầu là mất nút) và `switchTab`
  (appCore gán thẳng ra window, không ai bọc).
- **Tách file mà QUÊN gọi `install*()` thì cả 4 lệnh kiểm đều XANH — chỉ vỡ lúc bấm nút.**
  Lần tách 20260730 để lại 4 file không ai import: `bookmarks.js`, `flashcards.js`,
  `api.js`, cùng 3 hàm `install*` của `subjectImport.js` — tổng ~4.900 dòng nằm chết trong
  bundle trong khi bản đang chạy vẫn ở appCore. Hai mức hậu quả:
  · **Đọc nhầm file**: sửa lỗi bookmark trong `bookmarks.js` xong không có gì đổi.
  · **Hỏng thật**: nhóm `IMPORT_PREVIEW_INLINE_EDIT_20260625` (9 block) bị XÓA khỏi appCore
    và chuyển sang `subjectImport.js` nhưng không có lời gọi, nên 3 nút inline `onclick`
    của UI "Thêm môn" — `__openUserAIPromptModal`, `__copyUserAIPrompt`,
    `__clearUserImportFile` — ném TypeError khi bấm. Đã nối lại 20260731.
  Cách kiểm sau mỗi lần tách (một lệnh, không cần mở web):
  `node -e "…"` so danh sách `export function install*` với các lời gọi trong appCore/main —
  hoặc nhanh hơn: mở tab "Thêm môn mới" rồi chạy trong Console
  `[...new Set([...document.getElementById('subjectGate').innerHTML.matchAll(/(__[A-Za-z0-9_]+)\(/g)].map(m=>m[1]))].filter(n=>typeof window[n]!=='function')`
  — trả về mảng rỗng là đủ hàm.
- **`#idx` / `#total` không phải lúc nào cũng tồn tại.** Block
  `FINAL_HEADER_SUBJECT_DYNAMIC_FIX` ghi lại `.counter` mỗi 500ms; khi tab đang mở KHÔNG
  phải Flashcard thì hai id đó bị xóa khỏi DOM. Code chạm `$('idx').textContent` sẽ ném lỗi.
- **Đừng gộp nhiều render vào một `try`.** Dùng `renderAllSafe()` (appCore ~dòng 280):
  `renderCard` / `renderQuiz` / `renderStudy` mỗi hàm một `try` riêng. Trước đây cả 3 chung
  một `try` nên renderCard lỗi là thư viện không được vẽ lại → "đổi môn mà thư viện vẫn
  hiện môn cũ".
- **Đổi môn** đi qua `setSubject()` → bắn `lh:subject-changed`; thư viện lắng nghe event này
  để dọn ô tìm kiếm + trạng thái câu đang mở của môn cũ.
- Mã môn ở `localStorage['learninghub_subject_code_merged_v1']`. Tiến độ mỗi môn ở
  `learninghub_progress_<MÃ_MÔN>`.
- `version.json` sinh theo git SHA lúc build; `src/core/versionChecker.js` so sánh để nhắc
  người dùng tải lại khi có deploy mới. Đừng chỉnh tay file đó.

## Việc còn nợ (giảm chi phí bảo trì)

- [x] Nhóm thư viện (`renderStudy`): đã xóa `LIBRARY_UX_STEP2_PREVIEW_CARDS_20260627` và
      phần render chết của `LIBRARY_FILTER_AND_EDIT_PREVIEW_LAYOUT_20260627`; 4 chỗ còn lại
      đánh dấu `DEAD_OVERRIDE_20260727`. Bản sống duy nhất: `renderUnified` của STEP1.
- [x] **Nghi vấn ghi đè ở mốc 900ms: ĐÃ XÁC MINH ĐÚNG (20260727).** Bản đang chạy của cả
      nhóm sửa câu hỏi là `openEditPreview` / `saveEditPreview` (block
      `LIBRARY_FILTER_AND_EDIT_PREVIEW_LAYOUT_20260627`) — `apply()` của nó chạy ba lần
      (ngay, 0ms, **900ms**) và gán vô điều kiện, nên **9 lớp `openEditor` + 5 lớp
      `saveEditor` gán đồng bộ ở dưới file đều chết**. Đã đánh dấu tại chỗ:
      `grep -n DEAD_OVERRIDE_20260727` (chú thích gốc ở `function openEditor()` ~dòng 620).
      **Sửa lỗi editor/upload ảnh thì sửa vào `openEditPreview` / `saveEditPreview`.**
      Còn hơn thế: hai block `CLEAN_IMAGE_REQUEST_DELETE_OLD_CREATE_NEW_20260628` và
      `COPILOT_FIX_EDIT_SAVE_UPLOAD_DIRECT_20260628` chết **cả block** (425 dòng) vì chúng bám
      vào `#imgUpload` / `#saveEdit`, mà `openEditPreview` dựng lại toàn bộ `#editModal` với
      bộ id mới (`editPreviewImgInput`, `[data-edit-preview-save]`).
- [x] **Đã xóa 791 dòng mã chết của nhóm sửa câu hỏi (20260727)**, appCore 13.554 → 12.910:
      hai block `CLEAN_IMAGE_REQUEST_DELETE_OLD_CREATE_NEW_20260628` (248) và
      `COPILOT_FIX_EDIT_SAVE_UPLOAD_DIRECT_20260628` (197), IIFE "lưu trực tiếp" cũ lẫn trong
      `FINAL_FLOATING_PARTICLES_CANVAS` (171), `patchSave()` (91), 4 lớp bọc `openEditor` (84).
      **`openEditor` 12 → 3 lớp, `saveEditor` 8 → 3.** Không mất hành vi: việc "xóa yêu cầu
      sửa đang chờ của cùng câu" nằm ở SERVER (`api/controllers/editRequests.js` POST), còn
      upload ảnh thì editor sống đã làm ngay lúc chọn file. Bảng chi tiết + cách so bản
      trước/sau: `docs/SPLIT_PLAN.md` mục 3.4.
- [x] **Phép thử đăng nhập thật: ĐÃ CHẠY, ĐẠT (20260727).** Đăng nhập → thêm ảnh trong form
      sửa → ảnh ra URL Cloudinary đúng như mong đợi. Tức là việc xóa 791 dòng mã chết của
      nhóm sửa câu hỏi không làm vỡ luồng upload thật.
- [x] **Nút "Lưu trực tiếp" có HAI đường lưu, đường capture cướp cú bấm: ĐÃ SỬA (20260731)** —
      `EDIT_SAVE_SINGLE_PATH_20260731`. Mục này trước ghi là "`#editModal` hiện lại sau khi
      lưu" và **giả thuyết ghi ở đây là SAI**: `apply()` của
      `LIBRARY_FILTER_AND_EDIT_PREVIEW_LAYOUT_20260627` chạy ba lần nhưng nó CHỈ gán
      `window.openEditor`/`window.saveEditor`; `document.addEventListener('click', …)` nằm
      trong `installEditor()` — mà `installEditor()` được gọi ĐÚNG MỘT LẦN (appCore ~1941),
      nên không có chuyện một cú bấm chạy handler 3 lần.
      Thủ phạm thật: `COPILOT_FIX_EDIT_IMAGE_VISIBLE_AFTER_SAVE_20260628` (`images.js`) có
      **đường lưu thứ hai của riêng nó** — một handler `click` ở **CAPTURE** trên `document`
      khớp `#saveEdit,[data-edit-preview-save]`, gọi `stopImmediatePropagation()` rồi tự
      `saveDirectNoReload()`. Capture ở `document` chạy TRƯỚC mọi handler bubble, nên
      **`saveEditPreview` chưa từng nhận được cú bấm nào** — đúng cái bản mà `npm run find` và
      chính CLAUDE.md ghi là "bản đang chạy". Tệ hơn: `saveDirectNoReload` lấy id câu qua
      Supabase (`window.HODSupabase.__client`), mà từ `TURSO_ONLY_DATA_SOURCE_20260630` client
      đó chỉ còn cho Auth và ở `?mock=1` là `null` → nó **bail LẶNG sau khi đã chặn
      propagation**: bấm "Lưu trực tiếp" xong không lưu gì, không toast, không alert; đo được
      trạng thái nút kẹt `disabled` + "Đang lưu...".
      Nay **xóa hẳn đường lưu thứ hai** (handler capture + `saveDirectNoReload` +
      `collectDraft` + `getQuestionId`, ~110 dòng), chỉ còn `updateLocal` — việc thật của
      block — phơi ra `window.__LHUpdateQuestionLocal` và `saveEditPreview` gọi nó ngay trước
      `loadCurrentSubjectOnly(true)` để ảnh vừa thêm hiện liền. **Một nút = một đường lưu.**
      Đo lại bằng `?mock=1&role=admin`, bấm nút THẬT: đúng **1** POST `save_question_direct`,
      modal đóng và **ở yên qua 6 giây** (MutationObserver trên `class` của `#editModal` chỉ
      thấy 1 lần đổi), `lhErrors()` rỗng. Nhánh người học (`?mock=1`, nút "Gửi báo cáo") không
      đổi — handler cũ vốn đã `return` trước khi chặn propagation với người không phải
      admin/editor.
      Hai điều đo được, ghi lại cho lần sau:
      · **Không cần pane trình duyệt hiển thị** như mục này từng ghi. Pane ẩn thì `screenshot`
        thất bại (trang không compositing) nhưng `el.click()` / `dispatchEvent` vẫn chạy đủ
        chuỗi capture → target → bubble; đủ để soi handler nào cướp event.
      · **Cách bắt nhanh "ai chặn cú bấm"**: đăng ký listener của mình ở capture trên
        `document` rồi bấm. Log RỖNG HOÀN TOÀN (không cả `click:capture`) nghĩa là có handler
        capture đăng ký TRƯỚC đã `stopImmediatePropagation` — cứ `grep` selector của nút trong
        `src/` là ra, nhanh hơn vá `DOMTokenList.prototype.remove` để in stack.
- [x] **"Khôi phục" làm thư viện thành "0 / 0 câu": ĐÃ SỬA (20260731)** —
      `REBUILD_DEAD_LOCAL_20260731`. **Cách sửa ghi ở đây trước đây là SAI**: đổi sang
      `window.rebuild?.()` không chữa được, vì bản `window.rebuild` của
      `PATCH_NO_LOCAL_QUESTIONS` cũng đặt thẳng `RAW = []; pool = []`. Cả hai bản đều xoá
      trắng. Nay hàm local đổi tên thành `seedStateFromBase` (chỉ còn gieo state rỗng lúc nạp
      file, không ai gọi nhầm được nữa) và **cả 4 chỗ** đụng `edits` đều tải lại từ Turso qua
      `reloadAfterLocalEditChange()`: `restoreEditor`, `importEditsFile` (`#importEdits`),
      `clearEdits` (`#clearEdits`) trong appCore, và nhánh "lưu sửa local" của `editor.js`
      (chỗ này vá thẳng câu vào `LHState.RAW`/`pool` thay vì tải lại — nó là nhánh offline).
- [x] `normalizeAll()` chạy lại khi vẽ thư viện (`RESTORE_LIBRARY_NORMALIZE_20260727`):
      `renderUnified` gọi `window.__LHNormalizeAll()` ở đầu, thay cho lớp bọc renderStudy đã chết.
- [x] Dọn xong CSS chết của nút xóa: 13 chỗ `.studyDeleteAction` + `body.study-has-delete`
      trong `app.css` (rule riêng thì xóa cả dòng, selector gộp thì chỉ bỏ tên đó;
      `.expandHint`/`.studyReportBtn` giữ nguyên computed style ở cả desktop và mobile).
- [x] **Tách `appCore.js` theo tính năng: XONG (20260731).** appCore **14.915 → 2.743 dòng
      (−82%)**, `app.js` 876 KB → 770 KB. Bước 1 `state.js` (18 biến, 505 chỗ đổi bằng
      `node scripts/migrate-state.js`; khi sửa state dùng `LHState.ci = …`, đừng destructure
      rồi gán) · bước 2 `exam.js` + `format.js` · bước 3 `editor.js` + `images.js` kèm dọn 791
      dòng mã chết · bước 4 `library.js` + `subjectGate.js` · bước 5 `subjects.js` +
      `search.js` + `auth.js` + `bookmarks.js` + `flashcards.js` + `subjectImport.js`.
      Bước 5 để lại 4.900 dòng chết vì quên nối `install*()` — đã nối và xóa bản trùng trong
      appCore ngày 20260731, đồng thời xóa hẳn 3 file không ai import (`src/student/api.js`,
      `src/student/index.js`, `src/core/auth.js`) và hàm `filterQuestions` của `search.js`.
      Chi tiết + số đo: `docs/SPLIT_PLAN.md`. Sáu cái bẫy khi tách, đọc `SPLIT_PLAN.md`
      mục 2, 3 và 4.1 trước khi tách thêm: thứ tự chạy vs `import` (dùng `install*()` gọi đúng
      chỗ block cũ, không dùng IIFE) · **đặt `install*()` mà quên dòng `import` thì cả 4 lệnh
      kiểm đều XANH, chỉ vỡ lúc mở web** · khi nào `window.*` khi nào import · gán trần vào
      binding module thì phải để lại hàm chuyển tiếp · `typeof X === 'function'` với tên
      KHÔNG hề tồn tại (bước 4 sập đúng bẫy này 5 lần: `notify`, `fixBrand`, `renderCard`,
      `renderQuiz`, `renderStudy` — block cũ là IIFE nên gọi trần được, tách ra là mất) ·
      `check:overrides` không phân biệt scope nên tên local trùng nhau ngoài block bị tính
      thành lớp ghi đè.
- [x] **Cầu nối đứt giữa các file: ĐÃ QUÉT HẾT + SỬA (20260731)** — `GLOBALS_BRIDGE_20260731`.
      Viết `scripts/check-globals.js` (`npm run check:globals`) rồi sửa đúng 7 chỗ nó lôi ra:
      · `cleanImages` — bản duy nhất ở `subjects.js`, chưa phơi ra window. `library.js` gọi
        không bọc `typeof` nên ném `ReferenceError`, bị `.catch` nuốt → **ảnh chậm của thư
        viện chưa từng nạp xong**; appCore + `subjectGate.js` có bọc `typeof` nên im lặng bỏ
        qua lọc ảnh. Nay `window.cleanImages` + cả 3 chỗ gọi qua cầu.
      · `esc` (2 chỗ trong `subjects.js`) — chỉ có ở `format.js`, không ai gán `window.esc`.
        Đọc một tên chưa khai báo là **luôn** ném `ReferenceError`, kể cả trong `?.()`. Nay
        `import { esc } from './format.js'`.
      · `syncSubjectTexts` (appCore) — bản thật ở `subjectGate.js`. Dòng đó ném, kéo theo
        `updateCardTools?.()` ngay dưới không chạy → **đổi môn xong mất nút 🔖**. Nay cả hai
        đi qua `window.*`.
      · `syncUserSubjectToProfile` — khối `if (typeof … === 'function')` trong appCore chưa
        từng chạy từ lúc tách file. **Cố ý KHÔNG nối lại**: `setSubject()` của subjectGate đã
        POST `/api/profile` mỗi lần đổi môn; nối vào chỉ gửi trùng request ghi mỗi lần tải câu.
        Khối chết đã xoá, có chú thích tại chỗ cách bật lại nếu cần.
      Kiểm bằng `?mock=1`: `typeof window.cleanImages / syncSubjectTexts / updateCardTools /
      renderCard` đều `function`, `lhErrors()` rỗng.
- [x] Chế độ `?mock=1` stub auth + `/api/*` để test UI không cần đăng nhập —
      `src/core/mock.js` (xem mục riêng ở trên). Đã kiểm: 4 câu MOCK1 vẽ ra, Flashcard
      chạy, trang admin mở, hai màn 403 ra đúng chữ khác nhau, `fail=500` ra fallback.
- [x] **`.counter` hiện "0 câu": KHÔNG CÒN TÁI HIỆN (đo lại 20260731).** Với `?mock=1`, tab
      Flashcard ra "Câu 1 / 4" và tab Thư viện ra "4 câu" đúng bằng 4 mục được vẽ,
      `lhErrors()` rỗng. `fixCounter` (bản sống, appCore ~1537, chạy mỗi 500ms) đọc
      `LHState.RAW.length` — cùng nguồn với `renderUnified`, nên hai số không thể lệch trừ khi
      có ai đặt `RAW = []` sau khi vẽ. Ứng viên duy nhất làm việc đó là `window.rebuild`, và
      4 chỗ gọi nó đã sửa ở mục "Khôi phục" trên. Gặp lại thì đo hai dòng Console trước khi
      đọc code: `document.querySelectorAll('.counter').length` (phải là 1) và số mục
      `#study [data-num]`.
