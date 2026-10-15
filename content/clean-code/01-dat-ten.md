---
title: Đặt tên rõ nghĩa
chapter: Viết code dễ đọc
summary: Tên nói lên mục đích, tránh viết tắt khó hiểu.
duration: 10
preview: true
---
## Tên tốt trả lời "để làm gì"

```js
// Khó hiểu
const d = 7
function calc(a, b) { return a * b * 0.9 }

// Dễ hiểu
const TRIAL_DAYS = 7
function priceAfterDiscount(price, quantity) {
  const DISCOUNT_RATE = 0.9
  return price * quantity * DISCOUNT_RATE
}
```

## Quy tắc nhanh

- Biến, hằng: danh từ (`courseCount`, `activePet`).
- Hàm: động từ (`loadCourses`, `calculateXp`).
- Giá trị đúng/sai: `is`, `has`, `can` (`isPublished`, `hasVoucher`).
- Thay **số ma thuật** (`86400`, `0.9`) bằng hằng có tên.
- Nhất quán: đã dùng `fetch` thì đừng chỗ khác lại dùng `get`, `retrieve` cho cùng việc.

```quiz quick
? Tên nào tốt nhất cho biến lưu việc học viên đã mua khóa học hay chưa?
- flag
- data2
* hasPurchased
> Tiền tố has cho biết đây là giá trị đúng/sai và nói rõ ý nghĩa.
```

## Tổng kết

```flashcard
Số ma thuật :: Con số không rõ nghĩa, nên thay bằng hằng có tên
is / has / can :: Tiền tố cho biến đúng/sai
Hàm :: Đặt tên bằng động từ
Biến :: Đặt tên bằng danh từ
```
