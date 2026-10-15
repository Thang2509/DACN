// Trạng thái thú cưng; tư thế từng trạng thái tính bằng code trong petMotion.js
// once: chạy 1 lần trong duration giây rồi chuyển sang next
export const PET_STATES = {
  idle: { label: 'Đứng' },
  walk: { label: 'Đi' },
  run: { label: 'Chạy' },
  jump: { label: 'Nhảy', once: true, duration: 1, next: 'idle' },
  eat: { label: 'Ăn' },
  sleep: { label: 'Ngủ' },
  happy: { label: 'Vui' },
  sad: { label: 'Buồn' },
}

/**
 * 8 loài thú cưng (khớp dữ liệu mẫu pet_species). Hình dáng, màu lông, cách di chuyển dựng bằng code trong
 * anatomy.js / petMotion.js; ở đây chỉ giữ màu hào quang dùng khi tiến hóa và hiệu ứng lấp lánh.
 */
export const SPECIES = {
  shiba: { aura: '#ffc94d' },
  rabbit: { aura: '#ffd1e8' },
  tabby: { aura: '#9be8ff' },
  capybara: { aura: '#ffcf8a' },
  corgi: { aura: '#ffb36b' },
  hamster: { aura: '#ffe08a' },
  persian: { aura: '#ffc6ef' },
  hedgehog: { aura: '#b6f0a0' },
}

// Giai đoạn lớn lên: thú to dần theo tỉ lệ
export const STAGES = {
  hatchling: { label: 'Mới nở', scale: 0.5 },
  baby: { label: 'Con non', scale: 0.7 },
  adult: { label: 'Trưởng thành', scale: 1 },
  evolved: { label: 'Tiến hóa', scale: 1.1 },
}

// Tâm trạng do máy chủ tính → trạng thái mặc định khi thú đứng yên
export const MOODS = {
  happy: { label: 'Vui vẻ', state: 'happy' },
  normal: { label: 'Bình thường', state: 'idle' },
  sad: { label: 'Buồn', state: 'sad' },
  sleep: { label: 'Đang ngủ', state: 'sleep' },
}

// Emoji đại diện cho vật phẩm trong cửa hàng, túi đồ (mọi món đều dựng bằng code nên không có ảnh xem trước)
export const ITEM_ICONS = {
  cookie: '🍪',
  apple: '🍎',
  fish: '🐟',
  cake: '🍰',
  flower: '🌸',
  party_hat: '🎉',
  crown: '👑',
  scarf: '🧣',
  bow_tie: '🎀',
  bell_collar: '🔔',
  backpack: '🎒',
  wings: '🪶',
  food_bowl: '🥣',
  pet_bed: '🛏️',
  rug_round: '🟠',
  rug_rectangle: '🟫',
  plant_small: '🪴',
  plant_large: '🌿',
  cardboard_box: '📦',
  teddy_bear: '🧸',
  floor_lamp: '💡',
  bookcase: '📚',
  armchair: '🪑',
  coffee_table: '☕',
  sofa: '🛋️',
}

export const SLOT_LABELS = { head: 'Đầu', neck: 'Cổ', back: 'Lưng' }
