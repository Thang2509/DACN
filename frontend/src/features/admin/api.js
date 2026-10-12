import { api } from '../../lib/api'

export const getUsers = ({ search = '', role = '', page = 1 }) =>
  api(`/admin/users?${new URLSearchParams({ search, role, page })}`)
export const setUserRole = (id, role) => api(`/admin/users/${id}/role`, { method: 'PUT', body: { role } })

export const getReviewCourses = ({ status, page = 1 }) => api(`/admin/courses?${new URLSearchParams({ status, page })}`)
export const approveCourse = (id) => api(`/admin/courses/${id}/approve`, { method: 'POST' })
export const rejectCourse = (id, note) => api(`/admin/courses/${id}/reject`, { method: 'POST', body: { note } })
