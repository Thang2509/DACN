<?php

namespace App\Http\Controllers;

use App\Models\Chapter;
use App\Models\Course;
use App\Models\Lesson;
use App\Services\CourseService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

// Quản lý chương và bài học (mục lục) của khóa
class CourseOutlineController extends Controller
{
    public function __construct(private CourseService $courses) {}

    public function storeChapter(Request $request, Course $course)
    {
        Gate::authorize('manage-course', $course);
        $data = $request->validate(['title' => ['required', 'string', 'max:200']]);

        return response()->json($this->courses->addChapter($course, $data['title']), 201);
    }

    public function updateChapter(Request $request, Chapter $chapter)
    {
        Gate::authorize('manage-course', $chapter->course);
        $chapter->update($request->validate(['title' => ['required', 'string', 'max:200']]));

        return $chapter;
    }

    public function destroyChapter(Chapter $chapter)
    {
        Gate::authorize('manage-course', $chapter->course);
        $chapter->delete();

        return response()->noContent();
    }

    public function storeLesson(Request $request, Chapter $chapter)
    {
        Gate::authorize('manage-course', $chapter->course);
        $data = $request->validate(['title' => ['required', 'string', 'max:200']]);

        return response()->json($this->courses->addLesson($chapter, $data['title']), 201);
    }

    public function updateLesson(Request $request, Lesson $lesson)
    {
        Gate::authorize('manage-course', $lesson->chapter->course);
        $lesson->update($request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:200'],
            'is_preview' => ['sometimes', 'boolean'],
        ]));

        return $lesson;
    }

    public function destroyLesson(Lesson $lesson)
    {
        Gate::authorize('manage-course', $lesson->chapter->course);
        $lesson->delete();

        return response()->noContent();
    }

    public function reorder(Request $request, Course $course)
    {
        Gate::authorize('manage-course', $course);
        $data = $request->validate([
            'chapters' => ['present', 'array'],
            'chapters.*.id' => ['required', 'integer'],
            'chapters.*.lessons' => ['present', 'array'],
            'chapters.*.lessons.*' => ['integer'],
        ]);
        $this->courses->reorderOutline($course, $data['chapters']);

        return response()->noContent();
    }
}
