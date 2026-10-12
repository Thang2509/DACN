<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_cap_nhat_ho_so(): void
    {
        $this->actingAs(User::factory()->create())
            ->putJson('/api/profile', ['name' => 'Tên mới', 'bio' => 'Thích SQL'])
            ->assertOk()
            ->assertJsonPath('name', 'Tên mới')
            ->assertJsonPath('bio', 'Thích SQL');
    }

    public function test_tai_anh_dai_dien_thay_anh_cu(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();
        $this->actingAs($user);

        $this->post('/api/profile/avatar', ['avatar' => UploadedFile::fake()->image('a.jpg')], ['Accept' => 'application/json'])->assertOk();
        $oldPath = $user->fresh()->avatar_path;
        $this->post('/api/profile/avatar', ['avatar' => UploadedFile::fake()->image('b.jpg')], ['Accept' => 'application/json'])
            ->assertOk()
            ->assertJsonPath('avatar_url', fn ($url) => str_contains($url, '/storage/avatars/'));

        Storage::disk('public')->assertMissing($oldPath);
        Storage::disk('public')->assertExists($user->fresh()->avatar_path);
    }

    public function test_doi_mat_khau_can_mat_khau_hien_tai(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        $newPassword = ['password' => 'matkhau789', 'password_confirmation' => 'matkhau789'];

        $this->putJson('/api/profile/password', ['current_password' => 'sai'] + $newPassword)
            ->assertJsonValidationErrors('current_password');
        $this->putJson('/api/profile/password', ['current_password' => 'password'] + $newPassword)->assertOk();

        $this->assertTrue(Hash::check('matkhau789', $user->fresh()->password));
    }
}
