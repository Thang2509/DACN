<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Bỏ tính năng ghi chú bài học
return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('notes');
    }

    public function down(): void
    {
        Schema::create('notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('lesson_id')->constrained()->cascadeOnDelete();
            $table->foreignId('lesson_block_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedInteger('video_time')->nullable();
            $table->text('content');
            $table->timestamps();

            $table->index(['user_id', 'lesson_id']);
        });
    }
};
