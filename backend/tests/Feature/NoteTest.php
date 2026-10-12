<?php

namespace Tests\Feature;

use App\Models\Chapter;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonBlock;
use App\Models\Note;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NoteTest extends TestCase
{
    use RefreshDatabase;

    private Lesson $lesson;
    private User $student;

    protected function setUp(): void
    {
        parent::setUp();
        $course = Course::factory()->published()->create();
        $this->lesson = Lesson::factory()->for(Chapter::factory()->for($course))->create();
        $this->student = User::factory()->create();
        Enrollment::create(['user_id' => $this->student->id, 'course_id' => $course->id]);
    }

    public function test_ghi_chu_gan_khoi_va_moc_video(): void
    {
        $video = LessonBlock::factory()->for($this->lesson)->create(['type' => 'video', 'content' => ['url' => 'https://youtu.be/dQw4w9WgXcQ']]);

        $this->actingAs($this->student)
            ->postJson("/api/lessons/{$this->lesson->id}/notes", ['content' => 'Xem lại đoạn này', 'lesson_block_id' => $video->id, 'video_time' => 83])
            ->assertCreated()
            ->assertJsonPath('video_time', 83);

        $this->getJson("/api/notes?lesson_id={$this->lesson->id}")
            ->assertJsonCount(1)
            ->assertJsonPath('0.lesson.chapter.course.slug', $this->lesson->chapter->course->slug);
    }

    public function test_khong_gan_duoc_khoi_cua_bai_khac(): void
    {
        $foreignBlock = LessonBlock::factory()->create();

        $this->actingAs($this->student)
            ->postJson("/api/lessons/{$this->lesson->id}/notes", ['content' => 'x', 'lesson_block_id' => $foreignBlock->id])
            ->assertJsonValidationErrors('lesson_block_id');
    }

    public function test_khong_ghi_chu_bai_chua_duoc_xem(): void
    {
        $this->actingAs(User::factory()->create())
            ->postJson("/api/lessons/{$this->lesson->id}/notes", ['content' => 'x'])
            ->assertForbidden();
    }

    public function test_chi_sua_xoa_ghi_chu_cua_minh(): void
    {
        $note = new Note(['content' => 'Của tôi']);
        $note->user_id = $this->student->id;
        $note->lesson_id = $this->lesson->id;
        $note->save();

        $this->actingAs(User::factory()->create())->putJson("/api/notes/{$note->id}", ['content' => 'Sửa'])->assertForbidden();
        $this->actingAs($this->student)->putJson("/api/notes/{$note->id}", ['content' => 'Đã sửa'])->assertJsonPath('content', 'Đã sửa');
        $this->deleteJson("/api/notes/{$note->id}")->assertNoContent();
        $this->assertModelMissing($note);
    }

    public function test_tim_kiem_ghi_chu(): void
    {
        $this->actingAs($this->student);
        $this->postJson("/api/lessons/{$this->lesson->id}/notes", ['content' => 'JOIN nối bảng']);
        $this->postJson("/api/lessons/{$this->lesson->id}/notes", ['content' => 'GROUP BY gom nhóm']);

        $this->getJson('/api/notes?search=join')->assertJsonCount(1);
    }
}
