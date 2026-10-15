---
title: HTML ngữ nghĩa và khả năng truy cập
chapter: Dữ liệu và biểu mẫu
summary: Dùng đúng thẻ cho đúng ý nghĩa để trang dễ hiểu với mọi người.
duration: 12
---
## Thẻ ngữ nghĩa

Thay vì chỉ dùng `<div>`, HTML5 có các thẻ mang ý nghĩa:

```html
<header>Logo và menu</header>
<nav>Các liên kết điều hướng</nav>
<main>
  <article>
    <h1>Bài viết</h1>
    <section>Một phần của bài</section>
  </article>
  <aside>Nội dung phụ</aside>
</main>
<footer>Bản quyền</footer>
```

Lợi ích: trình đọc màn hình nhảy nhanh tới phần chính, công cụ tìm kiếm hiểu trang tốt hơn, code dễ đọc hơn.

## Khả năng truy cập (accessibility)

- Nút bấm dùng `<button>`, không dùng `<div onclick>`: dùng được bằng bàn phím.
- Mọi ảnh có `alt`; ảnh trang trí thì `alt=""`.
- Ô nhập có `<label>`.
- Thứ tự tiêu đề không nhảy cóc (h1 → h2 → h3).

```quiz test
? Thẻ nào chứa nội dung chính, duy nhất của trang?
- section
* main
- aside
> Mỗi trang có một main chứa nội dung chính.
? Vì sao nên dùng `<button>` thay vì `<div onclick>`?
- button tải nhanh hơn
* button dùng được bằng bàn phím và trình đọc màn hình
- div không bấm được
> button có sẵn khả năng focus, bấm Enter/Space và vai trò "nút" cho trình đọc màn hình.
? Ảnh chỉ để trang trí nên đặt alt thế nào?
- Bỏ hẳn thuộc tính alt
* alt=""
- alt="ảnh"
> alt rỗng báo trình đọc màn hình bỏ qua ảnh đó.
```

## Tổng kết

```flashcard
<main> :: Nội dung chính, mỗi trang một cái
<nav> :: Nhóm liên kết điều hướng
<article> :: Nội dung độc lập (bài viết, bài đăng)
alt="" :: Ảnh trang trí, trình đọc màn hình bỏ qua
```
