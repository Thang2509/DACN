<?php

use App\Http\Controllers\AdminUserController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CatalogController;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\CourseOutlineController;
use App\Http\Controllers\CourseReviewController;
use App\Http\Controllers\LearningController;
use App\Http\Controllers\LessonEditorController;
use App\Http\Controllers\NoteController;
use App\Http\Controllers\ProfileController;
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
Route::get('/lessons/{lesson}', [LearningController::class, 'lesson']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);

    // Học tập
    Route::get('/my/courses', [LearningController::class, 'myCourses']);
    Route::post('/courses/{course}/enroll', [LearningController::class, 'enroll'])->middleware('verified');
    Route::post('/lessons/{lesson}/quiz/{block}', [LearningController::class, 'submitQuiz'])->scopeBindings();
    Route::post('/lessons/{lesson}/complete', [LearningController::class, 'complete']);

    Route::get('/notes', [NoteController::class, 'index']);
    Route::post('/lessons/{lesson}/notes', [NoteController::class, 'store']);
    Route::put('/notes/{note}', [NoteController::class, 'update']);
    Route::delete('/notes/{note}', [NoteController::class, 'destroy']);
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
    });

    // Quản trị viên
    Route::middleware(['verified', 'can:admin'])->prefix('admin')->group(function () {
        Route::get('/users', [AdminUserController::class, 'index']);
        Route::put('/users/{user}/role', [AdminUserController::class, 'updateRole']);

        Route::get('/courses', [CourseReviewController::class, 'index']);
        Route::post('/courses/{course}/approve', [CourseReviewController::class, 'approve']);
        Route::post('/courses/{course}/reject', [CourseReviewController::class, 'reject']);
    });
});
