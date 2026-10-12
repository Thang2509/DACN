<?php

namespace App\Services;

use App\Models\Chapter;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

// Nghiệp vụ soạn khóa học: vòng đời duyệt, chương, bài, khối nội dung
class CourseService
{
    public function create(User $instructor, array $data): Course
    {
        $course = new Course($data);
        $course->instructor_id = $instructor->id;
        $course->slug = $this->uniqueSlug($data['title']);
        $course->status = Course::STATUS_DRAFT;
        $course->save();

        return $course;
    }

    public function update(Course $course, array $data): Course
    {
        $course->fill($data);
        // Khóa đã xuất bản giữ nguyên slug để không làm hỏng đường dẫn cũ
        if ($course->isDirty('title') && $course->isEditableDraft()) {
            $course->slug = $this->uniqueSlug($course->title, $course->id);
        }
        $course->save();

        return $course;
    }

    public function updateThumbnail(Course $course, UploadedFile $file): Course
    {
        $oldPath = $course->thumbnail_path;
        $course->thumbnail_path = $file->store('thumbnails', 'public');
        $course->save();

        if ($oldPath) {
            Storage::disk('public')->delete($oldPath);
        }

        return $course;
    }

    public function delete(Course $course): void
    {
        if (! $course->isEditableDraft()) {
            $this->fail('course', 'Chỉ xóa được khóa học nháp hoặc bị từ chối.');
        }
        if ($course->thumbnail_path) {
            Storage::disk('public')->delete($course->thumbnail_path);
        }
        $course->delete();
    }

    public function submitForReview(Course $course): Course
    {
        if (! $course->isEditableDraft()) {
            $this->fail('course', 'Khóa học đang chờ duyệt hoặc đã xuất bản.');
        }
        if (! $course->lessons()->exists()) {
            $this->fail('course', 'Cần ít nhất 1 bài học trước khi gửi duyệt.');
        }

        $course->status = Course::STATUS_PENDING;
        $course->review_note = null;
        $course->save();

        return $course;
    }

    public function approve(Course $course): Course
    {
        $this->ensurePending($course);
        $course->status = Course::STATUS_PUBLISHED;
        $course->published_at ??= now();
        $course->review_note = null;
        $course->save();

        return $course;
    }

    public function reject(Course $course, string $note): Course
    {
        $this->ensurePending($course);
        $course->status = Course::STATUS_REJECTED;
        $course->review_note = $note;
        $course->save();

        return $course;
    }

    public function addChapter(Course $course, string $title): Chapter
    {
        $position = (int) $course->chapters()->reorder()->max('position') + 1;

        return $course->chapters()->create(['title' => $title, 'position' => $position]);
    }

    public function addLesson(Chapter $chapter, string $title): Lesson
    {
        $position = (int) $chapter->lessons()->reorder()->max('position') + 1;

        return $chapter->lessons()->create(['title' => $title, 'position' => $position]);
    }

    /**
     * Sắp xếp lại chương và bài; bài có thể chuyển sang chương khác.
     * $chapters dạng [['id' => 1, 'lessons' => [3, 1, 2]], ...] và phải chứa đủ mọi chương/bài của khóa.
     */
    public function reorderOutline(Course $course, array $chapters): void
    {
        $givenChapterIds = collect($chapters)->pluck('id')->sort()->values()->all();
        $givenLessonIds = collect($chapters)->pluck('lessons')->flatten()->sort()->values()->all();
        $chapterIds = $course->chapters()->pluck('id')->sort()->values()->all();
        $lessonIds = $course->lessons()->pluck('lessons.id')->sort()->values()->all();

        if ($givenChapterIds != $chapterIds || $givenLessonIds != $lessonIds) {
            $this->fail('chapters', 'Danh sách chương/bài không khớp với khóa học, hãy tải lại trang.');
        }

        DB::transaction(function () use ($chapters) {
            foreach (array_values($chapters) as $i => $chapter) {
                Chapter::whereKey($chapter['id'])->update(['position' => $i + 1]);
                foreach (array_values($chapter['lessons']) as $j => $lessonId) {
                    Lesson::whereKey($lessonId)->update(['chapter_id' => $chapter['id'], 'position' => $j + 1]);
                }
            }
        });
    }

    /**
     * Lưu toàn bộ khối của bài theo thứ tự gửi lên:
     * khối có id cũ thì cập nhật (giữ id cho ghi chú gắn khối), không có thì tạo mới, khối bị bỏ thì xóa.
     */
    public function syncBlocks(Lesson $lesson, array $blocks): Collection
    {
        return DB::transaction(function () use ($lesson, $blocks) {
            $existing = $lesson->blocks()->get()->keyBy('id');
            $keptIds = [];

            foreach (array_values($blocks) as $index => $data) {
                $block = $existing->get($data['id'] ?? null) ?? $lesson->blocks()->make();
                $block->fill([
                    'type' => $data['type'],
                    'content' => $data['content'],
                    'position' => $index + 1,
                ])->save();
                $keptIds[] = $block->id;
            }

            $lesson->blocks()->whereNotIn('id', $keptIds)->delete();

            return $lesson->blocks()->get();
        });
    }

    private function ensurePending(Course $course): void
    {
        if ($course->status !== Course::STATUS_PENDING) {
            $this->fail('course', 'Khóa học không ở trạng thái chờ duyệt.');
        }
    }

    // "Cấu trúc dữ liệu" → "cau-truc-du-lieu", trùng thì thêm -2, -3...
    private function uniqueSlug(string $title, ?int $ignoreId = null): string
    {
        $base = Str::slug($title) ?: 'khoa-hoc';
        $slug = $base;
        $suffix = 2;
        while (Course::where('slug', $slug)->when($ignoreId, fn ($q) => $q->whereKeyNot($ignoreId))->exists()) {
            $slug = $base.'-'.$suffix++;
        }

        return $slug;
    }

    private function fail(string $field, string $message): never
    {
        throw ValidationException::withMessages([$field => $message]);
    }
}
