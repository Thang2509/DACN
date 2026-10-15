<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Quest extends Model
{
    protected $fillable = ['code', 'title', 'period', 'target_type', 'target_value', 'reward_xp', 'reward_coins', 'is_active'];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }
}
