---
title: Đọc kế hoạch truy vấn
chapter: Index
summary: EXPLAIN cho biết CSDL có dùng index hay không.
duration: 15
---
## EXPLAIN

MySQL dùng `EXPLAIN SELECT …`, SQLite dùng `EXPLAIN QUERY PLAN SELECT …`. Kết quả cho biết CSDL sẽ **quét** (SCAN) hay **tìm theo index** (SEARCH … USING INDEX).

```sql
EXPLAIN QUERY PLAN SELECT * FROM users WHERE email = 'an@eduquest.test';
-- SCAN users                                   (chưa có index)
-- SEARCH users USING INDEX idx_users_email (email=?)   (sau khi tạo index)
```

```code sql
@instructions Tạo index tên `idx_orders_customer` trên cột `customer_id` của bảng `orders`, rồi chạy `EXPLAIN QUERY PLAN` cho truy vấn lấy đơn của khách hàng số 1 để thấy chữ **SEARCH … USING INDEX**.
@setup
CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT, city TEXT);
CREATE TABLE orders (id INTEGER PRIMARY KEY, customer_id INTEGER, total INTEGER, created_at TEXT);
INSERT INTO customers VALUES (1, 'An', 'Hà Nội'), (2, 'Bình', 'Đà Nẵng'), (3, 'Chi', 'Hà Nội'), (4, 'Dũng', 'Cần Thơ');
INSERT INTO orders VALUES
  (1, 1, 200000, '2026-09-01'), (2, 1, 150000, '2026-09-15'), (3, 2, 500000, '2026-09-20'),
  (4, 3, 120000, '2026-10-02'), (5, 1, 300000, '2026-10-05'), (6, 2, 80000, '2026-10-06');
@starter
EXPLAIN QUERY PLAN SELECT * FROM orders WHERE customer_id = 1;
@solution
CREATE INDEX idx_orders_customer ON orders(customer_id);
EXPLAIN QUERY PLAN SELECT * FROM orders WHERE customer_id = 1;
```

## Index nhiều cột

```sql
CREATE INDEX idx_orders_customer_date ON orders(customer_id, created_at);
```

Index này dùng được cho `WHERE customer_id = ?` và `WHERE customer_id = ? AND created_at > ?`, nhưng **không** dùng được cho riêng `WHERE created_at > ?`: giống danh bạ xếp theo họ rồi tên, không thể tra nhanh chỉ theo tên.

```quiz quick
? Index `(customer_id, created_at)` hỗ trợ truy vấn nào **kém nhất**?
- WHERE customer_id = 1
- WHERE customer_id = 1 AND created_at > '2026-10-01'
* WHERE created_at > '2026-10-01'
> Index nhiều cột chỉ dùng tốt khi điều kiện bắt đầu từ cột đầu tiên.
```

## Tổng kết

```flashcard
EXPLAIN :: Xem kế hoạch thực thi truy vấn
SCAN :: Quét toàn bảng
SEARCH … USING INDEX :: Tìm qua index
Index nhiều cột :: Dùng được khi điều kiện bắt đầu từ cột đầu
```
