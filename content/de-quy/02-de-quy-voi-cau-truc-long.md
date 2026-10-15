---
title: Đệ quy trên cấu trúc lồng nhau
chapter: Tư duy đệ quy
summary: Duyệt cây thư mục, làm phẳng mảng lồng.
duration: 15
---
## Dữ liệu tự lồng chính nó

Thư mục chứa file và thư mục con; bình luận có bình luận trả lời; menu có menu con. Đệ quy xử lý tự nhiên các cấu trúc này.

```js
const folder = {
  name: 'src',
  children: [
    { name: 'main.jsx' },
    { name: 'features', children: [{ name: 'auth', children: [{ name: 'api.js' }] }] },
  ],
}

function countFiles(node) {
  if (!node.children) return 1                     // là file
  return node.children.reduce((sum, child) => sum + countFiles(child), 0)
}
```

```code javascript
@instructions Viết hàm đệ quy `flatten(arr)` làm phẳng mảng lồng nhiều cấp, không dùng `arr.flat`.
@starter
function flatten(arr) {
}
console.log(flatten([1, [2, [3, [4]], 5]]))
@solution
function flatten(arr) {
  const result = []
  for (const item of arr) {
    if (Array.isArray(item)) result.push(...flatten(item))
    else result.push(item)
  }
  return result
}
console.log(flatten([1, [2, [3, [4]], 5]]))
@expected
[ 1, 2, 3, 4, 5 ]
```

```quiz predict
? `countFiles(folder)` với cây thư mục ở trên trả về mấy?
- 1
* 2
- 5
> Chỉ có main.jsx và api.js là file (không có children).
```

## Tổng kết

```flashcard
Cấu trúc đệ quy :: Dữ liệu chứa phần tử cùng dạng với chính nó
Duyệt cây :: Xử lý nút hiện tại rồi gọi đệ quy cho từng con
Array.isArray :: Kiểm tra phần tử có phải mảng để đệ quy tiếp
```
