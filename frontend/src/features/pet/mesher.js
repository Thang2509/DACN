/**
 * Dựng lưới tam giác từ hàm khoảng cách có dấu (SDF): giá trị âm ở bên trong vật, dương ở bên ngoài.
 * Thân thú cưng là nhiều khối mềm (hình nón bo tròn, elip, cầu) hòa vào nhau nên liền một khối như thật.
 * Thuật toán "surface nets": mỗi ô lưới mà bề mặt cắt qua sinh một đỉnh (trung bình các điểm cắt trên cạnh ô),
 * mỗi cạnh lưới mà bề mặt cắt qua sinh một tứ giác nối đỉnh của 4 ô quanh cạnh đó.
 * Hàm thuần dùng mảng số, không phụ thuộc three.js nên kiểm thử được.
 */

// Hợp mềm hai khối: k càng lớn chỗ nối càng tròn đầy
export function smoothMin(a, b, k) {
  if (k <= 0) return Math.min(a, b)
  const h = Math.max(k - Math.abs(a - b), 0) / k
  return Math.min(a, b) - h * h * k * 0.25
}

// Khoét mềm khối cut ra khỏi khối d (hốc mắt, khe miệng)
export const smoothSubtract = (d, cut, k) => -smoothMin(-d, cut, k)

// Hình nón bo tròn giữa hai điểm a, b với bán kính r1, r2 (công thức của Inigo Quilez)
export function roundCone(px, py, pz, a, b, r1, r2) {
  const bax = b[0] - a[0]
  const bay = b[1] - a[1]
  const baz = b[2] - a[2]
  const l2 = bax * bax + bay * bay + baz * baz
  const rr = r1 - r2
  const a2 = l2 - rr * rr
  const il2 = 1 / l2
  const pax = px - a[0]
  const pay = py - a[1]
  const paz = pz - a[2]
  const y = pax * bax + pay * bay + paz * baz
  const z = y - l2
  const xx = pax * l2 - bax * y
  const xy = pay * l2 - bay * y
  const xz = paz * l2 - baz * y
  const x2 = xx * xx + xy * xy + xz * xz
  const y2 = y * y * l2
  const z2 = z * z * l2
  const k = Math.sign(rr) * rr * rr * x2
  if (Math.sign(z) * a2 * z2 > k) return Math.sqrt(x2 + z2) * il2 - r2
  if (Math.sign(y) * a2 * y2 < k) return Math.sqrt(x2 + y2) * il2 - r1
  return (Math.sqrt(x2 * a2 * il2) + y * rr) * il2 - r1
}

// Elip trục thẳng (gần đúng, đủ tốt khi chỉ cần dấu và pháp tuyến)
export function ellipsoid(px, py, pz, c, r) {
  const x = px - c[0]
  const y = py - c[1]
  const z = pz - c[2]
  const ax = x / r[0]
  const ay = y / r[1]
  const az = z / r[2]
  const k0 = Math.sqrt(ax * ax + ay * ay + az * az)
  const bx = ax / r[0]
  const by = ay / r[1]
  const bz = az / r[2]
  const k1 = Math.sqrt(bx * bx + by * by + bz * bz)
  return k1 === 0 ? -Math.min(r[0], r[1], r[2]) : (k0 * (k0 - 1)) / k1
}

export function sphere(px, py, pz, c, r) {
  const x = px - c[0]
  const y = py - c[1]
  const z = pz - c[2]
  return Math.sqrt(x * x + y * y + z * z) - r
}

// Khoảng cách tới một khối: { shape: 'cone', a, b, r1, r2 } | { shape: 'ellipsoid', c, r } | { shape: 'sphere', c, r }
export function primitiveDistance(p, x, y, z) {
  if (p.shape === 'cone') return roundCone(x, y, z, p.a, p.b, p.r1, p.r2)
  if (p.shape === 'ellipsoid') return ellipsoid(x, y, z, p.c, p.r)
  return sphere(x, y, z, p.c, p.r)
}

