---
title: Lỗi làm truy vấn chậm
chapter: Tối ưu
summary: Hàm trên cột, LIKE đầu %, SELECT * và N+1.
duration: 15
---
## Hàm bọc cột làm mất index

```sql
-- Không dùng được index trên created_at
SELECT * FROM orders WHERE YEAR(created_at) = 2026;
-- Dùng được
SELECT * FROM orders WHERE created_at >= '2026-01-01' AND created_at < '2027-01-01';
```

## LIKE bắt đầu bằng %

```sql
WHERE title LIKE 'React%'   -- dùng được index
WHERE title LIKE '%React%'  -- phải quét toàn bảng (cần tìm kiếm toàn văn)
```

## Chỉ lấy cột cần dùng

`SELECT *` đọc thừa dữ liệu, nhất là các cột văn bản dài. Liệt kê đúng cột cần.

## N+1 truy vấn

Lấy 50 khóa học rồi chạy thêm 50 truy vấn lấy giảng viên của từng khóa. Thay bằng một JOIN hoặc tải trước (`with('instructor')` trong Laravel).

## Phân trang sâu

`LIMIT 20 OFFSET 100000` vẫn phải đọc qua 100 000 dòng. Với danh sách rất dài, phân trang theo khóa: `WHERE id > :last_id ORDER BY id LIMIT 20`.

```quiz test
? Điều kiện nào dùng được index trên cột `email`?
* WHERE email = 'an@x.vn'
- WHERE LOWER(email) = 'an@x.vn'
- WHERE email LIKE '%@x.vn'
> Hàm bọc cột và LIKE bắt đầu bằng % đều làm mất tác dụng của index.
? Cách nào khắc phục lỗi N+1?
- Thêm index cho mọi cột
* Dùng JOIN hoặc tải trước quan hệ
- Tăng bộ nhớ máy chủ
> Gom N truy vấn nhỏ thành một hoặc hai truy vấn.
? Vì sao OFFSET lớn chậm?
* CSDL vẫn phải đọc qua các dòng bị bỏ qua
- OFFSET không dùng được với ORDER BY
- Vì LIMIT quá nhỏ
> Phân trang theo khóa (WHERE id > …) tránh được việc đọc thừa.
```

## Tổng kết

```flashcard
YEAR(cot) = … :: Hàm bọc cột làm mất index, dùng khoảng thời gian thay thế
LIKE '%x' :: Không dùng được index B-tree
N+1 :: N truy vấn con cho N dòng, sửa bằng JOIN/eager loading
Keyset pagination :: WHERE id > last_id thay cho OFFSET lớn
```
