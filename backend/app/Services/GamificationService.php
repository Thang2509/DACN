<?php

namespace App\Services;

use App\Models\LessonProgress;
use App\Models\PointLedger;
use App\Models\Quest;
use App\Models\Streak;
use App\Models\StudyPlan;
use App\Models\User;
use App\Models\UserQuest;
use App\Models\Wallet;

// Chuỗi ngày học và nhiệm vụ ngày/tuần (theo giờ Việt Nam, xem config app.timezone)
class GamificationService
{
    // Mốc chuỗi ngày → số xu thưởng (quy tắc R07)
    private const STREAK_MILESTONES = [7 => 30, 30 => 150, 100 => 500];

    // Loại việc mà nhiệm vụ đếm (quản trị viên chọn khi tạo nhiệm vụ)
    public const QUEST_TARGETS = [
        'lessons_completed' => 'Hoàn thành bài học',
        'quiz_correct' => 'Trả lời đúng câu quiz',
        'flashcards_reviewed' => 'Ôn thẻ flashcard',
        'study_days' => 'Số ngày có học',
    ];

    public function __construct(private RewardService $rewards, private PetService $pets) {}

    // Ghi nhận hôm nay có học: tăng chuỗi nếu hôm qua cũng học, thưởng chuỗi ngày (R06) và mốc chuỗi (R07)
    public function recordStudyDay(User $user): void
    {
        $today = today();
        $streak = Streak::firstOrCreate(['user_id' => $user->id]);
        if ($streak->last_active_on?->isSameDay($today)) {
            return;
        }

        $continues = $streak->last_active_on?->isSameDay($today->copy()->subDay()) ?? false;
        $streak->current_days = $continues ? $streak->current_days + 1 : 1;
        if (! $continues) {
            $streak->started_on = $today;
        }
        $streak->longest_days = max($streak->longest_days, $streak->current_days);
        $streak->last_active_on = $today;
        $streak->save();
        $this->pets->grow($user, 0); // chuỗi vừa tăng có thể đủ điều kiện tiến hóa

        $this->rewards->grant($user, "streak_day:{$user->id}:{$today->toDateString()}", 'streak_day', 0, 5);
        $milestoneCoins = self::STREAK_MILESTONES[$streak->current_days] ?? null;
        if ($milestoneCoins) {
            $key = "streak_milestone:{$user->id}:{$streak->started_on->toDateString()}:{$streak->current_days}";
            $this->rewards->grant($user, $key, 'streak_milestone', 0, $milestoneCoins, ['days' => $streak->current_days]);
        }
        $this->progressQuests($user, 'study_days');
    }

    // Chuỗi đang giữ: bỏ lỡ từ hôm kia trở về trước thì chuỗi đã đứt (bằng 0)
    public static function currentStreak(?Streak $streak): int
    {
        if (! $streak?->last_active_on || $streak->last_active_on->lt(today()->subDay())) {
            return 0;
        }

        return $streak->current_days;
    }

    // Cộng tiến độ cho các nhiệm vụ cùng loại; đủ mục tiêu thì tự nhận thưởng (R08, R09)
    public function progressQuests(User $user, string $type, int $amount = 1): void
    {
        foreach (Quest::where('is_active', true)->where('target_type', $type)->get() as $quest) {
            $periodStart = $this->periodStart($quest)->toDateString();
            $userQuest = UserQuest::firstOrCreate(['user_id' => $user->id, 'quest_id' => $quest->id, 'period_start' => $periodStart]);
            if ($userQuest->completed_at) {
                continue;
            }

            $userQuest->progress = min($quest->target_value, $userQuest->progress + $amount);
            if ($userQuest->progress >= $quest->target_value) {
                $userQuest->completed_at = now();
            }
            $userQuest->save();

            if ($userQuest->completed_at) {
                $key = "quest:{$user->id}:{$quest->id}:{$periodStart}";
                $this->rewards->grant($user, $key, 'quest', $quest->reward_xp, $quest->reward_coins, ['quest' => $quest->title]);
            }
        }
    }

    // Dữ liệu trang Thành tích và thanh trạng thái: ví, cấp, chuỗi ngày, nhiệm vụ kỳ này, phần thưởng gần đây
    public function summary(User $user): array
    {
        $wallet = Wallet::firstOrCreate(['user_id' => $user->id]);
        $streak = Streak::find($user->id);
        $userQuests = UserQuest::where('user_id', $user->id)->get()->keyBy(fn ($uq) => $uq->quest_id.'|'.$uq->period_start->toDateString());

        return [
            'xp' => $wallet->xp,
            'level' => $wallet->level,
            'coins' => $wallet->coins,
            'level_start_xp' => RewardService::xpForLevel($wallet->level),
            'next_level_xp' => RewardService::xpForLevel($wallet->level + 1),
            'streak' => [
                'current' => self::currentStreak($streak),
                'longest' => $streak?->longest_days ?? 0,
                'studied_today' => (bool) $streak?->last_active_on?->isToday(),
            ],
            'quests' => Quest::where('is_active', true)->orderBy('period')->orderBy('id')->get()->map(function (Quest $quest) use ($userQuests) {
                $userQuest = $userQuests[$quest->id.'|'.$this->periodStart($quest)->toDateString()] ?? null;

                return [
                    ...$quest->only('id', 'title', 'period', 'target_value', 'reward_xp', 'reward_coins'),
                    'progress' => $userQuest?->progress ?? 0,
                    'completed' => $userQuest?->completed_at !== null,
                ];
            })->all(),
            'recent' => PointLedger::where('user_id', $user->id)->latest('id')->limit(10)->get(['id', 'reason', 'xp', 'coins', 'meta', 'created_at']),
            'plan' => $this->plan($user),
        ];
    }

    // Kế hoạch học tập và việc hôm nay: số bài hoàn thành hôm nay so với mục tiêu
    public function plan(User $user): array
    {
        $plan = StudyPlan::find($user->id);

        return [
            'has_plan' => (bool) $plan,
            'study_days' => $plan?->study_days ?? [],
            'lessons_per_day' => $plan?->lessons_per_day ?? 1,
            'is_study_day' => $plan && in_array(today()->dayOfWeekIso, $plan->study_days, true),
            'done_today' => LessonProgress::where('user_id', $user->id)->where('completed_at', '>=', today())->count(),
        ];
    }

    // days: các thứ trong tuần theo ISO (1 = thứ Hai … 7 = Chủ nhật)
    public function savePlan(User $user, array $days, int $lessonsPerDay): array
    {
        $days = array_values(array_unique(array_map('intval', $days)));
        sort($days);
        StudyPlan::updateOrCreate(['user_id' => $user->id], ['study_days' => $days, 'lessons_per_day' => $lessonsPerDay]);

        return $this->plan($user);
    }

    // Nhiệm vụ ngày tính theo ngày, nhiệm vụ tuần tính từ thứ Hai
    private function periodStart(Quest $quest)
    {
        return $quest->period === 'daily' ? today() : today()->startOfWeek();
    }
}
