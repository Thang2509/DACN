<?php

namespace App\Services;

use App\Models\PetEquipment;
use App\Models\PetItem;
use App\Models\PetSpecies;
use App\Models\Streak;
use App\Models\User;
use App\Models\UserItem;
use App\Models\UserPet;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

// Thú cưng: nhận trứng (nở ngay), chỉ số giảm dần theo giờ, lớn lên theo XP học, tiến hóa; cho ăn, trang bị
class PetService
{
    // XP thú cần để lên từng giai đoạn (mới nở từ 0); tiến hóa cần thêm chuỗi ngày ≥ 7
    public const STAGE_XP = ['baby' => 300, 'adult' => 1000, 'evolved' => 3000];

    public const EVOLVE_STREAK = 7;

    private const DECAY_PER_HOUR = ['fullness' => 3, 'happiness' => 2, 'energy' => 1];

    private const SLEEP_ENERGY_PER_HOUR = 20;

    private const FEED_HAPPINESS = 5;

    // Trứng đầu tiên: mỗi người chọn một lần
    public function adopt(User $user, PetSpecies $species): UserPet
    {
        if (UserPet::where('user_id', $user->id)->exists()) {
            $this->fail('species', 'Bạn đã nhận trứng đầu tiên rồi.');
        }
        if (! $species->is_starter) {
            $this->fail('species', 'Trứng loài này chỉ có ở cửa hàng.');
        }

        return UserPet::create([
            'user_id' => $user->id,
            'pet_species_id' => $species->id,
            'nickname' => $species->name,
            'stats_updated_at' => now(),
        ])->refresh(); // lấy các giá trị mặc định (giai đoạn mới nở, chỉ số 70) từ CSDL
    }

    public function activePet(User $user): ?UserPet
    {
        $pet = UserPet::where('user_id', $user->id)->where('is_active', true)->first();

        return $pet ? $this->refresh($pet) : null;
    }

    /**
     * Áp dụng phần chỉ số thay đổi theo số giờ trọn vẹn đã trôi qua (tính khi đọc, không cần cron).
     * Chỉ dời mốc stats_updated_at đúng số giờ đã tính để không làm mất phần lẻ.
     */
    public function refresh(UserPet $pet): UserPet
    {
        $hours = (int) floor($pet->stats_updated_at->diffInMinutes(now()) / 60);
        if ($hours < 1) {
            return $pet;
        }

        $pet->fullness = $this->clamp($pet->fullness - self::DECAY_PER_HOUR['fullness'] * $hours);
        $pet->happiness = $this->clamp($pet->happiness - self::DECAY_PER_HOUR['happiness'] * $hours);
        $pet->energy = $pet->is_sleeping
            ? $this->clamp($pet->energy + self::SLEEP_ENERGY_PER_HOUR * $hours)
            : $this->clamp($pet->energy - self::DECAY_PER_HOUR['energy'] * $hours);
        $pet->stats_updated_at = $pet->stats_updated_at->copy()->addHours($hours);
        $pet->save();

        return $pet;
    }

    // Học bài làm thú no và vui hơn
    public function care(User $user, int $fullness = 0, int $happiness = 0, int $energy = 0): void
    {
        $pet = $this->activePet($user);
        if (! $pet) {
            return;
        }
        $pet->fullness = $this->clamp($pet->fullness + $fullness);
        $pet->happiness = $this->clamp($pet->happiness + $happiness);
        $pet->energy = $this->clamp($pet->energy + $energy);
        $pet->save();
    }

    // Thú lớn thêm theo XP (xp = 0 để xét lại giai đoạn); giai đoạn chỉ tăng, không lùi
    public function grow(User $user, int $xp): void
    {
        $pet = $this->activePet($user);
        if (! $pet || $xp < 0) {
            return;
        }
        $pet->growth_xp += $xp;
        $streak = GamificationService::currentStreak(Streak::find($user->id));
        $next = self::stageFor($pet->growth_xp, $streak);
        if (array_search($next, UserPet::STAGES) > array_search($pet->stage, UserPet::STAGES)) {
            $pet->stage = $next;
        }
        $pet->save();
    }

    public static function stageFor(int $growthXp, int $streakDays): string
    {
        if ($growthXp >= self::STAGE_XP['evolved'] && $streakDays >= self::EVOLVE_STREAK) {
            return 'evolved';
        }
        foreach (['adult', 'baby'] as $stage) {
            if ($growthXp >= self::STAGE_XP[$stage]) {
                return $stage;
            }
        }

        return 'hatchling';
    }

