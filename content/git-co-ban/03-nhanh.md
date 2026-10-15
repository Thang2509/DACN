---
title: Nhánh và hợp nhánh
chapter: Nhánh
summary: switch, merge và xử lý xung đột.
duration: 15
---
## Nhánh

Nhánh cho phép phát triển tính năng mới tách biệt với code ổn định:

```bash
git switch -c feature/dang-nhap   # tạo và chuyển sang nhánh mới
# … sửa code, commit …
git switch main
git merge feature/dang-nhap       # hợp nhánh vào main
git branch -d feature/dang-nhap   # xóa nhánh đã hợp
```

## Xung đột (conflict)

Hai nhánh sửa cùng một dòng, Git không tự quyết được:

```text
<<<<<<< HEAD
const price = 199000
=======
const price = 149000
>>>>>>> feature/giam-gia
```

Sửa file giữ lại nội dung đúng, xóa các dấu `<<<`, `===`, `>>>`, rồi `git add` và `git commit`.

```quiz quick
? Lệnh nào tạo nhánh mới và chuyển sang nhánh đó?
- git branch -d ten
* git switch -c ten
- git merge ten
> -c nghĩa là create.
```

## Tổng kết

```flashcard
git switch -c ten :: Tạo nhánh mới và chuyển sang
git merge ten :: Hợp nhánh ten vào nhánh hiện tại
Conflict :: Hai nhánh sửa cùng chỗ, phải tự chọn nội dung
<<<<<<< HEAD :: Đánh dấu bắt đầu phần xung đột của nhánh hiện tại
```
