// Ánh sáng phòng thú cưng theo giờ thật (0–24): mặt trời mọc 6 giờ, lặn 18 giờ (hàm thuần, kiểm thử được)

const DAY_SKY = '#8fd0ff'
const DUSK_SKY = '#ffab7a'
const NIGHT_SKY = '#1c2056'
const DAY_BACKGROUND = '#eef0ff'
const NIGHT_BACKGROUND = '#262a5c'

// Trộn hai màu hex theo tỉ lệ t (0 → a, 1 → b)
export function mixColor(a, b, t) {
  const channels = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
  const [ca, cb] = [channels(a), channels(b)]
  return `#${ca.map((value, i) => Math.round(value + (cb[i] - value) * t).toString(16).padStart(2, '0')).join('')}`
}

/**
 * sun: độ cao mặt trời 0 (đêm) → 1 (giữa trưa); night: 1 khi tối hẳn (đèn trong phòng bật, sao hiện).
 * Trả về màu trời ngoài cửa sổ, màu nền, màu và cường độ nắng, ánh sáng môi trường, vị trí nguồn sáng chính.
 */
export function daylight(hour) {
  const angle = ((hour - 6) / 12) * Math.PI
  const sun = Math.max(0, Math.sin(angle))
  const night = 1 - Math.min(1, sun * 4)
  const dusk = sun > 0 ? Math.max(0, 1 - sun * 3) : 0
  const daySky = mixColor(DAY_SKY, DUSK_SKY, dusk)

  return {
    sun,
    night,
    sky: mixColor(daySky, NIGHT_SKY, night),
    background: mixColor(DAY_BACKGROUND, NIGHT_BACKGROUND, night),
    sunColor: night > 0.5 ? '#a9b8ff' : mixColor('#fff4e6', '#ffb36b', dusk),
    sunIntensity: 0.35 + 1.5 * sun,
    ambient: 0.45 + 1.1 * sun,
    // Ban ngày: nắng theo hướng mặt trời; ban đêm: ánh trăng chiếu chếch từ cửa sổ
    sunPosition: sun > 0 ? [Math.cos(angle) * 5, 1 + sun * 5, 3] : [2, 4, -3],
  }
}

export const isNight = (hour) => daylight(hour).night > 0.5
