<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// Trứng nở ngay khi nhận, không cần ấp: bỏ giai đoạn "egg", thú mới bắt đầu ở "hatchling"
return new class extends Migration
{
    public function up(): void
    {
        DB::table('user_pets')->where('stage', 'egg')->update(['stage' => 'hatchling']);
        Schema::table('user_pets', function (Blueprint $table) {
            $table->enum('stage', ['hatchling', 'baby', 'adult', 'evolved'])->default('hatchling')->change();
        });
    }

    public function down(): void
    {
        Schema::table('user_pets', function (Blueprint $table) {
            $table->enum('stage', ['egg', 'hatchling', 'baby', 'adult', 'evolved'])->default('egg')->change();
        });
    }
};
