---
title: CSS Grid
chapter: Dàn trang
summary: Lưới hai chiều với cột, hàng và vùng.
duration: 15
---
## Lưới cột

```css
.gallery {
  display: grid;
  grid-template-columns: repeat(3, 1fr); /* 3 cột bằng nhau */
  gap: 16px;
}
```

`fr` là một phần của khoảng trống còn lại. `1fr 2fr` nghĩa là cột sau rộng gấp đôi cột trước.

## Tự xuống dòng theo bề rộng

```css
grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
```

Mỗi cột tối thiểu 200px; màn hình rộng thì nhiều cột, hẹp thì ít cột, không cần media query.

## Vùng đặt tên

```css
.layout {
  display: grid;
  grid-template-areas:
    "header header"
    "sidebar main";
  grid-template-columns: 240px 1fr;
}
.layout header { grid-area: header; }
```

```quiz quick
? `grid-template-columns: 1fr 3fr` trên khung rộng 800px (không có gap). Cột đầu rộng bao nhiêu?
- 400px
* 200px
- 266px
> Tổng 4 phần, mỗi phần 200px; cột đầu chiếm 1 phần.
```

## Tổng kết

```flashcard
fr :: Một phần khoảng trống còn lại của lưới
repeat(3, 1fr) :: 3 cột bằng nhau
minmax(200px, 1fr) :: Cột tối thiểu 200px, giãn được
grid-template-areas :: Đặt tên vùng để dàn trang trực quan
```
