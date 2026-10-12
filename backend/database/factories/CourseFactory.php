<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class CourseFactory extends Factory
{
    public function definition(): array
    {
        $title = fake()->unique()->sentence(3);

        return [
            'instructor_id' => User::factory()->instructor(),
            'title' => $title,
            'slug' => Str::slug($title),
            'summary' => fake()->sentence(),
            'level' => 'beginner',
            'price' => 0,
            'status' => 'draft',
        ];
    }

    public function pending(): static
    {
        return $this->state(fn () => ['status' => 'pending']);
    }

    public function published(): static
    {
        return $this->state(fn () => ['status' => 'published', 'published_at' => now()]);
    }
}
