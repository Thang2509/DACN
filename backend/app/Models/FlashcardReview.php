<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

// Lịch ôn một thẻ flashcard của một học viên (thuật toán SM-2)
class FlashcardReview extends Model
{
    protected $fillable = ['user_id', 'lesson_block_id', 'card_index', 'easiness', 'interval_days', 'repetitions', 'review_count', 'due_on', 'last_reviewed_at'];

    protected function casts(): array
    {
        return ['easiness' => 'float', 'due_on' => 'date', 'last_reviewed_at' => 'datetime'];
    }

    public function block(): BelongsTo
    {
        return $this->belongsTo(LessonBlock::class, 'lesson_block_id');
    }
}
