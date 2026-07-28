# Kế hoạch tách `appCore.js` theo tính năng

Số liệu đo ngày 20260727 bằng `scripts/lib/lex-assignments.js` (lex thật, không grep).
**Đọc file này trước khi tách tiếp** — nó ghi lại vì sao thứ tự các bước là như vậy.

## Hiện trạng

Sau bước 2 (20260727): `src/student/appCore.js` **13.554 dòng** (trước 14.889), thêm
`src/student/exam.js` 1.399 dòng và `src/student/format.js` 48 dòng.

Số đo dưới đây là của appCore **trước** bước 2 — giữ nguyên vì bảng thứ tự làm dựa vào nó
(14.889 dòng, 74 block, 13.535 dòng nằm trong block).

| Nhóm | Block | Dòng | Block KHÔNG chạm state chung | Dòng |
|---|---|---|---|---|
| khác | 37 | 5.662 | 27 | 2.955 |
| subject-gate | 12 | 2.168 | 7 | 1.113 |
| editor | 10 | 1.947 | 5 | 1.063 |
| exam | 4 | 1.635 | 3 | 290 |
| images | 7 | 1.194 | 2 | 140 |
| library | 4 | 929 | 2 | 50 |

## Phát hiện quyết định thứ tự làm

**Các block "lõi" của mỗi tính năng đúng là các block vướng state chung.** Tách được ngay
5.611 dòng / 46 block, nhưng đó là phần rìa; phần thực sự làm nên tính năng thì không:

- `FINAL_EXAM_ONLY_QUIZ_UI_20260627` — 1.345 dòng, dùng cả 9 biến của exam
- `LEARNING_HUB_MERGED_SUBJECT_PATCH_START` — 600 dòng, dùng `RAW,pool,ci,flipped,editDraft`
- `LIBRARY_UX_STEP1_STABLE_RENDER_20260627` — 573 dòng, dùng `RAW,pool,ci,flipped,flipDir`
- `FINAL_URL_ONLY_IMAGES_AND_CURRENT_RELOAD_20260628` — 467 dòng, dùng `RAW,pool,ci,flipped,editDraft`

Vậy **không thể tách 5 tính năng đó mà không xử lý state chung trước.**

## Hai nút thắt

### 1. State chung (dòng 305–322) — 498 chỗ dùng

20 biến `let` khai báo một lần, các block đóng gói (IIFE) đóng biến này lại. Module ES
không cho gán vào binding import từ file khác, nên mọi file tách ra mà GHI vào chúng đều
phải đi qua một object chung.

| Biến | Gán | Đọc | Số block chạm |
|---|---|---|---|
| `RAW` | 13 | 64 | 24 |
| `pool` | 19 | 57 | 20 |
| `ci` | 22 | 30 | 18 |
| `editDraft` | 4 | 100 | 13 |
| `flipped` | 21 | 2 | 12 |
| `qSet` | 7 | 29 | 4 |
| `qSel` | 7 | 22 | 3 |
| còn lại (13 biến) | | | 1–5 |

Rủi ro khi đổi tên sang `S.<biến>` — đã đếm hết, đều nhỏ và đếm được:

- **Khai báo lại (shadow), phải giữ nguyên:** `timerInt` dòng 8127, `examStart` dòng 8128,
  `edits` dòng 249. Đổi những chỗ này là làm biến local trỏ sai.
- **Shorthand `{RAW}` / `{pool}` / `{BASE}`:** 1 chỗ mỗi cái — phải viết thành `{ RAW: S.RAW }`.
- **`editDraft` làm tham số hàm:** 1 chỗ.
- **Dùng như thuộc tính (`x.RAW`, `o.editDraft`…):** 12 + 52 + vài chỗ — lexer đã đánh dấu
  `dotted`, bộ đổi tên phải bỏ qua hết.

### 2. Hàm dùng chung giữa các block — 94 hàm

122 hàm dùng chung, 94 hàm bị hơn một block chạm (`renderCard` 13 block,
`loadCurrentSubjectOnly` 12, `openEditor` 11). State giải quyết bằng object chung, còn
hàm thì phải chọn: gọi qua `window.*` như hiện nay (không đổi gì, nhưng vẫn ngầm), hoặc
export/import tường minh (sạch hơn, nhưng phải sửa từng chỗ gọi).

Kiến nghị: **giữ `window.*` cho lần tách đầu.** Đó đã là cách các block gọi nhau suốt từ
đầu; đổi cả hai thứ cùng lúc thì khi vỡ không biết vỡ vì cái nào.

## Thứ tự làm

