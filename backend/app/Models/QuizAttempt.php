<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuizAttempt extends Model
{
    protected $fillable = ['user_id', 'lesson_block_id', 'answers', 'correct_count'];

    protected function casts(): array
    {
        return ['answers' => 'array'];
    }
}
