<?php

namespace Database\Seeders;

use App\Models\User;
use App\Services\RewardService;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    // Tài khoản demo, mật khẩu đều là "password"
    public function run(): void
    {
        User::factory()->admin()->create(['name' => 'Quản trị viên', 'email' => 'admin@eduquest.test']);
        $instructor = User::factory()->instructor()->create(['name' => 'Giảng viên Demo', 'email' => 'giangvien@eduquest.test']);
        $student = User::factory()->create(['name' => 'Học viên Demo', 'email' => 'hocvien@eduquest.test']);

        $this->callWith(DemoCourseSeeder::class, ['instructor' => $instructor]);
        $this->call([GamificationSeeder::class, ShopSeeder::class]);

        // Xu khởi đầu để demo cửa hàng, voucher, mua trứng (ghi qua sổ cái như mọi lần thưởng)
        app(RewardService::class)->grant($student, "demo_bonus:{$student->id}", 'demo_bonus', 0, 1500);

        $this->call(DemoActivitySeeder::class);
        $this->callWith(ContentSeeder::class, ['instructor' => $instructor]);
    }
}
