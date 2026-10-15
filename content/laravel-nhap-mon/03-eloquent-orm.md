---
title: Eloquent ORM
chapter: Dữ liệu
summary: Truy vấn bằng model, quan hệ và tránh lỗi N+1.
duration: 15
---
## Truy vấn cơ bản

```php
$posts = Post::where('published', true)->orderByDesc('created_at')->get();
$post = Post::find(1);
$post = Post::create(['title' => 'Xin chào', 'body' => '…']);   // cần khai báo $fillable
$post->update(['title' => 'Tiêu đề mới']);
$post->delete();
```

Eloquent sinh câu SQL tương ứng, ví dụ dòng đầu là `SELECT * FROM posts WHERE published = 1 ORDER BY created_at DESC`.

## Quan hệ

```php
class Post extends Model
{
    protected $fillable = ['title', 'body'];

    public function author() { return $this->belongsTo(User::class, 'user_id'); }
    public function comments() { return $this->hasMany(Comment::class); }
}

$post->author->name;
$post->comments()->count();
```

## Lỗi N+1

```php
// 1 truy vấn lấy bài + N truy vấn lấy tác giả của từng bài
foreach (Post::all() as $post) echo $post->author->name;

// Chỉ 2 truy vấn
foreach (Post::with('author')->get() as $post) echo $post->author->name;
```

```quiz test
? `with('author')` dùng để làm gì?
- Lọc bài có tác giả
* Tải trước quan hệ author, tránh lỗi N+1
- Sắp xếp theo tác giả
> Eager loading gom việc lấy tác giả vào một truy vấn.
? Vì sao `Post::create([...])` cần `$fillable`?
* Để chặn gán hàng loạt các cột không mong muốn
- Để tăng tốc truy vấn
- Để tạo bảng
> Mass assignment protection: chỉ cột trong $fillable được gán từ mảng.
```

## Tổng kết

```flashcard
belongsTo :: Quan hệ nhiều-một (bài viết thuộc về tác giả)
hasMany :: Quan hệ một-nhiều (bài viết có nhiều bình luận)
with('quan_he') :: Eager loading, tránh N+1
$fillable :: Danh sách cột được phép gán hàng loạt
```
