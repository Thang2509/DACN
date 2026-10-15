<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// Đơn MoMo có hạn 100 phút (bằng link MoMo), giữ link để thanh toán tiếp, ghi lý do khi không thành công
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('pay_url', 1000)->nullable()->after('momo_trans_id');
            $table->string('failure_reason')->nullable()->after('pay_url');
            $table->timestamp('expires_at')->nullable()->after('paid_at');
        });
        DB::table('orders')->where('status', 'pending')->update(['expires_at' => DB::raw('DATE_ADD(created_at, INTERVAL 100 MINUTE)')]);
    }

    public function down(): void
    {
        Schema::table('orders', fn (Blueprint $table) => $table->dropColumn(['pay_url', 'failure_reason', 'expires_at']));
    }
};
