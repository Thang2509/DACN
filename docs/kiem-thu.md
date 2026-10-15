# Kiểm thử (Đợt 4)

## Kiểm thử tự động

Chạy: `cd backend && php artisan test` (CSDL riêng `eduquest_test`) và `cd frontend && npm test`.

| Phần | Bộ test | Số test |
| --- | --- | --- |
| Backend (PHPUnit, 125 test / 613 khẳng định) | Tài khoản, hồ sơ, phân quyền quản trị | 18 |
| | Danh mục, quản lý khóa học, trình soạn khối, import Markdown | 29 |
| | Học bài, quiz, tiến độ | 15 |
| | Quy tắc thưởng R01–R12, ôn flashcard SM-2, huy hiệu, xếp hạng, kế hoạch, minigame | 26 |
| | Thú cưng, cửa hàng, phòng | 18 |
| | MoMo (giả lập phản hồi bằng `Http::fake`), cấu hình phần thưởng, thống kê | 16 |
| Frontend (Vitest, 110 test) | Chạy SQL/JS trong sandbox, hoạt ảnh, khối bài học, kéo thả | 22 |
| | Clip hoạt ảnh và vật liệu của 7 mô hình thú, lưới phòng và tìm đường, luật minigame, tính voucher | 88 |

Kiểm tra mã: `vendor/bin/pint --test` (định dạng PHP) và `npm run lint` (oxlint) đều sạch.

## Kiểm thử thủ công trên trình duyệt

Chạy bằng Edge headless điều khiển qua DevTools Protocol, ghi lỗi console ở từng bước.

| Luồng | Kết quả |
| --- | --- |
| Khách đăng ký → mở link xác thực email (từ `storage/logs/laravel.log`) | Đạt |
| Học viên đăng ký khóa miễn phí → trả lời quiz → hoàn thành bài → nhận XP/xu/huy hiệu → nhận trứng → mua đồ → ôn tập → đăng xuất | Đạt |
| Giảng viên tạo khóa → thêm chương, bài → soạn khối → gửi duyệt; quản trị viên duyệt → khóa hiện trong danh mục | Đạt |
| Mua khóa có phí qua MoMo sandbox (có voucher) → hủy trên trang MoMo → quay về, đơn "Không thành công", voucher còn nguyên | Đạt |
| 27 trang × 3 vai trò, cỡ 1280px và 375px: lỗi console, tràn ngang | Không lỗi, không tràn |

## Lỗi tìm thấy và đã sửa trong đợt này

| Lỗi | Cách sửa |
| --- | --- |
| Đăng xuất khi đang ở trang cần đăng nhập bị chuyển sang `/login` thay vì trang chủ | Đăng xuất xong tải lại trang chủ (xóa sạch dữ liệu người dùng cũ) |
| Thông báo lỗi khối nội dung hiện tên kỹ thuật "blocks.0.content.text" | Đặt tên trường tiếng Việt cho mọi trường khối và các form mới |
| Gửi duyệt được khóa có bài chưa có nội dung | Bắt buộc mọi bài có ít nhất 1 khối, báo đúng tên bài còn trống |
| Một trang lỗi làm trắng cả ứng dụng; máy không hỗ trợ WebGL thì cảnh 3D trống | Khung báo lỗi cho từng trang và cho từng cảnh 3D |
| Danh sách thú cưng truy vấn lặp theo từng con | Nạp sẵn loài và trang bị: 4 truy vấn bất kể số thú |

## Hiệu năng

- Gói JS tải đầu tiên: ~890 KB → ~310 KB (khoảng 95 KB nén gzip). three.js (~1 MB), CodeMirror và sql.js (~565 KB) chỉ tải khi mở trang cần dùng.
- Số truy vấn SQL mỗi API chính: 3–14, không tăng theo số dòng (trừ "Khóa học của tôi": khoảng 3 truy vấn mỗi khóa).
- Gửi điểm minigame giới hạn 20 lần/phút; đăng nhập, đăng ký, quên mật khẩu giới hạn 6 lần/phút.
