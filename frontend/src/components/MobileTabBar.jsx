import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { canTeach, isAdmin, useLogout } from '../features/auth/api'
import Icon from './Icons'

/**
 * Thanh tab dưới đáy cho điện thoại và màn hình nhỏ (ẩn từ 1280px trở lên, khi đó dùng menu trên header).
 * 4 mục chính + "Thêm" mở bảng các mục còn lại.
 */
export default function MobileTabBar({ user }) {
  const [moreOpen, setMoreOpen] = useState(false)
  const logout = useLogout()
  const close = () => setMoreOpen(false)

  const tabs = user
    ? [
        { to: '/courses', icon: 'book', label: 'Khóa học' },
        { to: '/my-courses', icon: 'play', label: 'Học' },
        { to: '/pet', icon: 'paw', label: 'Thú cưng' },
        { to: '/quests', icon: 'quest', label: 'Nhiệm vụ' },
      ]
    : [
        { to: '/', icon: 'home', label: 'Trang chủ', end: true },
        { to: '/courses', icon: 'book', label: 'Khóa học' },
        { to: '/pet', icon: 'paw', label: 'Thú cưng' },
        { to: '/login', icon: 'login', label: 'Đăng nhập' },
      ]
  const more = [
    { to: '/', icon: 'home', label: 'Trang chủ' },
    { to: '/achievements', icon: 'trophy', label: 'Thành tích' },
    { to: '/leaderboard', icon: 'podium', label: 'Xếp hạng' },
    { to: '/shop', icon: 'shop', label: 'Cửa hàng' },
    { to: '/review', icon: 'cards', label: 'Ôn tập' },
    { to: '/orders', icon: 'receipt', label: 'Đơn hàng' },
    { to: '/profile', icon: 'user', label: 'Hồ sơ' },
    canTeach(user) && { to: '/instructor', icon: 'teach', label: 'Giảng dạy' },
    isAdmin(user) && { to: '/admin', icon: 'shield', label: 'Quản trị' },
  ].filter(Boolean)

  const tabClass = ({ isActive }) =>
    `flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${isActive ? 'text-primary-600' : 'text-muted'}`

  return (
    <>
      {moreOpen && (
        <>
          <button type="button" className="fixed inset-0 z-30 bg-ink/30 xl:hidden" onClick={close} aria-label="Đóng" />
          <div className="fixed inset-x-0 bottom-16 z-40 animate-drop rounded-t-3xl bg-card p-4 shadow-card xl:hidden">
            <div className="grid grid-cols-4 gap-2">
              {more.map((item) => (
                <NavLink key={item.to} to={item.to} end onClick={close} className={({ isActive }) => `flex flex-col items-center gap-1 rounded-2xl p-2 text-xs font-semibold ${isActive ? 'bg-primary-50 text-primary-700' : 'text-ink'}`}>
                  <Icon name={item.icon} />
                  {item.label}
                </NavLink>
              ))}
              <button
                type="button"
                onClick={() => {
                  close()
                  logout.mutate()
                }}
                className="flex flex-col items-center gap-1 rounded-2xl p-2 text-xs font-semibold text-danger"
              >
                <Icon name="logout" />
                Đăng xuất
              </button>
            </div>
          </div>
        </>
      )}

      <nav
        className={`fixed inset-x-0 bottom-0 z-40 grid h-16 border-t border-primary-100 bg-card/95 backdrop-blur xl:hidden ${user ? 'grid-cols-5' : 'grid-cols-4'}`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {tabs.map((tab) => (
          <NavLink key={tab.to} to={tab.to} end={tab.end} onClick={close} className={tabClass}>
            <Icon name={tab.icon} />
            {tab.label}
          </NavLink>
        ))}
        {user && (
          <button type="button" onClick={() => setMoreOpen(!moreOpen)} className={tabClass({ isActive: moreOpen })}>
            <Icon name="menu" />
            Thêm
          </button>
        )}
      </nav>
    </>
  )
}
