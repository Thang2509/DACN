---
title: Thiết kế responsive
chapter: Thích ứng màn hình
summary: Media query và cách làm mobile-first.
duration: 12
---
## Thẻ viewport

```html
<meta name="viewport" content="width=device-width, initial-scale=1">
```

Thiếu thẻ này, điện thoại sẽ thu nhỏ cả trang máy tính lại và chữ bé tí.

## Media query

```css
.cards { display: grid; grid-template-columns: 1fr; }

@media (min-width: 768px) {
  .cards { grid-template-columns: repeat(2, 1fr); }
}
@media (min-width: 1024px) {
  .cards { grid-template-columns: repeat(3, 1fr); }
}
```

## Mobile-first

Viết CSS cho **màn hình nhỏ trước**, rồi dùng `min-width` để thêm cho màn hình lớn. Code gọn hơn vì giao diện điện thoại thường đơn giản nhất.

```quiz test
? Thẻ nào giúp trang hiển thị đúng bề rộng trên điện thoại?
* meta viewport
- meta charset
- link stylesheet
> width=device-width báo trình duyệt dùng đúng bề rộng màn hình thiết bị.
? Theo mobile-first, media query thường dùng điều kiện gì?
* min-width
- max-width
- orientation
> Bắt đầu từ màn hình nhỏ, khi màn hình rộng hơn mức nào đó mới thêm quy tắc.
```

## Tổng kết

```flashcard
@media (min-width: 768px) :: Quy tắc áp dụng khi màn hình rộng từ 768px
Mobile-first :: Viết cho màn hình nhỏ trước, mở rộng dần
meta viewport :: Bắt buộc để trang hiển thị đúng trên điện thoại
```
