<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Đợt 3: đổi xu lấy voucher, mua khóa học qua MoMo; vật phẩm thú cưng, trang bị, phòng
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vouchers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->unsignedTinyInteger('discount_percent');
            $table->unsignedInteger('max_discount'); // đồng
            $table->unsignedInteger('coin_cost');
            $table->unsignedSmallInteger('valid_days');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('user_vouchers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('voucher_id')->constrained()->cascadeOnDelete();
            $table->string('code', 20)->unique();
            $table->date('expires_on');
            $table->timestamp('used_at')->nullable(); // chỉ đánh dấu khi đơn đã thanh toán
            $table->timestamps();
        });

        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_voucher_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedInteger('original_price');
            $table->unsignedInteger('discount')->default(0);
            $table->unsignedInteger('amount');
            $table->enum('status', ['pending', 'paid', 'failed'])->default('pending');
            $table->string('momo_order_id', 50)->unique(); // MoMo gọi IPN nhiều lần: xử lý theo mã này
            $table->string('momo_trans_id')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });

        Schema::table('enrollments', function (Blueprint $table) {
            $table->foreign('order_id')->references('id')->on('orders')->nullOnDelete();
        });

        Schema::create('pet_items', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique();
            $table->string('name');
            $table->enum('type', ['food', 'accessory', 'furniture']);
            $table->enum('bone_slot', ['head', 'neck', 'back'])->nullable(); // chỗ gắn trang bị
            $table->string('model_path')->nullable(); // null: mô hình dựng bằng code ở frontend
            $table->unsignedInteger('price');
            $table->json('effect')->nullable(); // thức ăn: {"fullness": 20}
            $table->unsignedTinyInteger('size_x')->default(1); // số ô nội thất chiếm trên sàn phòng
            $table->unsignedTinyInteger('size_z')->default(1);
            $table->timestamps();
        });

        Schema::create('user_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('pet_item_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('quantity')->default(0);
            $table->timestamps();

            $table->unique(['user_id', 'pet_item_id']);
        });

        Schema::create('pet_equipment', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_pet_id')->constrained()->cascadeOnDelete();
            $table->enum('slot', ['head', 'neck', 'back']);
            $table->foreignId('pet_item_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['user_pet_id', 'slot']);
        });

        // Ô lưới trên sàn phòng (x, z tính từ góc trong), rotation: số lần xoay 90°
        Schema::create('room_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('pet_item_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('x');
            $table->unsignedTinyInteger('z');
            $table->unsignedTinyInteger('rotation')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('room_items');
        Schema::dropIfExists('pet_equipment');
        Schema::dropIfExists('user_items');
        Schema::dropIfExists('pet_items');
        Schema::table('enrollments', function (Blueprint $table) {
            $table->dropForeign(['order_id']);
        });
        Schema::dropIfExists('orders');
        Schema::dropIfExists('user_vouchers');
        Schema::dropIfExists('vouchers');
    }
};
