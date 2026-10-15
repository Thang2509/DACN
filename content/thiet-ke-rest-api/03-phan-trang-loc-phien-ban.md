---
title: Phân trang, lọc và phiên bản
chapter: API thực tế
summary: Thiết kế tham số truy vấn và nâng cấp API không làm hỏng ứng dụng cũ.
duration: 15
---
## Phân trang

```text
GET /courses?page=2&per_page=12
```

```json
{
  "data": [ … ],
  "meta": { "current_page": 2, "last_page": 4, "total": 41 }
}
```

Luôn đặt giới hạn `per_page` tối đa để không ai lấy cả triệu bản ghi một lần.

## Lọc, sắp xếp, tìm kiếm

```text
GET /courses?level=beginner&category=frontend&sort=-created_at&q=react
```

Quy ước hay gặp: `sort=-created_at` nghĩa là giảm dần.

## Phiên bản

```text
/api/v1/courses   →   /api/v2/courses
```

Khi thay đổi làm hỏng ứng dụng cũ (đổi tên trường, bỏ trường), tạo phiên bản mới và giữ bản cũ một thời gian.

```code javascript
@instructions Viết hàm `paginate(items, page, perPage)` trả về `{ data, last_page }`. `perPage` tối đa 50.
@starter
function paginate(items, page, perPage) {
}
const items = Array.from({ length: 23 }, (_, i) => i + 1)
console.log(paginate(items, 3, 10))
console.log(paginate(items, 1, 100).last_page)
@solution
function paginate(items, page, perPage) {
  const size = Math.min(perPage, 50)
  const start = (page - 1) * size
  return { data: items.slice(start, start + size), last_page: Math.ceil(items.length / size) }
}
const items = Array.from({ length: 23 }, (_, i) => i + 1)
console.log(paginate(items, 3, 10))
console.log(paginate(items, 1, 100).last_page)
@expected
{ data: [ 21, 22, 23 ], last_page: 3 }
1
```

## Tổng kết

```flashcard
?page=2&per_page=12 :: Tham số phân trang phổ biến
sort=-created_at :: Sắp xếp giảm dần theo ngày tạo
/api/v1 :: Đánh phiên bản khi đổi API không tương thích
Giới hạn per_page :: Chống lấy quá nhiều dữ liệu một lần
```
