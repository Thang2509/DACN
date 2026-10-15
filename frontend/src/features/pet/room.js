// Lưới sàn phòng thú cưng (khớp RoomService ở backend): 8 × 8 ô, mỗi ô 0,5 đơn vị 3D
export const GRID = 8
export const CELL = 0.5

// Số ô theo trục x, z sau khi xoay (xoay lẻ lần 90° thì đổi chiều)
export function footprint(item, rotation) {
  return rotation % 2 ? [item.size_z, item.size_x] : [item.size_x, item.size_z]
}

// Thảm nằm sát sàn: đồ khác đặt lên trên được, thú đi qua được
export const isFloorItem = (item) => !!item.effect?.floor

export function cellsOf(placement, item) {
  const [width, depth] = footprint(item, placement.rotation)
  const cells = []
  for (let x = placement.x; x < placement.x + width; x++) {
    for (let z = placement.z; z < placement.z + depth; z++) cells.push(`${x},${z}`)
  }
  return cells
}

// Các ô đã có đồ, chia 2 lớp: thảm và đồ đứng; skip: vị trí món đang được dời đi
export function occupancy(layout, itemsById, skip = -1) {
  const floor = new Set()
  const object = new Set()
  layout.forEach((placement, index) => {
    const item = itemsById[placement.pet_item_id]
    if (index === skip || !item) return
    for (const cell of cellsOf(placement, item)) (isFloorItem(item) ? floor : object).add(cell)
  })
  return { floor, object }
}

// Đặt được khi nằm trong sàn và không chồng lên món cùng lớp
export function canPlace(layout, itemsById, placement, skip = -1) {
  const item = itemsById[placement.pet_item_id]
  const [width, depth] = footprint(item, placement.rotation)
  if (placement.x < 0 || placement.z < 0 || placement.x + width > GRID || placement.z + depth > GRID) return false
  const taken = occupancy(layout, itemsById, skip)[isFloorItem(item) ? 'floor' : 'object']
  return cellsOf(placement, item).every((cell) => !taken.has(cell))
}

// Tâm (tọa độ 3D trên sàn) của vùng w × d ô bắt đầu ở ô (x, z); sàn đặt giữa gốc tọa độ
export function cellCenter(x, z, width = 1, depth = 1) {
  const half = (GRID * CELL) / 2
  return [-half + (x + width / 2) * CELL, -half + (z + depth / 2) * CELL]
}

export function cellAt(worldX, worldZ) {
  const half = (GRID * CELL) / 2
  return [Math.floor((worldX + half) / CELL), Math.floor((worldZ + half) / CELL)]
}

/**
 * Đường đi ngắn nhất giữa hai ô (tìm theo chiều rộng, đi 4 hướng), tránh các ô bị chặn.
 * Trả về danh sách ô [x, z] sau ô xuất phát, hoặc null khi không tới được.
 */
export function findPath(blocked, from, to) {
  const key = ([x, z]) => `${x},${z}`
  const previous = new Map([[key(from), null]])
  const queue = [from]
  while (queue.length) {
    const cell = queue.shift()
    if (key(cell) === key(to)) {
      const path = []
      for (let step = cell; key(step) !== key(from); step = previous.get(key(step))) path.unshift(step)
      return path
    }
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const next = [cell[0] + dx, cell[1] + dz]
      const inside = next[0] >= 0 && next[1] >= 0 && next[0] < GRID && next[1] < GRID
      if (inside && !blocked.has(key(next)) && !previous.has(key(next))) {
        previous.set(key(next), cell)
        queue.push(next)
      }
    }
  }
  return null
}

// Các ô trống (thú đi tới được)
export function freeCells(blocked) {
  const cells = []
  for (let x = 0; x < GRID; x++) for (let z = 0; z < GRID; z++) if (!blocked.has(`${x},${z}`)) cells.push([x, z])
  return cells
}

// Ô trống sát cạnh một món đồ (để thú đứng ăn, đứng chơi), ưu tiên ô gần vị trí hiện tại; null nếu bị vây kín
export function besideCell(blocked, cell, from) {
  const around = [[1, 0], [-1, 0], [0, 1], [0, -1]]
    .map(([dx, dz]) => [cell[0] + dx, cell[1] + dz])
    .filter(([x, z]) => x >= 0 && z >= 0 && x < GRID && z < GRID && !blocked.has(`${x},${z}`))
  around.sort((a, b) => Math.hypot(a[0] - from[0], a[1] - from[1]) - Math.hypot(b[0] - from[0], b[1] - from[1]))
  return around[0] ?? null
}

