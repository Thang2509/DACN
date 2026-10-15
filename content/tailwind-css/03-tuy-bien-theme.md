---
title: Tùy biến theme và tái sử dụng
chapter: Tailwind nâng cao
summary: Định nghĩa màu thương hiệu và component dùng chung.
duration: 12
---
## Biến theme (Tailwind v4)

```css
@import "tailwindcss";

@theme {
  --color-primary-600: #5b43e6;
  --font-sans: "Be Vietnam Pro", sans-serif;
}
```

Khai báo xong là có ngay các lớp `bg-primary-600`, `text-primary-600`, `border-primary-600`…

## Tái sử dụng bằng component

Khi một tổ hợp lớp lặp lại nhiều lần, hãy tách thành component (React, Vue…) thay vì sao chép:

```jsx
function Button({ children }) {
  return <button className="rounded-xl bg-primary-600 px-4 py-2 font-bold text-white">{children}</button>
}
```

```quiz test
? Khai báo `--color-brand-500` trong `@theme` sinh ra lớp nào?
* bg-brand-500
- brand-500-bg
- color-brand
> Tên biến --color-X tạo các lớp bg-X, text-X, border-X…
? Tổ hợp lớp lặp lại ở 10 nút bấm, nên làm gì?
- Sao chép cho nhanh
* Tách thành component Button
- Viết lại bằng CSS thuần
> Component giúp sửa một chỗ là áp cho mọi nơi.
```

## Tổng kết

```flashcard
@theme :: Khai báo biến thiết kế, sinh lớp tương ứng
Component :: Cách tái sử dụng tổ hợp lớp Tailwind
Lớp không dùng :: Không có trong file CSS cuối cùng
```
