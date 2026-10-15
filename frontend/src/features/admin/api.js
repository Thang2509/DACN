import { api } from '../../lib/api'

export const getUsers = ({ search = '', role = '', page = 1 }) =>
  api(`/admin/users?${new URLSearchParams({ search, role, page })}`)
export const setUserRole = (id, role) => api(`/admin/users/${id}/role`, { method: 'PUT', body: { role } })

export const getReviewCourses = ({ status, page = 1 }) => api(`/admin/courses?${new URLSearchParams({ status, page })}`)
export const approveCourse = (id) => api(`/admin/courses/${id}/approve`, { method: 'POST' })
export const rejectCourse = (id, note) => api(`/admin/courses/${id}/reject`, { method: 'POST', body: { note } })

export const getAdminStats = () => api('/admin/stats')

// Cấu hình nhiệm vụ, huy hiệu, voucher (type: quests | badges | vouchers)
export const getRewardConfig = () => api('/admin/rewards')
export const saveRewardConfig = (type, { id, ...values }) =>
  id ? api(`/admin/rewards/${type}/${id}`, { method: 'PUT', body: values }) : api(`/admin/rewards/${type}`, { method: 'POST', body: values })

// Lộ trình học: course_ids theo đúng thứ tự học
export const getPaths = () => api('/admin/paths')
export const savePath = ({ id, ...values }) =>
  id ? api(`/admin/paths/${id}`, { method: 'PUT', body: values }) : api('/admin/paths', { method: 'POST', body: values })
export const deletePath = (id) => api(`/admin/paths/${id}`, { method: 'DELETE' })
