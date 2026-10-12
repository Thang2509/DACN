<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Services\CourseService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

// Quản trị viên duyệt khóa học trước khi công khai
class CourseReviewController extends Controller
{
    public function __construct(private CourseService $courses) {}

    public function index(Request $request)
    {
        $data = $request->validate([
            'status' => ['nullable', Rule::in([Course::STATUS_PENDING, Course::STATUS_PUBLISHED, Course::STATUS_REJECTED, Course::STATUS_DRAFT])],
        ]);

        return Course::with('instructor:id,name,email')
            ->withCount('lessons')
            ->where('status', $data['status'] ?? Course::STATUS_PENDING)
            ->latest('updated_at')
            ->paginate(20);
    }

    public function approve(Course $course)
    {
        return $this->courses->approve($course);
    }

    public function reject(Request $request, Course $course)
    {
        $data = $request->validate(['note' => ['required', 'string', 'max:1000']]);

        return $this->courses->reject($course, $data['note']);
    }
}
