<?php

namespace App\Listeners;

use App\Events\MinigamePlayed;
use App\Models\MinigameScore;
use App\Models\User;
use App\Services\BadgeService;
use App\Services\MinigameService;
use App\Services\PetService;
use App\Services\RewardService;
use Illuminate\Contracts\Queue\ShouldQueue;

// Chạy qua hàng đợi: thưởng xu cho 4 lượt chơi đầu mỗi ngày (R12); thú vui hơn nhưng mệt hơn
class GrantMinigameRewards implements ShouldQueue
{
    public function __construct(
        private RewardService $rewards,
        private PetService $pets,
        private BadgeService $badges,
    ) {}

    public function handle(MinigamePlayed $event): void
    {
        $user = User::findOrFail($event->userId);
        $record = MinigameScore::findOrFail($event->scoreId);

        $coins = MinigameService::coinsFor($record->score);
        if ($event->playOfDay <= MinigameService::REWARDED_PLAYS_PER_DAY && $coins > 0) {
            $key = "minigame:{$user->id}:{$record->created_at->toDateString()}:{$event->playOfDay}";
            $this->rewards->grant($user, $key, 'minigame', 0, $coins, ['game' => MinigameService::GAMES[$record->game] ?? $record->game]);
        }

        $this->pets->care($user, happiness: 15, energy: -10);
        $this->badges->check($user);
    }
}
