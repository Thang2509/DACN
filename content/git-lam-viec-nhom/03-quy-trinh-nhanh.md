---
title: Quy trình nhánh và quy ước commit
chapter: Quy trình
summary: GitHub Flow, rebase và Conventional Commits.
duration: 12
---
## GitHub Flow

- `main` luôn chạy được và có thể triển khai.
- Mọi việc làm trên nhánh riêng, hợp vào `main` qua pull request.
- Đơn giản, phù hợp nhóm nhỏ và đồ án.

## merge hay rebase

```bash
git switch feature/voucher
git rebase main      # đặt các commit của nhánh lên trên main mới nhất
```

`rebase` cho lịch sử thẳng hàng, dễ đọc, nhưng **viết lại** commit: chỉ rebase nhánh của riêng mình, chưa ai dùng chung.

## Conventional Commits

```text
feat: thêm voucher giảm giá khi thanh toán
fix: sửa lỗi cộng xu hai lần khi IPN gửi lại
docs: cập nhật hướng dẫn cài đặt
test: thêm test cho RewardService
```

Tiền tố giúp đọc lịch sử nhanh và tự sinh ghi chú phát hành.

```quiz quick
? Khi nào **không** nên rebase?
- Nhánh chỉ có mình bạn dùng
* Nhánh đã được nhiều người tải về và làm tiếp
- Trước khi mở pull request
> Rebase viết lại commit, gây rối cho người đã dựa trên commit cũ.
```

## Tổng kết

```flashcard
GitHub Flow :: main luôn ổn định, mọi việc qua nhánh và PR
git rebase main :: Đặt commit của nhánh lên trên main mới nhất
feat: / fix: :: Tiền tố commit cho tính năng / sửa lỗi
Không rebase nhánh chung :: Vì rebase viết lại lịch sử
```
