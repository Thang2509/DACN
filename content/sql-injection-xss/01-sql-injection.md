---
title: SQL injection
chapter: Chèn mã SQL
summary: Nối chuỗi vào câu SQL nguy hiểm thế nào.
duration: 15
preview: true
---
## Nối chuỗi là nguy hiểm

```js
// Code đăng nhập có lỗi
const sql = `SELECT * FROM users WHERE email = '${email}' AND password = '${password}'`
```

Kẻ tấn công nhập mật khẩu là `' OR '1'='1`, câu SQL trở thành:

```sql
SELECT * FROM users WHERE email = 'admin@x.vn' AND password = '' OR '1'='1'
```

`AND` được tính trước `OR`, và `'1'='1'` luôn đúng nên trả về **mọi** người dùng: đăng nhập không cần mật khẩu.

```code sql
@instructions Thử vai kẻ tấn công: viết câu SELECT giống hệt code lỗi ở trên, với email `admin@eduquest.test` và mật khẩu `' OR '1'='1`. Quan sát kết quả trả về những ai.
@setup
CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT, password TEXT, role TEXT);
INSERT INTO users VALUES
  (1, 'admin@eduquest.test', 'mat-khau-bi-mat', 'admin'),
  (2, 'an@eduquest.test', '123456', 'student');
@starter
SELECT * FROM users WHERE email = 'admin@eduquest.test' AND password = 'sai-mat-khau'
@solution
SELECT * FROM users WHERE email = 'admin@eduquest.test' AND password = '' OR '1'='1'
```

## Hậu quả

Đăng nhập trái phép, đọc toàn bộ CSDL (`UNION SELECT`), sửa xóa dữ liệu, thậm chí chiếm máy chủ.

```quiz quick
? Vì sao `' OR '1'='1` vượt qua được kiểm tra mật khẩu?
- Vì mật khẩu rỗng hợp lệ
* Vì điều kiện OR '1'='1' luôn đúng
- Vì CSDL bị lỗi
> Dữ liệu người dùng đã trở thành một phần của câu lệnh SQL.
```

## Tổng kết

```flashcard
SQL injection :: Dữ liệu người dùng bị hiểu như một phần câu lệnh SQL
' OR '1'='1 :: Chuỗi tấn công kinh điển khiến điều kiện luôn đúng
Nguyên nhân :: Nối chuỗi dữ liệu vào câu SQL
```
