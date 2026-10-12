import { api, toFormData } from '../../lib/api'

// Trình soạn (giảng viên)
export const getLessonEditor = (id) => api(`/instructor/lessons/${id}/editor`)
export const saveBlocks = (id, blocks) => api(`/instructor/lessons/${id}/blocks`, { method: 'PUT', body: { blocks } })
export const uploadFile = (file) => api('/instructor/uploads', { method: 'POST', body: toFormData('file', file) })

// Trình học bài (học viên)
export const getLesson = (id) => api(`/lessons/${id}`)
export const submitQuiz = (lessonId, blockId, answers) =>
  api(`/lessons/${lessonId}/quiz/${blockId}`, { method: 'POST', body: { answers } })
export const completeLesson = (id) => api(`/lessons/${id}/complete`, { method: 'POST' })
