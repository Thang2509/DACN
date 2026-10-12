<?php

namespace Tests\Feature;

use App\Models\Chapter;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonBlock;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LearningTest extends TestCase
{
    use RefreshDatabase;

    private const QUIZ = ['questions' => [
        ['question' => '1 + 1 = ?', 'options' => ['1', '2'], 'answer' => 1, 'explanation' => 'Vì 1 + 1 = 2'],
        ['question' => '2 + 2 = ?', 'options' => ['4', '5'], 'answer' => 0, 'explanation' => null],
    ]];

    private function lessonInCourse(array $courseState = [], array $lessonState = []): Lesson
    {
        $course = Course::factory()->published()->create($courseState);

        return Lesson::factory()->for(Chapter::factory()->for($course))->create($lessonState);
    }

    private function enrolledStudent(Lesson $lesson): User
    {
        $student = User::factory()->create();
        Enrollment::create(['user_id' => $student->id, 'course_id' => $lesson->chapter->course_id]);

        return $student;
    }

    private function quizBlock(Lesson $lesson): LessonBlock
    {
        return LessonBlock::factory()->for($lesson)->create(['type' => 'quiz', 'content' => self::QUIZ, 'position' => 2]);
    }

    public function test_dang_ky_khoa_mien_phi(): void
    {
        $course = Course::factory()->published()->create();

        $this->actingAs(User::factory()->create())
            ->postJson("/api/courses/{$course->id}/enroll")
            ->assertCreated();
        $this->assertDatabaseCount('enrollments', 1);
    }

    public function test_khoa_co_phi_chua_dang_ky_duoc(): void
    {
        $course = Course::factory()->published()->create(['price' => 199000]);

        $this->actingAs(User::factory()->create())
            ->postJson("/api/courses/{$course->id}/enroll")
            ->assertJsonValidationErrors('course');
    }

    public function test_chua_xac_thuc_email_khong_dang_ky_duoc(): void
    {
        $course = Course::factory()->published()->create();

        $this->actingAs(User::factory()->unverified()->create())
            ->postJson("/api/courses/{$course->id}/enroll")
            ->assertForbidden();
    }

    public function test_khach_xem_duoc_bai_hoc_thu_nhung_khong_xem_bai_khac(): void
    {
        $preview = $this->lessonInCourse(lessonState: ['is_preview' => true]);
        $locked = Lesson::factory()->for($preview->chapter)->create(['position' => 2]);

        $this->getJson("/api/lessons/{$preview->id}")->assertOk()->assertJsonPath('enrolled', false);
        $this->getJson("/api/lessons/{$locked->id}")->assertUnauthorized()->assertJsonPath('course.slug', $preview->chapter->course->slug);
        $this->actingAs(User::factory()->create())->getJson("/api/lessons/{$locked->id}")->assertForbidden();
    }

    public function test_nguoi_soan_xem_duoc_moi_bai_cua_khoa_minh(): void
    {
        $lesson = $this->lessonInCourse(['price' => 199000]);

        $this->actingAs($lesson->chapter->course->instructor)
            ->getJson("/api/lessons/{$lesson->id}")
            ->assertOk()
            ->assertJsonPath('can_manage', true)
            ->assertJsonPath('enrolled', false);
    }

    public function test_bai_hoc_an_dap_an_quiz(): void
    {
        $lesson = $this->lessonInCourse();
        $this->quizBlock($lesson);

        $response = $this->actingAs($this->enrolledStudent($lesson))->getJson("/api/lessons/{$lesson->id}")->assertOk();

        $question = $response->json('blocks.0.content.questions.0');
        $this->assertSame(['question', 'options'], array_keys($question));
    }

    public function test_cham_quiz_va_luu_luot_lam(): void
    {
        $lesson = $this->lessonInCourse();
        $quiz = $this->quizBlock($lesson);
        $student = $this->enrolledStudent($lesson);

        $this->actingAs($student)
            ->postJson("/api/lessons/{$lesson->id}/quiz/{$quiz->id}", ['answers' => [1, 1]])
            ->assertOk()
            ->assertJsonPath('correct_count', 1)
            ->assertJsonPath('results.0.correct', true)
            ->assertJsonPath('results.0.explanation', 'Vì 1 + 1 = 2')
            ->assertJsonPath('results.1.answer', 0);

        // Lần sau mở bài thấy lại kết quả lượt làm gần nhất
        $this->getJson("/api/lessons/{$lesson->id}")->assertJsonPath("quiz_attempts.{$quiz->id}.correct_count", 1);
    }

    public function test_quiz_phai_tra_loi_du_cau(): void
    {
        $lesson = $this->lessonInCourse();
        $quiz = $this->quizBlock($lesson);

        $this->actingAs($this->enrolledStudent($lesson))
            ->postJson("/api/lessons/{$lesson->id}/quiz/{$quiz->id}", ['answers' => [1]])
            ->assertJsonValidationErrors('answers');
    }

    public function test_khoi_cua_bai_khac_tra_ve_404(): void
    {
        $lesson = $this->lessonInCourse();
        $otherQuiz = $this->quizBlock($this->lessonInCourse());

        $this->actingAs($this->enrolledStudent($lesson))
            ->postJson("/api/lessons/{$lesson->id}/quiz/{$otherQuiz->id}", ['answers' => [1, 0]])
            ->assertNotFound();
    }

    public function test_hoan_thanh_bai_can_tra_loi_het_quiz(): void
    {
        $lesson = $this->lessonInCourse();
        $quiz = $this->quizBlock($lesson);
        $this->actingAs($this->enrolledStudent($lesson));

        $this->postJson("/api/lessons/{$lesson->id}/complete")->assertJsonValidationErrors('lesson');

        // Trả lời sai hết vẫn được tính là đã làm
        $this->postJson("/api/lessons/{$lesson->id}/quiz/{$quiz->id}", ['answers' => [0, 1]]);
        $this->postJson("/api/lessons/{$lesson->id}/complete")
            ->assertOk()
            ->assertJsonPath('completed', 1)
            ->assertJsonPath('total', 1);
    }

    public function test_hoan_thanh_lai_khong_tao_ban_ghi_trung_va_danh_dau_xong_khoa(): void
    {
        $lesson = $this->lessonInCourse();
        $student = $this->enrolledStudent($lesson);
        $this->actingAs($student);

        $this->postJson("/api/lessons/{$lesson->id}/complete")->assertOk();
        $this->postJson("/api/lessons/{$lesson->id}/complete")->assertOk();

        $this->assertDatabaseCount('lesson_progress', 1);
        $this->assertNotNull(Enrollment::firstWhere('user_id', $student->id)->completed_at);
    }

    public function test_chua_dang_ky_khong_luu_tien_do_bai_hoc_thu(): void
    {
        $lesson = $this->lessonInCourse(lessonState: ['is_preview' => true]);

        $this->actingAs(User::factory()->create())
            ->postJson("/api/lessons/{$lesson->id}/complete")
            ->assertJsonValidationErrors('lesson');
    }

    public function test_khoa_hoc_cua_toi_kem_tien_do(): void
    {
        $lesson = $this->lessonInCourse();
        $student = $this->enrolledStudent($lesson);

        $this->actingAs($student)->getJson('/api/my/courses')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.progress.total', 1)
            ->assertJsonPath('0.progress.next_lesson_id', $lesson->id);
    }
}
