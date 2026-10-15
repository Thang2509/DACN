<?php

namespace App\Http\Controllers;

use App\Services\BadgeService;
use App\Services\GamificationService;
use App\Services\LeaderboardService;
use Illuminate\Http\Request;

// XP, cấp độ, xu, chuỗi ngày, nhiệm vụ, kế hoạch học tập, huy hiệu và bảng xếp hạng của người dùng
class GamificationController extends Controller
{
    public function __construct(
        private GamificationService $gamification,
        private BadgeService $badges,
        private LeaderboardService $leaderboard,
    ) {}

    public function show(Request $request)
    {
        return $this->gamification->summary($request->user());
    }

    public function badges(Request $request)
    {
        return $this->badges->progress($request->user());
    }

    // period: week (tuần này), last_week (tuần trước), all (mọi thời gian)
    public function leaderboard(Request $request)
    {
        $period = $request->validate(['period' => ['sometimes', 'in:week,last_week,all']])['period'] ?? 'week';

        return match ($period) {
            'all' => $this->leaderboard->allTime($request->user()),
            'last_week' => $this->leaderboard->weekly($request->user(), 1),
            default => $this->leaderboard->weekly($request->user()),
        };
    }

    public function savePlan(Request $request)
    {
        $data = $request->validate([
            'study_days' => ['present', 'array', 'max:7'],
            'study_days.*' => ['integer', 'between:1,7'],
            'lessons_per_day' => ['required', 'integer', 'between:1,10'],
        ]);

        return $this->gamification->savePlan($request->user(), $data['study_days'], $data['lessons_per_day']);
    }
}
