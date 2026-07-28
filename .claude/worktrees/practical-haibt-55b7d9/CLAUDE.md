# CLAUDE.md — Learning Hub (lxpacademy)

Web ôn thi trắc nghiệm: flashcard, kiểm tra, thư viện câu hỏi + trang admin.
Frontend thuần JS (không framework), API Vercel Edge, DB Turso, auth Supabase, ảnh Cloudinary.

## Lệnh

| Lệnh | Việc |
|---|---|
| `npm run dev` | Dev server + API thật ở http://localhost:3000 |
| `npm run build` | Bundle `src/` → `app.js`, `admin.js`, `dist/` (esbuild) |
| `npm run map` | Sinh lại `docs/BLOCK_MAP.md` (bản đồ block) |
| `npm run check:catch` | Chặn `catch` rỗng quay lại trong `src/` |
| `npm run format` | Prettier cho `src/**/*.js` (chạy trước khi commit) |
| `npm run migrate` | Chạy migration Turso |

## Quy tắc bắt buộc

1. **Chỉ sửa trong `src/`.** `app.js` và `admin.js` ở gốc là **build output** của
   `src/student/main.js` và `src/admin/main.js`. Sửa trực tiếp app.js sẽ mất khi build.
2. **Sau khi sửa phải `npm run build`**, rồi hard refresh (Ctrl+Shift+R) — `index.html`
   nạp `app.js?v=...` nên browser cache rất dai.
3. **Không tạo block patch mới cho việc mà một block cũ đang làm.** Sửa vào block đang chạy.
   File đã có 137 block xếp lớp; thêm lớp nữa là tự tạo bug ghi đè.
4. **Không dùng `catch` rỗng.** Dùng `lhWarn('TÊN_BLOCK', e)` (xem phần Debug).
5. **Không đụng Discord webhook** trong appCore/adminCore.
6. **Ảnh chỉ lưu URL** (Cloudinary), không bao giờ nhúng base64 vào DB.

## Đọc code kiểu nào cho đỡ tốn công

`src/student/appCore.js` ~15,3k dòng, `src/admin/adminCore.js` ~6,9k dòng (đã format
Prettier 120 cột — trước đó là 9,6k/5,7k dòng nhưng có 69 dòng dài trên 500 ký tự).

- **Mở `docs/BLOCK_MAP.md` trước.** Nó có: block nào ở dòng nào, block nào ghi đè hàm nào,
  khóa localStorage nào thuộc block nào, endpoint nào block nào gọi. Đọc bản đồ rồi mới
  đọc đúng vùng dòng — đừng đọc cả file.
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
- **Mã lỗi API có ý nghĩa cố định:** `401 UNAUTHORIZED` = chưa/hết phiên;
  `403 PENDING_APPROVAL | BLOCKED | INSUFFICIENT_ROLE` = quyền thật sự không đủ;
  `500 INTERNAL_ERROR` = **không kết luận được quyền**, client phải hiện "thử lại",
  KHÔNG được coi là bị thu hồi quyền.

### 3 tầng cache câu hỏi (nhớ khi dữ liệu "không chịu mới")

1. localStorage `learninghub_questions_cache_v2_<MÃ_MÔN>` — TTL 12 giờ, render tức thì
   rồi `revalidateQuestions()` đối chiếu server ngầm.
2. Cache server trong `api/controllers/questions.js` — TTL 5 phút, key theo mã môn,
   bị xóa khi ghi qua `/api/admin-action`.
3. Browser HTTP cache — bị chặn bằng `cache:'no-store'` + `&ts=`.

Muốn bỏ qua cả (1) và (2): gọi `loadCurrentSubjectOnly(true)` → thêm `&fresh=1`.
Trong Console: `clearLearningHubQuestionCache(); location.reload()`.

## Debug (dùng cái này trước khi đọc code)

- Mọi `catch` trong `appCore.js`/`adminCore.js` đều gọi `lhWarn('TÊN_BLOCK', e)`
  (`src/core/log.js`). Lỗi in Console lần đầu kèm stack, gộp đếm nếu lặp; lỗi không ai
  catch cũng gom vào cùng chỗ.
- **Người dùng báo lỗi → hỏi ngay kết quả `lhErrors()` trong Console.** Tag lỗi chính là
  tên block trong `docs/BLOCK_MAP.md`, tức là đọc 1 bảng thay vì dò cả file.
- Lỗi phía server (`api/`) nằm trong log của `npm run dev` hoặc log Vercel.

## Quyết định sản phẩm (đừng "sửa lại" thành bug)

- **App học sinh KHÔNG có chức năng xóa câu** (bỏ 20260727). Hai block
  `FINAL_DELETE_BUTTON_BESIDE_OPEN_20260614` và `FIX_DELETE_NO_TOGGLE_20260627` đã xóa khỏi
  `appCore.js`. Xóa câu chỉ làm ở **trang admin**; endpoint `delete_question` giữ cho admin.
  Đừng thêm nút xóa vào `card()` của STEP1 dù thấy CSS `.studyDeleteAction` còn sót.

## Bẫy đã gặp thật

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
- [ ] Nhóm sửa câu hỏi: `openEditor` 8 bản, `saveEditor` 5 bản, `renderCard` 4 bản. Rủi ro
      cao hơn vì dính luồng upload ảnh + lưu trực tiếp — **phải test có đăng nhập** trước khi xóa.
- [x] `normalizeAll()` chạy lại khi vẽ thư viện (`RESTORE_LIBRARY_NORMALIZE_20260727`):
      `renderUnified` gọi `window.__LHNormalizeAll()` ở đầu, thay cho lớp bọc renderStudy đã chết.
- [x] Dọn xong CSS chết của nút xóa: 13 chỗ `.studyDeleteAction` + `body.study-has-delete`
      trong `app.css` (rule riêng thì xóa cả dòng, selector gộp thì chỉ bỏ tên đó;
      `.expandHint`/`.studyReportBtn` giữ nguyên computed style ở cả desktop và mobile).
- [ ] Tách `appCore.js` theo tính năng (library / exam / subject-gate / editor / images).
- [ ] Chế độ `?mock=1` stub auth + `/api/questions` để test UI không cần đăng nhập.
