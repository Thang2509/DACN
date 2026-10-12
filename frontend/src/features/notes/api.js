import { api, toQuery } from '../../lib/api'

export const getNotes = (params) => api(`/notes${toQuery(params)}`)
export const createNote = (lessonId, data) => api(`/lessons/${lessonId}/notes`, { method: 'POST', body: data })
export const updateNote = (id, content) => api(`/notes/${id}`, { method: 'PUT', body: { content } })
export const deleteNote = (id) => api(`/notes/${id}`, { method: 'DELETE' })
