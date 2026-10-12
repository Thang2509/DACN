<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\LearningPath;
use App\Services\LearningService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

// Danh mục khóa học: tìm kiếm, lọc, chi tiết, lộ trình (khách cũng xem được)
class CatalogController extends Controller
{
    public function __construct(private LearningService $learning) {}

    public function index(Request $request)
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'level' => ['nullable', Rule::in(Course::LEVELS)],
            'category' => ['nullable', Rule::in(Course::CATEGORIES)],
            'price' => ['nullable', Rule::in(['free', 'paid'])],
            'path' => ['nullable', 'string', 'max:200'],
            'sort' => ['nullable', Rule::in(['newest', 'popular'])],
        ]);

        return Course::published()
            ->with('instructor:id,name')
            ->withCount(['lessons', 'enrollments'])
            ->withSum('lessons', 'duration_minutes')
            ->filter($filters)
            ->paginate(12);
    }

    public function show(Request $request, Course $course)
    {
        $user = $request->user('sanctum'); // có thể là khách
        $canManage = $user && Gate::forUser($user)->allows('manage-course', $course);
        abort_unless($course->status === Course::STATUS_PUBLISHED || $canManage, 404);

        $course->load('instructor:id,name,bio,avatar_path')
            ->loadCount(['lessons', 'enrollments'])
            ->loadSum('lessons', 'duration_minutes');
        $enrolled = $user && $this->learning->isEnrolled($user, $course);

        return [
            ...$course->toArray(),
            'chapters' => $this->learning->outline($course, $user),
            'enrolled' => $enrolled,
            'progress' => $enrolled ? $this->learning->progress($user, $course) : null,
        ];
    }

    public function paths()
    {
        return LearningPath::with(['courses' => fn ($query) => $query->published()
            ->with('instructor:id,name')
            ->withCount('lessons')
            ->withSum('lessons', 'duration_minutes'),
        ])->get();
    }
}
