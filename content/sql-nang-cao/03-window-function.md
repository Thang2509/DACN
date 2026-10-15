---
title: Window function
chapter: Phân tích dữ liệu
summary: Xếp hạng, cộng dồn mà không gộp mất dòng.
duration: 15
---
## Khác GROUP BY thế nào

`GROUP BY` gộp nhiều dòng thành một. **Window function** tính trên một "cửa sổ" dòng nhưng **giữ nguyên** từng dòng.

```sql
SELECT student, course, score,
       RANK() OVER (PARTITION BY course ORDER BY score DESC) AS rank_in_course
FROM scores;
```

- `PARTITION BY course`: chia nhóm theo khóa học, xếp hạng riêng từng khóa.
- `ORDER BY score DESC`: điểm cao xếp trước.

## Các hàm hay dùng

| Hàm | Ý nghĩa |
| --- | --- |
| `ROW_NUMBER()` | số thứ tự 1, 2, 3… không trùng |
| `RANK()` | đồng hạng thì cùng số, bỏ qua số kế (1, 1, 3) |
| `DENSE_RANK()` | đồng hạng không bỏ số (1, 1, 2) |
| `SUM(x) OVER (ORDER BY …)` | cộng dồn |

```code sql
@instructions Với mỗi khóa học, lấy học viên điểm cao nhất (có thể nhiều người đồng hạng). Kết quả gồm `course`, `student`, `score`, sắp xếp theo `course` rồi `student`.
@setup
CREATE TABLE scores (student TEXT, course TEXT, score INTEGER);
INSERT INTO scores VALUES
  ('An', 'SQL', 9), ('Bình', 'SQL', 7), ('Chi', 'SQL', 9), ('Dũng', 'SQL', 5),
  ('An', 'React', 6), ('Bình', 'React', 8), ('Chi', 'React', 10);
@starter
SELECT student, course, score,
       RANK() OVER (PARTITION BY course ORDER BY score DESC) AS r
FROM scores
@solution
WITH ranked AS (
  SELECT student, course, score,
         RANK() OVER (PARTITION BY course ORDER BY score DESC) AS r
  FROM scores
)
SELECT course, student, score FROM ranked
WHERE r = 1
ORDER BY course, student;
```

```quiz predict
? Điểm 9, 9, 7 xếp bằng `DENSE_RANK()` giảm dần thì người 7 điểm hạng mấy?
- 3
* 2
- 1
> DENSE_RANK không bỏ số sau khi đồng hạng: 1, 1, 2.
```

## Tổng kết

```flashcard
OVER (…) :: Biến hàm thành window function
PARTITION BY :: Chia nhóm cho window function, không gộp dòng
RANK vs DENSE_RANK :: 1,1,3 vs 1,1,2
SUM() OVER (ORDER BY ngay) :: Tổng cộng dồn theo thời gian
```
