---
title: Token và JWT
chapter: Xác thực
summary: Xác thực không trạng thái cho ứng dụng di động và API.
duration: 15
---
## Bearer token

Ứng dụng di động hoặc dịch vụ khác thường gửi token trong header:

```text
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOjQyfQ.k3…
```

## JWT gồm 3 phần

`header.payload.signature`, mỗi phần mã hóa base64url:

- **header**: thuật toán ký, ví dụ HS256.
- **payload**: dữ liệu như `{ "sub": 42, "role": "student", "exp": 1767225600 }`.
- **signature**: chữ ký bằng khóa bí mật của máy chủ, chống sửa payload.

Payload chỉ được **mã hóa base64**, ai cũng đọc được, nên **không** đặt mật khẩu hay dữ liệu nhạy cảm vào đó.

```code javascript
@instructions Payload JWT là base64url của chuỗi JSON. Giải mã payload của token bên dưới và in ra giá trị `role`. Gợi ý: `atob` giải mã base64, cần đổi `-` thành `+` và `_` thành `/` trước.
@starter
const token = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOjQyLCJyb2xlIjoic3R1ZGVudCJ9.chu-ky'
@solution
const token = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOjQyLCJyb2xlIjoic3R1ZGVudCJ9.chu-ky'
const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
console.log(JSON.parse(atob(payload)).role)
@expected
student
```

```quiz test
? Vì sao không nên lưu mật khẩu trong payload JWT?
- Payload quá nhỏ
* Payload chỉ mã hóa base64, ai có token cũng đọc được
- JWT không cho phép chuỗi
> Chữ ký chỉ chống sửa, không che giấu nội dung.
? Chữ ký của JWT dùng để làm gì?
* Phát hiện payload bị sửa
- Mã hóa payload
- Nén token
> Sửa payload thì chữ ký không còn khớp với khóa bí mật của máy chủ.
```

## Tổng kết

```flashcard
Authorization: Bearer :: Header gửi token cho API
JWT :: header.payload.signature
exp :: Thời điểm token hết hạn
Chữ ký JWT :: Chống sửa payload, không che giấu nội dung
```
