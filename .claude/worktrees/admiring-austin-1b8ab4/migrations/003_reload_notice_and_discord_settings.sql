-- Migration 003 (20260729)
-- 1. reload_notice: thay cho force_logout. Admin không đá người dùng ra nữa, chỉ nhắc họ
--    tải lại trang để lấy bản mới (giống hệt banner "Có phiên bản mới" khi deploy).
--    Cờ DÙNG MỘT LẦN: /api/profile đọc xong reset ngay về 0.
-- 2. discord_notifications: bật/tắt từng loại thông báo Discord từ trang admin.
--    Chỉ admin hệ thống được đổi (xem api/lib/auth.js: isSystemAdmin).

ALTER TABLE profiles ADD COLUMN reload_notice INTEGER DEFAULT 0;

INSERT INTO site_settings (key, value)
VALUES ('discord_notifications', '{"login":true,"action":true,"edit_request":true}')
ON CONFLICT(key) DO NOTHING;
