---
title: Cái túi và dãy con chung
chapter: Bài toán kinh điển
summary: Quy hoạch động hai chiều.
duration: 15
---
## Bài toán cái túi 0/1

Túi chịu được tối đa W kg, mỗi món có khối lượng và giá trị, mỗi món lấy hoặc không. Tìm tổng giá trị lớn nhất.

`dp[w]` = giá trị lớn nhất với sức chứa w. Với mỗi món (khối lượng `wt`, giá trị `val`), duyệt w **từ lớn về nhỏ**:

```js
dp[w] = Math.max(dp[w], dp[w - wt] + val)
```

Duyệt ngược để mỗi món chỉ được dùng một lần.

## Dãy con chung dài nhất (LCS)

`dp[i][j]` = độ dài LCS của `a` (i ký tự đầu) và `b` (j ký tự đầu):

- Nếu `a[i-1] === b[j-1]`: `dp[i][j] = dp[i-1][j-1] + 1`.
- Ngược lại: `dp[i][j] = max(dp[i-1][j], dp[i][j-1])`.

Ứng dụng: so sánh hai phiên bản file (git diff), kiểm tra đạo văn.

```code javascript
@instructions Cài đặt `knapsack(items, capacity)` với `items` là mảng `[khối lượng, giá trị]`.
@starter
function knapsack(items, capacity) {
}
console.log(knapsack([[1, 1], [3, 4], [4, 5], [5, 7]], 7))
@solution
function knapsack(items, capacity) {
  const dp = new Array(capacity + 1).fill(0)
  for (const [wt, val] of items) {
    for (let w = capacity; w >= wt; w--) {
      dp[w] = Math.max(dp[w], dp[w - wt] + val)
    }
  }
  return dp[capacity]
}
console.log(knapsack([[1, 1], [3, 4], [4, 5], [5, 7]], 7))
@expected
9
```

```code javascript
@instructions Cài đặt `lcs(a, b)` trả về độ dài dãy con chung dài nhất của hai chuỗi.
@starter
function lcs(a, b) {
}
console.log(lcs('ABCBDAB', 'BDCABA'), lcs('react', 'redux'))
@solution
function lcs(a, b) {
  const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0))
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1])
    }
  }
  return dp[a.length][b.length]
}
console.log(lcs('ABCBDAB', 'BDCABA'), lcs('react', 'redux'))
@expected
4 2
```

## Tổng kết

```flashcard
Cái túi 0/1 :: Mỗi món lấy hoặc không, tối đa giá trị trong giới hạn khối lượng
Duyệt w ngược :: Đảm bảo mỗi món chỉ dùng một lần
LCS :: Dãy con chung dài nhất của hai chuỗi
dp hai chiều :: dp[i][j] phụ thuộc ô trên, trái và chéo
```
