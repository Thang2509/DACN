<?php

namespace App\Listeners;

use App\Events\QuizQuestionAnswered;
use App\Models\LessonBlock;
use App\Models\User;
use App\Services\BadgeService;
use App\Services\GamificationService;
use App\Services\PetService;
use App\Services\RewardService;
use Illuminate\Contracts\Queue\ShouldQueue;

// Chạy qua hàng đợi: thưởng câu đúng lần đầu (R02) và đúng hết ngay lượt đầu (R03)
class GrantQuizRewards implements ShouldQueue
{
    public function __construct(
        private RewardService $rewards,
        private GamificationService $gamification,
        private PetService $pets,
        private BadgeService $badges,
    ) {}

    public function handle(QuizQuestionAnswered $event): void
    {
        $user = User::findOrFail($event->userId);
        $block = LessonBlock::with('lesson.chapter.course')->findOrFail($event->blockId);
        if ($block->lesson->chapter->course->instructor_id === $user->id) {
            return; // không tự thưởng khi học khóa của chính mình
        }

        $key = "quiz_correct:{$user->id}:{$block->id}:{$event->question}";
        if ($event->correct && $this->rewards->grant($user, $key, 'quiz_correct', 5, 0)) {
            $this->pets->care($user, happiness: 2);
            $this->gamification->progressQuests($user, 'quiz_correct');
        }

        if ($event->perfectFirstAttempt) {
            $this->rewards->grant($user, "quiz_perfect:{$user->id}:{$block->id}", 'quiz_perfect', 10, 2);
        }
        $this->badges->check($user);
    }
}
