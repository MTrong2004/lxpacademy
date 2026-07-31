# Mẫu báo lỗi — dán vào chat khi nhờ AI sửa

Mục đích: bỏ hẳn khâu dò tìm. Có đủ 5 mục dưới đây thì AI vào sửa được ngay;
thiếu thì phải đọc file 14.9k dòng để đoán — đó là chỗ tốn token nhất.

Copy khối này, điền, dán:

```
1. TRANG:        học sinh (index.html) | admin (admin.html)   — tab nào: Flashcard/Kiểm tra/Thư viện
2. THAO TÁC:     bấm gì, theo thứ tự nào (3–4 bước là đủ)
3. lhErrors():   <dán nguyên output — mở Console (F12), gõ lhErrors() rồi Enter>
4. MONG ĐỢI:     đáng ra phải ra gì
   THỰC TẾ:      đang ra gì
5. ẢNH:          kéo ảnh chụp màn hình vào chat (nếu là lỗi hiển thị/CSS)
```

## Vì sao 5 mục này

| Mục | Thay cho việc gì |
|---|---|
| 1 + 2 | Khoanh vùng còn 1–2 block thay vì cả file |
| 3 `lhErrors()` | Tag lỗi **chính là tên block** trong `BLOCK_MAP.md` → tra 1 bảng, không dò code |
| 4 | Phân biệt "lỗi thật" với "quyết định sản phẩm" (xem mục Quyết định sản phẩm trong CLAUDE.md) |
| 5 | Lỗi CSS mô tả bằng lời luôn phải hỏi lại nhiều vòng |

## Vài mục 3 hay gặp và ý nghĩa

- `lhErrors()` **rỗng** mà UI vẫn sai → không phải lỗi JS ném ra. Thường là **ghi đè**
  (bản hàm đang chạy không phải bản bạn nghĩ) hoặc **cache**. Chạy `npm run find <tênHàm>`
  để xem bản nào sống, và `clearLearningHubQuestionCache(); location.reload()` để loại cache.
- Lỗi có tag tên block → dán luôn tên block đó, đỡ một vòng tra bảng.
- Dữ liệu "không chịu mới" → đọc mục *3 tầng cache câu hỏi* trong `CLAUDE.md` trước khi báo.
- `401` / `403` / `500` từ `/api/*` có nghĩa cố định — xem mục *Mã lỗi API* trong `CLAUDE.md`.
  Nói rõ mã nào, vì `500` KHÔNG phải là mất quyền.

## Nếu lỗi ở phía server

Mục 3 đổi thành: log của cửa sổ đang chạy `npm run dev` (hoặc log Vercel nếu lỗi trên bản deploy).
