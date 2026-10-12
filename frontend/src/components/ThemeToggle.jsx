import { useState } from 'react'

// Nút chuyển sáng/tối; lựa chọn lưu ở localStorage (index.html đọc lại khi mở trang)
export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme ?? 'light')

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    try {
      localStorage.setItem('theme', next)
    } catch {
      // trình duyệt chặn localStorage: vẫn đổi được trong phiên hiện tại
    }
    setTheme(next)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="grid size-9 place-items-center rounded-full text-lg text-muted hover:bg-primary-50 hover:text-primary-600"
      aria-label={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
      title={theme === 'dark' ? 'Giao diện sáng' : 'Giao diện tối'}
    >
      {theme === 'dark' ? '☀' : '☾'}
    </button>
  )
}
