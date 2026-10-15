<?php

namespace App\Services;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\LessonBlock;
use App\Models\LessonProgress;
use App\Models\Order;
use App\Models\QuizAttempt;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

// Số liệu thống kê: toàn hệ thống cho quản trị viên (UC45), theo khóa học cho giảng viên (UC34)
class StatsService
{
    private const DAYS = 30;

    public function overview(): array
    {
        $paid = Order::where('status', Order::STATUS_PAID);

        return [
            'totals' => [
                'students' => User::where('role', 'student')->count(),
                'instructors' => User::where('role', 'instructor')->count(),
                'published_courses' => Course::published()->count(),
                'enrollments' => Enrollment::count(),
                'lessons_completed' => LessonProgress::count(),
                'paid_orders' => $paid->clone()->count(),
                'revenue' => (int) $paid->clone()->sum('amount'),
            ],
            'daily' => [
                'new_users' => $this->daily(User::query(), 'created_at'),
                'lessons_completed' => $this->daily(LessonProgress::query(), 'completed_at'),
                'revenue' => $this->daily($paid->clone(), 'paid_at', 'SUM(amount)'),
            ],
            'top_courses' => Course::published()->withCount(['enrollments', 'enrollments as completed_count' => fn ($q) => $q->whereNotNull('completed_at')])
                ->orderByDesc('enrollments_count')->limit(5)->get(['id', 'title', 'slug', 'price']),
            'recent_orders' => Order::with('course:id,title', 'user:id,name')->latest('id')->limit(10)
                ->get(['id', 'user_id', 'course_id', 'amount', 'status', 'created_at']),
        ];
    }

    // Khóa của giảng viên kèm số học viên; chi tiết một khóa (mặc định khóa đầu tiên)
    public function instructor(User $instructor, ?int $courseId): array
    {
        $courses = Course::where('instructor_id', $instructor->id)
            ->withCount(['enrollments', 'enrollments as completed_count' => fn ($q) => $q->whereNotNull('completed_at'), 'lessons'])
            ->orderBy('title')->get(['id', 'title', 'status']);
        $course = $courses->firstWhere('id', $courseId) ?? $courses->first();

        return [
            'courses' => $courses,
            'course' => $course ? $this->courseDetail($course) : null,
        ];
    }

    private function courseDetail(Course $course): array
    {
        $lessons = $course->lessons()->orderBy('chapters.position')->orderBy('lessons.position')
            ->withCount('progress')->get(['lessons.id', 'lessons.title']);

        return [
            'id' => $course->id,
            'title' => $course->title,
            'enrollments' => $course->enrollments_count,
            'completed' => $course->completed_count,
            'completion_rate' => $course->enrollments_count ? round($course->completed_count * 100 / $course->enrollments_count) : 0,
            'new_enrollments' => $this->daily(Enrollment::where('course_id', $course->id), 'created_at'),
            'lessons' => $lessons->map(fn ($lesson) => ['title' => $lesson->title, 'completed' => $lesson->progress_count]),
            'hardest_questions' => $this->hardestQuestions($lessons->pluck('id')),
        ];
    }

    /**
     * Câu quiz hay sai nhất: tỉ lệ đúng tính trên lượt làm đầu tiên của mỗi học viên
     * (lượt làm lại thường đã biết đáp án nên không phản ánh độ khó).
     */
    private function hardestQuestions($lessonIds): array
    {
        $blocks = LessonBlock::with('lesson:id,title')->whereIn('lesson_id', $lessonIds)->where('type', 'quiz')->get()->keyBy('id');
        $firstAttempts = QuizAttempt::whereIn('lesson_block_id', $blocks->keys())
            ->whereIn('id', QuizAttempt::selectRaw('MIN(id)')->groupBy('user_id', 'lesson_block_id'))
            ->get(['lesson_block_id', 'answers']);

        $tally = [];
        foreach ($firstAttempts as $attempt) {
            $questions = $blocks[$attempt->lesson_block_id]->content['questions'];
            foreach ($attempt->answers as $i => $answer) {
                if ($answer === null || ! isset($questions[$i])) {
                    continue;
                }
                $key = "{$attempt->lesson_block_id}:{$i}";
                $tally[$key] ??= ['answered' => 0, 'correct' => 0];
                $tally[$key]['answered']++;
                $tally[$key]['correct'] += (int) ($answer === $questions[$i]['answer']);
            }
        }

        return collect($tally)->map(function ($count, $key) use ($blocks) {
            [$blockId, $i] = explode(':', $key);
            $block = $blocks[$blockId];

            return [
                'question' => $block->content['questions'][$i]['question'],
                'lesson' => $block->lesson->title,
                'answered' => $count['answered'],
                'correct_rate' => round($count['correct'] * 100 / $count['answered']),
            ];
        })->sortBy('correct_rate')->take(5)->values()->all();
    }

    // Đếm (hoặc cộng) theo ngày trong 30 ngày gần nhất, ngày không có dữ liệu thì bằng 0
    private function daily($query, string $column, string $aggregate = 'COUNT(*)'): array
    {
        $from = today()->subDays(self::DAYS - 1);
        $values = $query->where($column, '>=', $from)
            ->groupBy(DB::raw("DATE($column)"))
            ->pluck(DB::raw("$aggregate as value"), DB::raw("DATE($column) as day"));

        return collect(range(0, self::DAYS - 1))->map(function ($offset) use ($from, $values) {
            $day = Carbon::parse($from)->addDays($offset)->toDateString();

            return ['date' => $day, 'value' => (int) ($values[$day] ?? 0)];
        })->all();
    }
}
