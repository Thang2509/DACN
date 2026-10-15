<?php

namespace App\Http\Controllers;

use App\Models\FlashcardReview;
use App\Services\FlashcardService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

// Ôn tập flashcard (SM-2): lấy các thẻ đến hạn và chấm từng lần ôn
class ReviewController extends Controller
{
    public function __construct(private FlashcardService $flashcards) {}

    public function index(Request $request)
    {
        return $this->flashcards->queue($request->user());
    }

    public function store(Request $request, FlashcardReview $review)
    {
        abort_unless($review->user_id === $request->user()->id, 403);
        $data = $request->validate(['rating' => ['required', Rule::in(array_keys(FlashcardService::RATINGS))]]);
        $review = $this->flashcards->review($request->user(), $review, $data['rating']);

        return ['due_on' => $review->due_on->toDateString(), 'interval_days' => $review->interval_days];
    }
}
