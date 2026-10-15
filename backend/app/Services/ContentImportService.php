<?php

namespace App\Services;

use App\Http\Requests\SaveBlocksRequest;
use App\Models\Course;
use App\Models\LearningPath;
use App\Models\User;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * Nạp khóa học từ thư mục Markdown (định dạng mô tả ở docs/import-markdown.md):
 *   khoa-hoc.md      phần đầu "---" chứa thông tin khóa, thân bài là phần giới thiệu
 *   01-ten-bai.md    mỗi bài một file, đánh số để giữ thứ tự; "## " mở một Phần,
 *                    khối đặc biệt viết trong ``` quiz / code / flashcard / video / animation
 * Chạy lại được: khóa khớp theo slug, chương theo tên, bài theo slug; khối của bài nào đổi nội dung thì thay mới.
 */
class ContentImportService
{
    private const SPECIAL_BLOCKS = ['quiz', 'code', 'flashcard', 'video', 'animation'];

    // Trả về tóm tắt: khóa học, số bài tạo mới / cập nhật / giữ nguyên
    public function import(string $directory, User $instructor, bool $publish = false): array
    {
        $coursePath = "{$directory}/khoa-hoc.md";
        if (! is_file($coursePath)) {
            throw new RuntimeException("Không thấy file {$coursePath}.");
        }
        [$courseMeta, $description] = $this->frontMatter(file_get_contents($coursePath));

        $lessons = [];
        foreach (glob("{$directory}/[0-9]*.md") as $file) {
            [$meta, $body] = $this->frontMatter(file_get_contents($file));
            if (empty($meta['title']) || empty($meta['chapter'])) {
                throw new RuntimeException(basename($file).': thiếu title hoặc chapter ở phần đầu file.');
            }
            $lessons[basename($file)] = ['meta' => $meta, 'blocks' => $this->validBlocks($this->blocks($body), basename($file))];
        }

        return DB::transaction(function () use ($courseMeta, $description, $lessons, $instructor, $publish) {
            $course = $this->saveCourse($courseMeta, $description, $instructor, $publish);
            $summary = ['course' => $course->title, 'slug' => $course->slug, 'created' => 0, 'updated' => 0, 'unchanged' => 0];
            $chapters = [];
            $positions = []; // số bài đã xếp trong từng chương, theo thứ tự tên file

            foreach ($lessons as $lesson) {
                $title = $lesson['meta']['chapter'];
                $chapters[$title] ??= $course->chapters()->firstOrCreate(['title' => $title], ['position' => 0]);
                $chapters[$title]->update(['position' => array_search($title, array_keys($chapters))]);
                $positions[$title] = ($positions[$title] ?? -1) + 1;
                $summary[$this->saveLesson($course, $chapters[$title], $lesson, $positions[$title])]++;
            }

            return $summary;
        });
    }

    // Phần đầu file giữa hai dòng "---": mỗi dòng "khóa: giá trị"
    public function frontMatter(string $text): array
    {
        $text = str_replace("\r\n", "\n", $text);
        if (! preg_match('/^---\n(.*?)\n---\n?(.*)$/s', $text, $match)) {
            return [[], trim($text)];
        }

        $meta = [];
        foreach (explode("\n", $match[1]) as $line) {
            if (str_contains($line, ':')) {
                [$key, $value] = array_map('trim', explode(':', $line, 2));
                $meta[$key] = $value;
            }
        }

        return [$meta, trim($match[2])];
    }

    /**
     * Thân bài → danh sách khối [type, content]:
     * "## Tiêu đề" → khối section; đoạn văn thường → khối markdown;
     * ```quiz / code / flashcard / video / animation → khối tương ứng; ```sql, ```js… vẫn là code minh họa trong markdown.
     */
    public function blocks(string $body): array
    {
        $blocks = [];
        $text = [];
        $flushText = function () use (&$blocks, &$text) {
            $markdown = trim(implode("\n", $text));
            if ($markdown !== '') {
                $blocks[] = ['markdown', ['text' => $markdown]];
            }
            $text = [];
        };

        $lines = explode("\n", str_replace("\r\n", "\n", $body));
        for ($i = 0; $i < count($lines); $i++) {
            $line = $lines[$i];
            $fence = preg_match('/^```(\w+)\s*(.*)$/', $line, $match) ? $match : null;

            if ($fence && in_array($fence[1], self::SPECIAL_BLOCKS, true)) {
                $flushText();
                $inner = [];
                for ($i++; $i < count($lines) && rtrim($lines[$i]) !== '```'; $i++) {
                    $inner[] = $lines[$i];
                }
                $blocks[] = [$fence[1], $this->{$fence[1]}(trim($fence[2]), $inner)];
            } elseif ($fence) {
                // Code minh họa thường: chép nguyên khối vào đoạn markdown
                $text[] = $line;
                for ($i++; $i < count($lines); $i++) {
                    $text[] = $lines[$i];
                    if (rtrim($lines[$i]) === '```') {
                        break;
                    }
                }
            } elseif (str_starts_with($line, '## ')) {
                $flushText();
                $blocks[] = ['section', ['title' => trim(substr($line, 3))]];
            } else {
                $text[] = $line;
            }
        }
        $flushText();

        return $blocks;
    }

    // "? câu hỏi", "- lựa chọn sai", "* lựa chọn đúng", "> giải thích"
    private function quiz(string $variant, array $lines): array
    {
        $questions = [];
        foreach ($lines as $line) {
            $line = trim($line);
            $current = count($questions) - 1;
            if (str_starts_with($line, '? ')) {
                $questions[] = ['question' => substr($line, 2), 'options' => [], 'answer' => null, 'explanation' => null];
            } elseif ($current >= 0 && (str_starts_with($line, '- ') || str_starts_with($line, '* '))) {
                if ($line[0] === '*') {
                    $questions[$current]['answer'] = count($questions[$current]['options']);
                }
                $questions[$current]['options'][] = substr($line, 2);
            } elseif ($current >= 0 && str_starts_with($line, '> ')) {
                $questions[$current]['explanation'] = trim(($questions[$current]['explanation'] ?? '').' '.substr($line, 2));
            }
        }

        return ['variant' => $variant ?: 'quick', 'questions' => $questions];
    }

    // "@instructions", "@starter", "@solution", "@setup", "@expected": mỗi mục kéo dài tới mục sau
    private function code(string $language, array $lines): array
    {
        $content = ['language' => $language === 'js' ? 'javascript' : $language];
        $field = null;
        foreach ($lines as $line) {
            if (preg_match('/^@(\w+)\s?(.*)$/', $line, $match)) {
                $field = $match[1];
                $content[$field] = $match[2];
            } elseif ($field) {
                $content[$field] = ltrim($content[$field]."\n".$line, "\n");
            }
        }

        return array_map(fn ($value) => is_string($value) ? trim($value, "\n") : $value, $content);
    }

    // "mặt trước :: mặt sau"
    private function flashcard(string $info, array $lines): array
    {
        $cards = [];
        foreach ($lines as $line) {
            if (str_contains($line, '::')) {
                [$front, $back] = array_map('trim', explode('::', $line, 2));
                $cards[] = ['front' => $front, 'back' => $back];
            }
        }

        return ['cards' => $cards];
    }

    // Dòng 1: đường dẫn video; dòng 2 (nếu có): chú thích
    private function video(string $info, array $lines): array
    {
        $lines = array_values(array_filter(array_map('trim', $lines)));

        return ['url' => $lines[0] ?? '', 'caption' => $lines[1] ?? null];
    }

    // ```animation BubbleSortAnimation, thân khối là tham số JSON (có thể bỏ trống)
    private function animation(string $component, array $lines): array
    {
        $json = trim(implode("\n", $lines));
        $params = $json === '' ? null : json_decode($json, true);

        // false: báo cho bước kiểm tra biết JSON viết sai
        return ['component' => $component, 'params' => $json !== '' && $params === null ? false : $params];
    }

    // Kiểm tra nội dung từng khối bằng chính quy tắc của trình soạn khối; bỏ các mục không thuộc loại khối
    private function validBlocks(array $blocks, string $file): array
    {
        foreach ($blocks as $i => [$type, $content]) {
            $where = "{$file}, khối ".($i + 1)." ({$type})";
            if ($type === 'animation' && array_key_exists('params', $content) && $content['params'] === false) {
                throw new RuntimeException("{$where}: tham số không phải JSON hợp lệ.");
            }
            $rules = SaveBlocksRequest::CONTENT_RULES[$type];
            $allowed = collect(array_keys($rules))->map(fn ($key) => explode('.', $key)[0])->unique()->all();
            $content = Arr::only($content, $allowed);

            $validator = Validator::make($content, $rules);
            if ($validator->fails()) {
                throw new RuntimeException("{$where}: ".$validator->errors()->first());
            }
            $blocks[$i] = [$type, $content];
        }

        return $blocks;
    }

    private function saveCourse(array $meta, string $description, User $instructor, bool $publish): Course
    {
        $validator = Validator::make($meta, [
            'title' => 'required|string|max:200',
            'level' => 'required|in:'.implode(',', Course::LEVELS),
            'category' => 'required|in:'.implode(',', Course::CATEGORIES),
            'price' => 'nullable|integer|min:0',
        ]);
        if ($validator->fails()) {
            throw new RuntimeException('khoa-hoc.md: '.$validator->errors()->first());
        }

        $slug = $meta['slug'] ?? Str::slug($meta['title']);
        $course = Course::firstWhere('slug', $slug) ?? new Course;
        $course->slug = $slug; // slug không nằm trong $fillable nên gán riêng
        $course->fill([
            'title' => $meta['title'],
            'summary' => $meta['summary'] ?? null,
            'description' => $description,
            'level' => $meta['level'],
            'category' => $meta['category'],
            'price' => (int) ($meta['price'] ?? 0),
        ]);
        // "instructor: email" trong file: gán cho giảng viên đó nếu có tài khoản, không thì dùng giảng viên của lệnh import
        $owner = empty($meta['instructor']) ? null : User::firstWhere('email', $meta['instructor']);
        $course->instructor_id = $owner?->id ?? $course->instructor_id ?? $instructor->id;
        $course->status ??= Course::STATUS_DRAFT;
        if ($publish) {
            $course->status = Course::STATUS_PUBLISHED;
            $course->published_at ??= now();
        }
        $course->save();

        // "path: tên lộ trình", "path_position: thứ tự trong lộ trình" (bỏ trống thì xếp cuối)
        if (! empty($meta['path'])) {
            $path = LearningPath::firstOrCreate(['title' => $meta['path']], ['slug' => Str::slug($meta['path'])]);
            $position = isset($meta['path_position']) ? (int) $meta['path_position'] : $path->courses()->count();
            $path->courses()->syncWithoutDetaching([$course->id => ['position' => $position]]);
        }

        return $course;
    }

    // Trả về 'created' | 'updated' | 'unchanged'
    private function saveLesson(Course $course, $chapter, array $lesson, int $position): string
    {
        $meta = $lesson['meta'];
        $slug = $meta['slug'] ?? Str::slug($meta['title']);
        $existing = $course->lessons()->where('lessons.slug', $slug)->first();
        $model = $existing ?? $chapter->lessons()->make();
        $model->fill([
            'title' => $meta['title'],
            'summary' => $meta['summary'] ?? null,
            'intro_video_url' => $meta['video'] ?? null,
            'duration_minutes' => (int) ($meta['duration'] ?? 10),
            'is_preview' => filter_var($meta['preview'] ?? false, FILTER_VALIDATE_BOOLEAN),
            'position' => $position,
        ]);
        $model->chapter_id = $chapter->id;
        $model->slug = $slug;
        $model->save();

        // Chỉ thay khối khi nội dung khác đi, để không mất tiến độ quiz/flashcard của học viên khi chạy lại
        $blocks = array_map(fn ($block, $i) => ['type' => $block[0], 'content' => $block[1], 'position' => $i], $lesson['blocks'], array_keys($lesson['blocks']));
        $current = $model->blocks()->get(['type', 'content', 'position'])->map(fn ($block) => $block->only('type', 'content', 'position'))->all();
        if ($existing && $current == $blocks) {
            return $model->wasChanged() ? 'updated' : 'unchanged';
        }
        $model->blocks()->delete();
        $model->blocks()->createMany($blocks);

        return $existing ? 'updated' : 'created';
    }
}
