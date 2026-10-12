<?php

namespace Tests\Feature;

use App\Models\Chapter;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonBlock;
use App\Models\QuizAttempt;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LearningTest extends TestCase
{
    use RefreshDatabase;

    private const QUIZ = ['variant' => 'test', 'questions' => [
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

    private function lessonUrl(Lesson $lesson): string
    {
        return "/api/courses/{$lesson->chapter->course->slug}/lessons/{$lesson->slug}";
    }

    private function answer(Lesson $lesson, LessonBlock $quiz, int $question, int $answer)
    {
        return $this->postJson("/api/lessons/{$lesson->id}/quiz/{$quiz->id}/answer", compact('question', 'answer'));
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
        $preview = $this->lessonInCourse(lessonState: ['is_preview' => true, 'intro_video_url' => 'https://youtu.be/dQw4w9WgXcQ']);
        $locked = Lesson::factory()->for($preview->chapter)->create(['position' => 2]);

        $this->getJson($this->lessonUrl($preview))
            ->assertOk()
            ->assertJsonPath('lesson.intro_video_url', 'https://youtu.be/dQw4w9WgXcQ')
            ->assertJsonPath('enrolled', false)
            ->assertJsonPath('next_lesson.slug', $locked->slug);
        $this->getJson($this->lessonUrl($locked))->assertUnauthorized()->assertJsonPath('course.slug', $preview->chapter->course->slug);
        $this->actingAs(User::factory()->create())->getJson($this->lessonUrl($locked))->assertForbidden();
    }

    public function test_slug_bai_cua_khoa_khac_tra_ve_404(): void
    {
        $lesson = $this->lessonInCourse(lessonState: ['is_preview' => true]);
        $otherCourse = Course::factory()->published()->create();

        $this->getJson("/api/courses/{$otherCourse->slug}/lessons/{$lesson->slug}")->assertNotFound();
    }

    public function test_nguoi_soan_xem_duoc_moi_bai_cua_khoa_minh(): void
    {
        $lesson = $this->lessonInCourse(['price' => 199000]);

        $this->actingAs($lesson->chapter->course->instructor)
            ->getJson($this->lessonUrl($lesson))
            ->assertOk()
            ->assertJsonPath('can_manage', true)
            ->assertJsonPath('enrolled', false);
    }

    public function test_bai_hoc_an_dap_an_quiz(): void
    {
        $lesson = $this->lessonInCourse();
        $this->quizBlock($lesson);

        $response = $this->actingAs($this->enrolledStudent($lesson))->getJson($this->lessonUrl($lesson))->assertOk();

        $this->assertSame('test', $response->json('blocks.0.content.variant'));
        $this->assertSame(['question', 'options'], array_keys($response->json('blocks.0.content.questions.0')));
    }

    public function test_cham_tung_cau_chi_lo_dap_an_cau_da_tra_loi(): void
    {
        $lesson = $this->lessonInCourse();
        $quiz = $this->quizBlock($lesson);
        $this->actingAs($this->enrolledStudent($lesson));

        $this->answer($lesson, $quiz, 0, 1)
            ->assertOk()
            ->assertJsonPath('results.0.correct', true)
            ->assertJsonPath('results.0.explanation', 'Vì 1 + 1 = 2')
            ->assertJsonPath('results.1', null)
            ->assertJsonPath('completed', false);

        $this->answer($lesson, $quiz, 1, 1)
            ->assertJsonPath('results.1.correct', false)
            ->assertJsonPath('results.1.answer', 0)
            ->assertJsonPath('correct_count', 1)
            ->assertJsonPath('completed', true);

        // Mở lại bài thấy kết quả lượt làm gần nhất
        $this->getJson($this->lessonUrl($lesson))->assertJsonPath("quiz_attempts.{$quiz->id}.correct_count", 1);
    }

    public function test_khong_doi_duoc_cau_da_tra_loi_va_cau_khong_ton_tai(): void
    {
        $lesson = $this->lessonInCourse();
        $quiz = $this->quizBlock($lesson);
        $this->actingAs($this->enrolledStudent($lesson));

        $this->answer($lesson, $quiz, 0, 0);
        $this->answer($lesson, $quiz, 0, 1)->assertJsonValidationErrors('question');
        $this->answer($lesson, $quiz, 5, 0)->assertJsonValidationErrors('question');
    }

    public function test_lam_lai_tao_luot_moi_sau_khi_xong(): void
    {
        $lesson = $this->lessonInCourse();
        $quiz = $this->quizBlock($lesson);
        $this->actingAs($this->enrolledStudent($lesson));

        $this->answer($lesson, $quiz, 0, 1);
        $this->answer($lesson, $quiz, 1, 0);
        $this->answer($lesson, $quiz, 0, 0)
            ->assertJsonPath('completed', false)
            ->assertJsonPath('completed_once', true); // vẫn được tính là đã làm quiz

        $this->assertSame(2, QuizAttempt::count());
    }

    public function test_khoi_cua_bai_khac_tra_ve_404(): void
    {
        $lesson = $this->lessonInCourse();
        $otherQuiz = $this->quizBlock($this->lessonInCourse());

        $this->actingAs($this->enrolledStudent($lesson));
        $this->answer($lesson, $otherQuiz, 0, 1)->assertNotFound();
    }

    public function test_hoan_thanh_bai_can_lam_xong_quiz(): void
    {
        $lesson = $this->lessonInCourse();
        $quiz = $this->quizBlock($lesson);
        $this->actingAs($this->enrolledStudent($lesson));

        $this->postJson("/api/lessons/{$lesson->id}/complete")->assertJsonValidationErrors('lesson');

        // Mới trả lời 1/2 câu thì chưa được hoàn thành
        $this->answer($lesson, $quiz, 0, 0);
        $this->postJson("/api/lessons/{$lesson->id}/complete")->assertJsonValidationErrors('lesson');

        // Trả lời hết (sai vẫn được tính)
        $this->answer($lesson, $quiz, 1, 1);
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
        $lesson = $this->lessonInCourse(lessonState: ['duration_minutes' => 25]);
        $student = $this->enrolledStudent($lesson);

        $this->actingAs($student)->getJson('/api/my/courses')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.progress.total', 1)
            ->assertJsonPath('0.progress.next_lesson.slug', $lesson->slug)
            ->assertJsonPath('0.lessons_sum_duration_minutes', 25);
    }
}