    public function toggleSleep(UserPet $pet): UserPet
    {
        $pet = $this->refresh($pet);
        $pet->is_sleeping = ! $pet->is_sleeping;
        $pet->save();

        return $pet;
    }

    // Cho ăn: trừ 1 món trong túi đồ, đầy bụng tăng theo món, vui +5
    public function feed(User $user, UserPet $pet, PetItem $item): UserPet
    {
        if ($item->type !== 'food') {
            $this->fail('item', 'Món này không phải thức ăn.');
        }

        return DB::transaction(function () use ($user, $pet, $item) {
            $owned = UserItem::where('user_id', $user->id)->where('pet_item_id', $item->id)->lockForUpdate()->first();
            if (! $owned || $owned->quantity < 1) {
                $this->fail('item', "Bạn đã hết {$item->name}, hãy mua thêm ở cửa hàng.");
            }
            $owned->decrement('quantity');

            $pet = $this->refresh($pet);
            $pet->fullness = $this->clamp($pet->fullness + ($item->effect['fullness'] ?? 0));
            $pet->happiness = $this->clamp($pet->happiness + self::FEED_HAPPINESS);
            $pet->save();

            return $pet;
        });
    }

    // Gắn trang bị vào chỗ của nó (thay món cũ); món đang đeo ở thú khác thì chuyển sang thú này
    public function equip(User $user, UserPet $pet, PetItem $item): UserPet
    {
        if ($item->type !== 'accessory') {
            $this->fail('item', 'Món này không phải trang bị.');
        }
        if (! UserItem::where('user_id', $user->id)->where('pet_item_id', $item->id)->where('quantity', '>', 0)->exists()) {
            $this->fail('item', "Bạn chưa có {$item->name}, hãy mua ở cửa hàng.");
        }

        DB::transaction(function () use ($user, $pet, $item) {
            $petIds = UserPet::where('user_id', $user->id)->pluck('id');
            PetEquipment::where('pet_item_id', $item->id)->whereIn('user_pet_id', $petIds)->delete();
            PetEquipment::updateOrCreate(['user_pet_id' => $pet->id, 'slot' => $item->bone_slot], ['pet_item_id' => $item->id]);
        });

        return $pet->unsetRelation('equipment');
    }

    public function unequip(UserPet $pet, string $slot): UserPet
    {
        PetEquipment::where('user_pet_id', $pet->id)->where('slot', $slot)->delete();

        return $pet->unsetRelation('equipment');
    }

    // Chọn thú đồng hành: chỉ thú này nhận XP và được chăm khi học
    public function activate(User $user, UserPet $pet): UserPet
    {
        DB::transaction(function () use ($user, $pet) {
            UserPet::where('user_id', $user->id)->update(['is_active' => false]);
            $pet->update(['is_active' => true]);
        });

        return $pet;
    }

    // Dữ liệu hiển thị: chỉ số, tâm trạng (chọn hoạt ảnh), tiến độ tới giai đoạn sau, trang bị đang đeo
    public function view(UserPet $pet): array
    {
        $pet->loadMissing('species', 'equipment.item');
        $index = array_search($pet->stage, UserPet::STAGES);
        $nextStage = UserPet::STAGES[$index + 1] ?? null;

        return [
            ...$pet->only('id', 'nickname', 'stage', 'growth_xp', 'fullness', 'happiness', 'energy', 'is_sleeping', 'is_active'),
            'species' => $pet->species->only('code', 'name', 'egg_color'),
            'mood' => $this->mood($pet),
            'stage_start_xp' => self::STAGE_XP[$pet->stage] ?? 0,
            'next_stage' => $nextStage,
            'next_stage_xp' => $nextStage ? self::STAGE_XP[$nextStage] : null,
            'equipment' => $pet->equipment->map(fn (PetEquipment $equipment) => [
                'slot' => $equipment->slot,
                ...$equipment->item->only('id', 'code', 'name'),
            ])->values(),
        ];
    }

    // vui: mọi chỉ số ≥ 60; buồn: có chỉ số < 25; ngủ: đang ngủ hoặc năng lượng < 15
    private function mood(UserPet $pet): string
    {
        if ($pet->is_sleeping || $pet->energy < 15) {
            return 'sleep';
        }
        $stats = [$pet->fullness, $pet->happiness, $pet->energy];
        if (min($stats) < 25) {
            return 'sad';
        }

        return min($stats) >= 60 ? 'happy' : 'normal';
    }

    private function fail(string $field, string $message): never
    {
        throw ValidationException::withMessages([$field => $message]);
    }

    private function clamp(int $value): int
    {
        return max(0, min(100, $value));
    }
}
