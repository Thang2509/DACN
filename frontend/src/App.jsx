import { lazy, Suspense } from 'react'
import { BrowserRouter, Link, Navigate, NavLink, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import ErrorBoundary from './components/ErrorBoundary'
import MobileTabBar from './components/MobileTabBar'
import SiteFooter from './components/SiteFooter'
import ThemeToggle from './components/ThemeToggle'
import { Alert, Avatar, Button, Card, PageLoading } from './components/ui'
import useDepthEffects from './lib/useDepthEffects'
import { canTeach, isAdmin, resendVerification, useLogout, useUser } from './features/auth/api'
import { ForgotPasswordPage, LoginPage, RegisterPage, ResetPasswordPage, VerifyEmailPage } from './features/auth/AuthPages'
import CatalogPage from './features/courses/CatalogPage'
import CourseDetailPage from './features/courses/CourseDetailPage'
import HomePage from './features/courses/HomePage'
import HeaderStats from './features/gamification/HeaderStats'

// Chỉ các trang khách hay mở đầu tiên nằm trong gói chính; trang còn lại tải riêng khi mở
// (three.js, CodeMirror, sql.js, markdown, biểu đồ… không làm chậm trang chủ)
const page = (loader, name = 'default') => lazy(() => loader().then((module) => ({ default: module[name] })))

const DesignPreview = page(() => import('./components/DesignPreview'))
const ProfilePage = page(() => import('./features/auth/ProfilePage'))
const MyCoursesPage = page(() => import('./features/courses/MyCoursesPage'))
const InstructorCoursesPage = page(() => import('./features/courses/InstructorCoursesPage'))
const InstructorStatsPage = page(() => import('./features/courses/InstructorStatsPage'))
const CourseEditorPage = page(() => import('./features/courses/CourseEditorPage'))
const LessonEditorPage = page(() => import('./features/lesson/LessonEditorPage'))
const LessonPlayerPage = page(() => import('./features/lesson/LessonPlayerPage'))
const ReviewPage = page(() => import('./features/lesson/ReviewPage'))
const QuestsPage = page(() => import('./features/gamification/GamificationPages'), 'QuestsPage')
const AchievementsPage = page(() => import('./features/gamification/GamificationPages'), 'AchievementsPage')
const LeaderboardPage = page(() => import('./features/gamification/GamificationPages'), 'LeaderboardPage')
const ShopPage = page(() => import('./features/gamification/ShopPage'))
const PetPage = page(() => import('./features/pet/PetPage'))
const CollectionPage = page(() => import('./features/pet/CollectionPage'))
const RoomPage = page(() => import('./features/pet/RoomPage'))
const MinigamesPage = page(() => import('./features/pet/MinigamesPage'))
const OrdersPage = page(() => import('./features/payment/PaymentPages'), 'OrdersPage')
const PaymentResultPage = page(() => import('./features/payment/PaymentPages'), 'PaymentResultPage')
const AdminUsersPage = page(() => import('./features/admin/AdminPages'), 'AdminUsersPage')
const CourseReviewPage = page(() => import('./features/admin/AdminPages'), 'CourseReviewPage')
const AdminStatsPage = page(() => import('./features/admin/AdminStatsPage'))
const AdminRewardsPage = page(() => import('./features/admin/AdminRewardsPage'))
const AdminPathsPage = page(() => import('./features/admin/AdminPathsPage'))

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/courses" element={<CatalogPage />} />
          <Route path="/courses/:slug" element={<CourseDetailPage />} />
          <Route path="/courses/:slug/lessons/:lessonSlug" element={<LessonPlayerPage />} />
          <Route path="/design" element={<DesignPreview />} />

          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/email/verify/:id/:hash" element={<VerifyEmailPage />} />

          <Route element={<RequireUser />}>
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/my-courses" element={<MyCoursesPage />} />
            <Route path="/quests" element={<QuestsPage />} />
            <Route path="/achievements" element={<AchievementsPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/progress" element={<Navigate to="/quests" replace />} />
            <Route path="/pet" element={<PetPage />} />
            <Route path="/pet/collection" element={<CollectionPage />} />
            <Route path="/pet/room" element={<RoomPage />} />
            <Route path="/pet/games" element={<MinigamesPage />} />
            <Route path="/review" element={<ReviewPage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/payment/result" element={<PaymentResultPage />} />
          </Route>
          <Route element={<RequireUser allow={canTeach} />}>
            <Route path="/instructor" element={<InstructorCoursesPage />} />
            <Route path="/instructor/stats" element={<InstructorStatsPage />} />
            <Route path="/instructor/courses/:courseId" element={<CourseEditorPage />} />
            <Route path="/instructor/lessons/:lessonId" element={<LessonEditorPage />} />
          </Route>
          <Route element={<RequireUser allow={isAdmin} />}>
            <Route path="/admin" element={<Navigate to="/admin/stats" replace />} />
            <Route path="/admin/stats" element={<AdminStatsPage />} />
            <Route path="/admin/rewards" element={<AdminRewardsPage />} />
            <Route path="/admin/paths" element={<AdminPathsPage />} />
            <Route path="/admin/courses" element={<CourseReviewPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

// Chặn trang cần đăng nhập; allow(user) kiểm tra vai trò, trang theo vai trò cần đã xác thực email
function RequireUser({ allow }) {
  const { user, isLoading } = useUser()
  const location = useLocation()

  if (isLoading) return <PageLoading />
  if (!user) return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />
  if (allow && !allow(user)) return <Card className="text-center">Bạn không có quyền truy cập trang này.</Card>
  if (allow && !user.email_verified_at) return <Card className="text-center">Hãy xác thực email trước khi dùng chức năng này.</Card>
  return <Outlet />
}

function Layout() {
  const { user } = useUser()
  const { pathname } = useLocation()
  useDepthEffects()

  return (
    // overflow-x-clip: khối 3D trang chủ tràn hết bề ngang màn hình mà không sinh thanh cuộn ngang
    <div className="relative isolate flex min-h-screen flex-col overflow-x-clip">
      <PageBackdrop />
      {/* Người dùng bàn phím / trình đọc màn hình bỏ qua thanh menu, vào thẳng nội dung */}
      <a href="#main" className="sr-only z-50 rounded-xl bg-primary-600 px-4 py-2 font-bold text-white focus:not-sr-only focus:fixed focus:top-2 focus:left-2">
        Bỏ qua tới nội dung
      </a>
      <header className="sticky top-0 z-20 border-b border-primary-100 bg-card/90 backdrop-blur">
        <nav className="mx-auto flex h-14 max-w-7xl items-center gap-5 px-4 2xl:max-w-[96rem]">
          <Link to="/" className="text-xl font-extrabold text-primary-700">
            Edu<span className="text-accent-500">Quest</span>
          </Link>
          {/* Dưới 1280px các mục này nằm ở thanh tab dưới đáy */}
          <div className="hidden gap-4 whitespace-nowrap xl:flex">
            <NavItem to="/courses">Khóa học</NavItem>
            {user && <NavItem to="/my-courses">Học của tôi</NavItem>}
            <NavItem to="/pet">Thú cưng</NavItem>
            {user && <NavItem to="/quests">Nhiệm vụ</NavItem>}
            {user && <NavItem to="/achievements">Thành tích</NavItem>}
            {user && <NavItem to="/leaderboard">Xếp hạng</NavItem>}
            {user && <NavItem to="/shop">Cửa hàng</NavItem>}
            {canTeach(user) && <NavItem to="/instructor">Giảng dạy</NavItem>}
            {isAdmin(user) && <NavItem to="/admin">Quản trị</NavItem>}
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            {user && <HeaderStats />}
            <ThemeToggle />
            {user ? <UserMenu user={user} /> : <GuestButtons />}
          </div>
        </nav>
      </header>
      {user && !user.email_verified_at && <VerifyBanner />}
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {/* Đổi trang thì nội dung mới hiện ra nhẹ nhàng (tắt khi người dùng chọn giảm chuyển động) */}
        <div key={pathname} className="motion-safe:animate-page">
          {/* Lỗi ở một trang chỉ làm hỏng trang đó; chuyển trang khác (key đổi) là hết lỗi */}
          <ErrorBoundary>
            <Suspense fallback={<PageLoading />}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </div>
      </main>
      <div className="pb-16 xl:pb-0">
        <SiteFooter />
      </div>
      <MobileTabBar user={user} />
    </div>
  )
}

// Nền phía sau mọi trang: 3 đốm màu mờ đứng yên
function PageBackdrop() {
  return (
    <div aria-hidden className="page-backdrop pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <span className="-top-[10%] -left-[10%] size-[45vw] bg-primary-300" />
      <span className="top-[25%] -right-[12%] size-[38vw] bg-accent-300" />
      <span className="-bottom-[15%] left-[25%] size-[40vw] bg-pink-300" />
    </div>
  )
}

function NotFoundPage() {
  return (
    <Card className="mx-auto max-w-lg space-y-4 py-10 text-center">
      <svg viewBox="0 0 120 120" className="mx-auto size-32" aria-hidden="true">
        <ellipse cx="60" cy="108" rx="34" ry="6" className="fill-primary-100" />
        <path d="M60 12c22 0 36 34 36 58 0 20-16 34-36 34S24 90 24 70c0-24 14-58 36-58z" className="fill-accent-200" />
        <path d="M30 62l12-8 10 10 10-12 10 10 10-8 10 8" fill="none" strokeWidth="4" strokeLinejoin="round" className="stroke-accent-700" />
        <circle cx="48" cy="80" r="4" className="fill-ink" />
        <circle cx="72" cy="80" r="4" className="fill-ink" />
      </svg>
      <p className="text-5xl font-extrabold text-primary-700">404</p>
      <p className="text-muted">Trang này không tồn tại hoặc đã được dời đi. Quả trứng cũng đang bối rối như bạn.</p>
      <div className="flex justify-center gap-2">
        <Link to="/"><Button>Về trang chủ</Button></Link>
        <Link to="/courses"><Button variant="outline">Xem khóa học</Button></Link>
      </div>
    </Card>
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
  const mutation = useLogout()

  return (
    <div className="flex items-center gap-3">
      <Link to="/profile" className="flex items-center gap-2 font-semibold">
        <Avatar user={user} />
        <span className="hidden 2xl:inline">{user.name}</span>
      </Link>
      {/* Khi có thanh tab, nút đăng xuất nằm trong mục "Thêm" */}
      <span className="hidden xl:block">
        <Button size="sm" variant="ghost" onClick={() => mutation.mutate()}>Đăng xuất</Button>
      </span>
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
