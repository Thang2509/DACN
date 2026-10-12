<?php

namespace Database\Factories;

use App\Models\Lesson;
use Illuminate\Database\Eloquent\Factories\Factory;

class LessonBlockFactory extends Factory
{
    public function definition(): array
    {
        return [
            'lesson_id' => Lesson::factory(),
            'type' => 'markdown',
            'content' => ['text' => fake()->paragraph()],
            'position' => 1,
        ];
    }
}
