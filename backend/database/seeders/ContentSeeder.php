<?php

namespace Database\Seeders;

use App\Models\LearningPath;
use App\Models\User;
use App\Services\ContentImportService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Các khóa học viết bằng Markdown trong thư mục content/ (định dạng: docs/import-markdown.md).
 * Tạo trước giảng viên và lộ trình để file khóa học tham chiếu bằng "instructor: email" và "path: tên lộ trình".
 */
class ContentSeeder extends Seeder
{
    // Giảng viên mẫu, mật khẩu "password"
    private const INSTRUCTORS = [
        ['Nguyễn Minh Khoa', 'khoa.nguyen@eduquest.test'],
        ['Trần Thu Hà', 'ha.tran@eduquest.test'],
        ['Lê Quốc Bảo', 'bao.le@eduquest.test'],
        ['Phạm Đức Long', 'long.pham@eduquest.test'],
    ];

    private const PATHS = [
        ['Lập trình Web Frontend', 'Từ HTML, CSS tới JavaScript, TypeScript và React để làm giao diện web hiện đại.'],
        ['Lập trình Backend', 'Xây dựng máy chủ và API với Node.js, PHP/Laravel; xác thực và phân quyền người dùng.'],
        ['Cơ sở dữ liệu chuyên sâu', 'SQL nâng cao, thiết kế CSDL, index, transaction và NoSQL.'],
        ['Thuật toán và tư duy lập trình', 'Big-O, đệ quy, sắp xếp, đồ thị và quy hoạch động, minh họa bằng JavaScript.'],
        ['DevOps và triển khai', 'Git, Linux, Docker và CI/CD để đưa ứng dụng lên máy chủ.'],
        ['Bảo mật ứng dụng web', 'Các lỗ hổng phổ biến theo OWASP và cách phòng chống.'],
    ];

    public function run(User $instructor): void
    {
        foreach (self::INSTRUCTORS as [$name, $email]) {
            User::factory()->instructor()->create(['name' => $name, 'email' => $email]);
        }
        foreach (self::PATHS as [$title, $description]) {
            LearningPath::create(['title' => $title, 'slug' => Str::slug($title), 'description' => $description]);
        }

        foreach (glob(base_path('../content/*'), GLOB_ONLYDIR) as $directory) {
            app(ContentImportService::class)->import($directory, $instructor, publish: true);
        }
    }
}
