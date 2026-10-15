<?php

namespace App\Http\Requests;

use App\Models\LessonBlock;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class SaveBlocksRequest extends FormRequest
{
    // Quy tắc cho phần content của từng loại khối
    public const CONTENT_RULES = [
        'section' => [
            'title' => 'required|string|max:200',
        ],
        'markdown' => [
            'text' => 'required|string|max:50000',
        ],
        'video' => [
            'url' => 'required|url|max:500',
            'caption' => 'nullable|string|max:200',
        ],
        'quiz' => [
            'variant' => 'nullable|in:quick,predict,test', // Quiz nhanh / Dự đoán trước khi xem / Kiểm tra kiến thức
            'questions' => 'required|array|min:1|max:20',
            'questions.*.question' => 'required|string|max:1000',
            'questions.*.options' => 'required|array|min:2|max:6',
            'questions.*.options.*' => 'required|string|max:500',
            'questions.*.answer' => 'required|integer|min:0',
            'questions.*.explanation' => 'nullable|string|max:2000',
        ],
        'animation' => [
            'component' => 'required|string|max:100',
            'params' => 'nullable|array',
        ],
        'code' => [
            'language' => 'required|in:javascript,sql',
            'instructions' => 'nullable|string|max:5000',
            'starter' => 'nullable|string|max:20000',
            'solution' => 'nullable|string|max:20000',
            'setup' => 'nullable|string|max:20000', // SQL tạo bảng và dữ liệu mẫu
            'expected' => 'nullable|string|max:5000', // kết quả mong đợi để chấm
        ],
        'flashcard' => [
            'cards' => 'required|array|min:1|max:50',
            'cards.*.front' => 'required|string|max:1000',
            'cards.*.back' => 'required|string|max:2000',
        ],
    ];

    public function rules(): array
    {
        $rules = [
            'blocks' => ['present', 'array', 'max:100'],
            'blocks.*.id' => ['nullable', 'integer'],
            'blocks.*.type' => ['required', Rule::in(LessonBlock::TYPES)],
        ];

        // Mỗi khối dùng bộ quy tắc theo loại của nó; content chỉ được chứa các khóa đã khai báo
        foreach ((array) $this->input('blocks', []) as $i => $block) {
            $contentRules = self::CONTENT_RULES[$block['type'] ?? ''] ?? [];
            $allowedKeys = collect(array_keys($contentRules))->map(fn ($key) => explode('.', $key)[0])->unique();

            $rules["blocks.$i.content"] = ['required', 'array:'.$allowedKeys->implode(',')];
            foreach ($contentRules as $field => $rule) {
                $rules["blocks.$i.content.$field"] = $rule;
            }
        }

        return $rules;
    }

    // Tên trường hiện trong thông báo lỗi (thay cho "blocks.0.content.text")
    private const FIELD_NAMES = [
        'title' => 'tiêu đề phần',
        'text' => 'nội dung văn bản',
        'url' => 'đường dẫn video',
        'caption' => 'chú thích',
        'variant' => 'kiểu quiz',
        'questions' => 'danh sách câu hỏi',
        'questions.*.question' => 'câu hỏi',
        'questions.*.options' => 'các lựa chọn',
        'questions.*.options.*' => 'lựa chọn',
        'questions.*.answer' => 'đáp án đúng',
        'questions.*.explanation' => 'giải thích',
        'component' => 'loại hoạt ảnh',
        'params' => 'tham số',
        'language' => 'ngôn ngữ',
        'instructions' => 'đề bài',
        'starter' => 'code ban đầu',
        'solution' => 'lời giải',
        'setup' => 'dữ liệu mẫu',
        'expected' => 'kết quả mong đợi',
        'cards' => 'danh sách thẻ',
        'cards.*.front' => 'mặt trước thẻ',
        'cards.*.back' => 'mặt sau thẻ',
    ];

    public function attributes(): array
    {
        return collect(self::FIELD_NAMES)->mapWithKeys(fn ($name, $field) => ["blocks.*.content.$field" => $name])->all();
    }

    // Đáp án đúng của quiz phải là một trong các lựa chọn
    public function after(): array
    {
        return [function (Validator $validator) {
            foreach ((array) $this->input('blocks', []) as $i => $block) {
                if (($block['type'] ?? null) !== 'quiz') {
                    continue;
                }
                foreach ((array) ($block['content']['questions'] ?? []) as $q => $question) {
                    $answer = $question['answer'] ?? null;
                    if (is_int($answer) && $answer >= count((array) ($question['options'] ?? []))) {
                        $validator->errors()->add("blocks.$i.content.questions.$q.answer", 'Đáp án đúng phải là một trong các lựa chọn.');
                    }
                }
            }
        }];
    }
}
