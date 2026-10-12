<?php

namespace App\Services;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonBlock;
use App\Models\LessonProgress;
use App\Models\QuizAttempt;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

// Nghiệp vụ học tập: quyền xem bài, đăng ký khóa, tiến độ, chấm quiz
class LearningService
{
    // Xem được khi: soạn khóa này, hoặc khóa đã xuất bản và (bài học thử hoặc đã đăng ký)
    public function canView(?User $user, Lesson $lesson): bool
    {
        $course = $lesson->chapter->course;
        if ($user && Gate::forUser($user)->allows('manage-course', $course)) {
            return true;
        }
        if ($course->status !== Course::STATUS_PUBLISHED) {
            return false;
        }

        return $lesson->is_preview || ($user && $this->isEnrolled($user, $course));
    }

    public function isEnrolled(User $user, Course $course): bool
    {
        return Enrollment::where('user_id', $user->id)->where('course_id', $course->id)->exists();
    }

    public function enroll(User $user, Course $course): Enrollment
    {
        if ($course->status !== Course::STATUS_PUBLISHED) {
            $this->fail('course', 'Khóa học chưa được xuất bản.');
        }
        if ($course->price > 0) {
            $this->fail('course', 'Khóa học có phí, chức năng mua khóa học sẽ mở ở đợt sau.');
        }

        return Enrollment::firstOrCreate(['user_id' => $user->id, 'course_id' => $course->id]);
    }

    // Mục lục chương/bài kèm cờ "đã học" của người dùng
    public function outline(Course $course, ?User $user): array
    {
        $chapters = $course->chapters()->with('lessons:id,chapter_id,title,position,is_preview')->get(['id', 'course_id', 'title']);
        $lessonIds = $chapters->pluck('lessons')->flatten()->pluck('id');
        $done = $user
            ? LessonProgress::where('user_id', $user->id)->whereIn('lesson_id', $lessonIds)->pluck('lesson_id')->all()
            : [];

        return $chapters->map(fn ($chapter) => [
            'id' => $chapter->id,
            'title' => $chapter->title,
            'lessons' => $chapter->lessons->map(fn ($lesson) => [
                'id' => $lesson->id,
                'title' => $lesson->title,
                'is_preview' => $lesson->is_preview,
                'completed' => in_array($lesson->id, $done),
            ])->all(),
        ])->all();
    }

    // Số bài đã học / tổng số bài và bài nên học tiếp
    public function progress(User $user, Course $course): array
    {
        $lessons = $this->flatLessons($this->outline($course, $user));
        $next = $lessons->firstWhere('completed', false) ?? $lessons->first();

        return [
            'completed' => $lessons->where('completed', true)->count(),
            'total' => $lessons->count(),
            'next_lesson_id' => $next['id'] ?? null,
        ];
    }

    public function myCourses(User $user): Collection
    {
        return $user->enrolledCourses()
            ->with('instructor:id,name')
            ->withCount('lessons')
            ->orderByPivot('updated_at', 'desc')
            ->get()
            ->map(fn (Course $course) => [...$course->toArray(), 'progress' => $this->progress($user, $course)]);
    }

    // Dữ liệu trình học bài: nội dung khối (đã ẩn đáp án quiz), mục lục, lượt làm quiz gần nhất
    public function lessonPayload(?User $user, Lesson $lesson): array
    {
        $course = $lesson->chapter->course;
        $blocks = $lesson->blocks()->get();
        $outline = $this->outline($course, $user);
        $lessons = $this->flatLessons($outline)->values()->all();
        $index = collect($lessons)->search(fn ($item) => $item['id'] === $lesson->id);

        return [
            'lesson' => $lesson->only('id', 'title', 'is_preview'),
            'course' => [...$course->only('id', 'slug', 'title', 'price'), 'chapters' => $outline],
            'blocks' => $blocks->map(fn (LessonBlock $block) => [
                'id' => $block->id,
                'type' => $block->type,
                'content' => $this->publicContent($block),
            ])->all(),
            'enrolled' => $user !== null && $this->isEnrolled($user, $course),
            'can_manage' => $user !== null && Gate::forUser($user)->allows('manage-course', $course), // người soạn xem được mọi bài
            'completed' => $lessons[$index]['completed'] ?? false,
            'quiz_attempts' => $user ? $this->latestAttempts($user, $blocks) : (object) [],
            'prev_lesson_id' => $lessons[$index - 1]['id'] ?? null,
            'next_lesson_id' => $lessons[$index + 1]['id'] ?? null,
        ];
    }

