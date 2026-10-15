---
title: Chương trình đầu tiên
chapter: Làm quen C++
summary: Hàm main, nhập xuất và kiểu dữ liệu.
duration: 12
preview: true
---
## Cấu trúc chương trình

```cpp
#include <iostream>
using namespace std;

int main() {
    int a, b;
    cin >> a >> b;              // nhập hai số
    cout << a + b << endl;      // in tổng
    return 0;
}
```

- `#include <iostream>` nạp thư viện nhập xuất.
- Chương trình bắt đầu chạy từ hàm `main`.
- Mỗi lệnh kết thúc bằng dấu `;`.
- Biên dịch rồi chạy: `g++ main.cpp -o main` → `./main`.

## Kiểu dữ liệu

| Kiểu | Ví dụ |
| --- | --- |
| `int` | 42 |
| `long long` | 9000000000 |
| `double` | 3.14 |
| `char` | 'A' |
| `bool` | true |
| `string` | "Xin chào" |

```quiz predict
? `int x = 7 / 2; cout << x;` in ra gì?
* 3
- 3.5
- 4
> Chia hai số nguyên cho kết quả nguyên, phần thập phân bị bỏ.
```

## Tổng kết

```flashcard
int main() :: Điểm bắt đầu của chương trình C++
cin >> x :: Nhập giá trị vào biến x
cout << x :: In giá trị x ra màn hình
g++ main.cpp -o main :: Biên dịch file thành chương trình chạy được
```
