---
title: Xử lý sự kiện
chapter: Tương tác
summary: addEventListener, đối tượng event và ủy quyền sự kiện.
duration: 15
---
## Lắng nghe sự kiện

```js
const button = document.querySelector('#save')
button.addEventListener('click', (event) => {
  console.log('Đã bấm', event.target)
})
```

Sự kiện thường gặp: `click`, `input`, `submit`, `keydown`, `change`.

## Chặn hành vi mặc định

```js
form.addEventListener('submit', (event) => {
  event.preventDefault() // không tải lại trang
  // tự gửi dữ liệu bằng fetch…
})
```

## Ủy quyền sự kiện (event delegation)

Thay vì gắn sự kiện cho từng nút trong danh sách, gắn **một lần** ở phần tử cha:

```js
document.querySelector('#todo').addEventListener('click', (event) => {
  if (event.target.matches('.delete')) {
    event.target.closest('li').remove()
  }
})
```

Cách này vẫn chạy với các mục thêm vào sau.

```quiz test
? `event.preventDefault()` trong sự kiện submit có tác dụng gì?
* Không cho form tải lại trang
- Xóa dữ liệu form
- Dừng mọi sự kiện khác
> Nó chặn hành vi mặc định của trình duyệt là gửi form và tải lại trang.
? Vì sao ủy quyền sự kiện chạy được với phần tử thêm vào sau?
- Trình duyệt tự gắn lại sự kiện
* Sự kiện nổi bọt lên phần tử cha đã được gắn sẵn
- Vì dùng querySelectorAll
> Sự kiện click nổi bọt (bubble) từ phần tử con lên cha.
```

## Tổng kết

```flashcard
addEventListener :: Gắn hàm xử lý cho sự kiện
event.target :: Phần tử thật sự phát sinh sự kiện
preventDefault :: Chặn hành vi mặc định của trình duyệt
Ủy quyền sự kiện :: Gắn một lần ở cha, xét event.target
```