    public function gradeQuiz(User $user, LessonBlock $block, array $answers): array
    {
        $answers = array_map('intval', $answers);
        $results = $this->quizResults($block, $answers);
        $correctCount = collect($results)->where('correct', true)->count();

        QuizAttempt::create([
            'user_id' => $user->id,
            'lesson_block_id' => $block->id,
            'answers' => $answers,
            'correct_count' => $correctCount,
        ]);

        return ['answers' => $answers, 'results' => $results, 'correct_count' => $correctCount];
    }

    // Hoàn thành bài khi đã đăng ký khóa và đã trả lời mọi khối quiz (sai vẫn được tính)
    public function completeLesson(User $user, Lesson $lesson): array
    {
        $course = $lesson->chapter->course;
        if (! $this->isEnrolled($user, $course)) {
            $this->fail('lesson', 'Hãy đăng ký khóa học để lưu tiến độ.');
        }

        $quizIds = $lesson->blocks()->where('type', 'quiz')->pluck('id');
        $answered = QuizAttempt::where('user_id', $user->id)
            ->whereIn('lesson_block_id', $quizIds)
            ->distinct()
            ->count('lesson_block_id');
        if ($answered < $quizIds->count()) {
            $this->fail('lesson', 'Hãy trả lời hết các câu quiz trước khi hoàn thành bài.');
        }

        LessonProgress::firstOrCreate(
            ['user_id' => $user->id, 'lesson_id' => $lesson->id],
            ['completed_at' => now()],
        );

        $progress = $this->progress($user, $course);
        if ($progress['completed'] === $progress['total']) {
            Enrollment::where('user_id', $user->id)->where('course_id', $course->id)
                ->whereNull('completed_at')
                ->update(['completed_at' => now()]);
        }

        return $progress;
    }

    private function flatLessons(array $outline): Collection
    {
        return collect($outline)->pluck('lessons')->flatten(1);
    }

    // Ẩn đáp án và giải thích của quiz cho tới khi học viên nộp bài
    private function publicContent(LessonBlock $block): array
    {
        if ($block->type !== 'quiz') {
            return $block->content;
        }

        return [
            'questions' => collect($block->content['questions'])
                ->map(fn ($q) => ['question' => $q['question'], 'options' => $q['options']])
                ->all(),
        ];
    }

    private function quizResults(LessonBlock $block, array $answers): array
    {
        return collect($block->content['questions'])->map(fn ($q, $i) => [
            'correct' => ($answers[$i] ?? null) === $q['answer'],
            'answer' => $q['answer'],
            'explanation' => $q['explanation'] ?? null,
        ])->all();
    }

    // Lượt làm gần nhất của từng khối quiz trong bài, dạng { blockId: {...} }
    private function latestAttempts(User $user, Collection $blocks): object
    {
        $quizBlocks = $blocks->where('type', 'quiz')->keyBy('id');

        return (object) QuizAttempt::where('user_id', $user->id)
            ->whereIn('lesson_block_id', $quizBlocks->keys())
            ->orderBy('id')
            ->get()
            ->keyBy('lesson_block_id')
            ->map(fn (QuizAttempt $attempt) => [
                'answers' => $attempt->answers,
                'results' => $this->quizResults($quizBlocks[$attempt->lesson_block_id], $attempt->answers),
                'correct_count' => $attempt->correct_count,
            ])
            ->all();
    }

    private function fail(string $field, string $message): never
    {
        throw ValidationException::withMessages([$field => $message]);
    }
}
