---
title: List, dict và vòng lặp
chapter: Làm quen Python
summary: Hai cấu trúc dữ liệu dùng nhiều nhất và vòng for.
duration: 15
---
## List

```python
langs = ["Python", "JavaScript", "SQL"]
langs.append("Go")
print(langs[0], langs[-1])     # Python Go  (chỉ số âm đếm từ cuối)
print(langs[1:3])              # ['JavaScript', 'SQL']  (cắt lát)
print(len(langs))              # 4
```

## Dict

```python
student = {"name": "An", "score": 9}
student["level"] = "beginner"
print(student.get("email", "chưa có"))   # giá trị mặc định khi thiếu khóa
```

## Vòng lặp

```python
for i, lang in enumerate(langs):
    print(i, lang)

for key, value in student.items():
    print(key, "=", value)

squares = [n * n for n in range(5)]   # list comprehension: [0, 1, 4, 9, 16]
```

```quiz predict
? `nums = [3, 1, 2]` rồi `print(nums[-1])` in ra gì?
- 3
* 2
- Lỗi chỉ số
> Chỉ số -1 là phần tử cuối cùng.
```

```quiz predict
? `print([n for n in range(6) if n % 2 == 0])` in ra gì?
* [0, 2, 4]
- [2, 4, 6]
- [0, 2, 4, 6]
> range(6) là 0..5, chỉ giữ số chẵn.
```

## Tổng kết

```flashcard
list[-1] :: Phần tử cuối của list
list[1:3] :: Cắt lát từ chỉ số 1 tới trước 3
dict.get(k, mac_dinh) :: Lấy giá trị, thiếu khóa thì trả mặc định
[x*x for x in a] :: List comprehension
```
