import { api } from '../../lib/api'

// Mức tiền thấp nhất MoMo nhận cho một giao dịch
const MIN_AMOUNT = 1000

export const getMyVouchers = () => api('/my/vouchers')
export const checkout = (courseId, userVoucherId) =>
  api(`/courses/${courseId}/checkout`, { method: 'POST', body: { user_voucher_id: userVoucherId ?? null } })
// Gửi lại các tham số MoMo gắn trên URL quay về để máy chủ kiểm tra chữ ký và chốt đơn
export const confirmMomoReturn = (params) => api('/payments/momo/return', { method: 'POST', body: params })
// Máy chủ hỏi lại MoMo các đơn đang chờ trước khi trả danh sách
export const getOrders = () => api('/orders')
export const cancelOrder = (id) => api(`/orders/${id}/cancel`, { method: 'POST' })

// Số tiền giảm giống cách máy chủ tính: % giá khóa học, không vượt mức giảm tối đa,
// sau khi giảm vẫn còn ít nhất mức MoMo nhận
export function discountFor(price, voucher) {
  if (!voucher) return 0
  return Math.max(0, Math.min(Math.floor((price * voucher.discount_percent) / 100), voucher.max_discount, price - MIN_AMOUNT))
}

export const ORDER_STATUS = {
  pending: { label: 'Chờ thanh toán', color: 'coin' },
  paid: { label: 'Đã thanh toán', color: 'success' },
  failed: { label: 'Không thành công', color: 'danger' },
}
