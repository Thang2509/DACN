<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

// Email xác nhận mua khóa học thành công qua MoMo (gửi qua hàng đợi)
class PaymentSucceeded extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Order $order) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $order = $this->order->loadMissing('course');
        $money = fn (int $value) => number_format($value, 0, ',', '.').'đ';

        $mail = (new MailMessage)
            ->subject('Thanh toán thành công: '.$order->course->title)
            ->greeting("Xin chào {$notifiable->name},")
            ->line("EduQuest đã nhận thanh toán qua MoMo cho khóa học **{$order->course->title}**. Khóa học đã được thêm vào mục Khóa học của tôi.")
            ->line('Mã đơn: '.$order->momo_order_id)
            ->line('Mã giao dịch MoMo: '.$order->momo_trans_id)
            ->line('Giá khóa học: '.$money($order->original_price));
        if ($order->discount > 0) {
            $mail->line('Voucher giảm: −'.$money($order->discount));
        }

        return $mail
            ->line('**Đã thanh toán: '.$money($order->amount).'** lúc '.$order->paid_at->format('H:i d/m/Y'))
            ->action('Vào học ngay', config('app.frontend_url').'/courses/'.$order->course->slug)
            ->salutation('Chúc bạn học vui! — EduQuest');
    }
}
