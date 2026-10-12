<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Lesson;
use App\Models\LessonBlock;
use App\Services\LearningService;
use Illuminate\Http\Request;

// Học viên đăng ký khóa, học bài, làm quiz, hoàn thành bài
class LearningController extends Controller
{
    public function __construct(private LearningService $learning) {}

    public function enroll(Request $request, Course $course)
    {
        $this->learning->enroll($request->user(), $course);

        return response()->json(['progress' => $this->learning->progress($request->user(), $course)], 201);
    }

    public function myCourses(Request $request)
    {
        return $this->learning->myCourses($request->user());
    }

    // /courses/{course}/lessons/{lessonSlug}: khách xem được bài học thử; bài khác cần đăng ký khóa
    public function lesson(Request $request, Course $course, string $lessonSlug)
    {
        $lesson = $course->lessons()->where('lessons.slug', $lessonSlug)->firstOrFail();
        $user = $request->user('sanctum');
        if (! $this->learning->canView($user, $lesson)) {
            return response()->json([
                'message' => $user ? 'Hãy đăng ký khóa học để học bài này.' : 'Hãy đăng nhập để học bài này.',
                'course' => $course->only('slug', 'title'),
            ], $user ? 403 : 401);
        }

        return $this->learning->lessonPayload($user, $lesson);
    }

    // Trả lời một câu của khối quiz, chấm ngay câu đó
    public function answerQuestion(Request $request, Lesson $lesson, LessonBlock $block)
    {
        abort_unless($block->type === 'quiz' && $this->learning->canView($request->user(), $lesson), 403);
        $data = $request->validate([
            'question' => ['required', 'integer', 'min:0'],
            'answer' => ['required', 'integer', 'min:0'],
        ]);

        return $this->learning->answerQuestion($request->user(), $block, $data['question'], $data['answer']);
    }

    public function complete(Request $request, Lesson $lesson)
    {
        return $this->learning->completeLesson($request->user(), $lesson);
    }
}
