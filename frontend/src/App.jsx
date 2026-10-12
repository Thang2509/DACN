import { lazy, Suspense } from 'react'
import { BrowserRouter, Link, Navigate, NavLink, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import DesignPreview from './components/DesignPreview'
import ThemeToggle from './components/ThemeToggle'
import { Alert, Avatar, Button, Card } from './components/ui'
import { AdminUsersPage, CourseReviewPage } from './features/admin/AdminPages'
import { canTeach, isAdmin, logout, resendVerification, useUser } from './features/auth/api'
import { ForgotPasswordPage, LoginPage, RegisterPage, ResetPasswordPage, VerifyEmailPage } from './features/auth/AuthPages'
import ProfilePage from './features/auth/ProfilePage'
import CatalogPage from './features/courses/CatalogPage'
import CourseDetailPage from './features/courses/CourseDetailPage'
import CourseEditorPage from './features/courses/CourseEditorPage'
import HomePage from './features/courses/HomePage'
import InstructorCoursesPage from './features/courses/InstructorCoursesPage'
import MyCoursesPage from './features/courses/MyCoursesPage'

// Trang nặng (three.js, CodeMirror, sql.js, markdown) tải riêng khi mở
const PetPage = lazy(() => import('./features/pet/PetPage'))
const LessonEditorPage = lazy(() => import('./features/lesson/LessonEditorPage'))
const LessonPlayerPage = lazy(() => import('./features/lesson/LessonPlayerPage'))

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/courses" element={<CatalogPage />} />
          <Route path="/courses/:slug" element={<CourseDetailPage />} />
          <Route path="/courses/:slug/lessons/:lessonSlug" element={<LessonPlayerPage />} />
          <Route path="/pet" element={<PetPage />} />
          <Route path="/design" element={<DesignPreview />} />

          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/email/verify/:id/:hash" element={<VerifyEmailPage />} />

          <Route element={<RequireUser />}>
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/my-courses" element={<MyCoursesPage />} />
          </Route>
          <Route element={<RequireUser allow={canTeach} />}>
            <Route path="/instructor" element={<InstructorCoursesPage />} />
            <Route path="/instructor/courses/:courseId" element={<CourseEditorPage />} />
            <Route path="/instructor/lessons/:lessonId" element={<LessonEditorPage />} />
          </Route>
          <Route element={<RequireUser allow={isAdmin} />}>
            <Route path="/admin" element={<Navigate to="/admin/courses" replace />} />
            <Route path="/admin/courses" element={<CourseReviewPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

// Chặn trang cần đăng nhập; allow(user) kiểm tra vai trò, trang theo vai trò cần đã xác thực email
function RequireUser({ allow }) {
  const { user, isLoading } = useUser()
  const location = useLocation()

  if (isLoading) return <p className="text-muted">Đang tải…</p>
  if (!user) return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />
  if (allow && !allow(user)) return <Card className="text-center">Bạn không có quyền truy cập trang này.</Card>
  if (allow && !user.email_verified_at) return <Card className="text-center">Hãy xác thực email trước khi dùng chức năng này.</Card>
  return <Outlet />
}

function Layout() {
  const { user } = useUser()

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-primary-100 bg-card/90 backdrop-blur">
        <nav className="mx-auto flex h-14 max-w-6xl items-center gap-5 px-4">
          <Link to="/" className="text-xl font-extrabold text-primary-700">
            Edu<span className="text-accent-500">Quest</span>
          </Link>
          <div className="flex gap-5 overflow-x-auto whitespace-nowrap">
            <NavItem to="/courses">Khóa học</NavItem>
            {user && <NavItem to="/my-courses">Học của tôi</NavItem>}
            <NavItem to="/pet">Thú cưng</NavItem>
            {canTeach(user) && <NavItem to="/instructor">Giảng dạy</NavItem>}
            {isAdmin(user) && <NavItem to="/admin">Quản trị</NavItem>}
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <ThemeToggle />
            {user ? <UserMenu user={user} /> : <GuestButtons />}
          </div>
        </nav>
      </header>
      {user && !user.email_verified_at && <VerifyBanner />}
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Suspense fallback={<p className="text-muted">Đang tải…</p>}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  )
}

function NavItem({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `font-semibold ${isActive ? 'text-primary-700' : 'text-muted hover:text-primary-600'}`}
    >
      {children}
    </NavLink>
  )
}

function GuestButtons() {
  return (
    <div className="flex gap-2">
      <Link to="/login"><Button size="sm" variant="ghost">Đăng nhập</Button></Link>
      <Link to="/register"><Button size="sm">Đăng ký</Button></Link>
    </div>
  )
}

function UserMenu({ user }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      // Không dùng clear(): header đang theo dõi query 'me' sẽ không nhận được giá trị null mới.
      // Đặt người dùng về null trước, rồi xóa dữ liệu khác của người dùng cũ.
      queryClient.setQueryData(['me'], null)
      queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== 'me' })
      navigate('/')
    },
  })

  return (
    <div className="flex items-center gap-3">
      <Link to="/profile" className="flex items-center gap-2 font-semibold">
        <Avatar user={user} />
        <span className="hidden sm:inline">{user.name}</span>
      </Link>
      <Button size="sm" variant="ghost" onClick={() => mutation.mutate()}>Đăng xuất</Button>
    </div>
  )
}

function VerifyBanner() {
  const mutation = useMutation({ mutationFn: resendVerification })
  return (
    <div className="mx-auto max-w-6xl px-4 pt-4">
      <Alert tone="warning" className="flex flex-wrap items-center gap-3">
        <span>Email của bạn chưa được xác thực. Hãy mở link trong hộp thư để dùng đầy đủ tính năng.</span>
        <button className="font-bold underline" onClick={() => mutation.mutate()} disabled={mutation.isPending || mutation.isSuccess}>
          {mutation.isSuccess ? 'Đã gửi lại' : 'Gửi lại email xác thực'}
        </button>
      </Alert>
    </div>
  )
}
