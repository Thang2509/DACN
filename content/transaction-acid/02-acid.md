---
title: Bốn tính chất ACID
chapter: Transaction
summary: Atomicity, Consistency, Isolation, Durability.
duration: 12
---
## ACID

| Tính chất | Ý nghĩa | Ví dụ |
| --- | --- | --- |
| **A**tomicity | nguyên tử: tất cả hoặc không | trừ xu và ghi đăng ký cùng thành công |
| **C**onsistency | nhất quán: luôn thỏa ràng buộc | số xu không bao giờ âm (CHECK) |
| **I**solation | cô lập: transaction chạy song song không giẫm chân nhau | hai lần mua cùng lúc không trừ sai |
| **D**urability | bền vững: đã COMMIT thì không mất dù mất điện | ghi xuống đĩa, nhật ký |

MySQL với InnoDB (mặc định trên XAMPP) hỗ trợ đầy đủ ACID; bảng MyISAM cũ thì không có transaction.

```quiz test
? Mất điện ngay sau COMMIT, khi khởi động lại dữ liệu vẫn còn. Đó là tính chất nào?
- Atomicity
- Isolation
* Durability
> Durability đảm bảo dữ liệu đã commit không bị mất.
? Ràng buộc `CHECK (coins >= 0)` góp phần đảm bảo tính chất nào?
- Atomicity
* Consistency
- Durability
> Consistency: dữ liệu luôn thỏa các quy tắc đã khai báo.
? Lỗi giữa transaction khiến mọi thay đổi trước đó bị hủy. Đó là tính chất nào?
* Atomicity
- Isolation
- Consistency
> Tất cả hoặc không gì cả.
```

## Tổng kết

```flashcard
Atomicity :: Tất cả thao tác cùng thành công hoặc cùng bị hủy
Consistency :: Dữ liệu luôn thỏa ràng buộc
Isolation :: Transaction song song không ảnh hưởng sai lẫn nhau
Durability :: Đã commit thì không mất
```
