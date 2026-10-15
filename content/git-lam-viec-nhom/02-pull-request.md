---
title: Pull request và review code
chapter: GitHub
summary: Quy trình đề xuất thay đổi và góp ý.
duration: 12
---
## Quy trình

1. Tạo nhánh từ `main`: `git switch -c feature/voucher`.
2. Commit và `git push -u origin feature/voucher`.
3. Mở **Pull Request** trên GitHub: mô tả thay đổi, cách kiểm thử, ảnh chụp giao diện.
4. Đồng đội review, góp ý; CI chạy test tự động.
5. Sửa theo góp ý, đẩy thêm commit.
6. Được duyệt thì **merge** vào `main`.

## Review code tốt

- Người viết: PR nhỏ, một mục đích, mô tả rõ.
- Người review: góp ý về code, không về người; đặt câu hỏi thay vì ra lệnh; khen điểm tốt.
- Kiểm tra: đúng yêu cầu chưa, có test chưa, có lỗ hổng bảo mật, có code thừa?

```quiz test
? Vì sao nên giữ pull request nhỏ?
* Dễ review kỹ, ít lỗi lọt qua, dễ hoàn tác
- GitHub giới hạn số dòng
- Để có nhiều commit hơn
> PR hàng nghìn dòng thường bị duyệt qua loa.
? Mô tả pull request nên có gì?
- Chỉ tên nhánh
* Thay đổi gì, vì sao, cách kiểm thử
- Toàn bộ code đã thay đổi
> Giúp người review hiểu nhanh bối cảnh.
```

## Tổng kết

```flashcard
Pull request :: Đề xuất hợp nhánh, kèm thảo luận và review
Review code :: Đồng đội đọc và góp ý trước khi merge
PR nhỏ :: Một mục đích, dễ review, dễ hoàn tác
```
