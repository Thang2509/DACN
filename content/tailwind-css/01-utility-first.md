---
title: Utility-first là gì
chapter: Làm quen Tailwind
summary: Ghép lớp tiện ích thay vì viết CSS riêng.
duration: 12
preview: true
---
## So sánh

CSS truyền thống:

```html
<button class="btn-primary">Lưu</button>
<style>
.btn-primary { background: #5b43e6; color: white; padding: 8px 16px; border-radius: 12px; }
</style>
```

Tailwind:

```html
<button class="rounded-xl bg-primary-600 px-4 py-2 text-white">Lưu</button>
```

## Quy ước tên lớp

| Lớp | CSS tương ứng |
| --- | --- |
| `p-4` | padding: 1rem |
| `mt-2` | margin-top: 0.5rem |
| `text-lg` | cỡ chữ lớn |
| `font-bold` | in đậm |
| `flex gap-2` | flexbox, khoảng cách 0.5rem |

Ưu điểm: không phải nghĩ tên class, không lo CSS thừa vì Tailwind chỉ sinh các lớp **thật sự được dùng**.

```quiz quick
? Lớp `px-4` làm gì?
- Rộng 4px
* Padding trái và phải 1rem
- Margin ngang 4px
> p = padding, x = trục ngang, 4 = 1rem.
```

## Tổng kết

```flashcard
p-4 :: padding 1rem mọi phía
px / py :: padding theo chiều ngang / dọc
Utility-first :: Ghép nhiều lớp nhỏ thay vì viết CSS riêng
```
