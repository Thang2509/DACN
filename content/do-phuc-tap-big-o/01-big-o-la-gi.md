---
title: Big-O là gì
chapter: Đo độ phức tạp
summary: Đếm số bước theo n và bỏ hằng số.
duration: 12
preview: true
---
## Đếm số bước

```js
function sum(numbers) {
  let total = 0                 // 1 bước
  for (const n of numbers) {    // lặp n lần
    total += n                  // mỗi lần 1 bước
  }
  return total
}
```

Khoảng `n + 2` bước. Khi n rất lớn, phần `+ 2` không đáng kể, nên ta nói hàm có độ phức tạp **O(n)**.

## Quy tắc rút gọn

- Bỏ hằng số: O(2n) → O(n), O(n/2) → O(n).
- Giữ số hạng lớn nhất: O(n² + n) → O(n²).
- Big-O mô tả **trường hợp xấu nhất** khi n lớn dần.

```quiz quick
? Rút gọn O(3n² + 5n + 100) thành gì?
- O(3n²)
* O(n²)
- O(n)
> Bỏ hằng số và giữ số hạng tăng nhanh nhất.
```

## Tổng kết

```flashcard
Big-O :: Tốc độ tăng số bước theo kích thước đầu vào n
Bỏ hằng số :: O(2n) viết thành O(n)
Số hạng lớn nhất :: O(n² + n) viết thành O(n²)
Trường hợp xấu nhất :: Big-O thường mô tả tình huống chậm nhất
```
