---
title: Tài nguyên và phương thức HTTP
chapter: Nguyên tắc REST
summary: URL là danh từ, hành động là phương thức HTTP.
duration: 12
preview: true
---
## URL là danh từ

| Hành động | Phương thức | URL |
| --- | --- | --- |
| Lấy danh sách khóa học | GET | `/courses` |
| Xem một khóa | GET | `/courses/12` |
| Tạo khóa | POST | `/courses` |
| Sửa toàn bộ / một phần | PUT / PATCH | `/courses/12` |
| Xóa | DELETE | `/courses/12` |
| Bài học của khóa 12 | GET | `/courses/12/lessons` |

Tránh URL kiểu động từ như `/getCourses`, `/deleteCourse?id=12`.

## An toàn và lặp lại (idempotent)

- **GET** chỉ đọc, không đổi dữ liệu.
- **PUT, DELETE** gọi nhiều lần cho cùng kết quả như gọi một lần.
- **POST** gọi hai lần có thể tạo hai bản ghi, nên cần chống bấm hai lần ở giao diện hoặc dùng khóa idempotency (giống sổ cái điểm của EduQuest).

```quiz quick
? URL nào đúng phong cách REST để xóa bình luận 5?
- POST /deleteComment?id=5
* DELETE /comments/5
- GET /comments/5/delete
> Dùng danh từ cho tài nguyên và phương thức DELETE cho hành động.
```

## Tổng kết

```flashcard
GET / POST :: Đọc / tạo mới
PUT / PATCH :: Thay toàn bộ / sửa một phần
DELETE :: Xóa tài nguyên
Idempotent :: Gọi nhiều lần cho cùng kết quả như một lần
```
