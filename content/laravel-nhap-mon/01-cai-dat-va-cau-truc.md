---
title: Cài đặt và cấu trúc dự án
chapter: Bắt đầu với Laravel
summary: Composer, artisan và các thư mục quan trọng.
duration: 12
preview: true
---
## Tạo dự án

```bash
composer create-project laravel/laravel blog
cd blog
php artisan serve        # chạy tại http://127.0.0.1:8000
```

Cấu hình kết nối CSDL trong file `.env`:

```text
DB_CONNECTION=mysql
DB_DATABASE=blog
DB_USERNAME=root
DB_PASSWORD=
```

## Thư mục cần biết

| Thư mục | Chứa |
| --- | --- |
| `routes/` | khai báo đường dẫn (`web.php`, `api.php`) |
| `app/Http/Controllers` | controller nhận request |
| `app/Models` | model Eloquent, mỗi model ứng với một bảng |
| `database/migrations` | lịch sử thay đổi cấu trúc bảng |
| `resources/views` | giao diện Blade |

## Artisan

```bash
php artisan make:model Post -m       # tạo model kèm migration
php artisan make:controller PostController
php artisan migrate                  # chạy migration
php artisan route:list               # xem mọi route
```

```quiz quick
? Thông tin kết nối CSDL được cấu hình ở đâu?
- routes/web.php
* File .env
- app/Models
> .env chứa cấu hình theo từng môi trường, không đưa lên Git.
```

## Tổng kết

```flashcard
php artisan serve :: Chạy máy chủ phát triển
.env :: Cấu hình theo môi trường: CSDL, khóa bí mật
make:model Post -m :: Tạo model Post kèm migration
php artisan migrate :: Tạo/cập nhật bảng theo migration
```
