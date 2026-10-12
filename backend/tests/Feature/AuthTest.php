<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_dang_ky_tao_hoc_vien_va_gui_email_xac_thuc(): void
    {
        Notification::fake();

        $this->postJson('/api/register', [
            'name' => 'Nguyễn An',
            'email' => 'an@test.vn',
            'password' => 'matkhau123',
            'password_confirmation' => 'matkhau123',
        ])->assertCreated()->assertJsonPath('role', 'student');

        $user = User::firstWhere('email', 'an@test.vn');
        $this->assertAuthenticatedAs($user);
        Notification::assertSentTo($user, VerifyEmail::class);
    }

    public function test_mat_khau_phai_co_chu_va_so(): void
    {
        $this->postJson('/api/register', [
            'name' => 'An',
            'email' => 'an@test.vn',
            'password' => 'chicochu',
            'password_confirmation' => 'chicochu',
        ])->assertJsonValidationErrors('password');
    }

    public function test_dang_nhap_sai_roi_dung(): void
    {
        $user = User::factory()->create();

        $this->postJson('/api/login', ['email' => $user->email, 'password' => 'sai'])
            ->assertJsonValidationErrors('email');
        $this->assertGuest();

        $this->postJson('/api/login', ['email' => $user->email, 'password' => 'password'])
            ->assertOk()
            ->assertJsonPath('email', $user->email);
        $this->assertAuthenticatedAs($user);
    }

    public function test_dang_xuat(): void
    {
        $this->actingAs(User::factory()->create())->postJson('/api/logout')->assertNoContent();
        $this->assertGuest('web');
    }

    public function test_api_me_can_dang_nhap(): void
    {
        $this->getJson('/api/me')->assertUnauthorized();
    }

    public function test_xac_thuc_email_bang_link_trong_email(): void
    {
        Notification::fake();
        $user = User::factory()->unverified()->create();
        $user->sendEmailVerificationNotification();

        $link = null;
        Notification::assertSentTo($user, VerifyEmail::class, function (VerifyEmail $mail) use ($user, &$link) {
            $link = $mail->toMail($user)->actionUrl;

            return true;
        });
        $frontend = config('app.frontend_url');
        $this->assertStringStartsWith($frontend.'/email/verify/', $link);

        // Trang React gọi lại API với đúng đường dẫn đã ký
        $this->getJson('/api'.Str::after($link, $frontend))->assertOk();
        $this->assertTrue($user->fresh()->hasVerifiedEmail());
    }

    public function test_link_xac_thuc_bi_sua_thi_bi_tu_choi(): void
    {
        $user = User::factory()->unverified()->create();

        $this->getJson("/api/email/verify/{$user->id}/".sha1($user->email).'?expires=9999999999&signature=gia-mao')
            ->assertForbidden();
        $this->assertFalse($user->fresh()->hasVerifiedEmail());
    }

    public function test_quen_va_dat_lai_mat_khau(): void
    {
        Notification::fake();
        $user = User::factory()->create();

        $this->postJson('/api/forgot-password', ['email' => $user->email])->assertOk();

        $token = null;
        Notification::assertSentTo($user, ResetPassword::class, function (ResetPassword $mail) use (&$token) {
            $token = $mail->token;

            return true;
        });

        $this->postJson('/api/reset-password', [
            'token' => $token,
            'email' => $user->email,
            'password' => 'matkhau456',
            'password_confirmation' => 'matkhau456',
        ])->assertOk();
        $this->assertTrue(Hash::check('matkhau456', $user->fresh()->password));
    }

    public function test_quen_mat_khau_khong_lo_email_chua_dang_ky(): void
    {
        $this->postJson('/api/forgot-password', ['email' => 'khongco@test.vn'])->assertOk();
    }
}
