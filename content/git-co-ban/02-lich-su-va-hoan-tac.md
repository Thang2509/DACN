---
title: Xem lịch sử và hoàn tác
chapter: Làm quen Git
summary: log, diff, restore, revert.
duration: 12
---
## Xem lịch sử

```bash
git log --oneline          # mỗi commit một dòng
git diff                   # thay đổi chưa add
git diff --staged          # thay đổi đã add, chưa commit
git show a1b2c3d           # chi tiết một commit
```

## Hoàn tác

| Tình huống | Lệnh |
| --- | --- |
| Bỏ thay đổi chưa add của một file | `git restore file.js` |
| Bỏ file khỏi staging (giữ thay đổi) | `git restore --staged file.js` |
| Sửa commit vừa tạo (chưa push) | `git commit --amend` |
| Hủy một commit đã push | `git revert a1b2c3d` |

`git revert` tạo commit mới **đảo ngược** thay đổi, không xóa lịch sử, an toàn khi đã chia sẻ với người khác.

```quiz test
? Commit lỗi đã được push lên kho chung. Cách hoàn tác an toàn là?
- git commit --amend
* git revert <mã commit>
- Xóa thư mục .git
> revert thêm commit đảo ngược, không viết lại lịch sử người khác đã tải về.
? Xem những thay đổi đã add nhưng chưa commit dùng lệnh nào?
- git diff
* git diff --staged
- git log
> git diff mặc định chỉ hiện thay đổi chưa add.
```

## Tổng kết

```flashcard
git log --oneline :: Xem lịch sử commit gọn
git diff :: Xem thay đổi chưa add
git restore :: Bỏ thay đổi của file
git revert :: Tạo commit đảo ngược, an toàn với lịch sử đã chia sẻ
```
