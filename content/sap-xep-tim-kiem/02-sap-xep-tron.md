---
title: Sắp xếp trộn
chapter: Sắp xếp
summary: Chia để trị, O(n log n).
duration: 15
---
## Chia để trị

1. **Chia** mảng làm hai nửa.
2. **Trị**: sắp xếp từng nửa (đệ quy).
3. **Trộn** hai nửa đã sắp xếp thành một.

```js
function merge(left, right) {
  const result = []
  let i = 0
  let j = 0
  while (i < left.length && j < right.length) {
    result.push(left[i] <= right[j] ? left[i++] : right[j++])
  }
  return [...result, ...left.slice(i), ...right.slice(j)]
}
```

Mảng chia đôi được log n tầng, mỗi tầng trộn mất O(n), tổng cộng **O(n log n)**.

`Array.prototype.sort` của JavaScript cũng là O(n log n), nhưng nhớ truyền hàm so sánh khi sắp xếp số: `nums.sort((a, b) => a - b)`.

```code javascript
@instructions Dùng hàm `merge` có sẵn, viết `mergeSort(arr)` đệ quy.
@starter
function merge(left, right) {
  const result = []
  let i = 0
  let j = 0
  while (i < left.length && j < right.length) result.push(left[i] <= right[j] ? left[i++] : right[j++])
  return [...result, ...left.slice(i), ...right.slice(j)]
}
function mergeSort(arr) {
}
console.log(mergeSort([38, 27, 43, 3, 9, 82, 10]))
@solution
function merge(left, right) {
  const result = []
  let i = 0
  let j = 0
  while (i < left.length && j < right.length) result.push(left[i] <= right[j] ? left[i++] : right[j++])
  return [...result, ...left.slice(i), ...right.slice(j)]
}
function mergeSort(arr) {
  if (arr.length <= 1) return arr
  const mid = Math.floor(arr.length / 2)
  return merge(mergeSort(arr.slice(0, mid)), mergeSort(arr.slice(mid)))
}
console.log(mergeSort([38, 27, 43, 3, 9, 82, 10]))
@expected
[ 3, 9, 10, 27, 38, 43, 82 ]
```

```quiz predict
? `[10, 9, 1].sort()` trong JavaScript cho kết quả gì?
- [ 1, 9, 10 ]
* [ 1, 10, 9 ]
- [ 10, 9, 1 ]
> Không có hàm so sánh, sort so theo chuỗi: "1" < "10" < "9".
```

## Tổng kết

```flashcard
Chia để trị :: Chia nhỏ, giải từng phần, rồi kết hợp
Sắp xếp trộn :: O(n log n), ổn định, cần thêm bộ nhớ O(n)
sort((a, b) => a - b) :: Sắp xếp số tăng dần đúng cách trong JavaScript
```
