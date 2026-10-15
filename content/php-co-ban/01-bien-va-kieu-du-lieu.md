---
title: Biến và kiểu dữ liệu
chapter: Cú pháp PHP
summary: Thẻ PHP, biến có dấu $, chuỗi và nối chuỗi.
duration: 12
preview: true
---
## Chạy PHP

Code PHP nằm giữa `<?php` và `?>`, được máy chủ chạy rồi gửi **kết quả HTML** về trình duyệt. Với XAMPP, đặt file trong `htdocs` và mở `http://localhost/ten-file.php`.

```php
<?php
$name = 'An';          // biến luôn bắt đầu bằng $
$age = 20;             // số nguyên
$score = 8.5;          // số thực
$passed = true;        // logic

echo "Xin chào $name, bạn $age tuổi";   // chuỗi nháy kép thay biến vào
echo 'Xin chào $name';                  // nháy đơn giữ nguyên chữ $name
echo 'Điểm: ' . $score;                 // nối chuỗi bằng dấu chấm
```

```quiz predict
? `$name = 'Bình'; echo 'Chào $name';` in ra gì?
- Chào Bình
* Chào $name
- Lỗi cú pháp
> Chuỗi nháy đơn không thay giá trị biến vào.
```

## So sánh

PHP có `==` (so sánh lỏng, tự đổi kiểu) và `===` (so sánh cả kiểu). Luôn ưu tiên `===`.

```php
var_dump('1' == 1);   // bool(true)
var_dump('1' === 1);  // bool(false)
```

```quiz quick
? Toán tử nối chuỗi trong PHP là gì?
- +
* .
- &
> PHP dùng dấu chấm để nối chuỗi, dấu + chỉ để cộng số.
```

## Tổng kết

```flashcard
$bien :: Mọi biến PHP bắt đầu bằng dấu $
"Chào $name" :: Nháy kép thay giá trị biến vào chuỗi
. (dấu chấm) :: Nối chuỗi
=== :: So sánh cả giá trị lẫn kiểu
```
