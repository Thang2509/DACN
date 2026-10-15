---
title: Màu sắc, phông chữ và đơn vị
chapter: Trang trí
summary: Mã màu, phông chữ web và các đơn vị px, rem, %, vw.
duration: 12
---
## Màu sắc

```css
color: #1c1838;               /* mã hex */
background: rgb(91, 67, 230); /* đỏ, xanh lá, xanh dương 0–255 */
border-color: hsl(250 75% 58%); /* sắc độ, độ bão hòa, độ sáng */
```

## Phông chữ

```css
body {
  font-family: "Be Vietnam Pro", system-ui, sans-serif;
  font-size: 16px;
  line-height: 1.6;
}
```

Danh sách phông có **dự phòng**: phông đầu không có thì dùng phông sau.

## Đơn vị

| Đơn vị | Ý nghĩa |
| --- | --- |
| `px` | điểm ảnh cố định |
| `rem` | bội số cỡ chữ gốc (thường 16px), co giãn khi người dùng phóng chữ |
| `%` | phần trăm so với phần tử cha |
| `vw` / `vh` | phần trăm bề rộng / chiều cao màn hình |

```quiz test
? Cỡ chữ gốc 16px thì `2rem` bằng bao nhiêu?
- 2px
* 32px
- 16px
> rem = bội số cỡ chữ gốc: 2 × 16 = 32px.
? `width: 50vw` nghĩa là gì?
- 50px
* Một nửa bề rộng màn hình
- Một nửa phần tử cha
> vw tính theo bề rộng khung nhìn (viewport).
```

## Tổng kết

```flashcard
rem :: Bội số cỡ chữ gốc của trang
vw / vh :: 1% bề rộng / chiều cao màn hình
line-height :: Khoảng cách giữa các dòng chữ
font-family nhiều tên :: Phông dự phòng khi phông đầu không có
```
