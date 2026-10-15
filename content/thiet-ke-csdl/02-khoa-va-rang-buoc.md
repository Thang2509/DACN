---
title: Khóa và ràng buộc
chapter: Mô hình hóa
summary: Khóa chính, khóa ngoại, UNIQUE, NOT NULL, CHECK.
duration: 15
---
## Khóa chính và khóa ngoại

```sql
CREATE TABLE courses (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  price INTEGER NOT NULL DEFAULT 0 CHECK (price >= 0)
);

CREATE TABLE enrollments (
  user_id INTEGER NOT NULL,
  course_id INTEGER NOT NULL REFERENCES courses(id),
  PRIMARY KEY (user_id, course_id)     -- không đăng ký trùng một khóa
);
```

Ràng buộc đặt ở CSDL là **lớp bảo vệ cuối cùng**: dù code có lỗi, dữ liệu sai vẫn bị chặn.

```code sql
@instructions Bảng `users` cần email **không trùng**. Thêm ràng buộc phù hợp vào câu CREATE TABLE, chèn 2 người dùng có email khác nhau rồi `SELECT email FROM users ORDER BY email`.
@starter
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  email TEXT NOT NULL
);
@solution
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  email TEXT NOT NULL UNIQUE
);
INSERT INTO users (email) VALUES ('an@eduquest.test'), ('binh@eduquest.test');
SELECT email FROM users ORDER BY email;
```

```quiz predict
? Bảng có `PRIMARY KEY (user_id, course_id)`, chèn hai lần dòng (1, 5) thì sao?
- Có 2 dòng giống nhau
* Lần chèn thứ hai bị lỗi vi phạm khóa chính
- Dòng sau ghi đè dòng trước
> Khóa chính ghép không cho phép trùng cặp giá trị.
```

## Tổng kết

```flashcard
PRIMARY KEY :: Định danh duy nhất của mỗi dòng
REFERENCES :: Khóa ngoại trỏ tới bảng khác
UNIQUE :: Không cho phép giá trị trùng
CHECK (dieu_kien) :: Chỉ nhận giá trị thỏa điều kiện
```
