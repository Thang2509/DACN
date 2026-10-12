<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Support\Facades\Storage;

class Course extends Model
{
    use HasFactory;

    public const LEVELS = ['beginner', 'intermediate', 'advanced'];

    public const STATUS_DRAFT = 'draft';
    public const STATUS_PENDING = 'pending';
    public const STATUS_PUBLISHED = 'published';
    public const STATUS_REJECTED = 'rejected';

    protected $fillable = ['title', 'summary', 'description', 'level', 'price'];

    protected $hidden = ['thumbnail_path'];

    protected $appends = ['thumbnail_url'];

    protected function casts(): array
    {
        return [
            'price' => 'integer',
            'published_at' => 'datetime',
        ];
    }

    public function instructor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'instructor_id');
    }

    public function chapters(): HasMany
    {
        return $this->hasMany(Chapter::class)->orderBy('position');
    }

    public function lessons(): HasManyThrough
    {
        return $this->hasManyThrough(Lesson::class, Chapter::class);
    }

    public function learningPaths(): BelongsToMany
    {
        return $this->belongsToMany(LearningPath::class)->withPivot('position');
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class);
    }

    public function scopePublished(Builder $query): void
    {
        $query->where('status', self::STATUS_PUBLISHED);
    }

    // Tìm kiếm và lọc ở trang danh mục; sort "popular" cần withCount('enrollments') trước
    public function scopeFilter(Builder $query, array $filters): void
    {
        $query
            ->when($filters['search'] ?? null, fn ($q, $search) => $q->where(
                fn ($q) => $q->where('title', 'like', "%{$search}%")->orWhere('summary', 'like', "%{$search}%")
            ))
            ->when($filters['level'] ?? null, fn ($q, $level) => $q->where('level', $level))
            ->when(($filters['price'] ?? null) === 'free', fn ($q) => $q->where('price', 0))
            ->when(($filters['price'] ?? null) === 'paid', fn ($q) => $q->where('price', '>', 0))
            ->when($filters['path'] ?? null, fn ($q, $slug) => $q->whereHas('learningPaths', fn ($q) => $q->where('slug', $slug)));

        if (($filters['sort'] ?? 'newest') === 'popular') {
            $query->orderByDesc('enrollments_count');
        }
        $query->latest('published_at');
    }

    // Còn sửa nội dung và xóa được khi chưa có học viên nhìn thấy
    public function isEditableDraft(): bool
    {
        return in_array($this->status, [self::STATUS_DRAFT, self::STATUS_REJECTED]);
    }

    public function getThumbnailUrlAttribute(): ?string
    {
        return $this->thumbnail_path ? Storage::disk('public')->url($this->thumbnail_path) : null;
    }
}
