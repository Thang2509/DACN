<?php

namespace App\Listeners;

use App\Events\FlashcardReviewed;
use App\Models\LessonBlock;
use App\Models\PointLedger;
use App\Models\User;
use App\Services\BadgeService;
use App\Services\GamificationService;
use App\Services\RewardService;
use Illuminate\Contracts\Queue\ShouldQueue;

// Chạy qua hàng đợi: ôn thẻ đến hạn được 1 XP (tối đa 30 XP/ngày, quy tắc R05), tính vào nhiệm vụ ôn thẻ
class GrantFlashcardRewards implements ShouldQueue
{
    private const DAILY_XP_LIMIT = 30;

    public function __construct(
        private RewardService $rewards,
        private GamificationService $gamification,
        private BadgeService $badges,
    ) {}

    public function handle(FlashcardReviewed $event): void
    {
        $user = User::findOrFail($event->userId);
        $block = LessonBlock::with('lesson.chapter.course')->findOrFail($event->blockId);
        if ($block->lesson->chapter->course->instructor_id === $user->id) {
            return; // không tự thưởng khi học khóa của chính mình
        }

        $rewardedToday = PointLedger::where('user_id', $user->id)->where('reason', 'flashcard')->where('created_at', '>=', today())->count();
        if ($rewardedToday < self::DAILY_XP_LIMIT) {
            $key = "flashcard:{$user->id}:{$block->id}:{$event->cardIndex}:".today()->toDateString();
            $this->rewards->grant($user, $key, 'flashcard', 1, 0);
        }

        $this->gamification->progressQuests($user, 'flashcards_reviewed');
        $this->badges->check($user);
    }
}
