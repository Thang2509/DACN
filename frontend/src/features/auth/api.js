import { useMutation, useQuery } from '@tanstack/react-query'
import { api, toFormData } from '../../lib/api'

// Trả về null thay vì lỗi khi chưa đăng nhập
export const getMe = () =>
  api('/me').catch((error) => {
    if (error.status === 401) return null
    throw error
  })

export const login = (data) => api('/login', { method: 'POST', body: data })
export const register = (data) => api('/register', { method: 'POST', body: data })
export const logout = () => api('/logout', { method: 'POST' })
export const forgotPassword = (data) => api('/forgot-password', { method: 'POST', body: data })
export const resetPassword = (data) => api('/reset-password', { method: 'POST', body: data })
export const verifyEmail = (signedPath) => api(signedPath) // "/email/verify/1/abc?expires=...&signature=..."
export const resendVerification = () => api('/email/verification-notification', { method: 'POST' })

export const updateProfile = (data) => api('/profile', { method: 'PUT', body: data })
export const updateAvatar = (file) => api('/profile/avatar', { method: 'POST', body: toFormData('avatar', file) })
export const updatePassword = (data) => api('/profile/password', { method: 'PUT', body: data })

// Người dùng đang đăng nhập, dùng chung cả ứng dụng qua khóa ['me']
export function useUser() {
  const { data, isLoading } = useQuery({ queryKey: ['me'], queryFn: getMe, staleTime: Infinity })
  return { user: data ?? null, isLoading }
}

/**
 * Đăng xuất rồi tải lại trang chủ (dùng ở menu tài khoản và thanh tab trên điện thoại).
 * Tải lại cả trang thay vì chuyển trang trong ứng dụng: dữ liệu của người dùng cũ bị xóa sạch, và trang
 * cần đăng nhập đang mở không kịp chuyển sang /login (React Router đổi trang chậm hơn việc xóa người dùng).
 */
export function useLogout() {
  return useMutation({
    mutationFn: logout,
    onSuccess: () => window.location.replace('/'),
  })
}

export const canTeach = (user) => ['instructor', 'admin'].includes(user?.role)
export const isAdmin = (user) => user?.role === 'admin'
