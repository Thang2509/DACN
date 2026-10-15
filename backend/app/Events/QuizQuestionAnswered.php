<?php

namespace App\Events;

use Illuminate\Foundation\Events\Dispatchable;

// Học viên vừa trả lời một câu của khối quiz
class QuizQuestionAnswered
{
    use Dispatchable;

    public function __construct(
        public int $userId,
        public int $blockId,
        public int $question,
        public bool $correct,
        public bool $perfectFirstAttempt, // vừa làm xong lượt đầu tiên của khối và đúng hết
    ) {}
}
