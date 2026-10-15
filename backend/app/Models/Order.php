<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

// Đơn mua khóa học qua MoMo
class Order extends Model
{
    public const STATUS_PENDING = 'pending';

    public const STATUS_PAID = 'paid';

    public const STATUS_FAILED = 'failed';

    // Link thanh toán MoMo sống khoảng 100 phút (MoMo không cho đặt hạn khác), đơn hết hạn cùng lúc
    public const EXPIRE_MINUTES = 100;

    // Mức tiền MoMo nhận cho một giao dịch
    public const MIN_AMOUNT = 1000;

    protected $fillable = ['user_id', 'course_id', 'user_voucher_id', 'original_price', 'discount', 'amount', 'status', 'momo_order_id', 'momo_trans_id', 'pay_url', 'failure_reason', 'paid_at', 'expires_at'];

    protected function casts(): array
    {
        return ['paid_at' => 'datetime', 'expires_at' => 'datetime'];
    }

    // Đang chờ thanh toán và chưa hết hạn
    public function scopeAwaitingPayment(Builder $query): void
    {
        $query->where('status', self::STATUS_PENDING)->where('expires_at', '>', now());
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function userVoucher(): BelongsTo
    {
        return $this->belongsTo(UserVoucher::class);
    }
}
