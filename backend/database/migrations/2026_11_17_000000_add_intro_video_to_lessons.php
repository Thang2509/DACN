<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Video mở đầu của bài học (link YouTube hoặc tệp MP4), hiện ngay dưới tiêu đề
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lessons', function (Blueprint $table) {
            $table->string('intro_video_url', 500)->nullable()->after('summary');
        });
    }

    public function down(): void
    {
        Schema::table('lessons', fn (Blueprint $table) => $table->dropColumn('intro_video_url'));
    }
};
