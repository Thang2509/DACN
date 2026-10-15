---
title: Chuẩn hóa dữ liệu
chapter: Chuẩn hóa
summary: 1NF, 2NF, 3NF và khi nào chấp nhận phi chuẩn hóa.
duration: 15
---
## Bảng chưa chuẩn hóa

| order_id | customer | phone | products |
| --- | --- | --- | --- |
| 1 | An | 0901 | Áo, Quần |
| 2 | An | 0901 | Mũ |

Vấn đề: số điện thoại lặp lại (đổi số phải sửa nhiều dòng), cột `products` chứa nhiều giá trị.

## Ba dạng chuẩn

- **1NF**: mỗi ô chỉ một giá trị → tách `products` thành bảng `order_items`.
- **2NF**: cột phụ thuộc vào **toàn bộ** khóa chính ghép, không chỉ một phần.
- **3NF**: cột không phụ thuộc vào cột không phải khóa → `phone` phụ thuộc `customer`, tách thành bảng `customers`.

Sau chuẩn hóa: `customers(id, name, phone)`, `orders(id, customer_id)`, `order_items(order_id, product, quantity)`.

## Phi chuẩn hóa có chủ đích

Đôi khi lưu thừa để đọc nhanh, ví dụ `orders.total` thay vì cộng lại từ `order_items` mỗi lần, hay số dư ví trong EduQuest được lưu sẵn bên cạnh sổ cái điểm. Khi đó phải cập nhật cả hai **trong cùng transaction**.

```quiz test
? Cột chứa "Áo, Quần" vi phạm dạng chuẩn nào?
* 1NF
- 2NF
- 3NF
> 1NF yêu cầu mỗi ô chỉ chứa một giá trị nguyên tố.
? Bảng orders có cột customer_phone phụ thuộc customer_id vi phạm dạng chuẩn nào?
- 1NF
- 2NF
* 3NF
> Đó là phụ thuộc bắc cầu qua cột không phải khóa.
? Khi lưu thừa một giá trị tổng hợp, cần đảm bảo gì?
- Không cần gì
* Cập nhật giá trị thừa cùng transaction với dữ liệu gốc
- Chỉ cập nhật vào ban đêm
> Để hai nơi lưu luôn khớp nhau.
```

## Tổng kết

```flashcard
1NF :: Mỗi ô một giá trị, không có nhóm lặp
2NF :: Không phụ thuộc một phần khóa chính ghép
3NF :: Không phụ thuộc bắc cầu qua cột không phải khóa
Phi chuẩn hóa :: Lưu thừa có chủ đích để đọc nhanh
```
