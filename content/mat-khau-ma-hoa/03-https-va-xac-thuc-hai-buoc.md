---
title: HTTPS và xác thực hai bước
chapter: Bảo vệ người dùng
summary: TLS bảo vệ đường truyền, 2FA bảo vệ tài khoản.
duration: 12
---
## HTTPS

HTTPS = HTTP chạy trên **TLS**. Trình duyệt và máy chủ dùng mã hóa bất đối xứng để thỏa thuận một khóa phiên, rồi mã hóa đối xứng toàn bộ dữ liệu.

- Chứng chỉ do tổ chức tin cậy cấp (Let's Encrypt miễn phí) chứng minh bạn đang nói chuyện đúng máy chủ.
- Không có HTTPS, người cùng mạng Wi-Fi đọc được mật khẩu, cookie.
- Bật **HSTS** để trình duyệt luôn dùng HTTPS.

## Xác thực hai bước (2FA)

Ngoài mật khẩu (thứ bạn **biết**), cần thêm thứ bạn **có**:

- Mã 6 số từ ứng dụng xác thực (TOTP), đổi mỗi 30 giây.
- Khóa bảo mật phần cứng, passkey.
- SMS (kém an toàn nhất vì có thể bị chiếm SIM).

## Chính sách mật khẩu hợp lý

- Ưu tiên **độ dài** (từ 12 ký tự) hơn quy tắc phức tạp.
- Chặn mật khẩu đã bị lộ trong các vụ rò rỉ.
- Khuyến khích dùng trình quản lý mật khẩu.

```quiz test
? HTTPS bảo vệ khỏi mối nguy nào?
* Kẻ nghe lén trên đường truyền đọc được dữ liệu
- SQL injection
- Mật khẩu yếu
> TLS mã hóa đường truyền; các lỗi trong ứng dụng vẫn phải tự phòng chống.
? Phương thức 2FA nào kém an toàn nhất?
- Ứng dụng xác thực TOTP
- Khóa bảo mật phần cứng
* Mã qua SMS
> SMS có thể bị chặn hoặc chiếm SIM.
? Mật khẩu nào mạnh hơn?
- P@ss1!
* hoc-lap-trinh-moi-ngay-cung-thu-cung
> Độ dài quan trọng hơn ký tự đặc biệt.
```

## Tổng kết

```flashcard
TLS :: Giao thức mã hóa đường truyền của HTTPS
HSTS :: Buộc trình duyệt luôn dùng HTTPS
2FA :: Thêm yếu tố thứ hai ngoài mật khẩu
TOTP :: Mã 6 số đổi mỗi 30 giây từ ứng dụng xác thực
```
