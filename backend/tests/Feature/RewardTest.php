<?php

namespace Tests\Feature;

use App\Models\Badge;
use App\Models\Chapter;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonBlock;
use App\Models\PointLedger;
use App\Models\Quest;
use App\Models\Streak;
use App\Models\User;
use App\Models\Wallet;
use App\Services\BadgeService;
use App\Services\GamificationService;
use App\Services\RewardService;
use Database\Seeders\GamificationSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

// Mỗi quy tắc thưởng trong docs/quy-tac-thuong.md có ít nhất một test
class RewardTest extends TestCase
{
    use RefreshDatabase;

    private const QUIZ = ['variant' => 'test', 'questions' => [
        ['question' => '1 + 1 = ?', 'options' => ['1', '2'], 'answer' => 1, 'explanation' => null],
        ['question' => '2 + 2 = ?', 'options' => ['4', '5'], 'answer' => 0, 'explanation' => null],
    ]];

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(GamificationSeeder::class);
        Carbon::setTestNow('2026-11-16 09:00'); // thứ Hai
    }

    private function lesson(?Course $course = null): Lesson
    {
        $course ??= Course::factory()->published()->create();

        return Lesson::factory()->for(Chapter::factory()->for($course))->create();
    }

    private function enroll(User $user, Lesson $lesson): User
    {
        Enrollment::firstOrCreate(['user_id' => $user->id, 'course_id' => $lesson->chapter->course_id]);

        return $user;
    }

    private function quiz(Lesson $lesson): LessonBlock
    {
        return LessonBlock::factory()->for($lesson)->create(['type' => 'quiz', 'content' => self::QUIZ]);
    }

    private function answer(Lesson $lesson, LessonBlock $quiz, int $question, int $answer): void
    {
        $this->postJson("/api/lessons/{$lesson->id}/quiz/{$quiz->id}/answer", compact('question', 'answer'))->assertOk();
    }

    private function complete(Lesson $lesson): void
    {
        $this->postJson("/api/lessons/{$lesson->id}/complete")->assertOk();
    }

    private function ledger(string $key): ?PointLedger
    {
        return PointLedger::firstWhere('idempotency_key', $key);
    }

    private function questId(string $code): int
    {
        return Quest::firstWhere('code', $code)->id;
    }

    public function test_r01_hoan_thanh_bai_lan_dau_thuong_20_xp_5_xu(): void
    {
        $lesson = $this->lesson();
        $student = $this->enroll(User::factory()->create(), $lesson);
        $this->actingAs($student);

        $this->complete($lesson);
        $this->complete($lesson);

        $row = $this->ledger("lesson_completed:{$student->id}:{$lesson->id}");
        $this->assertSame([20, 5], [$row->xp, $row->coins]);
        $this->assertSame(1, PointLedger::where('reason', 'lesson_completed')->count());
    }

    public function test_r02_cau_dung_lan_dau_thuong_5_xp(): void
    {
        $lesson = $this->lesson();
        $quiz = $this->quiz($lesson);
        $student = $this->enroll(User::factory()->create(), $lesson);
        $this->actingAs($student);

        $this->answer($lesson, $quiz, 0, 1); // đúng
        $this->answer($lesson, $quiz, 1, 1); // sai
        $this->assertSame(5, $this->ledger("quiz_correct:{$student->id}:{$quiz->id}:0")->xp);
        $this->assertNull($this->ledger("quiz_correct:{$student->id}:{$quiz->id}:1"));

        // Lượt làm lại: câu 0 đúng lần nữa không được thưởng thêm, câu 1 giờ mới đúng thì được thưởng
        $this->answer($lesson, $quiz, 0, 1);
        $this->answer($lesson, $quiz, 1, 0);
        $this->assertSame(2, PointLedger::where('reason', 'quiz_correct')->count());
    }

    public function test_r03_dung_het_ngay_luot_dau_moi_duoc_thuong(): void
    {
        $lesson = $this->lesson();
        $quiz = $this->quiz($lesson);

        $perfect = $this->enroll(User::factory()->create(), $lesson);
        $this->actingAs($perfect);
        $this->answer($lesson, $quiz, 0, 1);
        $this->answer($lesson, $quiz, 1, 0);
        $row = $this->ledger("quiz_perfect:{$perfect->id}:{$quiz->id}");
        $this->assertSame([10, 2], [$row->xp, $row->coins]);

        // Sai ở lượt đầu, lượt sau đúng hết vẫn không có thưởng R03
        $retry = $this->enroll(User::factory()->create(), $lesson);
        $this->actingAs($retry);
        $this->answer($lesson, $quiz, 0, 1);
        $this->answer($lesson, $quiz, 1, 1);
        $this->answer($lesson, $quiz, 0, 1);
        $this->answer($lesson, $quiz, 1, 0);
        $this->assertNull($this->ledger("quiz_perfect:{$retry->id}:{$quiz->id}"));
    }

    public function test_r04_hoan_thanh_khoa_thuong_200_xp_50_xu(): void
    {
        $first = $this->lesson();
        $course = $first->chapter->course;
        $second = $this->lesson($course);
        $student = $this->enroll(User::factory()->create(), $first);
        $this->actingAs($student);

        $this->complete($first);
        $this->assertNull($this->ledger("course_completed:{$student->id}:{$course->id}"));

        $this->complete($second);
        $row = $this->ledger("course_completed:{$student->id}:{$course->id}");
        $this->assertSame([200, 50], [$row->xp, $row->coins]);
    }

    public function test_r06_r07_chuoi_ngay_va_moc_7_ngay(): void
    {
        $student = User::factory()->create();
        $service = app(GamificationService::class);

        for ($day = 0; $day < 7; $day++) {
            Carbon::setTestNow(Carbon::parse('2026-11-16 09:00')->addDays($day));
            $service->recordStudyDay($student);
            $service->recordStudyDay($student); // học thêm trong cùng ngày không tính thêm
        }

        $this->assertSame(7, Streak::find($student->id)->current_days);
        $this->assertSame(7, PointLedger::where('reason', 'streak_day')->sum('coins') / 5);
        $this->assertSame(30, $this->ledger("streak_milestone:{$student->id}:2026-11-16:7")->coins);

        // Bỏ 1 ngày thì chuỗi về 1 nhưng vẫn nhớ chuỗi dài nhất
        Carbon::setTestNow('2026-11-24 09:00');
        $service->recordStudyDay($student);
        $streak = Streak::find($student->id);
        $this->assertSame([1, 7], [$streak->current_days, $streak->longest_days]);
    }

    public function test_r08_nhiem_vu_ngay_moi_ngay_nhan_mot_lan(): void
    {
        $student = User::factory()->create();
        $service = app(GamificationService::class);
        $questId = $this->questId('daily_quiz');

        for ($i = 0; $i < 6; $i++) {
            $service->progressQuests($student, 'quiz_correct');
        }
        $row = $this->ledger("quest:{$student->id}:{$questId}:2026-11-16");
        $this->assertSame([10, 5], [$row->xp, $row->coins]);
        $this->assertSame(1, PointLedger::where('reason', 'quest')->count());

        // Sang ngày mới bắt đầu kỳ mới
        Carbon::setTestNow('2026-11-17 09:00');
        $service->progressQuests($student, 'quiz_correct');
        $this->assertDatabaseHas('user_quests', ['user_id' => $student->id, 'quest_id' => $questId, 'progress' => 1]);
    }

    public function test_r08_hoan_thanh_bai_dem_vao_nhiem_vu_ngay(): void
    {
        $lesson = $this->lesson();
        $student = $this->enroll(User::factory()->create(), $lesson);
        $this->actingAs($student)->complete($lesson);

        $questId = $this->questId('daily_lesson');
        $this->assertSame(15, $this->ledger("quest:{$student->id}:{$questId}:2026-11-16")->xp);
    }

    public function test_r09_nhiem_vu_tuan_hoc_4_ngay(): void
    {
        $student = User::factory()->create();
        $service = app(GamificationService::class);
        $key = "quest:{$student->id}:{$this->questId('weekly_days')}:2026-11-16";

        foreach (['2026-11-16', '2026-11-17', '2026-11-18'] as $date) {
            Carbon::setTestNow("$date 20:00");
            $service->recordStudyDay($student);
        }
        $this->assertNull($this->ledger($key));

        Carbon::setTestNow('2026-11-19 20:00');
        $service->recordStudyDay($student);
        $row = $this->ledger($key);
        $this->assertSame([40, 30], [$row->xp, $row->coins]);
    }

    public function test_r10_len_cap_thuong_10_nhan_cap_moi(): void
    {
        $student = User::factory()->create();
        $rewards = app(RewardService::class);

        $rewards->grant($student, 'test:1', 'test', 100);
        $this->assertSame(2, Wallet::find($student->id)->level);
        $this->assertSame(20, $this->ledger("level_up:{$student->id}:2")->coins);

        // Nhảy nhiều cấp một lúc thì nhận thưởng từng cấp
        $rewards->grant($student, 'test:2', 'test', 900);
        $this->assertSame(5, Wallet::find($student->id)->level);
        $this->assertSame([30, 40, 50], PointLedger::where('reason', 'level_up')->where('coins', '>', 20)->orderBy('id')->pluck('coins')->all());
    }

    public function test_cong_thuc_cap_do(): void
    {
        foreach ([1 => 0, 2 => 100, 3 => 300, 4 => 600, 5 => 1000, 10 => 4500, 20 => 19000] as $level => $xp) {
            $this->assertSame($xp, RewardService::xpForLevel($level));
            $this->assertSame($level, RewardService::levelForXp($xp));
            $this->assertSame(max(1, $level - 1), RewardService::levelForXp(max(0, $xp - 1)));
        }
    }

    public function test_khoa_trung_khong_cong_hai_lan_va_vi_khop_so_cai(): void
    {
        $student = User::factory()->create();
        $rewards = app(RewardService::class);

        $this->assertTrue($rewards->grant($student, 'test:x', 'test', 40, 7));
        $this->assertFalse($rewards->grant($student, 'test:x', 'test', 40, 7));

        $wallet = Wallet::find($student->id);
        $this->assertSame((int) PointLedger::where('user_id', $student->id)->sum('xp'), $wallet->xp);
        $this->assertSame((int) PointLedger::where('user_id', $student->id)->sum('coins'), $wallet->coins);
        $this->assertSame([40, 7], [$wallet->xp, $wallet->coins]);
    }

    public function test_khong_thuong_khi_hoc_khoa_cua_chinh_minh(): void
    {
        $instructor = User::factory()->instructor()->create();
        $lesson = $this->lesson(Course::factory()->published()->create(['instructor_id' => $instructor->id]));
        $quiz = $this->quiz($lesson);
        $this->actingAs($this->enroll($instructor, $lesson));

        $this->answer($lesson, $quiz, 0, 1);
        $this->answer($lesson, $quiz, 1, 0);
        $this->complete($lesson);

        $this->assertDatabaseCount('point_ledger', 0);
    }

    public function test_api_tong_quan_thanh_tich(): void
    {
        $lesson = $this->lesson();
        $this->lesson($lesson->chapter->course); // khóa còn bài khác nên chưa có thưởng R04
        $student = $this->enroll(User::factory()->create(), $lesson);
        $this->actingAs($student)->complete($lesson);

        // R01 (20 XP, 5 xu) + nhiệm vụ ngày (15 XP, 10 xu) + chuỗi ngày (5 xu) + huy hiệu "Bước đầu tiên" (10 xu)
        $this->getJson('/api/gamification')
            ->assertOk()
            ->assertJsonPath('xp', 35)
            ->assertJsonPath('coins', 30)
            ->assertJsonPath('level', 1)
            ->assertJsonPath('next_level_xp', 100)
            ->assertJsonPath('streak.current', 1)
            ->assertJsonPath('streak.studied_today', true)
            ->assertJsonCount(5, 'quests')
            ->assertJsonCount(4, 'recent');
    }

    private function flashcardLesson(int $cards): Lesson
    {
        $lesson = $this->lesson();
        $content = ['cards' => array_map(fn ($i) => ['front' => "Mặt trước $i", 'back' => "Mặt sau $i"], range(1, $cards))];
        LessonBlock::factory()->for($lesson)->create(['type' => 'flashcard', 'content' => $content]);

        return $lesson;
    }

    public function test_r05_on_the_den_han_duoc_1_xp_va_tinh_nhiem_vu(): void
    {
        $lesson = $this->flashcardLesson(2);
        $student = $this->enroll(User::factory()->create(), $lesson);
        $this->actingAs($student)->complete($lesson);

        $cards = $this->getJson('/api/reviews')->assertJsonCount(2, 'cards')->json('cards');
        $this->postJson("/api/reviews/{$cards[0]['id']}", ['rating' => 'good'])->assertOk();
        $this->postJson("/api/reviews/{$cards[0]['id']}", ['rating' => 'good'])->assertOk(); // thẻ chưa tới hạn: không thưởng

        $row = PointLedger::firstWhere('reason', 'flashcard');
        $this->assertSame([1, "flashcard:{$student->id}:{$lesson->blocks()->first()->id}:0:2026-11-16"], [$row->xp, $row->idempotency_key]);
        $this->assertSame(1, PointLedger::where('reason', 'flashcard')->count());
        $this->assertDatabaseHas('user_quests', ['user_id' => $student->id, 'quest_id' => $this->questId('daily_flashcard'), 'progress' => 1]);
    }

    public function test_r05_toi_da_30_xp_on_the_moi_ngay(): void
    {
        $lesson = $this->flashcardLesson(35);
        $student = $this->enroll(User::factory()->create(), $lesson);
        $this->actingAs($student)->complete($lesson);

        foreach ($this->getJson('/api/reviews')->json('cards') as $card) {
            $this->postJson("/api/reviews/{$card['id']}", ['rating' => 'easy']);
        }

        $this->assertSame(30, (int) PointLedger::where('reason', 'flashcard')->sum('xp'));
    }

    public function test_r11_dat_huy_hieu_duoc_thuong_xu_mot_lan(): void
    {
        $lesson = $this->lesson();
        $this->lesson($lesson->chapter->course);
        $student = $this->enroll(User::factory()->create(), $lesson);
        $this->actingAs($student)->complete($lesson);

        $badgeId = Badge::firstWhere('code', 'first_step')->id;
        $this->assertDatabaseHas('user_badges', ['user_id' => $student->id, 'badge_id' => $badgeId]);
        $this->assertSame(10, $this->ledger("badge:{$student->id}:{$badgeId}")->coins);

        app(BadgeService::class)->check($student);
        $this->assertSame(1, PointLedger::where('reason', 'badge')->count());
    }

    public function test_r12_minigame_thuong_diem_chia_100_toi_da_5_xu_4_luot_moi_ngay(): void
    {
        $student = User::factory()->create();
        $this->actingAs($student);

        $this->postJson('/api/minigames/runner/scores', ['score' => 350, 'duration' => 60])->assertOk()->assertJsonPath('coins', 3);
        $this->postJson('/api/minigames/keywords/scores', ['score' => 2000, 'duration' => 60])->assertJsonPath('coins', 5);
        $this->postJson('/api/minigames/runner/scores', ['score' => 100, 'duration' => 60]);
        $this->postJson('/api/minigames/runner/scores', ['score' => 100, 'duration' => 60])->assertJsonPath('rewarded_plays_left', 0);
        $this->postJson('/api/minigames/runner/scores', ['score' => 900, 'duration' => 60])->assertJsonPath('coins', 0); // lượt thứ 5

        $this->assertSame([3, 5, 1, 1], PointLedger::where('reason', 'minigame')->orderBy('id')->pluck('coins')->all());
        $this->assertNotNull($this->ledger("minigame:{$student->id}:2026-11-16:4"));
    }
}
