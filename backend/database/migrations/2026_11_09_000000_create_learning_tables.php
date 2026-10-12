<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Học tập: đăng ký khóa, tiến độ bài, lượt làm quiz, ghi chú
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('order_id')->nullable(); // đơn MoMo, thêm khóa ngoại ở Đợt 3
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'course_id']);
        });

        Schema::create('lesson_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('lesson_id')->constrained()->cascadeOnDelete();
            $table->timestamp('completed_at');
            $table->timestamps();

            $table->unique(['user_id', 'lesson_id']);
        });

        Schema::create('quiz_attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('lesson_block_id')->constrained()->cascadeOnDelete();
            $table->json('answers');
            $table->unsignedInteger('correct_count');
            $table->timestamps();

            $table->index(['user_id', 'lesson_block_id']);
        });

        Schema::create('notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('lesson_id')->constrained()->cascadeOnDelete();
            $table->foreignId('lesson_block_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedInteger('video_time')->nullable(); // giây
            $table->text('content');
            $table->timestamps();

            $table->index(['user_id', 'lesson_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notes');
        Schema::dropIfExists('quiz_attempts');
        Schema::dropIfExists('lesson_progress');
        Schema::dropIfExists('enrollments');
    }
};
