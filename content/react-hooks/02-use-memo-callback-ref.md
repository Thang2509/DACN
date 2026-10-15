---
title: useMemo, useCallback và useRef
chapter: Hiệu năng
summary: Ghi nhớ kết quả tính toán và giữ giá trị không gây vẽ lại.
duration: 15
---
## useMemo

```jsx
const sorted = useMemo(() => courses.toSorted((a, b) => a.price - b.price), [courses])
```

Chỉ tính lại khi `courses` đổi. Dùng cho **phép tính nặng**, không cần bọc mọi thứ.

## useCallback

```jsx
const handleSelect = useCallback((id) => setSelected(id), [])
```

Giữ nguyên hàm giữa các lần vẽ, hữu ích khi truyền xuống component con được tối ưu bằng `memo` hoặc làm phụ thuộc của effect.

## useRef

```jsx
const inputRef = useRef(null)
<input ref={inputRef} />
<button onClick={() => inputRef.current.focus()}>Nhập</button>
```

`ref.current` đổi giá trị **không** làm component vẽ lại; dùng để trỏ tới phần tử DOM hoặc lưu giá trị như id hẹn giờ.

```quiz quick
? Gán `countRef.current = 5` thì component có vẽ lại không?
- Có
* Không
- Chỉ khi trong useEffect
> Ref không phải state, đổi ref không kích hoạt vẽ lại.
```

## Tổng kết

```flashcard
useMemo :: Ghi nhớ kết quả tính toán theo phụ thuộc
useCallback :: Ghi nhớ hàm giữa các lần vẽ
useRef :: Giá trị bền, đổi không gây vẽ lại; trỏ tới DOM
```
