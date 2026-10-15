---
title: State và sự kiện
chapter: Tương tác
summary: useState và cập nhật giao diện khi dữ liệu đổi.
duration: 15
---
## useState

```jsx
import { useState } from 'react'

function Counter() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>Đã bấm {count} lần</button>
}
```

- `count` là giá trị hiện tại, `setCount` để đổi giá trị.
- Gọi `setCount` khiến React **vẽ lại** component với giá trị mới.
- Không sửa trực tiếp `count = 5`, React sẽ không biết để vẽ lại.

## Cập nhật dựa trên giá trị cũ

```jsx
setCount((previous) => previous + 1)
```

Dùng dạng hàm khi giá trị mới phụ thuộc giá trị cũ, nhất là khi cập nhật nhiều lần liên tiếp.

## State là mảng, đối tượng

Luôn tạo bản sao mới:

```jsx
setTodos([...todos, newTodo])                  // thêm
setTodos(todos.filter((t) => t.id !== id))     // xóa
setUser({ ...user, name: 'Bình' })             // sửa một trường
```

```quiz predict
? Bấm nút một lần thì count bằng mấy? `onClick={() => { setCount(count + 1); setCount(count + 1) }}` (count đang là 0)
* 1
- 2
- 0
> Cả hai lần đều dùng count = 0 của lần vẽ hiện tại. Muốn ra 2 phải dùng setCount((c) => c + 1).
```

## Tổng kết

```flashcard
useState :: Trả về [giá trị, hàm cập nhật]
setX(newValue) :: Đổi state và vẽ lại component
setX((prev) => …) :: Cập nhật dựa trên giá trị trước đó
Bản sao mới :: Không sửa trực tiếp mảng, đối tượng trong state
```
