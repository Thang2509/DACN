<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\LearningPath;
use App\Models\Lesson;
use App\Models\LessonBlock;
use App\Models\User;
use App\Services\ContentImportService;
use Database\Seeders\ContentSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Tests\TestCase;

class ContentImportTest extends TestCase
{
    use RefreshDatabase;

    private const SAMPLE = 'content/mang-javascript';

    protected function setUp(): void
    {
        parent::setUp();
        User::factory()->admin()->create();
    }

    public function test_doc_cac_loai_khoi(): void
    {
        $body = <<<'MD'
        ## Phần 1
        Đoạn văn **thường**.
        ```sql
        SELECT * FROM t;
        ```
        ```quiz test
        ? Câu hỏi?
        - Sai
        * Đúng
        > Giải thích
        ```
        ```code sql
        @instructions Lấy tên
        @setup
        CREATE TABLE t (name TEXT);
        @solution
        SELECT name FROM t;
        ```
        ```flashcard
        A :: B
        ```
        ```video
        https://youtu.be/abc
        Chú thích
        ```
        MD;

        $blocks = app(ContentImportService::class)->blocks($body);

        $this->assertSame(['section', 'markdown', 'quiz', 'code', 'flashcard', 'video'], array_column($blocks, 0));
        $this->assertStringContainsString('SELECT * FROM t;', $blocks[1][1]['text']); // code minh họa nằm trong markdown
        $this->assertSame(['question' => 'Câu hỏi?', 'options' => ['Sai', 'Đúng'], 'answer' => 1, 'explanation' => 'Giải thích'], $blocks[2][1]['questions'][0]);
        $this->assertSame('test', $blocks[2][1]['variant']);
        $this->assertSame(['language' => 'sql', 'instructions' => 'Lấy tên', 'setup' => 'CREATE TABLE t (name TEXT);', 'solution' => 'SELECT name FROM t;'], $blocks[3][1]);
        $this->assertSame([['front' => 'A', 'back' => 'B']], $blocks[4][1]['cards']);
        $this->assertSame(['url' => 'https://youtu.be/abc', 'caption' => 'Chú thích'], $blocks[5][1]);
    }

    public function test_nap_khoa_mau_va_chay_lai_khong_doi(): void
    {
        $this->artisan('content:import', ['path' => self::SAMPLE, '--publish' => true])
            ->expectsOutputToContain('3 bài mới')
            ->assertSuccessful();

        $course = Course::firstWhere('slug', 'mang-trong-javascript');
        $this->assertSame([Course::STATUS_PUBLISHED, 'intermediate', 2, 3], [$course->status, $course->level, $course->chapters()->count(), $course->lessons()->count()]);
        $this->assertSame(['Làm quen với mảng', 'Hàm bậc cao'], $course->chapters()->orderBy('position')->pluck('title')->all());
        $this->assertTrue(LearningPath::firstWhere('title', 'Lập trình căn bản')->courses->contains($course));

        $first = $course->lessons()->where('lessons.slug', 'tao-va-truy-cap-mang')->first();
        $this->assertTrue($first->is_preview);
        $this->assertSame(['section', 'markdown', 'quiz', 'section', 'markdown', 'animation', 'code', 'section', 'flashcard'], $first->blocks()->pluck('type')->all());
        $blockIds = LessonBlock::pluck('id')->all();

        // Chạy lại: không bài nào đổi, khối giữ nguyên id (không mất tiến độ quiz/flashcard)
        $this->artisan('content:import', ['path' => self::SAMPLE])->expectsOutputToContain('3 bài giữ nguyên')->assertSuccessful();
        $this->assertSame($blockIds, LessonBlock::pluck('id')->all());
        $this->assertSame(Course::STATUS_PUBLISHED, $course->refresh()->status);
    }

    public function test_seeder_nap_du_moi_khoa_trong_thu_muc_content(): void
    {
        app(ContentSeeder::class)->run(User::factory()->instructor()->create());

        $this->assertSame(count(glob(base_path('../content/*'), GLOB_ONLYDIR)), Course::where('status', Course::STATUS_PUBLISHED)->count());
        $this->assertSame(count(glob(base_path('../content/*/[0-9]*.md'))), Lesson::count());
        $this->assertSame('khoa.nguyen@eduquest.test', Course::firstWhere('slug', 'html-co-ban')->instructor->email);
        $this->assertSame('html-co-ban', LearningPath::firstWhere('title', 'Lập trình Web Frontend')->courses->first()->slug);
    }

    public function test_gan_giang_vien_va_vi_tri_lo_trinh_theo_phan_dau_file(): void
    {
        $owner = User::factory()->instructor()->create(['email' => 'gv@eduquest.test']);
        $fallback = User::factory()->instructor()->create();
        $directory = storage_path('framework/testing/import-meta');
        File::ensureDirectoryExists($directory);
        File::put("$directory/01-bai.md", "---\ntitle: Bài 1\nchapter: Chương 1\n---\n## Phần 1\nNội dung");
        $meta = "level: beginner\ncategory: programming\npath: Lộ trình thử";

        // Khóa A: giảng viên có tài khoản, vị trí ghi rõ; khóa B: email không tồn tại, không ghi vị trí
        File::put("$directory/khoa-hoc.md", "---\ntitle: Khóa A\n$meta\ninstructor: gv@eduquest.test\npath_position: 5\n---\nGiới thiệu");
        app(ContentImportService::class)->import($directory, $fallback);
        File::put("$directory/khoa-hoc.md", "---\ntitle: Khóa B\n$meta\ninstructor: khong-co@eduquest.test\n---\nGiới thiệu");
        app(ContentImportService::class)->import($directory, $fallback);
        File::deleteDirectory($directory);

        $this->assertSame($owner->id, Course::firstWhere('slug', 'khoa-a')->instructor_id);
        $this->assertSame($fallback->id, Course::firstWhere('slug', 'khoa-b')->instructor_id);
        $positions = LearningPath::firstWhere('title', 'Lộ trình thử')->courses->pluck('pivot.position', 'slug')->all();
        $this->assertEquals(['khoa-b' => 1, 'khoa-a' => 5], $positions); // không ghi vị trí thì xếp cuối
    }

    public function test_bao_loi_ro_rang_khi_file_sai(): void
    {
        $directory = storage_path('framework/testing/import-sai');
        File::ensureDirectoryExists($directory);
        File::put("$directory/khoa-hoc.md", "---\ntitle: Khóa thử\nlevel: beginner\ncategory: frontend\n---\nGiới thiệu");
        File::put("$directory/01-bai.md", "---\ntitle: Bài 1\nchapter: Chương 1\n---\n```quiz\n? Không có đáp án đúng\n- A\n- B\n```");

        $this->artisan('content:import', ['path' => $directory])
            ->expectsOutputToContain('01-bai.md, khối 1 (quiz)')
            ->assertFailed();
        $this->assertSame(0, Course::count()); // lỗi thì không ghi gì

        File::put("$directory/01-bai.md", "---\ntitle: Bài 1\n---\nThiếu chương");
        $this->artisan('content:import', ['path' => $directory])->expectsOutputToContain('thiếu title hoặc chapter')->assertFailed();
        $this->artisan('content:import', ['path' => 'content/khong-co'])->assertFailed();

        File::deleteDirectory($directory);
    }
}
