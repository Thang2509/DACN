<?php

namespace App\Http\Controllers;

use App\Models\PetItem;
use App\Models\PetSpecies;
use App\Models\Voucher;
use App\Services\ShopService;
use Illuminate\Http\Request;

// Cửa hàng đổi xu: các thao tác mua đều trả lại toàn bộ cửa hàng để giao diện cập nhật số xu và túi đồ
class ShopController extends Controller
{
    public function __construct(private ShopService $shop) {}

    public function index(Request $request)
    {
        return $this->shop->catalog($request->user());
    }

    public function buyItem(Request $request, PetItem $item)
    {
        $data = $request->validate(['quantity' => ['sometimes', 'integer', 'min:1', 'max:20']]);
        $this->shop->buyItem($request->user(), $item, $data['quantity'] ?? 1);

        return $this->shop->catalog($request->user());
    }

    public function buyEgg(Request $request, PetSpecies $species)
    {
        $this->shop->buyEgg($request->user(), $species);

        return $this->shop->catalog($request->user());
    }

    public function redeemVoucher(Request $request, Voucher $voucher)
    {
        $this->shop->redeemVoucher($request->user(), $voucher);

        return $this->shop->catalog($request->user());
    }

    // Voucher của tôi (dùng khi chọn voucher lúc mua khóa học)
    public function myVouchers(Request $request)
    {
        return $this->shop->myVouchers($request->user());
    }
}
