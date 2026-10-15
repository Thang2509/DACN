---
title: map, filter và reduce
chapter: Hàm bậc cao
summary: Biến đổi, lọc và gộp mảng mà không cần vòng lặp thủ công.
duration: 15
---
## map: biến đổi từng phần tử

```js
const doubled = [1, 2, 3].map((x) => x * 2) // [2, 4, 6]
```

## filter: giữ lại phần tử thỏa điều kiện

```js
const passed = [4, 7, 9].filter((score) => score >= 5) // [7, 9]
```

## reduce: gộp mảng thành một giá trị

```js
const total = [1, 2, 3].reduce((sum, x) => sum + x, 0) // 6
```

```code javascript
@instructions Dùng `filter` lấy các số chẵn trong `nums`, rồi in mảng kết quả bằng `console.log`.
@starter
const nums = [1, 2, 3, 4, 5, 6]
@solution
const nums = [1, 2, 3, 4, 5, 6]
console.log(nums.filter((x) => x % 2 === 0))
@expected
[ 2, 4, 6 ]
```

```quiz test
? Hàm nào trả về mảng mới có cùng số phần tử với mảng ban đầu?
* map
- filter
- reduce
> map biến đổi từng phần tử nên số phần tử không đổi.
? [1, 2, 3].reduce((s, x) => s + x, 10) bằng bao nhiêu?
- 6
* 16
- 10
> Giá trị khởi đầu là 10, cộng thêm 1 + 2 + 3.
```

## Tổng kết

```flashcard
map :: Biến đổi từng phần tử, trả về mảng mới cùng độ dài
filter :: Giữ lại phần tử thỏa điều kiện
reduce :: Gộp mảng thành một giá trị
```
