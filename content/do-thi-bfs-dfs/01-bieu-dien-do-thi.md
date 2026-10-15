---
title: Biểu diễn đồ thị
chapter: Đồ thị
summary: Đỉnh, cạnh, danh sách kề.
duration: 12
preview: true
---
## Đỉnh và cạnh

Đồ thị gồm **đỉnh** (người dùng, thành phố, khóa học) và **cạnh** nối chúng (bạn bè, đường đi, điều kiện tiên quyết).

- Vô hướng: A–B nghĩa là cả hai chiều (bạn bè).
- Có hướng: A → B chỉ một chiều (theo dõi, học trước).
- Có trọng số: cạnh mang giá trị (khoảng cách, chi phí).

## Danh sách kề

```js
const graph = {
  HTML: ['CSS', 'JavaScript'],
  CSS: ['Tailwind'],
  JavaScript: ['React', 'Node.js'],
  React: [],
  'Node.js': [],
  Tailwind: [],
}
```

Mỗi đỉnh lưu danh sách đỉnh kề. Tiết kiệm bộ nhớ hơn ma trận kề khi đồ thị thưa.

```code javascript
@instructions Từ danh sách cạnh vô hướng `edges`, xây danh sách kề dạng đối tượng và in ra.
@starter
const edges = [['A', 'B'], ['A', 'C'], ['B', 'D']]
@solution
const edges = [['A', 'B'], ['A', 'C'], ['B', 'D']]
const graph = {}
for (const [u, v] of edges) {
  ;(graph[u] ??= []).push(v)
  ;(graph[v] ??= []).push(u)
}
console.log(graph)
@expected
{ A: [ 'B', 'C' ], B: [ 'A', 'D' ], C: [ 'A' ], D: [ 'B' ] }
```

## Tổng kết

```flashcard
Đỉnh / cạnh :: Đối tượng / mối liên hệ giữa hai đối tượng
Có hướng :: Cạnh chỉ đi một chiều
Danh sách kề :: Mỗi đỉnh lưu mảng các đỉnh nối với nó
Có trọng số :: Cạnh mang giá trị như khoảng cách
```
