---
title: Không lặp lại và refactor
chapter: Bảo trì code
summary: DRY, comment đúng chỗ và refactor có test bảo vệ.
duration: 12
---
## DRY: Don't Repeat Yourself

Cùng một logic xuất hiện ở nhiều nơi thì khi sửa rất dễ quên một chỗ. Gom lại thành hàm hoặc hằng dùng chung.

Nhưng đừng gom quá sớm: hai đoạn **trông giống nhau** chưa chắc cùng ý nghĩa. Thường đợi tới lần lặp thứ ba mới tách.

## Comment đúng chỗ

```js
// Tệ: nhắc lại điều code đã nói
i++ // tăng i lên 1

// Tốt: giải thích "vì sao"
// MoMo yêu cầu số tiền là số nguyên VND, không có phần thập phân
const amount = Math.round(total)
```

## Refactor an toàn

1. Viết test cho hành vi hiện tại.
2. Thay đổi cấu trúc từng bước nhỏ.
3. Chạy test sau mỗi bước, test xanh mới đi tiếp.

Refactor là đổi **cấu trúc** mà **không đổi hành vi**.

```quiz test
? Refactor là gì?
- Thêm tính năng mới
* Đổi cấu trúc code mà không đổi hành vi
- Viết lại toàn bộ từ đầu
> Người dùng không thấy khác biệt sau khi refactor.
? Comment nào có giá trị nhất?
- // vòng lặp qua mảng
* // API trả về điểm dạng chuỗi nên phải đổi sang số
- // khai báo biến x
> Comment tốt giải thích lý do mà code không tự nói được.
? Vì sao cần test trước khi refactor?
* Để biết chắc hành vi không bị thay đổi
- Để code chạy nhanh hơn
- Vì công cụ bắt buộc
> Test là lưới an toàn phát hiện thay đổi ngoài ý muốn.
```

## Tổng kết

```flashcard
DRY :: Không lặp lại cùng một logic ở nhiều nơi
Comment tốt :: Giải thích vì sao, không nhắc lại code làm gì
Refactor :: Đổi cấu trúc, giữ nguyên hành vi
Test trước refactor :: Lưới an toàn khi sửa code
```
