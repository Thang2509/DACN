<?php

namespace App\Http\Controllers;

use App\Http\Requests\SaveBlocksRequest;
use App\Models\Lesson;
use App\Services\CourseService;
use Illuminate\Support\Facades\Gate;

// Trình soạn khối nội dung của một bài học
class LessonEditorController extends Controller
{
    public function __construct(private CourseService $courses) {}

    public function show(Lesson $lesson)
    {
        Gate::authorize('manage-course', $lesson->chapter->course);

        return $lesson->load(['blocks', 'chapter.course']);
    }

    public function saveBlocks(SaveBlocksRequest $request, Lesson $lesson)
    {
        Gate::authorize('manage-course', $lesson->chapter->course);

        return $this->courses->syncBlocks($lesson, $request->validated('blocks'));
    }
}
