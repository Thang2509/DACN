<?php

namespace Database\Seeders;

use App\Models\PetItem;
use App\Models\Voucher;
use Illuminate\Database\Seeder;

// Voucher và vật phẩm cửa hàng (giá theo docs/quy-tac-thuong.md mục 4)
class ShopSeeder extends Seeder
{
    public function run(): void
    {
        Voucher::create(['name' => 'Giảm 10% (tối đa 50.000đ)', 'discount_percent' => 10, 'max_discount' => 50000, 'coin_cost' => 200, 'valid_days' => 30]);
        Voucher::create(['name' => 'Giảm 25% (tối đa 150.000đ)', 'discount_percent' => 25, 'max_discount' => 150000, 'coin_cost' => 500, 'valid_days' => 30]);

        // Thức ăn: [mã, tên, giá, đầy bụng]
        foreach ([
            ['cookie', 'Bánh quy', 10, 10],
            ['apple', 'Táo đỏ', 15, 15],
            ['fish', 'Cá nướng', 25, 25],
            ['cake', 'Bánh kem', 30, 30],
        ] as [$code, $name, $price, $fullness]) {
            PetItem::create(['code' => $code, 'name' => $name, 'type' => 'food', 'price' => $price, 'effect' => ['fullness' => $fullness]]);
        }

        // Trang bị dựng bằng code ở frontend, gắn vào xương đầu / cổ / lưng
        foreach ([
            ['flower', 'Hoa cài đầu', 'head', 60],
            ['party_hat', 'Mũ tiệc', 'head', 80],
            ['crown', 'Vương miện', 'head', 250],
            ['scarf', 'Khăn quàng đỏ', 'neck', 70],
            ['bow_tie', 'Nơ cổ', 'neck', 90],
            ['bell_collar', 'Vòng cổ chuông', 'neck', 120],
            ['backpack', 'Ba lô nhỏ', 'back', 150],
            ['wings', 'Đôi cánh thiên thần', 'back', 300],
        ] as [$code, $name, $slot, $price]) {
            PetItem::create(['code' => $code, 'name' => $name, 'type' => 'accessory', 'bone_slot' => $slot, 'price' => $price]);
        }

        // Nội thất dựng bằng code ở frontend (Furniture.jsx): [mã, tên, giá, số ô x, số ô z, thảm nằm sát sàn]
        foreach ([
            ['food_bowl', 'Bát ăn', 50, 1, 1, false],
            ['pet_bed', 'Ổ nằm', 100, 1, 1, false],
            ['rug_round', 'Thảm tròn', 60, 2, 2, true],
            ['rug_rectangle', 'Thảm chữ nhật', 80, 3, 2, true],
            ['plant_small', 'Chậu cây nhỏ', 50, 1, 1, false],
            ['plant_large', 'Chậu cây lớn', 80, 1, 1, false],
            ['cardboard_box', 'Thùng các-tông', 50, 1, 1, false],
            ['teddy_bear', 'Gấu bông', 90, 1, 1, false],
            ['floor_lamp', 'Đèn cây', 100, 1, 1, false],
            ['bookcase', 'Kệ sách thấp', 120, 1, 1, false],
            ['armchair', 'Ghế bành', 120, 1, 1, false],
            ['coffee_table', 'Bàn trà', 150, 2, 1, false],
            ['sofa', 'Ghế sofa', 200, 2, 1, false],
        ] as [$code, $name, $price, $sizeX, $sizeZ, $floor]) {
            PetItem::create([
                'code' => $code, 'name' => $name, 'type' => 'furniture', 'price' => $price,
                'size_x' => $sizeX, 'size_z' => $sizeZ, 'effect' => $floor ? ['floor' => true] : null,
            ]);
        }
    }
}
