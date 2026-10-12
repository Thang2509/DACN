export const MODEL_URL = '/models/shiba.glb'

// Trạng thái thú cưng → clip hoạt ảnh trong file .glb (Quaternius, CC0)
// once: chạy 1 lần; next: trạng thái chuyển sang sau khi chạy xong; speed: tốc độ phát
// Ngủ/vui/buồn đang mượn clip có sẵn, sẽ thay bằng clip riêng làm trong Blender
export const PET_STATES = {
  idle: { label: 'Đứng', clip: 'Idle' },
  walk: { label: 'Đi', clip: 'Walk' },
  run: { label: 'Chạy', clip: 'Gallop' },
  jump: { label: 'Nhảy', clip: 'Gallop_Jump', once: true, next: 'idle' },
  eat: { label: 'Ăn', clip: 'Eating' },
  sleep: { label: 'Ngủ', clip: 'Death', once: true, speed: 0.5 },
  happy: { label: 'Vui', clip: 'Jump_ToIdle', speed: 1.3 },
  sad: { label: 'Buồn', clip: 'Idle_2_HeadLow', speed: 0.6 },
}
