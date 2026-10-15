---
title: Quyền truy cập
chapter: Dòng lệnh
summary: rwx, chmod, chown và sudo.
duration: 12
---
## Đọc quyền

```text
-rw-r--r--  1 www-data www-data  1024 app.php
drwxr-xr-x  2 root     root      4096 storage
```

Ba nhóm, mỗi nhóm 3 ký tự: **chủ sở hữu**, **nhóm**, **người khác**. `r` đọc (4), `w` ghi (2), `x` chạy/vào thư mục (1).

## Đổi quyền

```bash
chmod 644 app.php        # rw-r--r--: chủ đọc ghi, còn lại chỉ đọc
chmod 755 deploy.sh      # rwxr-xr-x: ai cũng chạy được, chỉ chủ sửa
chmod +x deploy.sh       # thêm quyền chạy
chown -R www-data storage   # đổi chủ sở hữu (cả thư mục con)
sudo apt update          # chạy lệnh với quyền quản trị
```

Không dùng `chmod 777` cho tiện: ai cũng sửa được file, rất nguy hiểm.

```quiz predict
? `chmod 640 .env` cho kết quả quyền nào?
* rw-r-----
- rw-rw-rw-
- rwxr-----
> 6 = r+w cho chủ, 4 = r cho nhóm, 0 = không gì cho người khác.
```

## Tổng kết

```flashcard
r / w / x :: Đọc 4 / ghi 2 / chạy 1
chmod 755 :: rwxr-xr-x
chown :: Đổi chủ sở hữu file
sudo :: Chạy lệnh với quyền quản trị
chmod 777 :: Ai cũng sửa được, không nên dùng
```
