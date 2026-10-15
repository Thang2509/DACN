---
title: Image và container
chapter: Docker cơ bản
summary: Khác máy ảo thế nào, các lệnh run, ps, logs.
duration: 12
preview: true
---
## Khái niệm

- **Image**: bản đóng gói chỉ đọc gồm hệ điều hành tối giản, thư viện, code. Giống "khuôn".
- **Container**: một lần chạy của image. Giống "bánh" đúc từ khuôn.
- So với máy ảo: container dùng chung nhân hệ điều hành của máy chủ nên khởi động trong vài giây và nhẹ hơn nhiều.

## Lệnh cơ bản

```bash
docker run -d -p 8080:80 --name web nginx   # chạy nginx, cổng 8080 máy thật → 80 container
docker ps                                    # container đang chạy
docker logs -f web                           # xem log
docker exec -it web sh                       # mở dòng lệnh bên trong container
docker stop web && docker rm web             # dừng và xóa
docker images                                # image đã tải
```

```quiz quick
? `-p 8080:80` nghĩa là gì?
* Cổng 8080 của máy thật chuyển vào cổng 80 của container
- Container dùng 8080 MB RAM
- Chạy 80 bản sao
> Cú pháp cổng_máy_thật:cổng_container.
```

## Tổng kết

```flashcard
Image :: Bản đóng gói chỉ đọc, dùng để tạo container
Container :: Một lần chạy của image
docker run -p a:b :: Ánh xạ cổng a của máy thật vào cổng b của container
docker exec -it ten sh :: Mở dòng lệnh trong container
```
