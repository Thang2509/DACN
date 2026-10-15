---
title: Mã trạng thái và định dạng lỗi
chapter: Nguyên tắc REST
summary: Chọn đúng mã 2xx, 4xx, 5xx và trả lỗi dễ hiểu.
duration: 12
---
## Nhóm mã trạng thái

| Mã | Ý nghĩa | Khi nào dùng |
| --- | --- | --- |
| 200 | OK | đọc/sửa thành công |
| 201 | Created | tạo mới thành công |
| 204 | No Content | xóa thành công, không có nội dung trả về |
| 400 | Bad Request | yêu cầu sai cú pháp |
| 401 | Unauthorized | chưa đăng nhập |
| 403 | Forbidden | đã đăng nhập nhưng không có quyền |
| 404 | Not Found | không có tài nguyên |
| 422 | Unprocessable | dữ liệu không hợp lệ |
| 429 | Too Many Requests | gọi quá nhiều lần |
| 500 | Server Error | lỗi phía máy chủ |

## Định dạng lỗi thống nhất

```json
{
  "message": "Dữ liệu không hợp lệ.",
  "errors": { "email": ["Email đã được sử dụng."] }
}
```

```code javascript
@instructions Viết hàm `statusFor(result)` trả về mã HTTP phù hợp: `'created'` → 201, `'deleted'` → 204, `'invalid'` → 422, `'forbidden'` → 403, `'missing'` → 404, còn lại 200.
@starter
function statusFor(result) {
}
console.log(['created', 'deleted', 'invalid', 'forbidden', 'missing', 'ok'].map(statusFor))
@solution
function statusFor(result) {
  const codes = { created: 201, deleted: 204, invalid: 422, forbidden: 403, missing: 404 }
  return codes[result] ?? 200
}
console.log(['created', 'deleted', 'invalid', 'forbidden', 'missing', 'ok'].map(statusFor))
@expected
[ 201, 204, 422, 403, 404, 200 ]
```

```quiz quick
? Học viên đã đăng nhập nhưng gọi API của quản trị viên. Mã phù hợp là?
- 401
* 403
- 404
> 401 là chưa xác thực; 403 là đã biết bạn là ai nhưng không cho phép.
```

## Tổng kết

```flashcard
201 :: Tạo mới thành công
401 vs 403 :: Chưa đăng nhập vs không có quyền
422 :: Dữ liệu gửi lên không hợp lệ
429 :: Gọi API quá giới hạn cho phép
```
