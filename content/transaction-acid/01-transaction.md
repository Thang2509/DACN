---
title: Transaction là gì
chapter: Transaction
summary: BEGIN, COMMIT, ROLLBACK: tất cả hoặc không gì cả.
duration: 12
preview: true
---
## Tất cả hoặc không gì cả

Mua khóa học bằng xu gồm hai việc: trừ xu trong ví và ghi nhận đăng ký. Nếu trừ xu xong mà máy chủ sập, học viên mất xu mà không có khóa học.

```sql
BEGIN;
UPDATE wallets SET coins = coins - 100 WHERE user_id = 1;
INSERT INTO enrollments (user_id, course_id) VALUES (1, 7);
COMMIT;      -- lưu cả hai
-- hoặc ROLLBACK; để hủy cả hai
```

```code sql
@instructions Bảng `wallets` có An 150 xu. Viết transaction trừ 100 xu của An và ghi một dòng vào `enrollments` (user_id 1, course_id 7), rồi `SELECT coins FROM wallets WHERE user_id = 1`.
@setup
CREATE TABLE wallets (user_id INTEGER PRIMARY KEY, coins INTEGER CHECK (coins >= 0));
CREATE TABLE enrollments (user_id INTEGER, course_id INTEGER);
INSERT INTO wallets VALUES (1, 150);
@starter
BEGIN;

COMMIT;
@solution
BEGIN;
UPDATE wallets SET coins = coins - 100 WHERE user_id = 1;
INSERT INTO enrollments (user_id, course_id) VALUES (1, 7);
COMMIT;
SELECT coins FROM wallets WHERE user_id = 1;
```

Trong Laravel:

```php
DB::transaction(function () use ($user, $course) {
    $user->wallet()->decrement('coins', 100);
    $user->enrollments()->create(['course_id' => $course->id]);
}); // có ngoại lệ thì tự ROLLBACK
```

## Tổng kết

```flashcard
BEGIN :: Bắt đầu transaction
COMMIT :: Lưu vĩnh viễn mọi thay đổi trong transaction
ROLLBACK :: Hủy mọi thay đổi trong transaction
Transaction trong Laravel :: DB::transaction(fn), tự commit, tự rollback khi có ngoại lệ
```
