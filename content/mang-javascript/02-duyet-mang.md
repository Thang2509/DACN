---
title: Duyệt mảng
chapter: Làm quen với mảng
summary: Dùng for...of và forEach để đi qua từng phần tử.
duration: 10
---
## Vòng lặp for...of

```js
for (const name of ['An', 'Bình']) {
  console.log('Xin chào ' + name)
}
```

```quiz predict
? Đoạn code trên in ra mấy dòng?
- 1
* 2
- 3
> Mỗi phần tử của mảng được in một lần.
```

## Sắp xếp mảng

`sort()` sắp xếp mảng tại chỗ. Xem thuật toán sắp xếp nổi bọt chạy từng bước:

```animation BubbleSortAnimation
{"values": [5, 1, 4, 2]}
```

```code javascript
@instructions Tính tổng các phần tử của mảng `nums` bằng vòng lặp `for...of` rồi in kết quả.
@starter
const nums = [4, 5, 6]
let total = 0
@expected
15
```

## Tổng kết

```flashcard
for...of :: Duyệt lần lượt giá trị của từng phần tử
forEach :: Gọi một hàm cho mỗi phần tử
sort :: Sắp xếp mảng tại chỗ
```
