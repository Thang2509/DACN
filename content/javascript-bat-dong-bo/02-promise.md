---
title: Promise
chapter: Bất đồng bộ
summary: then, catch và chạy song song với Promise.all.
duration: 15
---
## Promise là một lời hứa

Promise đại diện cho kết quả **sẽ có**. Nó ở một trong ba trạng thái: đang chờ, thành công (`resolve`), thất bại (`reject`).

```js
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

wait(500)
  .then(() => console.log('Xong'))
  .catch((error) => console.error(error))
```

## Nối chuỗi

Mỗi `then` trả về Promise mới nên có thể nối liền, không lồng nhau:

```js
Promise.resolve(2)
  .then((x) => x * 10)
  .then((x) => console.log(x)) // 20
```

## Chạy song song

```js
const [user, courses] = await Promise.all([getUser(), getCourses()])
```

`Promise.all` chờ tất cả xong; chỉ cần một cái lỗi là cả nhóm lỗi.

```code javascript
@instructions Dùng `Promise.all` cộng tổng các số mà 3 Promise trả về rồi in ra.
@starter
const a = Promise.resolve(1)
const b = Promise.resolve(2)
const c = Promise.resolve(3)
@solution
const a = Promise.resolve(1)
const b = Promise.resolve(2)
const c = Promise.resolve(3)
Promise.all([a, b, c]).then((values) => console.log(values.reduce((sum, x) => sum + x, 0)))
@expected
6
```

## Tổng kết

```flashcard
resolve / reject :: Báo Promise thành công / thất bại
then :: Xử lý khi thành công, trả về Promise mới
catch :: Bắt lỗi của cả chuỗi phía trước
Promise.all :: Chờ nhiều Promise chạy song song
```
