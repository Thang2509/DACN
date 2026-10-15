---
title: Validation và migration
chapter: Dữ liệu
summary: Kiểm tra dữ liệu gửi lên bằng Form Request, quản lý bảng bằng migration.
duration: 15
---
## Migration

```php
Schema::create('posts', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->string('title', 200);
    $table->text('body');
    $table->boolean('published')->default(false);
    $table->timestamps();
});
```

Migration là **lịch sử thay đổi** cấu trúc CSDL, cả nhóm chạy `php artisan migrate` là có cùng cấu trúc bảng.

## Form Request

```php
class StorePostRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'title' => 'required|string|max:200',
            'body' => 'required|string',
        ];
    }
}

public function store(StorePostRequest $request)
{
    return $request->user()->posts()->create($request->validated());
}
```

Dữ liệu sai thì Laravel tự trả **422** kèm thông báo lỗi từng trường, hàm `store` không chạy.

```quiz test
? Dữ liệu không qua được rules của Form Request thì API trả mã gì?
- 400
* 422
- 500
> 422 Unprocessable Entity kèm danh sách lỗi theo trường.
? `$request->validated()` trả về gì?
* Chỉ các trường đã khai báo trong rules và hợp lệ
- Toàn bộ dữ liệu gửi lên
- true hoặc false
> Chỉ lấy trường đã kiểm tra giúp tránh gán nhầm cột.
? `foreignId('user_id')->constrained()` tạo ra gì?
- Cột user_id thường
* Cột user_id có khóa ngoại tới bảng users
- Bảng users mới
> constrained() suy ra bảng users và tạo ràng buộc khóa ngoại.
```

## Tổng kết

```flashcard
Migration :: Mô tả thay đổi cấu trúc bảng bằng code
Form Request :: Lớp chứa quy tắc kiểm tra dữ liệu gửi lên
422 :: Mã lỗi dữ liệu không hợp lệ
validated() :: Lấy dữ liệu đã qua kiểm tra
```
