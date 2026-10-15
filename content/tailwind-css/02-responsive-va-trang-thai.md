---
title: Responsive và trạng thái
chapter: Làm quen Tailwind
summary: Tiền tố md:, hover:, focus:, dark:.
duration: 12
---
## Tiền tố theo màn hình

```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">…</div>
```

Không có tiền tố là áp cho mọi màn hình; `md:` áp từ 768px trở lên. Đây chính là cách làm mobile-first.

## Tiền tố trạng thái

```html
<a class="text-primary-600 hover:underline focus-visible:outline-2">Xem thêm</a>
<button class="bg-primary-600 disabled:opacity-50">Gửi</button>
```

## Chế độ tối

```html
<div class="bg-white text-gray-900 dark:bg-gray-900 dark:text-white">…</div>
```

```quiz predict
? `class="hidden md:block"` hiển thị thế nào trên điện thoại?
* Bị ẩn
- Hiện như khối
- Hiện dạng chữ
> Mặc định hidden; chỉ từ md trở lên mới thành block.
```

## Tổng kết

```flashcard
md: :: Áp dụng từ màn hình 768px trở lên
hover: :: Áp dụng khi rê chuột
dark: :: Áp dụng ở chế độ tối
hidden md:block :: Ẩn trên điện thoại, hiện trên màn hình lớn
```
