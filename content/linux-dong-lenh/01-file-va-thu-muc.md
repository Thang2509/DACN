---
title: File và thư mục
chapter: Dòng lệnh
summary: Di chuyển, xem, tạo, chép, xóa.
duration: 12
preview: true
---
## Di chuyển

```bash
pwd                 # đang ở thư mục nào
ls -la              # liệt kê cả file ẩn, kèm quyền và kích thước
cd /var/www         # đường dẫn tuyệt đối
cd ..               # lên thư mục cha
cd ~                # về thư mục nhà
```

## Thao tác file

```bash
mkdir -p app/logs        # tạo thư mục (cả cha nếu chưa có)
touch notes.txt          # tạo file rỗng
cp a.txt b.txt           # chép
mv b.txt docs/           # di chuyển / đổi tên
rm notes.txt             # xóa file (không có thùng rác!)
rm -r old-folder         # xóa thư mục
cat app.log              # in nội dung
tail -f app.log          # theo dõi file log theo thời gian thực
grep "ERROR" app.log     # tìm dòng chứa chữ ERROR
```

```quiz quick
? Lệnh nào hữu ích nhất để theo dõi log máy chủ đang ghi liên tục?
- cat app.log
* tail -f app.log
- ls app.log
> -f (follow) in tiếp các dòng mới khi file được ghi thêm.
```

## Tổng kết

```flashcard
ls -la :: Liệt kê mọi file kèm quyền
cd .. :: Lên thư mục cha
rm -r :: Xóa thư mục, không thể khôi phục
grep "chu" file :: Tìm dòng chứa chữ trong file
tail -f :: Theo dõi file log đang được ghi
```
