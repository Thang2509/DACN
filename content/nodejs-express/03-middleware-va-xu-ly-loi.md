---
title: Middleware và xử lý lỗi
chapter: Xây dựng API
summary: Chuỗi middleware, next() và hàm xử lý lỗi tập trung.
duration: 15
---
## Middleware

Middleware là hàm chạy **trước** route, nhận `(req, res, next)`. Gọi `next()` để chuyển tiếp, hoặc trả phản hồi luôn để dừng.

```js
function logger(req, res, next) {
  console.log(req.method, req.url)
  next()
}

function requireLogin(req, res, next) {
  if (!req.headers.authorization) return res.status(401).json({ message: 'Chưa đăng nhập' })
  next()
}

app.use(logger)                                  // mọi route
app.post('/api/orders', requireLogin, createOrder) // riêng route này
```

## Xử lý lỗi tập trung

Middleware có **4 tham số** là nơi xử lý lỗi chung:

```js
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ message: 'Có lỗi xảy ra, vui lòng thử lại' })
})
```

Không gửi chi tiết lỗi (stack trace) cho người dùng: lộ thông tin hệ thống.

```code javascript
@instructions Mô phỏng chuỗi middleware: viết hàm `run(middlewares)` gọi lần lượt từng hàm, mỗi hàm nhận `next`. Hàm nào không gọi `next` thì chuỗi dừng lại.
@starter
function run(middlewares) {
}
run([
  (next) => { console.log('logger'); next() },
  (next) => { console.log('auth: từ chối') },
  (next) => { console.log('route') },
])
@solution
function run(middlewares) {
  const step = (i) => {
    if (i < middlewares.length) middlewares[i](() => step(i + 1))
  }
  step(0)
}
run([
  (next) => { console.log('logger'); next() },
  (next) => { console.log('auth: từ chối') },
  (next) => { console.log('route') },
])
@expected
logger
auth: từ chối
```

```quiz quick
? Middleware xử lý lỗi của Express có bao nhiêu tham số?
- 2
- 3
* 4
> (err, req, res, next): Express nhận ra hàm xử lý lỗi nhờ có đủ 4 tham số.
```

## Tổng kết

```flashcard
Middleware :: Hàm (req, res, next) chạy trước route
next() :: Chuyển sang middleware/route kế tiếp
(err, req, res, next) :: Middleware xử lý lỗi tập trung
app.use(fn) :: Gắn middleware cho mọi route
```
