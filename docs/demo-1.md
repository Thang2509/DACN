# Kịch bản demo 1 (Đợt 2: 9–15/11)

## Chuẩn bị

1. Bật MySQL (XAMPP).
2. `cd backend && php artisan migrate:fresh --seed && php artisan serve`
3. `cd frontend && npm run dev`, mở http://localhost:5173

Tài khoản (mật khẩu đều là `password`): `hocvien@eduquest.test`, `giangvien@eduquest.test`, `admin@eduquest.test`.

## Luồng trình bày (~10 phút)

| # | Vai | Thao tác | Điểm cần nói |
| --- | --- | --- | --- |
| 1 | Khách | Trang chủ → lộ trình "Lập trình căn bản" | Khóa học thuộc lộ trình, có cấp độ và giá |
| 2 | Khách | Khóa học → gõ "cau truc", lọc Intermediate | Tìm không phân biệt dấu, bộ lọc nằm trên URL |
| 3 | Khách | Mở "JavaScript nền tảng" → Học thử | Bài học thử xem được khi chưa đăng nhập; đáp án quiz không gửi về trình duyệt |
| 4 | Học viên | Đăng nhập → "SQL cơ bản" → Đăng ký học miễn phí | Khóa có phí chỉ học thử (MoMo ở Đợt 3) |
| 5 | Học viên | Bài 1: làm quiz → Kiểm tra → Hoàn thành bài | Chấm ở máy chủ; phải trả lời hết quiz mới hoàn thành được |
| 6 | Học viên | Bấm "+ Ghi chú" ở một khối → lưu → mở trang Ghi chú | Ghi chú gắn khối / mốc video, bấm nhãn để quay lại đúng chỗ |
| 7 | Học viên | Bài "SELECT": viết `SELECT name, city FROM students;` → Chạy | SQL chạy trong trình duyệt bằng sql.js, tự so với lời giải |
| 8 | Giảng viên | Bài "Biến: let và const": chạy code đúng, rồi `while (true) {}` | JavaScript chạy trong iframe cách ly + Worker, tự dừng sau 3 giây |
| 9 | Giảng viên | CTDL → "Ngăn xếp", "Sắp xếp nổi bọt" | Hoạt ảnh SVG có tham số, chạy từng bước |
| 10 | Giảng viên | Giảng dạy → soạn bài → kéo-thả khối → "Xem như học viên" | Trình soạn 6 loại khối |
| 11 | Học viên | Học của tôi | Tiến độ từng khóa, nút học tiếp |
