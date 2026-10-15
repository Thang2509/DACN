<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

// Vật phẩm mua bằng xu: thức ăn, trang bị gắn lên thú, nội thất đặt trong phòng
class PetItem extends Model
{
    protected $fillable = ['code', 'name', 'type', 'bone_slot', 'price', 'effect', 'size_x', 'size_z'];

    protected function casts(): array
    {
        return ['effect' => 'array'];
    }
}
