import { describe, expect, it } from 'vitest'
import { ACTIVITIES, BALL_RADIUS, ballResting, besideCell, canPlace, cellAt, cellCenter, findPath, footprint, freeCells, occupancy, stepBall, throwVelocity, tunnelEnds } from './room'

const items = {
  1: { size_x: 2, size_z: 1 }, // sofa
  2: { size_x: 2, size_z: 2, effect: { floor: true } }, // thảm
  3: { size_x: 1, size_z: 1 }, // chậu cây
}
const place = (id, x, z, rotation = 0) => ({ pet_item_id: id, x, z, rotation })

describe('footprint', () => {
  it('xoay 90° thì đổi chiều', () => {
    expect(footprint(items[1], 0)).toEqual([2, 1])
    expect(footprint(items[1], 1)).toEqual([1, 2])
    expect(footprint(items[1], 2)).toEqual([2, 1])
  })
})

describe('canPlace', () => {
  const layout = [place(2, 0, 0), place(1, 4, 4)]

  it('đồ đứng đặt lên thảm được, thảm không chồng lên thảm', () => {
    expect(canPlace(layout, items, place(3, 1, 1))).toBe(true)
    expect(canPlace(layout, items, place(2, 1, 1))).toBe(false)
  })

  it('không chồng lên đồ đứng khác và không tràn khỏi sàn', () => {
    expect(canPlace(layout, items, place(3, 5, 4))).toBe(false)
    expect(canPlace(layout, items, place(1, 7, 0))).toBe(false)
    expect(canPlace(layout, items, place(1, 7, 0, 1))).toBe(true)
  })

  it('bỏ qua chính món đang được dời', () => {
    expect(canPlace(layout, items, place(1, 5, 4), 1)).toBe(true)
  })

  it('thảm không chặn đường, đồ đứng thì chặn', () => {
    const { floor, object } = occupancy(layout, items)
    expect(floor.has('0,0')).toBe(true)
    expect(object.has('5,4')).toBe(true)
    expect(object.has('0,0')).toBe(false)
  })
})

describe('tọa độ ô', () => {
  it('tâm ô và ô tại một điểm khớp nhau', () => {
    expect(cellCenter(0, 0)).toEqual([-1.75, -1.75])
    expect(cellCenter(0, 0, 2, 1)).toEqual([-1.5, -1.75])
    expect(cellAt(-1.75, -1.75)).toEqual([0, 0])
    expect(cellAt(1.9, 0.1)).toEqual([7, 4])
  })
})

describe('findPath', () => {
  it('đi vòng qua chướng ngại', () => {
    const wall = new Set(['1,0', '1,1', '1,2'])
    const path = findPath(wall, [0, 0], [2, 0])
    expect(path.at(-1)).toEqual([2, 0])
    expect(path.some(([x, z]) => wall.has(`${x},${z}`))).toBe(false)
    expect(path).toHaveLength(8) // xuống 3, sang 2, lên 3
  })

  it('không tới được thì trả về null', () => {
    expect(findPath(new Set(['1,0', '0,1']), [0, 0], [3, 3])).toBeNull()
  })
})

describe('besideCell', () => {
  it('chọn ô trống sát món đồ, gần thú nhất', () => {
    expect(besideCell(new Set(['3,3']), [3, 3], [0, 3])).toEqual([2, 3])
  })

  it('món đồ bị vây kín thì trả về null', () => {
    expect(besideCell(new Set(['0,0', '1,0', '0,1']), [0, 0], [5, 5])).toBeNull()
    expect(freeCells(new Set(['0,0']))).toHaveLength(63)
  })
})

// Mô phỏng nhiều bước nhỏ (60 khung hình/giây) cho tới khi bóng nằm yên
function simulate(ball, blocked = new Set(), seconds = 8) {
  let state = ball
  for (let t = 0; t < seconds; t += 1 / 60) state = stepBall(state, 1 / 60, blocked)
  return state
}

describe('quả bóng', () => {
  it('ném theo vận tốc tính sẵn thì rơi đúng ô đích', () => {
    const start = [1.4, 1.3, 1.6]
    const target = [-0.75, BALL_RADIUS, 0.25]
    let ball = { x: start[0], y: start[1], z: start[2], ...throwVelocity(start, target, 0.75) }
    for (let i = 0; i < 45; i++) ball = stepBall(ball, 0.75 / 45, new Set())
    expect(cellAt(ball.x, ball.z)).toEqual(cellAt(target[0], target[2]))
  })

  it('nảy rồi lăn chậm dần, cuối cùng nằm yên trong phòng', () => {
    const ball = simulate({ x: 0, y: 1, z: 0, vx: 1, vy: 0, vz: 0.5 })
    expect(ballResting(ball)).toBe(true)
    expect(ball.y).toBeCloseTo(BALL_RADIUS)
    expect(Math.abs(ball.x)).toBeLessThan(2)
    expect(Math.abs(ball.z)).toBeLessThan(2)
  })

  it('dội lại khi chạm tường và không lăn vào ô có đồ vật', () => {
    const wall = simulate({ x: 1.8, y: BALL_RADIUS, z: 0, vx: 3, vy: 0, vz: 0 }, new Set(), 0.2)
    expect(wall.vx).toBeLessThan(0)
    const sofa = new Set(['5,4'])
    const [x, z] = cellCenter(4, 4)
    const ball = simulate({ x, y: BALL_RADIUS, z, vx: 2, vy: 0, vz: 0 }, sofa, 1)
    expect(cellAt(ball.x, ball.z)).not.toEqual([5, 4])
  })
})

describe('đồ chơi trong phòng', () => {
  const tunnel = { size_x: 2, size_z: 1 }

  it('ống chui: hai ô đứng ở hai đầu theo chiều dài ống, kể cả khi xoay', () => {
    expect(tunnelEnds(new Set(), place(1, 3, 2), tunnel)).toEqual([[2, 2], [5, 2]])
    expect(tunnelEnds(new Set(), place(1, 3, 2, 1), tunnel)).toEqual([[3, 1], [3, 4]])
  })

  it('ống chui sát tường hoặc bị đồ chặn một đầu thì không chui được', () => {
    expect(tunnelEnds(new Set(), place(1, 0, 2), tunnel)).toBeNull()
    expect(tunnelEnds(new Set(['5,2']), place(1, 3, 2), tunnel)).toBeNull()
  })

  it('thú to (chó, capybara) không chui hộp, ống, bánh xe; thú nhỏ chạy bánh xe', () => {
    for (const kind of ['dog', 'capybara']) expect(ACTIVITIES[kind].some((name) => ['box', 'tunnel', 'wheel'].includes(name))).toBe(false)
    expect(ACTIVITIES.hamster).toContain('wheel')
    expect(ACTIVITIES.cat).toContain('post')
  })
})
