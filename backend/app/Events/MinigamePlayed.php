<?php

namespace App\Events;

use Illuminate\Foundation\Events\Dispatchable;

// Học viên chơi xong một lượt minigame
class MinigamePlayed
{
    use Dispatchable;

    public function __construct(
        public int $userId,
        public int $scoreId,
        public int $playOfDay, // lượt thứ mấy trong ngày (chỉ 4 lượt đầu có thưởng)
    ) {}
}
