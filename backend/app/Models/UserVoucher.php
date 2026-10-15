<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

// Voucher học viên đã đổi; dùng tối đa 1 lần cho 1 đơn mua khóa học
class UserVoucher extends Model
{
    protected $fillable = ['user_id', 'voucher_id', 'code', 'expires_on', 'used_at'];

    protected function casts(): array
    {
        return ['expires_on' => 'date', 'used_at' => 'datetime'];
    }

    public function voucher(): BelongsTo
    {
        return $this->belongsTo(Voucher::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    // Chưa dùng, còn hạn và không bị giữ cho một đơn đang chờ thanh toán
    public function scopeUsable(Builder $query): void
    {
        $query->whereNull('used_at')->whereDate('expires_on', '>=', today())
            ->whereDoesntHave('orders', fn (Builder $orders) => $orders->awaitingPayment());
    }
}
