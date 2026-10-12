<?php

namespace Tests\Feature;

use App\Models\Chapter;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CourseManagementTest extends TestCase
{
    use RefreshDatabase;

    private const COURSE = ['title' => 'Cấu trúc dữ liệu', 'level' => 'beginner', 'price' => 0];

    public function test_hoc_vien_khong_vao_duoc_khu_giang_vien(): void
    {
        $this->actingAs(User::factory()->create())->getJson('/api/instructor/courses')->assertForbidden();
    }

    public function test_giang_vien_chua_xac_thuc_email_khong_soan_duoc(): void
    {
        $this->actingAs(User::factory()->instructor()->unverified()->create())
            ->getJson('/api/instructor/courses')
            ->assertForbidden();
    }

    public function test_tao_khoa_hoc_o_trang_thai_nhap_va_slug_khong_trung(): void
    {
        $this->actingAs(User::factory()->instructor()->create());

        $this->postJson('/api/instructor/courses', self::COURSE)
            ->assertCreated()
            ->assertJsonPath('slug', 'cau-truc-du-lieu')
            ->assertJsonPath('status', 'draft');
        $this->postJson('/api/instructor/courses', self::COURSE)->assertJsonPath('slug', 'cau-truc-du-lieu-2');
    }

    public function test_khong_sua_duoc_khoa_cua_giang_vien_khac(): void
    {
        $course = Course::factory()->create();

        $this->actingAs(User::factory()->instructor()->create())
            ->putJson("/api/instructor/courses/{$course->id}", self::COURSE)
            ->assertForbidden();
    }

    public function test_quan_tri_vien_sua_duoc_moi_khoa(): void
    {
        $course = Course::factory()->create();

        $this->actingAs(User::factory()->admin()->create())
            ->putJson("/api/instructor/courses/{$course->id}", self::COURSE)
            ->assertOk()
            ->assertJsonPath('title', 'Cấu trúc dữ liệu');
    }

    public function test_them_chuong_bai_va_chuyen_bai_sang_chuong_khac(): void
    {
        $course = Course::factory()->create();
        $this->actingAs($course->instructor);

        $chapter1 = $this->postJson("/api/instructor/courses/{$course->id}/chapters", ['title' => 'Chương 1'])->assertCreated()->json('id');
        $chapter2 = $this->postJson("/api/instructor/courses/{$course->id}/chapters", ['title' => 'Chương 2'])->json('id');
        $lesson1 = $this->postJson("/api/instructor/chapters/{$chapter1}/lessons", ['title' => 'Bài 1'])->assertCreated()->json('id');
        $lesson2 = $this->postJson("/api/instructor/chapters/{$chapter1}/lessons", ['title' => 'Bài 2'])->json('id');

        // Đảo thứ tự chương và chuyển bài 2 sang chương 2
        $this->putJson("/api/instructor/courses/{$course->id}/outline", ['chapters' => [
            ['id' => $chapter2, 'lessons' => [$lesson2]],
            ['id' => $chapter1, 'lessons' => [$lesson1]],
        ]])->assertNoContent();

        $this->assertSame([$chapter2, $chapter1], $course->chapters()->pluck('id')->all());
        $this->assertSame($chapter2, Lesson::find($lesson2)->chapter_id);
    }

    public function test_sap_xep_thieu_bai_thi_bi_tu_choi(): void
    {
        $lesson = Lesson::factory()->create();
        $chapter = $lesson->chapter;

        $this->actingAs($chapter->course->instructor)
            ->putJson("/api/instructor/courses/{$chapter->course_id}/outline", ['chapters' => [['id' => $chapter->id, 'lessons' => []]]])
            ->assertJsonValidationErrors('chapters');
    }

    public function test_gui_duyet_can_it_nhat_mot_bai(): void
    {
        $course = Course::factory()->create();
        $this->actingAs($course->instructor);

        $this->postJson("/api/instructor/courses/{$course->id}/submit")->assertJsonValidationErrors('course');

        Lesson::factory()->for(Chapter::factory()->for($course))->create();
        $this->postJson("/api/instructor/courses/{$course->id}/submit")->assertOk()->assertJsonPath('status', 'pending');
    }

    public function test_chi_xoa_duoc_khoa_nhap(): void
    {
        $published = Course::factory()->published()->create();
        $draft = Course::factory()->for($published->instructor, 'instructor')->create();
        $this->actingAs($published->instructor);

        $this->deleteJson("/api/instructor/courses/{$published->id}")->assertJsonValidationErrors('course');
        $this->deleteJson("/api/instructor/courses/{$draft->id}")->assertNoContent();
        $this->assertModelMissing($draft);
    }

    public function test_tai_anh_bia(): void
    {
        Storage::fake('public');
        $course = Course::factory()->create();

        $this->actingAs($course->instructor)
            ->post("/api/instructor/courses/{$course->id}/thumbnail", ['thumbnail' => UploadedFile::fake()->image('bia.png')], ['Accept' => 'application/json'])
            ->assertOk();

        Storage::disk('public')->assertExists($course->fresh()->thumbnail_path);
    }
}
