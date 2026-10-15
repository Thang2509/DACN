<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

// Nội thất đã đặt trong phòng thú cưng
class RoomItem extends Model
{
    protected $fillable = ['user_id', 'pet_item_id', 'x', 'z', 'rotation'];

    public function item(): BelongsTo
    {
        return $this->belongsTo(PetItem::class, 'pet_item_id');
    }
}
