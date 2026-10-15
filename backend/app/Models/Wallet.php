<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

// Số dư của người dùng; chỉ RewardService được cập nhật (cùng transaction với point_ledger)
class Wallet extends Model
{
    protected $primaryKey = 'user_id';

    public $incrementing = false;

    protected $fillable = ['user_id'];

    protected $attributes = ['xp' => 0, 'level' => 1, 'coins' => 0];

    protected function casts(): array
    {
        return ['xp' => 'integer', 'level' => 'integer', 'coins' => 'integer'];
    }
}
