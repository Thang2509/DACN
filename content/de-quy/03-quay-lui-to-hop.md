---
title: Quay lui và sinh tổ hợp
chapter: Ứng dụng
summary: Thử từng lựa chọn, quay lui khi xong.
duration: 15
---
## Quay lui (backtracking)

Sinh mọi khả năng bằng cách **chọn → đệ quy → bỏ chọn**:

```js
function subsets(items) {
  const result = []
  const current = []
  function explore(start) {
    result.push([...current])
    for (let i = start; i < items.length; i++) {
      current.push(items[i])    // chọn
      explore(i + 1)            // đi tiếp
      current.pop()             // bỏ chọn (quay lui)
    }
  }
  explore(0)
  return result
}
```

Ứng dụng: sinh hoán vị, giải Sudoku, tìm đường trong mê cung, xếp lịch.

```code javascript
@instructions Viết hàm `permutations(items)` sinh mọi hoán vị của mảng bằng quay lui. In các hoán vị của `['A', 'B', 'C']` dạng chuỗi nối liền.
@starter
function permutations(items) {
}
console.log(permutations(['A', 'B', 'C']).map((p) => p.join('')))
@solution
function permutations(items) {
  const result = []
  const current = []
  const used = new Array(items.length).fill(false)
  function explore() {
    if (current.length === items.length) return result.push([...current])
    for (let i = 0; i < items.length; i++) {
      if (used[i]) continue
      used[i] = true
      current.push(items[i])
      explore()
      current.pop()
      used[i] = false
    }
  }
  explore()
  return result
}
console.log(permutations(['A', 'B', 'C']).map((p) => p.join('')))
@expected
[ 'ABC', 'ACB', 'BAC', 'BCA', 'CAB', 'CBA' ]
```

```quiz quick
? Một mảng 4 phần tử có bao nhiêu tập con (kể cả tập rỗng)?
- 8
* 16
- 24
> Mỗi phần tử có 2 lựa chọn chọn/không chọn: 2⁴ = 16.
```

## Tổng kết

```flashcard
Quay lui :: Chọn, đệ quy, rồi bỏ chọn để thử lựa chọn khác
Số tập con của n phần tử :: 2ⁿ
Số hoán vị của n phần tử :: n!
```
