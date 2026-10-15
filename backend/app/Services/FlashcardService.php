<?php

namespace App\Services;

use App\Events\FlashcardReviewed;
use App\Models\FlashcardReview;
use App\Models\LessonBlock;
use App\Models\LessonProgress;
use App\Models\User;

/**
 * Ôn tập flashcard lặp lại ngắt quãng (SM-2).
 * Thẻ trong khối flashcard của bài đã hoàn thành vào hàng ôn ngay hôm đó; mỗi lần ôn chấm mức nhớ
 * rồi hẹn ngày ôn tiếp: nhớ càng tốt thì khoảng cách càng dài.
 */
class FlashcardService
{
    // Nút đánh giá → điểm chất lượng q (0–5) của SM-2
    public const RATINGS = ['again' => 1, 'hard' => 3, 'good' => 4, 'easy' => 5];

    private const QUEUE_LIMIT = 100;

    /**
     * Một bước SM-2: trả về [độ dễ mới, số ngày tới lần ôn sau, số lần nhớ liên tiếp].
     * q < 3 (quên): học lại từ đầu, ôn lại sau 1 ngày. Nhớ: 1 ngày → 6 ngày → khoảng cũ × độ dễ.
     */
    public static function sm2(float $easiness, int $interval, int $repetitions, int $quality): array
    {
        $easiness = max(1.3, round($easiness + 0.1 - (5 - $quality) * (0.08 + (5 - $quality) * 0.02), 2));
        if ($quality < 3) {
            return [$easiness, 1, 0];
        }

        $repetitions++;
        $interval = match ($repetitions) {
            1 => 1,
            2 => 6,
            default => (int) round($interval * $easiness),
        };

        return [$easiness, $interval, $repetitions];
    }

    // Thêm thẻ của các bài đã hoàn thành vào hàng ôn (thẻ đã có thì bỏ qua)
    public function syncNewCards(User $user): void
    {
        $blocks = LessonBlock::where('type', 'flashcard')
            ->whereIn('lesson_id', LessonProgress::where('user_id', $user->id)->select('lesson_id'))
            ->get(['id', 'content']);

        $rows = [];
        foreach ($blocks as $block) {
            foreach (array_keys($block->content['cards'] ?? []) as $index) {
                $rows[] = [
                    'user_id' => $user->id,
                    'lesson_block_id' => $block->id,
                    'card_index' => $index,
                    'due_on' => today()->toDateString(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
        }
        if ($rows) {
            FlashcardReview::insertOrIgnore($rows);
        }
    }

    // Các thẻ đến hạn hôm nay kèm số ngày hẹn cho từng nút đánh giá, và thống kê nhanh
    public function queue(User $user): array
    {
        $this->syncNewCards($user);
        $reviews = FlashcardReview::where('user_id', $user->id);
        $due = $reviews->clone()->with('block.lesson:id,chapter_id,title', 'block.lesson.chapter.course:id,title,slug')
            ->whereDate('due_on', '<=', today())->orderBy('due_on')->orderBy('id')->limit(self::QUEUE_LIMIT)->get();

        $cards = $due->map(function (FlashcardReview $review) {
            $card = $review->block->content['cards'][$review->card_index] ?? null;
            if (! $card) {
                return null; // giảng viên đã xóa thẻ này khỏi bài
            }

            return [
                'id' => $review->id,
                'front' => $card['front'],
                'back' => $card['back'],
                'lesson' => $review->block->lesson->title,
                'course' => $review->block->lesson->chapter->course->only('title', 'slug'),
                'is_new' => $review->review_count === 0,
                'next_days' => collect(self::RATINGS)
                    ->map(fn ($quality) => self::sm2($review->easiness, $review->interval_days, $review->repetitions, $quality)[1]),
            ];
        })->filter()->values();

        return [
            'cards' => $cards,
            'stats' => [
                'due' => $reviews->clone()->whereDate('due_on', '<=', today())->count(),
                'total' => $reviews->clone()->count(),
                'learned' => $reviews->clone()->where('repetitions', '>', 0)->count(),
                'tomorrow' => $reviews->clone()->whereDate('due_on', today()->addDay())->count(),
            ],
        ];
    }

    // Chấm một lần ôn; ôn thẻ đến hạn thì báo sang phần phát thưởng (R05, nhiệm vụ ôn thẻ)
    public function review(User $user, FlashcardReview $review, string $rating): FlashcardReview
    {
        $wasDue = $review->due_on->lte(today());
        [$easiness, $interval, $repetitions] = self::sm2($review->easiness, $review->interval_days, $review->repetitions, self::RATINGS[$rating]);

        $review->update([
            'easiness' => $easiness,
            'interval_days' => $interval,
            'repetitions' => $repetitions,
            'review_count' => $review->review_count + 1,
            'due_on' => today()->addDays($interval),
            'last_reviewed_at' => now(),
        ]);

        if ($wasDue) {
            FlashcardReviewed::dispatch($user->id, $review->lesson_block_id, $review->card_index);
        }

        return $review;
    }
}
