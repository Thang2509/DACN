<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

// Túi đồ: số lượng mỗi vật phẩm học viên đang có
class UserItem extends Model
{
    protected $fillable = ['user_id', 'pet_item_id', 'quantity'];

    protected $attributes = ['quantity' => 0];

    public function item(): BelongsTo
    {
        return $this->belongsTo(PetItem::class, 'pet_item_id');
    }
}
