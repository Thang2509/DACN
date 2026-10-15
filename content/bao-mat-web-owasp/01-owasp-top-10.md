---
title: Tổng quan OWASP Top 10
chapter: Rủi ro phổ biến
summary: Mười nhóm rủi ro và ví dụ.
duration: 12
preview: true
---
## Các nhóm rủi ro (bản 2021)

| Mã | Nhóm | Ví dụ |
| --- | --- | --- |
| A01 | Kiểm soát truy cập hỏng | học viên sửa id trên URL để xem đơn hàng người khác |
| A02 | Lỗi mã hóa | lưu mật khẩu dạng thô, không dùng HTTPS |
| A03 | Chèn mã (Injection) | SQL injection, XSS |
| A04 | Thiết kế không an toàn | không giới hạn số lần đoán mã OTP |
| A05 | Cấu hình sai | bật chế độ debug trên production |
| A06 | Thành phần lỗi thời | dùng thư viện có lỗ hổng đã công bố |
| A07 | Lỗi xác thực | không khóa sau nhiều lần đăng nhập sai |
| A08 | Toàn vẹn phần mềm/dữ liệu | tin dữ liệu thanh toán không kiểm tra chữ ký |
| A09 | Thiếu ghi log, giám sát | bị tấn công mà không biết |
| A10 | SSRF | máy chủ tải URL do người dùng nhập, bị lợi dụng gọi vào mạng nội bộ |

```quiz quick
? Đổi `/orders/15` thành `/orders/16` và xem được đơn của người khác thuộc nhóm nào?
* Kiểm soát truy cập hỏng
- Chèn mã
- Lỗi mã hóa
> Máy chủ không kiểm tra đơn hàng có thuộc người đang đăng nhập hay không (IDOR).
```

## Tổng kết

```flashcard
OWASP Top 10 :: Danh sách 10 nhóm rủi ro bảo mật web phổ biến
A01 :: Kiểm soát truy cập hỏng, đứng đầu danh sách
IDOR :: Truy cập dữ liệu người khác bằng cách đổi id
A06 :: Dùng thư viện lỗi thời có lỗ hổng
```
