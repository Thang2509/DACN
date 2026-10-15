---
title: Mô hình hộp (box model)
chapter: Nền tảng CSS
summary: Nội dung, padding, border, margin và box-sizing.
duration: 12
---
## Mọi phần tử là một chiếc hộp

Từ trong ra ngoài: **content** (nội dung) → **padding** (đệm) → **border** (viền) → **margin** (lề ngoài).

```css
.card {
  width: 200px;
  padding: 16px;
  border: 2px solid #c6caff;
  margin: 24px auto;   /* trên dưới 24px, trái phải tự căn giữa */
}
```

## box-sizing

Mặc định (`content-box`), `width` chỉ tính phần nội dung. Hộp trên thật ra rộng 200 + 16×2 + 2×2 = **236px**.

```css
* { box-sizing: border-box; }
```

Với `border-box`, `width: 200px` đã gồm cả padding và border, dễ tính toán hơn nhiều. Hầu hết dự án đặt quy tắc này ngay đầu file CSS.

```quiz quick
? Với `box-sizing: content-box`, `width: 100px; padding: 10px; border: 5px` thì hộp rộng bao nhiêu?
- 100px
- 120px
* 130px
> 100 + 10×2 + 5×2 = 130px.
```

## Tổng kết

```flashcard
padding :: Khoảng đệm bên trong viền
margin :: Khoảng cách bên ngoài viền, tới phần tử khác
border-box :: width đã gồm padding và border
margin: 0 auto :: Căn giữa khối theo chiều ngang
```
