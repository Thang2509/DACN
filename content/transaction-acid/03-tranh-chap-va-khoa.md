---
title: Tranh chấp và khóa dòng
chapter: Đồng thời
summary: Lost update, SELECT … FOR UPDATE và khóa idempotency.
duration: 15
---
## Lost update

Hai request mua hàng cùng lúc, ví đang có 150 xu:

```text
Request A: đọc coins = 150          Request B: đọc coins = 150
Request A: ghi coins = 150 - 100    Request B: ghi coins = 150 - 100
→ Ví còn 50 xu nhưng đã mua 2 lần!
```

## Khóa dòng

```sql
BEGIN;
SELECT coins FROM wallets WHERE user_id = 1 FOR UPDATE;  -- B phải chờ A xong
UPDATE wallets SET coins = coins - 100 WHERE user_id = 1;
COMMIT;
```

Laravel: `Wallet::where('user_id', $id)->lockForUpdate()->first()` (EduQuest dùng cách này khi cộng trừ xu).

Cách khác: cập nhật có điều kiện trong **một câu lệnh** để CSDL tự xử lý:

```sql
UPDATE wallets SET coins = coins - 100 WHERE user_id = 1 AND coins >= 100;
-- số dòng bị ảnh hưởng = 0 nghĩa là không đủ xu
```

## Chống xử lý trùng

Thông báo thanh toán (IPN) có thể được gửi lại nhiều lần. Ghi kèm **khóa duy nhất** (ví dụ mã đơn) để lần thứ hai bị chặn bởi ràng buộc UNIQUE thay vì cộng tiền hai lần.

```code sql
@instructions Mô phỏng hai lần trừ 100 xu khi ví chỉ có 150: dùng UPDATE có điều kiện `coins >= 100` cho cả hai lần, rồi xem số xu còn lại.
@setup
CREATE TABLE wallets (user_id INTEGER PRIMARY KEY, coins INTEGER);
INSERT INTO wallets VALUES (1, 150);
@starter
UPDATE wallets SET coins = coins - 100 WHERE user_id = 1;
UPDATE wallets SET coins = coins - 100 WHERE user_id = 1;
SELECT coins FROM wallets;
@solution
UPDATE wallets SET coins = coins - 100 WHERE user_id = 1 AND coins >= 100;
UPDATE wallets SET coins = coins - 100 WHERE user_id = 1 AND coins >= 100;
SELECT coins FROM wallets;
```

## Tổng kết

```flashcard
Lost update :: Hai transaction đọc cùng giá trị cũ rồi ghi đè lên nhau
SELECT … FOR UPDATE :: Khóa dòng tới khi transaction kết thúc
lockForUpdate() :: Cách khóa dòng trong Laravel
Khóa idempotency :: Khóa duy nhất chống xử lý một yêu cầu hai lần
```
