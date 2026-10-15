<?php

namespace App\Services;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Order;
use App\Models\User;
use App\Models\UserVoucher;
use App\Notifications\PaymentSucceeded;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Mua khóa học qua MoMo (cổng sandbox, API v2).
 * Kết quả giao dịch đến từ 2 đường: IPN MoMo gọi về máy chủ (khi đã deploy), hoặc trình duyệt quay lại
 * trang kết quả → kiểm tra chữ ký rồi tra cứu giao dịch với MoMo (dùng khi chạy ở máy cá nhân).
 * Đơn chờ quá hạn link MoMo (100 phút) thì đóng lại để trả voucher; tiền đã trừ thì luôn ghi danh.
 */
class PaymentService
{
    // Mã kết quả MoMo nghĩa là giao dịch chưa xong: giữ đơn ở trạng thái chờ
    private const PENDING_CODES = [1000, 7000, 7002, 9000];

    // Lý do dễ hiểu cho các mã thất bại hay gặp. Mã từ 1000 trở lên là kết quả giao dịch;
    // mã nhỏ hơn là lỗi của chính yêu cầu gửi MoMo (bảo trì, sai định dạng…) nên không kết luận đơn thất bại
    private const FAILURE_REASONS = [
        1001 => 'Tài khoản không đủ tiền.',
        1002 => 'Ngân hàng hoặc nhà phát hành thẻ từ chối giao dịch.',
        1003 => 'Giao dịch đã bị hủy.',
        1004 => 'Số tiền vượt hạn mức thanh toán của bạn.',
        1005 => 'Link hoặc mã QR thanh toán đã hết hạn.',
        1006 => 'Bạn đã hủy thanh toán trên trang MoMo.',
        1007 => 'Tài khoản thanh toán không tồn tại hoặc đang bị khóa.',
    ];

    // Các trường MoMo dùng để ký kết quả giao dịch (IPN và trang quay về)
    private const RESULT_FIELDS = ['amount', 'extraData', 'message', 'orderId', 'orderInfo', 'orderType', 'partnerCode', 'payType', 'requestId', 'responseTime', 'resultCode', 'transId'];

    public function checkout(User $user, Course $course, ?int $userVoucherId): array
    {
        if ($course->status !== Course::STATUS_PUBLISHED || $course->price <= 0) {
            $this->fail('course', 'Khóa học này không cần mua.');
        }
        // Chốt các đơn đang chờ trước (có thể vừa thanh toán xong hoặc đã quá hạn)
        $this->syncPending($user);
        if (Enrollment::where('user_id', $user->id)->where('course_id', $course->id)->exists()) {
            $this->fail('course', 'Bạn đã sở hữu khóa học này.');
        }
        if (Order::awaitingPayment()->where('user_id', $user->id)->where('course_id', $course->id)->exists()) {
            $this->fail('course', 'Bạn đang có đơn chờ thanh toán cho khóa này: hãy thanh toán tiếp hoặc hủy đơn đó.');
        }

        $userVoucher = null;
        if ($userVoucherId) {
            $userVoucher = UserVoucher::with('voucher')->usable()->where('user_id', $user->id)->find($userVoucherId);
            if (! $userVoucher) {
                $this->fail('user_voucher_id', 'Voucher đã dùng, hết hạn, đang giữ cho đơn khác hoặc không thuộc về bạn.');
            }
        }

        $discount = $userVoucher?->voucher->discountFor($course->price) ?? 0;
        $order = Order::create([
            'user_id' => $user->id,
            'course_id' => $course->id,
            'user_voucher_id' => $userVoucher?->id,
            'original_price' => $course->price,
            'discount' => $discount,
            'amount' => $course->price - $discount,
            'status' => Order::STATUS_PENDING,
            'momo_order_id' => 'EQ'.now()->format('ymdHis').Str::upper(Str::random(6)),
            'expires_at' => now()->addMinutes(Order::EXPIRE_MINUTES),
        ]);
        $this->createPayment($order, $course);

        return ['order' => $this->view($order), 'pay_url' => $order->pay_url];
    }

