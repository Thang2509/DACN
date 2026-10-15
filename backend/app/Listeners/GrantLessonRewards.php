<?php

namespace App\Listeners;

use App\Events\LessonCompleted;
use App\Models\Lesson;
use App\Models\User;
use App\Services\BadgeService;
use App\Services\GamificationService;
use App\Services\PetService;
use App\Services\RewardService;
use Illuminate\Contracts\Queue\ShouldQueue;

// Chạy qua hàng đợi: thưởng hoàn thành bài (R01), khóa học (R04), chuỗi ngày, nhiệm vụ, chăm thú cưng
class GrantLessonRewards implements ShouldQueue
{
    public function __construct(
        private RewardService $rewards,
        private GamificationService $gamification,
        private PetService $pets,
        private BadgeService $badges,
    ) {}

    public function handle(LessonCompleted $event): void
    {
        $user = User::findOrFail($event->userId);
        $lesson = Lesson::with('chapter.course')->findOrFail($event->lessonId);
        $course = $lesson->chapter->course;
        if ($course->instructor_id === $user->id) {
            return; // không tự thưởng khi học khóa của chính mình
        }

        $key = "lesson_completed:{$user->id}:{$lesson->id}";
        if (! $this->rewards->grant($user, $key, 'lesson_completed', 20, 5, ['lesson' => $lesson->title])) {
            return; // đã thưởng bài này rồi
        }

        $this->pets->care($user, fullness: 15, happiness: 10);
        $this->gamification->progressQuests($user, 'lessons_completed');
        $this->gamification->recordStudyDay($user);

        if ($event->courseCompleted) {
            $key = "course_completed:{$user->id}:{$course->id}";
            $this->rewards->grant($user, $key, 'course_completed', 200, 50, ['course' => $course->title]);
        }
        $this->badges->check($user);
    }
}
