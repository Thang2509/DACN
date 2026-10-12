<?php

namespace App\Http\Controllers;

use App\Models\Lesson;
use App\Models\Note;
use App\Services\LearningService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

// Ghi chú cá nhân gắn với bài học, khối nội dung hoặc mốc thời gian video
class NoteController extends Controller
{
    public function __construct(private LearningService $learning) {}

    public function index(Request $request)
    {
        $filters = $request->validate([
            'lesson_id' => ['nullable', 'integer'],
            'search' => ['nullable', 'string', 'max:100'],
        ]);

        return Note::where('user_id', $request->user()->id)
            ->when($filters['lesson_id'] ?? null, fn ($q, $id) => $q->where('lesson_id', $id))
            ->when($filters['search'] ?? null, fn ($q, $search) => $q->where('content', 'like', "%{$search}%"))
            ->with('lesson:id,title,chapter_id', 'lesson.chapter:id,course_id', 'lesson.chapter.course:id,title,slug')
            ->latest()
            ->limit(300)
            ->get();
    }

    public function store(Request $request, Lesson $lesson)
    {
        abort_unless($this->learning->canView($request->user(), $lesson), 403);
        $note = new Note($this->validated($request, $lesson));
        $note->user_id = $request->user()->id;
        $note->lesson_id = $lesson->id;
        $note->save();

        return response()->json($note, 201);
    }

    public function update(Request $request, Note $note)
    {
        abort_unless($note->user_id === $request->user()->id, 403);
        $note->update($request->validate(['content' => ['required', 'string', 'max:5000']]));

        return $note;
    }

    public function destroy(Request $request, Note $note)
    {
        abort_unless($note->user_id === $request->user()->id, 403);
        $note->delete();

        return response()->noContent();
    }

    private function validated(Request $request, Lesson $lesson): array
    {
        return $request->validate([
            'content' => ['required', 'string', 'max:5000'],
            // Khối phải thuộc đúng bài học này
            'lesson_block_id' => ['nullable', 'integer', Rule::exists('lesson_blocks', 'id')->where('lesson_id', $lesson->id)],
            'video_time' => ['nullable', 'integer', 'min:0', 'max:86400'],
        ]);
    }
}