    // IPN: MoMo báo kết quả, có thể gọi nhiều lần cho cùng một đơn
    public function handleIpn(array $data): void
    {
        if (! $this->validSignature($data)) {
            Log::warning('MoMo IPN sai chữ ký', ['orderId' => $data['orderId'] ?? null]);

            return;
        }
        $this->apply($data['orderId'], (int) $data['resultCode'], (int) $data['amount'], $data['transId'] ?? null, $data['message']);
    }

    // Trình duyệt quay về từ MoMo: dữ liệu phải đúng chữ ký, sau đó hỏi lại MoMo để chốt đơn
    public function handleReturn(User $user, array $data): Order
    {
        if (! $this->validSignature($data)) {
            $this->fail('signature', 'Dữ liệu trả về từ MoMo không hợp lệ.');
        }
        $order = Order::where('user_id', $user->id)->where('momo_order_id', $data['orderId'])->firstOrFail();
        $this->syncWithMomo($order);

        return $order->refresh();
    }

    // Tra cứu giao dịch (API query của MoMo) cho đơn còn đang chờ; quá hạn mà chưa trả tiền thì đóng đơn
    public function syncWithMomo(Order $order): void
    {
        if ($order->status !== Order::STATUS_PENDING) {
            return;
        }

        $fields = [
            'partnerCode' => config('services.momo.partner_code'),
            'requestId' => $order->momo_order_id.'-'.now()->timestamp,
            'orderId' => $order->momo_order_id,
        ];
        $response = $this->callMomo('/query', [...$fields, 'lang' => 'vi', 'signature' => $this->sign($fields)]);

        if (isset($response['resultCode'])) {
            $this->apply($order->momo_order_id, (int) $response['resultCode'], (int) ($response['amount'] ?? 0), $response['transId'] ?? null, $response['message'] ?? null);
        }
        if ($order->expires_at?->isPast()) {
            $this->close($order, 'Hết hạn thanh toán (quá '.Order::EXPIRE_MINUTES.' phút).');
        }
    }

    // Tra cứu mọi đơn đang chờ của một học viên (hoặc của tất cả khi chạy theo lịch)
    public function syncPending(?User $user = null): void
    {
        Order::where('status', Order::STATUS_PENDING)
            ->when($user, fn ($query) => $query->where('user_id', $user->id))
            ->each(fn (Order $order) => $this->syncWithMomo($order));
    }

    // Học viên tự hủy đơn: hỏi MoMo trước, lỡ đã trả tiền thì đơn vẫn được chốt thành công
    public function cancel(Order $order): void
    {
        $this->syncWithMomo($order);
        $this->close($order, 'Bạn đã hủy đơn.');
    }

    public function view(Order $order): array
    {
        $order->loadMissing('course:id,title,slug');
        $awaiting = $order->status === Order::STATUS_PENDING && $order->expires_at?->isFuture();

        return [
            ...$order->only('id', 'status', 'original_price', 'discount', 'amount', 'momo_order_id', 'failure_reason', 'paid_at', 'expires_at', 'created_at'),
            'pay_url' => $awaiting ? $order->pay_url : null, // chỉ đưa link khi còn thanh toán tiếp được
            'course' => $order->course,
        ];
    }

    private function createPayment(Order $order, Course $course): void
    {
        $config = config('services.momo');
        $fields = [
            'partnerCode' => $config['partner_code'],
            'requestId' => $order->momo_order_id,
            'amount' => $order->amount,
            'orderId' => $order->momo_order_id,
            'orderInfo' => 'Mua khóa học '.$course->title,
            'redirectUrl' => config('app.frontend_url').'/payment/result',
            'ipnUrl' => config('app.url').'/api/payments/momo/ipn',
            'requestType' => 'payWithMethod', // trang MoMo cho chọn ví, thẻ ATM hoặc thẻ quốc tế
            'extraData' => '',
        ];
        $response = $this->callMomo('/create', [
            ...$fields,
            'lang' => 'vi',
            'autoCapture' => true,
            'signature' => $this->sign($fields),
        ]);

        if (($response['resultCode'] ?? null) !== 0 || empty($response['payUrl'])) {
            $reason = 'Không tạo được giao dịch MoMo: '.($response['message'] ?? 'không kết nối được');
            $order->update(['status' => Order::STATUS_FAILED, 'failure_reason' => $reason]);
            $this->fail('payment', $reason);
        }
        $order->update(['pay_url' => $response['payUrl']]);
    }

