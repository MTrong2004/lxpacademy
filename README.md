# 🎓 Learning Hub (LXP Academy)

> Nền tảng học tập, ôn luyện trắc nghiệm và quản lý ngân hàng câu hỏi trực tuyến dành cho sinh viên. Tích hợp hệ thống đóng góp & duyệt câu hỏi cộng đồng, quản lý môn học thư mục, phân quyền Admin 2 cấp, theo dõi thiết bị & môn đang học thời gian thực, hệ thống thông báo Discord 9 loại, và tối ưu hóa tiêu thụ cơ sở dữ liệu.

---

## 📑 Mục lục

- [Giới thiệu](#-giới-thiệu)
- [Công nghệ & Kiến trúc mã nguồn](#-công-nghệ--kiến-trúc-mã-nguồn)
- [Tính năng nổi bật](#-tính-năng-nổi-bật)
- [Chế độ Test Offline (Mock Mode) & Dev Tooling](#-chế-độ-test-offline-mock-mode--dev-tooling)
- [Tối ưu tài nguyên & DB Reads](#-tối-ưu-tài-nguyên--db-reads)
- [Cấu trúc dự án](#-cấu-trúc-dự-án)
- [Cấu hình biến môi trường](#-cấu-hình-biến-môi-trường)
- [Hướng dẫn cài đặt & Chạy ứng dụng](#-hướng-dẫn-cài-đặt--chạy-ứng-dụng)
- [Khởi tạo & Quản lý Cơ sở dữ liệu](#-khởi-tạo--quản-lý-cơ-sở-dữ-liệu)
- [🗺️ Kế hoạch phát triển & Tối ưu hóa (Roadmap & Plans)](#%EF%B8%8F-kế-hoạch-phát-triển--tối-ưu-hóa-roadmap--plans)
- [Triển khai (Deployment)](#-triển-khai-deployment)

---

## 🚀 Giới thiệu

**Learning Hub** là hệ thống luyện thi & quản lý ngân hàng câu hỏi trực tuyến được tối ưu cho tốc độ, trải nghiệm người dùng và chi phí vận hành. Ứng dụng chạy trên kiến trúc **Serverless Edge Functions**, kết nối cơ sở dữ liệu SQLite phân tán **Turso (libSQL)** và xác thực người dùng qua **Supabase Auth**.

Mã nguồn frontend đã được tái cấu trúc (refactored) theo dạng **ES Modules** đặt trong thư mục `src/`, giúp mã nguồn sạch sẽ, dễ bảo trì, mở rộng và kiểm thử.

---

## 🛠 Công nghệ & Kiến trúc mã nguồn

### Stack công nghệ

| Phân loại | Công nghệ / Thư viện | Mô tả |
| :--- | :--- | :--- |
| **Frontend** | HTML5, CSS3, ES Modules (JavaScript) | Giao diện tùy chỉnh chuẩn UI/UX, hỗ trợ Dark/Light Mode, Glassmorphic UI & Responsive. |
| **Modular Core** | Modular `src/` Architecture | Tách nhỏ mã nguồn thành các module chuyên biệt (`exam`, `editor`, `library`, `subjectGate`, `images`, `state`, `format`). |
| **Authentication** | [Supabase Auth](https://supabase.com/docs/guides/auth) | Xác thực Google OAuth, cấp token `Bearer` và tự động làm mới (Auto Refresh Token). |
| **Media Storage** | [Cloudinary API](https://cloudinary.com/) | Upload trực tiếp và quản lý hình ảnh minh họa câu hỏi, hỗ trợ dán ảnh clipboard (`Ctrl+V`). |
| **Backend / API** | [Vercel Edge Functions](https://vercel.com/docs/functions/edge-functions) | API Serverless chạy tại Edge Runtime tối ưu độ trễ (`api/index.js` & controllers). |
| **Database** | [Turso](https://turso.tech/) (`@libsql/client/web`) | Cơ sở dữ liệu SQLite Serverless phân tán toàn cầu. |
| **Bundler & Build** | `esbuild`, Node.js | Biên dịch và đóng gói từ `src/` ra `app.js` và `admin.js` tốc độ cực nhanh. |
| **Integrations** | Discord Webhook Engine | Gửi thông báo real-time 9 loại sự kiện hệ thống (Login, Audit Logs, Edit Request, Errors,...). |

### Kiến trúc Biên dịch (Build Pipeline)
Mọi chỉnh sửa giao diện và logic đều thực hiện trong thư mục `src/`. Các file `app.js` và `admin.js` tại gốc là **Build Outputs** được sinh ra bởi `esbuild`:
```text
src/student/main.js  ──(esbuild)──>  app.js  (chủ yếu cho index.html)
src/admin/main.js    ──(esbuild)──>  admin.js (chủ yếu cho admin.html)
```

---

## ✨ Tính năng nổi bật

### 👨‍🎓 Dành cho Sinh viên / Học viên
- **Cổng chọn môn học dạng Thư mục (Folder Drilldown):**
  - Tự động gom nhóm các môn cùng mã gốc (VD: `MLN111_C1`, `MLN111_C2`...) thành một **thư mục môn học**.
  - Hiển thị badge **Mới (NEW)** độc lập cho từng môn hoặc cả thư mục môn.
  - Ô tìm kiếm tức thì trải phẳng danh sách môn học khi tìm từ khóa.
- **Luyện tập & Thư viện Tra cứu (`library.js`):**
  - Tra cứu câu hỏi theo từ khóa, mã số `#câu`, hoặc đáp án đúng.
  - Phân loại rủi ro câu hỏi (`low`, `medium`, `high`) kèm giải thích đáp án.
  - Đóng góp / Báo cáo sửa câu hỏi: Hỗ trợ đính kèm hình ảnh từ Cloudinary hoặc dán ảnh trực tiếp từ bộ nhớ tạm (`Ctrl+V`).
- **Chế độ Flashcard (Thẻ ghi nhớ):**
  - Lật thẻ học nhanh, xáo trộn câu hỏi ngẫu nhiên, tùy chỉnh kích thước chữ và chế độ lật 1x / 2x.
- **Kiểm tra trắc nghiệm (`exam.js`):**
  - Lựa chọn số lượng câu, khoảng câu hỏi (VD: từ câu 10 đến câu 50).
  - Tùy chọn gộp nhiều môn/chương vào cùng một đề thi.
  - Bảng kết quả kiểm tra chi tiết kèm xem lại danh sách câu sai.
- **Chuông thông báo Trạng thái:**
  - Theo dõi kết quả xét duyệt yêu cầu sửa câu hỏi (*Chờ duyệt / Đã duyệt / Từ chối*) real-time.

### 🛡 Dành cho Quản trị viên (Admin & Editor Dashboard)
- **Hệ thống Phân quyền Admin 2 Cấp (Two-Tier Permissions):**
  - **System Admin (Admin Hệ thống - Badge Tím):** Có toàn quyền điều khiển hệ thống và bật/tắt các loại thông báo Discord.
  - **Regular Admin / Editor (Badge Vàng):** Thực hiện các thao tác quản lý dữ liệu, người dùng và phê duyệt yêu cầu.
- **Quản lý Người dùng SaaS Layout:**
  - **Theo dõi thời gian thực:** Hiển thị **Môn đang học** (Badge mã môn) và **Thiết bị sử dụng** (`💻 Windows · Edge`, `📱 iOS · Safari`, `📱 Android · Chrome`).
  - Lọc & Tìm kiếm người dùng tức thì theo môn hoặc thiết bị.
  - Cấp/gỡ quyền `admin`, `editor`, `user`, mở phê duyệt hoặc khóa tài khoản.
- **Hệ thống Banner Nhắc Tải Lại (`reload_notice`):**
  - Admin có thể bấm nút "Nhắc tải lại" cho 1 người hoặc tất cả người dùng khi hệ thống cập nhật. Banner xuất hiện mượt mà mà **KHÔNG cưỡng chế đăng xuất** (ngắt phiên làm bài của sinh viên).
- **Duyệt Yêu cầu Sửa đổi (Edit Requests Diff Viewer):**
  - So sánh chi tiết dạng **Diff Viewer** giữa dữ liệu cũ và dữ liệu đề xuất trước khi phê duyệt hoặc từ chối.
- **Quản lý Môn học & Thư mục:**
  - Sắp xếp thứ tự môn học bằng kéo thả (Drag & Drop).
  - Bật/tắt cờ `NEW` riêng cho từng môn học hoặc thư mục môn.
  - Thùng rác & khôi phục môn học bị xóa tạm thời.
- **Hệ thống Thông báo Discord 9 Loại (Discord Webhook Engine):**
  - Tự động phát thông báo theo 9 loại: `login`, `action`, `edit_request`, `question_edit`, `role_change`, `destructive`, `subject_request`, `new_user`, `server_error`.
  - Trang Admin tích hợp công tắc bật/tắt linh hoạt cho từng loại thông báo.

---

## 🧪 Chế độ Test Offline (Mock Mode) & Dev Tooling

### Chế độ Mock Mode (`?mock=1`)
Hệ thống tích hợp công cụ giả lập dữ liệu (`src/core/mock.js`), cho phép kiểm thử toàn bộ giao diện Học sinh & Admin mà **không cần kết nối Supabase, Turso DB hay Internet**:

- **Test Giao diện Học viên:** Truy cập `http://localhost:3000/?mock=1` (nạp các môn giả lập MOCK1, MOCK2,... để test thư viện, flashcard, kiểm tra).
- **Test Giao diện Admin:** Truy cập `http://localhost:3000/admin.html?mock=1&role=admin` (mở toàn bộ Dashboard quản trị với dữ liệu mock).
- **Test Admin Thường:** `admin.html?mock=1&role=admin&sysadmin=0` (ẩn tab cấu hình Discord).
- **Test Thông báo Cập nhật:** `?mock=1&reload_notice=1` (hiện banner nhắc tải lại).

### Bộ công cụ Developer Tools & Lint Scripts

| Lệnh | Công dụng |
|---|---|
| `npm run dev` | Khởi chạy Dev Server giả lập Vercel Edge API tại `http://localhost:3000` |
| `npm run build` | Biên dịch mã nguồn từ `src/` ra `app.js`, `admin.js` và `dist/` bằng `esbuild` |
| `npm run find <tên>` | Tra cứu vị trí định nghĩa/gán hàm và kiểm tra **bản nào đang SỐNG/chạy thực tế** |
| `npm run check:overrides` | Chặn việc tự ý tạo thêm lớp ghi đè (override layer) cho các hàm đã có |
| `npm run check:catch` | Chặn các khối `catch` rỗng không qua xử lý log |
| `npm run map` | Cập nhật lại sơ đồ bản đồ block trong `docs/BLOCK_MAP.md` |
| `npm run format` | Chạy Prettier định dạng chuẩn mã nguồn trong `src/` |

---

## ⚡ Tối ưu tài nguyên & DB Reads

Hệ thống được thiết kế tối ưu nhằm giảm tối đa lượng truy vấn cơ sở dữ liệu **Turso (libSQL)**:
- **Client-Side Quiz Processing:** Trong quá trình học viên làm bài, đổi câu hỏi hay lật thẻ flashcard, **100% logic xử lý trên trình duyệt bằng JavaScript** (0 Turso reads).
- **Tối ưu Polling Chuông Thông báo:** Điều chỉnh chuông kiểm tra định kỳ mỗi **5 phút** (thay vì 3 giây), giúp **giảm 99% số lượt truy vấn ngầm** vào Turso DB (tiết kiệm hàng triệu Row Reads hàng tháng).
- **Hệ thống Cache Câu hỏi 3 Tầng:**
  1. *Client Cache (localStorage):* TTL 12 giờ, render giao diện ngay lập tức.
  2. *Server Cache (Vercel Edge):* TTL 5 phút, tự động dọn dẹp khi có thao tác chỉnh sửa từ Admin.
  3. *Browser HTTP Cache:* Quản lý revalidation qua query timestamp `&ts=`.

---

## 📁 Cấu trúc dự án

```text
lxpacademy/
├── src/                      # MÃ NGUỒN CHÍNH (Tất cả chỉnh sửa code tại đây)
│   ├── core/                 # Tiện ích dùng chung
│   │   ├── log.js            # Hệ thống ghi log & cảnh báo (lhWarn)
│   │   ├── mock.js           # Engine giả lập dữ liệu (?mock=1)
│   │   └── versionChecker.js # Kiểm tra phiên bản & hiện banner cập nhật
│   ├── student/              # Giao diện & Logic Sinh viên
│   │   ├── state.js          # Quản lý 18 biến state dùng chung (LHState)
│   │   ├── format.js         # Hàm format dữ liệu, escaped string
│   │   ├── images.js         # Xử lý ảnh & Upload Cloudinary / Clipboard
│   │   ├── subjectGate.js    # Cổng chọn môn, Folder Drilldown, cờ NEW
│   │   ├── library.js        # Thư viện câu hỏi & Tìm kiếm
│   │   ├── editor.js         # Form sửa câu hỏi & Báo cáo lỗi
│   │   ├── exam.js           # Logic tab Kiểm tra & Bảng kết quả
│   │   ├── appCore.js        # Core runner chính cho học viên
│   │   └── main.js           # Entry point đóng gói ra app.js
│   └── admin/                # Giao diện & Logic Admin Dashboard
│       ├── adminCore.js      # Core runner trang Admin
│       └── main.js           # Entry point đóng gói ra admin.js
├── api/                      # Serverless Edge API (chạy trên Vercel Edge)
│   ├── index.js              # Router API chính
│   ├── controllers/          # Trình xử lý API endpoints
│   │   ├── admin.js          # Dashboard & Admin actions
│   │   ├── editRequests.js   # Quản lý yêu cầu sửa câu hỏi
│   │   ├── notify.js         # Đếm thông báo & Discord trigger
│   │   ├── profile.js        # Thông tin người dùng & Quyền hạn
│   │   ├── questions.js      # Lấy dữ liệu câu hỏi (có server cache)
│   │   └── subjects.js       # Quản lý danh sách môn học
│   └── lib/                  # Thư viện server (Turso client, Auth, Discord)
├── docs/                     # Tài liệu kiến trúc & Kiểm thử
│   ├── BLOCK_MAP.md          # Bản đồ chi tiết vị trí các block mã nguồn
│   ├── BUG_REPORT.md         # Mẫu báo cáo lỗi tiêu chuẩn
│   ├── OVERRIDES_BASELINE.json# Mốc kiểm tra lớp ghi đè hàm
│   ├── REMOVED_20260729.md   # Lịch sử lưu trữ các đoạn code đã dọn dẹp
│   └── SPLIT_PLAN.md         # Kế hoạch chi tiết tái cấu trúc & tách module
├── scripts/                  # Bộ script hỗ trợ phát triển & đóng gói
│   ├── build.js              # Script build đóng gói sản phẩm ra app.js / admin.js / dist/
│   ├── dev-server.js         # Local dev server giả lập Vercel Edge API
│   ├── inspect-db.js         # Kiểm tra cấu trúc & dữ liệu Turso DB
│   ├── migrate-seed.js       # Nạp dữ liệu câu hỏi mẫu vào DB
│   └── find-function.js      # Script tìm kiếm hàm đang SỐNG (npm run find)
├── index.html                # Trang chủ ứng dụng chính (Student Interface)
├── admin.html                # Trang quản trị (Admin Dashboard)
├── landing.html              # Landing page giới thiệu
├── config.js                 # Cấu hình Client (Supabase URL, Cloudinary Preset)
├── turso_schema.sql          # Schema cơ sở dữ liệu SQLite / Turso
├── vercel.json               # Cấu hình routing & Edge deployment Vercel
└── package.json              # Dependencies & npm scripts
```

---

## 🔑 Cấu hình biến môi trường

Tạo file `.env` (hoặc khai báo trên Vercel Environment Variables) với thông số sau:

```env
# Kết nối cơ sở dữ liệu Turso (libSQL)
TURSO_DATABASE_URL=libsql://<your-database-name>.<region>.turso.io
TURSO_AUTH_TOKEN=<your-turso-auth-token>

# Tài khoản Admin hệ thống (Phân cách bằng dấu phẩy nếu có nhiều email)
ADMIN_EMAIL=admin@example.com
SYSTEM_ADMIN_EMAILS=admin@example.com,superadmin@example.com

# Discord Webhook (Thông báo hệ thống real-time)
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...

# Supabase Auth Configuration
SUPABASE_URL=https://<your-project-id>.supabase.co
SUPABASE_ANON_KEY=<your-supabase-anon-key>

# Port tùy chọn khi chạy local dev server (Mặc định: 3000)
PORT=3000
```

> ⚠️ **Lưu ý bảo mật:** Không commit file `.env` lên Git repository công khai.

---

## 💻 Hướng dẫn cài đặt & Chạy ứng dụng

### 1. Cài đặt môi trường
Yêu cầu Node.js (phiên bản 18+). Cài đặt dependencies:
```bash
npm install
```

### 2. Chạy ứng dụng ở môi trường Local (Development)
Khởi chạy local dev server kết hợp API routing giả lập Edge:
```bash
npm run dev
```
Ứng dụng sẽ chạy tại: `http://localhost:3000`.

### 3. Biên dịch & Đóng gói sản phẩm (Build)
```bash
npm run build
```
Lệnh này sẽ dùng `esbuild` đóng gói mã nguồn từ `src/` thành `app.js`, `admin.js` và xuất thư mục `dist/`.

---

## 🗄 Khởi tạo & Quản lý Cơ sở dữ liệu

Khi tạo cơ sở dữ liệu Turso mới:

1. **Khởi tạo Schema bảng:**
   ```bash
   turso db shell <your-db-name> < turso_schema.sql
   ```

2. **Nạp dữ liệu câu hỏi mẫu (Seed Data):**
   ```bash
   node scripts/migrate-seed.js
   ```

3. **Kiểm tra trạng thái kết nối & bản ghi DB:**
   ```bash
   node scripts/inspect-db.js
   ```

---

## 🗺️ Kế hoạch phát triển & Tối ưu hóa (Roadmap & Plans)

Dưới đây là bảng tổng hợp các hạng mục đã hoàn tất và lộ trình phát triển tiếp theo của dự án **Learning Hub**:

### ✅ Đã hoàn thành (Completed Milestones)

- [x] **Tái cấu trúc mã nguồn (Split Plan Bước 1 - 4):**
  - Tách thành công `appCore.js` từ 14.9k dòng xuống 10.3k dòng (−31%).
  - Trích xuất 7 module chuyên biệt: `state.js`, `exam.js`, `editor.js`, `library.js`, `subjectGate.js`, `images.js`, `format.js`.
- [x] **Hệ thống Upload ảnh Cloudinary nâng cao:**
  - Hỗ trợ chọn file ảnh và dán ảnh trực tiếp từ Clipboard (`Ctrl+V`) trong form sửa câu hỏi.
- [x] **Hệ thống Thông báo Discord Webhook 9 loại:**
  - Tích hợp 9 loại sự kiện kèm giao diện bật/tắt công tắc tùy chỉnh trong trang Admin.
- [x] **Hệ thống Phân quyền Admin 2 Cấp:**
  - Phân biệt Admin Hệ thống (Chip tím, quản lý cấu hình Discord) và Regular Admin / Editor (Chip vàng).
- [x] **Cổng chọn môn Folder Drilldown & Cờ NEW:**
  - Tự động nhóm các môn cùng mã gốc thành thư mục, hỗ trợ cờ NEW riêng biệt cho thư mục.
- [x] **Tối ưu hóa lượt truy vấn Turso DB:**
  - Chuyển logic làm bài sang 100% Client-side. Tăng chu kỳ polling chuông lên 5 phút giúp giảm 99% DB reads.
- [x] **Hệ thống Banner Nhắc tải lại (`reload_notice`):**
  - Thông báo cập nhật real-time mượt mà không làm đứt phiên làm bài của sinh viên.
- [x] **Bộ công cụ Developer Tooling & Test Offline:**
  - Phát triển chế độ `?mock=1` test UI không cần DB. Thêm các lệnh check `npm run find`, `check:overrides`, `check:catch`.

### 🔄 Kế hoạch Đang thực hiện & Sắp tới (Current & Upcoming Roadmap)

- [x] **Kế hoạch Tách Module Giai đoạn 5 (Split Plan Step 5):** — xong 20260731.
  - Đã tách "Thêm môn học mới" + "Xem trước / Import đề thi AI" sang `src/student/subjectImport.js`,
    cùng `subjects.js`, `search.js`, `auth.js`, `bookmarks.js`, `flashcards.js`.
  - Vượt mục tiêu: `appCore.js` còn **2.773 dòng** (mục tiêu là dưới 7.000).
- [x] **Chuẩn hóa Module Quản lý & Lọc Ảnh (`cleanImages`):** — xong 20260731 (`GLOBALS_BRIDGE_20260731`).
  - `cleanImages` phơi ra `window.cleanImages` (bản thật ở `subjects.js`), 3 chỗ gọi đã đi qua cầu nối.
    Thêm `npm run check:globals` để chặn cầu nối đứt quay lại.
- [x] **Đồng bộ Header Counter State:** — đo lại 20260731, không còn tái hiện.
  - `?mock=1`: tab Flashcard ra "Câu 1 / 4", tab Thư viện ra "4 câu" đúng bằng số mục được vẽ.
    Nguyên nhân cũ (`rebuild()` xoá trắng `RAW`/`pool`) đã sửa ở `REBUILD_DEAD_LOCAL_20260731`.
- [x] **Gộp đường lưu của form sửa câu hỏi:** — xong 20260731 (`EDIT_SAVE_SINGLE_PATH_20260731`).
  - Nút "Lưu trực tiếp" từng có 2 đường lưu; đường capture trong `images.js` cướp cú bấm rồi
    bail lặng (nó cần Supabase client vốn đã bỏ từ khi chuyển sang Turso). Nay chỉ còn
    `saveEditPreview` — một nút, một đường lưu.
- [ ] **Nâng cấp AI Question Import Parser:**
  - Bổ sung bộ Parser hỗ trợ nhận diện các định dạng đề thi mới (Markdown, JSON nâng cao, Quizlet export) thông qua Prompt AI (Gemini/Claude).
- [ ] **PWA & Hỗ trợ Học Offline (Progressive Web App):**
  - Tích hợp Service Worker caching tài nguyên tĩnh và ngân hàng câu hỏi môn đang học, cho phép sinh viên lật thẻ flashcard và ôn tập ngay cả khi mất kết nối mạng.
- [ ] **Báo cáo Thống kê Kết quả Học tập (Student Analytics):**
  - Lưu biểu đồ tiến độ làm bài, tỷ lệ câu đúng/sai theo từng môn học và đề xuất câu hỏi cần ôn luyện lại.

---

## ☁️ Triển khai (Deployment)

Dự án được cấu hình tối ưu sẵn để triển khai lên **Vercel**:

1. Đẩy mã nguồn dự án lên GitHub repository.
2. Import dự án vào [Vercel Dashboard](https://vercel.com).
3. Trong mục **Environment Variables**, điền đầy đủ các thông số cấu hình từ file `.env`.
4. Nhấn **Deploy**. Vercel sẽ tự động chạy lệnh `npm run build` theo cấu hình trong `vercel.json` và triển khai API dưới dạng **Vercel Edge Functions**.

---

📅 *Cập nhật lần cuối: Tháng 7/2026*
