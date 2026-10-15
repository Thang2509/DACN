<?php

namespace Database\Seeders;

use App\Models\Badge;
use App\Models\PetSpecies;
use App\Models\Quest;
use Illuminate\Database\Seeder;

// Nhiệm vụ mặc định (docs/quy-tac-thuong.md), huy hiệu và các loài thú cưng
class GamificationSeeder extends Seeder
{
    public function run(): void
    {
        $quests = [
            ['daily_lesson', 'Hoàn thành 1 bài học', 'daily', 'lessons_completed', 1, 15, 10, true],
            ['daily_quiz', 'Trả lời đúng 5 câu quiz', 'daily', 'quiz_correct', 5, 10, 5, true],
            ['daily_flashcard', 'Ôn 10 thẻ flashcard', 'daily', 'flashcards_reviewed', 10, 10, 5, true],
            ['weekly_lessons', 'Hoàn thành 5 bài học', 'weekly', 'lessons_completed', 5, 50, 40, true],
            ['weekly_days', 'Học 4 ngày trong tuần', 'weekly', 'study_days', 4, 40, 30, true],
        ];
        foreach ($quests as [$code, $title, $period, $type, $target, $xp, $coins, $active]) {
            Quest::create([
                'code' => $code, 'title' => $title, 'period' => $period, 'target_type' => $type,
                'target_value' => $target, 'reward_xp' => $xp, 'reward_coins' => $coins, 'is_active' => $active,
            ]);
        }

        // Huy hiệu: [mã, tên, mô tả, biểu tượng, loại điều kiện, ngưỡng, xu thưởng]
        foreach ([
            ['first_step', 'Bước đầu tiên', 'Hoàn thành bài học đầu tiên', '👣', 'lessons_completed', 1, 10],
            ['diligent', 'Chăm chỉ', 'Hoàn thành 10 bài học', '📚', 'lessons_completed', 10, 30],
            ['scholar', 'Học giả', 'Hoàn thành 30 bài học', '🎓', 'lessons_completed', 30, 80],
            ['finisher', 'Về đích', 'Hoàn thành trọn một khóa học', '🏁', 'courses_completed', 1, 50],
            ['streak_7', 'Lửa bền bỉ', 'Giữ chuỗi học 7 ngày', '🔥', 'longest_streak', 7, 30],
            ['streak_30', 'Không bỏ cuộc', 'Giữ chuỗi học 30 ngày', '🌋', 'longest_streak', 30, 150],
            ['level_5', 'Ngôi sao mới', 'Đạt cấp 5', '⭐', 'level', 5, 30],
            ['level_10', 'Ngôi sao sáng', 'Đạt cấp 10', '🌟', 'level', 10, 80],
            ['quiz_master', 'Bách phát bách trúng', 'Làm đúng hết 10 quiz ngay lần đầu', '🎯', 'quiz_perfect', 10, 40],
            ['memory', 'Trí nhớ vàng', 'Ôn flashcard 100 lượt', '🧠', 'flashcards_reviewed', 100, 40],
            ['collector', 'Nhà sưu tầm', 'Có 3 loài thú trong bộ sưu tập', '🐾', 'pets_owned', 3, 50],
            ['gamer', 'Tay chơi', 'Đạt 500 điểm trong một minigame', '🎮', 'minigame_score', 500, 20],
        ] as [$code, $name, $description, $icon, $type, $value, $coins]) {
            Badge::create([
                'code' => $code, 'name' => $name, 'description' => $description, 'icon' => $icon,
                'condition_type' => $type, 'condition_value' => $value, 'reward_coins' => $coins,
            ]);
        }

        // Thú dựng bằng code ở frontend (PetBody.jsx); 3 loài đầu chọn được làm trứng miễn phí, 5 loài sau mua ở cửa hàng
        $species = [
            ['shiba', 'Shiba', 'Lanh lợi, trung thành, cười rất tươi.', '#e9a15b', true],
            ['rabbit', 'Thỏ', 'Hiền lành, tai dài, mũi lúc nào cũng khụt khịt.', '#e8d9c5', true],
            ['tabby', 'Mèo mướp', 'Tò mò, nhanh nhẹn, thích rình bắt đồ chơi.', '#c99a64', true],
            ['capybara', 'Capybara', 'Điềm tĩnh nhất vùng, thân thiện với mọi loài.', '#b98a5e', false],
            ['corgi', 'Corgi', 'Chân ngắn, mông tròn, năng lượng vô tận.', '#f0a35e', false],
            ['hamster', 'Hamster', 'Má phúng phính, mê chạy vòng và giấu đồ ăn.', '#f2c58a', false],
            ['persian', 'Mèo Ba Tư', 'Điềm tĩnh, lông dài mượt như mây.', '#efe9e2', false],
            ['hedgehog', 'Nhím', 'Lưng đầy gai nhưng bụng mềm, rất hiền.', '#9c7b5b', false],
        ];
        foreach ($species as [$code, $name, $description, $eggColor, $starter]) {
            PetSpecies::create([
                'code' => $code, 'name' => $name, 'description' => $description,
                'egg_color' => $eggColor, 'is_starter' => $starter,
            ]);
        }
    }
}
