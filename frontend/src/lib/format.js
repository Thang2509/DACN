// 199000 → "199.000đ", 0 → "Miễn phí"
export function formatPrice(price) {
  return price ? `${price.toLocaleString('vi-VN')}đ` : 'Miễn phí'
}

// 83 → "01:23"
export function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds))
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

export function formatDate(value) {
  return value ? new Date(value).toLocaleDateString('vi-VN') : ''
}
