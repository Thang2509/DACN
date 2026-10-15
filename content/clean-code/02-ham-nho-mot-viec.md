---
title: Hàm nhỏ, làm một việc
chapter: Viết code dễ đọc
summary: Tách hàm, return sớm, tránh lồng if sâu.
duration: 12
---
## Return sớm

```js
// Lồng nhiều tầng
function canEnroll(user, course) {
  if (user) {
    if (course.published) {
      if (!user.enrolled.includes(course.id)) {
        return true
      }
    }
  }
  return false
}

// Return sớm: đọc từ trên xuống
function canEnroll(user, course) {
  if (!user) return false
  if (!course.published) return false
  return !user.enrolled.includes(course.id)
}
```

## Một hàm, một việc

Hàm vừa kiểm tra dữ liệu, vừa tính tiền, vừa gửi email nên tách thành 3 hàm. Dấu hiệu cần tách: phải dùng chữ "và" khi mô tả hàm.

```code javascript
@instructions Viết lại hàm `grade(score)` bằng return sớm, không dùng else: từ 8 trở lên là "Giỏi", từ 5 là "Đạt", còn lại "Chưa đạt"; điểm ngoài khoảng 0–10 trả về "Không hợp lệ".
@starter
function grade(score) {
}
console.log([9, 5, 2, 11].map(grade))
@solution
function grade(score) {
  if (score < 0 || score > 10) return 'Không hợp lệ'
  if (score >= 8) return 'Giỏi'
  if (score >= 5) return 'Đạt'
  return 'Chưa đạt'
}
console.log([9, 5, 2, 11].map(grade))
@expected
[ 'Giỏi', 'Đạt', 'Chưa đạt', 'Không hợp lệ' ]
```

## Tổng kết

```flashcard
Return sớm :: Xử lý trường hợp đặc biệt trước, tránh if lồng sâu
Một hàm một việc :: Mô tả hàm mà cần chữ "và" thì nên tách
Hàm ngắn :: Dễ đặt tên, dễ kiểm thử, dễ tái sử dụng
```
