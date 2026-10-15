<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Order;
use App\Services\PaymentService;
use Illuminate\Http\Request;

// Mua khóa học qua MoMo sandbox và lịch sử đơn hàng
class PaymentController extends Controller
{
    public function __construct(private PaymentService $payments) {}

    public function checkout(Request $request, Course $course)
    {
        $data = $request->validate(['user_voucher_id' => ['nullable', 'integer']]);

        return response()->json($this->payments->checkout($request->user(), $course, $data['user_voucher_id'] ?? null), 201);
    }

    // MoMo gọi về (không đăng nhập, xác thực bằng chữ ký); luôn trả 204 để MoMo không gọi lại vô hạn
    public function ipn(Request $request)
    {
        $this->payments->handleIpn($request->all());

        return response()->noContent();
    }

    // Trang kết quả gửi lại các tham số MoMo gắn trên URL quay về
    public function handleReturn(Request $request)
    {
        return $this->payments->view($this->payments->handleReturn($request->user(), $request->all()));
    }

    // Hỏi lại MoMo các đơn đang chờ trước khi liệt kê, để trạng thái luôn mới
    public function orders(Request $request)
    {
        $this->payments->syncPending($request->user());

        return Order::where('user_id', $request->user()->id)->latest('id')->get()
            ->map(fn (Order $order) => $this->payments->view($order));
    }

    // Hủy đơn đang chờ để mua lại hoặc lấy lại voucher
    public function cancel(Request $request, Order $order)
    {
        abort_unless($order->user_id === $request->user()->id, 403);
        $this->payments->cancel($order);

        return $this->payments->view($order->refresh());
    }
}
