---
title: Docker Compose
chapter: Nhiều dịch vụ
summary: Chạy ứng dụng, CSDL cùng lúc bằng một file.
duration: 15
---
## Một file cho cả hệ thống

```yaml
# compose.yaml
services:
  api:
    build: .
    ports: ["8000:8000"]
    environment:
      DB_HOST: db
      DB_PASSWORD: secret
    depends_on: [db]
  db:
    image: mysql:8.4
    environment:
      MYSQL_DATABASE: eduquest
      MYSQL_ROOT_PASSWORD: secret
    volumes:
      - db-data:/var/lib/mysql   # giữ dữ liệu khi xóa container

volumes:
  db-data:
```

```bash
docker compose up -d       # chạy tất cả
docker compose logs -f api
docker compose down        # dừng và xóa container (volume vẫn còn)
```

- Các dịch vụ gọi nhau bằng **tên dịch vụ**: `DB_HOST: db`.
- **Volume** giữ dữ liệu CSDL; không có volume, xóa container là mất dữ liệu.

```quiz quick
? Trong compose ở trên, ứng dụng `api` kết nối MySQL bằng host nào?
- localhost
* db
- mysql:8.4
> Docker Compose tạo mạng nội bộ, tên dịch vụ chính là tên máy.
```

## Tổng kết

```flashcard
compose.yaml :: Khai báo nhiều dịch vụ chạy cùng nhau
docker compose up -d :: Chạy toàn bộ hệ thống ở chế độ nền
Volume :: Lưu dữ liệu bền vững ngoài container
Tên dịch vụ :: Dùng làm host để các container gọi nhau
```
