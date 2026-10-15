---
title: Thêm, tìm, sửa, xóa
chapter: NoSQL
summary: insertOne, find với toán tử, updateOne, deleteOne.
duration: 15
---
## Thêm

```js
db.courses.insertOne({ title: 'React cơ bản', level: 'intermediate', price: 199000 })
```

## Tìm

```js
db.courses.find({ level: 'beginner' })
db.courses.find({ price: { $gt: 0, $lte: 200000 } })   // 0 < price <= 200000
db.courses.find({ tags: 'sql' })                        // mảng tags có chứa 'sql'
db.courses.find({}, { title: 1 }).sort({ price: -1 }).limit(5)
```

| Toán tử | SQL tương ứng |
| --- | --- |
| `$gt`, `$gte` | `>`, `>=` |
| `$lt`, `$lte` | `<`, `<=` |
| `$in` | `IN (…)` |
| `$ne` | `<>` |

## Sửa và xóa

```js
db.courses.updateOne({ title: 'React cơ bản' }, { $set: { price: 149000 } })
db.courses.updateMany({}, { $inc: { views: 1 } })
db.courses.deleteOne({ title: 'Khóa nháp' })
```

Quên `$set` thì cả document bị **thay thế** bằng `{ price: 149000 }`, mất hết trường khác.

```quiz quick
? Truy vấn MongoDB nào tương đương `WHERE price >= 100000`?
- { price: { $gt: 100000 } }
* { price: { $gte: 100000 } }
- { price: '>= 100000' }
> $gte = greater than or equal.
```

## Tổng kết

```flashcard
find({ trường: giá trị }) :: Tìm document khớp điều kiện
$gt / $lte :: Lớn hơn / nhỏ hơn hoặc bằng
$set :: Chỉ sửa các trường được chỉ định
$inc :: Tăng giá trị số
```
