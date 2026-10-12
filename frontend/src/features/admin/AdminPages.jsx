import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import CourseStatusBadge from '../../components/CourseStatusBadge'
import { Alert, Avatar, Badge, Button, Card, Input, Select } from '../../components/ui'
import { fieldError } from '../../lib/api'
import { formatDate, formatPrice } from '../../lib/format'
import { useUser } from '../auth/api'
import { approveCourse, getReviewCourses, getUsers, rejectCourse, setUserRole } from './api'

const ROLE_OPTIONS = { student: 'Học viên', instructor: 'Giảng viên', admin: 'Quản trị viên' }

function AdminLayout({ title, children }) {
  const tab = ({ isActive }) =>
    `rounded-xl px-4 py-2 font-semibold ${isActive ? 'bg-primary-600 text-white' : 'text-muted hover:bg-primary-50'}`
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="mr-4 text-3xl font-extrabold">{title}</h1>
        <NavLink to="/admin/courses" className={tab}>Duyệt khóa học</NavLink>
        <NavLink to="/admin/users" className={tab}>Người dùng</NavLink>
      </div>
      {children}
    </div>
  )
}

function Pagination({ data, page, onPage }) {
  if (!data || data.last_page <= 1) return null
  return (
    <div className="flex items-center justify-center gap-3">
      <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => onPage(page - 1)}>← Trước</Button>
      <span className="text-sm text-muted">Trang {page}/{data.last_page}</span>
      <Button size="sm" variant="outline" disabled={page >= data.last_page} onClick={() => onPage(page + 1)}>Sau →</Button>
    </div>
  )
}

export function AdminUsersPage() {
  const { user: me } = useUser()
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState({ search: '', role: '', page: 1 })
  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', filters],
    queryFn: () => getUsers(filters),
    placeholderData: keepPreviousData, // giữ bảng cũ khi đang tải trang mới
  })
  const changeRole = useMutation({
    mutationFn: ({ id, role }) => setUserRole(id, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  })
  const setFilter = (field) => (e) => setFilters({ ...filters, [field]: e.target.value, page: 1 })

  return (
    <AdminLayout title="Quản trị">
      <Card className="grid gap-4 md:grid-cols-[2fr_1fr]">
        <Input placeholder="Tìm theo tên hoặc email…" value={filters.search} onChange={setFilter('search')} />
        <Select options={{ '': 'Mọi vai trò', ...ROLE_OPTIONS }} value={filters.role} onChange={setFilter('role')} />
      </Card>
      {changeRole.error && <Alert tone="danger">{fieldError(changeRole.error, 'role') ?? changeRole.error.message}</Alert>}

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-primary-50 text-muted">
            <tr>
              <th className="px-4 py-3">Người dùng</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Ngày tạo</th>
              <th className="px-4 py-3">Vai trò</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-primary-50">
            {isLoading && <tr><td className="px-4 py-3 text-muted" colSpan={4}>Đang tải…</td></tr>}
            {data?.data.map((user) => (
              <tr key={user.id}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3 font-semibold"><Avatar user={user} /> {user.name}</div>
                </td>
                <td className="px-4 py-3">
                  {user.email} {!user.email_verified_at && <Badge color="danger">Chưa xác thực</Badge>}
                </td>
                <td className="px-4 py-3">{formatDate(user.created_at)}</td>
                <td className="px-4 py-3">
                  <select
                    className="rounded-lg border-2 border-primary-100 px-2 py-1"
                    value={user.role}
                    disabled={user.id === me.id || changeRole.isPending}
                    onChange={(e) => changeRole.mutate({ id: user.id, role: e.target.value })}
                  >
                    {Object.entries(ROLE_OPTIONS).map(([value, text]) => <option key={value} value={value}>{text}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Pagination data={data} page={filters.page} onPage={(page) => setFilters({ ...filters, page })} />
    </AdminLayout>
  )
}

const REVIEW_TABS = { pending: 'Chờ duyệt', published: 'Đã xuất bản', rejected: 'Bị từ chối' }

export function CourseReviewPage() {
  const [status, setStatus] = useState('pending')
  const [page, setPage] = useState(1)
  const { data, isLoading } = useQuery({
    queryKey: ['admin-courses', status, page],
    queryFn: () => getReviewCourses({ status, page }),
    placeholderData: keepPreviousData,
  })

  return (
    <AdminLayout title="Quản trị">
      <div className="flex gap-2">
        {Object.entries(REVIEW_TABS).map(([value, text]) => (
          <Button key={value} size="sm" variant={status === value ? 'primary' : 'outline'} onClick={() => { setStatus(value); setPage(1) }}>
            {text}
          </Button>
        ))}
      </div>
      {isLoading && <p className="text-muted">Đang tải…</p>}
      {data?.data.length === 0 && <Card className="text-center text-muted">Không có khóa học nào.</Card>}
      {data?.data.map((course) => <ReviewItem key={course.id} course={course} />)}
      <Pagination data={data} page={page} onPage={setPage} />
    </AdminLayout>
  )
}

function ReviewItem({ course }) {
  const queryClient = useQueryClient()
  const [rejecting, setRejecting] = useState(false)
  const [note, setNote] = useState('')
  const done = () => queryClient.invalidateQueries({ queryKey: ['admin-courses'] })
  const approve = useMutation({ mutationFn: () => approveCourse(course.id), onSuccess: done })
  const reject = useMutation({ mutationFn: () => rejectCourse(course.id, note), onSuccess: done })

  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold">{course.title}</h3>
            <CourseStatusBadge status={course.status} />
          </div>
          <p className="text-sm text-muted">
            {course.instructor.name} · {course.lessons_count} bài · {formatPrice(course.price)} · cập nhật {formatDate(course.updated_at)}
          </p>
        </div>
        <Link to={`/instructor/courses/${course.id}`}><Button size="sm" variant="ghost">Xem nội dung</Button></Link>
        {course.status === 'pending' && (
          <>
            <Button size="sm" variant="outline" onClick={() => setRejecting(!rejecting)}>Từ chối</Button>
            <Button size="sm" onClick={() => approve.mutate()} disabled={approve.isPending}>Duyệt</Button>
          </>
        )}
      </div>
      {course.review_note && <Alert tone="danger">Lý do từ chối: {course.review_note}</Alert>}
      {rejecting && (
        <div className="flex items-start gap-2">
          <Input placeholder="Lý do từ chối (giảng viên sẽ thấy)" value={note} onChange={(e) => setNote(e.target.value)} error={fieldError(reject.error, 'note')} />
          <Button size="sm" variant="accent" onClick={() => reject.mutate()} disabled={reject.isPending}>Gửi</Button>
        </div>
      )}
      {approve.error && <Alert tone="danger">{fieldError(approve.error, 'course') ?? approve.error.message}</Alert>}
    </Card>
  )
}
