---
title: DOM và cách chọn phần tử
chapter: Làm việc với DOM
summary: Cây DOM, querySelector và querySelectorAll.
duration: 12
preview: true
---
## Cây DOM

Trình duyệt biến HTML thành một cây: `document` ở gốc, mỗi thẻ là một **nút**. JavaScript truy cập cây này qua đối tượng `document`.

## Chọn phần tử

```js
const title = document.querySelector('h1')          // phần tử đầu tiên khớp
const items = document.querySelectorAll('.item')    // tất cả phần tử khớp
const menu = document.getElementById('menu')
```

`querySelector` nhận **bộ chọn CSS**, nên mọi kiến thức về bộ chọn đều dùng lại được.

```quiz quick
? `document.querySelector('.card')` trả về gì khi trang có 3 phần tử `.card`?
* Phần tử .card đầu tiên
- Cả 3 phần tử
- null
> querySelector chỉ trả về phần tử khớp đầu tiên; muốn lấy tất cả dùng querySelectorAll.
```

## Duyệt danh sách

`querySelectorAll` trả về một NodeList, duyệt bằng `forEach` hoặc `for...of`:

```js
document.querySelectorAll('.item').forEach((item, i) => {
  item.textContent = `Mục ${i + 1}`
})
```

## Tổng kết

```flashcard
document :: Gốc của cây DOM
querySelector :: Lấy phần tử đầu tiên khớp bộ chọn CSS
querySelectorAll :: Lấy tất cả phần tử khớp (NodeList)
```
