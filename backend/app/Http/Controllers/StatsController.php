<?php

namespace App\Http\Controllers;

use App\Services\StatsService;
use Illuminate\Http\Request;

// Thống kê hệ thống (quản trị viên) và thống kê khóa học của giảng viên
class StatsController extends Controller
{
    public function __construct(private StatsService $stats) {}

    public function overview()
    {
        return $this->stats->overview();
    }

    public function instructor(Request $request)
    {
        $courseId = $request->validate(['course' => ['sometimes', 'integer']])['course'] ?? null;

        return $this->stats->instructor($request->user(), $courseId);
    }
}
