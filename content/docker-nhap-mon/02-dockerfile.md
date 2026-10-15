---
title: Viết Dockerfile
chapter: Docker cơ bản
summary: Tự đóng gói ứng dụng Node.js thành image.
duration: 15
---
## Dockerfile

```dockerfile
# Image nền
FROM node:22-alpine
WORKDIR /app
# Cài thư viện trước để tận dụng cache
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
# Lệnh chạy khi container khởi động
CMD ["node", "server.js"]
```

```bash
docker build -t eduquest-api .
docker run -d -p 3000:3000 eduquest-api
```

## Tận dụng cache

Mỗi lệnh là một **lớp** (layer) được cache. Chép `package.json` và `npm ci` **trước** khi chép toàn bộ code: sửa code không phải cài lại thư viện.

## .dockerignore

Giống `.gitignore`: loại `node_modules`, `.git`, `.env` khỏi image cho nhẹ và an toàn.

```quiz test
? Vì sao chép package.json và chạy npm ci trước `COPY . .`?
* Để sửa code không làm mất cache bước cài thư viện
- Vì Docker bắt buộc
- Để image nhỏ hơn
> Lớp chỉ build lại khi file đầu vào của nó thay đổi.
? Lệnh nào chạy khi container khởi động?
- RUN
* CMD
- FROM
> RUN chạy lúc build image; CMD chạy lúc container khởi động.
```

## Tổng kết

```flashcard
FROM :: Image nền để xây tiếp
RUN :: Lệnh chạy lúc build image
CMD :: Lệnh chạy khi container khởi động
.dockerignore :: Loại file không đưa vào image
```
