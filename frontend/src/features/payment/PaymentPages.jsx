import { Link, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Alert, Badge, Button, Card, PageLoading } from '../../components/ui'
import { fieldError } from '../../lib/api'
import { formatDate, formatPrice } from '../../lib/format'
import { useUser } from '../auth/api'
import { confirmMomoReturn, getOrders, ORDER_STATUS } from './api'
import { PendingOrder } from './CheckoutBox'

// MoMo chuyển về /payment/result?partnerCode=...&orderId=...&signature=...
export function PaymentResultPage() {
  const [params] = useSearchParams()
  const fields = Object.fromEntries(params)
  const { user } = useUser()
  const queryClient = useQueryClient()
  const queryKey = ['momo-return', fields.orderId]
  // Gọi lại nhiều lần vẫn an toàn: máy chủ chỉ chốt đơn một lần. Còn chờ thì 3 giây hỏi lại một lần
  const { data: order, error, isLoading } = useQuery({
    queryKey,
    queryFn: () => confirmMomoReturn(fields),
    enabled: !!fields.orderId,
    retry: false,
    staleTime: Infinity,
    refetchInterval: (query) => (query.state.data?.status === 'pending' ? 3000 : false),
  })

  if (!fields.orderId) return <Card className="text-center">Không có thông tin giao dịch.</Card>
  if (isLoading) return <p className="text-muted">Đang xác nhận thanh toán với MoMo…</p>
  if (error) return <Alert tone="danger">{fieldError(error, 'signature') ?? error.message}</Alert>

  return (
    <Card className="mx-auto max-w-lg space-y-4 text-center">
      {order.status === 'paid' && (
        <>
          <p className="text-5xl text-success">✓</p>
          <h1 className="text-2xl font-extrabold">Thanh toán thành công</h1>
          <p>Bạn đã sở hữu khóa <b>{order.course.title}</b> ({formatPrice(order.amount)}).</p>
          {user && <p className="text-sm text-muted">Biên nhận đã gửi tới email {user.email}.</p>}
          <Link to={`/courses/${order.course.slug}`}><Button size="lg">Vào học ngay</Button></Link>
        </>
      )}
      {order.status === 'failed' && (
        <>
          <h1 className="text-2xl font-extrabold text-danger">Thanh toán chưa thành công</h1>
          <p>{order.failure_reason ?? 'Giao dịch bị hủy hoặc lỗi.'}</p>
          <p className="text-sm text-muted">Bạn chưa bị trừ tiền. Voucher (nếu có) vẫn còn nguyên để dùng lần sau.</p>
          <Link to={`/courses/${order.course.slug}`}><Button>Mua lại</Button></Link>
        </>
      )}
      {order.status === 'pending' && (
        <>
          <h1 className="text-2xl font-extrabold">Đang chờ MoMo xác nhận…</h1>
          <p className="text-muted">Trang tự kiểm tra lại sau vài giây. Nếu chưa thanh toán xong, bạn có thể thanh toán tiếp hoặc hủy đơn.</p>
          <PendingOrder order={order} onCancelled={(view) => queryClient.setQueryData(queryKey, view)} />
        </>
      )}
      <p><Link to="/orders" className="text-sm font-semibold text-primary-600">Xem đơn hàng của tôi</Link></p>
    </Card>
  )
}

export function OrdersPage() {
  const { data: orders = [], isLoading } = useQuery({ queryKey: ['orders'], queryFn: getOrders })

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold">Đơn hàng của tôi</h1>
      {isLoading && <PageLoading title={false} />}
      {!isLoading && orders.length === 0 && <Card className="text-center text-muted">Bạn chưa mua khóa học nào.</Card>}
      <div className="space-y-3">
        {orders.map((order) => (
          <Card key={order.id} className="flex flex-wrap items-center gap-3">
            <div className="min-w-0 flex-1">
              <Link to={`/courses/${order.course.slug}`} className="font-bold hover:text-primary-600">{order.course.title}</Link>
              <p className="text-sm text-muted">
                {formatDate(order.created_at)} · Mã {order.momo_order_id}
                {order.discount > 0 && ` · giảm ${formatPrice(order.discount)}`}
              </p>
              {order.status === 'failed' && order.failure_reason && <p className="text-sm text-danger">{order.failure_reason}</p>}
            </div>
            <span className="font-extrabold">{formatPrice(order.amount)}</span>
            <Badge color={ORDER_STATUS[order.status].color}>{ORDER_STATUS[order.status].label}</Badge>
            {order.status === 'pending' && <div className="w-full sm:max-w-sm sm:ml-auto"><PendingOrder order={order} /></div>}
          </Card>
        ))}
      </div>
    </div>
  )
}
