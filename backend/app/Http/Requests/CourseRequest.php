<?php

namespace App\Http\Requests;

use App\Models\Course;
use App\Models\Order;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CourseRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:200'],
            'summary' => ['nullable', 'string', 'max:500'],
            'description' => ['nullable', 'string', 'max:10000'],
            'level' => ['required', Rule::in(Course::LEVELS)],
            // 0 là miễn phí; có phí thì từ 1.000đ (mức thấp nhất MoMo nhận)
            'price' => ['required', 'integer', 'min:0', 'max:10000000', function ($attribute, $value, $fail) {
                if ($value > 0 && $value < Order::MIN_AMOUNT) {
                    $fail('Khóa có phí phải từ 1.000đ trở lên.');
                }
            }],
            'category' => ['sometimes', Rule::in(Course::CATEGORIES)],
            'playground_sql' => ['nullable', 'string', 'max:20000'], // SQL tạo bảng mẫu cho SQL Playground
        ];
    }
}
