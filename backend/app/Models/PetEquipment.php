<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

// Trang bị đang gắn trên thú, mỗi chỗ gắn (đầu, cổ, lưng) một món
class PetEquipment extends Model
{
    protected $table = 'pet_equipment';

    protected $fillable = ['user_pet_id', 'slot', 'pet_item_id'];

    public function item(): BelongsTo
    {
        return $this->belongsTo(PetItem::class, 'pet_item_id');
    }
}
