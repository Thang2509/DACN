<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\LearningPath;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

// Quản trị viên quản lý lộ trình học và thứ tự khóa học trong lộ trình (UC42)
class AdminPathController extends Controller
{
    public function index()
    {
        return [
            'paths' => LearningPath::with('courses:id,title,status')->orderBy('id')->get(),
            'courses' => Course::published()->orderBy('title')->get(['id', 'title', 'level']),
        ];
    }

    public function store(Request $request)
    {
        $path = new LearningPath(collect($this->validated($request))->only('title', 'description')->all());
        $path->slug = $this->uniqueSlug($path->title);
        $path->save();
        $this->syncCourses($request, $path);

        return response()->json($path->load('courses:id,title,status'), 201);
    }

    public function update(Request $request, LearningPath $path)
    {
        $path->update(collect($this->validated($request))->only('title', 'description')->all());
        $this->syncCourses($request, $path);

        return $path->load('courses:id,title,status');
    }

    public function destroy(LearningPath $path)
    {
        $path->delete();

        return response()->noContent();
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string', 'max:2000'],
            'course_ids' => ['present', 'array'],
            'course_ids.*' => ['integer', 'distinct', 'exists:courses,id'],
        ]);
    }

    // Thứ tự trong mảng course_ids là thứ tự học trong lộ trình
    private function syncCourses(Request $request, LearningPath $path): void
    {
        $positions = collect($request->input('course_ids'))->values()->mapWithKeys(fn ($id, $i) => [$id => ['position' => $i]]);
        $path->courses()->sync($positions);
    }

    private function uniqueSlug(string $title): string
    {
        $base = Str::slug($title) ?: 'lo-trinh';
        $slug = $base;
        for ($i = 2; LearningPath::where('slug', $slug)->exists(); $i++) {
            $slug = "{$base}-{$i}";
        }

        return $slug;
    }
}
