---
title: async/await và fetch
chapter: Gọi API
summary: Viết code bất đồng bộ như đồng bộ, xử lý lỗi bằng try/catch.
duration: 15
---
## async/await

```js
async function loadCourses() {
  try {
    const response = await fetch('/api/courses')
    if (!response.ok) throw new Error('Máy chủ trả lỗi ' + response.status)
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Không tải được khóa học', error)
    return []
  }
}
```

- `await` chỉ dùng trong hàm `async`, tạm dừng hàm tới khi Promise xong.
- Hàm `async` luôn trả về Promise.
- `fetch` **không** báo lỗi khi máy chủ trả 404/500, phải tự kiểm tra `response.ok`.

```code javascript
@instructions Viết hàm `async` tên `double` trả về x * 2, rồi dùng `await` in kết quả của `double(21)`.
@starter
async function double(x) {
}
@solution
async function double(x) {
  return x * 2
}
async function main() {
  console.log(await double(21))
}
main()
@expected
42
```

```quiz test
? Hàm `async` luôn trả về gì?
- undefined
* Một Promise
- Giá trị return trực tiếp
> Giá trị return được bọc trong Promise.
? `fetch` nhận phản hồi 404 thì sao?
* Promise vẫn thành công, response.ok là false
- Promise bị reject
- Ném lỗi ngay
> fetch chỉ reject khi lỗi mạng; mã 4xx/5xx phải tự kiểm tra.
```

## Tổng kết

```flashcard
await :: Chờ Promise xong, chỉ dùng trong hàm async
response.ok :: true khi mã trạng thái 200–299
try/catch với await :: Bắt lỗi của Promise như code đồng bộ
```
