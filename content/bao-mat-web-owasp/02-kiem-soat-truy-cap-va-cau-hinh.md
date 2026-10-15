---
title: Kiểm soát truy cập và cấu hình
chapter: Rủi ro phổ biến
summary: Chặn IDOR, tắt debug, cập nhật thư viện.
duration: 12
---
## Luôn kiểm tra quyền sở hữu

```php
// Sai: ai đăng nhập cũng xem được mọi đơn
public function show(Order $order) { return $order; }

// Đúng: chỉ chủ đơn hàng
public function show(Request $request, Order $order)
{
    abort_unless($order->user_id === $request->user()->id, 403);
    return $order;
}
```

Hoặc lọc ngay từ truy vấn: `$request->user()->orders()->findOrFail($id)`.

## Cấu hình an toàn

- `APP_DEBUG=false` trên production: trang lỗi chi tiết làm lộ đường dẫn, biến môi trường.
- Đổi mật khẩu mặc định, tắt tài khoản demo.
- Giới hạn số request (rate limit) cho đăng nhập, gửi OTP.
- Header bảo mật: `Content-Security-Policy`, `X-Content-Type-Options: nosniff`.

## Cập nhật thư viện

```bash
npm audit
composer audit
```

```code javascript
@instructions Viết hàm `visibleOrders(user, orders)` chỉ trả về id các đơn thuộc về người dùng; quản trị viên thấy tất cả.
@starter
function visibleOrders(user, orders) {
}
const orders = [{ id: 1, userId: 5 }, { id: 2, userId: 6 }, { id: 3, userId: 5 }]
console.log(visibleOrders({ id: 5, role: 'student' }, orders))
console.log(visibleOrders({ id: 1, role: 'admin' }, orders))
@solution
function visibleOrders(user, orders) {
  const allowed = user.role === 'admin' ? orders : orders.filter((order) => order.userId === user.id)
  return allowed.map((order) => order.id)
}
const orders = [{ id: 1, userId: 5 }, { id: 2, userId: 6 }, { id: 3, userId: 5 }]
console.log(visibleOrders({ id: 5, role: 'student' }, orders))
console.log(visibleOrders({ id: 1, role: 'admin' }, orders))
@expected
[ 1, 3 ]
[ 1, 2, 3 ]
```

## Tổng kết

```flashcard
abort_unless(..., 403) :: Chặn khi không phải chủ sở hữu
APP_DEBUG=false :: Bắt buộc trên production
Rate limit :: Giới hạn số request để chống dò mật khẩu
npm audit / composer audit :: Kiểm tra thư viện có lỗ hổng
```
