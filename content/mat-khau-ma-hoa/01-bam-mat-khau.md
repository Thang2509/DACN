---
title: Băm mật khẩu
chapter: Mật khẩu
summary: Hàm băm, muối và thuật toán chậm có chủ đích.
duration: 15
preview: true
---
## Không bao giờ lưu mật khẩu gốc

**Hàm băm** biến dữ liệu thành chuỗi cố định, không thể đảo ngược. Khi đăng nhập, băm mật khẩu vừa nhập rồi so với giá trị đã lưu.

## Vì sao MD5, SHA-256 không đủ

- Quá **nhanh**: máy tính có GPU thử hàng tỉ mật khẩu mỗi giây.
- Cùng mật khẩu cho cùng kết quả: kẻ xấu tra **bảng băm có sẵn** (rainbow table).

## Muối và thuật toán chậm

- **Muối** (salt): chuỗi ngẫu nhiên riêng cho từng người, ghép vào trước khi băm, nên hai người cùng mật khẩu vẫn khác kết quả.
- **bcrypt, argon2**: chậm có chủ đích và tự gắn muối.

```php
$hash = Hash::make('mat-khau-cua-an');        // Laravel dùng bcrypt
Hash::check('mat-khau-cua-an', $hash);        // true
```

```text
$2y$12$Qm1Y0H0n5s0r8rP2zj3bUu7Pp4Tq5n0iJ7cKk3cX2T8bX7L9pQe6a
 │   │  └ muối (22 ký tự) + giá trị băm
 │   └ hệ số chi phí: 2^12 vòng lặp
 └ thuật toán bcrypt
```

```quiz test
? Vì sao cần muối khi băm mật khẩu?
* Để hai người cùng mật khẩu có giá trị băm khác nhau, vô hiệu rainbow table
- Để băm nhanh hơn
- Để giải mã được mật khẩu khi cần
> Muối ngẫu nhiên khiến bảng tra sẵn trở nên vô dụng.
? Thuật toán nào phù hợp để lưu mật khẩu?
- MD5
- SHA-256
* bcrypt hoặc argon2
> Thuật toán chậm, có muối, chi phí điều chỉnh được.
```

## Tổng kết

```flashcard
Hàm băm :: Một chiều, không đảo ngược được
Muối (salt) :: Chuỗi ngẫu nhiên riêng cho từng mật khẩu
bcrypt / argon2 :: Thuật toán băm chậm có chủ đích cho mật khẩu
Rainbow table :: Bảng giá trị băm tính sẵn của mật khẩu phổ biến
```
