import { describe, expect, it } from 'vitest'
import { ellipsoid, makeField, occlusion, roundCone, smoothMin, surfaceNets } from './mesher'

// Số lần mỗi cạnh được các tam giác dùng: lưới kín thì cạnh nào cũng đúng 2 lần
function edgeUses(indices) {
  const uses = new Map()
  for (let t = 0; t < indices.length; t += 3) {
    for (let e = 0; e < 3; e++) {
      const a = indices[t + e]
      const b = indices[t + ((e + 1) % 3)]
      const key = a < b ? `${a},${b}` : `${b},${a}`
      uses.set(key, (uses.get(key) ?? 0) + 1)
    }
  }
  return [...uses.values()]
}

describe('hàm khoảng cách', () => {
  it('hình nón bo tròn: âm bên trong, bằng 0 trên mặt, dương bên ngoài', () => {
    const a = [0, 0, 0]
    const b = [0, 1, 0]
    expect(roundCone(0, 0.5, 0, a, b, 0.2, 0.1)).toBeLessThan(0)
    expect(roundCone(0.2, 0, 0, a, b, 0.2, 0.1)).toBeCloseTo(0, 5)
    expect(roundCone(0, 1.5, 0, a, b, 0.2, 0.1)).toBeCloseTo(0.4, 5)
  })

  it('elip và hợp mềm', () => {
    expect(ellipsoid(0, 0, 0, [0, 0, 0], [1, 2, 3])).toBeLessThan(0)
    expect(ellipsoid(2, 0, 0, [0, 0, 0], [1, 2, 3])).toBeGreaterThan(0)
    expect(smoothMin(1, 1, 0.5)).toBeLessThan(1) // chỗ nối phồng ra
    expect(smoothMin(0, 5, 0.5)).toBe(0) // xa nhau thì như hợp thường
  })
})

describe('surfaceNets', () => {
  const ball = makeField([{ shape: 'sphere', c: [0, 0, 0], r: 0.3 }])
  const mesh = surfaceNets(ball, [-0.4, -0.4, -0.4], [0.4, 0.4, 0.4], 0.02)

  it('đỉnh nằm trên mặt cầu, pháp tuyến hướng ra ngoài', () => {
    expect(mesh.positions.length / 3).toBeGreaterThan(500)
    for (let v = 0; v < mesh.positions.length; v += 3) {
      const p = [mesh.positions[v], mesh.positions[v + 1], mesh.positions[v + 2]]
      expect(Math.hypot(...p)).toBeCloseTo(0.3, 2)
      expect(p[0] * mesh.normals[v] + p[1] * mesh.normals[v + 1] + p[2] * mesh.normals[v + 2]).toBeGreaterThan(0)
    }
  })

  it('lưới kín và mọi tam giác quay mặt ra ngoài', () => {
    expect(edgeUses(mesh.indices).every((count) => count === 2)).toBe(true)
    const { positions: p, indices: f } = mesh
    for (let t = 0; t < f.length; t += 3) {
      const [a, b, c] = [f[t] * 3, f[t + 1] * 3, f[t + 2] * 3]
      const e1 = [p[b] - p[a], p[b + 1] - p[a + 1], p[b + 2] - p[a + 2]]
      const e2 = [p[c] - p[a], p[c + 1] - p[a + 1], p[c + 2] - p[a + 2]]
      const normal = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]]
      expect(normal[0] * p[a] + normal[1] * p[a + 1] + normal[2] * p[a + 2]).toBeGreaterThan(0)
    }
  })

  it('hai khối hòa mềm thành một lưới liền, khoét được hốc', () => {
    const body = makeField([
      { shape: 'ellipsoid', c: [0, 0, 0], r: [0.2, 0.15, 0.3] },
      { shape: 'cone', a: [0, 0.1, 0.25], b: [0, 0.3, 0.35], r1: 0.08, r2: 0.06, k: 0.05 },
      { shape: 'sphere', c: [0, 0.15, 0], r: 0.05, k: 0.01, cut: true },
    ])
    const joined = surfaceNets(body, [-0.3, -0.3, -0.4], [0.3, 0.5, 0.5], 0.02)
    expect(edgeUses(joined.indices).every((count) => count === 2)).toBe(true)
    expect(body(0, 0.15, 0)).toBeGreaterThan(0) // tâm hốc nằm ngoài vật
  })

  it('chỗ lõm bị che nên tối hơn chỗ lồi', () => {
    const body = makeField([
      { shape: 'sphere', c: [-0.1, 0, 0], r: 0.1 },
      { shape: 'sphere', c: [0.1, 0, 0], r: 0.1, k: 0.02 },
    ])
    const crease = occlusion(body, [0, 0.03, 0], [0, 1, 0])
    const top = occlusion(body, [-0.1, 0.1, 0], [0, 1, 0])
    expect(crease).toBeLessThan(top)
  })
})
