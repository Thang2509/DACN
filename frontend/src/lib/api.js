// Gọi API Laravel. Khi chạy dev, Vite proxy chuyển /api và /sanctum sang backend.

function getCookie(name) {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : ''
}

export async function api(path, { method = 'GET', body } = {}) {
  // Request thay đổi dữ liệu cần cookie XSRF-TOKEN; lần đầu thì xin Laravel cấp
  if (method !== 'GET' && !getCookie('XSRF-TOKEN')) {
    await fetch('/sanctum/csrf-cookie', { credentials: 'include' })
  }

  const isForm = body instanceof FormData
  const res = await fetch(`/api${path}`, {
    method,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(isForm ? {} : { 'Content-Type': 'application/json' }),
      'X-XSRF-TOKEN': getCookie('XSRF-TOKEN'),
    },
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  })

  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const error = new Error(data?.message || res.statusText)
    error.status = res.status
    error.errors = data?.errors // lỗi kiểm tra dữ liệu (422) theo từng trường
    error.data = data
    throw error
  }
  return data
}

// { search: 'sql', level: '' } → "?search=sql" (bỏ giá trị rỗng)
export function toQuery(params = {}) {
  const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value !== '' && value != null))
  return query.size ? `?${query}` : ''
}

// Gói một tệp vào FormData để tải lên
export function toFormData(field, file) {
  const form = new FormData()
  form.append(field, file)
  return form
}

// Lỗi đầu tiên của một trường trong lỗi 422, vd fieldError(error, 'email')
export function fieldError(error, field) {
  return error?.errors?.[field]?.[0]
}
