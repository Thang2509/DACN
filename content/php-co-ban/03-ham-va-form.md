---
title: Hàm và xử lý form
chapter: PHP trên web
summary: Viết hàm có kiểu, nhận dữ liệu POST và chống XSS.
duration: 15
---
## Hàm

```php
<?php
function finalPrice(int $price, int $discountPercent = 0): int
{
    return $price - intdiv($price * $discountPercent, 100);
}

echo finalPrice(200000, 10);   // 180000
```

Khai báo kiểu tham số và kiểu trả về giúp bắt lỗi sớm, giống TypeScript.

## Nhận dữ liệu form

```php
<?php
// form gửi bằng method="post", ô nhập name="email"
$email = trim($_POST['email'] ?? '');

if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo 'Email không hợp lệ';
    exit;
}
echo 'Đã nhận: ' . htmlspecialchars($email);
```

- `$_GET` chứa tham số trên URL, `$_POST` chứa dữ liệu form gửi lên.
- `??` trả về giá trị mặc định khi khóa không tồn tại.
- **Không bao giờ** in thẳng dữ liệu người dùng: `htmlspecialchars` đổi `<` thành `&lt;` để chống chèn mã (XSS).

```quiz test
? Biến nào chứa dữ liệu form gửi bằng method="post"?
- $_GET
* $_POST
- $_FORM
> $_POST là mảng siêu toàn cục chứa dữ liệu POST.
? Vì sao cần `htmlspecialchars` khi in dữ liệu người dùng?
- Để chữ đẹp hơn
* Để thẻ HTML/JS người dùng nhập không bị chạy
- Để đổi sang chữ thường
> Đây là cách chống lỗi XSS cơ bản.
? `$x = $_GET['page'] ?? 1;` khi URL không có page thì $x bằng gì?
* 1
- null
- Báo lỗi
> Toán tử ?? trả về vế phải khi vế trái không tồn tại hoặc null.
```

## Tổng kết

```flashcard
function f(int $x): int :: Hàm có khai báo kiểu tham số và trả về
$_POST['ten'] :: Dữ liệu form gửi lên theo name
a ?? b :: Lấy a, nếu không có thì b
htmlspecialchars :: Mã hóa ký tự HTML, chống XSS
```
