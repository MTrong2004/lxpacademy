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
   **Và phải BUMP chuỗi `?v=` trong `index.html`** (2 chỗ: `app.css?v=…` dòng 14,
   `app.js?v=…` dòng ~298). Chuỗi này là cache-buster DUY NHẤT và nó từng đứng ở
   `20260726_v9999999` suốt nhiều lần deploy: tính năng mới nằm trong bundle nhưng người dùng
   thật **không bao giờ thấy** vì browser giữ file cũ (đúng ca "hai thẻ chọn hướng của bước 2 đã
   có trong build mà không hiện"). Hard refresh chỉ chữa cho máy của mình, không chữa cho họ.
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
| `src/student/importQuality.js` | **chấm "độ sai lệch dữ liệu"** của file import (`analyzeImport`, `checkNumbering`, `parseImportNum`, `normalizeAnswer`) — hàm thuần, test bằng node |
| `src/student/docExtract.js` | **đọc trực tiếp PDF chuẩn / Word thành câu hỏi, không qua AI** (`parseQuestionsFromPages` thuần + `extractFromFile` nạp pdf.js lazy / giải nén .docx bằng JSZip) |
| `src/student/importPrompt.js` | **nguồn duy nhất của prompt** chuyển PDF/DOCX → JSON (`IMPORT_AI_PROMPT`) |

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
  `admin-action`, `bookmarks`. Tất cả trừ `settings` đều cần token.

- **"Lưu câu 🔖" đồng bộ giữa các thiết bị, và MỖI HỌC PHẦN một danh sách riêng**
  (`BOOKMARK_SYNC_PER_PART_20260806`, `src/student/bookmarks.js` + `api/controllers/bookmarks.js`).
  Hai lỗi cùng gốc "chỉ có localStorage":
  - **Điện thoại và máy tính không thấy nhau.** Không có bảng nào trong Turso, không có lời gọi
    API nào — mở web ở máy khác là danh sách trống.
  - **Các học phần lưu chung một rổ.** Có `lh_starred_v1_<MÃ>` (đúng, theo từng phần) NHƯNG
    `saveBookmarks` còn ghi ĐÈ `lh_starred_v1_backup_all` bằng danh sách của môn đang mở, rồi
    `loadBookmarks` lại HỢP backup_all vào MỌI môn. Mà `getQKey` là `num_<số câu>` và mọi phần
    đều đánh số từ 1, nên lưu câu 5 ở MLN122 xong mở MLN122_2 là câu 5 ở đó cũng hiện "đã lưu".
  - **Bảng `bookmarks`** (`migrations/004_bookmarks.sql`): `PRIMARY KEY (user_id, subject_code,
    q_key)`. `subject_code` chính là học phần nên hai phần cùng mã gốc không thể lẫn — **đừng
    gộp theo mã gốc**, đó là ranh giới của tính năng. `q_key` giữ đúng định danh của client
    (`num_12` / `id_87` / `q_<40 ký tự đầu>`) để dữ liệu localStorage cũ đẩy lên được mà không
    phải tra lại `questions.id`.
  - **Client**: một khoá `lh_starred_v2` = `{ "MLN122": ["num_5"], "MLN122_2": [] }`
    (`backup_all` đã bỏ hẳn). localStorage tụt xuống vai **bản đệm**: vẽ ngay lúc mở web, rồi
    `syncBookmarks()` lấy bản server đè lên và vẽ lại. Mỗi lần bấm 🔖 thì đổi local trước rồi
    `pushBookmark()` bắn POST — lỗi mạng chỉ `lhWarn`, không chặn người dùng.
  - **Lượt đầu trên mỗi thiết bị thì HỢP local với server** rồi đẩy phần server chưa có lên qua
    `{merge:{…}}` (một `db.batch`, không phải N request), xong mới đặt cờ
    `learninghub_bookmarks_pushed_v1`. Từ lượt sau **server ĐÈ local** — không đè thì "bỏ lưu" ở
    điện thoại bị bản local cũ của máy tính hồi sinh. Đẩy thất bại thì **không đặt cờ**, lần mở
    web sau thử lại, nên bookmark có từ trước khi có tính năng đồng bộ không mất.
  - Vào `lh:subject-changed` chỉ VẼ LẠI, không gọi server: một lần GET đã mang về bookmark của
    mọi phần.
  - `?mock=1` gieo sẵn `MOCK1_C1: ['num_2']` trong khi MOCK1 và các phần MOCK1_C* khác trống —
    đúng ca cần kiểm. **Mock nhớ trong RAM nên reload là mất**, đừng dùng reload để kết luận
    "POST không tới": kiểm bằng `await (await fetch('/api/bookmarks')).json()` trong CÙNG một
    lần tải trang.
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
  `500 INTERNAL_ERROR` và `503 AUTH_CHECK_FAILED` = **không kết luận được quyền**, client
  phải hiện "thử lại", KHÔNG được coi là bị thu hồi quyền.

- **"Không xác minh được" KHÁC "hết phiên" — đừng gộp lại** (`AUTH_VERIFY_INCONCLUSIVE_20260805`,
  `api/lib/auth.js: verifyUserDetailed` + `api/index.js`). `verifyUser` cũ trả `null` cho CẢ HAI ca:
  (1) thiếu token / Supabase khẳng định token sai, và (2) **không hỏi được Supabase** (mất mạng,
  timeout, Supabase 5xx, **429 rate limit**). Router thấy `null` là trả `401 UNAUTHORIZED`, mà ở
  client mã đó có nghĩa cố định là "phiên hỏng" → `handleAccessRevoked()` **gọi `signOut()`**. Tức
  là Supabase auth chớp một nhịp là NGƯỜI DÙNG BỊ ĐĂNG XUẤT dù phiên còn tốt nguyên, và lớp làm mới
  token của client (`LH_SESSION_REFRESH_20260729`) **không cứu được**: token mới cũng không xác minh
  được, `inspectDenial` vẫn kết luận UNAUTHORIZED.
  - Ranh giới: Supabase trả **400/401/403 → UNAUTHORIZED** (401 như cũ); mọi mã khác, mọi exception,
    và **timeout 8s** (`VERIFY_TIMEOUT_MS`, tự hẹn giờ bằng `AbortController` vì Edge không chắc có
    `AbortSignal.timeout`) → **`AUTH_CHECK_FAILED` → 503**. Vẫn fail-closed (không cấp quyền), chỉ
    khác ở chỗ không xoá phiên đăng nhập.
  - 503 này bắn `postServerErrorEmbed(path + ' (verifyUser)')` — Supabase auth sập là loại lỗi cần
    biết ngay; tin trùng tự gộp 1 tin / 5 phút.
  - `verifyUser(req)` vẫn còn, là bản bọc trả `user || null` (fail-closed như trước) cho mọi chỗ
    không cần phân biệt. **Muốn phân biệt thì phải dùng `verifyUserDetailed`** — hiện chỉ `api/index.js`.
  - Client: **401 KHÔNG CÓ `code` thì không đăng xuất** nữa. Mọi 401 do `api/` của app sinh ra đều
    kèm `code: 'UNAUTHORIZED'`; 401 mà body không đọc được / không có code là câu trả lời của **proxy
    công ty / CDN / cổng wifi**, bản cũ đoán 'UNAUTHORIZED' cho ca đó tức signOut người dùng vì một
    trang HTML của proxy. Nay chỉ `console.warn`; phiên hỏng thật thì `/api/profile` trả 401 CÓ code
    và luồng thu hồi quyền chạy đúng ở đó. Sửa ở **hai chốt** của `src/student/auth.js`:
    `inspectDenial`/`unknownDenial` (lớp fetch) và nhánh `!res.ok` của `loadProfile`. **403 giữ
    nguyên hành vi cũ** — nó không đăng xuất ai.
  - Kiểm bằng `?mock=1&fail=503` (503 AUTH_CHECK_FAILED) và `?mock=1&fail=401nocode` (401 body HTML):
    cả hai phải KHÔNG thu hồi quyền. `?mock=1&fail=401` là ca ngược, vẫn phải ra
    "Phiên đăng nhập đã hết hạn".

- **RỚT MẠNG VẪN HỌC ĐƯỢC, VÀ CHỈ `BLOCKED` CÒN TỰ ĐĂNG XUẤT** (`LH_OFFLINE_GRACE_20260806`).
  Hai mục trên (`LH_SESSION_REFRESH_20260729`, `AUTH_VERIFY_INCONCLUSIVE_20260805`) đã chặn phần
  lớn ca "tự đăng xuất", nhưng còn ba đường và cả ca "mất mạng là mất luôn app":
  - **Người đang học bị màn hình che kín khi mạng chớp.** Mọi lỗi không kết luận được ở lần
    XÁC MINH LẠI (polling 90s / quay lại tab / realtime nối lại) đều gọi `showAccessCheckError()`
    → `showPendingApproval()` đặt `__LH_GATE_LOCKED = true` + `body.hod-locked`. Câu hỏi vẫn nằm
    trong localStorage (cache 12 giờ) mà người dùng không đọc được câu nào.
  - **401 sau khi KHÔNG gọi được Supabase để làm mới token.** Token hết hạn + `lhRefreshToken()`
    thất bại vì mất mạng → request đi ra **không có Authorization** → server trả `401 UNAUTHORIZED`
    hoàn toàn đúng luật → client cũ hiểu là "phiên hỏng" → `signOut()`. Lớp làm mới token không
    cứu được vì chính nó là chỗ thất bại.
  - **`UNAUTHORIZED` gọi `signOut()`.** Mất phiên Supabase = mất luôn `refresh_token` còn sống
    hàng chục ngày, nên người dùng phải chọn lại mail Google.

  Cách sửa — tách "KẾT LUẬN ĐƯỢC" khỏi "KHÔNG KẾT LUẬN ĐƯỢC":

  | Tình huống | Hành vi |
  |---|---|
  | `403 BLOCKED` | chặn + **signOut** (giữ nguyên) + xoá cache + xoá dấu xác nhận |
  | `403 PENDING_APPROVAL` / `INSUFFICIENT_ROLE` | như cũ (không signOut) + xoá dấu xác nhận |
  | `401 UNAUTHORIZED` (phiên hỏng thật) | gate "Phiên đăng nhập đã hết hạn", **KHÔNG signOut, KHÔNG xoá cache** |
  | 500 · 503 · lỗi mạng · 401 lúc không hỏi được Supabase | **chế độ tạm ngoại tuyến** nếu máy này đã từng được xác nhận, ngược lại "Không thể kiểm tra quyền" + tự thử lại |

  - **Dấu xác nhận**: `localStorage['learninghub_access_grant_v1']` = `{id, email, role, at}`, ghi
    mỗi lần `/api/profile` xác nhận có quyền, hạn **7 ngày** (`GRACE_MS`), khoá theo `id` tài khoản.
    Điều kiện DUY NHẤT để được học offline. Bị xoá ngay khi server kết luận mất quyền, và khi
    người dùng tự bấm Đăng xuất. Cờ RAM `revokedConclusively` chặn cửa hậu "bị khoá rồi rút mạng
    để vào lại" — đã đo: cắm lại dấu xác nhận bằng tay cũng không lọt.
  - Chấp nhận được vì **cổng ở client chỉ là lớp hiển thị**: server vẫn `checkUserAccess()` ở MỌI
    request, nên chế độ ngoại tuyến không mở thêm cửa dữ liệu nào — nó chỉ cho đọc lại thứ đã ở
    trên máy.
  - **Chế độ tạm ngoại tuyến** (`enterDegradedMode`): giữ giao diện, dựng profile tối thiểu từ dấu
    xác nhận nếu đang trống, hiện dải `#lhOfflineBar` ("Mất kết nối — bạn vẫn học được với dữ liệu
    đã tải" + nút Thử lại) — **không** `body.hod-locked`, **không** modal. `window.__LH_OFFLINE_MODE`
    và `window.__lhIsOfflineMode()` cho chỗ khác soi. Có mạng lại (event `online`) hoặc một lần
    xác minh thành công là tự thoát + tải lại dữ liệu mới.
  - **`window.__lhLastRefreshOutcome`** (`'ok' | 'dead' | 'unreachable' | 'none'`) là thứ phân biệt
    "refresh_token chết thật" với "không gọi được Supabase" — bản cũ nuốt mọi lỗi thành `''` nên hai
    ca này không thể tách. Ghi ở `lhRefreshToken()` của **cả hai** trang (auth.js + adminCore.js);
    `'unreachable'` (hoặc `navigator.onLine === false`) thì 401 KHÔNG được đưa vào `inspectDenial`.
  - **Dữ liệu để học offline**, 2 chỗ đã nới:
    · `subjects.js`: `readQuestionCache(code, allowStale)` + `loadSubjectLight` gọi server thất bại
      thì rơi về cache **kể cả quá hạn 12 giờ** (trước đây chỉ `return false` → thư viện trắng, nhất
      là đường `loadCurrentSubjectOnly(true)` vốn không đọc cache ở đầu hàm).
    · `subjectGate.js`: `getSubjects()` lưu `learninghub_subjects_cache_v1` (kèm `folder_new_badges`)
      và dùng nó khi `/api/subjects` lỗi — trước đây rơi về `fallbackSubjects()` = **hai môn viết cứng
      HOD102/MLN111** mà tài khoản có thể không hề học.
  - **Trang admin**: `handleAccessRevoked` chỉ signOut với `BLOCKED`; `loadProfile` của adminCore
    thôi đoán `UNAUTHORIZED` cho 401 không có code (web học sửa từ 20260805, trang admin thì chưa);
    hook 401/403 của interceptor bỏ qua 401 khi `__lhLastRefreshOutcome === 'unreachable'`.
    Admin **không** có chế độ ngoại tuyến — dashboard mà không có dữ liệu thật thì vô nghĩa.
  - **`activeUser()`** trong auth.js đọc `currentUser` rồi mới tới `HODSupabase.getUser()`: production
    hai cái là một, nhưng `?mock=1` thay cả `window.HODSupabase` nên không có nó thì **toàn bộ nhánh
    này không tự kiểm được** (mock không có phiên Supabase thật → `loadProfile` return sớm).
  - Cách kiểm (đã đo, xem bảng `?mock=1` bên dưới): `fail=offline`, hoặc chặn `/api/*` + đặt
    `navigator.onLine = false` ngay trong Console để mô phỏng đúng ca "rớt mạng giữa phiên".

- **Trang admin cũng làm mới token** (`LH_ADMIN_SESSION_REFRESH_20260805`, `adminCore.js` trong
  `LH_UNIFIED_SINGLE_FETCH_INTERCEPTOR_20260726`). Web học có lớp này từ `LH_SESSION_REFRESH_20260729`,
  trang admin thì **không**: `lhToken()` cũ đọc `access_token` trong localStorage mà **không xem
  `expires_at`**, gắn luôn vào header. `access_token` sống 1 giờ, nên mở dashboard rồi để máy sleep /
  tab chạy nền quá 1 tiếng (timer tự làm mới của supabase-js bị throttle) là request đầu tiên gửi
  token HẾT HẠN → 401 → `handleAccessRevoked` gọi `client.auth.signOut()`: **admin bị đá về màn hình
  đăng nhập dù `refresh_token` còn sống hàng chục ngày.**
  - Nay giống hệt web học: token hết hạn (hoặc còn <10s) thì **không gắn**, làm mới TRƯỚC khi gọi;
    gặp 401 thì làm mới rồi thử lại **đúng một lần** (`apiFetchWithRefresh` + `withAuth(..., force)`).
    Client Supabase lấy từ biến `client` của module (bản `createTursoClientMock` vẫn phơi nguyên
    `.auth`), dùng chung một lần làm mới qua `refreshInFlight`.
  - **Hai hook cũ (xoá cache sau `admin-action`, soi 401/403) phải bám vào promise CUỐI**, không phải
    lần gọi đầu — bám sai chỗ là lần thử lại thành công vẫn kích hoạt luồng thu hồi quyền.
  - Đừng bỏ `input.clone()` ở `retrySrc`: body của `Request` chỉ đọc được một lần.

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

### Mức tiêu thụ Turso: THẤP so với hạn mức, nhưng 3 chỗ tốn vô ích (đo 20260806)

Số đo trên DB thật: **9,4 MB** (2.405 trang × 4KB), 4.832 câu / 19 môn / 42 tài khoản
(**36 hoạt động trong 7 ngày**). Free tier Turso là 5 GB dung lượng + 1 tỷ rows read + 25 triệu
rows write mỗi tháng, nên dung lượng dùng ~0,2% và lượng đọc thường ngày ở mức phần nghìn.
Ba tầng cache ở trên + cache profile 10s + cache dashboard 2 phút (`OPTIM_TURSO_READS_20260726`)
đã chặn phần lớn. **Chưa có lý do đổi DB hay đổi gói.** Nhưng ba chỗ dưới đây tốn nhiều hơn
việc chúng làm — nếu số người dùng tăng chục lần thì sửa chỗ này trước:

| Chỗ | Đo được | Vì sao tốn |
|---|---|---|
| `add_question` (đường >80 câu) | **203.203 rows read** cho môn 638 câu · 970.992 rows read tích luỹ cho 13 môn đã nhập | Nó `select num from questions where subject_code = ?` **trước MỖI câu** → O(N²). Ghi cũng nhân 3: `questions` + `question_history` + `admin_logs` = 1.914 dòng cho một môn |
| `/api/admin-dashboard` | **5.945 rows read + 1,49 MB** mỗi lần cache miss | `select * from questions` lấy TOÀN BỘ 4.832 câu kèm đề bài/lựa chọn, dù trang admin **không còn tab "Câu hỏi"**. `cache.questions` giờ chỉ dùng để đếm và để tra ~52 câu có yêu cầu sửa. Mọi `admin-action` đều xoá cache này nên admin sửa 20 việc = 20 lần nạp lại |
| `question_history` | **3,50 MB = 37% cả DB** | 1 dòng cho mỗi câu được nhập, kể cả nhập hàng loạt (nơi "lịch sử sửa" chẳng có gì để so) |

Cách sửa nếu cần (chưa làm): gộp `add_question` thành lô như `createSmall` để `resolveImportNums`
tính một lượt · dashboard trả `select subject_code, count(*)` + chỉ những câu mà `edit_requests`
đang trỏ tới, nạp câu lẻ theo id khi mở modal · bỏ ghi `question_history` ở đường nhập hàng loạt.
Cả ba đều đụng nhiều chỗ nên đừng làm kèm việc khác.

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
| `?mock=1&fail=503` | **503 AUTH_CHECK_FAILED** (server không hỏi được Supabase auth): giữ phiên, KHÔNG đăng xuất — xem `AUTH_VERIFY_INCONCLUSIVE_20260805`. **Kết quả phụ thuộc dấu xác nhận** (`LH_OFFLINE_GRACE_20260806`): có `learninghub_access_grant_v1` thì ra **chế độ ngoại tuyến** (dải "Mất kết nối", không chặn), không có thì ra màn "Không thể kiểm tra quyền" như cũ |
| `?mock=1&fail=offline` | **Mọi `/api/*` reject như mất mạng** (không phải mã lỗi HTTP — hai đường code khác nhau). Mock xoá cache môn MOCK\* mỗi lần khởi động nên muốn kiểm ca "rớt mạng giữa phiên" thì **đừng reload**: mở `?mock=1`, chạy `await lhRevalidateAccess('x', true)` (ghi dấu xác nhận) + `await loadCurrentSubjectOnly(true)` (ghi cache), rồi chặn `/api/*` bằng tay + `Object.defineProperty(navigator,'onLine',{get:()=>false})` + `dispatchEvent(new Event('offline'))` |
| `?mock=1&fail=401nocode` | 401 body HTML (proxy/CDN trả lời thay app): cũng KHÔNG được đăng xuất |
| `?mock=1&fail=401` | Ca NGƯỢC: 401 có `code` → vẫn phải ra "Phiên đăng nhập đã hết hạn" |
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

- **`/api/questions` KHÔNG có `subject_code` phải trả câu của MỌI môn** (sửa 20260806, xem
  `EXPORT_PICK_SUBJECTS_20260806`). Mock cũ rơi về `opts.subject` cho ca đó, tức trả môn đang học —
  đúng cho web học (mọi lời gọi của nó đều kèm mã môn) nhưng sai với server thật
  (`api/controllers/questions.js` chỉ thêm `and subject_code = ?` khi có tham số) và làm "Xuất dữ
  liệu" của admin tick 6 môn chỉ ra 4 câu của MOCK1. `count_only=1` giữ đường cũ — nó là endpoint đếm.
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

## Thêm môn: HAI hướng đi + cổng chấm độ sai lệch (`IMPORT_QUALITY_GATE_20260805`)

Bước 2 của tab "Thêm môn mới" không còn là "Lấy Prompt" mà là **màn chọn hướng**. Ranh giới giữa
hai hướng là **tài liệu có đọc được chữ hay không**, không phải đuôi file:

| Hướng | Nhận gì | Đi tiếp thế nào |
|---|---|---|
| **Tài liệu đọc được chữ** | `.pdf` chuẩn · `.docx` · `.json` · `.zip` · `.md` · `.txt` | PDF/Word thì **tự trích xuất + tách câu hỏi ngay trong browser, KHÔNG qua AI** (`docExtract.js`); rồi tất cả đi qua cùng một cổng chấm điểm |
| **Bản chụp, hoặc có hình ảnh** | PDF scan, tài liệu cần giữ hình | mở khối prompt (Gemini/ChatGPT/Claude) → nhờ AI chuyển → quay lại bước 3 |

### Đọc trực tiếp PDF / Word (`DOC_EXTRACT_DIRECT_20260805`, `src/student/docExtract.js`)

Hai tầng, cố ý tách: `parseQuestionsFromPages()` + `cleanLines()` là **hàm thuần** nhận mảng text
**theo TỪNG TRANG** (test bằng node như `importQuality.js`); `extractFromFile()` mới chạm I/O.
Nhận theo trang vì header/footer lặp y nguyên mỗi trang — có ranh giới trang thì bắt dòng lặp là
việc đếm, nối hết thành một chuỗi rồi là mất dấu.

- **pdf.js nạp LAZY từ CDN**, không `npm i pdfjs-dist`: `scripts/build.js` bundle thành một file
  app.js (không code-splitting) nên import tĩnh sẽ nhồi ~1MB vào bundle của MỌI người. Nạp động chỉ
  tốn khi thật sự chọn PDF — đo được app.js chỉ tăng 815KB → 834KB. `.docx` thì giải nén bằng
  **JSZip đã có sẵn** rồi đọc `word/document.xml`, không thêm thư viện nào.
- **PDF không có chữ (< `SCAN_CHARS_PER_PAGE` = 80 ký tự/trang) thì KHÔNG cố parse** — hiện bảng
  "File này là bản chụp" + nút `__goPromptRoute()`. Đo trên 3 file scan thật: đúng 0 ký tự/trang.
- Kết quả đo trên 7 file trong `input/` (qua pdf.js thật, trong browser thật):

  | Tài liệu | Đọc trực tiếp | File JSON do AI chuyển (để so) |
  |---|---|---|
  | `IPR102 … Quizlet.pdf` | 549 câu · 2,8% · **tier low, lưu luôn** | 548 câu · 2,5% · 3 câu chặn cứng |
  | `AET102.pdf` | 152 câu · 10,9% · 0 chặn cứng | 152 câu · 5,6% · **5 câu chặn cứng** |
  | `AET102c.pdf` | 212 câu · 7,4% · 0 chặn cứng | (chưa có) |
  | `MLN122 NhungHoang.docx` | 533 câu · 7,6% · 20 câu thiếu đáp án | 533 câu · 10,5% · 35 câu thiếu đáp án |
  | 3 file PDF scan | nhận ra bản chụp → mời sang hướng AI | — |

**Bốn cái bẫy đã sập thật khi viết parser này, đừng lặp lại:**

- **Bộ lọc header/footer ăn luôn dòng ĐÁP ÁN.** Đáp án của layout Quizlet là một chữ cái trơ
  ("C") nên nó lặp ở gần như mọi trang → bị tính là footer. Hậu quả đo được: `AET102` mất đáp án
  **150/152 câu**, `IPR102` tụt **548 → 68 câu** (mất dòng đáp án là mất luôn dấu "hết câu", đề câu
  sau bị nối vào lựa chọn cuối của câu trước). Nay dòng trông như đáp án / lựa chọn / số câu thì
  **không bao giờ** bị coi là footer.
- **pdf.js và PyMuPDF cho ra text KHÁC NHAU trên cùng file.** PyMuPDF tách `"12."` thành dòng riêng,
  pdf.js gộp nó với đề bài (`"12. Mr Blobby…"`, cùng toạ độ Y); pdf.js còn gộp cả cụm footer thành
  MỘT dòng kèm số trang thay đổi. Parser phải chịu cả hai: `matchNumInline` nhận cả ở trạng thái
  `'q'` (khi khối còn trắng), và `footerKey()` **che mọi chữ số** khi đếm dòng lặp — không che thì
  103 biến thể footer lọt vào nội dung và `analyzeImport` chấm **103 câu trùng nhau**.
  Vì vậy: **fixture test bằng node (PyMuPDF) KHÔNG thay được một lượt đo trong browser thật.**
- **Số câu phải "hợp lý" mới nhận** (`plausibleNum`, ≤ số khối đã ra + 5). Một câu bắt đầu bằng
  `"1915. …"` (một cái năm) bị đọc thành số câu 1915 là đủ làm `checkNumbering` báo lệch cả file.
- **Tài liệu KHÔNG có dòng đáp án thì không biết câu mới bắt đầu ở đâu** (DOCX có 20 câu như vậy).
  Phải nhìn trước tới **dòng có cấu trúc kế tiếp** (`nextStructural`): nhãn LẶP (`A.` khi đã có A)
  = câu mới, nhãn TIẾP (`c.` khi đang có a, b) = dòng nối tiếp lựa chọn đang dở. Không có phép thử
  này thì đề câu sau bị dán vào lựa chọn D của câu trước: đo được **24 câu mất trắng**.

**Nút "⬇ Xuất JSON" trong bảng chấm điểm** (`IMPORT_SCHEMA_EXPORT_20260806`,
`window.__downloadImportJson`). Tải danh sách câu ĐANG có ra file `<mã môn>_questions.json` —
đường duy nhất xem được kết quả parser PDF/Word ở dạng dữ liệu (trước đây chỉ có bản xem trước
trong modal: 500 câu thì không soi được, cũng không đưa file cho người khác sửa được).

- Có ở **mọi mức**, kể cả `high`: file bị chặn mới là file cần mang ra ngoài để xem đọc sai ở đâu.
- Đọc `getParsed()` = `window.__previewImportData` (một chỗ chứa duy nhất,
  `ADD_SUBJECT_ONE_STATE_20260805`), nên file tải về luôn khớp thứ vừa được chấm và thứ nút
  "Lưu Môn Học" sẽ gửi — kể cả sau khi sửa tay trong bản xem trước.
- Bộ chuyển đổi là **`src/core/importSchema.js`** (thuần, `core/` vì trang admin dùng chung —
  xem `EXPORT_PICK_SUBJECTS_20260806`). Nó trả về đúng 7 khoá của schema và bỏ mọi trường phụ
  (`answer_text`, `error_risk_reason`, `answer_unknown`). Hai điều cố ý:
  · `answer` **về lại ARRAY** (client giữ chuỗi "AC", DB cũng vậy).
  · `answer_unknown` được **GỘP vào `answer`** thay vì bỏ đi. Nhãn đó có trong tài liệu gốc mà
    không có trong `options`; bỏ nó thì nhập lại chỉ bị 0,5 điểm "quên đáp án" thay vì chặn cứng
    "đáp án trỏ sai", tức file xuất ra không dùng để kiểm tra được nữa.
  · `num` rỗng thì **bỏ hẳn khoá** (`IMPORT_NUM_BLANK_OK_20260805`), không ghi `null`.
- Đo trên `input/AET102.pdf` (pdf.js thật, `?mock=1`): đọc 152 câu / 10,9% → xuất
  `TEST101_questions.json` 70 KB, đúng 7 khoá, 145 câu có `num` · **nhập lại chính file đó ra
  y nguyên 152 câu / 10,9% / tier medium / 7 nhóm lỗi giống hệt** — vòng xuất → nhập không mất gì.

Hướng đã chọn nhớ ở `localStorage['learninghub_add_subject_path_v1']`.

**Nút "⬅ Quay lại" của bước 2 lùi ĐÚNG MỘT BẬC** (`IMPORT_PATH_BACK_TO_FORK_20260806`,
`window.__importStepBack`). Bước 2 có hai màn xếp trong nhau: màn chọn hướng, rồi khối prompt
của hướng AI. Bản cũ nút này luôn `__switchStep(1)`, nên đang đứng ở "Lấy prompt rồi đưa tài
liệu cho AI" mà bấm Quay lại là **nhảy vọt về bước 1 "Thông tin"**, bỏ qua màn chọn hướng — đường
đổi hướng duy nhất là một nút "⇄ Chọn lại hướng khác" riêng nằm dưới. Nay `__importStepBack`
xem `learninghub_add_subject_path_v1`: đang ở hướng prompt thì `__resetImportPath()` (về màn chọn
hướng), ngược lại mới `__switchStep(1)` — **nút riêng kia đã xoá hẳn**, cùng 4 rule
`.importPathSwitch` trong `app.css` và nhánh `back` của `syncImportPath`.
Sửa ở **CẢ HAI** bản dựng `#addStep2` (`getAddSubjectHTML` và `enhancePromptStep` — bản sau mới
là bản đang chạy, xem mục bẫy ngay dưới).

**Cổng chấm điểm** (`src/student/importQuality.js`, thuần, test bằng node):
`analyzeImport(questions)` cộng điểm trừ theo từng câu rồi chia cho số câu ra `deviationPct`.

- **Chặn cứng (fatal)**: thiếu `question`, dưới 2 lựa chọn, lựa chọn rỗng, đáp án trỏ nhãn
  không tồn tại. Có 1 câu fatal là `tier: 'high'` bất kể phần trăm.
- **1 điểm**: `error_risk:'high'` · `has_image:true` mà `images` rỗng · ảnh trỏ tới đường dẫn
  không tồn tại · nhãn lựa chọn bị nhảy (A, B, D).
- **0,5 điểm**: không có đáp án · số câu sai quy tắc · nhãn "Câu 12." lọt vào nội dung · trùng đề.
- **0,25 điểm**: `error_risk:'medium'` · nhiều đáp án · lựa chọn ngoài A–D · nghi rút gọn "...".

Ba mức và hành vi nút **Lưu Môn Học** (`gateSaveButton`):
`≤5%` mở luôn · `≤15%` phải tick `#importQualityAccept` · trên đó **chặn** + nút
"➔ Chuyển sang hướng Prompt". Ngưỡng ở `QUALITY_THRESHOLDS`; 5% ≈ "1 câu hỏng / 20 câu".
Mức nào cũng có nút **"👁 Xem lại N câu"** trong bảng chấm điểm (`IMPORT_PREVIEW_REOPEN_20260805`):
trước đây chỉ tier `high` có nút mở modal, nên đóng bản xem trước của file tier low/medium là mất
luôn đường vào các nút "Sửa" nội tuyến — "Kiểm tra lại" chỉ chấm lại, không mở modal.

**Chốt cuối nằm ở bản SỐNG của `__submitSubjectRequest`** (`IMPORT_QUALITY_GATE_LIVE_SUBMIT_20260805`,
`FIX_ADD_SUBJECT_FAST_PARALLEL_UPLOAD_20260701`, cuối `subjectImport.js`). **Nay chỉ CÒN MỘT bản**:
bản trùng tên trong block `ADD_SUBJECT_FEATURE` (155 dòng, từng đánh dấu `DEAD_OVERRIDE_20260805`) đã
xoá hẳn — `ADD_SUBJECT_ONE_SAVE_PATH_20260805`. Nó là code chết nhưng giống bản sống tới mức dễ sửa
nhầm: cũng validate mã/tên, cũng chốt cổng, cũng gọi `add_subject`/`add_subject_request`. Xoá kèm
`client()` + HUB_URL/HUB_KEY (một Supabase client riêng, chỉ nó dùng) và `esc2()`.
Chốt ở bản sống **chấm lại bằng `analyzeImport(window.__previewImportData)` ngay tại chỗ**, không tin
`window.__importQualityReport` đang có — `saveEdit()` của bản xem trước sửa câu TẠI CHỖ mà không tự
chấm lại, tin điểm cũ là chặn oan người vừa sửa xong. Dùng `analyzeImport` (hàm thuần) thay vì
`__reanalyzeImport()` để không xoá dấu tick xác nhận của người dùng.

**Cổng tier medium cũng chốt Ở ĐÂY** (`IMPORT_QUALITY_MEDIUM_ONE_GATE_20260805`), không chỉ dựa vào
nút bị `disabled`: **modal xem trước có nút "Lưu Môn Học" RIÊNG** (`[data-v7-submit]`, không id,
không nằm dưới `gateSaveButton`) và nó bung ra che luôn bảng chấm điểm. Đo được: file 20 câu sai lệch
15% → nút bước 3 xám kèm tooltip "hãy tick xác nhận", bấm nút trong modal là **lưu thẳng, không hỏi
gì**. Nay chưa tick `#importQualityAccept` thì `confirm()` nêu rõ "% và N/total câu nghi lỗi"; đã
tick thì không hỏi lại (đường bước 3 giữ nguyên hành vi cũ).

**`cleanQuestions()` LOẠI câu không có đáp án — nay phải `confirm()` trước khi lưu.** Trước đây nó
bỏ im lặng: bảng kiểm tra ghi "533 câu đọc được", thông báo cuối ghi "498 câu hỏi", 35 câu mất không
ai biết.

### Trạng thái của luồng "Thêm môn": một mảng, một hàm dọn (`ADD_SUBJECT_ONE_STATE_20260805`)

- **Danh sách câu đang import chỉ có MỘT chỗ chứa: `window.__previewImportData`.** Biến
  `parsedQuestions` riêng của block `ADD_SUBJECT_FEATURE` đã bỏ (thay bằng `getParsed()`/`setParsed()`
  đọc thẳng window). Hai cái thường trỏ cùng array nên trông vô hại, nhưng
  `__switchSubjectGateTab('add')` chỉ xoá `parsedQuestions` trong khi bản xem trước và bản LƯU
  (`readQuestions()`) đọc `window.__previewImportData` — cổng chấm một mảng, nút Lưu gửi mảng khác.
  Cũng bỏ luôn nhánh dự phòng `window.__LH_LAST_PREVIEW_IMPORT_DATA`: **không nơi nào GÁN** tên đó.
- **Lưu xong phải gọi `window.__resetAddSubjectForm()`** (`ADD_SUBJECT_RESET_AFTER_SAVE_20260805`,
  `clearState()` của block upload gọi nó). Trước đây việc dọn nằm trong `clearAddSubjectLocalStorage()`
  mà hàm đó **chỉ được gọi từ bản `__submitSubjectRequest` ĐÃ CHẾT**, nên bản sống chỉ xoá 4 khoá
  file. Đo được: lưu môn xong mở lại tab "Thêm môn mới" là vào thẳng **bước 3** với mã/tên/mô tả của
  môn vừa lưu còn nguyên trong ô — thả file mới vào là lưu lần hai vào cùng mã. Reset dọn cả 9 khoá
  `learninghub_add_subject_*` (kể cả `path_v1`, `step_v1`), 3 ô nhập, `__selectedImportFile` (handle
  .zip của lần trước), state ảnh của module zip, bảng chấm điểm, modal — rồi về bước 1.
- **"Xóa file" phải xoá luôn danh sách câu.** `__clearUserImportFile` trước chỉ dọn phần hiển thị;
  mảng câu của file vừa xoá vẫn nằm trong `window.__previewImportData` để `readQuestions()` đọc được.
- **Bản xem trước KHÔNG được là của file khác.** `handleFileImport` gọi `hardClosePreviewModal()`
  (xoá khỏi DOM, không phải `.hidden`) ngay đầu hàm — `__resetImportQualityPanel` cũng gọi. Đo được
  trước khi sửa: đang mở bản xem trước file 4 câu, thả file 2 câu vào → modal vẫn in "4 câu" của file
  cũ trong khi nút "Lưu Môn Học" của chính modal đó gửi dữ liệu file mới (`IMPORT_PREVIEW_STALE_MODAL_20260805`).
- **Dấu × của modal phải đi qua `__closeImportPreviewModal()`** để CHẤM LẠI
  (`IMPORT_PREVIEW_CLOSE_RESCORE_20260805`). Bản cũ chỉ `.hidden`: sửa tay hết câu lỗi rồi đóng bằng
  × là bảng chấm điểm + nút Lưu vẫn giữ điểm TRƯỚC khi sửa (đo: 1 câu fatal → sửa xong nút vẫn xám).
- **Khôi phục trạng thái thì chấm IM LẶNG**: `__previewUserImport({ silent: true })`
  (`IMPORT_RESTORE_NO_POPUP_20260805`) — dựng lại bảng chấm điểm + trạng thái nút Lưu, không bung
  modal. Trước đây mỗi lượt đổi tab `list` → `add` là bản xem trước tự nhảy ra giữa màn hình.
  File `.pdf/.docx/.zip` không lưu nội dung vào localStorage nên khôi phục theo nhánh
  `getParsed().length` (mảng còn trong bộ nhớ) thay vì đọc lại file.
- **Ô điểm to không in "0% sai lệch" khi bị chặn cứng** (`IMPORT_QUALITY_SCORE_BOX_20260805`): câu
  fatal không cộng điểm sai lệch, nên file 2 câu thiếu đề bài ra `0%` trên nền đỏ. Nay in "N câu bị
  chặn", phần trăm chuyển xuống hàng `iqMeta`.

Sáu điều dễ làm sai khi sửa vùng này:

- **`num` để TRỐNG không phải lỗi** (`IMPORT_NUM_BLANK_OK_20260805`). `checkNumbering` từng tính
  "số câu không đọc được" cho mọi câu thiếu `num`, tức 0,5 điểm × N câu = **sàn sai lệch 50%** →
  tier `high` → chặn **100% file thật** (file xuất từ Quizlet / DOCX không hề có trường `num`). Đo
  trên 3 file trong `input/converted/`: 55,6% / 54,5% / 60,5% → sau khi sửa còn 5,6% / 2,5% / 10,5%.
  Cả hai chốt lưu đều tự đánh số được (`cleanQuestions` lấy `i + 1`, `resolveImportNums()` lấy số
  nguyên trống nhỏ nhất) nên trừ điểm ở đây là báo động giả thuần. Chỉ `num` RÁC mới là lỗi. Câu
  trống vẫn chiếm một slot nên `expected` phải nhích lên, không thì `1, (trống), 3` bị báo oan.
- **"Nghi rút gọn" phải bỏ qua câu ĐIỀN KHUYẾT** (`IMPORT_BLANK_NOT_TRUNCATED_20260805`). Luật cũ
  chỉ xét "kết thúc bằng `...`" nên `"must be ........"` bị chấm là bị AI cắt: 46/548 câu của
  `IPR102.json` là báo động giả. Nay `looksTruncated()` bỏ qua khi có dấu chỗ trống
  (`BLANK_MARK` = `....`+ / `___` / `……`) → còn 1 câu.

- **Bước 2 KHÔNG dựng bởi `getAddSubjectHTML()`.** `PROMPT_STEP_UX_UI_POLISH_20260625` ghi đè
  toàn bộ `innerHTML` của `#addStep2`, nên hai thẻ chọn hướng phải nằm trong
  `enhancePromptStep()`. Bản trong `getAddSubjectHTML()` chỉ là dự phòng cho quãng trước khi
  polish chạy — sửa một chỗ mà quên chỗ kia là giao diện không đổi gì.
  `enhancePromptStep` phải gọi lại `window.__syncImportPath(...)` sau khi set innerHTML vì
  `__switchStep` đã sync trên DOM cũ trước đó.
- **Nút "Kiểm tra lại" gọi `__checkImportFile`, KHÔNG gọi `__previewUserImport`.** Hàm sau đọc
  lại từ file thô nên mọi sửa tay trong bản xem trước bị mất trắng.
- **Đừng hạ `has_image` về `false` khi map ảnh thất bại.** Bản cũ ghi
  `has_image: mappedImages.length > 0` nên câu "cần ảnh mà zip thiếu ảnh" tự đổi thành "câu
  không cần ảnh" — mất luôn dấu hiệu thiếu dữ liệu.
- **`answer_unknown` là trường tạm, cố ý.** `normalizeAnswer` loại nhãn không có trong
  `options`, nên nếu chỉ chấm trên dữ liệu đã chuẩn hoá thì `answer:["E"]` với options A–D
  trông y như "quên đáp án" (0,5 điểm) thay vì lỗi chặn cứng. Trường này không vào DB — câu
  `insert` của api liệt kê cột cụ thể.

### File trên 80 câu đi đường KHÁC, và đường đó KHÔNG dùng `resolveImportNums()`

`LARGE_LIMIT = 80` trong `FIX_ADD_SUBJECT_FAST_PARALLEL_UPLOAD_20260701`: quá 80 câu thì
`createLarge()` gọi `add_subject` với `questions: []` rồi bắn **một `add_question` cho TỪNG câu**
(đo thật: file 548 câu → **545 request** `/api/admin-action`). Hệ quả:

- `num` do CLIENT quyết (`cleanQuestions`: `Number(q.num) || i + 1`, rồi `uploadOne` lặp lại),
  nên `resolveImportNums()` của server không có việc gì làm — quy tắc "biến thể 1.1" và "số nguyên
  trống nhỏ nhất" ở mục dưới **chỉ áp dụng cho file ≤80 câu** (`createSmall`).
- Mọi file thật trong `input/converted/` đều 152–548 câu, tức **luôn** đi đường này.

Chưa sửa (đổi sang gửi theo lô sẽ phải đụng cả `add_subject` payload lẫn `resolveImportNums`).
Nhớ khi đổi quy tắc đánh số: sửa 3 chỗ ở mục dưới là CHƯA đủ, còn `cleanQuestions` + `uploadOne`.

### Đánh số câu: `num` của file được TÔN TRỌNG

`api/lib/questionNums.js: resolveImportNums()` (thuần, test bằng node) quyết định
`questions.num` cho **cả hai** chốt nhập môn: `add_subject` và `approve_subject_request`.
Trước đây cả hai đều `let currentNum = 1; currentNum++` tức **ném bỏ `num` của file**, nên biến
thể "Kiểu hỏi khác" (`"1.1"` đứng ngay sau câu gốc 1 theo prompt) thành câu 2 và câu gốc 2 bị
dồn thành 3 — số câu trong app không còn khớp tài liệu gốc.

- số nguyên → giữ nguyên · `"1.1"` → lưu `1.1` · thiếu/rác/trùng → số nguyên trống nhỏ nhất.
- **Đo lại 20260806: đường lưu GIỮ được `12.1`, nhưng DB thật chưa có một câu nào như vậy.**
  `select typeof(num), count(*) group by 1` trên Turso ra **4.832 dòng `integer`, 0 dòng `real`**,
  và mọi môn đều chạy num liền mạch `1…N`. Không phải vì code chặn: đo trên libsql cùng schema
  thì `1.1 / 1.2 / 12.1` vào cột `num integer` được giữ nguyên là REAL, `order by num asc` ra
  đúng `1, 1.1, 1.2, 2`, và `unique(subject_code, num)` phân biệt `1` với `1.1`. Cả hai chốt lưu
  cũng giữ: `resolveImportNums` trả `[1, 1.1, 1.2, 2, 3, 12.1]`, còn `cleanQuestions` của đường
  >80 câu là `Number('12.1')` = `12.1` và `add_question` chỉ cấp lại số khi `!finalNum` hoặc
  trùng. Lý do thật là **file import chưa từng mang trường `num`** (Quizlet/DOCX không có), nên
  cả `1.1` lẫn `12.1` chỉ tồn tại khi AI được nhắc đánh biến thể theo `importPrompt.js`.
  Hai giới hạn còn thật, nhớ khi dùng: `"12.10"` quy về `12.1` nên trùng câu `"12.1"` (bị cấp
  số nguyên trống), và **ô "Giới hạn khoảng câu"** của tab Kiểm tra là `<input type="number">`
  bước 1 nên không nhập được `12.1` — `applyRange` so bằng `+q.num` nên `12.1` chỉ nằm trong
  khoảng khi khoảng đó phủ `12→13`, đặt "từ 12 đến 12" là mất câu `12.1`.
- Cột là `num integer` nhưng **SQLite dùng type affinity**: `1.1` không đổi sang integer mà
  không mất dữ liệu nên được giữ REAL. `order by num asc` ra đúng `1, 1.1, 1.2, 2` và
  `unique(subject_code, num)` vẫn phân biệt `1` với `1.1`. Client đọc num qua `Number(c.num)`
  ở mọi chỗ nên không cần sửa gì thêm.
- `checkNumbering` lấy mốc kế tiếp theo **số câu gốc đã đi qua**, không theo num vừa đọc: một
  câu bị đánh 99 mà lấy mốc = 100 thì mọi câu sau đều bị báo sai theo.
- **Ba chỗ phải khớp nhau** khi đổi quy tắc num: `importPrompt.js` (dạy AI),
  `importQuality.js: parseImportNum`/`checkNumbering` (chấm), `api/lib/questionNums.js` (lưu).

## Quyết định sản phẩm (đừng "sửa lại" thành bug)

- **Trang admin KHÔNG còn tab "Câu hỏi"** (xoá 20260729, chốt với chủ dự án). Nút nav
  `data-page="questions"` vốn đã bị `n.remove()` từ trước nên cả trang không có đường vào;
  nay xoá hẳn ~870 dòng: danh sách/phân trang/lọc môn, **thêm câu, sửa trực tiếp + upload
  Cloudinary, ẩn/hiện, xoá câu**. Sửa câu hỏi giờ chỉ đi qua duyệt "Yêu cầu sửa" của học
  sinh. Cũng xoá khối **"Thêm môn học bằng AI"** (`openAddSubjectAI` không có nút gọi).
  **Nguyên văn code đã xoá: `docs/REMOVED_20260729.md`** — đừng thêm lại nếu không có yêu
  cầu rõ ràng.
- **App CHỈ tự đăng xuất khi tài khoản bị KHOÁ** (`LH_OFFLINE_GRACE_20260806`). `signOut()` tự
  động chỉ còn ở nhánh `code === 'BLOCKED'` của `handleAccessRevoked` (cả web học và trang admin).
  Phiên hết hạn (`UNAUTHORIZED`) chỉ hiện gate "Phiên đăng nhập đã hết hạn" — người dùng bấm
  "Kiểm tra lại" (nút này làm mới token trước) hoặc tự bấm "Đăng xuất". **Đừng thêm lại `signOut()`
  cho `UNAUTHORIZED`**: `refresh_token` sống hàng chục ngày, xoá phiên là bắt người ta chọn lại
  mail Google vì một nhịp mạng chớp.
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
- **"Xuất dữ liệu" chọn NHIỀU môn bằng danh sách tick, và JSON ra dạng IMPORT**
  (`EXPORT_PICK_SUBJECTS_20260806`, `exportAll` + `downloadExportFile` của `adminCore.js`,
  CSS `admin.css` cuối file). Bản cũ là một `<select>` một-lựa-chọn dựng từ `cache.questions`:
  muốn 3 môn phải mở modal 3 lần, môn **chưa có câu nào không hề hiện** (mã lấy từ bảng câu hỏi
  chứ không từ `cache.subjects`), danh sách chỉ có mã trơ không tên không số câu, và các phần
  cùng mã gốc nằm rời rạc giữa 19 dòng.
  - Nay: danh sách tick gom theo **thư mục (mã gốc)** như trang "Quản lý môn học" — hàng thư mục
    tick cả cụm, `indeterminate` khi mới tick vài phần; có ô tìm kiếm (đang gõ thì **trải phẳng**,
    ẩn hàng thư mục, giống web học), nút "Tất cả" / "Bỏ chọn", và dòng tổng "Đã chọn N môn · M câu"
    (đếm từ `cache.questions`, không gọi thêm request). Chưa tick gì thì hai nút xuất **disabled**.
  - **`downloadExportFile(type, codes)` nay nhận MẢNG mã** (vẫn chịu chuỗi / `'all'` như cũ).
    JSON: **mỗi môn một file**, vì tab "Thêm môn mới" nhập một lần là một mã môn — trộn nhiều môn
    vào một file là nhập lại không được. Nhiều file thì chờ 350ms giữa các lượt tải, nếu không
    trình duyệt bỏ rơi lượt sau. CSV thì **gộp** mọi môn đã chọn vào một file (có cột
    `subject_code`), tên `questions_<N>_mon.csv`.
  - JSON đi qua `src/core/importSchema.js` (dùng chung với nút "⬇ Xuất JSON" của web học), tức
    ra đúng 7 khoá schema thay vì dòng DB thô. **Bản thô vẫn còn ở "Sao lưu đầy đủ"** — đừng đổi
    `full_backup` sang schema import, nó là bản sao lưu.
  - `fetchQuestionsForCodes` gọi `/api/questions` **theo từng mã**, chỉ khi tick hết danh sách mới
    gọi một lượt `all` — `all` là đọc cả 4.832 câu / ~1,5 MB (xem "Mức tiêu thụ Turso").
  - Đo bằng `admin.html?mock=1&role=admin`: thư mục MOCK1 in "5 phần · 78 câu", tick 1 phần →
    thư mục `indeterminate`, "Tất cả" → "6 môn · 80 câu", tìm "chương 2" → còn 1 hàng và mất hàng
    thư mục; tick MOCK1_C2 + MOCK2 rồi bấm JSON ra **2 file** `MOCK1_C2_questions.json` +
    `MOCK2_questions.json` đúng 7 khoá, CSV ra 1 file 15 dòng (12+2 câu + header). `lhErrors()` rỗng.
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
  - **Thanh thư mục là một HÀNG RIÊNG ngay dưới hàng tab, thụt vào một bậc**
    (`SUBJECT_FOLDER_CRUMB_OWN_ROW_20260806`, thay chỗ đặt của `SUBJECT_FOLDER_BAR_IN_TABS_20260729`).
    Bản cũ nhét `#subjectFolderCrumb` vào `.subjectGateTabsLeft` (cạnh tab "Danh sách môn học") và
    `#subjectFolderCrumbMeta` ra bên phải ô tìm kiếm để tiết kiệm ~65px — nhưng như vậy
    "← Tất cả môn" trông **ngang cấp với hai tab**, người học không thấy mình đang đứng sâu một
    bậc bên trong thư mục. Nay `folderCrumbRow()` dựng `#subjectFolderCrumbRow` bằng
    `bar.insertAdjacentElement('afterend', …)` và **cả hai ô con nằm trong hàng đó**; nội dung là
    một dải phân cấp `└ ← Tất cả môn ▸ MÃ_GỐC` + "N phần · M câu" đẩy sang phải. Đo được: hàng cao
    **34px**, hàng tab về đúng 2 tab.
    - **Ẩn/hiện ở HÀNG, không ở từng ô con** — `syncFolderCrumb` toggle `.hidden` trên
      `#subjectFolderCrumbRow`; ẩn ô con mà để hàng lại thì còn một dải trống.
    - `folderCrumbHost`/`folderMetaHost` **kiểm `host.parentElement !== row` rồi mới append**, để
      DOM cũ (nếu còn nằm trong hàng tab) được kéo xuống thay vì tạo trùng id.
    - `__switchSubjectGateTab` (`subjectImport.js` ~734) nay ẩn **`$('subjectFolderCrumbRow')`**,
      không còn ẩn hai ô con — không thêm thì "← Tất cả môn ▸ MÃ" còn nổi ở tab "Thêm môn mới".
    - `order:-1` ở `max-width:760px` **đã bỏ**: hàng riêng thì nút lùi ra không còn bị đẩy ra
      ngoài vùng cuộn ngang của hàng tab (đo ở 375px: nút nằm ở 49–152px, trong màn hình).
      `#subjectFolderCrumbMeta` cũng thôi `display:none` trên mobile vì hàng này không chật.
    - `folderBarHTML` (`.subjectFolderBar` trong lưới) vẫn là **bản dự phòng** cho lúc
      `ensureSubjectGateTabs()` chưa dựng xong thanh tab; đừng xoá, cũng đừng quay lại vẽ vào lưới.
  - **Mục con của một thư mục gọi là "PHẦN", không phải "môn"**
    (`SUBJECT_FOLDER_PART_WORDING_20260806`). Cùng mã gốc = MỘT môn chia làm nhiều phần, gọi mỗi
    mục là "môn" thì người học tưởng MLN122 và MLN122_2 là hai môn khác nhau. Sáu chỗ đã đổi:
    `subjectGate.js` — tooltip thẻ thư mục, chip `THƯ MỤC · N phần`, `folderBarHTML`,
    `syncFolderCrumb`; `adminCore.js` — `subjectFolderChip`, `subjectAdminBackMeta`, và `unit` của
    `overviewHTML` (**chỉ khi `mode === 'folder'`**; ngoài cùng vẫn đếm "N môn · N môn lẻ");
    `exam.js` — nhãn "Gộp thêm phần (chọn thêm phần cùng mã môn để gộp đề)" + ghi chú
    "Bỏ chọn phần gộp mới dùng được khoảng câu". **"Môn này có câu X–Y" giữ nguyên chữ "môn"**:
    môn đang học có thể là môn lẻ, không nằm trong thư mục nào.
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

- **Dấu `;` trong COMMENT của file migration cắt mất câu SQL phía sau — mà migration vẫn báo
  thành công** (đã sập thật với `004_bookmarks.sql`, 20260806). `scripts/migrate.js` tách câu
  bằng `split(';')`, nên một comment tiếng Việt như `-- index theo user_id; PRIMARY KEY đã lo…`
  làm khối bị cắt đôi: `CREATE TABLE` chạy, `CREATE INDEX` ngay dưới **không chạy**, log chỉ in
  `Warning on statement: SQL_PARSE_ERROR … near PRIMARY` rồi vẫn `✅ applied successfully` và ghi
  dấu vào `schema_migrations`. Lỗi chỉ lộ khi đi soi `sqlite_master`.
  **Đã sửa gốc**: `migrate.js` nay bỏ mọi dòng comment `--` TRƯỚC khi tách. Chạy lại một
  migration đã đánh dấu thì `delete from schema_migrations where version = ?` rồi `npm run migrate`.
  Lệnh `npm run migrate` **không tự nạp `.env`** — dùng `node --env-file=.env scripts/migrate.js`.
  Sau mỗi migration, kiểm bằng
  `select name from sqlite_master where name like '%<tên bảng>%'` chứ đừng tin dòng ✅.

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

- [x] **"Tự đăng xuất người dùng": ĐÃ SỬA 3 chốt (20260805).** Ba đường độc lập đều dẫn tới
      `signOut()` khi phiên vẫn còn tốt — chi tiết + ranh giới ở mục *Kiến trúc dữ liệu*
      (`AUTH_VERIFY_INCONCLUSIVE_20260805`, `LH_ADMIN_SESSION_REFRESH_20260805`):
      · **SERVER, nặng nhất:** `verifyUser` gộp "không hỏi được Supabase" (mất mạng / timeout /
        5xx / **429 rate limit**) vào cùng một `null` với "token sai" → 401 → client signOut. Nay
        ca không kết luận được trả **503 AUTH_CHECK_FAILED**.
      · **TRANG ADMIN:** không hề có lớp làm mới token, và `lhToken()` không xem `expires_at` →
        để dashboard mở quá 1 giờ là gửi token hết hạn → 401 → signOut.
      · **CLIENT:** 401 không có `code` (proxy/CDN trả lời thay app) bị đoán thành UNAUTHORIZED.
      Đo được: 10 ca của `verifyUserDetailed` đúng hết (kể cả timeout ra đúng ~8s); router trả
      **503 AUTH_CHECK_FAILED** khi Supabase không tới được và **401 UNAUTHORIZED** khi token thật
      sự sai; `?mock=1&fail=503` + `fail=401nocode` không thu hồi quyền, `fail=401` vẫn ra
      "Phiên đăng nhập đã hết hạn"; `lhToken()` của admin bỏ token hết hạn / sắp hết hạn <10s và
      vẫn nhận dạng `{currentSession:{…}}` của bản supabase cũ; admin `?mock=1&role=admin` mở
      bình thường (`/api/admin-dashboard` 200, 6 môn), `lhErrors()` rỗng ở cả hai trang.
- [x] **"Rớt mạng là mất app" + 3 đường tự đăng xuất còn lại: ĐÃ SỬA (20260806)** —
      `LH_OFFLINE_GRACE_20260806`, chi tiết + bảng hành vi ở mục *Kiến trúc dữ liệu*. Mục ngay trên
      từng ghi "còn cố ý fail-closed: 500/503 lúc xác minh lại vẫn đưa người đang học ra màn hình
      Không thể kiểm tra quyền" — nay đúng ca đó là **chế độ tạm ngoại tuyến** (giữ giao diện, dải
      nhỏ ở đáy, tự thử lại với backoff 5s→10s→20s…→60s), miễn là máy đã từng được server xác nhận
      có quyền (`learninghub_access_grant_v1`, hạn 7 ngày). Cùng lúc: **chỉ `BLOCKED` còn signOut**,
      401 sau khi không gọi được Supabase không còn bị coi là hết phiên, và dữ liệu offline đã có
      đường đi (cache câu hỏi quá hạn + cache danh sách môn).
      Đo được bằng `?mock=1` (pane trình duyệt ẩn, đọc DOM thay vì screenshot): rớt mạng giữa phiên
      → `__LH_GATE_LOCKED` false, `body.hod-locked` không bật, `.counter` giữ "Câu 1 / 4",
      `loadCurrentSubjectOnly(true)` với cache **quá hạn 13 giờ** vẫn ra 4 câu + 4 mục thư viện,
      danh sách môn ra đúng 6 mã đã lưu (không phải HOD102/MLN111) kèm chữ "đang dùng danh sách môn
      đã lưu trên máy"; `online` → dải biến mất, cache được ghi lại mới. Không hồi quy:
      `fail=401` vẫn ra "Phiên đăng nhập đã hết hạn", `fail=401nocode` không chặn, `blocked=1` /
      `pending=1` vẫn chặn kín **và xoá dấu xác nhận** — cắm dấu xác nhận lại bằng tay rồi rớt mạng
      cũng KHÔNG lọt (`revokedConclusively`). `lhErrors()` rỗng ở cả web học và trang admin.

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
