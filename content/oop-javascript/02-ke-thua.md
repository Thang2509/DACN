---
title: Kế thừa và ghi đè
chapter: OOP trong JavaScript
summary: extends, super và đa hình.
duration: 15
---
## extends và super

```js
class Block {
  constructor(title) {
    this.title = title
  }
  minutes() {
    return 1
  }
  describe() {
    return `${this.title}: ${this.minutes()} phút`
  }
}

class VideoBlock extends Block {
  constructor(title, seconds) {
    super(title)            // gọi constructor lớp cha
    this.seconds = seconds
  }
  minutes() {               // ghi đè
    return Math.ceil(this.seconds / 60)
  }
}
```

`describe()` viết một lần ở lớp cha nhưng tự dùng đúng `minutes()` của từng lớp con: đó là **đa hình**.

```code javascript
@instructions Thêm class `QuizBlock` kế thừa `Block`, nhận số câu hỏi; mỗi câu mất 2 phút. In mô tả của cả hai khối.
@starter
class Block {
  constructor(title) { this.title = title }
  minutes() { return 1 }
  describe() { return `${this.title}: ${this.minutes()} phút` }
}
class VideoBlock extends Block {
  constructor(title, seconds) { super(title); this.seconds = seconds }
  minutes() { return Math.ceil(this.seconds / 60) }
}
// viết QuizBlock ở đây

const blocks = [new VideoBlock('Giới thiệu', 150), new QuizBlock('Kiểm tra', 4)]
blocks.forEach((block) => console.log(block.describe()))
@solution
class Block {
  constructor(title) { this.title = title }
  minutes() { return 1 }
  describe() { return `${this.title}: ${this.minutes()} phút` }
}
class VideoBlock extends Block {
  constructor(title, seconds) { super(title); this.seconds = seconds }
  minutes() { return Math.ceil(this.seconds / 60) }
}
class QuizBlock extends Block {
  constructor(title, questions) { super(title); this.questions = questions }
  minutes() { return this.questions * 2 }
}

const blocks = [new VideoBlock('Giới thiệu', 150), new QuizBlock('Kiểm tra', 4)]
blocks.forEach((block) => console.log(block.describe()))
@expected
Giới thiệu: 3 phút
Kiểm tra: 8 phút
```

## Tổng kết

```flashcard
extends :: Lớp con kế thừa lớp cha
super(...) :: Gọi constructor của lớp cha
Ghi đè :: Lớp con định nghĩa lại phương thức của cha
Đa hình :: Cùng lời gọi, mỗi lớp con xử lý khác nhau
```
