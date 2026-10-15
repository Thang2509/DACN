---
title: Hàm và module
chapter: Viết chương trình
summary: def, tham số mặc định, import thư viện chuẩn.
duration: 12
---
## Hàm

```python
def final_price(price, discount=0):
    """Trả về giá sau khi giảm discount phần trăm."""
    return price * (100 - discount) // 100

print(final_price(200000))                # 200000
print(final_price(200000, discount=10))   # 180000
```

- `def` khai báo hàm, `return` trả kết quả.
- Tham số có giá trị mặc định đặt sau cùng.
- Gọi hàm có thể ghi tên tham số cho dễ đọc.

## Module

```python
import math
from random import choice

print(math.sqrt(16))                  # 4.0
print(choice(["đá", "kéo", "giấy"]))
```

Cài thêm thư viện bằng `pip install requests`.

```quiz predict
? `def f(a, b=2): return a * b` rồi `print(f(3), f(3, 3))` in ra gì?
* 6 9
- 6 6
- 5 6
> f(3) dùng b mặc định = 2; f(3, 3) truyền b = 3.
```

## Tổng kết

```flashcard
def ten(thamso): :: Khai báo hàm trong Python
Tham số mặc định :: def f(a, b=2), đặt sau tham số bắt buộc
import math :: Nạp module của thư viện chuẩn
pip install :: Cài thư viện bên ngoài
```
