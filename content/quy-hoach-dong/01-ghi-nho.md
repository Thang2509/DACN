---
title: Ghi nhớ (memoization)
chapter: Ý tưởng
summary: Bài toán con trùng lặp và cách lưu kết quả.
duration: 12
preview: true
---
## Fibonacci đệ quy rất chậm

```js
function fib(n) {
  if (n <= 1) return n
  return fib(n - 1) + fib(n - 2)
}
```

`fib(5)` gọi `fib(3)` hai lần, `fib(2)` ba lần… Số lời gọi tăng theo cấp số mũ, khoảng O(2ⁿ).

## Ghi nhớ kết quả

```js
function fibMemo(n, memo = {}) {
  if (n <= 1) return n
  if (memo[n] !== undefined) return memo[n]
  return (memo[n] = fibMemo(n - 1, memo) + fibMemo(n - 2, memo))
}
```

Mỗi `n` chỉ tính một lần: O(n).

```code javascript
@instructions Đếm số lời gọi hàm của `fib(20)` thường và `fibMemo(20)` có ghi nhớ để thấy sự khác biệt. In hai con số.
@starter
let calls = 0
function fib(n) {
  calls++
  if (n <= 1) return n
  return fib(n - 1) + fib(n - 2)
}
@solution
let calls = 0
function fib(n) {
  calls++
  if (n <= 1) return n
  return fib(n - 1) + fib(n - 2)
}
let memoCalls = 0
function fibMemo(n, memo = {}) {
  memoCalls++
  if (n <= 1) return n
  if (memo[n] !== undefined) return memo[n]
  return (memo[n] = fibMemo(n - 1, memo) + fibMemo(n - 2, memo))
}
fib(20)
fibMemo(20)
console.log(calls, memoCalls)
@expected
21891 39
```

## Tổng kết

```flashcard
Bài toán con trùng lặp :: Cùng một bài toán con bị tính nhiều lần
Memoization :: Lưu kết quả bài toán con để dùng lại
Fibonacci đệ quy thường :: O(2ⁿ)
Fibonacci có ghi nhớ :: O(n)
```
