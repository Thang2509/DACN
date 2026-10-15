---
title: Document và collection
chapter: NoSQL
summary: Lưu dữ liệu dạng JSON, nhúng hay tham chiếu.
duration: 12
preview: true
---
## So sánh với SQL

| SQL | MongoDB |
| --- | --- |
| database | database |
| bảng (table) | collection |
| dòng (row) | document |
| cột cố định | trường linh hoạt, mỗi document có thể khác nhau |

## Một document

```json
{
  "_id": "6650f1…",
  "title": "SQL cơ bản",
  "level": "beginner",
  "tags": ["sql", "database"],
  "lessons": [
    { "title": "SELECT", "minutes": 10 },
    { "title": "WHERE", "minutes": 12 }
  ]
}
```

## Nhúng hay tham chiếu

- **Nhúng** (embed) khi dữ liệu con luôn đọc cùng cha và không quá lớn: bài học trong khóa học.
- **Tham chiếu** (lưu `_id`) khi dữ liệu dùng chung hoặc tăng không giới hạn: học viên, bình luận.

```code javascript
@instructions Document MongoDB chính là đối tượng JavaScript. Từ document `course`, in tổng số phút của các bài học và danh sách tiêu đề.
@starter
const course = {
  title: 'SQL cơ bản',
  lessons: [{ title: 'SELECT', minutes: 10 }, { title: 'WHERE', minutes: 12 }, { title: 'JOIN', minutes: 15 }],
}
@solution
const course = {
  title: 'SQL cơ bản',
  lessons: [{ title: 'SELECT', minutes: 10 }, { title: 'WHERE', minutes: 12 }, { title: 'JOIN', minutes: 15 }],
}
console.log(course.lessons.reduce((sum, lesson) => sum + lesson.minutes, 0))
console.log(course.lessons.map((lesson) => lesson.title))
@expected
37
[ 'SELECT', 'WHERE', 'JOIN' ]
```

## Tổng kết

```flashcard
Collection :: Tập hợp document, tương tự bảng
Document :: Bản ghi dạng JSON, tương tự dòng
_id :: Khóa chính tự sinh của mỗi document
Nhúng vs tham chiếu :: Đọc cùng nhau thì nhúng, dùng chung thì tham chiếu
```
