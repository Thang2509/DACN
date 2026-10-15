<?php

use App\Http\Controllers\AdminPathController;
use App\Http\Controllers\AdminRewardController;
use App\Http\Controllers\AdminUserController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CatalogController;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\CourseOutlineController;
use App\Http\Controllers\CourseReviewController;
use App\Http\Controllers\GamificationController;
use App\Http\Controllers\LearningController;
use App\Http\Controllers\LessonEditorController;
use App\Http\Controllers\MinigameController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\PetController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\RoomController;
use App\Http\Controllers\ShopController;
use App\Http\Controllers\StatsController;
use App\Http\Controllers\UploadController;
use Illuminate\Support\Facades\Route;

Route::get('/ping', fn () => ['ok' => true, 'app' => config('app.name')]);

// Tài khoản (khách)
Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:6,1');
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:6,1');
Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:6,1');
Route::post('/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:6,1');
Route::get('/email/verify/{id}/{hash}', [AuthController::class, 'verifyEmail'])
    ->middleware(['signed:relative', 'throttle:6,1'])
    ->name('verification.verify');

// Danh mục khóa học và bài học thử (khách xem được)
Route::get('/courses', [CatalogController::class, 'index']);
Route::get('/courses/{course:slug}', [CatalogController::class, 'show']);
Route::get('/learning-paths', [CatalogController::class, 'paths']);
Route::get('/stats/public', [CatalogController::class, 'stats']);
Route::get('/courses/{course:slug}/lessons/{lessonSlug}', [LearningController::class, 'lesson']);

