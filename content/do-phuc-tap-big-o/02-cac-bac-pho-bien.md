---
title: Các bậc độ phức tạp phổ biến
chapter: Đo độ phức tạp
summary: O(1), O(log n), O(n), O(n log n), O(n²).
duration: 15
---
## Bảng so sánh

| Bậc | Tên | Ví dụ | n = 1 000 000 |
| --- | --- | --- | --- |
| O(1) | hằng số | lấy `arr[5]` | 1 bước |
| O(log n) | logarit | tìm kiếm nhị phân | khoảng 20 bước |
| O(n) | tuyến tính | duyệt mảng | 1 triệu bước |
| O(n log n) | | sắp xếp nhanh, sắp xếp trộn | khoảng 20 triệu |
| O(n²) | bình phương | hai vòng lặp lồng nhau | 1 nghìn tỉ bước |

## Nhận diện qua code

```js
// O(n²): mỗi phần tử so với mọi phần tử khác
for (let i = 0; i < n; i++)
  for (let j = 0; j < n; j++) …

// O(log n): mỗi bước giảm một nửa
while (n > 1) n = Math.floor(n / 2)
```

```code javascript
@instructions Đếm số lần vòng `while` chạy khi n giảm một nửa mỗi bước, với n = 1 000 000. Kết quả cho thấy O(log n) tăng rất chậm.
@starter
let n = 1000000
let steps = 0
@solution
let n = 1000000
let steps = 0
while (n > 1) {
  n = Math.floor(n / 2)
  steps++
}
console.log(steps)
@expected
19
```

```quiz predict
? Hàm có hai vòng `for` **nối tiếp** (không lồng nhau), mỗi vòng chạy n lần. Độ phức tạp là?
* O(n)
- O(n²)
- O(2n²)
> n + n = 2n, bỏ hằng số còn O(n). Chỉ lồng nhau mới thành n × n.
```

## Tổng kết

```flashcard
O(1) :: Không phụ thuộc n, ví dụ truy cập phần tử theo chỉ số
O(log n) :: Mỗi bước loại bỏ một nửa dữ liệu
O(n log n) :: Thuật toán sắp xếp tốt
O(n²) :: Hai vòng lặp lồng nhau trên dữ liệu
```
