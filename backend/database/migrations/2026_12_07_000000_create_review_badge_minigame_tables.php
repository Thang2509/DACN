<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Giai đoạn 7–20/12: ôn flashcard (SM-2), kế hoạch học tập, huy hiệu, điểm minigame
return new class extends Migration
{
    public function up(): void
    {
        // Mỗi thẻ của mỗi người một dòng: lịch ôn theo thuật toán SM-2
        Schema::create('flashcard_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('lesson_block_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('card_index');
            $table->decimal('easiness', 4, 2)->default(2.5);
            $table->unsignedSmallInteger('interval_days')->default(0);
            $table->unsignedSmallInteger('repetitions')->default(0); // số lần nhớ liên tiếp
            $table->unsignedInteger('review_count')->default(0); // tổng số lần đã ôn
            $table->date('due_on');
            $table->timestamp('last_reviewed_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'lesson_block_id', 'card_index']);
            $table->index(['user_id', 'due_on']);
        });

        Schema::create('study_plans', function (Blueprint $table) {
            $table->foreignId('user_id')->primary()->constrained()->cascadeOnDelete();
            $table->json('study_days'); // thứ trong tuần theo ISO: 1 = thứ Hai … 7 = Chủ nhật
            $table->unsignedTinyInteger('lessons_per_day')->default(1);
            $table->timestamps();
        });

        Schema::create('badges', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique();
            $table->string('name');
            $table->string('description');
            $table->string('icon', 16); // emoji
            $table->string('condition_type', 40); // xem BadgeService::CONDITIONS
            $table->unsignedInteger('condition_value');
            $table->unsignedInteger('reward_coins')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('user_badges', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('badge_id')->constrained()->cascadeOnDelete();
            $table->timestamp('earned_at');

            $table->unique(['user_id', 'badge_id']);
        });

        Schema::create('minigame_scores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('game', 30);
            $table->unsignedInteger('score');
            $table->unsignedSmallInteger('duration_seconds');
            $table->timestamp('created_at')->useCurrent();

            $table->index(['game', 'score']);
            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('minigame_scores');
        Schema::dropIfExists('user_badges');
        Schema::dropIfExists('badges');
        Schema::dropIfExists('study_plans');
        Schema::dropIfExists('flashcard_reviews');
    }
};