1. ✅ **XONG — `src/student/state.js`.** 18 biến vào object `LHState`, **505 chỗ** đổi bằng
   `node scripts/migrate-state.js` (script còn lại trong repo để đọc lý do và chạy lại
   được nếu cần). Không di chuyển dòng code nào.
   - Tên là `LHState` **không phải `S`**: block `FINAL_EXAM_ONLY_QUIZ_UI_20260627` đã có
     hàm local tên `S` (appCore ~8140, gọi 12 lần) — dùng `S` thì trong block exam state
     bị che khuất, mà đó là chỗ dùng state nhiều nhất.
   - `BASE` và `edits` **không** chuyển (`edits` bị khai báo lại ở dòng 249).
   - `timerInt` (8127) và `examStart` (8128) có khai báo lại trong scope con — giữ nguyên.
   - `qSel:` / `qCnt:` ở ~8225 là KHÓA thuộc tính, chỉ giá trị được đổi.
   - **Hai lỗi đã gặp khi làm, đừng lặp lại:** (a) chèn `import` sau dòng 1 là chèn vào
     giữa khối chú thích `AI_JS_MAP_START` → import vô hiệu, esbuild vẫn build được, chỉ
     vỡ lúc mở web; (b) lexer coi `...RAW` (spread) là truy cập thuộc tính nên bỏ sót 12
     chỗ — đã sửa trong `lib/lex-assignments.js`.
2. ✅ **XONG — `src/student/exam.js`** (block `FINAL_EXAM_ONLY_QUIZ_UI_20260627`, 1.362
   dòng) + `src/student/format.js` (4 hàm định dạng thuần dùng chung).
   Chỉ chuyển **một** block: hai block exam còn lại để nguyên trong appCore —
   `EXAM_UI_STYLE_MERGED_20260702` chỉ chèn CSS (chuyển đi chẳng giảm được gì phức tạp),
   `PERSIST_LAST_TAB_AND_EXAM_20260628` thực chất là nhớ tab đang mở (fc/quiz/study) và
   gọi `switchTab` của appCore — không thuộc tính năng kiểm tra dù tên có chữ EXAM.

   **Bốn thứ phải xử lý, ghi lại để bước 3–4 làm theo:**

   - **Không dùng IIFE, dùng `installExam()` gọi đúng chỗ block cũ đứng.** `import` bị đưa
     lên đầu file, nếu để thân block chạy lúc import thì nó chạy TRƯỚC 8.000 dòng đầu của
     appCore — đổi thứ tự chạy, đúng loại lỗi khó tìm nhất ở repo này.
   - **Hàm bị xếp lớp thì gọi qua `window.*`, hàm chỉ khai báo một lần thì import.**
     `imgsHTML` (3 lớp) và `openEditor` (12 lớp) phải đọc `window.X` lúc GỌI để lấy bản
     đang chạy — may là mọi lớp ghi đè đều gán cả binding module lẫn `window`, nên hai
     đường là một. Ngược lại `sortAns` / `answerText` / `finalAnswerText` / `fmt` chỉ khai
     báo đúng một lần -> cho vào `format.js` và import; `sample()` chỉ exam gọi -> chuyển
     hẳn vào `exam.js`. `showProgress` / `hideProgress` giữ ở appCore, thêm hai dòng
     `window.X = X` ngay sau chỗ khai báo (không phải lớp ghi đè, `check:overrides` im).
   - **Gán trần vào binding module của appCore thì phải đổi thành `window` + hàm chuyển
     tiếp.** Block cũ có `renderQuiz = function () {…}`; từ file khác module ES không cho
     gán binding đó. Nay exam.js gán `window.renderQuiz`, còn appCore giữ `renderQuiz()`
     mỏng chuyển tiếp sang `window.renderQuiz` — bắt buộc, vì 13 chỗ trong appCore gọi
     `renderQuiz()` theo tên chứ không qua `window`. Bỏ bước này thì exam vẫn "chạy" mà
     tab Kiểm tra vẽ ra khung trắng. Đổi lại: `renderQuiz` từ 3 lớp ghi đè xuống 1.
   - **Kiểm từng tên có THẬT ở phạm vi module hay không, đừng tin `typeof X === 'function'`.**
     Block exam có `typeof cleanImages === 'function' ? cleanImages(...) : ...` nhưng
     `cleanImages` chỉ là hàm local trong hai block ảnh, chưa bao giờ ở phạm vi module →
     nhánh `typeof` luôn sai, câu tải thêm từ môn khác CHƯA BAO GIỜ được lọc ảnh. Nếu cứ
     đổi thành `window.cleanImages` cho "gọn" thì lặng lẽ đổi hành vi trong một commit
     thuần di chuyển. Đã giữ nguyên `r.images || []` kèm chú thích tại chỗ.
     👉 Việc còn nợ: quyết định có lọc ảnh ở đây không, làm ở **commit riêng**.

   Công cụ phải sửa kèm (nếu không thì bước 3–4 sẽ bị dẫn sai):
   - `scripts/map.js`: thêm file mới vào `FILES`, không thì block vừa chuyển biến mất khỏi
     `docs/BLOCK_MAP.md`.
   - `scripts/find-symbol.js`: "có phải hàm không" giờ tính trên TOÀN BỘ các file. Trước đó
     tính từng file, nên trong exam.js `renderQuiz` (1 dòng `window.renderQuiz = fn`, 0 chỗ
     gọi) bị coi là biến thường và bản THẬT bị in nhãn `chết`.

   Đã kiểm bằng `?mock=1` (Console `lhErrors()` rỗng suốt): vào tab Kiểm tra → chọn giao
   diện → làm hết 4 câu → nộp bài ra bảng "KẾT QUẢ KIỂM TRA 2/4 · 50% · Thời gian 00:29"
   → "Xem lại bài làm" hiện ✓/×; Flashcard và Thư viện vẫn hiện đáp án đúng (đường
   `format.js` phía appCore).

   Cách kiểm nhanh trong Console (bản đang chạy phải là bản của exam.js):
   `String(window.renderQuiz).slice(0, 60)` → thấy `setup(); draw();`.
   Lưu ý khi tự kiểm bằng script: nút **Nộp bài** dùng `confirm()` của trình duyệt, chạy
   tự động thì hộp đó không ai trả lời nên coi như bấm Hủy — phải tạm `window.confirm = () => true`.
