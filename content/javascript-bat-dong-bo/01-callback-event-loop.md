---
title: Callback và event loop
chapter: Bất đồng bộ
summary: Vì sao setTimeout(…, 0) vẫn chạy sau.
duration: 12
preview: true
---
## Callback

Callback là hàm truyền vào để **gọi lại sau**:

```js
setTimeout(() => console.log('Sau 1 giây'), 1000)
```

## Event loop

JavaScript chạy **một luồng**. Code đồng bộ chạy hết trước; các callback hẹn giờ, sự kiện… xếp hàng chờ và chỉ chạy khi luồng chính rảnh.

```quiz predict
? Đoạn `console.log('A'); setTimeout(() => console.log('B'), 0); console.log('C')` in ra thứ tự nào?
- A B C
* A C B
- B A C
> setTimeout dù 0ms vẫn phải chờ code đồng bộ chạy xong.
```

```code javascript
@instructions Chạy thử để kiểm chứng: in ra A, C rồi mới B.
@starter
console.log('A')
setTimeout(() => console.log('B'), 0)
console.log('C')
@solution
console.log('A')
setTimeout(() => console.log('B'), 0)
console.log('C')
@expected
A
C
B
```

## Callback hell

Nhiều thao tác nối tiếp bằng callback lồng nhau rất khó đọc. Promise ra đời để giải quyết việc này.

## Tổng kết

```flashcard
Callback :: Hàm truyền vào để được gọi lại sau
Event loop :: Chạy callback đang chờ khi luồng chính rảnh
setTimeout(fn, 0) :: Vẫn chạy sau toàn bộ code đồng bộ hiện tại
```
