---
title: Mã hóa đối xứng và bất đối xứng
chapter: Mã hóa
summary: AES, RSA, khóa công khai và chữ ký số.
duration: 15
---
## Băm khác mã hóa

| | Băm | Mã hóa |
| --- | --- | --- |
| Đảo ngược | không | có, khi có khóa |
| Dùng cho | mật khẩu, kiểm tra toàn vẹn | dữ liệu cần đọc lại: số thẻ, tin nhắn |

## Đối xứng

Cùng **một khóa** để mã hóa và giải mã (AES). Nhanh, nhưng phải chia sẻ khóa an toàn.

```php
$secret = Crypt::encryptString('0901234567');   // Laravel dùng AES với APP_KEY
Crypt::decryptString($secret);
```

## Bất đối xứng

Một **cặp khóa** (RSA, ECC):

- Mã hóa bằng **khóa công khai**, chỉ **khóa riêng** giải mã được.
- **Chữ ký số**: ký bằng khóa riêng, ai có khóa công khai cũng kiểm tra được.

Chữ ký HMAC mà MoMo gửi kèm thông báo thanh toán là dạng chữ ký dùng khóa bí mật chung: EduQuest tính lại chữ ký và so khớp trước khi cộng tiền.

```code javascript
@instructions Mô phỏng ý tưởng chữ ký: hàm `sign(data, key)` tạo "chữ ký" đơn giản bằng tổng mã ký tự của `data + key`. Viết `verify(data, signature, key)` và kiểm tra hai trường hợp: dữ liệu gốc và dữ liệu bị sửa số tiền.
@starter
function sign(data, key) {
  let sum = 0
  for (const ch of data + key) sum = (sum * 31 + ch.charCodeAt(0)) % 1000003
  return sum
}
function verify(data, signature, key) {
}
const key = 'bi-mat'
const signature = sign('amount=100000', key)
console.log(verify('amount=100000', signature, key), verify('amount=900000', signature, key))
@solution
function sign(data, key) {
  let sum = 0
  for (const ch of data + key) sum = (sum * 31 + ch.charCodeAt(0)) % 1000003
  return sum
}
function verify(data, signature, key) {
  return sign(data, key) === signature
}
const key = 'bi-mat'
const signature = sign('amount=100000', key)
console.log(verify('amount=100000', signature, key), verify('amount=900000', signature, key))
@expected
true false
```

## Tổng kết

```flashcard
Mã hóa đối xứng :: Một khóa cho cả mã hóa và giải mã (AES)
Mã hóa bất đối xứng :: Cặp khóa công khai / khóa riêng (RSA)
Chữ ký số :: Ký bằng khóa riêng, kiểm tra bằng khóa công khai
HMAC :: Chữ ký dùng khóa bí mật chung, chống sửa dữ liệu
```
