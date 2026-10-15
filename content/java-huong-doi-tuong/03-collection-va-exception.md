---
title: Collection và ngoại lệ
chapter: Java thực hành
summary: ArrayList, HashMap, try/catch.
duration: 15
---
## Collection

```java
List<String> names = new ArrayList<>();
names.add("An");
names.add("Bình");
System.out.println(names.size());          // 2

Map<String, Integer> scores = new HashMap<>();
scores.put("An", 9);
scores.put("An", 10);                       // cùng khóa thì ghi đè
System.out.println(scores.get("An"));       // 10
System.out.println(scores.getOrDefault("Chi", 0));
```

`<String>` là **generic**: danh sách chỉ chứa chuỗi, sai kiểu là lỗi biên dịch.

## Ngoại lệ

```java
try {
    int page = Integer.parseInt("abc");
} catch (NumberFormatException e) {
    System.out.println("Số trang không hợp lệ");
} finally {
    System.out.println("Luôn chạy");
}
```

```quiz predict
? `Map<String,Integer> m = new HashMap<>(); m.put("a", 1); m.put("a", 2); System.out.println(m.size());` in ra gì?
* 1
- 2
- Lỗi khóa trùng
> HashMap không có khóa trùng, put lần hai ghi đè giá trị.
```

```quiz predict
? Khối `try { … } catch … finally { print("Luôn chạy") }` không ném lỗi thì "Luôn chạy" có in không?
* Có
- Không
> finally luôn chạy dù có lỗi hay không.
```

## Tổng kết

```flashcard
ArrayList :: Danh sách động, truy cập theo chỉ số
HashMap :: Bảng khóa → giá trị, khóa không trùng
List<String> :: Generic, chỉ chứa phần tử kiểu String
finally :: Khối luôn chạy sau try/catch
```
