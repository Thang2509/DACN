---
title: Kế thừa và đa hình
chapter: Nền tảng OOP
summary: extends, override, abstract và interface.
duration: 15
---
## Kế thừa

```java
public abstract class Lesson {
    protected String title;
    public Lesson(String title) { this.title = title; }
    public abstract int minutes();          // lớp con bắt buộc cài đặt
}

public class VideoLesson extends Lesson {
    private int seconds;
    public VideoLesson(String title, int seconds) { super(title); this.seconds = seconds; }
    @Override
    public int minutes() { return seconds / 60; }
}

public class QuizLesson extends Lesson {
    private int questions;
    public QuizLesson(String title, int questions) { super(title); this.questions = questions; }
    @Override
    public int minutes() { return questions * 2; }
}
```

## Đa hình

Cùng lời gọi `minutes()`, mỗi lớp con xử lý theo cách riêng:

```java
List<Lesson> lessons = List.of(new VideoLesson("Giới thiệu", 600), new QuizLesson("Kiểm tra", 5));
int total = 0;
for (Lesson lesson : lessons) total += lesson.minutes();
System.out.println(total);
```

## Interface

```java
public interface Payable {
    int price();
}
public class Course implements Payable { … }
```

Một lớp chỉ `extends` được **một** lớp cha nhưng `implements` được nhiều interface.

```quiz predict
? Đoạn tính `total` ở trên in ra gì?
- 15
* 20
- 605
> VideoLesson: 600 / 60 = 10 phút; QuizLesson: 5 × 2 = 10 phút; tổng 20.
```

## Tổng kết

```flashcard
extends :: Kế thừa một lớp cha
@Override :: Ghi đè phương thức của lớp cha
abstract :: Lớp/phương thức chưa hoàn chỉnh, lớp con phải cài đặt
implements :: Cài đặt một hoặc nhiều interface
```
