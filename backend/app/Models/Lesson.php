<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Lesson extends Model
{
    use HasFactory;

    protected $fillable = ['title', 'summary', 'intro_video_url', 'duration_minutes', 'position', 'is_preview'];

    protected function casts(): array
    {
        return ['is_preview' => 'boolean', 'duration_minutes' => 'integer'];
    }

    public function chapter(): BelongsTo
    {
        return $this->belongsTo(Chapter::class);
    }

    public function blocks(): HasMany
    {
        return $this->hasMany(LessonBlock::class)->orderBy('position');
    }

    // Các lượt hoàn thành bài của học viên
    public function progress(): HasMany
    {
        return $this->hasMany(LessonProgress::class);
    }
}
