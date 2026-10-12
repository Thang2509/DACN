<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LessonBlock extends Model
{
    use HasFactory;

    // section: tiêu đề "Phần" chia bài thành nhiều phần
    public const TYPES = ['section', 'markdown', 'video', 'quiz', 'animation', 'code', 'flashcard'];

    protected $fillable = ['type', 'content', 'position'];

    protected function casts(): array
    {
        return ['content' => 'array'];
    }

    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }
}