3. **`images.js`** / **`editor.js`** — **XÁC MINH XONG 20260727, nhưng kết quả đổi việc phải
   làm.** Đọc hết mục này trước khi chạm vào nhóm sửa câu hỏi.

   ### 3.1 Nghi vấn 900ms: ĐÚNG

   Trên app đang chạy (`?mock=1`, Console, sau khi tải > 1 giây):

   ```js
   String(window.openEditor).slice(0, 60)   // "function openEditPreview() { … }"
   String(window.saveEditor).slice(0, 60)   // "async function saveEditPreview() { … }"
   ```

   `apply()` của `LIBRARY_FILTER_AND_EDIT_PREVIEW_LAYOUT_20260627` chạy ba lần (ngay, 0ms,
   **900ms**) và gán vô điều kiện, nên **mọi lớp gán đồng bộ ở dưới file đều chết**: 9 lớp
   `openEditor` + 5 lớp `saveEditor`. Tất cả đã được đánh dấu `DEAD_OVERRIDE_20260727` tại
   chỗ, chú thích gốc đặt ở `function openEditor()` (~dòng 620) — `grep -n DEAD_OVERRIDE_20260727`
   là thấy hết.

   ⚠️ Hai dòng `openEditor = openEditPreview` / `saveEditor = saveEditPreview` bên trong
   `apply()` bị `npm run find` in nhãn `chết` (nó chỉ đánh ● SỐNG được một dòng). Chúng SỐNG
   và cần thiết — 4 chỗ trong appCore gọi `openEditor()` theo tên binding module.

   ### 3.2 Nhưng kế hoạch cũ sai một điểm: **không phải "6 block thành mã chết"**

   Các block đó vẫn còn phần SỐNG, phải giữ:

   | Block | Chết | Còn sống (đừng xóa) |
   |---|---|---|
   | `COPILOT_CLOUDINARY_IMAGE_FIX_20260627` | lớp `openEditor` | `loadCurrentSubjectOnly`, `renderCard` |
   | `FINAL_URL_ONLY_IMAGES_AND_CURRENT_RELOAD_20260628` | lớp `openEditor` | `__LHCleanImages`, `__LHUploadCloudinary` |
   | `COPILOT_FINAL_UPLOAD_DIAGNOSTIC_LOCK_20260628` | lớp `openEditor` | `__LHUploadCloudinary` (bản đang chạy), `__LHTestCloudinaryConfig` |
   | `COPILOT_ULTRA_FINAL_EDIT_UPLOAD_LOCK_20260628` | lớp `openEditor` | `__LHGetPendingImageUpload` / `__LHUploadPendingDataUrls` — `submitEditRequest` (~1809) có gọi |
   | `CLEAN_IMAGE_REQUEST_DELETE_OLD_CREATE_NEW_20260628` | **cả block** (235 dòng) | — |
   | `COPILOT_FIX_EDIT_SAVE_UPLOAD_DIRECT_20260628` | **cả block** (190 dòng) | — |

   Lý do hai block cuối chết **cả block**, không chỉ lớp gán: mọi thứ trong đó bám vào
   `#imgUpload` / `#saveEdit` / `#editQuestion` / `#editImgs` của index.html, mà
   `openEditPreview` dựng LẠI toàn bộ `innerHTML` của `#editModal` với bộ id mới
   (`editPreviewImgInput`, `editPreviewImageHost`, `[data-edit-preview-save]`). Kiểm trong
   Console lúc editor đang mở: `document.getElementById('saveEdit')` → `null`. Vì vậy
   `bind()` + `setInterval(bind, 1000)` của `CLEAN_IMAGE_REQUEST` chạy không tải mãi mãi.

   ### 3.3 Editor sống làm gì (để biết cái gì trùng lặp, cái gì thật sự mất)

   `openEditPreview` / `saveEditPreview` (block LIBRARY_FILTER…, ~8230–8460) đã tự làm:
   upload Cloudinary NGAY lúc chọn file (`window.__LHUploadCloudinary` trong handler `change`
   của `#editPreviewImgInput`), lọc ảnh bằng `__LHCleanImages`, admin/editor thì
   `POST /api/admin-action {action:'save_question_direct'}` + xóa cache + tải lại môn, người
   thường thì `HODSupabase.submitEditRequest`, mất mạng thì lưu vào `edits[...]`.
   Ctrl+V dán ảnh do `EDIT_PREVIEW_CTRL_V_IMAGE_UPLOAD_20260629` lo, cũng nhắm
   `#editPreviewImgInput` → sống.

   **Hai việc mã chết đang giữ mà bản sống KHÔNG có** — cần người quyết định, đừng tự xóa:

   1. **Xóa yêu cầu sửa đang chờ của cùng một câu trước khi tạo yêu cầu mới**
      (`CLEAN_IMAGE_REQUEST`). `submitEditRequest` không làm → hiện tại sửa một câu hai lần
      thì admin thấy hai yêu cầu chờ duyệt. Xóa block, hay chuyển phần dedup này sang
      `submitEditRequest`?
   2. **Upload ảnh data: URL trước khi lưu** (`uploadPendingEditImages` trong
      `COPILOT_FIX_EDIT_SAVE_UPLOAD_DIRECT`). Gần như trùng lặp vì editor sống upload ngay
      lúc chọn file; chỉ còn có ích ở nhánh dự phòng khi thiếu Cloudinary config. Xóa, hay
      gọi nó từ `saveEditPreview`?

   ### 3.4 Đã dọn (20260727) — appCore 13.554 → 12.910 dòng

   Quyết định của chủ repo: xóa, **không** cần chuyển gì sang `submitEditRequest`.
   Lý do mục 3.3(1) hóa ra là báo động sai: việc dedup yêu cầu sửa **đã có ở SERVER**,
   `api/controllers/editRequests.js` POST tìm request pending cùng
   `(user_id, question_id, subject_code)`, UPDATE bản đó rồi DELETE các bản trùng — client nào
   POST endpoint đó cũng được dedup, kể cả `submitEditRequest`. Không mất hành vi nào.

   Đã xóa (mỗi chỗ để lại bia mộ `— ĐÃ XÓA (20260727)` kèm lý do):

   | Xóa | Dòng |
   |---|---|
   | block `CLEAN_IMAGE_REQUEST_DELETE_OLD_CREATE_NEW_20260628` (cả block, kèm `setInterval(bind, 1000)` chạy không tải) | 248 |
   | block `COPILOT_FIX_EDIT_SAVE_UPLOAD_DIRECT_20260628` (cả block, kèm `uploadPendingEditImages`) | 197 |
   | IIFE "lưu trực tiếp" cũ nằm lẫn trong `FINAL_FLOATING_PARTICLES_CANVAS_20260613` | 171 |
   | `patchSave()` trong `LEARNING_HUB_MERGED_SUBJECT_PATCH_START` | 91 |
   | 4 lớp bọc `openEditor` trong các block ảnh (giữ nguyên helper `__LH*`) | 84 |

   Kết quả: **`openEditor` 12 → 3 lớp, `saveEditor` 8 → 3** (base + 2 dòng gán sống trong
   `apply()`); mốc `OVERRIDES_BASELINE.json` đã hạ. Bỏ luôn được một đường đọc THẲNG
   Supabase từ client (`c.from('questions')` trong lớp bọc của `COPILOT_CLOUDINARY_IMAGE_FIX`).
   Block `FINAL_FLOATING_PARTICLES_CANVAS` giờ đúng nghĩa chỉ vẽ hạt nền.

   Cách kiểm đã dùng — **so bản trước/sau bằng `git stash`**, cùng một kịch bản click:
   mở "!" ở Thư viện → bấm "Lưu trực tiếp" (`?mock=1&role=editor`). Hai bản cho kết quả y
   hệt: `POST /api/admin-action` → `GET /api/questions&fresh=1` → toast "Đã lưu trực tiếp ✓",
   `lhErrors()` rỗng. Flashcard / Kiểm tra (làm hết 4 câu + nộp bài) / Thư viện đều nguyên.
   Năm hàm `__LH*` + `imgsHTML` / `renderEditImages` / `loadCurrentSubjectOnly` / `renderCard`
   vẫn đúng bản đang chạy như trước.

   Quan sát kèm theo, CHƯA truy nguyên (có ở cả bản trước khi xóa, không phải regression):
   sau khi "Lưu trực tiếp" thì `#editModal` bị hiện lại — `saveEditPreview` có
   `classList.add('hidden')` nhưng sau `loadCurrentSubjectOnly(true)` modal lại mở.

   ### 3.5 ✅ XONG — `src/student/editor.js` (20260727)

   Chuyển block `LIBRARY_FILTER_AND_EDIT_PREVIEW_LAYOUT_20260627` (editor đang chạy) +
   `EDIT_PREVIEW_CTRL_V_IMAGE_UPLOAD_20260629` (Ctrl+V / kéo thả ảnh) → 448 dòng.
   appCore **12.910 → 12.474 dòng**. `openEditor` **3 → 1 lớp**, `saveEditor` **3 → 1**.

   Bốn thứ phải làm kèm (mẫu cho bước 4):

   - **Hai hàm CHUYỂN TIẾP `openEditor` / `saveEditor` trong appCore** (~dòng 650, 680) —
     thân editor "cổ" của chúng là mã chết nên xóa, chỉ giữ phần đọc `window.openEditor`
     lúc gọi. Bắt buộc: 5 chỗ trong appCore gọi `openEditor()` theo TÊN (nút "!" trên
     Flashcard, `#stEdit`, phím `e`, `openStudyReport`) — xóa forwarder là editor không mở
     được từ Flashcard nữa. Xóa luôn `renderEditOptions` (chỉ thân cũ gọi nó).
   - **`window.__LHSaveLocalEdit(num, patch)`** thay cho việc editor ghi thẳng vào map
     `edits`. `edits` bị GÁN LẠI lúc chạy (nhập file sửa ~752, xóa hết ~1053) nên chia sẻ
     tham chiếu qua file khác là ghi vào object đã bị thay.
   - **`clone` vào `format.js`**; `notify` và `restoreEditor` phơi ra window. Tên window của
     restoreEditor là **`__LHRestoreEditor`**, không phải `restoreEditor`: `check:overrides`
     không phân biệt scope, thấy "hàm khai báo ngoài block + một lần gán window" là báo
     thêm lớp ghi đè. Cùng lý do, ba hàm chuyển tiếp dùng biến local tên riêng
     (`liveOpenEditor`…) chứ không cùng tên `live`.
   - `apply()` trong editor.js bỏ hai dòng gán vào binding module, giữ hai dòng `window.*`.

   Đã kiểm (`?mock=1`, `lhErrors()` rỗng suốt): mở editor bằng **cả ba đường** — phím `e`,
   nút "!" trên Flashcard, nút "Báo cáo / sửa câu" ở Thư viện (đường phím `e` chính là phép
   thử của hàm chuyển tiếp); `role=editor` ra "Lưu trực tiếp" → `POST /api/admin-action` +
   `GET /api/questions&fresh=1` + toast "Đã lưu trực tiếp ✓"; `role=user` ra "Gửi báo cáo" →
   `submitEditRequest` được gọi; "Khôi phục" → toast "Đã khôi phục"; kéo ảnh vào modal →
   hiện gợi ý Ctrl+V + class `dragImageOver`; Flashcard / Kiểm tra (đủ lượt + nộp bài) /
   Thư viện nguyên vẹn. Có so bản trước/sau bằng `git stash` cho cả luồng lưu và Khôi phục.

   ⚠️ Khi tự kiểm bằng Browser pane ẩn: `document.hidden === true` nên
   `PATCH_MOBILE_PERF_PAUSE_INTERVALS_20260702` **tạm dừng mọi `setInterval`**. Thứ gì do
   interval vẽ ra (ví dụ gợi ý Ctrl+V) sẽ không xuất hiện — không phải lỗi tách file.

   ### 3.7 ✅ XONG — `src/student/images.js` (20260727)

   Năm block, 729 dòng. appCore **12.474 → 11.817 dòng**.

   | Hàm install | Block | Cho ai |
   |---|---|---|
   | `installUploadDiagnostics` | `COPILOT_FINAL_UPLOAD_DIAGNOSTIC_LOCK_20260628` | `__LHUploadCloudinary` (bản đang chạy), `__LHTestCloudinaryConfig` |
   | `installUploadLock` | `COPILOT_ULTRA_FINAL_EDIT_UPLOAD_LOCK_20260628` | `__LHGetPendingImageUpload`, `__LHUploadPendingDataUrls` (submitEditRequest gọi) |
   | `installImageVisibleAfterSave` | `COPILOT_FIX_EDIT_IMAGE_VISIBLE_AFTER_SAVE_20260628` | cập nhật ảnh vào câu hiện tại sau khi lưu |
   | `installEditImagesRender` | `EDIT_RENDER_NULL_GUARD_20260629` | `renderEditImages` (bản đang chạy) |
   | `installImgsHTML` | `COPILOT_FIX_IMAGE_RESET_LOSS_FINAL_20260630` | `imgsHTML` (bản đang chạy, lọc ảnh `data:`) |

   Điểm khác so với hai lần tách trước — **hàm chuyển tiếp phải GIỮ thân gốc làm dự phòng**:
   `imgsHTML` (appCore ~340) và `renderEditImages` (~670) có thể bị gọi TRƯỚC khi
   `installImgsHTML()` / `installEditImagesRender()` chạy (hai hàm này ở khoảng dòng 10800 và
   11200 của appCore cũ), khác `openEditor` — nó chỉ được gọi khi người dùng bấm. Nên hai
   forwarder này đọc `window.*` trước, không có thì rơi về thân gốc.

   `esc` thêm vào `format.js` (8 block trong appCore vẫn có `const esc` local riêng — không
   liên quan). Kết quả `check:overrides`: `imgsHTML` 3 → 1 lớp, `renderEditImages` 3 → 2,
   `__LHUploadCloudinary` 2 → 1.

   Hai block **CỐ Ý để lại** trong appCore vì chúng thuộc cụm tải dữ liệu chứ không phải ảnh:
   `COPILOT_CLOUDINARY_IMAGE_FIX_20260627` và `FINAL_URL_ONLY_IMAGES_AND_CURRENT_RELOAD_20260628`
   (cùng gán `loadCurrentSubjectOnly` — 4 lớp — và `renderCard`). Tách chúng phải làm cùng
   lúc với cụm `loadCurrentSubjectOnly`, để dành cho bước sau.

   Đã kiểm (`?mock=1&role=editor`, `lhErrors()` rỗng): `window.imgsHTML` là bản của images.js
   (URL thật → thẻ `<img>`, ảnh `data:` bị lọc bỏ), `__LHCleanImages` lọc đúng, năm hàm
   `__LH*` đều có, Flashcard / Thư viện 4/4 / Kiểm tra đủ lượt / mở editor / Lưu trực tiếp
   (toast "Đã lưu trực tiếp ✓") đều nguyên.

   ### 3.6 Phép thử BẮT BUỘC trước khi deploy — CHƯA CHẠY

   `?mock=1&role=editor` kiểm được: editor mở ra, hiện "Lưu trực tiếp", DOM đúng bộ id mới,
   lưu trực tiếp gọi đúng API. Nhưng **upload Cloudinary thật** thì mock không thay được.
   Trước khi merge/deploy bản đã xóa code, phải đăng nhập thật và làm đủ:
   mở "!" → **thêm ảnh** (ảnh phải ra URL `cloudinary`, KHÔNG phải `data:`) → **Lưu trực tiếp**
   (admin/editor) và **Gửi báo cáo** (user thường) → mở lại câu đó xem ảnh còn không.
   Vỡ chỗ nào thì `git revert` đúng commit "xóa mã chết nhóm sửa câu hỏi".
