---
title: Vòng lặp, hàm và mảng
chapter: Làm quen C++
summary: for, while, hàm có kiểu và vector.
duration: 15
---
## Vòng lặp

```cpp
for (int i = 1; i <= 5; i++) {
    cout << i << " ";
}
// 1 2 3 4 5

int n = 10;
while (n > 0) {
    n /= 2;
}
```

## Hàm

```cpp
int sumTo(int n) {
    int total = 0;
    for (int i = 1; i <= n; i++) total += i;
    return total;
}
```

## vector: mảng động

```cpp
#include <vector>

vector<int> scores = {7, 9, 5};
scores.push_back(10);
for (int s : scores) cout << s << " ";
cout << scores.size();   // 4
```

```quiz predict
? `cout << sumTo(4);` in ra gì?
- 4
* 10
- 16
> 1 + 2 + 3 + 4 = 10.
```

```quiz predict
? Đoạn `int n = 10; int count = 0; while (n > 0) { n /= 2; count++; } cout << count;` in ra gì?
- 3
* 4
- 5
> n đi qua 10 → 5 → 2 → 1 → 0, lặp 4 lần.
```

## Tổng kết

```flashcard
for (int i = 0; i < n; i++) :: Vòng lặp đếm
vector<int> :: Mảng động chứa số nguyên
push_back :: Thêm phần tử vào cuối vector
for (int x : v) :: Duyệt từng phần tử của vector
```
