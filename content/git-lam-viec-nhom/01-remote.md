---
title: Kho từ xa
chapter: GitHub
summary: clone, push, pull, fetch.
duration: 12
preview: true
---
## Kết nối kho từ xa

```bash
git clone https://github.com/nhom/du-an.git      # tải kho về máy
git remote add origin https://github.com/ban/du-an.git
git push -u origin main                           # đẩy nhánh main lần đầu
git pull                                          # lấy và hợp thay đổi mới
git fetch                                         # chỉ tải về, chưa hợp
```

`origin` là tên mặc định của kho từ xa.

## Thói quen tốt

- `git pull` trước khi bắt đầu làm để có code mới nhất.
- Commit nhỏ, thông điệp rõ: "Sửa lỗi tính giá voucher" tốt hơn "fix".
- Không commit file bí mật (`.env`, khóa API). Lỡ đẩy lên thì phải **đổi khóa ngay**, xóa commit không đủ.

```quiz quick
? Khác nhau giữa `git fetch` và `git pull`?
* fetch chỉ tải về, pull tải về và hợp vào nhánh hiện tại
- fetch đẩy code lên, pull tải code về
- Không khác nhau
> pull = fetch + merge.
```

## Tổng kết

```flashcard
git clone :: Tải toàn bộ kho từ xa về máy
git push :: Đẩy commit lên kho từ xa
git pull :: fetch + merge
origin :: Tên mặc định của kho từ xa
```
