<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

// Sổ cái điểm: chỉ thêm, không sửa
class PointLedger extends Model
{
    protected $table = 'point_ledger';

    public const UPDATED_AT = null;

    protected $fillable = ['user_id', 'reason', 'idempotency_key', 'xp', 'coins', 'meta'];

    protected function casts(): array
    {
        return ['xp' => 'integer', 'coins' => 'integer', 'meta' => 'array'];
    }
}
