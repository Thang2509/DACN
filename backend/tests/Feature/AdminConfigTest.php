<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\LearningPath;
use App\Models\Quest;
use App\Models\User;
use App\Models\Voucher;
use Database\Seeders\GamificationSeeder;
use Database\Seeders\ShopSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

// Quản trị viên cấu hình nhiệm vụ, huy hiệu, voucher và lộ trình học
class AdminConfigTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed([GamificationSeeder::class, ShopSeeder::class]);
        $this->actingAs(User::factory()->admin()->create());
    }

    public function test_xem_va_tao_cau_hinh_phan_thuong(): void
    {
        $this->getJson('/api/admin/rewards')->assertOk()->assertJsonCount(5, 'quests')->assertJsonCount(12, 'badges')->assertJsonCount(2, 'vouchers');

        $this->postJson('/api/admin/rewards/quests', [
            'title' => 'Hoàn thành 3 bài học', 'period' => 'daily', 'target_type' => 'lessons_completed',
            'target_value' => 3, 'reward_xp' => 30, 'reward_coins' => 20,
        ])->assertCreated()->assertJsonPath('target_value', 3);
        $this->assertStringStartsWith('hoan_thanh_3_bai_hoc_', Quest::latest('id')->first()->code);

        $this->postJson('/api/admin/rewards/badges', [
            'name' => 'Siêng ôn', 'description' => 'Ôn 500 lượt', 'icon' => '📖',
            'condition_type' => 'flashcards_reviewed', 'condition_value' => 500, 'reward_coins' => 100,
        ])->assertCreated();
        $this->postJson('/api/admin/rewards/badges', ['name' => 'Sai', 'description' => 'x', 'icon' => 'x', 'condition_type' => 'hack', 'condition_value' => 1, 'reward_coins' => 0])
            ->assertJsonValidationErrors('condition_type');
    }

    public function test_tat_nhiem_vu_va_sua_voucher(): void
    {
        $quest = Quest::firstWhere('code', 'daily_quiz');
        $this->putJson("/api/admin/rewards/quests/{$quest->id}", [...$quest->only('title', 'period', 'target_type', 'target_value', 'reward_xp', 'reward_coins'), 'is_active' => false])
            ->assertOk()->assertJsonPath('is_active', false);

        $this->putJson('/api/admin/rewards/vouchers/'.Voucher::first()->id, ['name' => 'Giảm 15%', 'discount_percent' => 15, 'max_discount' => 60000, 'coin_cost' => 300, 'valid_days' => 14])
            ->assertOk()->assertJsonPath('discount_percent', 15);
        $this->putJson('/api/admin/rewards/vouchers/999', ['name' => 'x', 'discount_percent' => 1, 'max_discount' => 1000, 'coin_cost' => 1, 'valid_days' => 1])->assertNotFound();
    }

    public function test_quan_ly_lo_trinh_va_thu_tu_khoa_hoc(): void
    {
        [$first, $second] = Course::factory()->published()->count(2)->create();

        $id = $this->postJson('/api/admin/paths', ['title' => 'Lập trình web', 'description' => null, 'course_ids' => [$second->id, $first->id]])
            ->assertCreated()
            ->assertJsonPath('slug', 'lap-trinh-web')
            ->assertJsonPath('courses.0.id', $second->id)
            ->json('id');

        $this->putJson("/api/admin/paths/{$id}", ['title' => 'Lập trình web', 'course_ids' => [$first->id]])->assertOk()->assertJsonCount(1, 'courses');
        $this->getJson('/api/learning-paths')->assertJsonPath('0.courses.0.id', $first->id);

        $this->deleteJson("/api/admin/paths/{$id}")->assertNoContent();
        $this->assertSame(0, LearningPath::count());
    }

    public function test_hoc_vien_khong_vao_duoc_trang_quan_tri(): void
    {
        $this->actingAs(User::factory()->create());
        $this->getJson('/api/admin/rewards')->assertForbidden();
        $this->getJson('/api/admin/stats')->assertForbidden();
        $this->postJson('/api/admin/paths', ['title' => 'x', 'course_ids' => []])->assertForbidden();
    }
}
