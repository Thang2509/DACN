import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { useUser } from '../auth/api'

export const getGamification = () => api('/gamification')

// Cửa hàng đổi xu: mỗi lần mua máy chủ trả lại toàn bộ cửa hàng (số xu, túi đồ mới)
export const getShop = () => api('/shop')
export const buyItem = (id, quantity = 1) => api(`/shop/items/${id}`, { method: 'POST', body: { quantity } })
export const buyEgg = (species) => api(`/shop/eggs/${species}`, { method: 'POST' })
export const redeemVoucher = (id) => api(`/shop/vouchers/${id}`, { method: 'POST' })

export const getBadges = () => api('/badges')
// period: week | last_week | all
export const getLeaderboard = (period) => api(`/leaderboard?period=${period}`)
// studyDays: thứ trong tuần theo ISO (1 = thứ Hai … 7 = Chủ nhật)
export const saveStudyPlan = (studyDays, lessonsPerDay) =>
  api('/study-plan', { method: 'PUT', body: { study_days: studyDays, lessons_per_day: lessonsPerDay } })

export function useGamification() {
  const { user } = useUser()
  return useQuery({ queryKey: ['gamification'], queryFn: getGamification, enabled: !!user })
}

// Phần thưởng xử lý qua hàng đợi nên về chậm vài giây: hỏi lại vài lần sau mỗi lần học
export function refreshRewardsSoon(queryClient) {
  for (const delay of [1500, 4000, 8000]) {
    setTimeout(() => queryClient.invalidateQueries({ queryKey: ['gamification'] }), delay)
  }
}

// Mô tả một dòng sổ cái điểm cho người dùng
export function rewardLabel({ reason, meta }) {
  switch (reason) {
    case 'lesson_completed': return `Hoàn thành bài “${meta?.lesson ?? ''}”`
    case 'quiz_correct': return 'Trả lời đúng câu quiz'
    case 'quiz_perfect': return 'Quiz đúng hết ngay lần đầu'
    case 'course_completed': return `Hoàn thành khóa “${meta?.course ?? ''}”`
    case 'streak_day': return 'Giữ chuỗi ngày học'
    case 'streak_milestone': return `Mốc chuỗi ${meta?.days} ngày`
    case 'quest': return `Nhiệm vụ: ${meta?.quest ?? ''}`
    case 'level_up': return `Lên cấp ${meta?.level}!`
    case 'buy_item': return `Mua ${meta?.item}${meta?.quantity > 1 ? ` ×${meta.quantity}` : ''}`
    case 'buy_egg': return `Mua trứng ${meta?.species}`
    case 'voucher': return `Đổi ${meta?.voucher}`
    case 'demo_bonus': return 'Quà khởi đầu (dữ liệu demo)'
    case 'demo_activity': return 'Hoạt động mẫu (dữ liệu demo)'
    case 'flashcard': return 'Ôn thẻ flashcard'
    case 'badge': return `Huy hiệu mới: ${meta?.badge}`
    case 'minigame': return `Minigame: ${meta?.game}`
    default: return 'Phần thưởng'
  }
}
