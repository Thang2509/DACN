---
title: Con trỏ và tham chiếu
chapter: Bộ nhớ
summary: Địa chỉ ô nhớ, truyền tham trị và tham chiếu.
duration: 15
---
## Con trỏ

Con trỏ là biến lưu **địa chỉ** của biến khác:

```cpp
int x = 5;
int* p = &x;     // & lấy địa chỉ của x
*p = 9;          // * truy cập giá trị tại địa chỉ đó
cout << x;       // 9
```

## Truyền tham trị và tham chiếu

```cpp
void addOne(int n)   { n++; }   // nhận bản sao
void addOneRef(int& n) { n++; } // nhận tham chiếu tới biến gốc

int a = 1;
addOne(a);      // a vẫn là 1
addOneRef(a);   // a thành 2
```

Truyền tham chiếu (`const vector<int>& v`) còn giúp tránh sao chép dữ liệu lớn.

```quiz predict
? `int y = 3; int* q = &y; *q = *q * 2; cout << y;` in ra gì?
- 3
* 6
- Địa chỉ của y
> q trỏ tới y nên sửa *q chính là sửa y.
```

```quiz predict
? Sau `int a = 1; addOne(a); addOneRef(a); addOneRef(a);` thì a bằng mấy?
- 1
* 3
- 4
> addOne nhận bản sao nên không đổi a; hai lần addOneRef tăng a lên 3.
```

## Tổng kết

```flashcard
&x :: Lấy địa chỉ của biến x
*p :: Giá trị tại địa chỉ con trỏ p trỏ tới
int& n :: Tham chiếu, sửa n là sửa biến gốc
const T& :: Truyền tham chiếu chỉ đọc, tránh sao chép
```
