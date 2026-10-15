---
title: Phân quyền theo vai trò
chapter: Phân quyền
summary: Vai trò, quyền và kiểm tra quyền sở hữu tài nguyên.
duration: 12
---
## RBAC

Mỗi người dùng có **vai trò** (role), mỗi vai trò có một tập **quyền**:

| Vai trò | Ví dụ quyền |
| --- | --- |
| Học viên | học bài, mua khóa học |
| Giảng viên | tạo, sửa khóa học **của mình** |
| Quản trị viên | duyệt khóa học, quản lý người dùng |

## Kiểm tra quyền sở hữu

Chỉ kiểm tra vai trò là chưa đủ: giảng viên A không được sửa khóa của giảng viên B.

```php
// Laravel Policy
public function update(User $user, Course $course): bool
{
    return $user->isAdmin() || $course->instructor_id === $user->id;
}
```

Luôn kiểm tra quyền ở **máy chủ**. Ẩn nút ở giao diện chỉ là để đẹp, kẻ xấu vẫn gọi thẳng API được.

```code javascript
@instructions Viết hàm `canEdit(user, course)`: quản trị viên sửa được mọi khóa, giảng viên chỉ sửa khóa có `instructorId` bằng `id` của mình, học viên không sửa được.
@starter
function canEdit(user, course) {
}
const course = { id: 1, instructorId: 7 }
console.log(canEdit({ id: 1, role: 'admin' }, course))
console.log(canEdit({ id: 7, role: 'instructor' }, course))
console.log(canEdit({ id: 8, role: 'instructor' }, course))
console.log(canEdit({ id: 7, role: 'student' }, course))
@solution
function canEdit(user, course) {
  if (user.role === 'admin') return true
  return user.role === 'instructor' && course.instructorId === user.id
}
const course = { id: 1, instructorId: 7 }
console.log(canEdit({ id: 1, role: 'admin' }, course))
console.log(canEdit({ id: 7, role: 'instructor' }, course))
console.log(canEdit({ id: 8, role: 'instructor' }, course))
console.log(canEdit({ id: 7, role: 'student' }, course))
@expected
true
true
false
false
```

## Tổng kết

```flashcard
Xác thực :: Bạn là ai
Phân quyền :: Bạn được làm gì
RBAC :: Phân quyền theo vai trò
Kiểm tra ở máy chủ :: Ẩn nút ở giao diện không thay được kiểm tra quyền
```
