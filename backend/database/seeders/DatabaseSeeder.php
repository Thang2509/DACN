<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    // Tài khoản demo, mật khẩu đều là "password"
    public function run(): void
    {
        User::factory()->admin()->create(['name' => 'Quản trị viên', 'email' => 'admin@eduquest.test']);
        $instructor = User::factory()->instructor()->create(['name' => 'Giảng viên Demo', 'email' => 'giangvien@eduquest.test']);
        User::factory()->create(['name' => 'Học viên Demo', 'email' => 'hocvien@eduquest.test']);

        $this->callWith(DemoCourseSeeder::class, ['instructor' => $instructor]);
    }
}
