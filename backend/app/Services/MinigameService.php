<?php

namespace App\Services;

use App\Events\MinigamePlayed;
use App\Models\MinigameScore;
use App\Models\User;
use Illuminate\Validation\ValidationException;

// Minigame của thú cưng: lưu điểm, bảng điểm cao; thưởng xu chạy qua hàng đợi (quy tắc R12)
class MinigameService
{
    public const GAMES = ['runner' => 'Vượt chướng ngại', 'keywords' => 'Hứng từ khóa code'];

    public const REWARDED_PLAYS_PER_DAY = 4;

    // Chặn điểm gửi lên vô lý so với thời gian chơi (game tính tối đa vài chục điểm mỗi giây)
    private const MAX_POINTS_PER_SECOND = 40;

    // Điểm ÷ 100, tối đa 5 xu một lượt
    public static function coinsFor(int $score): int
    {
        return min(5, intdiv($score, 100));
    }

    public function submit(User $user, string $game, int $score, int $duration): array
    {
        if ($score > $duration * self::MAX_POINTS_PER_SECOND) {
            throw ValidationException::withMessages(['score' => 'Điểm không hợp lệ so với thời gian chơi.']);
        }

        $record = MinigameScore::create(['user_id' => $user->id, 'game' => $game, 'score' => $score, 'duration_seconds' => $duration]);
        $playOfDay = $this->playsToday($user);
        MinigamePlayed::dispatch($user->id, $record->id, $playOfDay);

        return [
            'score' => $score,
            'coins' => $playOfDay <= self::REWARDED_PLAYS_PER_DAY ? self::coinsFor($score) : 0,
            ...$this->board($user, $game),
        ];
    }

    // Điểm cao nhất của mỗi người (top 10), điểm cao nhất của mình, số lượt còn được thưởng hôm nay
    public function board(User $user, string $game): array
    {
        $best = MinigameScore::with('user:id,name')
            ->where('game', $game)
            ->selectRaw('user_id, MAX(score) as score')
            ->groupBy('user_id')->orderByDesc('score')->limit(10)->get()
            ->map(fn (MinigameScore $row) => ['name' => $row->user->name, 'score' => (int) $row->score, 'is_me' => $row->user_id === $user->id]);

        return [
            'top' => $best,
            'my_best' => (int) MinigameScore::where('user_id', $user->id)->where('game', $game)->max('score'),
            'rewarded_plays_left' => max(0, self::REWARDED_PLAYS_PER_DAY - $this->playsToday($user)),
        ];
    }

    private function playsToday(User $user): int
    {
        return MinigameScore::where('user_id', $user->id)->where('created_at', '>=', today())->count();
    }
}
