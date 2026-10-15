---
title: Tối ưu bằng cấu trúc dữ liệu
chapter: Áp dụng
summary: Dùng Set/Map để giảm từ O(n²) xuống O(n).
duration: 15
---
## Bài toán tìm phần tử trùng

```js
// O(n²): includes tự duyệt mảng bên trong vòng lặp
function hasDuplicate(items) {
  for (let i = 0; i < items.length; i++) {
    if (items.slice(i + 1).includes(items[i])) return true
  }
  return false
}

// O(n): Set tra cứu trong O(1)
function hasDuplicateFast(items) {
  const seen = new Set()
  for (const item of items) {
    if (seen.has(item)) return true
    seen.add(item)
  }
  return false
}
```

Đánh đổi: dùng thêm bộ nhớ O(n) để tiết kiệm thời gian.

```code javascript
@instructions Bài toán "hai số có tổng bằng target": trả về cặp chỉ số `[i, j]` đầu tiên có `nums[i] + nums[j] === target`. Dùng `Map` để làm trong O(n) thay vì hai vòng lặp.
@starter
function twoSum(nums, target) {
}
console.log(twoSum([2, 7, 11, 15], 9))
console.log(twoSum([3, 2, 4], 6))
@solution
function twoSum(nums, target) {
  const indexOf = new Map()
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i]
    if (indexOf.has(need)) return [indexOf.get(need), i]
    indexOf.set(nums[i], i)
  }
  return null
}
console.log(twoSum([2, 7, 11, 15], 9))
console.log(twoSum([3, 2, 4], 6))
@expected
[ 0, 1 ]
[ 1, 2 ]
```

## Tổng kết

```flashcard
Set.has :: Kiểm tra phần tử có trong tập hợp, trung bình O(1)
Map :: Lưu cặp khóa → giá trị, tra cứu O(1)
Đánh đổi không gian - thời gian :: Dùng thêm bộ nhớ để chạy nhanh hơn
```
