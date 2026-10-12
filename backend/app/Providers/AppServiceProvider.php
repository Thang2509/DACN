<?php

namespace App\Providers;

use App\Models\Course;
use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        $this->definePermissions();
        $this->pointEmailLinksToFrontend();

        Password::defaults(fn () => Password::min(8)->letters()->numbers());
    }

    // Phân quyền dùng trong route (middleware can:...) và controller (Gate::authorize)
    private function definePermissions(): void
    {
        Gate::define('admin', fn (User $user) => $user->isAdmin());
        Gate::define('teach', fn (User $user) => $user->isInstructor());
        Gate::define('manage-course', fn (User $user, Course $course) => $user->isAdmin() || $course->instructor_id === $user->id);
    }

    // Link trong email mở trang React; React gọi lại API với đúng đường dẫn đã ký
    private function pointEmailLinksToFrontend(): void
    {
        $frontend = config('app.frontend_url');

        VerifyEmail::createUrlUsing(function (User $user) use ($frontend) {
            $path = URL::temporarySignedRoute(
                'verification.verify',
                now()->addHour(),
                ['id' => $user->id, 'hash' => sha1($user->getEmailForVerification())],
                absolute: false,
            );

            // "/api/email/verify/1/abc?expires=..." → "{frontend}/email/verify/1/abc?expires=..."
            return $frontend.Str::after($path, '/api');
        });

        ResetPassword::createUrlUsing(
            fn (User $user, string $token) => $frontend.'/reset-password?token='.$token.'&email='.urlencode($user->email)
        );
    }
}
