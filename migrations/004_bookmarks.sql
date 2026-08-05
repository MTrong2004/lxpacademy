-- BOOKMARK_SYNC_PER_PART_20260806
-- "Lưu câu 🔖" trước đây chỉ nằm trong localStorage nên máy tính và điện thoại không
-- thấy nhau, và khoá `lh_starred_v1_backup_all` bị ghi đè bằng danh sách của MÔN ĐANG MỞ
-- rồi hợp vào mọi môn khác — câu 5 lưu ở phần 1 hiện "đã lưu" ở cả phần 2.
--
-- Bảng này khoá theo (user_id, subject_code, q_key): mỗi HỌC PHẦN là một subject_code
-- riêng nên hai phần cùng mã gốc không còn dùng chung danh sách.
-- q_key giữ đúng định danh của client (`num_12`, `id_87`, `q_<40 ký tự đầu>`) để dữ liệu
-- cũ trong localStorage đẩy lên được mà không cần tra lại questions.id.

CREATE TABLE IF NOT EXISTS bookmarks (
  user_id TEXT NOT NULL,
  subject_code TEXT NOT NULL,
  q_key TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, subject_code, q_key)
);

-- Đường đọc duy nhất là "mọi bookmark của một người" (GET /api/bookmarks) nên chỉ cần
-- index theo user_id. PRIMARY KEY đã lo phần khử trùng lặp khi ghi.
--
-- ĐỪNG viết dấu chấm phẩy trong comment của file migration: `scripts/migrate.js` tách câu
-- bằng `split(';')` nên một dấu ; trong comment cắt đôi khối và phần sau nó không chạy.
-- Đã sập thật: câu CREATE INDEX dưới đây bị bỏ qua ở lần chạy đầu (SQL_PARSE_ERROR
-- "near PRIMARY") trong khi migration vẫn được đánh dấu là đã áp dụng.
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id);
