<?php

namespace App\Http\Requests;

use App\Models\Course;
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
            'price' => ['required', 'integer', 'min:0', 'max:10000000'],
            'category' => ['sometimes', Rule::in(Course::CATEGORIES)],
            'playground_sql' => ['nullable', 'string', 'max:20000'], // SQL tạo bảng mẫu cho SQL Playground
        ];
    }
}
