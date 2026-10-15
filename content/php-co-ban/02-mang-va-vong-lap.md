---
title: Mảng và vòng lặp
chapter: Cú pháp PHP
summary: Mảng chỉ số, mảng kết hợp và foreach.
duration: 12
---
## Hai loại mảng

```php
<?php
$languages = ['PHP', 'JavaScript', 'SQL'];         // mảng chỉ số: 0, 1, 2
$student = ['name' => 'An', 'score' => 9];         // mảng kết hợp: khóa => giá trị

echo $languages[0];        // PHP
echo $student['name'];     // An
$languages[] = 'Python';   // thêm vào cuối
echo count($languages);    // 4
```

## foreach

```php
foreach ($student as $key => $value) {
    echo "$key: $value\n";
}
// name: An
// score: 9
```

## Hàm mảng hay dùng

```php
$scores = [7, 9, 5];
$passed = array_filter($scores, fn ($s) => $s >= 6);   // [7, 9]
$doubled = array_map(fn ($s) => $s * 2, $scores);      // [14, 18, 10]
echo array_sum($scores);                               // 21
```

```quiz predict
? `$a = [1, 2]; $a[] = 3; echo count($a);` in ra gì?
- 2
* 3
- Lỗi
> $a[] = 3 thêm phần tử vào cuối mảng.
```

## Tổng kết

```flashcard
['k' => 'v'] :: Mảng kết hợp, truy cập bằng khóa
$a[] = x :: Thêm phần tử vào cuối mảng
foreach ($a as $k => $v) :: Duyệt mảng kèm khóa
array_map / array_filter :: Biến đổi / lọc mảng
```
