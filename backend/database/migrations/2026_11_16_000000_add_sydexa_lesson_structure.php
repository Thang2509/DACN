<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

// Tổ chức bài học kiểu Sydexa: khối "Phần", tóm tắt + thời lượng bài, slug bài,
// chủ đề + SQL Playground của khóa, quiz chấm từng câu
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->string('category', 30)->default('backend')->after('level');
            $table->text('playground_sql')->nullable()->after('description'); // SQL tạo bảng mẫu cho SQL Playground
        });

        Schema::table('lessons', function (Blueprint $table) {
            $table->string('slug')->nullable()->after('title');
            $table->text('summary')->nullable()->after('slug');
            $table->unsignedSmallInteger('duration_minutes')->default(10)->after('summary');
            $table->index('slug');
        });

        Schema::table('lesson_blocks', function (Blueprint $table) {
            $table->enum('type', ['section', 'markdown', 'video', 'quiz', 'animation', 'code', 'flashcard'])->change();
        });

        Schema::table('quiz_attempts', function (Blueprint $table) {
            $table->timestamp('completed_at')->nullable()->after('correct_count'); // trả lời hết câu mới tính là xong
        });
        DB::table('quiz_attempts')->update(['completed_at' => DB::raw('created_at')]);

        $this->fillLessonSlugs();
    }

    public function down(): void
    {
        Schema::table('quiz_attempts', fn (Blueprint $table) => $table->dropColumn('completed_at'));
        DB::table('lesson_blocks')->where('type', 'section')->delete();
        Schema::table('lesson_blocks', function (Blueprint $table) {
            $table->enum('type', ['markdown', 'video', 'quiz', 'animation', 'code', 'flashcard'])->change();
        });
        Schema::table('lessons', function (Blueprint $table) {
            $table->dropIndex(['slug']);
            $table->dropColumn(['slug', 'summary', 'duration_minutes']);
        });
        Schema::table('courses', fn (Blueprint $table) => $table->dropColumn(['category', 'playground_sql']));
    }

    // Tạo slug cho bài học đã có, không trùng trong cùng một khóa
    private function fillLessonSlugs(): void
    {
        $lessons = DB::table('lessons')
            ->join('chapters', 'chapters.id', '=', 'lessons.chapter_id')
            ->orderBy('lessons.id')
            ->get(['lessons.id', 'lessons.title', 'chapters.course_id']);

        $used = [];
        foreach ($lessons as $lesson) {
            $base = Str::slug($lesson->title) ?: 'bai-hoc';
            $slug = $base;
            for ($i = 2; isset($used[$lesson->course_id][$slug]); $i++) {
                $slug = "{$base}-{$i}";
            }
            $used[$lesson->course_id][$slug] = true;
            DB::table('lessons')->where('id', $lesson->id)->update(['slug' => $slug]);
        }
    }
};
