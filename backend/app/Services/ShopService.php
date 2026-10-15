<?php

namespace App\Services;

use App\Models\Order;
use App\Models\PetItem;
use App\Models\PetSpecies;
use App\Models\User;
use App\Models\UserItem;
use App\Models\UserPet;
use App\Models\UserVoucher;
use App\Models\Voucher;
use App\Models\Wallet;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

// Cửa hàng đổi xu: thức ăn, trang bị, nội thất, trứng loài mới, voucher giảm giá khóa học
class ShopService
{
    public function __construct(private RewardService $rewards, private BadgeService $badges) {}

    public function catalog(User $user): array
    {
        $owned = UserItem::where('user_id', $user->id)->pluck('quantity', 'pet_item_id');
        $ownedSpecies = UserPet::where('user_id', $user->id)->pluck('pet_species_id');

        return [
            'coins' => Wallet::find($user->id)?->coins ?? 0,
            'items' => PetItem::orderBy('price')->get()->map(fn (PetItem $item) => [
                ...$item->only('id', 'code', 'name', 'type', 'bone_slot', 'price', 'effect', 'size_x', 'size_z'),
                'owned' => $owned[$item->id] ?? 0,
            ]),
            'eggs' => PetSpecies::orderBy('id')->get()->map(fn (PetSpecies $species) => [
                ...$species->only('id', 'code', 'name', 'description', 'egg_color', 'egg_price'),
                'owned' => $ownedSpecies->contains($species->id),
            ]),
            'vouchers' => Voucher::where('is_active', true)->orderBy('coin_cost')
                ->get(['id', 'name', 'discount_percent', 'max_discount', 'coin_cost', 'valid_days']),
            'my_vouchers' => $this->myVouchers($user),
        ];
    }

    // Voucher đã đổi, mới nhất trước; kèm cờ còn dùng được và cờ đang giữ cho đơn chờ thanh toán
    public function myVouchers(User $user): array
    {
        $usable = UserVoucher::where('user_id', $user->id)->usable()->pluck('id');
        $reserved = Order::awaitingPayment()->where('user_id', $user->id)->whereNotNull('user_voucher_id')->pluck('user_voucher_id');

        return UserVoucher::with('voucher:id,name,discount_percent,max_discount')
            ->where('user_id', $user->id)->latest('id')->get()
            ->map(fn (UserVoucher $uv) => [
                ...$uv->only('id', 'code', 'used_at'),
                'expires_on' => $uv->expires_on->toDateString(),
                'voucher' => $uv->voucher,
                'usable' => $usable->contains($uv->id),
                'reserved' => $reserved->contains($uv->id),
            ])->all();
    }

    // Thức ăn và nội thất mua được nhiều cái; trang bị chỉ cần 1
    public function buyItem(User $user, PetItem $item, int $quantity): UserItem
    {
        $userItem = UserItem::firstOrNew(['user_id' => $user->id, 'pet_item_id' => $item->id]);
        if ($item->type === 'accessory' && $userItem->quantity + $quantity > 1) {
            throw ValidationException::withMessages(['item' => 'Bạn đã có món trang bị này.']);
        }

        return DB::transaction(function () use ($user, $item, $quantity, $userItem) {
            $key = "item:{$user->id}:".Str::uuid();
            $this->rewards->spend($user, $key, 'buy_item', $item->price * $quantity, ['item' => $item->name, 'quantity' => $quantity]);
            $userItem->quantity += $quantity;
            $userItem->save();

            return $userItem;
        });
    }

    // Trứng loài mới cho bộ sưu tập; trứng đầu tiên nhận miễn phí ở trang Thú cưng
    public function buyEgg(User $user, PetSpecies $species): UserPet
    {
        $pets = UserPet::where('user_id', $user->id);
        if (! $pets->exists()) {
            throw ValidationException::withMessages(['species' => 'Hãy nhận quả trứng đầu tiên miễn phí ở trang Thú cưng.']);
        }
        if ($pets->clone()->where('pet_species_id', $species->id)->exists()) {
            throw ValidationException::withMessages(['species' => "Bạn đã có {$species->name} rồi."]);
        }

        $pet = DB::transaction(function () use ($user, $species) {
            $key = "egg:{$user->id}:{$species->id}";
            $this->rewards->spend($user, $key, 'buy_egg', $species->egg_price, ['species' => $species->name]);

            return UserPet::create([
                'user_id' => $user->id,
                'pet_species_id' => $species->id,
                'nickname' => $species->name,
                'is_active' => false, // vào bộ sưu tập, học viên tự chọn thú đồng hành
                'stats_updated_at' => now(),
            ])->refresh();
        });
        $this->badges->check($user); // huy hiệu sưu tầm thú

        return $pet;
    }

    public function redeemVoucher(User $user, Voucher $voucher): UserVoucher
    {
        if (! $voucher->is_active) {
            throw ValidationException::withMessages(['voucher' => 'Voucher này đã ngừng phát hành.']);
        }

        return DB::transaction(function () use ($user, $voucher) {
            $userVoucher = UserVoucher::create([
                'user_id' => $user->id,
                'voucher_id' => $voucher->id,
                'code' => 'EQ'.Str::upper(Str::random(8)),
                'expires_on' => today()->addDays($voucher->valid_days),
            ]);
            $this->rewards->spend($user, "voucher:{$userVoucher->id}", 'voucher', $voucher->coin_cost, ['voucher' => $voucher->name]);

            return $userVoucher;
        });
    }
}
