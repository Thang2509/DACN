<?php

namespace Tests\Feature;

use App\Models\MinigameScore;
use App\Models\PetSpecies;
use App\Models\User;
use App\Models\UserPet;
use App\Services\RewardService;
use Database\Seeders\GamificationSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

// Huy hiệu, bảng xếp hạng, kế hoạch học tập, minigame
class AchievementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(GamificationSeeder::class);
        Carbon::setTestNow('2026-12-09 09:00'); // thứ Tư
    }

    private function species(string $code): int
    {
        return PetSpecies::firstWhere('code', $code)->id;
    }

    private function xp(User $user, int $xp, string $key): void
    {
        app(RewardService::class)->grant($user, $key, 'test', $xp);
    }

    public function test_danh_sach_huy_hieu_kem_tien_do(): void
    {
        $student = User::factory()->create();
        UserPet::create(['user_id' => $student->id, 'pet_species_id' => $this->species('shiba'), 'nickname' => 'Shiba', 'stats_updated_at' => now()]);
        UserPet::create(['user_id' => $student->id, 'pet_species_id' => $this->species('rabbit'), 'nickname' => 'Thỏ', 'stats_updated_at' => now()]);

        $badges = collect($this->actingAs($student)->getJson('/api/badges')->assertOk()->assertJsonCount(12)->json())->keyBy('code');
        $this->assertSame([2, 3, null], [$badges['collector']['progress'], $badges['collector']['condition_value'], $badges['collector']['earned_at']]);
        $this->assertSame(1, $badges['level_5']['progress']);
    }

    public function test_bang_xep_hang_tuan_va_moi_thoi_gian(): void
    {
        [$an, $binh, $chi] = User::factory()->count(3)->create();

        // Tuần trước Bình nhiều XP nhất; tuần này An và Chi bằng điểm nên đồng hạng
        Carbon::setTestNow('2026-12-02 10:00');
        $this->xp($binh, 500, 'a');
        Carbon::setTestNow('2026-12-09 09:00');
        $this->xp($an, 80, 'b');
        $this->xp($chi, 80, 'c');

        $this->actingAs($binh);
        $this->getJson('/api/leaderboard')
            ->assertOk()
            ->assertJsonPath('from', '2026-12-07')
            ->assertJsonPath('top.0.rank', 1)
            ->assertJsonPath('top.1.rank', 1)
            ->assertJsonCount(2, 'top')
            ->assertJsonPath('me', null);
        $this->getJson('/api/leaderboard?period=last_week')->assertJsonPath('top.0.name', $binh->name)->assertJsonPath('me.rank', 1);
        $this->getJson('/api/leaderboard?period=all')
            ->assertJsonPath('top.0.xp', 500)
            ->assertJsonPath('top.0.level', 3)
            ->assertJsonPath('top.1.rank', 2)
            ->assertJsonPath('top.2.rank', 2);
    }

    public function test_ke_hoach_hoc_tap(): void
    {
        $this->actingAs(User::factory()->create());
        $this->getJson('/api/gamification')->assertJsonPath('plan.has_plan', false);

        $this->putJson('/api/study-plan', ['study_days' => [5, 3, 1, 3], 'lessons_per_day' => 2])
            ->assertOk()
            ->assertJsonPath('study_days', [1, 3, 5])
            ->assertJsonPath('is_study_day', true) // thứ Tư
            ->assertJsonPath('done_today', 0);

        $this->putJson('/api/study-plan', ['study_days' => [8], 'lessons_per_day' => 0])->assertJsonValidationErrors(['study_days.0', 'lessons_per_day']);
    }

    public function test_minigame_bang_diem_va_chan_diem_vo_ly(): void
    {
        $me = User::factory()->create();
        $other = User::factory()->create();
        MinigameScore::create(['user_id' => $other->id, 'game' => 'runner', 'score' => 800, 'duration_seconds' => 90]);
        $this->actingAs($me);

        $this->postJson('/api/minigames/runner/scores', ['score' => 5000, 'duration' => 10])->assertJsonValidationErrors('score');
        $this->postJson('/api/minigames/runner/scores', ['score' => 300, 'duration' => 40])
            ->assertOk()
            ->assertJsonPath('my_best', 300)
            ->assertJsonPath('top.0.score', 800)
            ->assertJsonPath('top.1.is_me', true)
            ->assertJsonPath('rewarded_plays_left', 3);

        $this->getJson('/api/minigames/keywords')->assertOk()->assertJsonPath('my_best', 0);
        $this->getJson('/api/minigames/chess')->assertNotFound();
    }

    public function test_choi_minigame_thu_vui_hon_nhung_met_hon(): void
    {
        $student = User::factory()->create();
        $pet = UserPet::create(['user_id' => $student->id, 'pet_species_id' => $this->species('shiba'), 'nickname' => 'Shiba', 'stage' => 'baby', 'stats_updated_at' => now()]);

        $this->actingAs($student)->postJson('/api/minigames/keywords/scores', ['score' => 120, 'duration' => 60])->assertOk();

        $pet->refresh();
        $this->assertSame([85, 60], [$pet->happiness, $pet->energy]);
    }
}
