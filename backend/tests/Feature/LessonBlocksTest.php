<?php

namespace Tests\Feature;

use App\Models\Lesson;
use App\Models\LessonBlock;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LessonBlocksTest extends TestCase
{
    use RefreshDatabase;

    private function saveBlocks(Lesson $lesson, array $blocks)
    {
        return $this->actingAs($lesson->chapter->course->instructor)
            ->putJson("/api/instructor/lessons/{$lesson->id}/blocks", ['blocks' => $blocks]);
    }

    private function quiz(int $answer): array
    {
        return ['type' => 'quiz', 'content' => ['questions' => [
            ['question' => '1 + 1 = ?', 'options' => ['1', '2'], 'answer' => $answer, 'explanation' => null],
        ]]];
    }

    public function test_luu_khoi_tao_moi_sua_xoa_theo_dung_thu_tu(): void
    {
        $lesson = Lesson::factory()->create();
        $kept = LessonBlock::factory()->for($lesson)->create(['position' => 1]);
        $removed = LessonBlock::factory()->for($lesson)->create(['position' => 2]);

        $this->saveBlocks($lesson, [
            $this->quiz(1),
            ['id' => $kept->id, 'type' => 'markdown', 'content' => ['text' => 'Đã sửa']],
        ])
            ->assertOk()
            ->assertJsonCount(2)
            ->assertJsonPath('0.type', 'quiz')
            ->assertJsonPath('1.id', $kept->id)
            ->assertJsonPath('1.content.text', 'Đã sửa');

        $this->assertModelMissing($removed);
    }

    public function test_dap_an_quiz_ngoai_lua_chon_bi_tu_choi(): void
    {
        $this->saveBlocks(Lesson::factory()->create(), [$this->quiz(5)])
            ->assertJsonValidationErrors('blocks.0.content.questions.0.answer');
    }

    public function test_noi_dung_khoi_phai_dung_theo_loai(): void
    {
        $lesson = Lesson::factory()->create();

        $this->saveBlocks($lesson, [['type' => 'markdown', 'content' => ['url' => 'https://a.vn']]])
            ->assertJsonValidationErrors(['blocks.0.content', 'blocks.0.content.text']);
        $this->saveBlocks($lesson, [['type' => 'code', 'content' => ['language' => 'python']]])
            ->assertJsonValidationErrors('blocks.0.content.language');
        $this->saveBlocks($lesson, [['type' => 'video', 'content' => ['url' => 'khong-phai-link']]])
            ->assertJsonValidationErrors('blocks.0.content.url');
        $this->saveBlocks($lesson, [['type' => 'section', 'content' => ['title' => '']]])
            ->assertJsonValidationErrors('blocks.0.content.title');
        $this->saveBlocks($lesson, [['type' => 'quiz', 'content' => ['variant' => 'la', 'questions' => $this->quiz(0)['content']['questions']]]])
            ->assertJsonValidationErrors('blocks.0.content.variant');
        $this->saveBlocks($lesson, [['type' => 'section', 'content' => ['title' => 'Phần mở đầu']]])->assertOk();
    }

    public function test_id_khoi_cua_bai_khac_thi_tao_khoi_moi(): void
    {
        $lesson = Lesson::factory()->create();
        $foreign = LessonBlock::factory()->create(['content' => ['text' => 'Của bài khác']]);

        $this->saveBlocks($lesson, [['id' => $foreign->id, 'type' => 'markdown', 'content' => ['text' => 'Mới']]])->assertOk();

        $this->assertSame('Của bài khác', $foreign->fresh()->content['text']);
        $this->assertNotSame($foreign->id, $lesson->blocks()->first()->id);
    }

    public function test_giang_vien_khac_khong_mo_duoc_trinh_soan(): void
    {
        $lesson = Lesson::factory()->create();

        $this->actingAs(User::factory()->instructor()->create())
            ->getJson("/api/instructor/lessons/{$lesson->id}/editor")
            ->assertForbidden();
    }
}
