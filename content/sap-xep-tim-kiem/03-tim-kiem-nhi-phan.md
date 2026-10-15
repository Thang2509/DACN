---
title: Tìm kiếm nhị phân
chapter: Tìm kiếm
summary: Tìm trong mảng đã sắp xếp với O(log n).
duration: 12
---
## Ý tưởng

Giống đoán số từ 1 tới 100: đoán 50, nghe "lớn hơn" thì bỏ nửa dưới. Mỗi lần đoán loại một nửa, nên 100 số chỉ cần tối đa 7 lần.

**Điều kiện**: mảng phải **đã sắp xếp**.

```js
function binarySearch(arr, target) {
  let low = 0
  let high = arr.length - 1
  while (low <= high) {
    const mid = Math.floor((low + high) / 2)
    if (arr[mid] === target) return mid
    if (arr[mid] < target) low = mid + 1
    else high = mid - 1
  }
  return -1
}
```

```code javascript
@instructions Sửa hàm tìm kiếm nhị phân để trả về số bước đã so sánh, giúp thấy O(log n). In vị trí và số bước khi tìm 777 trong mảng 1..1000.
@starter
function binarySearch(arr, target) {
  let low = 0
  let high = arr.length - 1
  let steps = 0
  return { index: -1, steps }
}
const arr = Array.from({ length: 1000 }, (_, i) => i + 1)
console.log(binarySearch(arr, 777))
@solution
function binarySearch(arr, target) {
  let low = 0
  let high = arr.length - 1
  let steps = 0
  while (low <= high) {
    const mid = Math.floor((low + high) / 2)
    steps++
    if (arr[mid] === target) return { index: mid, steps }
    if (arr[mid] < target) low = mid + 1
    else high = mid - 1
  }
  return { index: -1, steps }
}
const arr = Array.from({ length: 1000 }, (_, i) => i + 1)
console.log(binarySearch(arr, 777))
@expected
{ index: 776, steps: 8 }
```

## Tổng kết

```flashcard
Tìm kiếm nhị phân :: Mỗi bước loại bỏ một nửa, O(log n)
Điều kiện :: Mảng phải được sắp xếp trước
mid :: Math.floor((low + high) / 2)
Không tìm thấy :: Khi low > high, trả về -1
```
