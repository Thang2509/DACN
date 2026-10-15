<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

// Huy hiệu: đạt khi chỉ số condition_type của học viên ≥ condition_value
class Badge extends Model
{
    protected $fillable = ['code', 'name', 'description', 'icon', 'condition_type', 'condition_value', 'reward_coins', 'is_active'];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }
}
