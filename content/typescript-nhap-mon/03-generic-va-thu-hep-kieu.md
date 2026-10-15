---
title: Generic và thu hẹp kiểu
chapter: Nâng cao
summary: Viết hàm dùng cho nhiều kiểu, xử lý kiểu hợp an toàn.
duration: 15
---
## Generic

```ts
function first<T>(items: T[]): T | undefined {
  return items[0]
}
first([1, 2, 3])        // number | undefined
first(['a', 'b'])       // string | undefined
```

`T` là **tham số kiểu**: hàm giữ nguyên kiểu của dữ liệu đầu vào thay vì mất hết thông tin như `any`.

## Thu hẹp kiểu (narrowing)

```ts
function format(id: number | string) {
  if (typeof id === 'number') {
    return id.toFixed(0)   // ở đây id chắc chắn là number
  }
  return id.toUpperCase()  // ở đây id là string
}
```

## Tránh any

`any` tắt hoàn toàn kiểm tra kiểu. Khi chưa biết kiểu, dùng `unknown` rồi thu hẹp trước khi dùng.

```quiz test
? Generic `<T>` giúp gì so với dùng `any`?
* Giữ nguyên thông tin kiểu của dữ liệu truyền vào
- Chạy nhanh hơn
- Bỏ qua kiểm tra kiểu
> any làm mất kiểu; T giữ kiểu xuyên suốt hàm.
? Trong nhánh `if (typeof id === 'string')`, id có kiểu gì?
- number | string
* string
- unknown
> TypeScript thu hẹp kiểu dựa vào điều kiện typeof.
```

## Tổng kết

```flashcard
<T> :: Tham số kiểu của hàm generic
typeof x === 'number' :: Thu hẹp kiểu hợp về number
unknown :: Kiểu chưa biết, phải kiểm tra trước khi dùng
any :: Tắt kiểm tra kiểu, nên tránh
```
