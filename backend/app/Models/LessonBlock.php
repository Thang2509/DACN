<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LessonBlock extends Model
{
    use HasFactory;

    public const TYPES = ['markdown', 'video', 'quiz', 'animation', 'code', 'flashcard'];

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
