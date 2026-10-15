---
title: useEffect và vòng đời
chapter: Hiệu ứng phụ
summary: Đồng bộ component với hệ thống bên ngoài, dọn dẹp đúng cách.
duration: 15
preview: true
---
## Khi nào cần useEffect

Dùng khi component cần **đồng bộ với thứ bên ngoài React**: hẹn giờ, lắng nghe sự kiện cửa sổ, kết nối WebSocket…

```jsx
useEffect(() => {
  const onResize = () => setWidth(window.innerWidth)
  window.addEventListener('resize', onResize)
  return () => window.removeEventListener('resize', onResize) // dọn dẹp
}, [])
```

## Mảng phụ thuộc

| Phụ thuộc | Chạy khi |
| --- | --- |
| không truyền | sau **mỗi** lần vẽ |
| `[]` | một lần sau lần vẽ đầu |
| `[id]` | lần đầu và mỗi khi `id` đổi |

Hàm trả về là **cleanup**, chạy trước lần chạy kế tiếp và khi component bị gỡ.

## Không cần useEffect khi…

- Tính toán từ props/state: tính thẳng khi vẽ, không lưu thêm state.
- Xử lý thao tác người dùng: viết trong hàm xử lý sự kiện.

```quiz quick
? `useEffect(fn, [courseId])` chạy khi nào?
- Chỉ một lần
* Lần đầu và mỗi khi courseId thay đổi
- Mỗi lần vẽ lại
> Effect chạy lại khi một giá trị trong mảng phụ thuộc thay đổi.
```

## Tổng kết

```flashcard
useEffect :: Đồng bộ component với hệ thống bên ngoài
Mảng phụ thuộc [] :: Chạy một lần sau lần vẽ đầu
Cleanup :: Hàm effect trả về, gỡ lắng nghe/hủy hẹn giờ
```
