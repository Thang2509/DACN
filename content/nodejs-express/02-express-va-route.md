---
title: Express và route
chapter: Xây dựng API
summary: Tạo máy chủ, định nghĩa route và đọc tham số.
duration: 15
---
## Máy chủ đầu tiên

```js
import express from 'express'

const app = express()
app.use(express.json())   // đọc body JSON

const courses = [{ id: 1, title: 'SQL cơ bản' }]

app.get('/api/courses', (req, res) => {
  res.json(courses)
})

app.get('/api/courses/:id', (req, res) => {
  const course = courses.find((c) => c.id === Number(req.params.id))
  if (!course) return res.status(404).json({ message: 'Không tìm thấy' })
  res.json(course)
})

app.post('/api/courses', (req, res) => {
  const course = { id: courses.length + 1, title: req.body.title }
  courses.push(course)
  res.status(201).json(course)
})

app.listen(3000, () => console.log('Chạy tại http://localhost:3000'))
```

- `req.params` lấy phần động của đường dẫn (`:id`), `req.query` lấy `?page=2`, `req.body` lấy dữ liệu gửi lên.
- `res.status(...)` đặt mã trạng thái, `res.json(...)` gửi JSON.

```code javascript
@instructions Viết hàm `match(pattern, path)` giống cách Express khớp route: trả về đối tượng tham số nếu khớp, `null` nếu không. Ví dụ `match('/courses/:id', '/courses/7')` → `{ id: '7' }`.
@starter
function match(pattern, path) {
}
console.log(match('/courses/:id', '/courses/7'))
console.log(match('/courses/:id', '/users/7'))
console.log(match('/courses/:slug/lessons/:lesson', '/courses/sql/lessons/select'))
@solution
function match(pattern, path) {
  const a = pattern.split('/')
  const b = path.split('/')
  if (a.length !== b.length) return null
  const params = {}
  for (let i = 0; i < a.length; i++) {
    if (a[i].startsWith(':')) params[a[i].slice(1)] = b[i]
    else if (a[i] !== b[i]) return null
  }
  return params
}
console.log(match('/courses/:id', '/courses/7'))
console.log(match('/courses/:id', '/users/7'))
console.log(match('/courses/:slug/lessons/:lesson', '/courses/sql/lessons/select'))
@expected
{ id: '7' }
null
{ slug: 'sql', lesson: 'select' }
```

## Tổng kết

```flashcard
req.params :: Tham số trong đường dẫn, ví dụ :id
req.query :: Tham số sau dấu ? trên URL
req.body :: Dữ liệu gửi lên (cần express.json())
res.status(201).json(x) :: Trả mã 201 kèm JSON
```
