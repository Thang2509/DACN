---
title: Đóng gói, getter và static
chapter: Nâng cao
summary: Thuộc tính riêng tư #, get/set và phương thức static.
duration: 15
---
## Thuộc tính riêng tư

```js
class Account {
  #password            // dấu # : chỉ dùng được bên trong class

  constructor(email, password) {
    this.email = email
    this.#password = password
  }

  check(password) {
    return password === this.#password
  }
}
```

Bên ngoài gọi `account.#password` sẽ báo lỗi cú pháp.

## Getter và setter

```js
class Pet {
  #level = 1
  get level() { return this.#level }
  set level(value) { this.#level = Math.min(Math.max(value, 1), 50) } // giới hạn 1–50
}
```

## static

Thuộc về **lớp**, không thuộc từng đối tượng: `Pet.fromJson(data)`, `Math.max()`.

```code javascript
@instructions Viết class `Level` có getter `value` và setter giới hạn giá trị trong khoảng 1–50 (lưu trong thuộc tính riêng `#value`). Thêm phương thức static `max()` trả về 50.
@starter
class Level {
}
const level = new Level()
level.value = 80
console.log(level.value, Level.max())
level.value = -3
console.log(level.value)
@solution
class Level {
  #value = 1
  get value() { return this.#value }
  set value(v) { this.#value = Math.min(Math.max(v, 1), 50) }
  static max() { return 50 }
}
const level = new Level()
level.value = 80
console.log(level.value, Level.max())
level.value = -3
console.log(level.value)
@expected
50 50
1
```

## Tổng kết

```flashcard
#thuocTinh :: Thuộc tính riêng tư, chỉ dùng trong class
get / set :: Đọc / gán như thuộc tính nhưng chạy hàm
static :: Thành phần của lớp, gọi bằng TênLớp.ham()
Đóng gói :: Che dữ liệu bên trong, chỉ mở giao diện cần thiết
```