// MoMo gọi về báo kết quả thanh toán (xác thực bằng chữ ký, không cần đăng nhập)
Route::post('/payments/momo/ipn', [PaymentController::class, 'ipn']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);

    // Học tập
    Route::get('/my/courses', [LearningController::class, 'myCourses']);
    Route::post('/courses/{course}/enroll', [LearningController::class, 'enroll'])->middleware('verified');
    Route::post('/lessons/{lesson}/quiz/{block}/answer', [LearningController::class, 'answerQuestion'])->scopeBindings();
    Route::post('/lessons/{lesson}/complete', [LearningController::class, 'complete']);

    // Trò chơi hóa và thú cưng
    Route::get('/gamification', [GamificationController::class, 'show']);
    Route::get('/badges', [GamificationController::class, 'badges']);
    Route::get('/leaderboard', [GamificationController::class, 'leaderboard']);
    Route::put('/study-plan', [GamificationController::class, 'savePlan']);

    // Ôn tập flashcard và minigame
    Route::get('/reviews', [ReviewController::class, 'index']);
    Route::post('/reviews/{review}', [ReviewController::class, 'store']);
    Route::get('/minigames/{game}', [MinigameController::class, 'show'])->whereIn('game', ['runner', 'keywords']);
    Route::post('/minigames/{game}/scores', [MinigameController::class, 'store'])->whereIn('game', ['runner', 'keywords'])->middleware('throttle:20,1');
    Route::get('/pets', [PetController::class, 'index']);
    Route::post('/pets', [PetController::class, 'store']);
    Route::put('/pets/{pet}', [PetController::class, 'update']);
    Route::post('/pets/{pet}/sleep', [PetController::class, 'sleep']);
    Route::post('/pets/{pet}/feed', [PetController::class, 'feed']);
    Route::post('/pets/{pet}/equip', [PetController::class, 'equip']);
    Route::delete('/pets/{pet}/equip/{slot}', [PetController::class, 'unequip'])->whereIn('slot', ['head', 'neck', 'back']);
    Route::post('/pets/{pet}/activate', [PetController::class, 'activate']);
    Route::get('/room', [RoomController::class, 'show']);
    Route::put('/room', [RoomController::class, 'update']);

    // Cửa hàng đổi xu
    Route::get('/shop', [ShopController::class, 'index']);
    Route::post('/shop/items/{item}', [ShopController::class, 'buyItem']);
    Route::post('/shop/eggs/{species:code}', [ShopController::class, 'buyEgg']);
    Route::post('/shop/vouchers/{voucher}', [ShopController::class, 'redeemVoucher']);
    Route::get('/my/vouchers', [ShopController::class, 'myVouchers']);

    // Mua khóa học qua MoMo
    Route::post('/courses/{course}/checkout', [PaymentController::class, 'checkout'])->middleware('verified');
    Route::post('/payments/momo/return', [PaymentController::class, 'handleReturn']);
    Route::get('/orders', [PaymentController::class, 'orders']);
    Route::post('/orders/{order}/cancel', [PaymentController::class, 'cancel']);

    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/email/verification-notification', [AuthController::class, 'resendVerification'])->middleware('throttle:6,1');

    Route::put('/profile', [ProfileController::class, 'update']);
    Route::post('/profile/avatar', [ProfileController::class, 'updateAvatar']);
    Route::put('/profile/password', [ProfileController::class, 'updatePassword']);

    // Giảng viên (và quản trị viên) soạn khóa học
    Route::middleware(['verified', 'can:teach'])->prefix('instructor')->group(function () {
        Route::get('/courses', [CourseController::class, 'index']);
        Route::post('/courses', [CourseController::class, 'store']);
        Route::get('/courses/{course}', [CourseController::class, 'show']);
        Route::put('/courses/{course}', [CourseController::class, 'update']);
        Route::delete('/courses/{course}', [CourseController::class, 'destroy']);
        Route::post('/courses/{course}/thumbnail', [CourseController::class, 'updateThumbnail']);
        Route::post('/courses/{course}/submit', [CourseController::class, 'submit']);

        Route::post('/courses/{course}/chapters', [CourseOutlineController::class, 'storeChapter']);
        Route::put('/courses/{course}/outline', [CourseOutlineController::class, 'reorder']);
        Route::put('/chapters/{chapter}', [CourseOutlineController::class, 'updateChapter']);
        Route::delete('/chapters/{chapter}', [CourseOutlineController::class, 'destroyChapter']);
        Route::post('/chapters/{chapter}/lessons', [CourseOutlineController::class, 'storeLesson']);
        Route::put('/lessons/{lesson}', [CourseOutlineController::class, 'updateLesson']);
        Route::delete('/lessons/{lesson}', [CourseOutlineController::class, 'destroyLesson']);

        Route::get('/lessons/{lesson}/editor', [LessonEditorController::class, 'show']);
        Route::put('/lessons/{lesson}/blocks', [LessonEditorController::class, 'saveBlocks']);

        Route::post('/uploads', [UploadController::class, 'store']);

        Route::get('/stats', [StatsController::class, 'instructor']);
    });

    // Quản trị viên
    Route::middleware(['verified', 'can:admin'])->prefix('admin')->group(function () {
        Route::get('/users', [AdminUserController::class, 'index']);
        Route::put('/users/{user}/role', [AdminUserController::class, 'updateRole']);

        Route::get('/courses', [CourseReviewController::class, 'index']);
        Route::post('/courses/{course}/approve', [CourseReviewController::class, 'approve']);
        Route::post('/courses/{course}/reject', [CourseReviewController::class, 'reject']);

        Route::get('/stats', [StatsController::class, 'overview']);

        // Cấu hình nhiệm vụ, huy hiệu, voucher; lộ trình học
        Route::get('/rewards', [AdminRewardController::class, 'index']);
        Route::post('/rewards/{type}', [AdminRewardController::class, 'store'])->whereIn('type', ['quests', 'badges', 'vouchers']);
        Route::put('/rewards/{type}/{id}', [AdminRewardController::class, 'update'])->whereIn('type', ['quests', 'badges', 'vouchers'])->whereNumber('id');
        Route::get('/paths', [AdminPathController::class, 'index']);
        Route::post('/paths', [AdminPathController::class, 'store']);
        Route::put('/paths/{path}', [AdminPathController::class, 'update']);
        Route::delete('/paths/{path}', [AdminPathController::class, 'destroy']);
    });
});
