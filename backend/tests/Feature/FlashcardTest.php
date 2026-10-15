<?php

namespace Tests\Feature;

use App\Models\Chapter;
use App\Models\Course;
use App\Models\FlashcardReview;
use App\Models\Lesson;
use App\Models\LessonBlock;
use App\Models\LessonProgress;
use App\Models\User;
use App\Services\FlashcardService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class FlashcardTest extends TestCase
{
    use RefreshDatabase;

    private User $student;

    private LessonBlock $block;

    protected function setUp(): void
    {
        parent::setUp();
        Carbon::setTestNow('2026-12-07 09:00');
        $lesson = Lesson::factory()->for(Chapter::factory()->for(Course::factory()->published()))->create();
        $this->block = LessonBlock::factory()->for($lesson)->create(['type' => 'flashcard', 'content' => ['cards' => [
            ['front' => 'SELECT', 'back' => 'Lấy dữ liệu'],
            ['front' => 'WHERE', 'back' => 'Lọc dòng'],
        ]]]);
        $this->student = User::factory()->create();
        LessonProgress::create(['user_id' => $this->student->id, 'lesson_id' => $lesson->id, 'completed_at' => now()]);
        $this->actingAs($this->student);
    }

    public function test_thuat_toan_sm2(): void
    {
        // Nhớ (q = 4) liên tiếp: 1 ngày → 6 ngày → 6 × 2,5 = 15 ngày, độ dễ giữ nguyên
        $this->assertSame([2.5, 1, 1], FlashcardService::sm2(2.5, 0, 0, 4));
        $this->assertSame([2.5, 6, 2], FlashcardService::sm2(2.5, 1, 1, 4));
        $this->assertSame([2.5, 15, 3], FlashcardService::sm2(2.5, 6, 2, 4));
        // Dễ (q = 5) tăng độ dễ, khó (q = 3) giảm
        $this->assertSame(2.6, FlashcardService::sm2(2.5, 0, 0, 5)[0]);
        $this->assertSame(2.36, FlashcardService::sm2(2.5, 0, 0, 3)[0]);
        // Quên (q < 3): học lại từ đầu, độ dễ giảm nhưng không dưới 1,3
        $this->assertSame([1.96, 1, 0], FlashcardService::sm2(2.5, 15, 3, 1));
        $this->assertSame(1.3, FlashcardService::sm2(1.4, 1, 0, 1)[0]);
    }

    public function test_the_cua_bai_da_hoc_vao_hang_on(): void
    {
        $this->getJson('/api/reviews')
            ->assertOk()
            ->assertJsonCount(2, 'cards')
            ->assertJsonPath('cards.0.front', 'SELECT')
            ->assertJsonPath('cards.0.is_new', true)
            ->assertJsonPath('cards.0.next_days.good', 1)
            ->assertJsonPath('stats.due', 2);

        // Gọi lại không tạo thẻ trùng
        $this->getJson('/api/reviews');
        $this->assertDatabaseCount('flashcard_reviews', 2);
    }

    public function test_cham_the_hen_ngay_on_tiep(): void
    {
        $id = $this->getJson('/api/reviews')->json('cards.0.id');

        $this->postJson("/api/reviews/{$id}", ['rating' => 'good'])
            ->assertOk()
            ->assertJsonPath('due_on', '2026-12-08')
            ->assertJsonPath('interval_days', 1);
        $this->getJson('/api/reviews')->assertJsonCount(1, 'cards')->assertJsonPath('stats.tomorrow', 1);

        // Hôm sau ôn tiếp: hẹn 6 ngày
        Carbon::setTestNow('2026-12-08 09:00');
        $this->postJson("/api/reviews/{$id}", ['rating' => 'good'])->assertJsonPath('due_on', '2026-12-14');
        $this->assertSame(2, FlashcardReview::find($id)->review_count);
    }

    public function test_bo_qua_the_da_bi_xoa_va_khong_cham_the_nguoi_khac(): void
    {
        $id = $this->getJson('/api/reviews')->json('cards.1.id');
        $this->block->update(['content' => ['cards' => [['front' => 'SELECT', 'back' => 'Lấy dữ liệu']]]]);
        $this->getJson('/api/reviews')->assertJsonCount(1, 'cards');

        $this->postJson("/api/reviews/{$id}", ['rating' => 'sai'])->assertJsonValidationErrors('rating');
        $this->actingAs(User::factory()->create());
        $this->postJson("/api/reviews/{$id}", ['rating' => 'good'])->assertForbidden();
    }
}
