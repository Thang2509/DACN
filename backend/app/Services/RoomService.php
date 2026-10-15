<?php

namespace App\Services;

use App\Models\PetItem;
use App\Models\RoomItem;
use App\Models\User;
use App\Models\UserItem;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

// Phòng thú cưng: sàn chia lưới ô vuông, nội thất đặt theo ô và xoay 90°
class RoomService
{
    public const GRID = 8; // sàn 8 × 8 ô

    public function show(User $user): array
    {
        return [
            'grid' => self::GRID,
            'items' => RoomItem::where('user_id', $user->id)->orderBy('id')->get(['pet_item_id', 'x', 'z', 'rotation']),
            'furniture' => UserItem::with('item')->where('user_id', $user->id)->where('quantity', '>', 0)->get()
                ->filter(fn (UserItem $owned) => $owned->item->type === 'furniture')
                ->map(fn (UserItem $owned) => [
                    ...$owned->item->only('id', 'code', 'name', 'effect', 'size_x', 'size_z'),
                    'quantity' => $owned->quantity,
                ])->values(),
        ];
    }

    /**
     * Lưu cả bố cục một lần. Mỗi món phải nằm trong sàn, không vượt số lượng đang có, không chồng lên món khác.
     * Thảm (effect.floor) nằm sát sàn: chỉ không được chồng lên thảm khác, đồ khác đặt lên trên được.
     */
    public function save(User $user, array $placements): array
    {
        $items = PetItem::where('type', 'furniture')->whereIn('id', array_column($placements, 'pet_item_id'))->get()->keyBy('id');
        $owned = UserItem::where('user_id', $user->id)->pluck('quantity', 'pet_item_id');
        $used = [];
        $occupied = ['floor' => [], 'object' => []];

        foreach ($placements as $i => $placement) {
            $item = $items[$placement['pet_item_id']] ?? $this->fail($i, 'Món này không phải nội thất.');
            $used[$item->id] = ($used[$item->id] ?? 0) + 1;
            if ($used[$item->id] > ($owned[$item->id] ?? 0)) {
                $this->fail($i, "Bạn chỉ có {$owned->get($item->id, 0)} {$item->name}.");
            }

            [$width, $depth] = $placement['rotation'] % 2 ? [$item->size_z, $item->size_x] : [$item->size_x, $item->size_z];
            if ($placement['x'] + $width > self::GRID || $placement['z'] + $depth > self::GRID) {
                $this->fail($i, "{$item->name} nằm ra ngoài sàn phòng.");
            }

            $layer = ($item->effect['floor'] ?? false) ? 'floor' : 'object';
            for ($x = $placement['x']; $x < $placement['x'] + $width; $x++) {
                for ($z = $placement['z']; $z < $placement['z'] + $depth; $z++) {
                    if (isset($occupied[$layer]["$x,$z"])) {
                        $this->fail($i, "{$item->name} đang chồng lên món khác.");
                    }
                    $occupied[$layer]["$x,$z"] = true;
                }
            }
        }

        DB::transaction(function () use ($user, $placements) {
            RoomItem::where('user_id', $user->id)->delete();
            foreach ($placements as $placement) {
                RoomItem::create(['user_id' => $user->id, ...$placement]);
            }
        });

        return $this->show($user);
    }

    private function fail(int $index, string $message): never
    {
        throw ValidationException::withMessages(["items.$index" => $message]);
    }
}
