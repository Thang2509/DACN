<?php

namespace Tests\Feature;

use App\Models\Chapter;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\LearningPath;
use App\Models\Lesson;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CatalogTest extends TestCase
{
    use RefreshDatabase;

    public function test_chi_hien_khoa_da_xuat_ban(): void
    {
        Course::factory()->published()->create(['title' => 'SQL cơ bản']);
        Course::factory()->create(['title' => 'Khóa nháp']);
        Course::factory()->pending()->create();

        $this->getJson('/api/courses')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'SQL cơ bản');
    }

    public function test_tim_kiem_khong_phan_biet_dau(): void
    {
        Course::factory()->published()->create(['title' => 'Cấu trúc dữ liệu']);
        Course::factory()->published()->create(['title' => 'JavaScript nền tảng']);

        $this->getJson('/api/courses?search=cau truc')->assertJsonCount(1, 'data');
    }

    public function test_loc_theo_cap_do_gia_va_lo_trinh(): void
    {
        $free = Course::factory()->published()->create(['level' => 'beginner', 'price' => 0]);
        Course::factory()->published()->create(['level' => 'advanced', 'price' => 199000]);
        $path = LearningPath::create(['title' => 'Web', 'slug' => 'web']);
        $path->courses()->attach($free->id, ['position' => 1]);

        $this->getJson('/api/courses?level=advanced')->assertJsonCount(1, 'data');
        $this->getJson('/api/courses?price=free')->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $free->id);
        $this->getJson('/api/courses?price=paid')->assertJsonCount(1, 'data');
        $this->getJson('/api/courses?path=web')->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $free->id);
    }

    public function test_sap_xep_pho_bien_theo_so_hoc_vien(): void
    {
        Course::factory()->published()->create();
        $popular = Course::factory()->published()->create(['published_at' => now()->subYear()]);
        Enrollment::create(['user_id' => User::factory()->create()->id, 'course_id' => $popular->id]);

        $this->getJson('/api/courses?sort=popular')->assertJsonPath('data.0.id', $popular->id);
    }

    public function test_khoa_nhap_tra_ve_404_tru_nguoi_soan(): void
    {
        $draft = Course::factory()->create();

        $this->getJson("/api/courses/{$draft->slug}")->assertNotFound();
        $this->actingAs($draft->instructor)->getJson("/api/courses/{$draft->slug}")->assertOk();
    }

    public function test_chi_tiet_khoa_kem_tien_do_khi_da_dang_ky(): void
    {
        $course = Course::factory()->published()->create();
        $lessons = Lesson::factory()->count(2)->for(Chapter::factory()->for($course))->sequence(['position' => 1], ['position' => 2])->create();
        $student = User::factory()->create();
        Enrollment::create(['user_id' => $student->id, 'course_id' => $course->id]);

        $this->getJson("/api/courses/{$course->slug}")
            ->assertOk()
            ->assertJsonPath('enrolled', false)
            ->assertJsonPath('progress', null)
            ->assertJsonCount(2, 'chapters.0.lessons');

        $this->actingAs($student)->getJson("/api/courses/{$course->slug}")
            ->assertJsonPath('enrolled', true)
            ->assertJsonPath('progress.total', 2)
            ->assertJsonPath('progress.next_lesson_id', $lessons[0]->id);
    }
}
