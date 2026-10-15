---
title: Tạo và truy cập mảng
chapter: Làm quen với mảng
summary: Mảng lưu nhiều giá trị theo thứ tự, truy cập bằng chỉ số bắt đầu từ 0.
duration: 12
video: https://www.youtube.com/watch?v=oigfaZ5ApsM
preview: true
---
## Mảng là gì?

Mảng (array) là danh sách các giá trị **có thứ tự**. Tạo mảng bằng cặp ngoặc vuông:

```js
const scores = [8, 6, 9]
console.log(scores[0]) // 8
console.log(scores.length) // 3
```

```quiz quick
? Phần tử đầu tiên của mảng có chỉ số bao nhiêu?
- 1
* 0
- -1
> Chỉ số trong JavaScript bắt đầu từ 0.
```

## Thêm và bớt phần tử

- `push(x)` thêm vào cuối, `pop()` lấy ra phần tử cuối.
- `unshift(x)` thêm vào đầu, `shift()` lấy ra phần tử đầu.

```animation StackAnimation
{"values": [3, 7, 1]}
```

```code javascript
@instructions Thêm số 10 vào cuối mảng `nums` rồi in độ dài mảng.
@starter
const nums = [1, 2, 3]
@expected
4
```

## Tổng kết

```flashcard
push :: Thêm phần tử vào cuối mảng
pop :: Lấy ra phần tử cuối mảng
length :: Số phần tử của mảng
```
