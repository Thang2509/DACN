<?php

namespace App\Http\Controllers;

use App\Services\MinigameService;
use Illuminate\Http\Request;

// Minigame: bảng điểm và gửi điểm sau mỗi lượt chơi ({game} giới hạn ở routes)
class MinigameController extends Controller
{
    public function __construct(private MinigameService $minigames) {}

    public function show(Request $request, string $game)
    {
        return $this->minigames->board($request->user(), $game);
    }

    public function store(Request $request, string $game)
    {
        $data = $request->validate([
            'score' => ['required', 'integer', 'min:0', 'max:100000'],
            'duration' => ['required', 'integer', 'min:1', 'max:1800'], // giây
        ]);

        return $this->minigames->submit($request->user(), $game, $data['score'], $data['duration']);
    }
}