    // Gọi API MoMo; mất kết nối thì trả null để nơi gọi tự xử lý
    private function callMomo(string $path, array $body): ?array
    {
        try {
            return Http::timeout(15)->post(config('services.momo.endpoint').$path, $body)->json();
        } catch (ConnectionException $exception) {
            Log::warning('Không kết nối được MoMo', ['path' => $path, 'error' => $exception->getMessage()]);

            return null;
        }
    }

    /**
     * Chốt đơn theo kết quả MoMo, trong một transaction và khóa dòng đơn:
     * thành công → đơn paid, ghi danh khóa học, đánh dấu voucher đã dùng, gửi email xác nhận (chỉ một lần);
     * thất bại → đơn failed kèm lý do, voucher còn nguyên.
     */
    private function apply(string $momoOrderId, int $resultCode, int $amount, ?string $transId, ?string $message): void
    {
        $paid = DB::transaction(function () use ($momoOrderId, $resultCode, $amount, $transId, $message) {
            $order = Order::where('momo_order_id', $momoOrderId)->lockForUpdate()->first();
            if (! $order || $order->status === Order::STATUS_PAID) {
                return null; // đã chốt ở lần gọi trước
            }

            if ($resultCode === 0) {
                if ($amount !== $order->amount) {
                    Log::warning('MoMo trả về số tiền lệch', ['order' => $order->id, 'amount' => $amount]);

                    return null;
                }
                // Tiền đã trừ thì luôn ghi danh, kể cả đơn vừa bị đóng vì quá hạn hoặc bị hủy
                $order->update(['status' => Order::STATUS_PAID, 'momo_trans_id' => $transId, 'paid_at' => now(), 'failure_reason' => null]);
                Enrollment::updateOrCreate(['user_id' => $order->user_id, 'course_id' => $order->course_id], ['order_id' => $order->id]);
                if ($order->user_voucher_id) {
                    UserVoucher::whereKey($order->user_voucher_id)->whereNull('used_at')->update(['used_at' => now()]);
                }

                return $order;
            }

            if ($order->status === Order::STATUS_PENDING && $resultCode >= 1000 && ! in_array($resultCode, self::PENDING_CODES, true)) {
                $reason = self::FAILURE_REASONS[$resultCode] ?? ($message ?: "Giao dịch không thành công (mã {$resultCode}).");
                $order->update(['status' => Order::STATUS_FAILED, 'failure_reason' => $reason]);
            }

            return null;
        });

        $paid?->user->notify(new PaymentSucceeded($paid));
    }

    // Đóng đơn còn đang chờ (điều kiện nằm ngay trong câu UPDATE nên không đè lên đơn vừa được chốt)
    private function close(Order $order, string $reason): void
    {
        Order::whereKey($order->id)->where('status', Order::STATUS_PENDING)
            ->update(['status' => Order::STATUS_FAILED, 'failure_reason' => $reason]);
    }

    // Chữ ký HMAC-SHA256 trên chuỗi "khóa=giá trị" xếp theo tên khóa (có thêm accessKey)
    public function sign(array $fields): string
    {
        $fields['accessKey'] = config('services.momo.access_key');
        ksort($fields, SORT_STRING);
        $raw = collect($fields)->map(fn ($value, $key) => "{$key}={$value}")->implode('&');

        return hash_hmac('sha256', $raw, config('services.momo.secret_key'));
    }

    private function validSignature(array $data): bool
    {
        if (array_diff([...self::RESULT_FIELDS, 'signature'], array_keys($data))) {
            return false;
        }
        $fields = collect($data)->only(self::RESULT_FIELDS)->all();

        return hash_equals($this->sign($fields), (string) $data['signature']);
    }

    private function fail(string $field, string $message): never
    {
        throw ValidationException::withMessages([$field => $message]);
    }
}