// Khối cầu bao quanh một khối (để bỏ qua khối ở xa khi tính, tăng tốc nhiều lần)
function bounds(p, margin) {
  if (p.shape === 'cone') {
    const c = [0, 1, 2].map((i) => (p.a[i] + p.b[i]) / 2)
    const half = Math.hypot(p.b[0] - p.a[0], p.b[1] - p.a[1], p.b[2] - p.a[2]) / 2
    return { c, r: half + Math.max(p.r1, p.r2) + margin }
  }
  const radius = p.shape === 'ellipsoid' ? Math.max(...p.r) : p.r
  return { c: p.c, r: radius + margin }
}

/**
 * Hàm SDF của cả cơ thể: hợp mềm các khối theo thứ tự (k: độ tròn chỗ nối), khối cut: true thì khoét đi.
 * margin: vùng ngoài khối vẫn tính chính xác (cho pháp tuyến, độ che khuất); xa hơn thì coi như rất xa.
 */
export function makeField(primitives, margin = 0.12) {
  const list = primitives.map((p) => {
    const box = bounds(p, margin + (p.k ?? 0))
    return { ...p, bx: box.c[0], by: box.c[1], bz: box.c[2], br2: box.r * box.r }
  })
  return (x, y, z) => {
    let d = 1e9
    for (const p of list) {
      const dx = x - p.bx
      const dy = y - p.by
      const dz = z - p.bz
      if (dx * dx + dy * dy + dz * dz > p.br2) continue
      const di = primitiveDistance(p, x, y, z)
      d = p.cut ? smoothSubtract(d, di, p.k ?? 0) : smoothMin(d, di, p.k ?? 0)
    }
    return d
  }
}

// Pháp tuyến = hướng tăng nhanh nhất của SDF (sai phân trung tâm)
export function gradient(field, x, y, z, h) {
  const nx = field(x + h, y, z) - field(x - h, y, z)
  const ny = field(x, y + h, z) - field(x, y - h, z)
  const nz = field(x, y, z + h) - field(x, y, z - h)
  const length = Math.hypot(nx, ny, nz) || 1
  return [nx / length, ny / length, nz / length]
}

// Độ che khuất ánh sáng tại một điểm bề mặt: dò dọc pháp tuyến, chỗ bị khối khác che (nách, kẽ chân) thì tối hơn
export function occlusion(field, p, n) {
  let occluded = 0
  for (const [distance, weight] of [[0.015, 0.5], [0.035, 0.3], [0.07, 0.2]]) {
    const inside = distance - field(p[0] + n[0] * distance, p[1] + n[1] * distance, p[2] + n[2] * distance)
    occluded += (Math.max(0, inside) / distance) * weight
  }
  return Math.max(0, 1 - occluded * 1.4)
}

// 12 cạnh của một ô lưới, mỗi cạnh nối hai góc (góc đánh số bit: x = 1, y = 2, z = 4)
const EDGES = []
for (let corner = 0; corner < 8; corner++) {
  for (const bit of [1, 2, 4]) if (!(corner & bit)) EDGES.push([corner, corner | bit])
}

/**
 * Dựng lưới từ SDF trong hộp [min, max] với bước lưới step.
 * Trả về { positions, normals, indices } (Float32Array / Uint32Array), mặt tam giác quay ra ngoài.
 */
