<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

// Loại voucher đổi bằng xu: giảm % giá khóa học, có mức giảm tối đa
class Voucher extends Model
{
    protected $fillable = ['name', 'discount_percent', 'max_discount', 'coin_cost', 'valid_days', 'is_active'];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    // Số tiền giảm cho một mức giá (đồng); sau khi giảm vẫn phải còn ít nhất mức tối thiểu MoMo nhận
    public function discountFor(int $price): int
    {
        return max(0, min(intdiv($price * $this->discount_percent, 100), $this->max_discount, $price - Order::MIN_AMOUNT));
    }
}