/**
 * Hoạt động tự chọn lúc rảnh theo loài: toy vờn gấu bông, box chui hộp giấy, seat nằm sofa / ghế bành,
 * post cào trụ, wheel chạy bánh xe, tunnel chui ống (thú to như chó, capybara không vừa hộp, ống, bánh xe).
 */
export const ACTIVITIES = {
  dog: ['toy', 'seat'],
  cat: ['toy', 'box', 'seat', 'post', 'tunnel'],
  capybara: ['toy'],
  rabbit: ['toy', 'box', 'tunnel'],
  hamster: ['box', 'wheel', 'tunnel'],
  hedgehog: ['box', 'wheel', 'tunnel'],
}

// Hai ô đứng ở hai đầu ống chui (theo chiều dài ống); null nếu một đầu ra ngoài sàn hoặc bị đồ chặn
export function tunnelEnds(blocked, placement, item) {
  const [width, depth] = footprint(item, placement.rotation)
  const [dx, dz] = width >= depth ? [1, 0] : [0, 1]
  const length = Math.max(width, depth)
  const start = [placement.x - dx, placement.z - dz]
  const end = [placement.x + dx * length, placement.z + dz * length]
  const open = ([x, z]) => x >= 0 && z >= 0 && x < GRID && z < GRID && !blocked.has(`${x},${z}`)
  return open(start) && open(end) ? [start, end] : null
}

// ---- Quả bóng: tự xử lý rơi, nảy, lăn và va chạm (không dùng thư viện vật lý) ----
export const BALL_RADIUS = 0.06
const GRAVITY = 6
const BOUNCE = 0.55
const ROLL_FRICTION = 1.6

// Vận tốc ném để bóng từ start rơi đúng target sau time giây
export function throwVelocity(start, target, time) {
  return {
    vx: (target[0] - start[0]) / time,
    vy: (BALL_RADIUS - start[1]) / time + 0.5 * GRAVITY * time,
    vz: (target[2] - start[2]) / time,
  }
}

/**
 * Một bước mô phỏng: trọng lực, nảy trên sàn (mất dần lực), lăn chậm dần do ma sát,
 * dội lại khi chạm tường hoặc ô có đồ vật (lúc bóng còn thấp). Trả về trạng thái mới.
 */
export function stepBall(ball, delta, blocked) {
  const half = (GRID * CELL) / 2 - BALL_RADIUS
  const next = {
    x: ball.x + ball.vx * delta,
    y: ball.y + ball.vy * delta,
    z: ball.z + ball.vz * delta,
    vx: ball.vx,
    vy: ball.vy - GRAVITY * delta,
    vz: ball.vz,
  }
  if (next.y <= BALL_RADIUS) {
    next.y = BALL_RADIUS
    next.vy = Math.abs(next.vy) > 0.6 ? -next.vy * BOUNCE : 0
    const keep = Math.max(0, 1 - ROLL_FRICTION * delta)
    next.vx *= keep
    next.vz *= keep
  }
  if (Math.abs(next.x) > half) {
    next.x = Math.sign(next.x) * half
    next.vx = -next.vx * 0.6
  }
  if (Math.abs(next.z) > half) {
    next.z = Math.sign(next.z) * half
    next.vz = -next.vz * 0.6
  }
  if (next.y < 0.4 && blocked.has(cellAt(next.x, next.z).join(','))) {
    next.x = ball.x
    next.z = ball.z
    next.vx = -next.vx * 0.5
    next.vz = -next.vz * 0.5
  }
  if (Math.hypot(next.vx, next.vz) < 0.03 && next.y <= BALL_RADIUS) {
    next.vx = 0
    next.vz = 0
  }
  return next
}

// Bóng đã nằm yên trên sàn
export const ballResting = (ball) => ball.y <= BALL_RADIUS + 1e-3 && ball.vy === 0 && Math.hypot(ball.vx, ball.vz) < 0.05
