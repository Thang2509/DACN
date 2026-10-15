---
title: Khởi tạo và commit
chapter: Làm quen Git
summary: Ba vùng làm việc và vòng lặp add, commit.
duration: 12
preview: true
---
## Ba vùng của Git

1. **Working directory**: file bạn đang sửa.
2. **Staging area**: những thay đổi đã chọn để đưa vào lần lưu tới.
3. **Repository**: lịch sử các lần lưu (commit).

```bash
git init                         # tạo kho Git trong thư mục hiện tại
git status                       # xem file nào thay đổi
git add index.html               # đưa vào staging
git add .                        # đưa mọi thay đổi vào staging
git commit -m "Thêm trang chủ"   # lưu một phiên bản
```

## Cấu hình lần đầu

```bash
git config --global user.name "Tên của bạn"
git config --global user.email "ban@example.com"
```

## .gitignore

File liệt kê những gì **không** đưa vào Git: `node_modules/`, `vendor/`, `.env`, file build.

```quiz quick
? Lệnh nào đưa thay đổi vào staging area?
* git add
- git commit
- git push
> add chọn thay đổi; commit mới lưu thành phiên bản.
```

## Tổng kết

```flashcard
git init :: Tạo kho Git mới
git add :: Đưa thay đổi vào staging
git commit -m :: Lưu một phiên bản kèm mô tả
.gitignore :: Danh sách file không đưa vào Git (.env, node_modules)
```
