---
title: Interface và type
chapter: Kiểu dữ liệu
summary: Mô tả hình dạng đối tượng, thuộc tính tùy chọn và mảng.
duration: 15
---
## Mô tả đối tượng

```ts
interface Course {
  id: number
  title: string
  price: number
  summary?: string        // tùy chọn
  readonly slug: string   // không gán lại được
}

const course: Course = { id: 1, title: 'SQL cơ bản', price: 0, slug: 'sql-co-ban' }
```

## type

```ts
type Level = 'beginner' | 'intermediate' | 'advanced'  // chỉ 3 giá trị này
type Id = number | string
```

`interface` dùng cho đối tượng và mở rộng được (`extends`); `type` linh hoạt hơn, dùng cho kiểu hợp, chuỗi cố định…

## Mảng và hàm

```ts
const scores: number[] = [9, 8, 10]
type Formatter = (value: number) => string
```

```quiz quick
? `summary?: string` nghĩa là gì?
- summary bắt buộc là chuỗi rỗng
* summary có thể không có
- summary có thể là bất kỳ kiểu nào
> Dấu ? đánh dấu thuộc tính tùy chọn.
```

## Tổng kết

```flashcard
interface :: Mô tả hình dạng một đối tượng
thuộc tính? :: Thuộc tính tùy chọn
'a' | 'b' :: Kiểu chỉ nhận đúng các giá trị liệt kê
readonly :: Không được gán lại sau khi tạo
```
