import { api, toFormData } from '../../lib/api'

export const getLessonEditor = (id) => api(`/instructor/lessons/${id}/editor`)
export const saveBlocks = (id, blocks) => api(`/instructor/lessons/${id}/blocks`, { method: 'PUT', body: { blocks } })
export const uploadFile = (file) => api('/instructor/uploads', { method: 'POST', body: toFormData('file', file) })
