<?php

namespace App\Services;

use App\Models\PointLedger;
use App\Models\User;
use App\Models\Wallet;
use Illuminate\Support\Collection;

/**
 * Bảng xếp hạng theo XP: tuần (cộng XP trong sổ cái từ thứ Hai) và mọi thời gian (XP trong ví).
 * Tính trực tiếp khi xem nên tuần trước luôn xem lại được, không cần lịch chạy chốt bảng.
 */
class LeaderboardService
{
    public const SIZE = 20;

    // weeksAgo: 0 = tuần này, 1 = tuần trước
    public function weekly(User $user, int $weeksAgo = 0): array
    {
        $start = today()->startOfWeek()->subWeeks($weeksAgo);
        $end = $start->copy()->addWeek();
        $totals = PointLedger::where('created_at', '>=', $start)->where('created_at', '<', $end)->where('xp', '>', 0)
            ->groupBy('user_id')->selectRaw('user_id, SUM(xp) as xp')
            ->orderByDesc('xp')->orderBy('user_id')->get();

        return [
            ...$this->rank($totals, $user),
            'from' => $start->toDateString(),
            'to' => $end->subDay()->toDateString(),
        ];
    }

    public function allTime(User $user): array
    {
        return $this->rank(Wallet::where('xp', '>', 0)->orderByDesc('xp')->orderBy('user_id')->get(['user_id', 'xp']), $user);
    }

    // Đánh số hạng (bằng XP thì đồng hạng), lấy top và hạng của chính người xem
    private function rank(Collection $totals, User $user): array
    {
        $rows = [];
        $previous = null;
        foreach ($totals->values() as $i => $total) {
            $xp = (int) $total->xp;
            $rank = $xp === $previous ? end($rows)['rank'] : $i + 1;
            $previous = $xp;
            $rows[] = ['rank' => $rank, 'user_id' => $total->user_id, 'xp' => $xp];
        }

        $top = array_slice($rows, 0, self::SIZE);
        $ids = array_column($top, 'user_id');
        $users = User::whereIn('id', $ids)->get()->keyBy('id');
        $levels = Wallet::whereIn('user_id', $ids)->pluck('level', 'user_id');

        return [
            'top' => array_map(fn ($row) => [
                ...$row,
                'name' => $users[$row['user_id']]->name,
                'avatar_url' => $users[$row['user_id']]->avatar_url,
                'level' => $levels[$row['user_id']] ?? 1,
            ], $top),
            'me' => collect($rows)->firstWhere('user_id', $user->id),
        ];
    }
}
