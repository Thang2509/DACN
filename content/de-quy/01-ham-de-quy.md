---
title: Hàm đệ quy
chapter: Tư duy đệ quy
summary: Điểm dừng và bước đệ quy.
duration: 12
preview: true
---
## Hai thành phần bắt buộc

```js
function factorial(n) {
  if (n <= 1) return 1            // điểm dừng
  return n * factorial(n - 1)     // bước đệ quy: bài toán nhỏ hơn
}
```

- **Điểm dừng**: trường hợp đơn giản, trả kết quả ngay.
- **Bước đệ quy**: gọi lại chính hàm với đầu vào **tiến gần** điểm dừng.

Thiếu điểm dừng → gọi mãi không dừng → lỗi *Maximum call stack size exceeded*.

## Ngăn xếp lời gọi

`factorial(3)` chờ `factorial(2)`, `factorial(2)` chờ `factorial(1)`. Các lời gọi xếp chồng như ngăn xếp, rồi lần lượt trả kết quả ngược lên.

```animation StackAnimation
{"values": [3, 2, 1]}
```

```code javascript
@instructions Viết hàm đệ quy `sumDigits(n)` tính tổng các chữ số của số nguyên dương n. Gợi ý: chữ số cuối là `n % 10`, phần còn lại là `Math.floor(n / 10)`.
@starter
function sumDigits(n) {
}
console.log(sumDigits(2026), sumDigits(7))
@solution
function sumDigits(n) {
  if (n < 10) return n
  return (n % 10) + sumDigits(Math.floor(n / 10))
}
console.log(sumDigits(2026), sumDigits(7))
@expected
10 7
```

## Tổng kết

```flashcard
Điểm dừng :: Trường hợp đơn giản nhất, trả kết quả không cần gọi lại
Bước đệ quy :: Gọi lại hàm với bài toán nhỏ hơn
Call stack :: Ngăn xếp chứa các lời gọi hàm đang chờ
Stack overflow :: Đệ quy quá sâu hoặc thiếu điểm dừng
```
