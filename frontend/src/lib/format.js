// 199000 → "199.000đ", 0 → "Miễn phí"
export function formatPrice(price) {
  return price ? `${price.toLocaleString('vi-VN')}đ` : 'Miễn phí'
}

export function formatDate(value) {
  return value ? new Date(value).toLocaleDateString('vi-VN') : ''
}
