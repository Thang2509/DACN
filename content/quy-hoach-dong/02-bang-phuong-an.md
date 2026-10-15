---
title: Lập bảng từ dưới lên
chapter: Ý tưởng
summary: Định nghĩa trạng thái, công thức truy hồi và bài toán leo cầu thang.
duration: 15
---
## Bốn bước giải

1. **Trạng thái**: `dp[i]` nghĩa là gì?
2. **Công thức truy hồi**: `dp[i]` tính từ các trạng thái nhỏ hơn thế nào?
3. **Giá trị khởi đầu**: `dp[0]`, `dp[1]`…
4. **Thứ tự tính**: từ nhỏ tới lớn để giá trị cần dùng đã có sẵn.

## Leo cầu thang

Mỗi bước leo 1 hoặc 2 bậc. Có bao nhiêu cách lên bậc n?

- `dp[i]` = số cách lên bậc i.
- Muốn lên bậc i thì bước cuối đến từ bậc i-1 hoặc i-2: `dp[i] = dp[i-1] + dp[i-2]`.
- `dp[0] = 1`, `dp[1] = 1`.

```code javascript
@instructions Giải bài "đổi tiền": có các mệnh giá `coins`, tìm **số tờ ít nhất** để đổi được `amount`, không đổi được thì trả -1. Gợi ý: `dp[x] = min(dp[x - c] + 1)` với mọi mệnh giá c.
@starter
function minCoins(coins, amount) {
}
console.log(minCoins([1, 5, 10, 20], 38), minCoins([5, 10], 3))
@solution
function minCoins(coins, amount) {
  const dp = new Array(amount + 1).fill(Infinity)
  dp[0] = 0
  for (let x = 1; x <= amount; x++) {
    for (const c of coins) {
      if (c <= x && dp[x - c] + 1 < dp[x]) dp[x] = dp[x - c] + 1
    }
  }
  return dp[amount] === Infinity ? -1 : dp[amount]
}
console.log(minCoins([1, 5, 10, 20], 38), minCoins([5, 10], 3))
@expected
6 -1
```

```quiz predict
? Theo công thức leo cầu thang, có bao nhiêu cách lên bậc 4?
- 4
* 5
- 8
> dp: 1, 1, 2, 3, 5 với i = 0..4.
```

## Tổng kết

```flashcard
Trạng thái dp[i] :: Ý nghĩa của kết quả lưu ở ô i
Công thức truy hồi :: Cách tính dp[i] từ các ô nhỏ hơn
Bottom-up :: Lập bảng từ nhỏ tới lớn, không cần đệ quy
Đổi tiền :: dp[x] = min(dp[x - c] + 1)
```
