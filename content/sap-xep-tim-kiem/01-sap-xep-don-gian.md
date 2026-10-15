---
title: Sắp xếp nổi bọt và chèn
chapter: Sắp xếp
summary: Hai thuật toán O(n²) dễ hiểu nhất.
duration: 15
preview: true
---
## Sắp xếp nổi bọt

So sánh từng cặp kề nhau, đổi chỗ nếu sai thứ tự. Sau mỗi lượt, số lớn nhất "nổi" về cuối.

```animation BubbleSortAnimation
{"values": [6, 2, 9, 3, 5]}
```

## Sắp xếp chèn

Giống xếp bài trên tay: lấy từng lá, chèn vào đúng vị trí trong phần đã xếp.

```js
function insertionSort(arr) {
  for (let i = 1; i < arr.length; i++) {
    const card = arr[i]
    let j = i - 1
    while (j >= 0 && arr[j] > card) {
      arr[j + 1] = arr[j]   // dời sang phải
      j--
    }
    arr[j + 1] = card
  }
  return arr
}
```

Cả hai là O(n²), nhưng sắp xếp chèn rất nhanh với mảng **gần như đã sắp xếp**.

```code javascript
@instructions Viết `bubbleSort(arr)` và đếm số lần đổi chỗ. In mảng đã sắp xếp và số lần đổi chỗ.
@starter
function bubbleSort(arr) {
  let swaps = 0
  return { arr, swaps }
}
console.log(bubbleSort([6, 2, 9, 3, 5]))
@solution
function bubbleSort(arr) {
  let swaps = 0
  for (let i = 0; i < arr.length - 1; i++) {
    for (let j = 0; j < arr.length - 1 - i; j++) {
      if (arr[j] > arr[j + 1]) {
        ;[arr[j], arr[j + 1]] = [arr[j + 1], arr[j]]
        swaps++
      }
    }
  }
  return { arr, swaps }
}
console.log(bubbleSort([6, 2, 9, 3, 5]))
@expected
{ arr: [ 2, 3, 5, 6, 9 ], swaps: 5 }
```

## Tổng kết

```flashcard
Sắp xếp nổi bọt :: Đổi chỗ cặp kề sai thứ tự, số lớn nổi về cuối
Sắp xếp chèn :: Chèn từng phần tử vào phần đã xếp
O(n²) :: Độ phức tạp của nổi bọt và chèn
Gần như đã xếp :: Trường hợp sắp xếp chèn chạy rất nhanh
```
