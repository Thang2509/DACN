import { ITEM_ICONS } from './petStates'

// Hình đại diện vật phẩm bằng emoji (mọi món đều dựng bằng code nên không có ảnh xem trước)
export default function ItemIcon({ item, size = 'size-16' }) {
  return <span className={`${size} grid place-items-center text-4xl`}>{ITEM_ICONS[item.code] ?? '🎁'}</span>
}

// Quả trứng vẽ bằng CSS (dùng trong danh sách, đỡ phải tạo nhiều khung 3D)
export function EggIcon({ color, locked = false, size = 'h-14 w-11' }) {
  return (
    <span
      className={`${size} inline-block shadow-inner ${locked ? 'opacity-40 grayscale' : ''}`}
      style={{ background: color, borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%' }}
    />
  )
}
