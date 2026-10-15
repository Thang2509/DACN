---
title: CASE và hàm xử lý dữ liệu
chapter: Phân tích dữ liệu
summary: Phân loại bằng CASE, xử lý NULL và chuỗi, ngày tháng.
duration: 12
---
## CASE

```sql
SELECT id, total,
  CASE
    WHEN total >= 300000 THEN 'Lớn'
    WHEN total >= 150000 THEN 'Vừa'
    ELSE 'Nhỏ'
  END AS size
FROM orders;
```

## Đếm có điều kiện

Kết hợp CASE với hàm gộp để làm báo cáo dạng bảng:

```sql
SELECT customer_id,
  SUM(CASE WHEN created_at < '2026-10-01' THEN total ELSE 0 END) AS thang_9,
  SUM(CASE WHEN created_at >= '2026-10-01' THEN total ELSE 0 END) AS thang_10
FROM orders
GROUP BY customer_id;
```

## NULL và chuỗi

```sql
SELECT COALESCE(phone, 'chưa có') FROM users;   -- thay NULL bằng giá trị khác
SELECT UPPER(name), LENGTH(name) FROM customers;
SELECT substr(created_at, 1, 7) AS month FROM orders;   -- '2026-09'
```

```code sql
@instructions Đếm số đơn **Lớn** (từ 300000), **Vừa** (từ 150000) và **Nhỏ** theo từng tháng. Kết quả gồm `month` (dạng '2026-09'), `lon`, `vua`, `nho`, sắp xếp theo `month`.
@setup
CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT, city TEXT);
CREATE TABLE orders (id INTEGER PRIMARY KEY, customer_id INTEGER, total INTEGER, created_at TEXT);
INSERT INTO customers VALUES (1, 'An', 'Hà Nội'), (2, 'Bình', 'Đà Nẵng'), (3, 'Chi', 'Hà Nội'), (4, 'Dũng', 'Cần Thơ');
INSERT INTO orders VALUES
  (1, 1, 200000, '2026-09-01'), (2, 1, 150000, '2026-09-15'), (3, 2, 500000, '2026-09-20'),
  (4, 3, 120000, '2026-10-02'), (5, 1, 300000, '2026-10-05'), (6, 2, 80000, '2026-10-06');
@starter
SELECT substr(created_at, 1, 7) AS month
FROM orders
@solution
SELECT substr(created_at, 1, 7) AS month,
  SUM(CASE WHEN total >= 300000 THEN 1 ELSE 0 END) AS lon,
  SUM(CASE WHEN total >= 150000 AND total < 300000 THEN 1 ELSE 0 END) AS vua,
  SUM(CASE WHEN total < 150000 THEN 1 ELSE 0 END) AS nho
FROM orders
GROUP BY month
ORDER BY month;
```

## Tổng kết

```flashcard
CASE WHEN … THEN … ELSE … END :: Rẽ nhánh trong SQL
SUM(CASE WHEN … THEN 1 ELSE 0 END) :: Đếm có điều kiện
COALESCE(a, b) :: Lấy giá trị đầu tiên khác NULL
substr(chuoi, vi_tri, do_dai) :: Cắt chuỗi con
```
