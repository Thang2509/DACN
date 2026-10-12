<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\LearningPath;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

// 3 khóa demo. Nội dung đầy đủ sẽ nhập sau bằng lệnh content:import
class DemoCourseSeeder extends Seeder
{
    private const SQL_SETUP = <<<'SQL'
        CREATE TABLE students (id INTEGER PRIMARY KEY, name TEXT, city TEXT, score INTEGER);
        INSERT INTO students VALUES (1, 'An', 'Hà Nội', 8), (2, 'Bình', 'Đà Nẵng', 6), (3, 'Chi', 'Cần Thơ', 9), (4, 'Dũng', 'Hà Nội', 7);
        CREATE TABLE enrollments (student_id INTEGER, course TEXT);
        INSERT INTO enrollments VALUES (1, 'SQL'), (1, 'JavaScript'), (2, 'SQL'), (3, 'CTDL');
        SQL;

    public function run(User $instructor): void
    {
        $path = LearningPath::create([
            'title' => 'Lập trình căn bản',
            'slug' => 'lap-trinh-can-ban',
            'description' => 'Lộ trình cho người mới: JavaScript, SQL rồi Cấu trúc dữ liệu & giải thuật.',
        ]);

        foreach ([$this->javascript(), $this->sql(), $this->dataStructures()] as $position => $data) {
            $course = $this->createCourse($instructor, $data);
            $path->courses()->attach($course->id, ['position' => $position + 1]);
        }
    }

    private function createCourse(User $instructor, array $data): Course
    {
        $course = new Course(collect($data)->only(['title', 'summary', 'description', 'level', 'price'])->all());
        $course->instructor_id = $instructor->id;
        $course->slug = Str::slug($data['title']);
        $course->status = Course::STATUS_PUBLISHED;
        $course->published_at = now();
        $course->save();

        $isFirstLesson = true;
        foreach (array_values($data['chapters']) as $c => [$chapterTitle, $lessons]) {
            $chapter = $course->chapters()->create(['title' => $chapterTitle, 'position' => $c + 1]);

            foreach ($lessons as $l => $lessonData) {
                $lesson = $chapter->lessons()->create([
                    'title' => $lessonData['title'],
                    'position' => $l + 1,
                    'is_preview' => $isFirstLesson, // bài đầu tiên cho học thử
                ]);
                $isFirstLesson = false;

                foreach ($this->blocksOf($lessonData) as $b => [$type, $content]) {
                    $lesson->blocks()->create(['type' => $type, 'content' => $content, 'position' => $b + 1]);
                }
            }
        }

        return $course;
    }

    // Thứ tự khối: lý thuyết → hoạt ảnh → code → quiz → flashcard
    private function blocksOf(array $lesson): array
    {
        $blocks = [];
        if (isset($lesson['text'])) {
            $blocks[] = ['markdown', ['text' => $lesson['text']]];
        }
        if (isset($lesson['animation'])) {
            $blocks[] = ['animation', $lesson['animation']];
        }
        if (isset($lesson['code'])) {
            $blocks[] = ['code', $lesson['code']];
        }
        if (isset($lesson['quiz'])) {
            [$question, $options, $answer, $explanation] = $lesson['quiz'];
            $blocks[] = ['quiz', ['questions' => [compact('question', 'options', 'answer', 'explanation')]]];
        }
        if (isset($lesson['cards'])) {
            $blocks[] = ['flashcard', ['cards' => array_map(fn ($c) => ['front' => $c[0], 'back' => $c[1]], $lesson['cards'])]];
        }

        return $blocks;
    }

    private function sqlCode(string $instructions, string $starter, string $solution): array
    {
        return ['language' => 'sql', 'instructions' => $instructions, 'setup' => self::SQL_SETUP, 'starter' => $starter, 'solution' => $solution];
    }

    private function jsCode(string $instructions, string $starter, string $expected): array
    {
        return ['language' => 'javascript', 'instructions' => $instructions, 'starter' => $starter, 'expected' => $expected];
    }

