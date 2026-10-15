<?php

namespace App\Events;

use Illuminate\Foundation\Events\Dispatchable;

// Học viên hoàn thành một bài học lần đầu
class LessonCompleted
{
    use Dispatchable;

    public function __construct(
        public int $userId,
        public int $lessonId,
        public bool $courseCompleted, // bài này là bài cuối cùng còn lại của khóa
    ) {}
}
