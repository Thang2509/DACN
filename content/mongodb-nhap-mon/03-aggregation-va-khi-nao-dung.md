---
title: Aggregation và khi nào dùng NoSQL
chapter: Thực tế
summary: Pipeline $match, $group và cách chọn giữa SQL và MongoDB.
duration: 15
---
## Pipeline

Aggregation xử lý dữ liệu qua từng **giai đoạn**, giống GROUP BY của SQL:

```js
db.orders.aggregate([
  { $match: { status: 'paid' } },                                  // WHERE
  { $group: { _id: '$customer_id', spent: { $sum: '$total' } } },  // GROUP BY + SUM
  { $sort: { spent: -1 } },                                        // ORDER BY
  { $limit: 3 },
])
```

```code javascript
@instructions Viết lại pipeline trên bằng JavaScript thuần: lọc đơn `paid`, cộng `total` theo `customer`, sắp xếp giảm dần và in mảng `[khách, tổng]`.
@starter
const orders = [
  { customer: 'An', total: 200, status: 'paid' },
  { customer: 'Bình', total: 500, status: 'paid' },
  { customer: 'An', total: 400, status: 'paid' },
  { customer: 'Chi', total: 900, status: 'pending' },
]
@solution
const orders = [
  { customer: 'An', total: 200, status: 'paid' },
  { customer: 'Bình', total: 500, status: 'paid' },
  { customer: 'An', total: 400, status: 'paid' },
  { customer: 'Chi', total: 900, status: 'pending' },
]
const spent = {}
for (const order of orders.filter((o) => o.status === 'paid')) {
  spent[order.customer] = (spent[order.customer] ?? 0) + order.total
}
console.log(Object.entries(spent).sort((a, b) => b[1] - a[1]))
@expected
[ [ 'An', 600 ], [ 'Bình', 500 ] ]
```

## Khi nào dùng MongoDB

- Hợp: dữ liệu có cấu trúc thay đổi nhiều, nhật ký sự kiện, nội dung dạng tài liệu, cần mở rộng ngang.
- Chưa hợp: dữ liệu nhiều quan hệ chặt chẽ, cần transaction phức tạp như ví tiền, đơn hàng (SQL vẫn là lựa chọn an toàn).

## Tổng kết

```flashcard
aggregate([...]) :: Xử lý dữ liệu qua nhiều giai đoạn
$match :: Lọc document, giống WHERE
$group :: Gom nhóm và tính toán, giống GROUP BY
Chọn SQL :: Dữ liệu nhiều quan hệ, cần transaction chặt chẽ
```
