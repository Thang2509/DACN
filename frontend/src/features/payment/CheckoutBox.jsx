import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Alert, Button, Select } from '../../components/ui'
import { fieldError } from '../../lib/api'
import { formatPrice, formatTime } from '../../lib/format'
import { useUser } from '../auth/api'
import { cancelOrder, checkout, discountFor, getMyVouchers, getOrders } from './api'

// Mua khóa học có phí: chọn voucher (nếu có), xem số tiền rồi chuyển sang trang thanh toán MoMo
export default function CheckoutBox({ course }) {
  const { user } = useUser()
  const location = useLocation()
  const queryClient = useQueryClient()
  const { data: vouchers = [] } = useQuery({ queryKey: ['my-vouchers'], queryFn: getMyVouchers, enabled: !!user })
  const { data: orders = [] } = useQuery({ queryKey: ['orders'], queryFn: getOrders, enabled: !!user })
  const [choice, setChoice] = useState('')

  const usable = vouchers.filter((item) => item.usable)
  const reserved = vouchers.filter((item) => item.reserved).length
  // Khóa "v12" thay vì "12" để mục "Không dùng voucher" luôn đứng đầu danh sách
  const chosen = usable.find((item) => `v${item.id}` === choice)
  const discount = discountFor(course.price, chosen?.voucher)
  const ofCourse = orders.filter((order) => order.course.id === course.id)
  const pending = ofCourse.find((order) => order.status === 'pending')
  const paid = ofCourse.some((order) => order.status === 'paid')

  // Máy chủ vừa chốt được đơn đã trả tiền (vd. đóng tab MoMo mà không quay về): tải lại để hiện nút vào học
  useEffect(() => {
    if (paid) queryClient.invalidateQueries({ queryKey: ['course-detail'] })
  }, [paid, queryClient])

  const pay = useMutation({
    mutationFn: () => checkout(course.id, chosen?.id),
    onSuccess: ({ pay_url: payUrl }) => window.location.assign(payUrl),
  })

  if (!user) {
    return <Link to={`/login?redirect=${encodeURIComponent(location.pathname)}`}><Button className="w-full">Đăng nhập để mua</Button></Link>
  }
  if (pending) return <PendingOrder order={pending} />

  return (
    <div className="space-y-3">
      {usable.length > 0 ? (
        <Select
          label="Voucher"
          value={choice}
          onChange={(event) => setChoice(event.target.value)}
          options={{ '': 'Không dùng voucher', ...Object.fromEntries(usable.map((item) => [`v${item.id}`, `${item.code} · ${item.voucher.name}`])) }}
        />
      ) : (
        <p className="text-sm text-muted">
          Đổi xu lấy voucher giảm giá ở <Link to="/shop?tab=vouchers" className="font-semibold text-primary-600">Cửa hàng</Link>.
        </p>
      )}
      {reserved > 0 && (
        <p className="text-sm text-muted">
          {reserved} voucher đang giữ cho đơn chờ thanh toán khác (<Link to="/orders" className="font-semibold text-primary-600">xem đơn</Link>).
        </p>
      )}
      <dl className="space-y-1 text-sm">
        <div className="flex justify-between"><dt className="text-muted">Giá khóa học</dt><dd>{formatPrice(course.price)}</dd></div>
        {discount > 0 && <div className="flex justify-between text-success"><dt>Voucher giảm</dt><dd>−{formatPrice(discount)}</dd></div>}
        <div className="flex justify-between text-lg font-extrabold"><dt>Thanh toán</dt><dd className="text-accent-600">{formatPrice(course.price - discount)}</dd></div>
      </dl>
      <Button className="w-full" onClick={() => pay.mutate()} disabled={pay.isPending || pay.isSuccess}>
        {pay.isPending || pay.isSuccess ? 'Đang chuyển sang MoMo…' : 'Thanh toán qua MoMo'}
      </Button>
      {pay.error && (
        <Alert tone="danger">
          {pay.error.status === 403
            ? 'Hãy xác thực email trước khi mua khóa học.'
            : (fieldError(pay.error, 'course') ?? fieldError(pay.error, 'user_voucher_id') ?? fieldError(pay.error, 'payment') ?? pay.error.message)}
        </Alert>
      )}
    </div>
  )
}

// Số giây còn lại tới một mốc thời gian, cập nhật mỗi giây
function useSecondsLeft(until) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])
  return Math.max(0, Math.round((new Date(until).getTime() - now) / 1000))
}

// Đơn đang chờ: đếm ngược tới lúc link MoMo hết hạn, thanh toán tiếp bằng link MoMo cũ hoặc hủy để lấy lại voucher
export function PendingOrder({ order, onCancelled }) {
  const queryClient = useQueryClient()
  const secondsLeft = useSecondsLeft(order.expires_at)
  const expired = secondsLeft === 0
  const refresh = () => ['orders', 'my-vouchers'].forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }))

  // Hết giờ: hỏi lại máy chủ, máy chủ sẽ đóng đơn và trả voucher
  useEffect(() => {
    if (expired) queryClient.invalidateQueries({ queryKey: ['orders'] })
  }, [expired, queryClient])

  const cancel = useMutation({
    mutationFn: () => cancelOrder(order.id),
    onSuccess: (view) => {
      refresh()
      onCancelled?.(view)
    },
  })

  return (
    <div className="space-y-3 rounded-xl border-2 border-coin/40 bg-coin/10 p-3 text-left">
      <p className="text-sm">
        Đơn <b>{formatPrice(order.amount)}</b> đang chờ thanh toán.{' '}
        {expired ? 'Đơn đã hết hạn.' : <>Còn <b className="tabular-nums">{formatTime(secondsLeft)}</b> để thanh toán.</>}
      </p>
      {order.pay_url && !expired && (
        <a href={order.pay_url} className="block"><Button className="w-full">Thanh toán tiếp trên MoMo</Button></a>
      )}
      <Button variant="outline" className="w-full" onClick={() => cancel.mutate()} disabled={cancel.isPending}>
        {cancel.isPending ? 'Đang hủy…' : 'Hủy đơn'}
      </Button>
      {cancel.error && <Alert tone="danger">{cancel.error.message}</Alert>}
    </div>
  )
}
