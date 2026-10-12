// 199000 → "199.000đ", 0 → "Miễn phí"
export function formatPrice(price) {
  return price ? `${price.toLocaleString('vi-VN')}đ` : 'Miễn phí'
}

// 45 → "45 phút", 135 → "2h15", 120 → "2h"
export function formatDuration(minutes) {
  if (!minutes) return ''
  if (minutes < 60) return `${minutes} phút`
  const rest = minutes % 60
  return `${Math.floor(minutes / 60)}h${rest ? String(rest).padStart(2, '0') : ''}`
}

// 83 → "01:23"
export function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds))
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

export function formatDate(value) {
  return value ? new Date(value).toLocaleDateString('vi-VN') : ''
}
