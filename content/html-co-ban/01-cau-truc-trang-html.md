---
title: Cấu trúc một trang HTML
chapter: Làm quen với HTML
summary: Thẻ, thuộc tính và bộ khung chuẩn của mọi trang web.
duration: 12
preview: true
---
## Thẻ và thuộc tính

HTML được viết bằng các **thẻ** đặt trong dấu `< >`. Phần lớn thẻ đi theo cặp mở và đóng, nội dung nằm ở giữa:

```html
<p class="note">Xin chào HTML!</p>
```

- `p` là tên thẻ (đoạn văn).
- `class="note"` là **thuộc tính**, cung cấp thêm thông tin cho thẻ.
- Một số thẻ không có nội dung nên không cần thẻ đóng, ví dụ `<img>`, `<br>`, `<input>`.

```quiz quick
? Trong `<a href="/home">Trang chủ</a>`, phần nào là thuộc tính?
- a
* href="/home"
- Trang chủ
> Thuộc tính nằm trong thẻ mở, dạng tên="giá trị".
```

## Bộ khung chuẩn

Mọi trang HTML nên có bộ khung sau:

```html
<!doctype html>
<html lang="vi">
  <head>
    <meta charset="UTF-8">
    <title>Trang đầu tiên</title>
  </head>
  <body>
    <h1>Xin chào!</h1>
  </body>
</html>
```

- `<head>` chứa thông tin cho trình duyệt (bộ mã ký tự, tiêu đề tab), không hiện lên trang.
- `<body>` chứa mọi thứ người dùng nhìn thấy.
- `lang="vi"` giúp trình đọc màn hình đọc đúng tiếng Việt.

```quiz quick
? Nội dung hiển thị trên trang đặt trong thẻ nào?
- head
* body
- title
> head dành cho thông tin của trang, body mới là phần hiển thị.
```

## Tổng kết

```flashcard
<!doctype html> :: Khai báo trang dùng chuẩn HTML5
<head> :: Thông tin trang: bộ mã, tiêu đề, CSS
<body> :: Nội dung hiển thị cho người dùng
Thuộc tính :: Thông tin thêm cho thẻ, dạng tên="giá trị"
```
