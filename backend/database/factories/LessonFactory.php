<?php

namespace Database\Factories;

use App\Models\Chapter;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class LessonFactory extends Factory
{
    public function definition(): array
    {
        $title = fake()->unique()->sentence(3);

        return [
            'chapter_id' => Chapter::factory(),
            'title' => $title,
            'slug' => Str::slug($title),
            'position' => 1,
        ];
    }
}
