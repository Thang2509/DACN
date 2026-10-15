<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

// Kế hoạch học tập: học vào những thứ nào trong tuần, mỗi ngày mấy bài
class StudyPlan extends Model
{
    protected $primaryKey = 'user_id';

    public $incrementing = false;

    protected $fillable = ['user_id', 'study_days', 'lessons_per_day'];

    protected function casts(): array
    {
        return ['study_days' => 'array'];
    }
}
