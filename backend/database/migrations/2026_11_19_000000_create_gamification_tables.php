<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Trò chơi hóa: ví, sổ cái điểm, chuỗi ngày, nhiệm vụ; thú cưng và vòng đời
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wallets', function (Blueprint $table) {
            $table->foreignId('user_id')->primary()->constrained()->cascadeOnDelete();
            $table->unsignedInteger('xp')->default(0);
            $table->unsignedInteger('level')->default(1);
            $table->unsignedInteger('coins')->default(0);
            $table->timestamps();
        });

        // Chỉ thêm, không sửa: mỗi lần thưởng/tiêu là một dòng, khóa duy nhất chống cộng trùng
        Schema::create('point_ledger', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('reason', 50);
            $table->string('idempotency_key')->unique();
            $table->integer('xp')->default(0);
            $table->integer('coins')->default(0); // âm khi tiêu xu
            $table->json('meta')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['user_id', 'id']);
        });

        Schema::create('streaks', function (Blueprint $table) {
            $table->foreignId('user_id')->primary()->constrained()->cascadeOnDelete();
            $table->unsignedInteger('current_days')->default(0);
            $table->unsignedInteger('longest_days')->default(0);
            $table->date('last_active_on')->nullable();
            $table->date('started_on')->nullable();
            $table->timestamps();
        });

        Schema::create('quests', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique();
            $table->string('title');
            $table->enum('period', ['daily', 'weekly']);
            $table->string('target_type', 30); // lessons_completed | quiz_correct | study_days | flashcards_reviewed
            $table->unsignedInteger('target_value');
            $table->unsignedInteger('reward_xp')->default(0);
            $table->unsignedInteger('reward_coins')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('user_quests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('quest_id')->constrained()->cascadeOnDelete();
            $table->date('period_start'); // ngày (nhiệm vụ ngày) hoặc thứ Hai đầu tuần (nhiệm vụ tuần)
            $table->unsignedInteger('progress')->default(0);
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'quest_id', 'period_start']);
        });

        Schema::create('pet_species', function (Blueprint $table) {
            $table->id();
            $table->string('code', 30)->unique();
            $table->string('name');
            $table->string('description')->nullable();
            $table->string('model_path');
            $table->string('egg_color', 7); // màu quả trứng low-poly
            $table->unsignedInteger('egg_price')->default(500); // xu, mua thêm trứng cho bộ sưu tập
            $table->boolean('is_starter')->default(false); // được chọn làm trứng đầu tiên miễn phí
            $table->timestamps();
        });

        Schema::create('user_pets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('pet_species_id')->constrained();
            $table->string('nickname', 50);
            $table->enum('stage', ['egg', 'hatchling', 'baby', 'adult', 'evolved'])->default('egg');
            $table->unsignedInteger('growth_xp')->default(0);
            $table->unsignedTinyInteger('fullness')->default(70);
            $table->unsignedTinyInteger('happiness')->default(70);
            $table->unsignedTinyInteger('energy')->default(70);
            $table->boolean('is_sleeping')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamp('stats_updated_at')->useCurrent(); // mốc tính chỉ số giảm dần theo giờ
            $table->timestamps();

            $table->unique(['user_id', 'pet_species_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_pets');
        Schema::dropIfExists('pet_species');
        Schema::dropIfExists('user_quests');
        Schema::dropIfExists('quests');
        Schema::dropIfExists('streaks');
        Schema::dropIfExists('point_ledger');
        Schema::dropIfExists('wallets');
    }
};
