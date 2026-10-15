---
title: Route và controller
chapter: Bắt đầu với Laravel
summary: Định tuyến, tham số và controller resource.
duration: 15
---
## Route

```php
// routes/api.php
use App\Http\Controllers\PostController;

Route::get('/posts', [PostController::class, 'index']);
Route::get('/posts/{post}', [PostController::class, 'show']);
Route::post('/posts', [PostController::class, 'store'])->middleware('auth:sanctum');
```

## Controller

```php
class PostController extends Controller
{
    public function index()
    {
        return Post::latest()->paginate(10);   // tự trả JSON
    }

    public function show(Post $post)            // route model binding
    {
        return $post;
    }
}
```

**Route model binding**: tham số `{post}` được Laravel tự tìm bản ghi theo id; không thấy thì trả 404, không cần tự viết `find`.

## Nguyên tắc

Controller chỉ nên **nhận, kiểm tra dữ liệu và trả kết quả**. Nghiệp vụ phức tạp (tính tiền, phát thưởng…) đặt ở lớp Service để dễ kiểm thử, giống cách EduQuest làm.

```quiz predict
? Gọi `GET /posts/999` khi không có bài id 999, với `show(Post $post)` thì sao?
- $post là null
* Laravel trả về 404
- Lỗi 500
> Route model binding tự trả 404 khi không tìm thấy bản ghi.
```

## Tổng kết

```flashcard
Gắn đường dẫn với hàm controller :: Route::get('/posts', [PostController::class, 'index'])
{post} + Post $post :: Route model binding, tự tìm bản ghi
->middleware('auth:sanctum') :: Bắt buộc đăng nhập
Service :: Nơi đặt nghiệp vụ, controller chỉ điều phối
```
