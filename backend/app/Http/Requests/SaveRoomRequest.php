<?php

namespace App\Http\Requests;

use App\Services\RoomService;
use Illuminate\Foundation\Http\FormRequest;

// Bố cục phòng: danh sách món đặt trên lưới (kiểm tra chồng lấn, số lượng ở RoomService)
class SaveRoomRequest extends FormRequest
{
    public function rules(): array
    {
        $max = RoomService::GRID - 1;

        return [
            'items' => ['present', 'array', 'max:40'],
            'items.*.pet_item_id' => ['required', 'integer'],
            'items.*.x' => ['required', 'integer', 'between:0,'.$max],
            'items.*.z' => ['required', 'integer', 'between:0,'.$max],
            'items.*.rotation' => ['required', 'integer', 'between:0,3'],
        ];
    }
}
