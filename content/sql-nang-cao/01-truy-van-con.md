---
title: Truy vấn con
chapter: Truy vấn lồng nhau
summary: Dùng kết quả một truy vấn làm điều kiện cho truy vấn khác.
duration: 15
preview: true
---
## Truy vấn con trong WHERE

Tìm các đơn hàng lớn hơn giá trị trung bình:

```sql
SELECT id, total
FROM orders
WHERE total > (SELECT AVG(total) FROM orders);
```

Truy vấn trong ngoặc chạy trước, trả về **một giá trị** để so sánh.

## IN và EXISTS

```sql
-- Khách hàng đã từng đặt hàng
SELECT name FROM customers
WHERE id IN (SELECT customer_id FROM orders);

-- Khách hàng chưa đặt đơn nào
SELECT name FROM customers c
WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id);
```

```code sql
@instructions Liệt kê tên khách hàng ở **Hà Nội** có ít nhất một đơn hàng trên 150000. Dùng truy vấn con.
@setup
CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT, city TEXT);
CREATE TABLE orders (id INTEGER PRIMARY KEY, customer_id INTEGER, total INTEGER, created_at TEXT);
INSERT INTO customers VALUES (1, 'An', 'Hà Nội'), (2, 'Bình', 'Đà Nẵng'), (3, 'Chi', 'Hà Nội'), (4, 'Dũng', 'Cần Thơ');
INSERT INTO orders VALUES
  (1, 1, 200000, '2026-09-01'), (2, 1, 150000, '2026-09-15'), (3, 2, 500000, '2026-09-20'),
  (4, 3, 120000, '2026-10-02'), (5, 1, 300000, '2026-10-05'), (6, 2, 80000, '2026-10-06');
@starter
SELECT name FROM customers
@solution
SELECT name FROM customers
WHERE city = 'Hà Nội'
  AND id IN (SELECT customer_id FROM orders WHERE total > 150000);
```

```quiz quick
? Truy vấn nào tìm khách hàng **chưa** có đơn?
- WHERE id IN (SELECT customer_id FROM orders)
* WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id)
- WHERE id = NULL
> NOT EXISTS đúng khi truy vấn con không trả về dòng nào.
```

## Tổng kết

```flashcard
Truy vấn con :: SELECT lồng trong câu SQL khác, chạy trước
IN (SELECT …) :: Giá trị nằm trong danh sách truy vấn con trả về
EXISTS :: Đúng khi truy vấn con có ít nhất một dòng
SELECT 1 :: Chỉ cần biết có dòng hay không, không cần dữ liệu
```
