<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

// Bộ thú mới: giữ Shiba, Corgi, Mèo mướp, Mèo Ba Tư; Labrador → Thỏ, Husky → Capybara, Poodle → Hamster
// (giữ id nên thú học viên đã nhận vẫn dùng được, kèm tên, giai đoạn, XP, trang bị), thêm Nhím
return new class extends Migration
{
    // Mã cũ => [mã mới, tên, mô tả, màu trứng, loài khởi đầu, tên cũ]
    private const RENAME = [
        'labrador' => ['rabbit', 'Thỏ', 'Hiền lành, tai dài, mũi lúc nào cũng khụt khịt.', '#e8d9c5', true, 'Labrador'],
        'husky' => ['capybara', 'Capybara', 'Điềm tĩnh nhất vùng, thân thiện với mọi loài.', '#b98a5e', false, 'Husky'],
        'poodle' => ['hamster', 'Hamster', 'Má phúng phính, mê chạy vòng và giấu đồ ăn.', '#f2c58a', false, 'Poodle'],
    ];

    private const HEDGEHOG = ['code' => 'hedgehog', 'name' => 'Nhím', 'description' => 'Lưng đầy gai nhưng bụng mềm, rất hiền.', 'egg_color' => '#9c7b5b'];

    public function up(): void
    {
        foreach (self::RENAME as $old => [$code, $name, $description, $eggColor, $starter, $oldName]) {
            $id = DB::table('pet_species')->where('code', $old)->value('id');
            if (! $id) {
                continue;
            }
            DB::table('pet_species')->where('id', $id)->update([
                'code' => $code, 'name' => $name, 'description' => $description, 'egg_color' => $eggColor, 'is_starter' => $starter,
            ]);
            // Thú chưa được đổi tên (vẫn mang tên loài cũ) thì gọi theo tên loài mới
            DB::table('user_pets')->where('pet_species_id', $id)->where('nickname', $oldName)->update(['nickname' => $name]);
        }
        // CSDL đang dùng (đã có loài) thì thêm Nhím; CSDL mới tạo thì để seeder thêm cả bộ
        if (DB::table('pet_species')->exists() && DB::table('pet_species')->where('code', 'hedgehog')->doesntExist()) {
            DB::table('pet_species')->insert([...self::HEDGEHOG, 'is_starter' => false, 'created_at' => now(), 'updated_at' => now()]);
        }
    }

    public function down(): void
    {
        $hedgehog = DB::table('pet_species')->where('code', 'hedgehog')->value('id');
        if ($hedgehog) {
            DB::table('user_pets')->where('pet_species_id', $hedgehog)->delete();
            DB::table('pet_species')->where('id', $hedgehog)->delete();
        }
        foreach (self::RENAME as $old => [$code, $name, , , , $oldName]) {
            $id = DB::table('pet_species')->where('code', $code)->value('id');
            if ($id) {
                DB::table('pet_species')->where('id', $id)->update(['code' => $old, 'name' => $oldName, 'is_starter' => $old === 'labrador']);
                DB::table('user_pets')->where('pet_species_id', $id)->where('nickname', $name)->update(['nickname' => $oldName]);
            }
        }
    }
};
