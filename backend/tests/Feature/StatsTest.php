<?php

namespace Tests\Feature;

use App\Models\Chapter;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonBlock;
use App\Models\LessonProgress;
use App\Models\Order;
use App\Models\QuizAttempt;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class StatsTest extends TestCase
{
    use RefreshDatabase;

    private User $instructor;

    private Course $course;

    private Lesson $lesson;

    protected function setUp(): void
    {
        parent::setUp();
        Carbon::setTestNow('2026-12-10 09:00');
        $this->instructor = User::factory()->instructor()->create();
        $this->course = Course::factory()->published()->create(['instructor_id' => $this->instructor->id, 'price' => 199000]);
        $this->lesson = Lesson::factory()->for(Chapter::factory()->for($this->course))->create();

        // 2 học viên đăng ký, 1 người học xong
        foreach (User::factory()->count(2)->create() as $i => $student) {
            Enrollment::create(['user_id' => $student->id, 'course_id' => $this->course->id, 'completed_at' => $i ? null : now()]);
            if (! $i) {
                LessonProgress::create(['user_id' => $student->id, 'lesson_id' => $this->lesson->id, 'completed_at' => now()]);
            }
        }
    }

    public function test_thong_ke_he_thong(): void
    {
        $order = ['user_id' => User::first()->id, 'course_id' => $this->course->id, 'original_price' => 199000, 'amount' => 179100];
        Order::create([...$order, 'status' => 'paid', 'momo_order_id' => 'A1', 'paid_at' => now()]);
        Order::create([...$order, 'status' => 'failed', 'momo_order_id' => 'A2']);

        $this->actingAs(User::factory()->admin()->create())
            ->getJson('/api/admin/stats')
            ->assertOk()
            ->assertJsonPath('totals.revenue', 179100)
            ->assertJsonPath('totals.paid_orders', 1)
            ->assertJsonPath('totals.lessons_completed', 1)
            ->assertJsonCount(30, 'daily.new_users')
            ->assertJsonPath('daily.revenue.29', ['date' => '2026-12-10', 'value' => 179100])
            ->assertJsonPath('top_courses.0.enrollments_count', 2)
            ->assertJsonCount(2, 'recent_orders');
    }

    public function test_giang_vien_xem_thong_ke_khoa_cua_minh(): void
    {
        $quiz = LessonBlock::factory()->for($this->lesson)->create(['type' => 'quiz', 'content' => ['questions' => [
            ['question' => 'Dễ', 'options' => ['a', 'b'], 'answer' => 0],
            ['question' => 'Khó', 'options' => ['a', 'b'], 'answer' => 1],
        ]]]);
        [$an, $binh] = User::where('role', 'student')->get();
        QuizAttempt::create(['user_id' => $an->id, 'lesson_block_id' => $quiz->id, 'answers' => [0, 0], 'correct_count' => 1, 'completed_at' => now()]);
        QuizAttempt::create(['user_id' => $an->id, 'lesson_block_id' => $quiz->id, 'answers' => [0, 1], 'correct_count' => 2, 'completed_at' => now()]); // lượt làm lại không tính
        QuizAttempt::create(['user_id' => $binh->id, 'lesson_block_id' => $quiz->id, 'answers' => [0, null], 'correct_count' => 1]);

        // Khóa của giảng viên khác không hiện ra
        Course::factory()->published()->create();

        $this->actingAs($this->instructor)
            ->getJson('/api/instructor/stats')
            ->assertOk()
            ->assertJsonCount(1, 'courses')
            ->assertJsonPath('course.enrollments', 2)
            ->assertJsonPath('course.completion_rate', 50)
            ->assertJsonPath('course.lessons.0.completed', 1)
            ->assertJsonPath('course.hardest_questions.0.question', 'Khó')
            ->assertJsonPath('course.hardest_questions.0.correct_rate', 0)
            ->assertJsonPath('course.hardest_questions.0.answered', 1)
            ->assertJsonPath('course.hardest_questions.1.correct_rate', 100);
    }
}