4. **`library.js`** ✅ XONG (20260727) · **`subjectGate.js`** ✅ XONG (20260728).

   `src/student/library.js` = `LIBRARY_UX_STEP1_STABLE_RENDER_20260627` (`renderUnified`, bản
   đang chạy của `renderStudy`) + `LIBRARY_LABEL_AND_UI_FIX_20260627`. 624 dòng.
   appCore **11.817 → 11.237 dòng**. `renderStudy` **9 → 1 lớp gán**.

   Cái bẫy riêng của bước này — **phải xóa lớp gán trần cũ TRƯỚC khi làm hàm chuyển tiếp**:
   `FINAL_APP_REPORT_BUTTON_NO_TOGGLE` và `FINAL_SMART_SEARCH` đều có
   `renderStudy = …` gán ĐỒNG BỘ ở giữa file, tức là sau hàm chuyển tiếp. Nếu để lại, chúng
   đè lên forwarder và bản của library.js (chỉ gán được `window.renderStudy`) sẽ KHÔNG tới
   được 11 chỗ gọi `renderStudy()` theo tên — thư viện vẽ bằng bản cũ vĩnh viễn. Hai lớp đó
   vốn đã đánh dấu `DEAD_OVERRIDE` từ trước nên xóa là đúng; phần còn sống của hai block
   (`openStudyReport`, `hardBindReportButtons`, `smart = smartBetter`, `bindBetterSearch`,
   và lời gọi trực tiếp `renderStudyBetter()` ở DOMContentLoaded) giữ nguyên.
   `renderStudy` gốc giữ thân cũ làm dự phòng cho quãng trước khi `installLibrary()` chạy.

   Đã kiểm (`?mock=1&role=editor`, `lhErrors()` rỗng): `window.renderStudy` là `renderUnified`
   của library.js; 4/4 câu; nhãn tab "Thư viện"; tìm "Hà Nội" → 1/1 rồi xóa → 4/4; lọc
   "Rủi ro cao" → 1/4 rồi "Tất cả" → 4/4; bookmark → "🔖 Đã lưu 1"; "Học câu này" → nhảy sang
   Flashcard đúng câu; "Báo cáo / sửa câu" → mở editor.

   **Việc còn nợ phát hiện ở đây** (có từ trước, chưa sửa vì là đổi hành vi): đường nạp ảnh
   chậm của thư viện gọi `cleanImages(...)` — tên KHÔNG tồn tại ở tầng module (chỉ là hàm
   local của block `FINAL_URL_ONLY_IMAGES`) nên ném `ReferenceError`, bị `.catch` ngay dưới
   nuốt → ảnh không bao giờ được nạp thêm. Đã chú thích tại chỗ trong `library.js`.
   `cleanImages` còn bị gọi kiểu đó từ 2 block khác nữa (có `typeof` bọc nên im lặng).

   ### 4.1 ✅ XONG — `src/student/subjectGate.js` (20260728)

   Năm block, 1.009 dòng. appCore **11.237 → 10.309 dòng** (tổng cả 4 bước: 14.915 → 10.309, −31%).

   | Hàm install | Block | Cho ai |
   |---|---|---|
   | `installSubjectGate` | `LEARNING_HUB_MERGED_SUBJECT_PATCH_START` | `#subjectGate`, `renderSubjects`, `enterSubject`, `openGate`, chip môn đang học, `setSubject`, `loadBySubject`, `patchSubmit`/`patchSignOut` |
   | `installGateAriaFix` | `FIX_ARIA_HIDDEN_SUBJECT_GATE_20260629` | bỏ focus khỏi phần tử bị `aria-hidden` |
   | `installSubjectCountsCache` | `SUBJECT_COUNTS_ONCE_CACHE_20260629` | `refreshSubjectCountsOnce`, `clearLearningHubSupabaseCache` |
   | `installClearAddSubjectDraft` | `CLEAR_ADD_SUBJECT_DRAFT_NEW_SESSION_20260629` | `__clearAddSubjectDraft` |
   | `installSubjectCountsFallback` | `TURSO_SUBJECT_COUNTS_FALLBACK_20260630` | `refreshZeroCounts` (bù số câu = 0) |

   **Bẫy số 1 (đã sập, chính là bẫy 1(a) của bước 1): đặt 5 lời gọi `install*()` vào appCore
   mà QUÊN dòng `import`.** `npm run build` vẫn xanh, `check:overrides` / `check:catch` vẫn
   xanh — esbuild coi tên chưa khai báo là global, chỉ vỡ lúc mở web. Sau khi thêm import,
   thứ tự chạy giữ nguyên vì mỗi `install*()` được gọi đúng chỗ block cũ đứng.

   **Bẫy số 2 — bẫy `typeof X === 'function'` (bẫy 2 của bước 2) ở dạng NGƯỢC:** block cũ là
   IIFE nằm TRONG appCore, nên nó gọi trần được `notify` / `fixBrand` / `renderCard` /
   `renderQuiz` / `renderStudy` ở tầng module appCore. Chuyển sang file riêng thì năm tên đó
   biến mất, và mỗi tên hỏng một kiểu khác nhau — đây là lý do phải kiểm từng tên một:

   | Tên | Dạng gọi trong block cũ | Hậu quả nếu để nguyên | Đã đổi thành |
   |---|---|---|---|
   | `notify` | `typeof notify === 'function' ? …` | nhánh luôn sai → **mọi toast của cổng chọn môn im lặng mất** | `window.notify` (appCore ~757) |
   | `fixBrand` | `typeof fixBrand === 'function' ? …` | nhánh luôn sai → đổi môn không cập nhật tên môn ở header | `window.fixBrand` (appCore ~4173) |
   | `renderCard`/`renderQuiz`/`renderStudy` | gọi TRẦN trong `try` | **ném `ReferenceError`, bị `lhWarn` nuốt** → đổi môn xong cả ba tab giữ nội dung môn cũ | `window.X?.()` |

   Ba cái sau nguy hơn hai cái đầu: có `try` riêng nên `lhErrors()` CÓ báo, nhưng UI chỉ
   "trơ" chứ không nổ, rất dễ tưởng là lỗi cache.

   **Hai chỗ CỐ Ý giữ nguyên hành vi cũ (đã để bia mộ tại chỗ, đừng "dọn"):**

   - `cleanImages` trong `loadBySubject` — cùng món nợ đã ghi ở bước 2 và 4: tên này chưa bao
     giờ ở tầng module appCore, nhánh `typeof` vốn đã luôn sai. Giữ nguyên để commit này thuần
     di chuyển; sửa thì làm cả 4 chỗ một lượt ở commit riêng.
   - Lớp bọc `renderSubjects` cuối `installSubjectCountsFallback`
     (`window.renderSubjects = renderSubjects = fn`) — `renderSubjects` là hàm local của
     `installSubjectGate`, ở bản cũ cũng là IIFE riêng, nên `oldRenderSubjects` LUÔN null và
     cả khối `if` chưa bao giờ chạy. Đổi sang `window.renderSubjects` là **BẬT một lớp ghi đè
     đang tắt** — đổi hành vi. ⚠️ `npm run find renderSubjects` in dòng đó là "● SỐNG" (sai —
     nó không mô phỏng được điều kiện `if`); kiểm bằng Console: `window.renderSubjects` là
     `undefined`, cả trước và sau khi tách.

   Cách rà năm cái tên đó cho lần sau: liệt kê mọi tên được GỌI trong file mới mà không thấy
   khai báo ngay trong file (lex bằng `scripts/lib/lex-assignments.js`), rồi chạy cùng cách
   trên appCore trước/sau và lấy phần **mới xuất hiện** — đúng ba tên
   (`clearLearningHubSupabaseCache`, `syncSubjectTexts`, `syncUserSubjectToProfile`), cả ba đều
   vô hại (một trong chú thích, hai chỗ còn lại là nhánh `typeof` VỐN ĐÃ chết vì bản cũ là IIFE
   — `appCore:3217` là ví dụ). Không nhánh nào bị đổi trạng thái.

   Công cụ phải sửa kèm: `scripts/map.js` thêm `subjectGate.js` vào `FILES`
   (`find-symbol.js` đã tự quét theo thư mục nên không cần sửa).

   `check:overrides` sau khi tách: `c` 3 → 1 lớp, `clearLearningHubSupabaseCache` 2 → 1,
   `loadBySubject` 2 → 1 (chỉ còn lớp `ACTIVE_SUBJECT_COUNT_SYNC` bọc `window.loadBySubject`).

   Đã kiểm (`?mock=1&role=editor`, `lhErrors()` rỗng suốt): toast "Đã tải MOCK1" lúc vào trang
   (chính là `notifyUX` vừa sửa) · mở cổng → 2 thẻ môn đúng số câu (`MOCK1=4 câu`,
   `MOCK2=2 câu`) · đổi sang MOCK2 → chip "MOCK2 · Môn Mock Hai", `.counter` "Câu 1 / 2",
   thư viện 2 câu · gọi `window.loadBySubject('MOCK1')` (đường có 5 tên vừa sửa) → đếm được
   `renderCard`/`renderQuiz`/`renderStudy`/`fixBrand` mỗi hàm **1 lần** và toast
   "Đã tải MOCK1 · Môn Mock Một", counter về "/ 4", thư viện 4 câu · tab "Thêm môn mới" trong
   cổng vẫn mở được (block đó CÒN Ở appCore nhưng bám DOM của cổng đã chuyển đi) · Flashcard
   lật thẻ · Thư viện tìm "Hà Nội" 4→1→4 · Kiểm tra làm đủ 4 câu + nộp bài ra
   "KẾT QUẢ KIỂM TRA 2 / 4 câu đúng · 50% · Thời gian 00:42" · mở editor bằng nút "!" ra đúng
   "Lưu trực tiếp".

   ⚠️ **Một quan sát KHÔNG phải regression, đã đối chiếu bằng `git stash`:** bấm "Lưu trực tiếp"
   trong editor không gọi `/api/admin-action`, modal không đóng, không có toast — **bản HEAD
   trước khi tách cho kết quả y hệt**, nên đây không phải lỗi của bước 4. Nguyên nhân thì CHƯA
   truy ra: click vào `[data-edit-preview-save]` không sinh event nào tới cả listener capture
   trên `document`, trong khi `[data-edit-add-opt]` (cùng một handler uỷ quyền, cùng modal) thì
   có — nút vẫn `isConnected`, không `disabled`, `click`/`dispatchEvent` vẫn là bản native.
   Nghi do môi trường tự kiểm (Browser pane ẩn → `document.hidden === true`, đúng cái bẫy đã ghi
   ở mục 3.5) nhưng chưa chứng minh. Muốn kiểm luồng lưu thì mở pane ra và click bằng chuột thật.

   **CHƯA tách (cố ý), để dành bước 5:**

   - Nhóm **"Thêm môn" + xem trước file import** — vẫn ở appCore, ~2.350 dòng và là cụm lớn
     nhất còn lại: `ADD_SUBJECT_FEATURE_20260625` (494), `QUIZLET_IMPORT_AUTODETECT_20260701`
     (96), `FIX_DELETE_IMPORT_FILE_20260625` (59), `IMPORT_PREVIEW_INLINE_EDIT_20260625` (429),
     `FINAL_INLINE_EDIT_KEEP_EXISTING_CARD_20260625` (134), `INLINE_DELETE_OPTION_20260625` (47),
     `IMPORT_PREVIEW_COMPACT_UX_PATCH_20260626` (1.089), `FIX_ADD_SUBJECT_FAST_PARALLEL_UPLOAD_20260701` (285).
     Đây là tính năng riêng (nhập câu hỏi từ file), chỉ dùng chung `#subjectGate` làm chỗ đứng.
   - Nhóm **tải dữ liệu**: `ACTIVE_SUBJECT_COUNT_SYNC_20260629` (109) cùng
     `COPILOT_CLOUDINARY_IMAGE_FIX_20260627` (158) và
     `FINAL_URL_ONLY_IMAGES_AND_CURRENT_RELOAD_20260628` (444) — cả ba gán
     `loadCurrentSubjectOnly` (4 lớp) và `renderCard`. Phải tách CÙNG LÚC với nhau, không lẻ.
5. Mỗi bước: `npm run build` + `npm run check:overrides` + `?mock=1` + commit riêng.
   Không gộp hai tính năng vào một commit — vỡ thì không biết vỡ vì cái nào.

## Điều kiện đã có

- Mốc git: nhánh `chore/maintenance-tooling` (3 commit).
- Cách tự kiểm không cần đăng nhập: `?mock=1` (xem `CLAUDE.md`).
- Chặn sinh thêm lớp ghi đè: `npm run check:overrides`.
