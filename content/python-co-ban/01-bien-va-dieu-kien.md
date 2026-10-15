---
title: Biến, kiểu và điều kiện
chapter: Làm quen Python
summary: Thụt lề thay ngoặc nhọn, if/elif/else.
duration: 12
preview: true
---
## Biến không cần khai báo kiểu

```python
name = "An"
age = 20
score = 8.5
is_student = True

print(f"{name} {age} tuổi, điểm {score}")   # f-string chèn biến vào chuỗi
print(type(age))                          # <class 'int'>
```

## Thụt lề là cú pháp

Python không dùng `{ }`, khối lệnh được xác định bằng **thụt lề** (4 dấu cách):

```python
if score >= 8:
    print("Giỏi")
elif score >= 5:
    print("Đạt")
else:
    print("Chưa đạt")
```

Toán tử logic viết bằng chữ: `and`, `or`, `not`.

```quiz predict
? `x = 7` rồi `print("Chẵn" if x % 2 == 0 else "Lẻ")` in ra gì?
- Chẵn
* Lẻ
- True
> 7 chia 2 dư 1 nên điều kiện sai, lấy vế else.
```

```quiz predict
? `print(7 // 2, 7 / 2)` in ra gì?
* 3 3.5
- 3.5 3.5
- 3 3
> // là chia lấy phần nguyên, / luôn trả về số thực.
```

## Tổng kết

```flashcard
f"{bien}" :: f-string, chèn giá trị biến vào chuỗi
Thụt lề :: Cách Python xác định khối lệnh
elif :: Viết tắt của else if
// :: Chia lấy phần nguyên
```
