---
title: Tiến trình, biến môi trường và SSH
chapter: Máy chủ
summary: ps, kill, pipe và kết nối máy chủ từ xa.
duration: 15
---
## Tiến trình

```bash
ps aux | grep php        # tìm tiến trình php (| chuyển kết quả sang lệnh sau)
top                      # theo dõi CPU, RAM
kill 1234                # dừng tiến trình có PID 1234
kill -9 1234             # buộc dừng
```

## Chuyển hướng và biến môi trường

```bash
php artisan schedule:run >> cron.log 2>&1   # ghi thêm vào file, gộp cả lỗi
export APP_ENV=production
echo $APP_ENV
```

## SSH

```bash
ssh-keygen -t ed25519            # tạo cặp khóa trên máy bạn
ssh-copy-id deploy@203.0.113.5   # đưa khóa công khai lên máy chủ
ssh deploy@203.0.113.5           # đăng nhập không cần mật khẩu
scp backup.sql deploy@203.0.113.5:/tmp/
```

Khóa riêng (`id_ed25519`) không bao giờ chia sẻ; nên tắt đăng nhập bằng mật khẩu trên máy chủ.

```quiz test
? Ký hiệu `|` trong `ps aux | grep php` làm gì?
* Đưa kết quả lệnh trước làm đầu vào lệnh sau
- Chạy hai lệnh song song
- Ghi kết quả ra file
> Đó là pipe.
? File nào trong cặp khóa SSH được đưa lên máy chủ?
- Khóa riêng
* Khóa công khai (.pub)
- Cả hai
> Khóa riêng chỉ nằm trên máy của bạn.
```

## Tổng kết

```flashcard
ps aux :: Liệt kê tiến trình đang chạy
| (pipe) :: Nối đầu ra lệnh trước vào đầu vào lệnh sau
>> file 2>&1 :: Ghi thêm vào file, gộp cả lỗi
ssh user@host :: Đăng nhập máy chủ từ xa
Khóa .pub :: Khóa công khai, đặt trên máy chủ
```
