import { useEffect } from 'react'

// Ngăn kéo bên phải, không che nội dung chính để vừa đọc bài vừa dùng; Esc để đóng
export default function Drawer({ open, title, onClose, children }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <aside className="fixed bottom-16 right-0 top-14 z-30 xl:bottom-0 flex w-full max-w-md flex-col border-l border-primary-100 bg-card shadow-card">
      <header className="flex items-center justify-between border-b border-primary-100 px-5 py-3">
        <h2 className="font-bold">{title}</h2>
        <button type="button" onClick={onClose} className="rounded-lg px-2 py-1 text-muted hover:bg-primary-50" aria-label="Đóng">✕</button>
      </header>
      <div className="flex-1 overflow-y-auto p-5">{children}</div>
    </aside>
  )
}
