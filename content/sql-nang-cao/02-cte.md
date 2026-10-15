---
title: CTE với WITH
chapter: Truy vấn lồng nhau
summary: Đặt tên cho truy vấn trung gian để code dễ đọc.
duration: 12
---
## Viết lại truy vấn con cho dễ đọc

```sql
WITH customer_totals AS (
  SELECT customer_id, SUM(total) AS spent, COUNT(*) AS order_count
  FROM orders
  GROUP BY customer_id
)
SELECT c.name, t.spent, t.order_count
FROM customer_totals t
JOIN customers c ON c.id = t.customer_id
WHERE t.spent >= 500000;
```

`WITH tên AS (...)` tạo một bảng tạm có tên, dùng được ngay ở câu SELECT phía sau. Có thể khai báo nhiều CTE cách nhau dấu phẩy.

```code sql
@instructions Dùng CTE tính **tổng tiền theo thành phố**, rồi chỉ lấy các thành phố có tổng trên 300000. Kết quả gồm `city`, `revenue`, sắp xếp giảm dần theo `revenue`.
@setup
CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT, city TEXT);
CREATE TABLE orders (id INTEGER PRIMARY KEY, customer_id INTEGER, total INTEGER, created_at TEXT);
INSERT INTO customers VALUES (1, 'An', 'Hà Nội'), (2, 'Bình', 'Đà Nẵng'), (3, 'Chi', 'Hà Nội'), (4, 'Dũng', 'Cần Thơ');
INSERT INTO orders VALUES
  (1, 1, 200000, '2026-09-01'), (2, 1, 150000, '2026-09-15'), (3, 2, 500000, '2026-09-20'),
  (4, 3, 120000, '2026-10-02'), (5, 1, 300000, '2026-10-05'), (6, 2, 80000, '2026-10-06');
@starter
WITH city_revenue AS (
  -- viết truy vấn ở đây
)
SELECT * FROM city_revenue
@solution
WITH city_revenue AS (
  SELECT c.city, SUM(o.total) AS revenue
  FROM orders o
  JOIN customers c ON c.id = o.customer_id
  GROUP BY c.city
)
SELECT city, revenue FROM city_revenue
WHERE revenue > 300000
ORDER BY revenue DESC;
```

## Tổng kết

```flashcard
WITH ten AS (…) :: CTE, truy vấn trung gian có tên
Nhiều CTE :: WITH a AS (…), b AS (…) SELECT …
Lợi ích CTE :: Chia truy vấn dài thành từng bước dễ đọc
```
