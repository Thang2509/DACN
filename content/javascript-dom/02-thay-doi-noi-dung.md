---
title: Thay đổi nội dung và giao diện
chapter: Làm việc với DOM
summary: textContent, classList, tạo và xóa phần tử.
duration: 12
---
## Nội dung

```js
const message = document.querySelector('#message')
message.textContent = 'Đã lưu!'      // gán chữ thuần, an toàn
```

Tránh gán `innerHTML` bằng dữ liệu người dùng nhập: kẻ xấu có thể chèn mã độc (lỗi XSS).

## Class và style

```js
message.classList.add('success')
message.classList.toggle('hidden')
message.style.color = 'green'
```

Nên đổi class thay vì sửa `style` trực tiếp, để phần định dạng vẫn nằm trong CSS.

## Tạo phần tử

```js
const li = document.createElement('li')
li.textContent = 'Học DOM'
document.querySelector('ul').append(li)
li.remove() // xóa khi không cần
```

```code javascript
@instructions DOM không có trong ô chạy thử, nhưng logic thì giống hệt. Viết hàm `toggle(list, name)`: nếu mảng `list` có `name` thì bỏ đi, chưa có thì thêm vào (giống `classList.toggle`). In kết quả 2 lần gọi.
@starter
function toggle(list, name) {
  // trả về mảng mới
}
console.log(toggle(['card'], 'active'))
console.log(toggle(['card', 'active'], 'active'))
@solution
function toggle(list, name) {
  return list.includes(name) ? list.filter((item) => item !== name) : [...list, name]
}
console.log(toggle(['card'], 'active'))
console.log(toggle(['card', 'active'], 'active'))
@expected
[ 'card', 'active' ]
[ 'card' ]
```

## Tổng kết

```flashcard
textContent :: Gán nội dung dạng chữ, không chạy HTML
classList.toggle :: Có class thì bỏ, chưa có thì thêm
createElement + append :: Tạo phần tử mới và gắn vào trang
innerHTML với dữ liệu người dùng :: Nguy cơ XSS
```
