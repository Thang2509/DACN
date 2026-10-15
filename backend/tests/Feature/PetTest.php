<?php

namespace Tests\Feature;

use App\Models\PetItem;
use App\Models\PetSpecies;
use App\Models\Streak;
use App\Models\User;
use App\Models\UserItem;
use App\Models\UserPet;
use App\Services\GamificationService;
use App\Services\PetService;
use App\Services\RewardService;
use Database\Seeders\GamificationSeeder;
use Database\Seeders\ShopSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class PetTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed([GamificationSeeder::class, ShopSeeder::class]);
        Carbon::setTestNow('2026-11-16 09:00');
    }

    // Nhận trứng: trứng nở ngay thành thú mới nở
    private function hatchedPet(User $user): UserPet
    {
        $this->actingAs($user)->postJson('/api/pets', ['species' => 'rabbit'])->assertCreated();

        return UserPet::firstWhere('user_id', $user->id);
    }

    private function later(string $time): void
    {
        Carbon::setTestNow(Carbon::parse("2026-11-16 $time"));
    }

    public function test_chon_trung_dau_tien_chi_mot_lan(): void
    {
        $this->actingAs(User::factory()->create());

        // Husky chỉ bán ở cửa hàng, không phải trứng khởi đầu
        $this->postJson('/api/pets', ['species' => 'capybara'])->assertJsonValidationErrors('species');
        $this->postJson('/api/pets', ['species' => 'rabbit'])
            ->assertCreated()
            ->assertJsonPath('stage', 'hatchling') // trứng nở ngay, không cần ấp
            ->assertJsonPath('mood', 'happy')
            ->assertJsonPath('fullness', 70)
            ->assertJsonPath('species.code', 'rabbit')
            ->assertJsonPath('next_stage_xp', 300);

        $this->postJson('/api/pets', ['species' => 'tabby'])->assertJsonValidationErrors('species');
        $this->postJson('/api/pets', ['species' => 'rong'])->assertJsonValidationErrors('species');

        $this->getJson('/api/pets')->assertOk()->assertJsonCount(8, 'species')->assertJsonCount(1, 'pets');
    }

    public function test_chi_so_giam_theo_gio_tron(): void
    {
        $this->hatchedPet(User::factory()->create());

        // 3 giờ 30 phút: chỉ tính 3 giờ, phần lẻ để lần sau
        $this->later('12:30');
        $this->getJson('/api/pets')
            ->assertJsonPath('pets.0.fullness', 61)
            ->assertJsonPath('pets.0.happiness', 64)
            ->assertJsonPath('pets.0.energy', 67);

        $this->later('13:00');
        $this->getJson('/api/pets')->assertJsonPath('pets.0.fullness', 58);

        // Bỏ đói lâu ngày: chỉ số không âm và thú buồn
        Carbon::setTestNow('2026-11-18 13:00');
        $this->getJson('/api/pets')->assertJsonPath('pets.0.fullness', 0)->assertJsonPath('pets.0.mood', 'sad');
    }

    public function test_ngu_hoi_nang_luong(): void
    {
        $pet = $this->hatchedPet(User::factory()->create());
        $pet->update(['energy' => 30]);

        $this->postJson("/api/pets/{$pet->id}/sleep")->assertOk()->assertJsonPath('is_sleeping', true)->assertJsonPath('mood', 'sleep');

        $this->later('11:00');
        $this->getJson('/api/pets')->assertJsonPath('pets.0.energy', 70);

        $this->postJson("/api/pets/{$pet->id}/sleep")->assertJsonPath('is_sleeping', false);
    }

    public function test_hoc_lam_thu_no_vui_va_lon_len(): void
    {
        $student = User::factory()->create();
        $pet = $this->hatchedPet($student);
        $rewards = app(RewardService::class);
        app(PetService::class)->care($student, fullness: 15, happiness: 10);

        // Thú nhận 50% XP: 600 XP → thú có 300 → con non
        $rewards->grant($student, 'test:1', 'test', 600);
        $pet->refresh();
        $this->assertSame([85, 80], [$pet->fullness, $pet->happiness]);
        $this->assertSame([300, 'baby'], [$pet->growth_xp, $pet->stage]);
        $this->getJson('/api/pets')->assertJsonPath('pets.0.mood', 'happy');
    }

    public function test_tien_hoa_can_chuoi_7_ngay(): void
    {
        $this->assertSame('hatchling', PetService::stageFor(0, 0));
        $this->assertSame('hatchling', PetService::stageFor(299, 0));
        $this->assertSame('baby', PetService::stageFor(300, 0));
        $this->assertSame('adult', PetService::stageFor(3000, 6));
        $this->assertSame('evolved', PetService::stageFor(3000, 7));

        $student = User::factory()->create();
        $pet = $this->hatchedPet($student);
        $pet->update(['stage' => 'adult', 'growth_xp' => 2990]);
        $grow = fn () => app(PetService::class)->grow($student, 20);

        $grow();
        $this->assertSame('adult', $pet->refresh()->stage);

        // Hôm nay học tiếp, chuỗi lên 7 ngày thì tiến hóa ngay
        Streak::forceCreate(['user_id' => $student->id, 'current_days' => 6, 'longest_days' => 6, 'last_active_on' => today()->subDay(), 'started_on' => today()->subDays(6)]);
        app(GamificationService::class)->recordStudyDay($student);
        $this->assertSame('evolved', $pet->refresh()->stage);
    }

    public function test_doi_ten_va_khong_dong_vao_thu_nguoi_khac(): void
    {
        $pet = $this->hatchedPet(User::factory()->create());
        $this->putJson("/api/pets/{$pet->id}", ['nickname' => 'Bé Cam'])->assertOk()->assertJsonPath('nickname', 'Bé Cam');

        $this->actingAs(User::factory()->create());
        $this->putJson("/api/pets/{$pet->id}", ['nickname' => 'Trộm'])->assertForbidden();
        $this->postJson("/api/pets/{$pet->id}/sleep")->assertForbidden();
    }

    private function capybaraId(): int
    {
        return PetSpecies::firstWhere('code', 'capybara')->id;
    }

    private function give(User $user, string $code, int $quantity = 1): PetItem
    {
        $item = PetItem::firstWhere('code', $code);
        UserItem::create(['user_id' => $user->id, 'pet_item_id' => $item->id, 'quantity' => $quantity]);

        return $item;
    }

    public function test_cho_an_tang_day_bung_va_tru_tui_do(): void
    {
        $student = User::factory()->create();
        $pet = $this->hatchedPet($student);
        $fish = $this->give($student, 'fish');

        $this->postJson("/api/pets/{$pet->id}/feed", ['item_id' => $fish->id])
            ->assertOk()
            ->assertJsonPath('fullness', 95)
            ->assertJsonPath('happiness', 75);
        $this->assertDatabaseHas('user_items', ['pet_item_id' => $fish->id, 'quantity' => 0]);

        $this->postJson("/api/pets/{$pet->id}/feed", ['item_id' => $fish->id])->assertJsonValidationErrors('item');
        $hat = $this->give($student, 'party_hat');
        $this->postJson("/api/pets/{$pet->id}/feed", ['item_id' => $hat->id])->assertJsonValidationErrors('item');
    }

    public function test_deo_trang_bi_va_chuyen_sang_thu_khac(): void
    {
        $student = User::factory()->create();
        $rabbit = $this->hatchedPet($student);
        $hat = $this->give($student, 'party_hat');
        $this->postJson("/api/pets/{$rabbit->id}/equip", ['item_id' => $this->give($student, 'crown')->id])->assertOk();

        // Mũ tiệc thay vương miện vì cùng chỗ gắn trên đầu
        $this->postJson("/api/pets/{$rabbit->id}/equip", ['item_id' => $hat->id])
            ->assertOk()
            ->assertJsonCount(1, 'equipment')
            ->assertJsonPath('equipment.0.slot', 'head')
            ->assertJsonPath('equipment.0.code', 'party_hat');

        // Đeo cho thú khác thì thú cũ không còn món đó
        $capybara = UserPet::create(['user_id' => $student->id, 'pet_species_id' => $this->capybaraId(), 'nickname' => 'Capybara', 'stage' => 'baby', 'is_active' => false, 'stats_updated_at' => now()]);
        $this->postJson("/api/pets/{$capybara->id}/equip", ['item_id' => $hat->id])->assertOk()->assertJsonPath('equipment.0.code', 'party_hat');
        $this->getJson('/api/pets')->assertJsonPath('pets.0.equipment', []);

        $this->deleteJson("/api/pets/{$capybara->id}/equip/head")->assertOk()->assertJsonPath('equipment', []);
        $this->postJson("/api/pets/{$rabbit->id}/equip", ['item_id' => $this->give($student, 'cake')->id])->assertJsonValidationErrors('item');
    }

    public function test_chon_thu_dong_hanh(): void
    {
        $student = User::factory()->create();
        $rabbit = $this->hatchedPet($student);
        $capybara = UserPet::create(['user_id' => $student->id, 'pet_species_id' => $this->capybaraId(), 'nickname' => 'Capybara', 'is_active' => false, 'stats_updated_at' => now()]);

        $this->postJson("/api/pets/{$capybara->id}/activate")->assertOk()->assertJsonPath('is_active', true);
        $this->assertFalse($rabbit->refresh()->is_active);

        // XP học chỉ đổ vào thú đồng hành
        app(RewardService::class)->grant($student, 'test:xp', 'test', 40);
        $this->assertSame([20, 0], [$capybara->refresh()->growth_xp, $rabbit->refresh()->growth_xp]);
    }
}
