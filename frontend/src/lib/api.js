// Gọi API Laravel. Khi chạy dev, Vite proxy chuyển /api và /sanctum sang backend.

function getCookie(name) {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : ''
}

export async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(`/api${path}`, {
    method,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      // Sanctum kiểm tra CSRF bằng header này với các request thay đổi dữ liệu
      'X-XSRF-TOKEN': getCookie('XSRF-TOKEN'),
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const error = new Error(data?.message || res.statusText)
    error.status = res.status
    error.errors = data?.errors // lỗi kiểm tra dữ liệu từ Form Request
    throw error
  }
  return data
}

// Gọi một lần trước khi đăng nhập/đăng ký để Laravel đặt cookie XSRF-TOKEN
export function getCsrfCookie() {
  return fetch('/sanctum/csrf-cookie', { credentials: 'include' })
}
