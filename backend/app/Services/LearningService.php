<?php

namespace App\Services;

use App\Events\LessonCompleted;
use App\Events\QuizQuestionAnswered;
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
            $this->fail('course', 'Khóa học có phí, hãy mua khóa học để học.');
        }

        return Enrollment::firstOrCreate(['user_id' => $user->id, 'course_id' => $course->id]);
    }

    // Mục lục chương/bài kèm cờ "đã học" của người dùng
    public function outline(Course $course, ?User $user): array
    {
        $chapters = $course->chapters()
            ->with('lessons:id,chapter_id,title,slug,summary,duration_minutes,position,is_preview')
            ->get(['id', 'course_id', 'title']);
        $lessonIds = $chapters->pluck('lessons')->flatten()->pluck('id');
        $done = $user
            ? LessonProgress::where('user_id', $user->id)->whereIn('lesson_id', $lessonIds)->pluck('lesson_id')->all()
            : [];

        return $chapters->map(fn ($chapter) => [
            'id' => $chapter->id,
            'title' => $chapter->title,
            'lessons' => $chapter->lessons->map(fn ($lesson) => [
                ...$lesson->only('id', 'title', 'slug', 'summary', 'duration_minutes', 'is_preview'),
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
            'next_lesson' => $next ? collect($next)->only('id', 'slug', 'title')->all() : null,
        ];
    }

    public function myCourses(User $user): Collection
    {
        return $user->enrolledCourses()
            ->with('instructor:id,name')
            ->withCount('lessons')
            ->withSum('lessons', 'duration_minutes')
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
            'lesson' => $lesson->only('id', 'slug', 'title', 'summary', 'intro_video_url', 'duration_minutes', 'is_preview'),
            'course' => [...$course->only('id', 'slug', 'title', 'price', 'playground_sql'), 'chapters' => $outline],
            'blocks' => $blocks->map(fn (LessonBlock $block) => [
                'id' => $block->id,
                'type' => $block->type,
                'content' => $this->publicContent($block),
            ])->all(),
            'enrolled' => $user !== null && $this->isEnrolled($user, $course),
            'can_manage' => $user !== null && Gate::forUser($user)->allows('manage-course', $course), // người soạn xem được mọi bài
            'completed' => $lessons[$index]['completed'] ?? false,
            'quiz_attempts' => $user ? $this->latestAttempts($user, $blocks) : (object) [],
            'prev_lesson' => $lessons[$index - 1] ?? null,
            'next_lesson' => $lessons[$index + 1] ?? null,
        ];
    }

    /**
     * Chấm một câu của khối quiz và ghi vào lượt làm đang dở (chưa có thì tạo mới).
     * Lượt làm xong khi đã trả lời hết các câu; làm lại sẽ tạo lượt mới.
     */
    public function answerQuestion(User $user, LessonBlock $block, int $question, int $answer): array
    {
        $count = count($block->content['questions']);
        if ($question >= $count) {
            $this->fail('question', 'Câu hỏi không tồn tại.');
        }

        $attempt = QuizAttempt::where('user_id', $user->id)
            ->where('lesson_block_id', $block->id)
            ->whereNull('completed_at')
            ->latest('id')
            ->first()
            ?? new QuizAttempt(['user_id' => $user->id, 'lesson_block_id' => $block->id, 'answers' => []]);

        // Khớp số câu hiện tại của khối (giảng viên có thể đã sửa quiz)
        $answers = array_pad(array_slice($attempt->answers, 0, $count), $count, null);
        if ($answers[$question] !== null) {
            $this->fail('question', 'Câu này đã được trả lời, hãy bấm Làm lại để làm lượt mới.');
        }
        $answers[$question] = $answer;

        $attempt->answers = $answers;
        $attempt->correct_count = collect($this->quizResults($block, $answers))->where('correct', true)->count();
        if (! in_array(null, $answers, true)) {
            $attempt->completed_at = now();
        }
        $attempt->save();

        // Báo cho phần phát thưởng (chạy qua hàng đợi)
        $isFirstAttempt = QuizAttempt::where('user_id', $user->id)->where('lesson_block_id', $block->id)->count() === 1;
        QuizQuestionAnswered::dispatch(
            $user->id,
            $block->id,
            $question,
            $answer === $block->content['questions'][$question]['answer'],
            $isFirstAttempt && $attempt->completed_at !== null && $attempt->correct_count === $count,
        );

        return $this->attemptView($block, $attempt, $this->finishedBlockIds($user, [$block->id])->isNotEmpty());
    }

    // Hoàn thành bài khi đã đăng ký khóa và đã làm xong mọi khối quiz (sai vẫn được tính)
    public function completeLesson(User $user, Lesson $lesson): array
    {
        $course = $lesson->chapter->course;
        if (! $this->isEnrolled($user, $course)) {
            $this->fail('lesson', 'Hãy đăng ký khóa học để lưu tiến độ.');
        }

        $quizIds = $lesson->blocks()->where('type', 'quiz')->pluck('id');
        if ($this->finishedBlockIds($user, $quizIds)->count() < $quizIds->count()) {
            $this->fail('lesson', 'Hãy trả lời hết các câu quiz trước khi hoàn thành bài.');
        }

        $record = LessonProgress::firstOrCreate(
            ['user_id' => $user->id, 'lesson_id' => $lesson->id],
            ['completed_at' => now()],
        );

        $progress = $this->progress($user, $course);
        $courseCompleted = $progress['completed'] === $progress['total'];
        if ($courseCompleted) {
            Enrollment::where('user_id', $user->id)->where('course_id', $course->id)
                ->whereNull('completed_at')
                ->update(['completed_at' => now()]);
        }

        // Chỉ lần hoàn thành đầu tiên mới phát thưởng (chạy qua hàng đợi)
        if ($record->wasRecentlyCreated) {
            LessonCompleted::dispatch($user->id, $lesson->id, $courseCompleted);
        }

        return $progress;
    }

    private function flatLessons(array $outline): Collection
    {
        return collect($outline)->pluck('lessons')->flatten(1);
    }

    // Ẩn đáp án và giải thích của quiz; chỉ lộ ra từng câu sau khi học viên trả lời câu đó
    private function publicContent(LessonBlock $block): array
    {
        if ($block->type !== 'quiz') {
            return $block->content;
        }

        return [
            'variant' => $block->content['variant'] ?? 'quick',
            'questions' => collect($block->content['questions'])
                ->map(fn ($q) => ['question' => $q['question'], 'options' => $q['options']])
                ->all(),
        ];
    }

    // Kết quả từng câu; câu chưa trả lời là null
    private function quizResults(LessonBlock $block, array $answers): array
    {
        return collect($block->content['questions'])->map(function ($q, $i) use ($answers) {
            if (($answers[$i] ?? null) === null) {
                return null;
            }

            return [
                'correct' => $answers[$i] === $q['answer'],
                'answer' => $q['answer'],
                'explanation' => $q['explanation'] ?? null,
            ];
        })->all();
    }

    // completed_once: khối này đã từng có lượt làm xong (đủ điều kiện hoàn thành bài kể cả khi đang làm lại)
    private function attemptView(LessonBlock $block, QuizAttempt $attempt, bool $completedOnce): array
    {
        return [
            'answers' => $attempt->answers,
            'results' => $this->quizResults($block, $attempt->answers),
            'correct_count' => $attempt->correct_count,
            'completed' => $attempt->completed_at !== null,
            'completed_once' => $completedOnce,
        ];
    }

    private function finishedBlockIds(User $user, $blockIds): Collection
    {
        return QuizAttempt::where('user_id', $user->id)
            ->whereIn('lesson_block_id', $blockIds)
            ->whereNotNull('completed_at')
            ->distinct()
            ->pluck('lesson_block_id');
    }

    // Lượt làm gần nhất (xong hoặc đang dở) của từng khối quiz, dạng { blockId: {...} }
    private function latestAttempts(User $user, Collection $blocks): object
    {
        $quizBlocks = $blocks->where('type', 'quiz')->keyBy('id');
        $finished = $this->finishedBlockIds($user, $quizBlocks->keys())->all();

        return (object) QuizAttempt::where('user_id', $user->id)
            ->whereIn('lesson_block_id', $quizBlocks->keys())
            ->orderBy('id')
            ->get()
            ->keyBy('lesson_block_id')
            ->map(fn (QuizAttempt $attempt) => $this->attemptView(
                $quizBlocks[$attempt->lesson_block_id],
                $attempt,
                in_array($attempt->lesson_block_id, $finished),
            ))
            ->all();
    }

    private function fail(string $field, string $message): never
    {
        throw ValidationException::withMessages([$field => $message]);
    }
}
