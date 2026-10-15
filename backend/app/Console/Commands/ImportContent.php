<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\ContentImportService;
use Illuminate\Console\Command;
use RuntimeException;

// php artisan content:import content/mang-javascript --publish
class ImportContent extends Command
{
    protected $signature = 'content:import
        {path : Thư mục khóa học, vd. content/mang-javascript}
        {--instructor= : Email giảng viên sở hữu khóa mới (mặc định: quản trị viên đầu tiên)}
        {--publish : Xuất bản khóa học ngay}';

    protected $description = 'Nạp hoặc cập nhật một khóa học từ thư mục Markdown (định dạng: docs/import-markdown.md)';

    public function handle(ContentImportService $importer): int
    {
        $directory = $this->resolve($this->argument('path'));
        if (! $directory) {
            $this->error('Không tìm thấy thư mục '.$this->argument('path'));

            return self::FAILURE;
        }

        $email = $this->option('instructor');
        $instructor = $email ? User::firstWhere('email', $email) : User::where('role', 'admin')->orderBy('id')->first();
        if (! $instructor) {
            $this->error($email ? "Không có người dùng {$email}." : 'Chưa có tài khoản quản trị viên, hãy dùng --instructor=email.');

            return self::FAILURE;
        }

        try {
            $summary = $importer->import($directory, $instructor, (bool) $this->option('publish'));
        } catch (RuntimeException $error) {
            $this->error($error->getMessage());

            return self::FAILURE;
        }

        $this->info("Khóa \"{$summary['course']}\" (/courses/{$summary['slug']}): {$summary['created']} bài mới, {$summary['updated']} bài cập nhật, {$summary['unchanged']} bài giữ nguyên.");

        return self::SUCCESS;
    }

    // Đường dẫn tương đối: thử từ thư mục đang đứng, thư mục backend, rồi gốc dự án
    private function resolve(string $path): ?string
    {
        foreach ([$path, base_path($path), base_path('../'.$path)] as $candidate) {
            if (is_dir($candidate)) {
                return realpath($candidate);
            }
        }

        return null;
    }
}
