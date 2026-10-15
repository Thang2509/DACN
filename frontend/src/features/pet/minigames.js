// Luật chơi dùng chung cho 2 minigame (khớp MinigameService ở backend)

export const GAMES = {
  runner: {
    title: 'Vượt chướng ngại',
    description: 'Thú cưng chạy liên tục, nhảy qua thùng và đá. Càng chạy xa càng nhanh.',
    controls: 'Space, ↑ hoặc chạm màn hình để nhảy',
  },
  keywords: {
    title: 'Hứng từ khóa code',
    description: 'Chỉ hứng những chữ thuộc đúng chủ đề đang yêu cầu (SQL, JavaScript, HTML). Hứng sai mất một mạng.',
    controls: '← → (hoặc A, D) hoặc rê chuột để di chuyển',
  },
}

// Điểm ÷ 100, tối đa 5 xu; chỉ 4 lượt đầu mỗi ngày được thưởng
export const coinsFor = (score) => Math.min(5, Math.floor(score / 100))
export const REWARDED_PLAYS_PER_DAY = 4

// Va chạm hai hộp chữ nhật (tâm x, y và kích thước w, h)
export function overlaps(a, b) {
  return Math.abs(a.x - b.x) * 2 < a.w + b.w && Math.abs(a.y - b.y) * 2 < a.h + b.h
}

/**
 * Bộ sinh số ngẫu nhiên có hạt giống (mulberry32): cùng seed cho cùng dãy số, nên cảnh bày cây, hoa, pháo giấy
 * dựng lại vẫn y hệt. Trả về hàm range(min, max).
 */
export function seededRandom(seed) {
  let state = seed >>> 0
  return (min = 0, max = 1) => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return min + (((t ^ (t >>> 14)) >>> 0) / 4294967296) * (max - min)
  }
}

// ---- Vượt chướng ngại ----
export const GRAVITY = -22
export const JUMP_SPEED = 8

// Tốc độ chạy (đơn vị/giây) tăng dần theo thời gian, tối đa 12
export const runnerSpeed = (seconds) => Math.min(12, 5 + seconds * 0.15)

// Khoảng cách tới chướng ngại kế tiếp: đủ xa để kịp chạm đất rồi nhảy tiếp ở tốc độ hiện tại
export function nextGap(speed, random = Math.random) {
  const airTime = (2 * JUMP_SPEED) / -GRAVITY
  return speed * airTime * 1.3 + random() * 6
}

// ---- Hứng từ khóa ----
export const KEYWORD_SETS = {
  sql: { label: 'từ khóa SQL', words: ['SELECT', 'FROM', 'WHERE', 'JOIN', 'GROUP BY', 'ORDER BY', 'INSERT', 'UPDATE', 'DELETE', 'HAVING'] },
  javascript: { label: 'từ khóa JavaScript', words: ['const', 'let', 'function', 'return', 'await', 'map()', 'filter()', '=>', 'console.log', 'typeof'] },
  html: { label: 'thẻ HTML', words: ['<div>', '<p>', '<a>', '<ul>', '<img>', '<form>', '<input>', '<h1>', '<button>', '<table>'] },
}
const CATEGORY_ORDER = ['sql', 'javascript', 'html']
export const ROUND_SECONDS = 20
export const KEYWORD_GAME_SECONDS = 60
export const LIVES = 3

// Chủ đề đổi mỗi 20 giây
export const categoryAt = (seconds) => CATEGORY_ORDER[Math.floor(seconds / ROUND_SECONDS) % CATEGORY_ORDER.length]

// Chữ rơi xuống: 60% thuộc chủ đề đang yêu cầu, còn lại lấy từ chủ đề khác
export function randomWord(category, random = Math.random) {
  const correct = random() < 0.6
  const pool = correct
    ? KEYWORD_SETS[category].words
    : Object.entries(KEYWORD_SETS).filter(([key]) => key !== category).flatMap(([, set]) => set.words)
  return { text: pool[Math.floor(random() * pool.length)], correct }
}
