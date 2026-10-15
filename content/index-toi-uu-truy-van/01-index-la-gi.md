---
title: Index là gì
chapter: Index
summary: Quét toàn bảng và tìm kiếm qua cây B-tree.
duration: 12
preview: true
---
## Giống mục lục cuốn sách

Không có index, CSDL phải **quét toàn bảng** (full table scan): đọc từng dòng để tìm. Index giống mục lục: các giá trị được sắp xếp trong một cây **B-tree**, tìm một giá trị chỉ mất khoảng log(n) bước.

| Số dòng | Quét toàn bảng | Qua B-tree |
| --- | --- | --- |
| 1 000 | 1 000 lần đọc | khoảng 3 lần |
| 10 000 000 | 10 triệu lần đọc | khoảng 4–5 lần |

```sql
CREATE INDEX idx_users_email ON users(email);
```

## Cái giá của index

- Tốn thêm dung lượng.
- Mỗi lần INSERT/UPDATE/DELETE phải cập nhật cả index, ghi chậm hơn.

Vì vậy chỉ tạo index cho cột hay dùng trong `WHERE`, `JOIN`, `ORDER BY`.

```quiz quick
? Nhược điểm của việc tạo quá nhiều index là gì?
- Đọc chậm hơn
* Ghi (INSERT/UPDATE) chậm hơn và tốn dung lượng
- Mất dữ liệu
> Mỗi index phải được cập nhật khi dữ liệu thay đổi.
```

## Tổng kết

```flashcard
Full table scan :: Đọc toàn bộ bảng để tìm dòng phù hợp
B-tree :: Cây cân bằng giúp tìm kiếm trong log(n) bước
CREATE INDEX :: Tạo index trên một hoặc nhiều cột
Cái giá của index :: Ghi chậm hơn, tốn dung lượng
```
