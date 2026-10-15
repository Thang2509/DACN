<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// Thú cưng và nội thất dựng hoàn toàn bằng code ở frontend: đổi 7 loài sang chó, mèo và bỏ đường dẫn file mô hình
return new class extends Migration
{
    // Mã cũ => [mã mới, tên, mô tả, màu trứng, tên cũ]; giữ nguyên id nên thú học viên đã nhận vẫn dùng được
    private const SPECIES = [
        'shiba' => ['shiba', 'Shiba', 'Lanh lợi, trung thành, cười rất tươi.', '#e9a15b', 'Shiba'],
        'fox' => ['labrador', 'Labrador', 'Hiền lành, thân thiện, mê nhặt bóng.', '#f1d38a', 'Cáo'],
        'alpaca' => ['tabby', 'Mèo mướp', 'Tò mò, nhanh nhẹn, thích rình bắt đồ chơi.', '#c99a64', 'Alpaca'],
        'husky' => ['husky', 'Husky', 'Tinh nghịch, bền bỉ, thích chạy trên tuyết.', '#9fb4c7', 'Husky'],
        'deer' => ['corgi', 'Corgi', 'Chân ngắn, mông tròn, năng lượng vô tận.', '#f0a35e', 'Hươu'],
        'horse' => ['poodle', 'Poodle', 'Thông minh, lông xoăn bồng bềnh.', '#f3e2cc', 'Ngựa'],
        'wolf' => ['persian', 'Mèo Ba Tư', 'Điềm tĩnh, lông dài mượt như mây.', '#efe9e2', 'Sói'],
    ];

    public function up(): void
    {
        foreach (self::SPECIES as $old => [$code, $name, $description, $eggColor, $oldName]) {
            $id = DB::table('pet_species')->where('code', $old)->value('id');
            if (! $id) {
                continue;
            }
            DB::table('pet_species')->where('id', $id)->update([
                'code' => $code, 'name' => $name, 'description' => $description, 'egg_color' => $eggColor,
            ]);
            // Thú chưa được đổi tên (vẫn mang tên loài cũ) thì gọi theo tên loài mới
            DB::table('user_pets')->where('pet_species_id', $id)->where('nickname', $oldName)->update(['nickname' => $name]);
        }
        Schema::table('pet_species', fn (Blueprint $table) => $table->dropColumn('model_path'));
        Schema::table('pet_items', fn (Blueprint $table) => $table->dropColumn('model_path'));
    }

    public function down(): void
    {
        Schema::table('pet_species', fn (Blueprint $table) => $table->string('model_path')->default(''));
        Schema::table('pet_items', fn (Blueprint $table) => $table->string('model_path')->nullable());
        foreach (self::SPECIES as $old => [$code]) {
            DB::table('pet_species')->where('code', $code)->update(['code' => $old, 'model_path' => "/models/{$old}.glb"]);
        }
    }
};
