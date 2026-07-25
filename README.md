# 🎓 Learning Hub (LXP Academy)

> Nền tảng học tập và ôn luyện trắc nghiệm trực tuyến dành cho sinh viên, tích hợp hệ thống đóng góp & duyệt câu hỏi từ cộng đồng, quản lý môn học, phân quyền người dùng, theo dõi thiết bị & môn đang học thời gian thực, và tối ưu tiêu thụ cơ sở dữ liệu.

---

## 📑 Mục lục

- [Giới thiệu](#-giới-thiệu)
- [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
- [Tính năng nổi bật](#-tính-năng-nổi-bật)
- [Tối ưu tài nguyên & DB Reads](#-tối-ưu-tài-nguyên--db-reads)
- [Cấu trúc dự án](#-cấu-trúc-dự-án)
- [Cấu hình biến môi trường](#-cấu-hình-biến-môi-trường)
- [Hướng dẫn cài đặt & Chạy ứng dụng](#-hướng-dẫn-cài-đặt--chạy-ứng-dụng)
- [Khởi tạo & Quản lý Cơ sở dữ liệu](#-khởi-tạo--quản-lý-cơ-sở-dữ-liệu)
- [Triển khai (Deployment)](#-triển-khai-deployment)

---

## 🚀 Giới thiệu

**Learning Hub** là hệ thống luyện thi & quản lý ngân hàng câu hỏi trực tuyến được tối ưu cho tốc độ và trải nghiệm người dùng. Ứng dụng chạy hoàn toàn trên kiến trúc Serverless Edge, kết nối cơ sở dữ liệu phân tán Turso (libSQL) và xác thực người dùng qua Supabase Auth.

---

## 🛠 Công nghệ sử dụng

| Phân loại | Công nghệ / Thư viện | Mô tả |
| :--- | :--- | :--- |
| **Frontend** | HTML5, CSS3, Modern JavaScript (ES Modules) | Giao diện tùy chỉnh chuẩn UI/UX, hỗ trợ Dark Mode, Glassmorphic UI & Responsive. |
| **Authentication** | [Supabase Auth](https://supabase.com/docs/guides/auth) | Quản lý đăng nhập, cấp token xác thực `Bearer` an toàn. |
| **Media Storage** | [Cloudinary API](https://cloudinary.com/) | Upload và quản lý hình ảnh minh họa cho câu hỏi. |
| **Backend / API** | [Vercel Edge Functions](https://vercel.com/docs/functions/edge-functions) | API chạy tại Edge Runtime tối ưu độ trễ (`/api/index.js`). |
| **Database** | [Turso](https://turso.tech/) (`@libsql/client/web`) | Cơ sở dữ liệu SQLite Serverless phân tán toàn cầu. |
| **Bundler & Tools** | `esbuild`, Node.js | Đóng gói tài nguyên tĩnh (JavaScript, CSS) nhanh chóng. |
| **Integrations** | Discord Webhook | Gửi thông báo đăng nhập, xét duyệt tài khoản và nhật ký hoạt động Admin real-time. |

---

## ✨ Tính năng nổi bật

### 👨‍🎓 Dành cho Sinh viên / Học viên
- **Luyện tập trắc nghiệm:** Lựa chọn môn học (HOD102, MLN111, MLN122, AET102,...), thực hành câu hỏi chọn 1 hoặc chọn nhiều đáp án với phản hồi tức thì.
- **Chế độ Flashcard (Thẻ ghi nhớ):** Lật thẻ học nhanh, tùy chỉnh kích thước chữ, xáo trộn câu hỏi ngẫu nhiên và chọn chế độ lật 1x / 2x.
- **Thư viện Tra cứu & Tìm kiếm:** Tìm kiếm câu hỏi theo từ khóa, số câu `#câu`, hoặc đáp án đúng. Phân loại câu hỏi theo rủi ro sai sót (`low`, `medium`, `high`).
- **Đóng góp & Báo cáo:** Gửi yêu cầu chỉnh sửa đáp án/nội dung câu hỏi hoặc đề xuất bổ sung bộ môn mới.
- **Thông báo trạng thái:** Theo dõi trạng thái duyệt yêu cầu sửa câu hỏi trực tiếp qua biểu tượng Chuông thông báo (*Chờ duyệt / Đã duyệt / Từ chối*).

### 🛡 Dành cho Quản trị viên (Admin & Editor Dashboard)
- **Quản lý Người dùng SaaS Layout:**
  - Hiển thị danh sách người dùng gọn gàng theo phong cách Linear/Vercel (4 cột cân đối, không cuộn tràn màn hình).
  - **Theo dõi thời gian thực:** Hiển thị **Môn đang học** (Badge tên môn `📘 HOD102`) và **Thiết bị sử dụng** (`💻 Windows · Edge`, `📱 iOS · Safari`, `📱 Android · Chrome`).
  - Lọc / Tìm kiếm tức thì theo mã môn hoặc loại thiết bị ngay trên ô tìm kiếm Admin.
- **Xét duyệt Đăng ký:** Chế độ *Approval Mode* (Cần duyệt / Mở tự do / Đóng đăng ký). Cấp/gỡ quyền `admin`, `editor`, `user` hoặc chặn tài khoản vi phạm.
- **Duyệt Yêu cầu Sửa đổi (Edit Requests):** Xem so sánh chi tiết dạng **Diff Viewer** giữa dữ liệu cũ và dữ liệu đề xuất trước khi phê duyệt hoặc từ chối kèm lý do.
- **Quản lý Ngân hàng Câu hỏi & Môn học:** Thêm, sửa, xóa trực tiếp câu hỏi và môn học; lưu tự động lịch sử chỉnh sửa (`question_history`).
- **Import AI (AI Question Import Helper):** Bộ Prompt chuẩn chuyển đổi đề thi từ PDF/Word sang JSON thông qua AI (Gemini/ChatGPT/Claude) và import hàng loạt.
- **Thùng rác & Phôi phục (Trash & Restore):** Hỗ trợ khôi phục môn học hoặc câu hỏi đã xóa tạm thời.
- **Nhật ký Hoạt động (Admin Audit Logs):** Truy vết toàn bộ thao tác hệ thống và hỗ trợ xuất dữ liệu dạng JSON/CSV.

---

## ⚡ Tối ưu tài nguyên & DB Reads

Hệ thống được tối ưu hóa để tiêu thụ tối thiểu tài nguyên cơ sở dữ liệu **Turso (libSQL)**:
- **Client-Side Quiz Processing:** Khi học viên làm bài, đổi câu hỏi, lật thẻ flashcard,... **trình duyệt xử lý 100% bằng JavaScript** (0 Turso reads).
- **Tối ưu Polling Chuông thông báo:** Điều chỉnh chuông kiểm tra định kỳ mỗi **5 phút** (thay vì 3 giây), giúp **giảm 99% số lượt truy vấn ngầm** vào Turso DB (tiết kiệm hàng triệu Row Reads mỗi ngày).
- **Tự động thêm cột (Auto-Migration):** API tự động nâng cấp cấu hình bảng `profiles` trên Turso mà không cần thao tác SQL thủ công.

---

## 📁 Cấu trúc dự án

```text
lxpacademy/
├── api/
│   └── index.js              # Serverless Edge Function chính xử lý mọi API endpoints
├── public/                   # Thư mục tài nguyên tĩnh
├── scripts/                  # Bộ script hỗ trợ phát triển & đóng gói
│   ├── build.js              # Script build đóng gói sản phẩm ra dist/ bằng esbuild
│   ├── dev-server.js         # Local dev server giả lập Vercel & API Routing
│   ├── inspect-db.js         # Kiểm tra dữ liệu trong Turso DB
│   ├── migrate-seed.js       # Nạp dữ liệu câu hỏi mẫu vào DB
│   ├── preview-dist.js       # Preview bản build sản phẩm
│   ├── patch-admin-saas-layout.js # Script cập nhật giao diện Admin User SaaS
│   └── test-connection.js    # Kiểm tra kết nối tới Turso DB
├── index.html                # Trang chủ ứng dụng chính (Student Interface)
├── app.js                    # Logic xử lý giao diện sinh viên & chọn môn
├── app.css                   # Style chính cho giao diện sinh viên
├── admin.html                # Trang quản trị (Admin Dashboard)
├── admin.js                  # Logic giao diện quản trị & hiển thị user
├── admin.css                 # Style trang quản trị (SaaS User Table layout)
├── landing.js / landing.css  # Landing page
├── config.js                 # Cấu hình Client (Supabase URL, Cloudinary Preset,...)
├── turso_schema.sql          # Schema cơ sở dữ liệu SQLite / Turso
├── seed_questions_sqlite.sql # Dữ liệu khởi tạo câu hỏi mẫu
├── vercel.json               # Cấu hình routing & build cho Vercel Deployment
└── package.json              # Khai báo dependencies & npm scripts
```

---

## 🔑 Cấu hình biến môi trường

Tạo file `.env` (hoặc cấu hình trên Vercel Dashboard) với các biến môi trường sau:

```env
# Kết nối cơ sở dữ liệu Turso (libSQL)
TURSO_DATABASE_URL=libsql://<your-database-name>.<region>.turso.io
TURSO_AUTH_TOKEN=<your-turso-auth-token>

# Tài khoản Admin mặc định (Email sẽ tự động được cấp quyền Admin khi đăng ký)
ADMIN_EMAIL=your-admin-email@gmail.com

# Discord Webhook (Thông báo hệ thống real-time)
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...

# Supabase Configuration (Tùy chọn ghi đè cấu hình)
SUPABASE_URL=https://<your-project-id>.supabase.co
SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

> ⚠️ **Lưu ý bảo mật:** Không commit file `.env` chứa thông tin nhạy cảm lên Git repository công khai.

---

## 💻 Hướng dẫn cài đặt & Chạy ứng dụng

### 1. Cài đặt môi trường
Yêu cầu hệ thống đã cài đặt **Node.js** (phiên bản 18+ được khuyến nghị).

Cài đặt các gói phụ thuộc (dependencies):
```bash
npm install
```

### 2. Chạy ứng dụng ở môi trường Local (Development)
Chạy dev server địa phương kết hợp API routing:
```bash
npm run dev
```
Mặc định ứng dụng sẽ khởi chạy tại: `http://localhost:3000`.

### 3. Kiểm tra kết nối Database & Dữ liệu
- **Kiểm tra kết nối DB:**
  ```bash
  node scripts/test-connection.js
  ```
- **Xem thông tin bảng & đếm số lượng bản ghi:**
  ```bash
  node scripts/inspect-db.js
  ```

### 4. Đóng gói cho Production (Build)
```bash
npm run build
```
Sản phẩm đóng gói sẽ được tạo ra tại thư mục `dist/`. Để chạy thử bản build:
```bash
node scripts/preview-dist.js
```

---

## 🗄 Khởi tạo & Quản lý Cơ sở dữ liệu

Nếu bạn khởi tạo một cơ sở dữ liệu Turso mới:

1. **Khởi tạo Schema bảng:**
   Nạp file `turso_schema.sql` vào Turso Database của bạn thông qua Turso CLI:
   ```bash
   turso db shell <your-db-name> < turso_schema.sql
   ```

2. **Nạp dữ liệu câu hỏi mẫu (Seed Data):**
   ```bash
   node scripts/migrate-seed.js
   ```

---

## ☁️ Triển khai (Deployment)

Dự án đã được cấu hình tối ưu sẵn cho **Vercel**:

1. Đẩy mã nguồn dự án lên GitHub / GitLab.
2. Import dự án vào [Vercel](https://vercel.com).
3. Trong mục **Environment Variables**, điền đầy đủ các thông tin cấu hình từ file `.env`.
4. Nhấn **Deploy**. Vercel sẽ tự động chạy lệnh `npm run build` theo cấu hình trong `vercel.json` và triển khai API dưới dạng **Edge Function**.

---

📅 *Cập nhật lần cuối: Tháng 7/2026*
