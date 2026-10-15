---
title: Lớp và đối tượng
chapter: Nền tảng OOP
summary: Thuộc tính, constructor, phương thức và đóng gói.
duration: 15
preview: true
---
## Lớp là bản thiết kế

```java
public class Course {
    private String title;      // private: chỉ dùng trong lớp
    private int price;

    public Course(String title, int price) {   // constructor
        this.title = title;
        this.price = price;
    }

    public boolean isFree() {
        return price == 0;
    }

    public String getTitle() { return title; }
}

Course sql = new Course("SQL cơ bản", 0);
System.out.println(sql.getTitle() + " miễn phí: " + sql.isFree());
```

## Đóng gói (encapsulation)

Thuộc tính để `private`, bên ngoài chỉ truy cập qua phương thức `public`. Nhờ vậy lớp tự kiểm soát dữ liệu, ví dụ không cho đặt giá âm.

```quiz predict
? `new Course("Java", 249000).isFree()` trả về gì?
- true
* false
- 249000
> price khác 0 nên isFree trả về false.
```

```quiz quick
? Từ khóa nào khiến thuộc tính chỉ truy cập được bên trong lớp?
* private
- public
- static
> private là mức truy cập hẹp nhất.
```

## Tổng kết

```flashcard
Lớp :: Bản thiết kế mô tả thuộc tính và hành vi
Đối tượng :: Thực thể tạo từ lớp bằng new
Constructor :: Hàm khởi tạo cùng tên lớp
Đóng gói :: Thuộc tính private, truy cập qua phương thức public
```
