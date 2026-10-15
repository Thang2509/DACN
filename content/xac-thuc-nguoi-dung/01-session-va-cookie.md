---
title: Session và cookie
chapter: Xác thực
summary: Cách máy chủ ghi nhớ người đã đăng nhập.
duration: 12
preview: true
---
## HTTP không nhớ gì

Mỗi request là độc lập. Sau khi bạn đăng nhập, máy chủ cần một cách để nhận ra bạn ở các request sau.

## Session + cookie

1. Người dùng gửi email, mật khẩu.
2. Máy chủ kiểm tra, tạo **session** (lưu ở máy chủ) và gửi về cookie chứa mã session.
3. Trình duyệt tự gửi cookie đó kèm mọi request sau.

```text
Set-Cookie: session_id=ab12…; HttpOnly; Secure; SameSite=Lax
```

| Cờ | Tác dụng |
| --- | --- |
| `HttpOnly` | JavaScript không đọc được cookie, giảm hậu quả XSS |
| `Secure` | chỉ gửi qua HTTPS |
| `SameSite=Lax` | hạn chế gửi cookie từ trang khác, giảm nguy cơ CSRF |

EduQuest dùng Laravel Sanctum theo kiểu cookie này cho ứng dụng React chạy cùng tên miền.

```quiz quick
? Cờ nào ngăn JavaScript đọc cookie phiên đăng nhập?
* HttpOnly
- Secure
- SameSite
> HttpOnly khiến document.cookie không thấy cookie đó.
```

## Tổng kết

```flashcard
Session :: Dữ liệu đăng nhập lưu ở máy chủ, nhận diện bằng mã
HttpOnly :: JavaScript không đọc được cookie
Secure :: Cookie chỉ gửi qua HTTPS
SameSite :: Hạn chế gửi cookie từ trang khác (chống CSRF)
```
