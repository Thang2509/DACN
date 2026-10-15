---
title: Văn bản, liên kết và hình ảnh
chapter: Làm quen với HTML
summary: Tiêu đề, đoạn văn, danh sách, liên kết và ảnh.
duration: 12
---
## Tiêu đề và đoạn văn

Có 6 cấp tiêu đề từ `<h1>` (quan trọng nhất) tới `<h6>`. Mỗi trang chỉ nên có một `<h1>`.

```html
<h1>Khóa học HTML</h1>
<h2>Bài 1</h2>
<p>Đoạn văn dùng thẻ <strong>p</strong>, chữ in đậm dùng <strong>strong</strong>.</p>
```

## Danh sách

```html
<ul>          <!-- danh sách không thứ tự: dấu chấm -->
  <li>HTML</li>
  <li>CSS</li>
</ul>
<ol>          <!-- danh sách có thứ tự: 1, 2, 3 -->
  <li>Cài trình soạn thảo</li>
  <li>Viết trang đầu tiên</li>
</ol>
```

## Liên kết và hình ảnh

```html
<a href="https://developer.mozilla.org" target="_blank">Tài liệu MDN</a>
<img src="/images/meo.png" alt="Một chú mèo đang ngủ" width="300">
```

- `href` là địa chỉ đích; `target="_blank"` mở trong tab mới.
- `alt` mô tả ảnh cho người khiếm thị và hiện ra khi ảnh lỗi. Luôn viết `alt`.

```quiz predict
? Ảnh có `alt="Logo"` nhưng đường dẫn `src` bị sai. Trình duyệt hiện gì?
- Không hiện gì cả
* Biểu tượng ảnh lỗi kèm chữ "Logo"
- Báo lỗi và dừng tải trang
> Khi ảnh không tải được, trình duyệt hiển thị nội dung của alt.
```

## Tổng kết

```flashcard
<ul> / <ol> :: Danh sách không thứ tự / có thứ tự, mỗi mục là <li>
<a href> :: Liên kết tới địa chỉ khác
alt của <img> :: Mô tả ảnh cho trình đọc màn hình và khi ảnh lỗi
<h1> :: Tiêu đề chính, mỗi trang một cái
```
