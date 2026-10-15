import { api } from '../../lib/api'

export const getPets = () => api('/pets')
export const adoptPet = (species) => api('/pets', { method: 'POST', body: { species } })
export const renamePet = (id, nickname) => api(`/pets/${id}`, { method: 'PUT', body: { nickname } })
export const toggleSleep = (id) => api(`/pets/${id}/sleep`, { method: 'POST' })
export const feedPet = (id, itemId) => api(`/pets/${id}/feed`, { method: 'POST', body: { item_id: itemId } })
export const equipItem = (id, itemId) => api(`/pets/${id}/equip`, { method: 'POST', body: { item_id: itemId } })
export const unequipSlot = (id, slot) => api(`/pets/${id}/equip/${slot}`, { method: 'DELETE' })
export const activatePet = (id) => api(`/pets/${id}/activate`, { method: 'POST' })

// Phòng thú cưng
export const getRoom = () => api('/room')
export const saveRoom = (items) => api('/room', { method: 'PUT', body: { items } })

// Minigame: bảng điểm và gửi điểm sau mỗi lượt (thưởng xu xử lý qua hàng đợi)
export const getMinigame = (game) => api(`/minigames/${game}`)
export const submitScore = (game, score, duration) =>
  api(`/minigames/${game}/scores`, { method: 'POST', body: { score, duration } })
