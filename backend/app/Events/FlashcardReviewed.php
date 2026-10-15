<?php

namespace App\Events;

use Illuminate\Foundation\Events\Dispatchable;

// Học viên ôn một thẻ flashcard đến hạn
class FlashcardReviewed
{
    use Dispatchable;

    public function __construct(
        public int $userId,
        public int $blockId,
        public int $cardIndex,
    ) {}
}
