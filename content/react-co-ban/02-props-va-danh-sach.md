---
title: Props và danh sách
chapter: Nền tảng React
summary: Truyền dữ liệu vào component, render danh sách với key.
duration: 15
---
## Props

```jsx
function CourseCard({ title, price }) {
  return (
    <div className="card">
      <h3>{title}</h3>
      <p>{price ? `${price}đ` : 'Miễn phí'}</p>
    </div>
  )
}

<CourseCard title="SQL cơ bản" price={0} />
```

Props là **dữ liệu đầu vào chỉ đọc**; component không tự sửa props của mình.

## Render danh sách

```jsx
function CourseList({ courses }) {
  return courses.map((course) => <CourseCard key={course.id} {...course} />)
}
```

`key` giúp React nhận ra phần tử nào thêm, xóa hay đổi chỗ. Dùng id ổn định, **không** dùng chỉ số mảng khi danh sách có thể thay đổi.

```code javascript
@instructions Không có React trong ô chạy thử, nhưng `map` thì giống hệt. Từ mảng `courses`, tạo mảng chuỗi dạng "Tên - Giá" (giá 0 thì ghi "Miễn phí") rồi in ra.
@starter
const courses = [{ title: 'SQL', price: 0 }, { title: 'React', price: 199000 }]
@solution
const courses = [{ title: 'SQL', price: 0 }, { title: 'React', price: 199000 }]
console.log(courses.map((c) => `${c.title} - ${c.price ? c.price : 'Miễn phí'}`))
@expected
[ 'SQL - Miễn phí', 'React - 199000' ]
```

## Tổng kết

```flashcard
Props :: Dữ liệu cha truyền vào component con, chỉ đọc
key :: Định danh ổn định cho phần tử trong danh sách
{...course} :: Truyền mọi thuộc tính của đối tượng làm props
```
