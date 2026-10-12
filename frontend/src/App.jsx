import { lazy, Suspense } from 'react'
import { BrowserRouter, NavLink, Outlet, Route, Routes } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from './lib/api'
import DesignPreview from './components/DesignPreview'

// Trang 3D tải riêng để three.js không làm chậm các trang khác
const PetPage = lazy(() => import('./features/pet/PetPage'))

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<DesignPreview />} />
          <Route path="/pet" element={<PetPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

function Layout() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-primary-100 bg-white/90 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
          <span className="text-xl font-extrabold text-primary-700">
            Edu<span className="text-accent-500">Quest</span>
          </span>
          <NavItem to="/">Design system</NavItem>
          <NavItem to="/pet">Thú cưng</NavItem>
          <ApiStatus />
        </nav>
      </header>
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
      end
      className={({ isActive }) =>
        `font-semibold ${isActive ? 'text-primary-700' : 'text-muted hover:text-primary-600'}`
      }
    >
      {children}
    </NavLink>
  )
}

// Hiển thị backend Laravel đã kết nối hay chưa
function ApiStatus() {
  const { isSuccess, isLoading } = useQuery({ queryKey: ['ping'], queryFn: () => api('/ping') })
  const text = isLoading ? 'Đang kết nối…' : isSuccess ? 'API đã kết nối' : 'Chưa chạy backend'
  return (
    <span className="ml-auto flex items-center gap-2 text-sm text-muted">
      <span className={`size-2 rounded-full ${isSuccess ? 'bg-success' : 'bg-danger'}`} />
      {text}
    </span>
  )
}
