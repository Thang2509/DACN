import { useQuery } from '@tanstack/react-query'
import { BarChart, HorizontalBars, StatCard } from '../../components/Charts'
import { Badge, Card, PageLoading } from '../../components/ui'
import { formatDate, formatPrice } from '../../lib/format'
import { ORDER_STATUS } from '../payment/api'
import { AdminLayout } from './AdminPages'
import { getAdminStats } from './api'

// Thống kê hệ thống: số liệu tổng, 30 ngày gần nhất, khóa học nổi bật, đơn hàng mới
export default function AdminStatsPage() {
  const { data, isLoading } = useQuery({ queryKey: ['admin-stats'], queryFn: getAdminStats })

  return (
    <AdminLayout title="Quản trị">
      {isLoading || !data ? (
        <PageLoading />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Học viên" value={data.totals.students} hint={`${data.totals.instructors} giảng viên`} />
            <StatCard label="Khóa học đã xuất bản" value={data.totals.published_courses} hint={`${data.totals.enrollments} lượt đăng ký`} />
            <StatCard label="Bài học đã hoàn thành" value={data.totals.lessons_completed} />
            <StatCard label="Doanh thu" value={formatPrice(data.totals.revenue)} hint={`${data.totals.paid_orders} đơn đã thanh toán`} />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="space-y-2">
              <h2 className="font-bold">Người dùng mới (30 ngày)</h2>
              <BarChart data={data.daily.new_users} />
            </Card>
            <Card className="space-y-2">
              <h2 className="font-bold">Bài hoàn thành mỗi ngày</h2>
              <BarChart data={data.daily.lessons_completed} barClass="fill-accent-500" />
            </Card>
            <Card className="space-y-2">
              <h2 className="font-bold">Doanh thu mỗi ngày</h2>
              <BarChart data={data.daily.revenue} barClass="fill-success" format={formatPrice} />
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="space-y-3">
              <h2 className="font-bold">Khóa học nhiều học viên nhất</h2>
              <HorizontalBars
                items={data.top_courses.map((course) => ({
                  label: `${course.title} (${course.completed_count} hoàn thành)`,
                  value: course.enrollments_count,
                }))}
                unit=" học viên"
              />
            </Card>
            <Card className="space-y-3">
              <h2 className="font-bold">Đơn hàng gần đây</h2>
              {data.recent_orders.length === 0 && <p className="text-sm text-muted">Chưa có đơn hàng.</p>}
              <ul className="divide-y divide-primary-100 text-sm">
                {data.recent_orders.map((order) => (
                  <li key={order.id} className="flex flex-wrap items-center gap-2 py-2">
                    <span className="font-semibold">{order.user.name}</span>
                    <span className="text-muted">{order.course.title}</span>
                    <span className="ml-auto font-bold">{formatPrice(order.amount)}</span>
                    <Badge color={ORDER_STATUS[order.status].color}>{ORDER_STATUS[order.status].label}</Badge>
                    <span className="w-full text-xs text-muted">{formatDate(order.created_at)}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
