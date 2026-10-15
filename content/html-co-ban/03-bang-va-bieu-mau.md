---
title: Bảng và biểu mẫu
chapter: Dữ liệu và biểu mẫu
summary: Trình bày dữ liệu dạng bảng và nhận dữ liệu từ người dùng.
duration: 15
---
## Bảng

```html
<table>
  <thead>
    <tr><th>Học viên</th><th>Điểm</th></tr>
  </thead>
  <tbody>
    <tr><td>An</td><td>9</td></tr>
    <tr><td>Bình</td><td>7</td></tr>
  </tbody>
</table>
```

`<tr>` là một hàng, `<th>` là ô tiêu đề, `<td>` là ô dữ liệu. Chỉ dùng bảng cho **dữ liệu dạng bảng**, không dùng để dàn trang.

## Biểu mẫu

```html
<form action="/dang-ky" method="post">
  <label for="email">Email</label>
  <input id="email" name="email" type="email" required>

  <label for="level">Trình độ</label>
  <select id="level" name="level">
    <option>Mới bắt đầu</option>
    <option>Đã biết cơ bản</option>
  </select>

  <button type="submit">Đăng ký</button>
</form>
```

- `<label for>` gắn với `id` của ô nhập: bấm vào nhãn sẽ trỏ vào ô, trình đọc màn hình đọc đúng tên ô.
- `type="email"`, `required` giúp trình duyệt tự kiểm tra trước khi gửi.
- `name` là tên trường mà máy chủ nhận được.

```quiz quick
? Thuộc tính nào khiến ô nhập bắt buộc phải điền?
- name
* required
- placeholder
> required bắt trình duyệt chặn gửi form khi ô còn trống.
```

## Tổng kết

```flashcard
<tr> / <th> / <td> :: Hàng / ô tiêu đề / ô dữ liệu của bảng
<label for="x"> :: Nhãn gắn với ô nhập có id="x"
name của input :: Tên trường gửi lên máy chủ
type="email" :: Trình duyệt tự kiểm tra định dạng email
```
