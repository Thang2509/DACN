<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserBadge extends Model
{
    public $timestamps = false;

    protected $fillable = ['user_id', 'badge_id', 'earned_at'];

    protected function casts(): array
    {
        return ['earned_at' => 'datetime'];
    }
}
