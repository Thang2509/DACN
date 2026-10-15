import { api, toFormData } from '../../lib/api'

// Trình soạn (giảng viên)
export const getLessonEditor = (id) => api(`/instructor/lessons/${id}/editor`)
export const saveBlocks = (id, blocks) => api(`/instructor/lessons/${id}/blocks`, { method: 'PUT', body: { blocks } })
export const uploadFile = (file) => api('/instructor/uploads', { method: 'POST', body: toFormData('file', file) })

// Trình học bài (học viên)
export const getLesson = (courseSlug, lessonSlug) => api(`/courses/${courseSlug}/lessons/${lessonSlug}`)
// Trả lời một câu của khối quiz, máy chủ chấm ngay câu đó
export const answerQuestion = (lessonId, blockId, question, answer) =>
  api(`/lessons/${lessonId}/quiz/${blockId}/answer`, { method: 'POST', body: { question, answer } })
export const completeLesson = (id) => api(`/lessons/${id}/complete`, { method: 'POST' })

// Ôn tập flashcard (SM-2): thẻ đến hạn hôm nay và chấm mức nhớ (again | hard | good | easy)
export const getReviews = () => api('/reviews')
export const reviewCard = (id, rating) => api(`/reviews/${id}`, { method: 'POST', body: { rating } })
