<?php

namespace App\Http\Controllers;

use App\Models\Badge;
use App\Models\Quest;
use App\Models\Voucher;
use App\Services\BadgeService;
use App\Services\GamificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * Quản trị viên cấu hình nhiệm vụ, huy hiệu, voucher (UC43).
 * Không xóa hẳn mà tắt bằng is_active để giữ lịch sử nhiệm vụ/huy hiệu/voucher học viên đã nhận.
 */
class AdminRewardController extends Controller
{
    public function index()
    {
        return [
            'quests' => Quest::orderBy('period')->orderBy('id')->get(),
            'badges' => Badge::orderBy('condition_type')->orderBy('condition_value')->get(),
            'vouchers' => Voucher::orderBy('coin_cost')->get(),
            'quest_targets' => GamificationService::QUEST_TARGETS,
            'badge_conditions' => BadgeService::CONDITIONS,
        ];
    }

    public function store(Request $request, string $type)
    {
        [$model, $rules] = $this->config($type);
        $data = $request->validate($rules);
        if ($type !== 'vouchers') {
            // Mã nội bộ sinh từ tên, thêm đuôi ngẫu nhiên để không trùng
            $data['code'] = Str::slug($data['title'] ?? $data['name'], '_').'_'.Str::lower(Str::random(4));
        }

        return response()->json($model::create($data), 201);
    }

    public function update(Request $request, string $type, int $id)
    {
        [$model, $rules] = $this->config($type);
        $record = $model::findOrFail($id);
        $record->update($request->validate($rules));

        return $record;
    }

    // Model và quy tắc kiểm tra dữ liệu của từng loại cấu hình
    private function config(string $type): array
    {
        return match ($type) {
            'quests' => [Quest::class, [
                'title' => ['required', 'string', 'max:150'],
                'period' => ['required', 'in:daily,weekly'],
                'target_type' => ['required', Rule::in(array_keys(GamificationService::QUEST_TARGETS))],
                'target_value' => ['required', 'integer', 'between:1,100'],
                'reward_xp' => ['required', 'integer', 'between:0,1000'],
                'reward_coins' => ['required', 'integer', 'between:0,1000'],
                'is_active' => ['boolean'],
            ]],
            'badges' => [Badge::class, [
                'name' => ['required', 'string', 'max:100'],
                'description' => ['required', 'string', 'max:255'],
                'icon' => ['required', 'string', 'max:16'],
                'condition_type' => ['required', Rule::in(array_keys(BadgeService::CONDITIONS))],
                'condition_value' => ['required', 'integer', 'between:1,100000'],
                'reward_coins' => ['required', 'integer', 'between:0,1000'],
                'is_active' => ['boolean'],
            ]],
            'vouchers' => [Voucher::class, [
                'name' => ['required', 'string', 'max:100'],
                'discount_percent' => ['required', 'integer', 'between:1,90'],
                'max_discount' => ['required', 'integer', 'between:1000,10000000'],
                'coin_cost' => ['required', 'integer', 'between:1,100000'],
                'valid_days' => ['required', 'integer', 'between:1,365'],
                'is_active' => ['boolean'],
            ]],
        };
    }
}
