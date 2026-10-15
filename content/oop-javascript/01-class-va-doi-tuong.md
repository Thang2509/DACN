---
title: Class và đối tượng
chapter: OOP trong JavaScript
summary: constructor, phương thức và từ khóa this.
duration: 12
preview: true
---
## Khai báo class

```js
class Pet {
  constructor(name) {
    this.name = name
    this.hunger = 50
  }

  feed(amount) {
    this.hunger = Math.max(0, this.hunger - amount)
    return this
  }
}

const husky = new Pet('Husky')
husky.feed(20).feed(40)
console.log(husky.hunger) // 0
```

- `constructor` chạy khi tạo đối tượng bằng `new`.
- `this` trỏ tới đối tượng đang gọi phương thức.
- Trả về `this` cho phép **gọi nối chuỗi** `feed().feed()`.

```code javascript
@instructions Viết class `Wallet` có số dư ban đầu 0, phương thức `earn(coins)` cộng xu và `spend(coins)` trừ xu, trả về `false` nếu không đủ tiền. In số dư sau các thao tác.
@starter
class Wallet {
}
const wallet = new Wallet()
wallet.earn(100)
console.log(wallet.spend(30), wallet.spend(200), wallet.balance)
@solution
class Wallet {
  constructor() {
    this.balance = 0
  }
  earn(coins) {
    this.balance += coins
  }
  spend(coins) {
    if (coins > this.balance) return false
    this.balance -= coins
    return true
  }
}
const wallet = new Wallet()
wallet.earn(100)
console.log(wallet.spend(30), wallet.spend(200), wallet.balance)
@expected
true false 70
```

## Tổng kết

```flashcard
class :: Bản thiết kế tạo đối tượng
constructor :: Hàm chạy khi gọi new
this :: Đối tượng đang gọi phương thức
return this :: Cho phép gọi nối chuỗi phương thức
```
