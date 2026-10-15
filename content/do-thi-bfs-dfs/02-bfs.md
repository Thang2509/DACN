---
title: BFS: duyệt theo chiều rộng
chapter: Duyệt đồ thị
summary: Dùng hàng đợi, tìm đường ngắn nhất khi cạnh không trọng số.
duration: 15
---
## Lan theo từng lớp

BFS đi từ đỉnh xuất phát, thăm hết các đỉnh **cách 1 bước**, rồi tới các đỉnh cách 2 bước… Dùng **hàng đợi** (vào trước ra trước).

```js
function bfs(graph, start) {
  const visited = new Set([start])
  const queue = [start]
  const order = []
  while (queue.length) {
    const node = queue.shift()
    order.push(node)
    for (const next of graph[node]) {
      if (!visited.has(next)) {
        visited.add(next)
        queue.push(next)
      }
    }
  }
  return order
}
```

Vì đi theo lớp, lần đầu BFS gặp một đỉnh chính là **đường ngắn nhất** (ít cạnh nhất) tới đỉnh đó.

```code javascript
@instructions Viết `distances(graph, start)` dùng BFS trả về số bước ngắn nhất từ `start` tới mọi đỉnh.
@starter
const graph = { A: ['B', 'C'], B: ['A', 'D'], C: ['A', 'D'], D: ['B', 'C', 'E'], E: ['D'] }
function distances(graph, start) {
}
console.log(distances(graph, 'A'))
@solution
const graph = { A: ['B', 'C'], B: ['A', 'D'], C: ['A', 'D'], D: ['B', 'C', 'E'], E: ['D'] }
function distances(graph, start) {
  const dist = { [start]: 0 }
  const queue = [start]
  while (queue.length) {
    const node = queue.shift()
    for (const next of graph[node]) {
      if (!(next in dist)) {
        dist[next] = dist[node] + 1
        queue.push(next)
      }
    }
  }
  return dist
}
console.log(distances(graph, 'A'))
@expected
{ A: 0, B: 1, C: 1, D: 2, E: 3 }
```

## Tổng kết

```flashcard
BFS :: Duyệt theo từng lớp bằng hàng đợi
Hàng đợi :: Vào trước ra trước (FIFO)
visited :: Đánh dấu đỉnh đã thăm để không lặp vô hạn
Đường ngắn nhất :: BFS tìm được khi cạnh không có trọng số
```
