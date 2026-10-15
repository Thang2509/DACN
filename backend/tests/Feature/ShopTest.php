<?php

namespace Tests\Feature;

use App\Models\PetItem;
use App\Models\PointLedger;
use App\Models\User;
use App\Models\UserPet;
use App\Models\Voucher;
use App\Models\Wallet;
use App\Services\RewardService;
use Database\Seeders\GamificationSeeder;
use Database\Seeders\ShopSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ShopTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed([GamificationSeeder::class, ShopSeeder::class]);
    }

    private function studentWithCoins(int $coins): User
    {
        $user = User::factory()->create();
        app(RewardService::class)->grant($user, "test:coins:{$user->id}", 'test', 0, $coins);
        $this->actingAs($user);

        return $user;
    }

    private function item(string $code): PetItem
    {
        return PetItem::firstWhere('code', $code);
    }

    public function test_mua_thuc_an_tru_xu_va_ghi_so_cai(): void
    {
        $user = $this->studentWithCoins(100);

        $this->postJson("/api/shop/items/{$this->item('cookie')->id}", ['quantity' => 3])
            ->assertOk()
            ->assertJsonPath('coins', 70);

        $this->assertDatabaseHas('user_items', ['user_id' => $user->id, 'pet_item_id' => $this->item('cookie')->id, 'quantity' => 3]);
        $this->assertSame(-30, PointLedger::firstWhere('reason', 'buy_item')->coins);
        $this->assertSame((int) PointLedger::where('user_id', $user->id)->sum('coins'), Wallet::find($user->id)->coins);
    }

    public function test_khong_du_xu_thi_khong_mua_duoc(): void
    {
        $user = $this->studentWithCoins(5);

        $this->postJson("/api/shop/items/{$this->item('cake')->id}")->assertJsonValidationErrors('coins');

        $this->assertSame(5, Wallet::find($user->id)->coins);
        $this->assertDatabaseMissing('point_ledger', ['reason' => 'buy_item']);
        $this->assertDatabaseCount('user_items', 0);
    }

    public function test_trang_bi_chi_mua_mot_lan(): void
    {
        $this->studentWithCoins(500);
        $hat = $this->item('party_hat');

        $this->postJson("/api/shop/items/{$hat->id}")->assertOk();
        $this->postJson("/api/shop/items/{$hat->id}")->assertJsonValidationErrors('item');
    }

    public function test_mua_trung_loai_moi_cho_bo_suu_tap(): void
    {
        $user = $this->studentWithCoins(1200);

        // Chưa nhận trứng đầu tiên (miễn phí) thì chưa mua được
        $this->postJson('/api/shop/eggs/capybara')->assertJsonValidationErrors('species');

        $this->postJson('/api/pets', ['species' => 'rabbit'])->assertCreated();
        $this->postJson('/api/shop/eggs/capybara')->assertOk()->assertJsonPath('coins', 700);
        $this->postJson('/api/shop/eggs/capybara')->assertJsonValidationErrors('species');
        $this->postJson('/api/shop/eggs/rabbit')->assertJsonValidationErrors('species');

        $capybara = UserPet::where('user_id', $user->id)->latest('id')->first();
        $this->assertSame(['hatchling', false], [$capybara->stage, $capybara->is_active]); // trứng mua về cũng nở ngay
    }

    public function test_doi_xu_lay_voucher(): void
    {
        $user = $this->studentWithCoins(250);
        $voucher = Voucher::firstWhere('coin_cost', 200);

        $this->postJson("/api/shop/vouchers/{$voucher->id}")
            ->assertOk()
            ->assertJsonPath('coins', 50)
            ->assertJsonPath('my_vouchers.0.usable', true)
            ->assertJsonPath('my_vouchers.0.expires_on', today()->addDays(30)->toDateString());

        $this->postJson("/api/shop/vouchers/{$voucher->id}")->assertJsonValidationErrors('coins');
        $this->assertSame(1, PointLedger::where('user_id', $user->id)->where('reason', 'voucher')->count());
    }
}
