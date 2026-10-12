<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminTest extends TestCase
{
    use RefreshDatabase;

    public function test_giang_vien_khong_vao_duoc_trang_quan_tri(): void
    {
        $this->actingAs(User::factory()->instructor()->create())->getJson('/api/admin/users')->assertForbidden();
    }

    public function test_tim_nguoi_dung_va_cap_quyen_giang_vien(): void
    {
        $student = User::factory()->create(['name' => 'Nguyễn Văn Tèo']);
        User::factory()->count(2)->create();
        $this->actingAs(User::factory()->admin()->create());

        $this->getJson('/api/admin/users?search=Tèo')->assertOk()->assertJsonCount(1, 'data');
        $this->putJson("/api/admin/users/{$student->id}/role", ['role' => 'instructor'])
            ->assertOk()
            ->assertJsonPath('role', 'instructor');
    }

    public function test_khong_tu_doi_vai_tro_cua_minh(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)
            ->putJson("/api/admin/users/{$admin->id}/role", ['role' => 'student'])
            ->assertJsonValidationErrors('role');
    }

    public function test_duyet_khoa_hoc(): void
    {
        $course = Course::factory()->pending()->create();
        Course::factory()->create(); // khóa nháp không hiện trong danh sách chờ duyệt
        $this->actingAs(User::factory()->admin()->create());

        $this->getJson('/api/admin/courses')->assertJsonCount(1, 'data');
        $this->postJson("/api/admin/courses/{$course->id}/approve")
            ->assertOk()
            ->assertJsonPath('status', 'published');

        $this->assertNotNull($course->fresh()->published_at);
    }

    public function test_tu_choi_khoa_hoc_phai_co_ly_do(): void
    {
        $course = Course::factory()->pending()->create();
        $this->actingAs(User::factory()->admin()->create());

        $this->postJson("/api/admin/courses/{$course->id}/reject")->assertJsonValidationErrors('note');
        $this->postJson("/api/admin/courses/{$course->id}/reject", ['note' => 'Thiếu bài tập'])
            ->assertOk()
            ->assertJsonPath('status', 'rejected')
            ->assertJsonPath('review_note', 'Thiếu bài tập');
    }

    public function test_khong_duyet_khoa_chua_gui(): void
    {
        $draft = Course::factory()->create();

        $this->actingAs(User::factory()->admin()->create())
            ->postJson("/api/admin/courses/{$draft->id}/approve")
            ->assertJsonValidationErrors('course');
    }
}