    private function sql(): array
    {
        return [
            'title' => 'SQL cơ bản',
            'level' => 'beginner',
            'price' => 0,
            'summary' => 'Truy vấn cơ sở dữ liệu quan hệ từ con số 0, thực hành ngay trên trình duyệt.',
            'description' => 'Học SELECT, WHERE, ORDER BY, hàm gộp, GROUP BY và JOIN qua các bài tập với bảng dữ liệu sinh viên.',
            'chapters' => [
                ['Làm quen với SQL', [
                    ['title' => 'Cơ sở dữ liệu và SQL là gì?',
                        'text' => "## Cơ sở dữ liệu\nCơ sở dữ liệu (CSDL) là nơi lưu trữ dữ liệu có tổ chức. **SQL** (Structured Query Language) là ngôn ngữ để đọc và thay đổi dữ liệu trong CSDL quan hệ như MySQL, PostgreSQL, SQLite.",
                        'quiz' => ['SQL dùng để làm gì?', ['Thiết kế giao diện web', 'Truy vấn và thao tác dữ liệu', 'Vẽ đồ họa 3D'], 1, 'SQL là ngôn ngữ truy vấn dữ liệu trong CSDL quan hệ.']],
                    ['title' => 'Bảng, cột và dòng',
                        'text' => "Dữ liệu được lưu trong **bảng**. Mỗi **cột** là một thuộc tính (tên, điểm…), mỗi **dòng** là một bản ghi. Cột **khóa chính** giúp phân biệt các dòng.",
                        'quiz' => ['Mỗi dòng trong bảng `students` biểu diễn gì?', ['Một sinh viên', 'Một thuộc tính', 'Một bảng khác'], 0, 'Mỗi dòng là một bản ghi, ở đây là một sinh viên.']],
                ]],
                ['Truy vấn dữ liệu', [
                    ['title' => 'SELECT – lấy dữ liệu',
                        'text' => "`SELECT cột FROM bảng;` lấy dữ liệu. Dùng `*` để lấy mọi cột.\n\n```sql\nSELECT name, score FROM students;\n```",
                        'code' => $this->sqlCode('Lấy tên và thành phố của mọi sinh viên.', 'SELECT ', 'SELECT name, city FROM students;')],
                    ['title' => 'WHERE – lọc dữ liệu',
                        'text' => "`WHERE` giữ lại các dòng thỏa điều kiện, kết hợp được bằng `AND`, `OR`.\n\n```sql\nSELECT * FROM students WHERE city = 'Hà Nội';\n```",
                        'code' => $this->sqlCode('Tìm sinh viên có điểm từ 8 trở lên.', 'SELECT * FROM students WHERE ', 'SELECT * FROM students WHERE score >= 8;')],
                    ['title' => 'ORDER BY và LIMIT',
                        'text' => '`ORDER BY cột DESC` sắp xếp giảm dần, `LIMIT n` lấy n dòng đầu.',
                        'code' => $this->sqlCode('Lấy 2 sinh viên điểm cao nhất.', 'SELECT name, score FROM students ', 'SELECT name, score FROM students ORDER BY score DESC LIMIT 2;')],
                    ['title' => 'Hàm gộp: COUNT, SUM, AVG',
                        'text' => '`COUNT(*)` đếm số dòng, `SUM` tính tổng, `AVG` tính trung bình, `MAX`/`MIN` lấy lớn nhất/nhỏ nhất.',
                        'code' => $this->sqlCode('Tính điểm trung bình của tất cả sinh viên.', 'SELECT ', 'SELECT AVG(score) FROM students;'),
                        'quiz' => ['Hàm nào đếm số dòng?', ['SUM', 'COUNT', 'AVG', 'MAX'], 1, 'COUNT(*) trả về số dòng thỏa điều kiện.']],
                ]],
                ['Nhóm và nối bảng', [
                    ['title' => 'GROUP BY và HAVING',
                        'text' => '`GROUP BY` gom các dòng cùng giá trị để áp dụng hàm gộp cho từng nhóm. `HAVING` lọc theo kết quả gộp.',
                        'code' => $this->sqlCode('Đếm số sinh viên ở mỗi thành phố.', 'SELECT city, COUNT(*) FROM students ', 'SELECT city, COUNT(*) FROM students GROUP BY city;')],
                    ['title' => 'JOIN – nối bảng',
                        'text' => "`JOIN` ghép dòng của hai bảng theo điều kiện, thường là khóa ngoại.\n\n```sql\nSELECT s.name, e.course\nFROM students s JOIN enrollments e ON e.student_id = s.id;\n```",
                        'code' => $this->sqlCode('Liệt kê tên sinh viên đã đăng ký khóa SQL.', 'SELECT s.name FROM students s JOIN enrollments e ', "SELECT s.name FROM students s JOIN enrollments e ON e.student_id = s.id WHERE e.course = 'SQL';")],
                    ['title' => 'Tổng kết khóa học',
                        'text' => 'Ôn lại các câu lệnh chính bằng flashcard bên dưới.',
                        'cards' => [['SELECT', 'Lấy dữ liệu từ bảng'], ['WHERE', 'Lọc dòng theo điều kiện'], ['GROUP BY', 'Gom nhóm để dùng hàm gộp'], ['JOIN', 'Nối dữ liệu giữa các bảng']]],
                ]],
            ],
        ];
    }

