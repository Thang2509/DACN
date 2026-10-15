---
title: CI/CD là gì
chapter: Khái niệm
summary: Tích hợp liên tục, chuyển giao và triển khai liên tục.
duration: 10
preview: true
---
## Ba khái niệm

- **CI – Continuous Integration**: mỗi lần đẩy code, tự động build và chạy test. Lỗi được phát hiện ngay, không đợi tới cuối dự án.
- **Continuous Delivery**: code qua CI luôn ở trạng thái sẵn sàng triển khai, bấm nút là lên.
- **Continuous Deployment**: tự động triển khai luôn, không cần bấm.

## Pipeline điển hình

```text
push → cài thư viện → lint → test → build → triển khai staging → (duyệt) → production
```

Bước nào lỗi thì dừng, không đi tiếp. Pull request hiển thị dấu ✓ hoặc ✗ để người review biết.

```quiz quick
? Lợi ích chính của CI là gì?
- Không cần viết test
* Phát hiện lỗi sớm sau mỗi lần đẩy code
- Code chạy nhanh hơn
> CI chạy test tự động cho mọi thay đổi.
```

## Tổng kết

```flashcard
CI :: Tự động build và test mỗi lần đẩy code
Continuous Delivery :: Luôn sẵn sàng triển khai, bấm nút là lên
Continuous Deployment :: Tự động triển khai không cần bấm
Pipeline :: Chuỗi bước, bước lỗi thì dừng
```
