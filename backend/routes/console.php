<?php

use App\Services\PaymentService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Tra cứu MoMo các đơn đang chờ, đóng đơn quá hạn để trả voucher (khi deploy chạy "php artisan schedule:work")
Schedule::call(fn () => app(PaymentService::class)->syncPending())->everyFiveMinutes()->name('momo-sync-pending');
