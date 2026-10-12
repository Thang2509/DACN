<?php

namespace App\Http\Controllers;

use App\Http\Requests\CourseRequest;
use App\Models\Course;
use App\Services\CourseService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

// Giảng viên quản lý khóa học của mình
class CourseController extends Controller
{
    public function __construct(private CourseService $courses) {}

    public function index(Request $request)
    {
        return $request->user()->courses()->withCount('lessons')->latest()->get();
    }

    public function store(CourseRequest $request)
    {
        return response()->json($this->courses->create($request->user(), $request->validated()), 201);
    }

    // Thông tin khóa + mục lục chương/bài để soạn
    public function show(Course $course)
    {
        Gate::authorize('manage-course', $course);

        return $course->load(['chapters.lessons' => fn ($query) => $query->withCount('blocks')]);
    }

    public function update(CourseRequest $request, Course $course)
    {
        Gate::authorize('manage-course', $course);

        return $this->courses->update($course, $request->validated());
    }

    public function destroy(Course $course)
    {
        Gate::authorize('manage-course', $course);
        $this->courses->delete($course);

        return response()->noContent();
    }

    public function updateThumbnail(Request $request, Course $course)
    {
        Gate::authorize('manage-course', $course);
        $request->validate(['thumbnail' => ['required', 'image', 'max:2048']]);

        return $this->courses->updateThumbnail($course, $request->file('thumbnail'));
    }

    public function submit(Course $course)
    {
        Gate::authorize('manage-course', $course);

        return $this->courses->submitForReview($course);
    }
}
