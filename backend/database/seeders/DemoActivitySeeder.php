<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\LessonProgress;
use App\Models\MinigameScore;
use App\Models\Order;
use App\Models\QuizAttempt;
use App\Models\User;
use App\Services\RewardService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

/**
 * Hoạt động mẫu trong 30 ngày gần nhất để demo bảng xếp hạng và trang thống kê:
 * 6 học viên đăng ký học, làm quiz, nhận XP (tuần trước và tuần này), mua khóa có phí, chơi minigame.
 * XP vẫn ghi qua RewardService để sổ cái và ví luôn khớp nhau.
 */
class DemoActivitySeeder extends Seeder
{
    private const STUDENTS = ['Trần Minh Anh', 'Lê Hoàng Bảo', 'Phạm Thu Chi', 'Võ Đức Duy', 'Nguyễn Gia Hân', 'Đặng Quốc Khánh'];

    public function run(): void
    {
        mt_srand(2026); // cùng một bộ dữ liệu mỗi lần seed
        $today = now();
        $sql = Course::firstWhere('slug', 'sql-co-ban');
        $js = Course::firstWhere('slug', 'javascript-nen-tang');

        foreach (self::STUDENTS as $i => $name) {
            $joined = $today->copy()->subDays(27 - $i * 4);
            $student = User::factory()->create(['name' => $name, 'email' => 'demo'.($i + 1).'@eduquest.test']);
            $student->forceFill(['created_at' => $joined])->save();

            $this->study($student, $sql, mt_rand(2, 9), $joined);
            if ($i % 2 === 0) {
                $this->buy($student, $js, $joined->copy()->addDays(1));
            }

            // XP tuần trước và tuần này để bảng xếp hạng có dữ liệu
            foreach ([8, 1] as $daysAgo) {
                Carbon::setTestNow($today->copy()->subDays($daysAgo));
                app(RewardService::class)->grant($student, "demo_activity:{$student->id}:{$daysAgo}", 'demo_activity', mt_rand(40, 450), mt_rand(10, 60));
            }
            Carbon::setTestNow();

            MinigameScore::create(['user_id' => $student->id, 'game' => $i % 2 ? 'runner' : 'keywords', 'score' => mt_rand(80, 700), 'duration_seconds' => 60]);
        }
    }

    // Học lần lượt các bài đầu của khóa, mỗi bài cách nhau 1–3 ngày; làm quiz lượt đầu đúng khoảng 70%
    private function study(User $student, Course $course, int $lessonCount, Carbon $start): void
    {
        $lessons = $course->lessons()->orderBy('chapters.position')->orderBy('lessons.position')->with('blocks')->get();
        $done = $lessons->take($lessonCount);
        $day = $start->copy();

        Enrollment::forceCreate([
            'user_id' => $student->id,
            'course_id' => $course->id,
            'created_at' => $start,
            'completed_at' => $done->count() === $lessons->count() ? $start->copy()->addDays(20) : null,
        ]);

        foreach ($done as $lesson) {
            $day = $day->copy()->addDays(mt_rand(1, 3))->min(now());
            foreach ($lesson->blocks->where('type', 'quiz') as $block) {
                $answers = array_map(
                    fn ($question) => mt_rand(1, 10) <= 7 ? $question['answer'] : ($question['answer'] + 1) % count($question['options']),
                    $block->content['questions'],
                );
                QuizAttempt::create([
                    'user_id' => $student->id,
                    'lesson_block_id' => $block->id,
                    'answers' => $answers,
                    'correct_count' => count(array_filter($answers, fn ($answer, $i) => $answer === $block->content['questions'][$i]['answer'], ARRAY_FILTER_USE_BOTH)),
                    'completed_at' => $day,
                ]);
            }
            LessonProgress::create(['user_id' => $student->id, 'lesson_id' => $lesson->id, 'completed_at' => $day]);
        }
    }

    // Đơn MoMo đã thanh toán (dữ liệu mẫu, không gọi MoMo) và ghi danh theo đơn
    private function buy(User $student, Course $course, Carbon $paidAt): void
    {
        $order = Order::forceCreate([
            'user_id' => $student->id,
            'course_id' => $course->id,
            'original_price' => $course->price,
            'amount' => $course->price,
            'status' => Order::STATUS_PAID,
            'momo_order_id' => 'DEMO'.$student->id,
            'momo_trans_id' => (string) mt_rand(1000000, 9999999),
            'paid_at' => $paidAt,
            'created_at' => $paidAt,
        ]);
        Enrollment::forceCreate(['user_id' => $student->id, 'course_id' => $course->id, 'order_id' => $order->id, 'created_at' => $paidAt]);
    }
}
