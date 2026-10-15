<?php

namespace Tests\Feature;

use App\Models\PetItem;
use App\Models\User;
use App\Models\UserItem;
use Database\Seeders\ShopSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoomTest extends TestCase
{
    use RefreshDatabase;

    private array $ids;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(ShopSeeder::class);
        $this->ids = PetItem::pluck('id', 'code')->all();

        // Túi đồ: 1 sofa, 1 thảm tròn, 2 chậu cây nhỏ, 1 bánh quy
        $user = User::factory()->create();
        foreach (['sofa' => 1, 'rug_round' => 1, 'plant_small' => 2, 'cookie' => 1] as $code => $quantity) {
            UserItem::create(['user_id' => $user->id, 'pet_item_id' => $this->ids[$code], 'quantity' => $quantity]);
        }
        $this->actingAs($user);
    }

    private function place(string $code, int $x, int $z, int $rotation = 0): array
    {
        return ['pet_item_id' => $this->ids[$code], 'x' => $x, 'z' => $z, 'rotation' => $rotation];
    }

    private function save(array $items)
    {
        return $this->putJson('/api/room', ['items' => $items]);
    }

    public function test_xem_phong_va_noi_that_dang_co(): void
    {
        $this->getJson('/api/room')
            ->assertOk()
            ->assertJsonPath('grid', 8)
            ->assertJsonCount(0, 'items')
            ->assertJsonCount(3, 'furniture'); // bánh quy không phải nội thất
    }

    public function test_luu_bo_cuc_hop_le_do_dat_len_tham_duoc(): void
    {
        $this->save([
            $this->place('rug_round', 0, 0),
            $this->place('sofa', 0, 0),
            $this->place('plant_small', 7, 7),
            $this->place('plant_small', 6, 7),
        ])->assertOk()->assertJsonCount(4, 'items');

        // Lưu lại thay toàn bộ bố cục cũ
        $this->save([$this->place('sofa', 7, 0, 1)])->assertOk()->assertJsonCount(1, 'items');
        $this->assertDatabaseCount('room_items', 1);
    }

    public function test_tu_choi_bo_cuc_sai(): void
    {
        // Chồng lên nhau
        $this->save([$this->place('plant_small', 3, 3), $this->place('plant_small', 3, 3)])->assertJsonValidationErrors('items.1');
        // Sofa 2 ô đặt ở cột cuối thì tràn ra ngoài
        $this->save([$this->place('sofa', 7, 0)])->assertJsonValidationErrors('items.0');
        // Đặt nhiều hơn số đang có
        $this->save([$this->place('plant_small', 0, 0), $this->place('plant_small', 1, 0), $this->place('plant_small', 2, 0)])->assertJsonValidationErrors('items.2');
        // Không phải nội thất, vị trí ngoài lưới
        $this->save([$this->place('cookie', 0, 0)])->assertJsonValidationErrors('items.0');
        $this->save([$this->place('plant_small', 8, 0)])->assertJsonValidationErrors('items.0.x');

        $this->assertDatabaseCount('room_items', 0);
    }
}
