<?php

namespace App\Services;

use App\Models\PointLedger;
use App\Models\User;
use App\Models\Wallet;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

// Sổ cái điểm: phát thưởng XP/xu và tiêu xu; mỗi lần ghi một dòng (chỉ thêm) và cập nhật ví trong cùng transaction
class RewardService
{
    public function __construct(private PetService $pets) {}

    // Tổng XP cần để đạt cấp n: 50·n·(n−1) (cấp 2: 100, cấp 3: 300, cấp 4: 600…)
    public static function xpForLevel(int $level): int
    {
        return 50 * $level * ($level - 1);
    }

    public static function levelForXp(int $xp): int
    {
        return (int) floor((1 + sqrt(1 + 8 * $xp / 100)) / 2);
    }

    /**
     * Ghi một lần thưởng. Khóa đã có trong sổ cái nghĩa là đã thưởng trước đó: không cộng lần 2, trả về false.
     * Kèm theo: thú cưng lớn thêm 50% số XP, lên cấp thì thưởng 10 × cấp mới xu (quy tắc R10).
     */
    public function grant(User $user, string $key, string $reason, int $xp = 0, int $coins = 0, array $meta = []): bool
    {
        Wallet::firstOrCreate(['user_id' => $user->id]);

        $levels = DB::transaction(function () use ($user, $key, $reason, $xp, $coins, $meta) {
            // Khóa dòng ví: các lần thưởng của cùng người dùng chạy lần lượt, không cộng trùng
            $wallet = Wallet::whereKey($user->id)->lockForUpdate()->first();
            if (PointLedger::where('idempotency_key', $key)->exists()) {
                return null;
            }

            PointLedger::create([
                'user_id' => $user->id,
                'reason' => $reason,
                'idempotency_key' => $key,
                'xp' => $xp,
                'coins' => $coins,
                'meta' => $meta ?: null,
            ]);

            $oldLevel = $wallet->level;
            $wallet->xp += $xp;
            $wallet->coins += $coins;
            $wallet->level = self::levelForXp($wallet->xp);
            $wallet->save();

            return [$oldLevel, $wallet->level];
        });

        if ($levels === null) {
            return false;
        }

        if ($xp > 0) {
            $this->pets->grow($user, intdiv($xp, 2));
        }
        [$oldLevel, $newLevel] = $levels;
        for ($level = $oldLevel + 1; $level <= $newLevel; $level++) {
            $this->grant($user, "level_up:{$user->id}:{$level}", 'level_up', 0, 10 * $level, ['level' => $level]);
        }

        return true;
    }

    /**
     * Tiêu xu: khóa dòng ví, thiếu xu thì từ chối và không ghi sổ cái.
     * Gọi bên trong transaction của việc mua để món hàng và số xu bị trừ luôn đi cùng nhau.
     */
    public function spend(User $user, string $key, string $reason, int $coins, array $meta = []): void
    {
        Wallet::firstOrCreate(['user_id' => $user->id]);

        DB::transaction(function () use ($user, $key, $reason, $coins, $meta) {
            $wallet = Wallet::whereKey($user->id)->lockForUpdate()->first();
            if ($wallet->coins < $coins) {
                throw ValidationException::withMessages(['coins' => "Bạn cần {$coins} xu nhưng chỉ có {$wallet->coins} xu."]);
            }

            PointLedger::create([
                'user_id' => $user->id,
                'reason' => $reason,
                'idempotency_key' => $key,
                'coins' => -$coins,
                'meta' => $meta ?: null,
            ]);
            $wallet->coins -= $coins;
            $wallet->save();
        });
    }
}
