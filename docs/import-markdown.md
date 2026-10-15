# Nạp khóa học từ Markdown

```
cd backend
php artisan content:import content/mang-javascript --publish --instructor=giangvien@eduquest.test
```

- `--publish`: xuất bản ngay (không có thì khóa mới ở trạng thái nháp).
- `--instructor`: email giảng viên sở hữu khóa **mới**; bỏ trống thì gán cho quản trị viên đầu tiên.
- Chạy lại được: khóa khớp theo slug, chương theo tên, bài theo slug. Bài nào đổi nội dung thì thay khối mới, bài không đổi thì giữ nguyên (không mất tiến độ quiz/flashcard của học viên). Bài có trong CSDL nhưng không có file thì giữ nguyên, không xóa.
- File sai thì báo rõ tên file và khối lỗi, không ghi gì vào CSDL.

Ví dụ đầy đủ: thư mục `content/mang-javascript/`.

## Cấu trúc thư mục

```
content/<ten-khoa-hoc>/
  khoa-hoc.md          thông tin khóa học
  01-ten-bai.md        mỗi bài một file, số đầu tên file quyết định thứ tự
  02-ten-bai.md
```

## khoa-hoc.md

```markdown
---
title: Mảng trong JavaScript
summary: Tạo, duyệt và biến đổi mảng.        (tùy chọn)
level: intermediate                           beginner | intermediate | advanced
category: frontend                            database | frontend | backend | programming | algorithms | devops | security
price: 0                                      đồng, 0 = miễn phí
path: Lập trình căn bản                       (tùy chọn) thêm khóa vào lộ trình này
path_position: 4                              (tùy chọn) thứ tự trong lộ trình, bỏ trống thì xếp cuối
instructor: khoa.nguyen@eduquest.test         (tùy chọn) giảng viên sở hữu, ưu tiên hơn --instructor
slug: mang-trong-javascript                   (tùy chọn) mặc định sinh từ title
---
Phần giới thiệu khóa học (Markdown).
```

`instructor` chỉ có tác dụng khi email đó đã có tài khoản, nếu không thì dùng giảng viên của lệnh import.

## Nạp toàn bộ khi seed

`php artisan migrate:fresh --seed` gọi `ContentSeeder`: tạo 4 giảng viên mẫu, 6 lộ trình, rồi nạp và xuất bản **mọi** thư mục trong `content/`.
Thêm khóa mới chỉ cần tạo thư mục mới theo định dạng ở đây.

Ô code chỉ chạy được JavaScript và SQL. Khóa về ngôn ngữ khác (Python, Java, C++, PHP…) viết code minh họa bằng khối ` ```python ` thường và luyện tập bằng quiz `predict`.

## File bài học

```markdown
---
title: Tạo và truy cập mảng
chapter: Làm quen với mảng                    các bài cùng tên chương nằm chung một chương
summary: Mô tả ngắn                           (tùy chọn)
duration: 12                                  phút
video: https://www.youtube.com/watch?v=...    (tùy chọn) video mở đầu bài
preview: true                                 (tùy chọn) cho học thử khi chưa đăng ký
---
```

Thân bài được chia thành các khối theo thứ tự xuất hiện:

| Viết trong file | Khối |
| --- | --- |
| `## Tiêu đề` | Phần (section), đánh số tự động |
| Đoạn văn, danh sách, bảng, code minh họa ` ```sql ` / ` ```js ` | Văn bản Markdown |
| ` ```quiz quick ` / `predict` / `test` | Quiz (Quiz nhanh / Dự đoán / Kiểm tra kiến thức) |
| ` ```code javascript ` / ` ```code sql ` | Code sandbox |
| ` ```flashcard ` | Flashcard tổng kết |
| ` ```video ` | Video |
| ` ```animation TenComponent ` | Hoạt ảnh tương tác |

### Quiz

```
? Câu hỏi
- Lựa chọn sai
* Lựa chọn đúng (đánh dấu bằng *)
> Giải thích, hiện sau khi trả lời (tùy chọn)
? Câu hỏi tiếp theo…
```

### Code sandbox

Mỗi mục bắt đầu bằng `@tên`, kéo dài tới mục sau. Chấm bài theo `@expected` (JavaScript: so với kết quả `console.log`) hoặc `@solution` (SQL: so bảng kết quả).

```
@instructions Đề bài (Markdown)
@starter
code có sẵn khi mở bài
@solution
lời giải
@setup
CREATE TABLE …;     (SQL) tạo bảng và dữ liệu mẫu
@expected
kết quả mong đợi
```

### Flashcard, video, hoạt ảnh

```
mặt trước :: mặt sau          (mỗi dòng một thẻ)
```

```
https://youtu.be/…            dòng 1: đường dẫn (YouTube hoặc .mp4)
Chú thích                     dòng 2 (tùy chọn)
```

Hoạt ảnh hiện có: `StackAnimation`, `BubbleSortAnimation`; tham số viết dạng JSON trong thân khối, ví dụ `{"values": [5, 1, 4, 2]}`.
