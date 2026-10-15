<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Streak extends Model
{
    protected $primaryKey = 'user_id';

    public $incrementing = false;

    protected $fillable = ['user_id'];

    protected $attributes = ['current_days' => 0, 'longest_days' => 0];

    protected function casts(): array
    {
        return ['last_active_on' => 'date', 'started_on' => 'date'];
    }
}
