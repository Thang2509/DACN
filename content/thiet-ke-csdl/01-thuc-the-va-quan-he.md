---
title: Thực thể và quan hệ (ERD)
chapter: Mô hình hóa
summary: Xác định thực thể, thuộc tính và kiểu quan hệ.
duration: 12
preview: true
---
## Từ yêu cầu tới thực thể

Yêu cầu: "Học viên đăng ký nhiều khóa học, mỗi khóa có nhiều bài học, mỗi khóa do một giảng viên phụ trách."

Danh từ quan trọng trở thành **thực thể** (bảng): Học viên, Khóa học, Bài học, Giảng viên.

## Ba kiểu quan hệ

| Quan hệ | Ví dụ | Cách lưu |
| --- | --- | --- |
| 1 – 1 | người dùng – hồ sơ | khóa ngoại duy nhất ở một bên |
| 1 – n | khóa học – bài học | khóa ngoại `course_id` ở bảng nhiều (bài học) |
| n – n | học viên – khóa học | bảng trung gian `enrollments(user_id, course_id)` |

```text
users 1 ──── n enrollments n ──── 1 courses 1 ──── n lessons
```

Bảng trung gian còn chứa được thông tin của chính quan hệ: ngày đăng ký, tiến độ…

```quiz quick
? Quan hệ "một bài viết có nhiều thẻ, một thẻ gắn cho nhiều bài viết" cần gì?
- Cột tag_id trong bảng posts
* Bảng trung gian post_tag(post_id, tag_id)
- Lưu danh sách thẻ dạng chuỗi trong posts
> Quan hệ n–n luôn cần bảng trung gian.
```

## Tổng kết

```flashcard
Thực thể :: Đối tượng cần lưu, thường thành một bảng
Quan hệ 1–n :: Khóa ngoại đặt ở bảng phía nhiều
Quan hệ n–n :: Cần bảng trung gian
ERD :: Sơ đồ thực thể và quan hệ
```
