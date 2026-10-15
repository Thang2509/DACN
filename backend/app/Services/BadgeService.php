<?php

namespace App\Services;

use App\Models\Badge;
use App\Models\Enrollment;
use App\Models\FlashcardReview;
use App\Models\LessonProgress;
use App\Models\MinigameScore;
use App\Models\PointLedger;
use App\Models\Streak;
use App\Models\User;
use App\Models\UserBadge;
use App\Models\UserPet;
use App\Models\Wallet;

// Huy hiệu: so chỉ số của học viên với điều kiện, đạt thì trao và thưởng xu (quy tắc R11)
class BadgeService
{
    // Loại điều kiện quản trị viên chọn được khi tạo huy hiệu
    public const CONDITIONS = [
        'lessons_completed' => 'Số bài đã hoàn thành',
        'courses_completed' => 'Số khóa đã hoàn thành',
        'longest_streak' => 'Chuỗi ngày học dài nhất',
        'level' => 'Cấp độ',
        'quiz_perfect' => 'Số quiz đúng hết ngay lần đầu',
        'flashcards_reviewed' => 'Số lượt ôn flashcard',
        'pets_owned' => 'Số thú trong bộ sưu tập',
        'minigame_score' => 'Điểm minigame cao nhất',
    ];

    public function __construct(private RewardService $rewards) {}

    public function metric(User $user, string $type): int
    {
        return (int) match ($type) {
            'lessons_completed' => LessonProgress::where('user_id', $user->id)->count(),
            'courses_completed' => Enrollment::where('user_id', $user->id)->whereNotNull('completed_at')->count(),
            'longest_streak' => Streak::find($user->id)?->longest_days ?? 0,
            'level' => Wallet::find($user->id)?->level ?? 1,
            'quiz_perfect' => PointLedger::where('user_id', $user->id)->where('reason', 'quiz_perfect')->count(),
            'flashcards_reviewed' => FlashcardReview::where('user_id', $user->id)->sum('review_count'),
            'pets_owned' => UserPet::where('user_id', $user->id)->count(),
            'minigame_score' => MinigameScore::where('user_id', $user->id)->max('score') ?? 0,
            default => 0,
        };
    }

    // Mọi huy hiệu đang phát hành kèm tiến độ của học viên (trang Thành tích)
    public function progress(User $user): array
    {
        $earned = UserBadge::where('user_id', $user->id)->pluck('earned_at', 'badge_id');
        $values = [];

        return Badge::where('is_active', true)->orderBy('condition_type')->orderBy('condition_value')->get()
            ->map(function (Badge $badge) use ($user, $earned, &$values) {
                $values[$badge->condition_type] ??= $this->metric($user, $badge->condition_type);

                return [
                    ...$badge->only('id', 'code', 'name', 'description', 'icon', 'condition_type', 'condition_value', 'reward_coins'),
                    'progress' => min($values[$badge->condition_type], $badge->condition_value),
                    'earned_at' => $earned[$badge->id] ?? null,
                ];
            })->all();
    }

    // Trao các huy hiệu vừa đạt; gọi sau mỗi lần phát thưởng (bài học, quiz, ôn thẻ, minigame, mua trứng)
    public function check(User $user): array
    {
        $earnedIds = UserBadge::where('user_id', $user->id)->pluck('badge_id');
        $values = [];
        $awarded = [];

        foreach (Badge::where('is_active', true)->whereNotIn('id', $earnedIds)->get() as $badge) {
            $values[$badge->condition_type] ??= $this->metric($user, $badge->condition_type);
            if ($values[$badge->condition_type] < $badge->condition_value) {
                continue;
            }

            UserBadge::firstOrCreate(['user_id' => $user->id, 'badge_id' => $badge->id], ['earned_at' => now()]);
            $this->rewards->grant($user, "badge:{$user->id}:{$badge->id}", 'badge', 0, $badge->reward_coins, ['badge' => $badge->name]);
            $awarded[] = $badge->code;
        }

        return $awarded;
    }
}