    private function javascript(): array
    {
        return [
            'title' => 'JavaScript nền tảng',
            'level' => 'beginner',
            'price' => 199000,
            'summary' => 'Nắm vững biến, điều kiện, vòng lặp, hàm, mảng và đối tượng trong JavaScript.',
            'description' => 'Khóa học cho người mới bắt đầu lập trình, mỗi bài đều có ô code chạy ngay trên trình duyệt.',
            'chapters' => [
                ['Bắt đầu với JavaScript', [
                    ['title' => 'JavaScript là gì?',
                        'text' => 'JavaScript là ngôn ngữ lập trình của web: chạy trong trình duyệt để tạo trang tương tác và chạy cả ở máy chủ với Node.js.',
                        'quiz' => ['JavaScript có thể chạy ở đâu?', ['Chỉ trong trình duyệt', 'Chỉ trên máy chủ', 'Cả trình duyệt và máy chủ (Node.js)'], 2, 'Node.js cho phép chạy JavaScript ngoài trình duyệt.']],
                    ['title' => 'Biến: let và const',
                        'text' => "Dùng `let` cho giá trị có thể thay đổi, `const` cho giá trị cố định.\n\n```js\nconst name = 'An'\nlet age = 20\nage = age + 1\n```",
                        'code' => $this->jsCode('Khai báo biến `year` = 2026 rồi in ra màn hình.', "const year = \nconsole.log(year)", '2026')],
                    ['title' => 'Kiểu dữ liệu',
                        'text' => 'Các kiểu cơ bản: `number`, `string`, `boolean`, `null`, `undefined`, cùng `object` và `array`. Dùng `typeof` để kiểm tra kiểu.',
                        'quiz' => ['`typeof 42` trả về gì?', ['"string"', '"number"', '"object"'], 1, '42 là một số nên typeof trả về "number".']],
                ]],
                ['Điều kiện và vòng lặp', [
                    ['title' => 'Câu lệnh if/else',
                        'text' => "```js\nif (score >= 5) {\n  console.log('Đậu')\n} else {\n  console.log('Rớt')\n}\n```",
                        'code' => $this->jsCode('In "Chẵn" nếu n là số chẵn, ngược lại in "Lẻ".', "const n = 8\n", 'Chẵn')],
                    ['title' => 'Vòng lặp for và while',
                        'text' => '`for` dùng khi biết trước số lần lặp, `while` lặp đến khi điều kiện sai.',
                        'code' => $this->jsCode('Tính tổng các số từ 1 đến 10 rồi in ra.', "let sum = 0\n", '55')],
                ]],
                ['Hàm, mảng và đối tượng', [
                    ['title' => 'Hàm',
                        'text' => "Hàm gom đoạn code dùng lại nhiều lần.\n\n```js\nconst square = (x) => x * x\n```",
                        'code' => $this->jsCode('Viết hàm `max(a, b)` trả về số lớn hơn, in `max(3, 7)`.', "function max(a, b) {\n}\nconsole.log(max(3, 7))", '7')],
                    ['title' => 'Mảng: map và filter',
                        'text' => '`map` biến đổi từng phần tử, `filter` giữ lại phần tử thỏa điều kiện; cả hai trả về mảng mới.',
                        'code' => $this->jsCode('Từ mảng `nums`, in mảng các số chẵn.', "const nums = [1, 2, 3, 4, 5, 6]\n", '[ 2, 4, 6 ]')],
                    ['title' => 'Đối tượng',
                        'text' => "Đối tượng lưu dữ liệu dạng khóa – giá trị.\n\n```js\nconst user = { name: 'An', level: 3 }\nconsole.log(user.name)\n```",
                        'code' => $this->jsCode('Tạo đối tượng `pet` có `name` là "Shiba" và in `pet.name`.', "const pet = {}\n", 'Shiba'),
                        'quiz' => ['Cách nào lấy giá trị khóa `name` của `user`?', ['user->name', 'user.name', 'user::name'], 1, 'Dùng dấu chấm hoặc user["name"].']],
                    ['title' => 'Tổng kết khóa học',
                        'text' => 'Ôn lại kiến thức với flashcard.',
                        'cards' => [['let và const', 'let thay đổi được, const không gán lại được'], ['map', 'Biến đổi từng phần tử, trả mảng mới'], ['filter', 'Lọc phần tử theo điều kiện'], ['Arrow function', '(x) => x * 2']]],
                ]],
            ],
        ];
    }

