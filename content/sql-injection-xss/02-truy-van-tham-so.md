---
title: Truy vấn tham số
chapter: Chèn mã SQL
summary: Prepared statement và ORM: cách phòng chống triệt để.
duration: 12
---
## Tách mã lệnh và dữ liệu

```php
// PDO
$stmt = $pdo->prepare('SELECT * FROM users WHERE email = ?');
$stmt->execute([$email]);

// Laravel Query Builder / Eloquent tự dùng tham số
User::where('email', $email)->first();
```

```js
// Node.js với mysql2
const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email])
```

Câu SQL được gửi tới CSDL **trước**, dữ liệu gửi **sau** dưới dạng giá trị. Chuỗi `' OR '1'='1` chỉ là một email kỳ lạ, không bao giờ thành mã lệnh.

## Những chỗ vẫn phải cẩn thận

- `DB::raw`, `whereRaw` với dữ liệu người dùng: vẫn bị injection.
- Tên cột, chiều sắp xếp không truyền tham số được: so với **danh sách cho phép**.

```code javascript
@instructions Tên cột sắp xếp không thể truyền bằng tham số `?`. Viết hàm `orderBy(column, direction)` chỉ cho phép cột `title`, `price`, `created_at` và hướng `asc`/`desc`; giá trị lạ thì dùng mặc định `created_at desc`.
@starter
function orderBy(column, direction) {
}
console.log(orderBy('price', 'asc'))
console.log(orderBy('price; DROP TABLE users', 'asc'))
console.log(orderBy('title', 'sideways'))
@solution
function orderBy(column, direction) {
  const columns = ['title', 'price', 'created_at']
  const col = columns.includes(column) ? column : 'created_at'
  const dir = ['asc', 'desc'].includes(direction) ? direction : 'desc'
  return `ORDER BY ${col} ${dir}`
}
console.log(orderBy('price', 'asc'))
console.log(orderBy('price; DROP TABLE users', 'asc'))
console.log(orderBy('title', 'sideways'))
@expected
ORDER BY price asc
ORDER BY created_at asc
ORDER BY title desc
```

## Tổng kết

```flashcard
Prepared statement :: Gửi câu SQL và dữ liệu tách biệt
Dấu ? :: Chỗ giữ cho tham số
whereRaw với dữ liệu người dùng :: Vẫn có nguy cơ injection
Danh sách cho phép :: Cách an toàn cho tên cột, hướng sắp xếp
```
