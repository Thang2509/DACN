---
title: CSRF và CORS
chapter: Trình duyệt
summary: Giả mạo request từ trang khác và chính sách chia sẻ tài nguyên.
duration: 15
---
## CSRF

Bạn đang đăng nhập ngân hàng. Một trang độc hại có form ẩn tự gửi tới `bank.vn/transfer`. Trình duyệt **tự kèm cookie** của bạn, ngân hàng tưởng chính bạn chuyển tiền.

Phòng chống:

- **CSRF token**: máy chủ phát mã ngẫu nhiên, form phải gửi kèm; trang khác không đọc được mã này.
- Cookie `SameSite=Lax` hoặc `Strict`.
- Thao tác thay đổi dữ liệu không dùng GET.

Laravel Sanctum (EduQuest dùng) gọi `/sanctum/csrf-cookie` để nhận token rồi gửi lại trong header `X-XSRF-TOKEN`.

## CORS

Trình duyệt mặc định **chặn** JavaScript ở `a.com` đọc phản hồi từ `api.b.com` (same-origin policy). Máy chủ B phải cho phép rõ ràng:

```text
Access-Control-Allow-Origin: https://a.com
Access-Control-Allow-Credentials: true
```

Không đặt `*` kèm cho phép cookie: mọi trang web đều gọi được API bằng phiên của người dùng.

```quiz test
? Vì sao CSRF tấn công được dù kẻ xấu không biết cookie của bạn?
* Trình duyệt tự gửi cookie kèm request tới trang đích
- Kẻ xấu đánh cắp được cookie
- Do máy chủ không dùng HTTPS
> Kẻ tấn công không cần đọc cookie, chỉ cần khiến trình duyệt gửi request.
? CORS do ai thực thi?
- Máy chủ API chặn request
* Trình duyệt chặn JavaScript đọc phản hồi không được phép
- Tường lửa
> Header CORS là máy chủ cho phép, trình duyệt mới là bên thực thi.
```

## Tổng kết

```flashcard
CSRF :: Trang khác lợi dụng cookie để gửi request thay bạn
CSRF token :: Mã ngẫu nhiên trang khác không đọc được
SameSite :: Hạn chế gửi cookie kèm request từ trang khác
CORS :: Máy chủ cho phép nguồn nào đọc phản hồi, trình duyệt thực thi
```