    private function dataStructures(): array
    {
        return [
            'title' => 'Cấu trúc dữ liệu & giải thuật',
            'level' => 'intermediate',
            'price' => 299000,
            'summary' => 'Big-O, ngăn xếp, hàng đợi, danh sách liên kết, tìm kiếm và sắp xếp với hoạt ảnh trực quan.',
            'description' => 'Hiểu bản chất các cấu trúc dữ liệu và thuật toán kinh điển, cài đặt bằng JavaScript.',
            'chapters' => [
                ['Nền tảng', [
                    ['title' => 'Độ phức tạp thuật toán (Big-O)',
                        'text' => 'Big-O mô tả thời gian chạy tăng thế nào khi dữ liệu lớn dần: O(1) hằng số, O(log n), O(n), O(n log n), O(n²).',
                        'quiz' => ['Duyệt qua mảng n phần tử một lần có độ phức tạp?', ['O(1)', 'O(n)', 'O(n²)'], 1, 'Mỗi phần tử được xử lý một lần nên là O(n).']],
                    ['title' => 'Mảng',
                        'text' => 'Mảng lưu phần tử liên tiếp: truy cập theo chỉ số O(1), chèn/xóa ở giữa O(n).',
                        'code' => $this->jsCode('Đảo ngược mảng `a` mà không dùng `reverse()` rồi in ra.', "const a = [1, 2, 3, 4]\n", '[ 4, 3, 2, 1 ]')],
                ]],
                ['Cấu trúc tuyến tính', [
                    ['title' => 'Ngăn xếp (Stack)',
                        'text' => 'Ngăn xếp hoạt động theo **LIFO** – vào sau ra trước: `push` thêm vào đỉnh, `pop` lấy ra từ đỉnh.',
                        'animation' => ['component' => 'StackAnimation', 'params' => ['values' => [3, 7, 1]]],
                        'code' => $this->jsCode('Dùng mảng làm ngăn xếp: push 1, 2, 3 rồi pop và in phần tử lấy ra.', "const stack = []\n", '3')],
                    ['title' => 'Hàng đợi (Queue)',
                        'text' => 'Hàng đợi hoạt động theo **FIFO** – vào trước ra trước: thêm ở cuối, lấy ở đầu.',
                        'code' => $this->jsCode('Thêm "A", "B", "C" vào hàng đợi rồi lấy ra một phần tử và in.', "const queue = []\n", 'A')],
                    ['title' => 'Danh sách liên kết',
                        'text' => 'Mỗi nút giữ giá trị và con trỏ tới nút kế tiếp. Chèn/xóa ở đầu O(1) nhưng truy cập phần tử thứ k mất O(k).',
                        'quiz' => ['Truy cập phần tử thứ k của danh sách liên kết đơn tốn?', ['O(1)', 'O(k)', 'O(log k)'], 1, 'Phải đi lần lượt từ đầu qua k nút.']],
                ]],
                ['Tìm kiếm và sắp xếp', [
                    ['title' => 'Tìm kiếm nhị phân',
                        'text' => 'Trên mảng **đã sắp xếp**, so sánh với phần tử giữa rồi bỏ đi một nửa: O(log n).',
                        'code' => $this->jsCode('Viết `binarySearch(a, x)` trả về chỉ số của x, in kết quả tìm 7.', "const a = [1, 3, 5, 7, 9]\n", '3')],
                    ['title' => 'Sắp xếp nổi bọt',
                        'text' => 'Lặp lại việc so sánh hai phần tử kề nhau và đổi chỗ nếu sai thứ tự. Đơn giản nhưng O(n²).',
                        'animation' => ['component' => 'BubbleSortAnimation', 'params' => ['values' => [5, 1, 4, 2, 8]]],
                        'code' => $this->jsCode('Cài đặt sắp xếp nổi bọt cho mảng `a` rồi in kết quả.', "const a = [5, 1, 4, 2, 8]\n", '[ 1, 2, 4, 5, 8 ]')],
                    ['title' => 'Sắp xếp nhanh (Quick Sort)',
                        'text' => 'Chọn phần tử chốt, chia mảng thành phần nhỏ hơn và lớn hơn chốt rồi sắp xếp đệ quy. Trung bình O(n log n).',
                        'quiz' => ['Độ phức tạp trung bình của Quick Sort?', ['O(n)', 'O(n log n)', 'O(n²)'], 1, 'Trường hợp xấu nhất là O(n²) khi chọn chốt kém.']],
                    ['title' => 'Tổng kết khóa học',
                        'text' => 'Ôn lại các khái niệm chính.',
                        'cards' => [['Stack', 'LIFO – vào sau ra trước'], ['Queue', 'FIFO – vào trước ra trước'], ['Tìm kiếm nhị phân', 'O(log n), cần mảng đã sắp xếp'], ['Quick Sort', 'Trung bình O(n log n)']]],
                ]],
            ],
        ];
    }
}
