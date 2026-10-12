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

    // Khách xem được bài học thử; bài khác cần đăng ký khóa
    public function lesson(Request $request, Lesson $lesson)
    {
        $user = $request->user('sanctum');
        if (! $this->learning->canView($user, $lesson)) {
            $course = $lesson->chapter->course;

            return response()->json([
                'message' => $user ? 'Hãy đăng ký khóa học để học bài này.' : 'Hãy đăng nhập để học bài này.',
                'course' => $course->only('slug', 'title'),
            ], $user ? 403 : 401);
        }

        return $this->learning->lessonPayload($user, $lesson);
    }

    public function submitQuiz(Request $request, Lesson $lesson, LessonBlock $block)
    {
        abort_unless($block->type === 'quiz' && $this->learning->canView($request->user(), $lesson), 403);
        $data = $request->validate([
            'answers' => ['required', 'array', 'size:'.count($block->content['questions'])],
            'answers.*' => ['required', 'integer', 'min:0'],
        ]);

        return $this->learning->gradeQuiz($request->user(), $block, $data['answers']);
    }

    public function complete(Request $request, Lesson $lesson)
    {
        return $this->learning->completeLesson($request->user(), $lesson);
    }
}
