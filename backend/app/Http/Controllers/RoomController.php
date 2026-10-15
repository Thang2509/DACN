<?php

namespace App\Http\Controllers;

use App\Http\Requests\SaveRoomRequest;
use App\Services\RoomService;
use Illuminate\Http\Request;

// Phòng thú cưng: xem và lưu bố cục nội thất
class RoomController extends Controller
{
    public function __construct(private RoomService $room) {}

    public function show(Request $request)
    {
        return $this->room->show($request->user());
    }

    public function update(SaveRoomRequest $request)
    {
        return $this->room->save($request->user(), $request->validated('items', []));
    }
}
