---
title: Vì sao cần TypeScript
chapter: Kiểu dữ liệu
summary: Chú thích kiểu và quá trình biên dịch sang JavaScript.
duration: 12
preview: true
---
## Lỗi JavaScript chỉ lộ ra khi chạy

```js
function total(price, quantity) {
  return price * quantity
}
total('100', 2) // 200, may mắn
total({}, 2)    // NaN, lỗi âm thầm
```

## Chú thích kiểu

```ts
function total(price: number, quantity: number): number {
  return price * quantity
}
total('100', 2) // Lỗi ngay khi viết: string không gán được cho number
```

TypeScript được **biên dịch** sang JavaScript (`tsc` hoặc Vite), trình duyệt vẫn chạy JavaScript như thường. Kiểu chỉ tồn tại lúc viết code.

```quiz quick
? Trình duyệt chạy file TypeScript thế nào?
- Chạy trực tiếp file .ts
* Chạy JavaScript đã được biên dịch từ .ts
- Cần cài plugin TypeScript cho trình duyệt
> Kiểu bị xóa khi biên dịch; trình duyệt chỉ hiểu JavaScript.
```

## Suy luận kiểu

```ts
let count = 0       // TypeScript tự hiểu count là number
count = 'mười'      // Lỗi
```

## Tổng kết

```flashcard
: number :: Chú thích kiểu cho tham số hoặc biến
Biên dịch :: Chuyển .ts thành .js, xóa thông tin kiểu
Suy luận kiểu :: TypeScript tự đoán kiểu từ giá trị khởi tạo
```
