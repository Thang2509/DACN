---
title: DFS và sắp xếp tô-pô
chapter: Duyệt đồ thị
summary: Đi sâu hết nhánh, sắp thứ tự học các khóa.
duration: 15
---
## Đi sâu trước

DFS đi theo một nhánh tới tận cùng rồi mới quay lại nhánh khác. Viết bằng **đệ quy** (hoặc ngăn xếp).

```js
function dfs(graph, node, visited = new Set()) {
  visited.add(node)
  for (const next of graph[node]) {
    if (!visited.has(next)) dfs(graph, next, visited)
  }
  return visited
}
```

Ứng dụng: kiểm tra hai đỉnh có thông nhau, đếm vùng liên thông, phát hiện chu trình, giải mê cung.

## Sắp xếp tô-pô

Với đồ thị có hướng không chu trình (ví dụ "phải học A trước B"), sắp xếp tô-pô cho một thứ tự học hợp lệ: thêm đỉnh vào kết quả **sau khi** đã duyệt hết các đỉnh nó dẫn tới, rồi đảo ngược.

```code javascript
@instructions Hoàn thành `topoSort(graph)`: dùng DFS, đẩy đỉnh vào `order` sau khi duyệt xong các đỉnh kề, cuối cùng đảo ngược. Duyệt các đỉnh theo thứ tự khóa của `graph`.
@starter
const graph = { HTML: ['CSS', 'JS'], CSS: ['Tailwind'], JS: ['React'], Tailwind: [], React: [] }
function topoSort(graph) {
  const visited = new Set()
  const order = []
  return order.reverse()
}
console.log(topoSort(graph))
@solution
const graph = { HTML: ['CSS', 'JS'], CSS: ['Tailwind'], JS: ['React'], Tailwind: [], React: [] }
function topoSort(graph) {
  const visited = new Set()
  const order = []
  function visit(node) {
    visited.add(node)
    for (const next of graph[node]) if (!visited.has(next)) visit(next)
    order.push(node)
  }
  for (const node of Object.keys(graph)) if (!visited.has(node)) visit(node)
  return order.reverse()
}
console.log(topoSort(graph))
@expected
[ 'HTML', 'JS', 'React', 'CSS', 'Tailwind' ]
```

```quiz quick
? Cấu trúc dữ liệu nào phù hợp để cài đặt DFS không dùng đệ quy?
- Hàng đợi
* Ngăn xếp
- Bảng băm
> DFS lấy đỉnh mới nhất ra trước (LIFO), BFS lấy đỉnh cũ nhất (FIFO).
```

## Tổng kết

```flashcard
DFS :: Đi sâu hết một nhánh rồi mới quay lại
Ngăn xếp :: Vào sau ra trước (LIFO), dùng cho DFS
Sắp xếp tô-pô :: Thứ tự hợp lệ cho đồ thị có hướng không chu trình
Vùng liên thông :: Tập đỉnh đi tới được nhau, đếm bằng DFS/BFS
```
