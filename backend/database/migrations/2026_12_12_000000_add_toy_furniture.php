<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

// Đồ chơi mới cho phòng thú cưng: trụ cào móng (mèo), bánh xe chạy (thú nhỏ), ống chui
return new class extends Migration
{
    private const ITEMS = [
        ['scratching_post', 'Trụ cào móng', 90, 1, 1],
        ['hamster_wheel', 'Bánh xe chạy', 120, 1, 1],
        ['pet_tunnel', 'Ống chui', 100, 2, 1],
    ];

    public function up(): void
    {
        // CSDL mới tạo thì để ShopSeeder thêm cả bộ; CSDL đang dùng (đã có đồ) thì thêm các món còn thiếu
        if (DB::table('pet_items')->doesntExist()) {
            return;
        }
        foreach (self::ITEMS as [$code, $name, $price, $sizeX, $sizeZ]) {
            if (DB::table('pet_items')->where('code', $code)->doesntExist()) {
                DB::table('pet_items')->insert([
                    'code' => $code, 'name' => $name, 'type' => 'furniture', 'price' => $price,
                    'size_x' => $sizeX, 'size_z' => $sizeZ, 'created_at' => now(), 'updated_at' => now(),
                ]);
            }
        }
    }

    public function down(): void
    {
        DB::table('pet_items')->whereIn('code', array_column(self::ITEMS, 0))->delete();
    }
};
