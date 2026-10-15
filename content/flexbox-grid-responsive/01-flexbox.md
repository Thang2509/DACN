---
title: Flexbox
chapter: Dàn trang
summary: Xếp phần tử theo hàng hoặc cột, căn giữa dễ dàng.
duration: 15
preview: true
---
## Flex container

```css
.toolbar {
  display: flex;
  justify-content: space-between; /* trục chính (ngang) */
  align-items: center;            /* trục phụ (dọc) */
  gap: 12px;
}
```

- `flex-direction: row | column` đổi trục chính.
- `justify-content`: `flex-start`, `center`, `space-between`, `space-around`.
- `align-items`: `stretch`, `center`, `flex-start`, `flex-end`.

## Phần tử con

```css
.search { flex: 1; }   /* chiếm hết chỗ trống còn lại */
.logo   { flex-shrink: 0; } /* không bị co lại */
```

Căn giữa một hộp trong trang chỉ cần 3 dòng:

```css
.page { display: flex; justify-content: center; align-items: center; }
```

```quiz quick
? Với `flex-direction: column`, thuộc tính nào căn phần tử theo chiều **dọc**?
* justify-content
- align-items
- text-align
> Khi đổi sang column, trục chính thành trục dọc nên justify-content điều khiển chiều dọc.
```

## Tổng kết

```flashcard
display: flex :: Biến phần tử thành flex container
justify-content :: Căn theo trục chính
align-items :: Căn theo trục phụ
flex: 1 :: Phần tử con giãn ra lấp chỗ trống
```
