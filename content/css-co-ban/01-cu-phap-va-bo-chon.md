---
title: Cú pháp và bộ chọn
chapter: Nền tảng CSS
summary: Viết quy tắc CSS và chọn đúng phần tử cần định dạng.
duration: 12
preview: true
---
## Một quy tắc CSS

```css
h1 {
  color: #5b43e6;
  font-size: 32px;
}
```

`h1` là **bộ chọn**, phần trong ngoặc nhọn là các **khai báo** `thuộc-tính: giá-trị;`.

## Các loại bộ chọn

```css
p { }            /* theo tên thẻ */
.note { }        /* theo class: <p class="note"> */
#menu { }        /* theo id: <nav id="menu"> */
nav a { }        /* thẻ a nằm trong nav */
a:hover { }      /* trạng thái: khi rê chuột */
```

## Độ ưu tiên

Khi nhiều quy tắc cùng áp vào một phần tử: **id > class > tên thẻ**. Nếu ngang nhau, quy tắc viết sau thắng.

```quiz predict
? `<p id="intro" class="note">` với `#intro { color: red }` và `.note { color: blue }`. Chữ màu gì?
* Đỏ
- Xanh
- Đen
> Bộ chọn id có độ ưu tiên cao hơn class.
```

## Tổng kết

```flashcard
.ten-class :: Chọn phần tử theo class
#ten-id :: Chọn phần tử theo id
nav a :: Chọn thẻ a nằm bên trong nav
Độ ưu tiên :: id > class > tên thẻ; bằng nhau thì cái viết sau thắng
```
