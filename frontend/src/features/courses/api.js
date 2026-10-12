import { api, toFormData } from '../../lib/api'

export const LEVEL_OPTIONS = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' }

// Khóa cache của một khóa học đang soạn
export const courseKey = (id) => ['course', String(id)]

export const getMyCourses = () => api('/instructor/courses')
export const createCourse = (data) => api('/instructor/courses', { method: 'POST', body: data })
export const getCourse = (id) => api(`/instructor/courses/${id}`)
export const updateCourse = (id, data) => api(`/instructor/courses/${id}`, { method: 'PUT', body: data })
export const deleteCourse = (id) => api(`/instructor/courses/${id}`, { method: 'DELETE' })
export const submitCourse = (id) => api(`/instructor/courses/${id}/submit`, { method: 'POST' })
export const uploadThumbnail = (id, file) =>
  api(`/instructor/courses/${id}/thumbnail`, { method: 'POST', body: toFormData('thumbnail', file) })

export const addChapter = (courseId, title) => api(`/instructor/courses/${courseId}/chapters`, { method: 'POST', body: { title } })
export const renameChapter = (id, title) => api(`/instructor/chapters/${id}`, { method: 'PUT', body: { title } })
export const deleteChapter = (id) => api(`/instructor/chapters/${id}`, { method: 'DELETE' })
export const addLesson = (chapterId, title) => api(`/instructor/chapters/${chapterId}/lessons`, { method: 'POST', body: { title } })
export const updateLesson = (id, data) => api(`/instructor/lessons/${id}`, { method: 'PUT', body: data })
export const deleteLesson = (id) => api(`/instructor/lessons/${id}`, { method: 'DELETE' })

// Gửi thứ tự mới của chương và bài: [{ id, lessons: [id, ...] }, ...]
export const saveOutline = (courseId, chapters) =>
  api(`/instructor/courses/${courseId}/outline`, {
    method: 'PUT',
    body: { chapters: chapters.map((chapter) => ({ id: chapter.id, lessons: chapter.lessons.map((lesson) => lesson.id) })) },
  })
