---
title: Component và JSX
chapter: Nền tảng React
summary: Hàm trả về giao diện, cú pháp JSX.
duration: 12
preview: true
---
## Component là một hàm

```jsx
function Greeting() {
  return <h1 className="title">Xin chào React!</h1>
}
```

Đoạn trông giống HTML trong JavaScript là **JSX**. Khác biệt cần nhớ:

- Dùng `className` thay cho `class`, `htmlFor` thay cho `for`.
- Biểu thức JavaScript đặt trong `{ }`: `<p>{1 + 2}</p>`.
- Component chỉ trả về **một** phần tử gốc (bọc bằng `<>…</>` nếu cần).
- Tên component viết hoa chữ cái đầu.

```jsx
function App() {
  const name = 'An'
  return (
    <>
      <Greeting />
      <p>Chào {name}, hôm nay là {new Date().toLocaleDateString('vi-VN')}</p>
    </>
  )
}
```

```quiz quick
? Trong JSX, gán class CSS dùng thuộc tính nào?
- class
* className
- css
> class là từ khóa của JavaScript nên JSX dùng className.
```

## Tổng kết

```flashcard
Component :: Hàm trả về JSX, tên viết hoa
{ } trong JSX :: Chèn biểu thức JavaScript
<>…</> :: Fragment, bọc nhiều phần tử mà không thêm thẻ
className :: Thuộc tính class trong JSX
```
