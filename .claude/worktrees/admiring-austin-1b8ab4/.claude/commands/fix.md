---
description: Sửa một lỗi trong Learning Hub theo đúng thứ tự đỡ tốn token nhất
argument-hint: <mô tả lỗi, hoặc tên block / tên hàm>
---

Sửa lỗi này: **$ARGUMENTS**

Làm đúng thứ tự dưới đây. Mục đích của thứ tự này là **không đọc file 14.9k dòng** trừ khi
bắt buộc — mỗi bước dưới đây loại bỏ một nhóm nguyên nhân bằng một lệnh ngắn.

## 1. Khoanh vùng trước khi đọc code

- Nếu người dùng chưa cho `lhErrors()`: hỏi ngay, kèm link `docs/BUG_REPORT.md`. **Đừng đoán**
  bằng cách đọc code — tag lỗi chính là tên block, tra một bảng là xong.
- Nếu đã có tên block hoặc tên hàm: chạy `npm run find <tênHàm>` **trước tiên**. Nó in mọi
  chỗ gán kèm `● SỐNG` cho bản đang chạy (tính cả `setTimeout(apply, 900)`).
- Cần bức tranh tổng thì mở `docs/BLOCK_MAP.md`, không mở `appCore.js`.

## 2. Loại ba nguyên nhân "không phải lỗi code" trước khi sửa

- **Ghi đè:** bản đang chạy không phải bản mình tưởng → xem output `npm run find`.
  Đây là nguyên nhân số 1 của kiểu lỗi "sửa rồi mà không có tác dụng".
- **Cache:** dữ liệu không chịu mới → 3 tầng cache trong `CLAUDE.md`;
  `clearLearningHubQuestionCache(); location.reload()`.
- **Quyết định sản phẩm:** xem mục *Quyết định sản phẩm* trong `CLAUDE.md` — có thứ là cố ý bỏ,
  đừng "sửa lại" thành bug (ví dụ app học sinh không có nút xóa câu).

## 3. Sửa

- Chỉ sửa trong `src/`. **Sửa vào bản ĐANG CHẠY**, không thêm block mới (quy tắc số 3).
- Chỉ đọc đúng vùng dòng mà `npm run find` chỉ ra, đừng đọc cả file.
- `catch` phải có `lhWarn('TÊN_BLOCK', e)`.
- Ghi dữ liệu thì qua `POST /api/admin-action`, không ghi thẳng Supabase.

## 4. Kiểm tra — chạy đủ bốn lệnh

```
npm run build
npm run format
npm run check:catch
npm run check:overrides
```

`check:overrides` báo đỏ nghĩa là đã vô tình thêm một lớp ghi đè mới — quay lại bước 3 và
sửa vào bản đang chạy thay vì thêm lớp. Nếu thêm/xóa block thì chạy thêm `npm run map`.

## 5. Xác nhận bằng app thật

Mở preview, hard refresh (`app.js?v=` cache rất dai), thao tác lại đúng các bước người dùng
mô tả, và kiểm `lhErrors()` phải rỗng. Nếu lỗi thuộc luồng sửa câu hỏi / upload ảnh thì
**phải test khi đã đăng nhập** — luồng đó dính Cloudinary + `/api/admin-action`.

## 6. Ghi lại nếu là bẫy mới

Bẫy mới, hoặc nguyên nhân mất hơn một vòng mới tìm ra → thêm một dòng vào mục *Bẫy đã gặp thật*
trong `CLAUDE.md`. Lần sau đỡ mất vòng đó.
