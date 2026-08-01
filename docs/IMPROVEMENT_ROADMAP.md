# 🚀 KẾ HOẠCH & HƯỚNG DẪN CẢI THIỆN HỆ THỐNG (IMPROVEMENT ROADMAP FOR CLAUDE)

> **Ghi chú cho Claude / Agent tiếp theo:** 
> Vui lòng đọc kỹ file này cùng với [CLAUDE.md](file:///c:/Users/trong/MTrongPC/Documents/VS%20Code/lxpacademy/CLAUDE.md) trước khi bắt đầu thực hiện bất kỳ công việc nào. 
> Luôn tuân thủ nguyên tắc: **Chỉ sửa trong `src/`**, **Không dùng catch rỗng**, **Luôn chạy kiểm tra trước khi kết thúc turn**.

---

## 📌 1. TỔNG QUAN HIỆN TRẠNG (BASELINE STATUS)

* **Code quality & Build status**:
  * `npm run check:catch`: ✅ PASS (Không có catch rỗng).
  * `npm run check:overrides`: ✅ PASS (Mốc baseline hiện tại: 33 hàm bị gán đè).
  * `npm run check:installs`: ✅ PASS (31/31 hàm `install*()` được gọi đầy đủ).
  * `npm run check:globals`: ✅ PASS (Cầu nối window/global an toàn).
  * `npm run format:check`: ✅ PASS (Đã Prettier toàn bộ `src/`).
  * `npm run build`: ✅ PASS (Bundle thành công `app.js` và `admin.js`).

---

## 📋 2. CÁC HẠNG MỤC CẦN CẢI THIỆN (ACTIONABLE TASKS)

### 🔹 TASK 1: Tối ưu dung lượng Bundle bằng Lazy-Loading (Code-Splitting)
* **Vấn đề**: File [app.js](file:///c:/Users/trong/MTrongPC/Documents/VS%20Code/lxpacademy/app.js) đang bị phình to (~769 KB) do nạp tĩnh các thư viện nặng như `JSZip`.
* **Mục tiêu**: Tách `JSZip` khỏi bundle khởi tạo ban đầu, chỉ tải khi người dùng thực sự sử dụng tính năng **Import File Zip / Thêm môn**.
* **Các file liên quan**:
  * [src/student/subjectImport.js](file:///c:/Users/trong/MTrongPC/Documents/VS%20Code/lxpacademy/src/student/subjectImport.js)
  * [package.json](file:///c:/Users/trong/MTrongPC/Documents/VS%20Code/lxpacademy/package.json)
* **Cách thực hiện**:
  1. Trong `subjectImport.js`, tìm chỗ `import JSZip from 'jszip'`.
  2. Chuyển sang import động (dynamic `await import('jszip')`) bên trong hàm xử lý upload zip (ví dụ `handleZipImport` / `processZipFile`).
  3. Cập nhật script build [scripts/build.js](file:///c:/Users/trong/MTrongPC/Documents/VS%20Code/lxpacademy/scripts/build.js) nếu esbuild cần cấu hình splitting/format ESM cho chunk tải động.
* **Xác minh (Verification)**:
  * Chạy `npm run build` và kiểm tra dung lượng `app.js` giảm xuống.
  * Mở app, thử import 1 file `.zip` chứa môn học để đảm bảo tính năng nạp động `JSZip` chạy mượt mà không lỗi.

---

### 🔹 TASK 2: Refactor & Giảm số lượng Overrides Baseline
* **Vấn đề**: Hiện đang có 33 hàm trong dự án bị xếp lớp ghi đè (`docs/OVERRIDES_BASELINE.json`).
* **Mục tiêu**: Hợp nhất các lớp patch cũ vào tệp module gốc tương ứng để mã nguồn sạch sẽ hơn và dễ bảo trì.
* **Các file liên quan**:
  * [docs/OVERRIDES_BASELINE.json](file:///c:/Users/trong/MTrongPC/Documents/VS%20Code/lxpacademy/docs/OVERRIDES_BASELINE.json)
  * [src/student/appCore.js](file:///c:/Users/trong/MTrongPC/Documents/VS%20Code/lxpacademy/src/student/appCore.js)
  * [src/student/exam.js](file:///c:/Users/trong/MTrongPC/Documents/VS%20Code/lxpacademy/src/student/exam.js)
  * [src/student/library.js](file:///c:/Users/trong/MTrongPC/Documents/VS%20Code/lxpacademy/src/student/library.js)
* **Cách thực hiện**:
  1. Chạy `npm run check:overrides` để xem danh sách các hàm bị gán đè.
  2. Dùng `npm run find <tênHàm>` để xem các vị trí đang định nghĩa/ghi đè hàm đó.
  3. Di chuyển logic mới nhất vào đúng file module chính (`exam.js`, `library.js`, v.v.), xóa bỏ các câu lệnh gán đè thừa trong `appCore.js`.
  4. Chạy lệnh hạ mốc baseline: `npm run check:overrides -- --update`.
* **Xác minh (Verification)**:
  * Chạy `npm run check:overrides` đảm bảo không bị tăng lớp gán.
  * Chạy `npm run check:globals` đảm bảo các hàm vẫn gắn đúng vào `window`.

---

### 🔹 TASK 3: Bổ sung Automated Tests cho API Controllers Edge (`api/`)
* **Vấn đề**: Các API endpoint Vercel Edge (`api/controllers/`) chưa có test suite tự động để bắt lỗi khi thay đổi DB schema (Turso) hoặc Auth (Supabase).
* **Mục tiêu**: Viết bộ test tự động nhẹ sử dụng `node:test` (Node.js native test runner) không cần thêm dependency nặng.
* **Các file liên quan**:
  * [api/controllers/notify.js](file:///c:/Users/trong/MTrongPC/Documents/VS%20Code/lxpacademy/api/controllers/notify.js)
  * [api/controllers/editRequests.js](file:///c:/Users/trong/MTrongPC/Documents/VS%20Code/lxpacademy/api/controllers/editRequests.js)
  * [api/lib/discord.js](file:///c:/Users/trong/MTrongPC/Documents/VS%20Code/lxpacademy/api/lib/discord.js)
  * [package.json](file:///c:/Users/trong/MTrongPC/Documents/VS%20Code/lxpacademy/package.json)
* **Cách thực hiện**:
  1. Tạo thư mục `test/` và file `test/discord-notify.test.js`.
  2. Viết test case cho `normalizeDiscordSettings`, mock Discord Webhook payload, test phân loại `DISCORD_NOTIFICATION_KINDS`.
  3. Thêm script `"test": "node --test test/**/*.test.js"` vào `package.json`.
* **Xác minh (Verification)**:
  * Chạy `npm test` thành công 100%.

---

### 🔹 TASK 4: Tối ưu Render danh sách Thư viện câu hỏi (UI/UX Performance)
* **Vấn đề**: Khi môn học có hàng ngàn câu hỏi, việc render DOM trong tab Thư viện ([library.js](file:///c:/Users/trong/MTrongPC/Documents/VS%20Code/lxpacademy/src/student/library.js)) có thể bị giật khựng trên thiết bị di động.
* **Mục tiêu**: Áp dụng phân trang (pagination) hoặc lazy render / IntersectionObserver cho danh sách câu hỏi trong `renderUnified`.
* **Các file liên quan**:
  * [src/student/library.js](file:///c:/Users/trong/MTrongPC/Documents/VS%20Code/lxpacademy/src/student/library.js)
  * [src/student/search.js](file:///c:/Users/trong/MTrongPC/Documents/VS%20Code/lxpacademy/src/student/search.js)
* **Cách thực hiện**:
  1. Trong `renderUnified`, giới hạn số câu hỏi render ban đầu (ví dụ 30-50 câu đầu tiên).
  2. Bổ sung nút "Xem thêm" hoặc tự động nạp thêm khi cuộn xuống gần cuối danh sách (Infinite Scroll với `IntersectionObserver`).
* **Xác minh (Verification)**:
  * Chạy `npm run build`.
  * Thao tác chuyển tab Thư viện với môn học dung lượng lớn xem độ mượt.

---

## 🛠️ 3. QUY TRÌNH CHECKLIST BẮT BUỘC TRƯỚC KHI COMMIT (DÀNH CHO CLAUDE)

Mỗi khi Claude thực hiện xong một nhiệm vụ, **BẮT BUỘC** chạy chuỗi lệnh sau để xác nhận không gây ra sự cố:

```bash
# 1. Định dạng code
npm run format

# 2. Chạy tất cả các lệnh kiểm tra an toàn
npm run check:catch
npm run check:overrides
npm run check:installs
npm run check:globals
npm run format:check

# 3. Build ứng dụng ra bundle gốc
npm run build

# 4. Cập nhật lại sơ đồ hàm
npm run map
```

---
*Bản tài liệu này được lưu trữ trực tiếp tại [docs/IMPROVEMENT_ROADMAP.md](file:///c:/Users/trong/MTrongPC/Documents/VS%20Code/lxpacademy/docs/IMPROVEMENT_ROADMAP.md)*
