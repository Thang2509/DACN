<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Order;
use App\Models\User;
use App\Models\UserVoucher;
use App\Models\Voucher;
use App\Notifications\PaymentSucceeded;
use App\Services\PaymentService;
use Database\Seeders\ShopSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

// Không gọi MoMo thật: Http::fake trả lời thay cổng sandbox theo $momo (test đổi được từng phản hồi, null = mất kết nối)
class PaymentTest extends TestCase
{
    use RefreshDatabase;

    private array $momo = [
        'create' => ['resultCode' => 0, 'payUrl' => 'https://test-payment.momo.vn/pay/abc'],
        'query' => ['resultCode' => 1000],
    ];

    private Course $course;

    private User $student;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(ShopSeeder::class);
        $this->course = Course::factory()->published()->create(['price' => 199000]);
        $this->student = User::factory()->create();
        $this->actingAs($this->student);
        Notification::fake();
        Http::fake(function ($request) {
            $body = $this->momo[str_ends_with($request->url(), '/create') ? 'create' : 'query'];

            return $body === null ? Http::failedConnection() : Http::response($body);
        });
    }

    private function voucher(int $percent, array $state = []): UserVoucher
    {
        return UserVoucher::create([
            'user_id' => $this->student->id,
            'voucher_id' => Voucher::firstWhere('discount_percent', $percent)->id,
            'code' => 'EQTEST'.$percent,
            'expires_on' => today()->addDays(30),
            ...$state,
        ]);
    }

    private function checkout(?int $userVoucherId = null)
    {
        return $this->postJson("/api/courses/{$this->course->id}/checkout", ['user_voucher_id' => $userVoucherId]);
    }

    // Dữ liệu kết quả giao dịch MoMo gửi về, ký bằng khóa bí mật như MoMo
    private function momoResult(Order $order, int $resultCode = 0, ?int $amount = null): array
    {
        $data = [
            'partnerCode' => 'MOMO', 'orderId' => $order->momo_order_id, 'requestId' => $order->momo_order_id,
            'amount' => $amount ?? $order->amount, 'orderInfo' => 'Mua khóa học', 'orderType' => 'momo_wallet',
            'transId' => 4088878653, 'resultCode' => $resultCode, 'message' => 'Thành công.', 'payType' => 'qr',
            'responseTime' => 1721720663942, 'extraData' => '',
        ];

        return [...$data, 'signature' => app(PaymentService::class)->sign($data)];
    }

    public function test_tao_don_cho_va_lay_link_thanh_toan(): void
    {
        $this->checkout()
            ->assertCreated()
            ->assertJsonPath('pay_url', 'https://test-payment.momo.vn/pay/abc')
            ->assertJsonPath('order.status', 'pending')
            ->assertJsonPath('order.amount', 199000);

        $order = Order::first();
        Http::assertSent(fn ($request) => str_ends_with($request->url(), '/create')
            && $request['orderId'] === $order->momo_order_id
            && $request['amount'] === 199000
            && $request['signature'] === app(PaymentService::class)->sign(collect($request->data())->except('lang', 'autoCapture', 'signature')->all()));
    }

    public function test_ap_dung_voucher_khong_vuot_muc_giam_toi_da(): void
    {
        $this->checkout($this->voucher(10)->id)->assertJsonPath('order.discount', 19900)->assertJsonPath('order.amount', 179100);

        // 25% của 1.000.000đ là 250.000đ nhưng tối đa chỉ giảm 150.000đ
        $this->course = Course::factory()->published()->create(['price' => 1000000]);
        $this->checkout($this->voucher(25)->id)->assertJsonPath('order.discount', 150000);
    }

    public function test_voucher_da_dung_het_han_hoac_cua_nguoi_khac_bi_tu_choi(): void
    {
        $this->checkout($this->voucher(10, ['used_at' => now()])->id)->assertJsonValidationErrors('user_voucher_id');
        $this->checkout($this->voucher(25, ['code' => 'EQOLD', 'expires_on' => today()->subDay()])->id)->assertJsonValidationErrors('user_voucher_id');

        $other = UserVoucher::create(['user_id' => User::factory()->create()->id, 'voucher_id' => Voucher::first()->id, 'code' => 'EQOTHER', 'expires_on' => today()->addDay()]);
        $this->checkout($other->id)->assertJsonValidationErrors('user_voucher_id');
    }

    public function test_khoa_mien_phi_hoac_da_so_huu_khong_can_mua(): void
    {
        Enrollment::create(['user_id' => $this->student->id, 'course_id' => $this->course->id]);
        $this->checkout()->assertJsonValidationErrors('course');

        $this->course = Course::factory()->published()->create(['price' => 0]);
        $this->checkout()->assertJsonValidationErrors('course');
    }

    public function test_momo_loi_thi_don_that_bai(): void
    {
        $this->momo['create'] = ['resultCode' => 22, 'message' => 'Số tiền không hợp lệ'];

        $this->checkout()->assertJsonValidationErrors('payment');
        $this->assertSame('failed', Order::first()->status);
    }

    public function test_ipn_thanh_cong_ghi_danh_dung_voucher_va_gui_email_mot_lan(): void
    {
        $userVoucher = $this->voucher(10);
        $this->checkout($userVoucher->id);
        $order = Order::first();

        $this->postJson('/api/payments/momo/ipn', $this->momoResult($order))->assertNoContent();
        $this->postJson('/api/payments/momo/ipn', $this->momoResult($order))->assertNoContent(); // MoMo gọi lại

        $order->refresh();
        $this->assertSame(['paid', '4088878653'], [$order->status, $order->momo_trans_id]);
        $this->assertSame(1, Enrollment::where('user_id', $this->student->id)->where('order_id', $order->id)->count());
        $this->assertNotNull($userVoucher->refresh()->used_at);

        Notification::assertSentToTimes($this->student, PaymentSucceeded::class, 1);
        Notification::assertSentTo($this->student, function (PaymentSucceeded $notification) use ($order) {
            $mail = $notification->toMail($this->student);

            return str_contains($mail->subject, $this->course->title)
                && in_array('Mã đơn: '.$order->momo_order_id, $mail->introLines, true)
                && str_ends_with($mail->actionUrl, '/courses/'.$this->course->slug);
        });
    }

    public function test_ipn_sai_chu_ky_hoac_lech_tien_bi_bo_qua(): void
    {
        $this->checkout();
        $order = Order::first();

        $this->postJson('/api/payments/momo/ipn', [...$this->momoResult($order), 'signature' => 'gia-mao'])->assertNoContent();
        $this->postJson('/api/payments/momo/ipn', $this->momoResult($order, 0, 1000))->assertNoContent();

        $this->assertSame('pending', $order->refresh()->status);
        $this->assertDatabaseCount('enrollments', 0);
    }

    public function test_giao_dich_that_bai_khong_tru_voucher(): void
    {
        $userVoucher = $this->voucher(10);
        $this->checkout($userVoucher->id);
        $order = Order::first();

        $this->postJson('/api/payments/momo/ipn', $this->momoResult($order, 1006))->assertNoContent();

        $order->refresh();
        $this->assertSame(['failed', 'Bạn đã hủy thanh toán trên trang MoMo.'], [$order->status, $order->failure_reason]);
        $this->assertNull($userVoucher->refresh()->used_at);
        $this->assertDatabaseCount('enrollments', 0);
        Notification::assertNothingSent();
    }

    public function test_quay_ve_tu_momo_tra_cuu_roi_chot_don(): void
    {
        $this->checkout();
        $order = Order::first();
        $this->momo['query'] = ['resultCode' => 0, 'amount' => $order->amount, 'transId' => 999];

        $this->postJson('/api/payments/momo/return', [...$this->momoResult($order), 'signature' => 'sai'])->assertJsonValidationErrors('signature');
        $this->postJson('/api/payments/momo/return', $this->momoResult($order))
            ->assertOk()
            ->assertJsonPath('status', 'paid')
            ->assertJsonPath('course.slug', $this->course->slug);

        $this->assertTrue(Enrollment::where('user_id', $this->student->id)->exists());
    }

    public function test_chi_xem_va_huy_don_cua_minh(): void
    {
        $this->checkout();
        $order = Order::first();
        // Mặc định MoMo trả 1000: khách chưa thanh toán xong

        $this->getJson('/api/orders')->assertOk()->assertJsonCount(1)
            ->assertJsonPath('0.course.title', $this->course->title)
            ->assertJsonPath('0.status', 'pending')
            ->assertJsonPath('0.pay_url', 'https://test-payment.momo.vn/pay/abc');

        $this->actingAs(User::factory()->create());
        $this->postJson("/api/orders/{$order->id}/cancel")->assertForbidden();
        $this->assertSame('pending', $order->refresh()->status);
    }

    public function test_dang_co_don_cho_thi_khong_tao_them_don_cho_cung_khoa(): void
    {
        $this->checkout()->assertCreated();
        $this->checkout()->assertJsonValidationErrors('course');
        $this->assertDatabaseCount('orders', 1);
    }

    public function test_voucher_dang_giu_cho_don_cho_thi_khong_dung_cho_don_khac(): void
    {
        $userVoucher = $this->voucher(10);
        $this->checkout($userVoucher->id)->assertCreated();

        $this->getJson('/api/my/vouchers')->assertJsonPath('0.usable', false)->assertJsonPath('0.reserved', true);
        $this->course = Course::factory()->published()->create(['price' => 299000]);
        $this->checkout($userVoucher->id)->assertJsonValidationErrors('user_voucher_id');
    }

    public function test_huy_don_tra_voucher_roi_mua_lai_duoc(): void
    {
        $userVoucher = $this->voucher(10);
        $this->checkout($userVoucher->id);
        $order = Order::first();

        $this->postJson("/api/orders/{$order->id}/cancel")->assertOk()
            ->assertJsonPath('status', 'failed')
            ->assertJsonPath('failure_reason', 'Bạn đã hủy đơn.')
            ->assertJsonPath('pay_url', null);

        $this->getJson('/api/my/vouchers')->assertJsonPath('0.usable', true)->assertJsonPath('0.reserved', false);
        $this->checkout($userVoucher->id)->assertCreated();
    }

    public function test_don_qua_100_phut_het_han_cung_link_momo_va_tra_voucher(): void
    {
        $userVoucher = $this->voucher(10);
        $this->checkout($userVoucher->id);

        $this->travel(99)->minutes();
        $this->getJson('/api/orders')->assertJsonPath('0.status', 'pending');

        $this->travel(2)->minutes();
        $this->getJson('/api/orders')
            ->assertJsonPath('0.status', 'failed')
            ->assertJsonPath('0.failure_reason', 'Hết hạn thanh toán (quá 100 phút).');
        $this->getJson('/api/my/vouchers')->assertJsonPath('0.usable', true);
    }

    public function test_tien_da_tru_thi_van_ghi_danh_du_don_da_dong(): void
    {
        $this->checkout();
        $order = Order::first();
        $this->postJson("/api/orders/{$order->id}/cancel");

        // MoMo báo thành công muộn (khách đã trả tiền trên link cũ)
        $this->postJson('/api/payments/momo/ipn', $this->momoResult($order))->assertNoContent();

        $order->refresh();
        $this->assertSame(['paid', null], [$order->status, $order->failure_reason]);
        $this->assertTrue(Enrollment::where('user_id', $this->student->id)->where('course_id', $this->course->id)->exists());
        Notification::assertSentToTimes($this->student, PaymentSucceeded::class, 1);
    }

    public function test_loi_cua_yeu_cau_tra_cuu_khong_ket_luan_don_that_bai(): void
    {
        $this->checkout();
        $this->momo['query'] = ['resultCode' => 99, 'message' => 'Lỗi không xác định'];
        $this->getJson('/api/orders')->assertJsonPath('0.status', 'pending');

        $this->momo['query'] = null; // mất kết nối khi tra cứu
        $this->getJson('/api/orders')->assertOk()->assertJsonPath('0.status', 'pending');
    }

    public function test_mat_ket_noi_momo_khi_tao_giao_dich(): void
    {
        $this->momo['create'] = null;

        $this->checkout()->assertJsonValidationErrors(['payment' => 'không kết nối được']);
        $this->assertSame('failed', Order::first()->status);
    }

    public function test_voucher_khong_giam_xuong_duoi_muc_toi_thieu_cua_momo(): void
    {
        // 25% của 1.200đ là 300đ, nhưng MoMo chỉ nhận từ 1.000đ nên chỉ giảm 200đ
        $this->course->update(['price' => 1200]);
        $this->checkout($this->voucher(25)->id)->assertJsonPath('order.discount', 200)->assertJsonPath('order.amount', 1000);
    }
}