export function surfaceNets(field, min, max, step) {
  const n = [0, 1, 2].map((i) => Math.ceil((max[i] - min[i]) / step) + 1)
  const [nx, ny, nz] = n
  const values = new Float32Array(nx * ny * nz)
  const at = (i, j, k) => i + nx * (j + ny * k)
  for (let k = 0; k < nz; k++) {
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) values[at(i, j, k)] = field(min[0] + i * step, min[1] + j * step, min[2] + k * step)
    }
  }

  // Đỉnh: mỗi ô có bề mặt cắt qua
  const cellIndex = new Int32Array((nx - 1) * (ny - 1) * (nz - 1)).fill(-1)
  const cellAt = (i, j, k) => i + (nx - 1) * (j + (ny - 1) * k)
  const positions = []
  const corner = new Float32Array(8)
  for (let k = 0; k < nz - 1; k++) {
    for (let j = 0; j < ny - 1; j++) {
      for (let i = 0; i < nx - 1; i++) {
        let inside = 0
        for (let c = 0; c < 8; c++) {
          corner[c] = values[at(i + (c & 1), j + ((c >> 1) & 1), k + ((c >> 2) & 1))]
          if (corner[c] < 0) inside++
        }
        if (inside === 0 || inside === 8) continue
        let sx = 0
        let sy = 0
        let sz = 0
        let count = 0
        for (const [c0, c1] of EDGES) {
          const v0 = corner[c0]
          const v1 = corner[c1]
          if (v0 < 0 === v1 < 0) continue
          const t = v0 / (v0 - v1)
          sx += (c0 & 1) + ((c1 & 1) - (c0 & 1)) * t
          sy += ((c0 >> 1) & 1) + (((c1 >> 1) & 1) - ((c0 >> 1) & 1)) * t
          sz += ((c0 >> 2) & 1) + (((c1 >> 2) & 1) - ((c0 >> 2) & 1)) * t
          count++
        }
        cellIndex[cellAt(i, j, k)] = positions.length / 3
        positions.push(min[0] + (i + sx / count) * step, min[1] + (j + sy / count) * step, min[2] + (k + sz / count) * step)
      }
    }
  }

  // Pháp tuyến từ SDF (mượt hơn pháp tuyến tính từ mặt tam giác)
  const vertexCount = positions.length / 3
  const normals = new Float32Array(positions.length)
  for (let v = 0; v < vertexCount; v++) {
    const g = gradient(field, positions[v * 3], positions[v * 3 + 1], positions[v * 3 + 2], step * 0.5)
    normals.set(g, v * 3)
  }

  // Mặt: mỗi cạnh lưới đổi dấu nối 4 ô quanh nó
  const indices = []
  const index = [0, 0, 0]
  for (let k = 0; k < nz; k++) {
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        index[0] = i
        index[1] = j
        index[2] = k
        const v0 = values[at(i, j, k)]
        for (let axis = 0; axis < 3; axis++) {
          const u = (axis + 1) % 3
          const w = (axis + 2) % 3
          if (index[axis] >= n[axis] - 1 || index[u] < 1 || index[w] < 1 || index[u] >= n[u] - 1 || index[w] >= n[w] - 1) continue
          const next = [i, j, k]
          next[axis]++
          const v1 = values[at(next[0], next[1], next[2])]
          if (v0 < 0 === v1 < 0) continue
          const cell = (du, dw) => {
            const c = [i, j, k]
            c[u] -= du
            c[w] -= dw
            return cellIndex[cellAt(c[0], c[1], c[2])]
          }
          const quad = [cell(0, 0), cell(1, 0), cell(1, 1), cell(0, 1)]
          if (quad.includes(-1)) continue
          if (v0 < 0) quad.reverse()
          indices.push(quad[0], quad[1], quad[2], quad[0], quad[2], quad[3])
        }
      }
    }
  }

  orientFaces(positions, normals, indices)
  return { positions: new Float32Array(positions), normals, indices: new Uint32Array(indices) }
}

// Đảm bảo mọi tam giác quay mặt ra ngoài (cùng chiều với pháp tuyến SDF)
function orientFaces(positions, normals, indices) {
  for (let t = 0; t < indices.length; t += 3) {
    const [a, b, c] = [indices[t], indices[t + 1], indices[t + 2]]
    const e1 = [0, 1, 2].map((i) => positions[b * 3 + i] - positions[a * 3 + i])
    const e2 = [0, 1, 2].map((i) => positions[c * 3 + i] - positions[a * 3 + i])
    const face = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]]
    const normal = [0, 1, 2].map((i) => normals[a * 3 + i] + normals[b * 3 + i] + normals[c * 3 + i])
    if (face[0] * normal[0] + face[1] * normal[1] + face[2] * normal[2] < 0) {
      indices[t + 1] = c
      indices[t + 2] = b
    }
  }
}
