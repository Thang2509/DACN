import { makeField, occlusion, primitiveDistance, roundCone, surfaceNets } from './mesher'

/**
 * Giải phẫu thú cưng dựng bằng code, tỉ lệ theo giống thật (hàm thuần, kiểm thử được).
 * Mỗi giống là một bộ tham số; khung chung suy ra vị trí khớp xương và các khối thịt (SDF),
 * rồi dựng lưới liền một khối, tính trọng số xương, màu lông, độ dài và hướng lông cho từng đỉnh.
 * Tọa độ: y hướng lên, thú nhìn về +z, bên trái của thú là +x; đơn vị: Shiba trưởng thành cao vai 0,5.
 * Thú nhỏ (thỏ, hamster, nhím) dựng to hơn ngoài đời một chút để dễ nhìn, nhưng giữ đúng tỉ lệ cơ thể.
 */

// ---- Toán vector nhỏ trên mảng [x, y, z] ----
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const scale = (a, s) => [a[0] * s, a[1] * s, a[2] * s]
const length = (a) => Math.hypot(a[0], a[1], a[2])
const normalize = (a) => scale(a, 1 / (length(a) || 1))
const mirror = (p, side) => [p[0] * side, p[1], p[2]]
const clamp01 = (x) => Math.min(1, Math.max(0, x))
const smoothstep = (a, b, x) => {
  const t = clamp01((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}

// Màu hex (sRGB) → tuyến tính, vì three.js coi màu đỉnh là tuyến tính
function linear(hex) {
  return [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  })
}
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]

// Nhiễu giá trị 3D (vân lông tự nhiên, không lặp đều)
function hash(x, y, z) {
  const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453
  return s - Math.floor(s)
}
export function noise(x, y, z) {
  const ix = Math.floor(x)
  const iy = Math.floor(y)
  const iz = Math.floor(z)
  const fx = x - ix
  const fy = y - iy
  const fz = z - iz
  const u = fx * fx * (3 - 2 * fx)
  const v = fy * fy * (3 - 2 * fy)
  const w = fz * fz * (3 - 2 * fz)
  const lerp = (a, b, t) => a + (b - a) * t
  const corner = (dx, dy, dz) => hash(ix + dx, iy + dy, iz + dz)
  return lerp(
    lerp(lerp(corner(0, 0, 0), corner(1, 0, 0), u), lerp(corner(0, 1, 0), corner(1, 1, 0), u), v),
    lerp(lerp(corner(0, 0, 1), corner(1, 0, 1), u), lerp(corner(0, 1, 1), corner(1, 1, 1), u), v),
    w,
  )
}

/**
 * Đặc điểm theo nhóm loài: face 'long' (mõm dài) hay 'round' (mặt tròn có đệm ria); teeth răng nanh hay răng cửa
 * (thú gặm nhấm luôn lộ 2 răng cửa); whiskers [số sợi mỗi bên, độ dài]; skin màu da (viền mắt, môi); pads đệm chân
 * (null: lông phủ kín); lid màu mí mắt ('fur' cùng màu lông); sclera thấy lòng trắng; eyeAngle mắt hướng ra hai bên;
 * eyeRim độ đậm viền mắt; innerEar màu lòng tai; gait kiểu di chuyển: walk (4 nhịp), trot (lon ton), hop (nhảy).
 */
const TRAITS = {
  dog: { face: 'long', teeth: 'canine', claws: true, whiskers: [4, 0.03], skin: '#2a201c', pads: '#2b2522', lid: '#2a201c', sclera: false, eyeAngle: 0.38, eyeRim: 0.9, innerEar: '#d9a59b', gait: 'walk' },
  cat: { face: 'round', teeth: 'canine', claws: false, whiskers: [8, 0.13], skin: '#c98b86', pads: '#d89a98', lid: 'fur', sclera: true, eyeAngle: 0.22, eyeRim: 0.6, innerEar: '#e7a9a4', gait: 'walk' },
  rabbit: { face: 'round', teeth: 'incisor', claws: false, whiskers: [6, 0.1], skin: '#d9a3a0', pads: null, lid: 'fur', sclera: false, eyeAngle: 0.95, eyeRim: 0.2, innerEar: '#efb3b0', gait: 'hop' },
  hamster: { face: 'round', teeth: 'incisor', claws: false, whiskers: [6, 0.07], skin: '#e6a9a6', pads: '#e6a9a6', lid: 'fur', sclera: false, eyeAngle: 0.5, eyeRim: 0.45, innerEar: '#efb3b0', gait: 'trot' },
  capybara: { face: 'long', teeth: 'canine', claws: true, whiskers: [4, 0.05], skin: '#3a2a22', pads: '#2b2522', lid: 'fur', sclera: false, eyeAngle: 0.7, eyeRim: 0.6, innerEar: '#6e4a3a', gait: 'walk' },
  hedgehog: { face: 'long', teeth: 'canine', claws: true, whiskers: [3, 0.035], skin: '#2a201c', pads: '#3a2a22', lid: '#2a201c', sclera: false, eyeAngle: 0.45, eyeRim: 0.9, innerEar: '#a77d6e', gait: 'trot' },
}
export const traitsOf = (breed) => ({ kind: breed.kind, ...TRAITS[breed.kind] })

/**
 * Tham số từng giống (trưởng thành). Độ dài lông theo vùng: face mặt, ruff bờm cổ, legs chân, tail đuôi, ears tai, rump mông.
 * unit: hệ số kích thước cho các khoảng cách cố định (thú nhỏ < 1); eyes.place: vị trí mắt theo bề rộng / dài đầu;
 * head.tip: độ to đầu mõm (nhỏ là mõm nhọn); head.cheeks: độ phồng má; head.block: đầu khối hộp (capybara);
 * leg.hindFoot: bàn chân sau dài (thỏ); rumpSize: độ to mông; ears.place: vị trí gốc tai theo bề rộng / dài đầu;
 * eyes.open: độ mở mắt lúc bình thường (capybara lim dim); noseSize: cỡ mũi; fur.sheen: độ bóng lông; fur.tipDark: đầu sợi lông sẫm (agouti);
 * spines: gai lưng (nhím) { length, density }.
 */
export const BREEDS = {
  shiba: {
    kind: 'dog', withers: 0.5, rump: 0.5, length: 0.4, chestDepth: 0.21, chestWidth: 0.105, waist: 0.075,
    neck: { length: 0.16, thickness: 0.072, angle: 0.95 },
    head: { width: 0.08, length: 0.095, muzzle: 0.085, muzzleWidth: 0.04 },
    leg: { thickness: 0.036, paw: 0.034 },
    ears: { type: 'erect', size: 0.075 },
    tail: { shape: 'curl', length: 0.3, thickness: 0.03 },
    eyes: { size: 0.01, color: '#7a4520' },
    nose: '#231b18',
    fur: { length: 0.03, density: 160, curl: 0, face: 0.45, ruff: 1.4, legs: 0.6, tail: 1.9, ears: 0.55, rump: 1.1 },
  },
  rabbit: {
    kind: 'rabbit', withers: 0.2, rump: 0.27, length: 0.2, chestDepth: 0.13, chestWidth: 0.09, waist: 0.1, unit: 0.55,
    neck: { length: 0.05, thickness: 0.075, angle: 1.1 },
    head: { width: 0.068, length: 0.075, muzzle: 0.032, muzzleWidth: 0.042, cheeks: 1.25 },
    leg: { thickness: 0.024, paw: 0.022, hindFoot: 0.11 },
    ears: { type: 'rabbit', size: 0.16 },
    tail: { shape: 'puff', length: 0.05, thickness: 0.034 },
    eyes: { size: 0.017, color: '#2a160c', place: [0.6, 0.16, 0.48] },
    nose: '#d98d8f',
    // Lông agouti như thỏ nâu ngoài tự nhiên: đầu sợi lông sẫm nên nhìn lấm tấm
    fur: { length: 0.022, density: 260, curl: 0, face: 0.5, ruff: 1.1, legs: 0.7, tail: 2.2, ears: 0.3, rump: 1.2, tipDark: 0.4 },
  },
  tabby: {
    kind: 'cat', withers: 0.34, rump: 0.36, length: 0.34, chestDepth: 0.16, chestWidth: 0.085, waist: 0.07,
    neck: { length: 0.1, thickness: 0.06, angle: 0.75 },
    head: { width: 0.075, length: 0.07, muzzle: 0.035, muzzleWidth: 0.04 },
    leg: { thickness: 0.03, paw: 0.03 },
    ears: { type: 'cat', size: 0.065 },
    tail: { shape: 'cat', length: 0.42, thickness: 0.026 },
    eyes: { size: 0.018, color: '#8fae3a', slit: true },
    nose: '#d68a8a',
    fur: { length: 0.018, density: 180, curl: 0, face: 0.6, ruff: 1, legs: 0.8, tail: 1.1, ears: 0.4, rump: 1 },
  },
  capybara: {
    // Theo ảnh thật: thân thùng dài, mông to tròn cao hơn vai, ngực nhô trước chân trước, chân ngắn to như cột;
    // đầu khối hộp nằm ngang, mõm sâu tù; mắt nhỏ lim dim nằm cao và lùi về phía tai; tai nhỏ tròn ở sau đỉnh đầu
    kind: 'capybara', withers: 0.42, rump: 0.47, length: 0.5, chestDepth: 0.29, chestWidth: 0.15, waist: 0.155, unit: 0.95, rumpSize: 1.6,
    neck: { length: 0.06, thickness: 0.095, angle: 0.3 },
    head: { width: 0.082, length: 0.14, muzzle: 0.1, muzzleWidth: 0.066, block: true },
    leg: { thickness: 0.054, paw: 0.044 },
    ears: { type: 'round', size: 0.038, place: [0.35, 0.6, -0.45] },
    tail: { shape: 'stub', length: 0.012, thickness: 0.02 },
    eyes: { size: 0.012, color: '#1a0f0a', place: [0.44, 0.5, 0.09], open: 0.6 },
    nose: '#2b2220',
    // Lông thô, ngắn, nằm sát người; lưng và mông dài hơn chút, mặt và chân lông ngắn
    fur: { length: 0.012, density: 130, curl: 0, face: 0.35, ruff: 0.5, legs: 0.45, tail: 1, ears: 0.3, rump: 1.3, sheen: 0.12 },
  },
  corgi: {
    kind: 'dog', withers: 0.36, rump: 0.37, length: 0.48, chestDepth: 0.2, chestWidth: 0.12, waist: 0.09,
    neck: { length: 0.10, thickness: 0.075, angle: 0.85 },
    head: { width: 0.08, length: 0.095, muzzle: 0.09, muzzleWidth: 0.04 },
    leg: { thickness: 0.045, paw: 0.04 },
    ears: { type: 'erect', size: 0.1 },
    tail: { shape: 'stub', length: 0.06, thickness: 0.035 },
    eyes: { size: 0.015, color: '#f310d8' },
    nose: '#1f1918',
    fur: { length: 0.032, density: 160, curl: 0, face: 0.45, ruff: 1.4, legs: 0.6, tail: 1.2, ears: 0.5, rump: 1.5 },
  },
  hamster: {
    kind: 'hamster', withers: 0.15, rump: 0.16, length: 0.145, chestDepth: 0.12, chestWidth: 0.1, waist: 0.11, unit: 0.4,
    neck: { length: 0.02, thickness: 0.085, angle: 0.6 },
    head: { width: 0.075, length: 0.07, muzzle: 0.028, muzzleWidth: 0.04, cheeks: 1.35 },
    leg: { thickness: 0.018, paw: 0.016 },
    ears: { type: 'round', size: 0.04 },
    tail: { shape: 'stub', length: 0.015, thickness: 0.012 },
    eyes: { size: 0.014, color: '#120a08', place: [0.56, 0.2, 0.55] },
    nose: '#e8a7a5',
    fur: { length: 0.022, density: 300, curl: 0, face: 0.6, ruff: 1.2, legs: 0.4, tail: 1, ears: 0.2, rump: 1.1 },
  },
  persian: {
    kind: 'cat', withers: 0.33, rump: 0.34, length: 0.32, chestDepth: 0.18, chestWidth: 0.1, waist: 0.085,
    neck: { length: 0.07, thickness: 0.07, angle: 0.7 },
    head: { width: 0.085, length: 0.07, muzzle: 0.012, muzzleWidth: 0.04 },
    leg: { thickness: 0.034, paw: 0.033 },
    ears: { type: 'small', size: 0.05 },
    tail: { shape: 'fluffy', length: 0.4 , thickness: 0.03 },
    eyes: { size: 0.018, color: '#1f9bd9' },
    nose: '#f694b9',
    fur: { length: 0.075, density: 140, curl: 0, face: 0.4, ruff: 0.7, legs: 0.8, tail: 1.6, ears: 0.5, rump: 1 },
  },
  hedgehog: {
    kind: 'hedgehog', withers: 0.14, rump: 0.15, length: 0.17, chestDepth: 0.1, chestWidth: 0.1, waist: 0.1, unit: 0.4,
    neck: { length: 0.02, thickness: 0.075, angle: 0.4 },
    head: { width: 0.055, length: 0.065, muzzle: 0.07, muzzleWidth: 0.022, tip: 0.32 },
    leg: { thickness: 0.016, paw: 0.016 },
    ears: { type: 'round', size: 0.042, place: [0.8, 0.42, -0.15] },
    tail: { shape: 'stub', length: 0.01, thickness: 0.01 },
    eyes: { size: 0.014, color: '#0c0806', place: [0.66, 0.3, 0.45] },
    nose: '#151010',
    noseSize: 0.55, // mũi nhỏ ở chóp mõm nhọn
    fur: { length: 0.012, density: 220, curl: 0, face: 0.6, ruff: 1, legs: 0.5, tail: 1, ears: 0.2, rump: 1 },
    spines: { length: 0.055, density: 75 },
  },
}

// Chiều cao vai của loài (đơn vị mô hình, Shiba = 0,5)
export const petSize = (code) => BREEDS[code]?.withers ?? 0.5

/**
 * Hệ số phóng to khi hiển thị thú nhỏ (thỏ, hamster, nhím) để dễ nhìn trên bục, trong phòng, minigame;
 * strength 1 phóng đủ (bục trưng bày), nhỏ hơn thì phóng nhẹ (phòng vẫn thấy hamster nhỏ hơn chó).
 */
export function petBoost(code, strength = 1) {
  return Math.min(2.5, Math.max(1, (0.45 / petSize(code)) ** 0.75)) ** strength
}

// Thú con (youth 0 → 1): đầu to, mõm ngắn, chân và thân ngắn, mắt to, lông bông hơn
function grow(breed, youth) {
  const y = youth
  return {
    ...breed,
    withers: breed.withers * (1 - 0.12 * y),
    rump: breed.rump * (1 - 0.12 * y),
    length: breed.length * (1 - 0.12 * y),
    chestDepth: breed.chestDepth * (1 - 0.05 * y),
    neck: { ...breed.neck, length: breed.neck.length * (1 - 0.25 * y) },
    head: {
      ...breed.head,
      width: breed.head.width * (1 + 0.28 * y),
      length: breed.head.length * (1 + 0.2 * y),
      muzzle: breed.head.muzzle * (1 - 0.35 * y),
      muzzleWidth: breed.head.muzzleWidth * (1 + 0.1 * y),
    },
    leg: { ...breed.leg, thickness: breed.leg.thickness * (1 + 0.1 * y), paw: breed.leg.paw * (1 + 0.15 * y) },
    ears: { ...breed.ears, size: breed.ears.size * (1 + 0.1 * y) },
    tail: { ...breed.tail, length: breed.tail.length * (1 - 0.25 * y) },
    eyes: { ...breed.eyes, size: breed.eyes.size * (1 + 0.3 * y) },
    fur: { ...breed.fur, length: breed.fur.length * (1 + 0.25 * y) },
  }
}

// ---- Bộ xương và các khối thịt ----

const LEGS = [
  ['FL', 1, 'front'],
  ['FR', -1, 'front'],
  ['HL', 1, 'hind'],
  ['HR', -1, 'hind'],
]

/**
 * Suy ra vị trí khớp (bộ xương ở tư thế đứng) và các khối thịt từ tham số giống.
 * Mỗi khối gắn với một xương (bone), có hướng chải lông (comb) và vùng (part) để tô màu, chỉnh độ dài lông.
 */
export function skeletonOf(code, youth = 0) {
  const b = grow(BREEDS[code] ?? BREEDS.shiba, youth)
  const traits = traitsOf(b)
  const round = traits.face === 'round'
  const cat = b.kind === 'cat'
  const u = b.unit ?? 1 // các khoảng cách cố định (lề khớp, độ bo) thu nhỏ theo thú nhỏ
  const { withers: W, rump: R, length: L } = b
  const front = L / 2
  const back = -L / 2
  const lt = b.leg.thickness
  const paw = b.leg.paw
  const xw = b.chestWidth * 0.62
  const chestBottom = W - b.chestDepth
  const hs = R / 0.56 // tỉ lệ chân sau so với giống mẫu

  // Khớp chính
  const j = {
    hips: [0, R - 0.06 * u, back + 0.02 * u],
    spine: [0, (W + R) / 2 - 0.05 * u, 0],
    chest: [0, W - 0.06 * u, front - 0.03 * u],
    neckBase: [0, W - 0.03 * u, front + 0.03 * u],
  }
  const neckDir = [0, Math.sin(b.neck.angle), Math.cos(b.neck.angle)]
  j.neckMid = add(j.neckBase, scale(neckDir, b.neck.length * 0.5))
  j.head = add(j.neckBase, scale(neckDir, b.neck.length))
  const hw = b.head.width
  const hl = b.head.length
  j.skull = add(j.head, [0, hw * 0.55, hl * 0.35])
  // Capybara: sống mũi thẳng từ trán xuống mõm nên gốc mõm nằm cao hơn
  j.muzzleBase = add(j.skull, [0, -hw * (b.head.block ? 0.12 : 0.32), hl * 0.48])
  j.muzzleTip = add(j.muzzleBase, [0, -hw * 0.12, b.head.muzzle])
  j.jaw = add(j.skull, [0, -hw * 0.62, hl * 0.12])
  j.jawTip = add(j.muzzleTip, [0, -b.head.muzzleWidth * 1.05, -b.head.muzzle * 0.12])
  const [ex, ey, ez] = b.eyes.place ?? [0.52, 0.12, 0.66]
  j.eye = add(j.skull, [hw * ex, hw * ey, hl * ez])
  j.tail = [0, R - 0.03 * u, back - 0.07 * u]

  for (const [name, side, kind] of LEGS) {
    if (kind === 'front') {
      j[`${name}1`] = [side * xw, W - 0.11 * u, front]
      j[`${name}2`] = [side * xw, chestBottom + 0.02 * u, front - 0.05 * u]
      j[`${name}3`] = [side * xw * 0.95, paw * 1.6, front - 0.01 * u]
      j[`${name}4`] = [side * xw * 0.95, paw * 0.55, front + 0.02 * u]
    } else {
      j[`${name}1`] = [side * xw, R - 0.1 * u, back - 0.01 * u]
      j[`${name}2`] = [side * xw, R * 0.5, back + 0.05 * hs]
      if (b.leg.hindFoot) {
        // Thỏ: cổ chân sát đất, bàn chân sau dài đặt bẹt xuống sàn
        j[`${name}3`] = [side * xw, paw * 1.1, back - b.leg.hindFoot * 0.5]
        j[`${name}4`] = [side * xw, paw * 0.55, back + b.leg.hindFoot * 0.4]
      } else {
        j[`${name}3`] = [side * xw, 0.15 * hs + paw * 0.6, back - 0.09 * hs]
        j[`${name}4`] = [side * xw, paw * 0.55, back - 0.05 * hs]
      }
    }
  }

  // Đuôi: các đốt theo kiểu của giống
  const tl = b.tail.length
  const tailPath = {
    curl: [[0, 0.35, -0.15], [0, 0.3, 0.18], [0.06, -0.05, 0.3], [0.08, -0.15, 0.12]],
    stub: [[0, 0.4, -0.6], [0, 0.2, -0.4], [0, 0, 0], [0, 0, 0]],
    puff: [[0, 0.6, -0.6], [0, 0.3, -0.3], [0, 0, 0], [0, 0, 0]],
    cat: [[0, -0.05, -0.28], [0, 0.04, -0.3], [0, 0.18, -0.2], [0, 0.25, -0.05]],
    fluffy: [[0, 0.02, -0.33], [0, 0.12, -0.3], [0, 0.18, -0.2], [0, 0.15, -0.1]],
  }[b.tail.shape]
  const tailPoints = [j.tail]
  for (const step of tailPath) tailPoints.push(add(tailPoints[tailPoints.length - 1], scale(step, tl)))

  // Xương: tên, cha, vị trí nghỉ
  const bones = []
  const bone = (name, parent, position) => bones.push({ name, parent: parent === null ? -1 : bones.findIndex((x) => x.name === parent), position })
  bone('root', null, [0, 0, 0])
  bone('hips', 'root', j.hips)
  bone('spine', 'hips', j.spine)
  bone('chest', 'spine', j.chest)
  bone('neck1', 'chest', j.neckBase)
  bone('neck2', 'neck1', j.neckMid)
  bone('head', 'neck2', j.head)
  bone('jaw', 'head', j.jaw)
  for (const [name, , kind] of LEGS) {
    bone(`${name}1`, kind === 'front' ? 'chest' : 'hips', j[`${name}1`])
    bone(`${name}2`, `${name}1`, j[`${name}2`])
    bone(`${name}3`, `${name}2`, j[`${name}3`])
    bone(`${name}4`, `${name}3`, add(j[`${name}4`], [0, -paw * 0.3, -paw * 0.3]))
  }
  tailPoints.slice(0, 4).forEach((point, i) => bone(`tail${i + 1}`, i ? `tail${i}` : 'hips', point))

  const ear = earShape(b, j)
  for (const [side, name] of [[1, 'earL'], [-1, 'earR']]) bone(name, 'head', mirror(ear.base, side))

  // Khối thịt: cone đi từ a tới b theo hướng chải lông
  const prims = []
  const cone = (bone, part, a, b2, r1, r2, k, extra = {}) => prims.push({ shape: 'cone', bone, part, a, b: b2, r1, r2, k, comb: normalize(sub(b2, a)), ...extra })
  const ell = (bone, part, c, r, k, comb, extra = {}) => prims.push({ shape: 'ellipsoid', bone, part, c, r, k, comb, ...extra })
  const ball = (bone, part, c, r, k, comb, extra = {}) => prims.push({ shape: 'sphere', bone, part, c, r, k, comb, ...extra })
  const backward = normalize([0, -0.25, -1])

  // Thân: lồng ngực sâu, bụng thon dần (thú gặm nhấm thì tròn trịa), lưng phẳng, mông tròn
  ell('chest', 'chest', [0, W - b.chestDepth * 0.5, front - L * 0.18], [b.chestWidth, b.chestDepth * 0.5, L * 0.36], 0, backward)
  ball('chest', 'brisket', [0, chestBottom + b.chestDepth * 0.42, front + 0.035 * u], b.chestDepth * 0.36, 0.05 * u, [0, -1, 0])
  cone('spine', 'belly', [0, W - b.chestDepth * 0.5, front - L * 0.25], [0, R - 0.1 * u, back + 0.06 * u], b.chestDepth * 0.45, b.waist, 0.06 * u)
  cone('spine', 'back', [0, W - 0.05 * u, front], [0, R - 0.05 * u, back], 0.07 * u * (cat ? 0.8 : 1), 0.065 * u * (cat ? 0.85 : 1), 0.05 * u)
  const rumpSize = b.rumpSize ?? 1
  ell('hips', 'rump', [0, R - 0.09 * u, back - 0.01 * u - (rumpSize - 1) * 0.04 * u], [b.waist * 1.25, (0.095 * hs + 0.01 * u) * rumpSize, 0.1 * u * rumpSize], 0.05 * u, backward)

  // Cổ và đầu
  const nt = b.neck.thickness
  const mw = b.head.muzzleWidth
  cone('neck2', 'neck', j.head, j.neckMid, nt * 0.85, nt * 1.05, 0.04 * u)
  cone('neck1', 'neck', j.neckMid, j.neckBase, nt * 1.05, nt * 1.45, 0.05 * u)
  if (b.head.block) {
    // Capybara: đầu như viên gạch bo góc (hai khối trụ bo đầu chồng lên nhau nên mặt cắt cao hơn rộng), sống mũi thẳng
    cone('head', 'skull', add(j.muzzleTip, [0, mw * 0.35, -mw * 0.2]), add(j.skull, [0, hw * 0.1, -hl * 0.7]), hw * 0.6, hw * 0.62, 0.03 * u)
    cone('head', 'muzzle', add(j.muzzleTip, [0, -mw * 0.45, -mw * 0.15]), add(j.skull, [0, -hw * 0.35, -hl * 0.5]), hw * 0.52, hw * 0.55, 0.03 * u)
  } else {
    // Mặt tròn ngắn; mõm dài thì sọ thuôn
    ell('head', 'skull', j.skull, [hw, hw * (round ? 0.9 : 0.92), hl * (round ? 0.78 : 0.62)], 0.03 * u, [0, 0, -1])
    for (const side of [1, -1]) {
      const cheek = add(j.skull, [side * hw * 0.48, -hw * 0.42, hl * (round ? 0.42 : 0.28)])
      ball('head', 'cheek', cheek, hw * (round ? 0.48 : 0.5) * (b.head.cheeks ?? 1), 0.03 * u, normalize([side * 0.5, -0.4, -1]))
    }
  }
  if (round) {
    // Mặt tròn (mèo, thỏ, hamster): đệm ria hai bên và cằm nhỏ thay cho mõm dài
    for (const side of [1, -1]) {
      ball('head', 'muzzle', add(j.muzzleTip, [side * mw * 0.42, -mw * 0.1, -mw * 0.2]), mw * 0.52, 0.02 * u, normalize([side, 0, -1]))
    }
    ball('jaw', 'jaw', add(j.jawTip, [0, mw * 0.25, -mw * 0.2]), mw * 0.38, 0.015 * u, [0, 0, -1])
  } else if (b.head.block) {
    // Capybara: mõm đã nằm trong khối đầu, chỉ thêm cằm nhỏ
    cone('jaw', 'jaw', j.jawTip, add(j.jaw, [0, 0, hl * 0.2]), mw * 0.38, mw * 0.55, 0.012 * u)
  } else {
    cone('head', 'muzzle', j.muzzleTip, j.muzzleBase, mw * (b.head.tip ?? 0.68), mw * 1.05, 0.055 * u)
    cone('jaw', 'jaw', j.jawTip, add(j.jaw, [0, 0, hl * 0.2]), mw * 0.45, mw * 0.75, 0.012 * u)
  }
  // Khe miệng và hốc mắt
  cone('head', 'lip', add(j.muzzleTip, [0, -mw * 0.82, -mw * 0.15]), add(j.muzzleBase, [0, -mw * 0.95, -mw * 0.3]), mw * 0.14, mw * 0.2, 0.008 * u, { cut: true })
  for (const side of [1, -1]) ball('head', 'eye', mirror(j.eye, side), b.eyes.size * 1.02, 0.012 * u, [0, 0, -1], { cut: true })

  // Bốn chân: vai/đùi to → cẳng thon → bàn chân có 4 ngón
  for (const [name, side, kind] of LEGS) {
    const [p1, p2, p3, p4] = [1, 2, 3, 4].map((i) => j[`${name}${i}`])
    const part = kind === 'front' ? 'legF' : 'legH'
    const longFoot = kind === 'hind' && b.leg.hindFoot
    if (kind === 'front') {
      cone(`${name}1`, part, p1, p2, lt * 1.55, lt * 1.05, 0.05 * u)
      cone(`${name}2`, 'leg', p2, p3, lt, lt * 0.72, 0.025 * u)
    } else {
      cone(`${name}1`, part, p1, p2, lt * 2.1, lt * 0.95, 0.06 * u)
      // Khối cơ đùi phủ qua gối cho đường cong chân sau liền mạch
      ell(`${name}1`, part, add(scale(add(p1, p2), 0.5), [0, 0, 0.01 * u]), [lt * 1.45, length(sub(p1, p2)) * 0.5, lt * 1.7], 0.05 * u, [0, -1, 0])
      cone(`${name}2`, 'leg', p2, p3, lt * 0.9, lt * 0.6, 0.035 * u)
    }
    cone(`${name}3`, 'leg', p3, add(p4, [0, paw * 0.2, -paw * 0.1]), lt * 0.7, lt * 0.68, 0.02 * u)
    if (longFoot) ell(`${name}4`, 'paw', add(p4, [0, 0, -b.leg.hindFoot * 0.3]), [paw * 0.95, paw * 0.55, b.leg.hindFoot * 0.55], 0.02 * u, [0, 0, 1])
    else ell(`${name}4`, 'paw', p4, [paw * 0.95, paw * 0.55, paw * 1.15], 0.02 * u, [0, 0, 1])
    for (const [i, dx] of [-1.5, -0.5, 0.5, 1.5].entries()) {
      const outer = i === 0 || i === 3
      ball(`${name}4`, 'toe', add(p4, [side * dx * paw * 0.42, -paw * 0.17, paw * (outer ? 0.62 : 0.85)]), paw * (outer ? 0.3 : 0.35), 0.012 * u, [0, 0, 1])
    }
  }

  // Đuôi: các đốt thon dần; đuôi bông của thỏ là một cục lông tròn
  const tt = b.tail.thickness
  const shape = b.tail.shape
  const tailRadii = shape === 'cat' ? [1, 0.95, 0.9, 0.85, 0.75] : [1, 0.9, 0.75, 0.6, 0.45]
  tailPoints.slice(0, 4).forEach((point, i) => {
    if ((shape === 'stub' || shape === 'puff') && i > 1) return
    cone(`tail${i + 1}`, 'tail', point, tailPoints[i + 1], tt * tailRadii[i], tt * tailRadii[i + 1], i ? 0.01 * u : 0.04 * u)
  })
  if (shape === 'puff') ball('tail2', 'tail', tailPoints[2], tt * 1.3, 0.02 * u, [0, 0.3, -1])

  const head = {
    eyes: [1, -1].map((side) => ({ side, center: mirror(j.eye, side), radius: b.eyes.size })),
    // Mũi capybara to, nằm phía trên đầu mõm; các loài khác ở đầu mõm
    nose: add(j.muzzleTip, b.head.block ? [0, mw * 0.4, mw * 0.42] : [0, mw * (round ? 0.1 : 0.12), mw * (round ? 0.25 : 0.5)]),
    muzzleTip: j.muzzleTip,
    muzzleBase: j.muzzleBase,
    jawTip: j.jawTip,
    jaw: j.jaw,
    skull: j.skull,
  }
  return { code, breed: b, traits, round, kind: b.kind, unit: u, joints: j, bones, prims, ear, head, tailPoints }
}

// Tai: gốc, đỉnh, bề rộng, độ dày và hướng mặt trước (cho bên trái, bên phải lấy đối xứng)
function earShape(b, j) {
  const s = b.ears.size
  const hw = b.head.width
  const type = b.ears.type
  if (type === 'rabbit') {
    // Tai thỏ dài, dựng đứng hơi ngả ra sau, đầu tai tròn
    const base = add(j.skull, [hw * 0.36, hw * 0.82, -b.head.length * 0.22])
    return { type, base, tip: add(base, [s * 0.2, s * 0.92, -s * 0.28]), width: s * 0.23, tipWidth: s * 0.17, thickness: s * 0.035, front: normalize([0.4, 0, 1]) }
  }
  if (type === 'round') {
    // Tai tròn nhỏ (hamster, capybara, nhím)
    const [px, py, pz] = b.ears.place ?? [0.62, 0.7, -0.08]
    const base = add(j.skull, [hw * px, hw * py, b.head.length * pz])
    return { type, base, tip: add(base, [s * 0.35, s * 0.55, -s * 0.1]), width: s * 0.5, tipWidth: s * 0.42, thickness: s * 0.08, front: normalize([0.4, 0.1, 1]) }
  }
  if (type === 'small') {
    const base = add(j.skull, [hw * 0.6, hw * 0.78, b.head.length * 0.05])
    return { type, base, tip: add(base, [s * 0.5, s * 0.75, s * 0.25]), width: s * 0.55, tipWidth: s * 0.18, thickness: s * 0.12, front: normalize([0.3, 0.2, 1]) }
  }
  const base = add(j.skull, [hw * 0.55, hw * 0.78, -b.head.length * 0.05])
  const outward = type === 'cat' ? 0.35 : 0.3
  return { type, base, tip: add(base, [s * outward, s, s * 0.12]), width: s * (type === 'cat' ? 0.5 : 0.42), tipWidth: s * 0.06, thickness: s * 0.09, front: normalize([0.25, 0, 1]) }
}

// SDF của một tai (bên trái): tấm mỏng bo tròn, mặt trước lõm vào thành lòng tai
function earField(ear) {
  const { base, tip, width, tipWidth, thickness, front } = ear
  const inset = scale(front, thickness * 1.3)
  const innerBase = add(add(base, inset), [0, (tip[1] - base[1]) * 0.12, 0])
  return (x, y, z) => {
    const outer = roundCone(x, y, z, base, tip, width, tipWidth)
    const slab = Math.abs((x - base[0]) * front[0] + (y - base[1]) * front[1] + (z - base[2]) * front[2]) - thickness
    const inner = roundCone(x, y, z, innerBase, add(tip, inset), width * 0.72, tipWidth * 0.5)
    return Math.max(outer, slab, -inner)
  }
}

// ---- Màu lông theo giống ----

const COLORS = {
  shiba: { base: '#c8682a', dark: '#a95622', light: '#f1dfc0' },
  rabbit: { base: '#a88a6e', dark: '#7d6450', light: '#f3ece2' },
  tabby: { base: '#9a7148', dark: '#3b2a1c', light: '#e9d8bd' },
  capybara: { base: '#7a4a17', dark: '#5a3510', light: '#94612a' },
  corgi: { base: '#d8782c', dark: '#b9611f', light: '#f7f1e6' },
  hamster: { base: '#d9963f', dark: '#c07a2e', light: '#f8f1e6' },
  persian: { base: '#f3efe8', dark: '#efece7', light: '#fbf9f6' },
  hedgehog: { base: '#cdb898', dark: '#4a3626', light: '#efe3cf' },
}

// Vùng gai của nhím (0 → lông mềm, 1 → gai): lưng, mông, hai bên sườn trên và đỉnh đầu sau mắt; chừa quanh mắt, gốc tai
function spineZone(ctx) {
  const nearEye = Math.min(...ctx.head.eyes.map((eye) => length(sub(ctx.p, eye.center)) / eye.radius))
  const nearEar = Math.min(...[1, -1].map((side) => length(sub(ctx.p, mirror(ctx.ear.base, side))) / ctx.ear.width))
  return spineRegion(ctx) * smoothstep(2.6, 4, nearEye) * smoothstep(1.1, 1.8, nearEar)
}

function spineRegion(ctx) {
  const { p, n, part, head } = ctx
  // Gai phủ từ trán xuống tận hai bên sườn, chừa mặt, ngực trước và bụng
  const upper = smoothstep(-0.4, 0.1, n[1])
  if (['back', 'rump', 'chest', 'belly', 'legH', 'legF'].includes(part)) return upper * smoothstep(0.75, 0.35, n[2]) * (part.startsWith('leg') ? smoothstep(0.2, 0.6, n[1]) : 1)
  if (part === 'neck') return smoothstep(-0.1, 0.4, n[1])
  if (part === 'skull' || part === 'cheek') return smoothstep(0.15, 0.55, n[1]) * smoothstep(head.eyes[0].center[2] - 0.004, head.eyes[0].center[2] - 0.02, p[2])
  return 0
}

// Mức "vùng sáng" (0 → màu chính, 1 → màu sáng) cho từng giống; ctx: điểm, pháp tuyến, vùng, đặc điểm đầu
function lightMask(code, ctx) {
  const { p, n, part, head } = ctx
  const under = smoothstep(-0.05, -0.55, n[1])
  const innerLeg = smoothstep(0.1, 0.6, -n[0] * Math.sign(p[0] || 1))
  const eyeY = head.eyes[0].center[1]
  const face = part === 'muzzle' || part === 'jaw' ? 1 : 0
  const lowerCheek = part === 'cheek' ? smoothstep(eyeY - 0.005, eyeY - 0.04, p[1]) : 0
  const throat = part === 'neck' ? smoothstep(0.1, 0.5, n[2]) * smoothstep(0.6, 0.1, n[1]) : 0
  const chestFront = part === 'brisket' || (part === 'chest' && n[2] > 0.3) ? 1 : 0
  const skullUnder = part === 'skull' ? smoothstep(-0.1, -0.5, n[1]) : 0
  const legs = part === 'leg' || part === 'paw' || part === 'toe' ? 1 : 0

  if (code === 'shiba' || code === 'corgi') {
    // Urajiro: kem ở mõm, má dưới, cổ họng, ngực, bụng, mặt trong và phần dưới chân, mặt dưới đuôi; hai chấm lông mày
    const brows = Math.max(...head.eyes.map((eye) => smoothstep(0.016, 0.006, length(sub(p, add(eye.center, [eye.side * -0.004, 0.026, -0.006]))))))
    let mask = Math.max(face, lowerCheek, throat, chestFront, under, skullUnder, legs * Math.max(innerLeg, smoothstep(0.16, 0.08, p[1])), part === 'tail' ? under : 0, code === 'shiba' ? brows : 0)
    if (code === 'corgi') {
      // Sọc trắng giữa trán và vòng cổ trắng
      const blaze = part === 'skull' ? smoothstep(0.016, 0.008, Math.abs(p[0])) * smoothstep(0.2, 0.6, n[2]) : 0
      const collar = part === 'neck' ? smoothstep(0.75, 0.2, n[1]) : 0
      mask = Math.max(mask, blaze, collar, legs * smoothstep(0.24, 0.12, p[1]))
    }
    return mask
  }
  if (code === 'rabbit') {
    // Thỏ nâu xám: vòng sáng quanh mắt, cằm, bụng, mặt trong chân, đuôi bông trắng
    const eyeRing = Math.max(...head.eyes.map((eye) => smoothstep(eye.radius * 2.6, eye.radius * 1.5, length(sub(p, eye.center)))))
    const tailUnder = part === 'tail' ? smoothstep(0.55, -0.1, n[1]) : 0
    return Math.max(face * 0.3, lowerCheek * 0.2, throat * 0.5, chestFront * 0.3, under, skullUnder, legs * innerLeg, tailUnder, eyeRing * 0.5)
  }
  if (code === 'hamster') {
    // Hamster vàng: má phúng phính, mõm, cổ, ngực, bụng và bàn chân trắng
    const pouch = part === 'cheek' ? smoothstep(0.15, -0.35, n[1]) : 0
    return Math.max(face, lowerCheek, pouch, throat, chestFront, under, skullUnder, legs * 0.8)
  }
  if (code === 'hedgehog') {
    // Nhím: mặt, bụng, chân màu kem; lưng là gai (tô ở colorOf)
    const faceFront = part === 'skull' ? smoothstep(0.1, 0.6, n[2]) * smoothstep(0.55, 0.1, n[1]) : 0
    return Math.max(face, part === 'cheek' ? 1 : 0, faceFront, under, throat, chestFront, legs)
  }
  if (code === 'tabby') return Math.max(face * 0.8, lowerCheek, throat * 0.8, under, skullUnder, chestFront * 0.6)
  return Math.max(face, under, throat) * (code === 'capybara' ? 0.3 : 0.45) // Ba Tư, capybara: chỉ sáng nhẹ ở bụng, mõm
}

// Vằn lông mèo mướp: sọc ngang thân, vòng ở chân và đuôi, chữ M trên trán
function tabbyStripes(ctx) {
  const { p, n, part, head } = ctx
  const wobble = noise(p[0] * 30, p[1] * 30, p[2] * 30) * 2.2
  let band = 0
  if (part === 'chest' || part === 'belly' || part === 'back' || part === 'rump' || part === 'brisket') band = Math.sin(p[2] * 62 + p[1] * 18 + wobble)
  else if (part === 'leg' || part === 'legF' || part === 'legH') band = Math.sin(p[1] * 85 + wobble)
  else if (part === 'tail') band = Math.sin((p[1] + p[2]) * 70 + wobble)
  else if (part === 'neck') band = Math.sin(p[1] * 70 + wobble)
  else if (part === 'skull' && p[1] > head.eyes[0].center[1]) band = Math.sin(p[0] * 120 + wobble * 0.5) * smoothstep(0.1, 0.5, n[2])
  else if (part === 'cheek') band = Math.sin(p[1] * 110 + wobble)
  return smoothstep(0.45, 0.8, band) * smoothstep(-0.55, -0.1, n[1])
}

export function colorOf(code, ctx) {
  const palette = COLORS[code] ?? COLORS.shiba
  const base = linear(palette.base)
  const dark = linear(palette.dark)
  const light = linear(palette.light)
  const { p, n, part, head, traits } = ctx
  // Lưng đậm hơn một chút, màu lệch nhẹ theo nhiễu cho tự nhiên
  let color = mix(base, dark, smoothstep(0.4, 0.9, n[1]) * (code === 'tabby' ? 0.3 : 0.55))
  color = mix(color, light, lightMask(code, ctx))
  if (code === 'tabby') color = mix(color, dark, tabbyStripes(ctx))
  if (code === 'capybara') {
    // Cẳng chân và bàn chân sẫm gần đen, phía trước mõm xám sẫm
    const lowLeg = part === 'leg' || part === 'paw' || part === 'toe' ? smoothstep(0.2, 0.07, p[1]) : 0
    const snout = part === 'muzzle' ? smoothstep(0.2, 0.75, n[2]) : 0
    color = mix(color, linear('#33241b'), Math.max(lowLeg * 0.95, snout * 0.7))
  }
  if (ctx.spine) color = mix(color, dark, ctx.spine * 0.85) // da dưới gai nhím sẫm, ngọn gai tô sáng trong shader
  const jitter = 0.9 + noise(p[0] * 40, p[1] * 40, p[2] * 40) * 0.2
  color = scale(color, jitter)

  // Viền mắt, viền môi theo màu da; đệm chân theo loài (thỏ lông phủ kín bàn chân)
  const eyeRim = Math.max(...head.eyes.map((eye) => smoothstep(eye.radius * 1.45, eye.radius * 1.05, length(sub(p, eye.center)))))
  const skin = linear(traits.skin)
  color = mix(color, skin, eyeRim * traits.eyeRim)
  if (traits.face === 'long' && (part === 'jaw' || part === 'muzzle')) {
    const lipLine = smoothstep(0.008, 0.002, Math.abs(p[1] - (head.muzzleTip[1] - (head.muzzleTip[1] - head.jawTip[1]) * 0.55)))
    color = mix(color, skin, lipLine * smoothstep(-0.2, 0.3, n[2] + Math.abs(n[0])))
  }
  if (traits.pads && (part === 'paw' || part === 'toe') && n[1] < -0.45) color = linear(traits.pads)
  return color
}

// Độ dài lông (hệ số) theo vùng: mặt ngắn, bờm cổ và đuôi dài, quanh mắt và đệm chân gần như không có
function furFactor(fur, ctx) {
  const { p, n, part, head, unit, traits } = ctx
  const region = {
    muzzle: fur.face * 0.7,
    jaw: fur.face * 0.8,
    skull: n[2] > 0.3 ? fur.face : fur.ruff * 0.8,
    cheek: fur.ruff,
    neck: fur.ruff,
    brisket: fur.ruff,
    chest: n[2] > 0.3 ? fur.ruff : 1,
    rump: fur.rump,
    tail: fur.tail,
    leg: fur.legs,
    paw: fur.legs * 0.7,
    toe: fur.legs * 0.6,
    ear: fur.ears,
    earInner: fur.ears * 0.35,
  }[part] ?? 1
  const nearEye = Math.min(...head.eyes.map((eye) => length(sub(p, eye.center)) / eye.radius))
  const nearNose = length(sub(p, head.nose)) / (0.03 * unit)
  const pad = traits.pads && (part === 'paw' || part === 'toe') && n[1] < -0.45 ? 0 : 1
  return region * smoothstep(1.05, 2.3, nearEye) * smoothstep(0.6, 1.4, nearNose) * pad
}

/**
 * Dựng lưới thân + tai, kèm cho từng đỉnh: pháp tuyến, màu, hệ số độ dài lông, độ cứng lông (gai), hướng chải,
 * độ che khuất, 4 xương ảnh hưởng mạnh nhất và trọng số. step: bước lưới (nhỏ hơn thì chi tiết hơn, chậm hơn).
 */
export function buildBody(code, youth = 0, step = 0.0085) {
  const anatomy = skeletonOf(code, youth)
  const { bones, prims, ear, head, round, breed, traits, unit } = anatomy
  const boneIndex = Object.fromEntries(bones.map((bone, i) => [bone.name, i]))
  const solid = prims.filter((p) => !p.cut)
  const field = makeField(prims)
  const { min, max } = extent(solid, 0.04 * unit)
  // Thú nhỏ dùng lưới mịn hơn để giữ chi tiết
  const meshStep = step * Math.max(0.5, unit)
  const body = surfaceNets(field, min, max, meshStep * (round ? 0.8 : 1))

  // Tai: lưới riêng, mịn hơn, gắn cứng vào xương tai
  const leftEar = earField(ear)
  const earMeshes = [1, -1].map((side) => {
    const sdf = (x, y, z) => leftEar(x * side, y, z)
    const box = earExtent(ear, side)
    return { side, mesh: surfaceNets(sdf, box.min, box.max, meshStep * 0.4), sdf }
  })

  const parts = [{ mesh: body, sdf: field }, ...earMeshes]
  const total = parts.reduce((sum, item) => sum + item.mesh.positions.length / 3, 0)
  const out = {
    positions: new Float32Array(total * 3),
    normals: new Float32Array(total * 3),
    colors: new Float32Array(total * 3),
    furLength: new Float32Array(total),
    furStiff: new Float32Array(total),
    comb: new Float32Array(total * 3),
    ao: new Float32Array(total),
    skinIndex: new Uint16Array(total * 4),
    skinWeight: new Float32Array(total * 4),
    indices: new Uint32Array(parts.reduce((sum, item) => sum + item.mesh.indices.length, 0)),
  }

  let vertexOffset = 0
  let indexOffset = 0
  for (const [partIndex, { mesh, sdf, side }] of parts.entries()) {
    const count = mesh.positions.length / 3
    for (let v = 0; v < count; v++) {
      const o = vertexOffset + v
      const p = [mesh.positions[v * 3], mesh.positions[v * 3 + 1], mesh.positions[v * 3 + 2]]
      const n = [mesh.normals[v * 3], mesh.normals[v * 3 + 1], mesh.normals[v * 3 + 2]]
      let owner
      let weights
      if (partIndex === 0) {
        ;({ owner, weights } = skinWeights(solid, boneIndex, p, 0.012 * unit))
      } else {
        // Mặt trong tai (quay về phía trước) màu hồng, lông thưa
        const front = mirror(ear.front, side)
        owner = { part: n[0] * front[0] + n[1] * front[1] + n[2] * front[2] > 0.3 ? 'earInner' : 'ear', comb: normalize(sub(mirror(ear.tip, side), mirror(ear.base, side))) }
        weights = [[boneIndex[side > 0 ? 'earL' : 'earR'], 1]]
      }
      const ctx = { p, n, part: owner.part, head, ear, traits, unit }
      ctx.spine = breed.spines ? spineZone(ctx) : 0
      let color = owner.part === 'earInner' ? mix(colorOf(code, { ...ctx, part: 'ear' }), linear(traits.innerEar), 0.7) : colorOf(code, ctx)
      if (owner.part === 'ear' && code === 'tabby') color = mix(color, linear(COLORS[code].dark), 0.6)
      if (owner.part === 'ear' && code === 'capybara') color = mix(color, linear('#3a2a22'), 0.75) // tai capybara đen
      if (partIndex > 0 && code === 'rabbit') {
        // Chóp tai thỏ sẫm màu: đo vị trí đỉnh dọc theo tai (0 ở gốc, 1 ở chóp)
        const base = mirror(ear.base, side)
        const axis = sub(mirror(ear.tip, side), base)
        const along = sub(p, base)
        const t = (along[0] * axis[0] + along[1] * axis[1] + along[2] * axis[2]) / (axis[0] ** 2 + axis[1] ** 2 + axis[2] ** 2)
        color = mix(color, linear('#3a2c22'), smoothstep(0.8, 0.97, t) * 0.8)
      }
      out.positions.set(p, o * 3)
      out.normals.set(n, o * 3)
      out.colors.set(color, o * 3)
      const fur = breed.fur.length * furFactor(breed.fur, ctx)
      out.furLength[o] = ctx.spine ? fur + (breed.spines.length - fur) * ctx.spine : fur
      out.furStiff[o] = ctx.spine
      const comb = owner.comb
      const dot = comb[0] * n[0] + comb[1] * n[1] + comb[2] * n[2]
      out.comb.set(normalize(sub(comb, scale(n, dot))), o * 3)
      out.ao[o] = occlusion(sdf, p, n)
      weights.forEach(([index, weight], k) => {
        out.skinIndex[o * 4 + k] = index
        out.skinWeight[o * 4 + k] = weight
      })
    }
    for (let i = 0; i < mesh.indices.length; i++) out.indices[indexOffset + i] = mesh.indices[i] + vertexOffset
    vertexOffset += count
    indexOffset += mesh.indices.length
  }

  return { ...anatomy, mesh: out, boneIndex, nose: buildNose(anatomy) }
}

// Mũi: khối mềm có hai lỗ mũi và rãnh nhân trung, bề mặt sần nhẹ như da mũi thật (lưới riêng, vật liệu bóng ướt)
function buildNose({ head, breed, round }) {
  const mw = breed.head.muzzleWidth
  const c = head.nose
  const r = (round ? [mw * 0.3, mw * 0.2, mw * 0.18] : breed.head.block ? [mw * 0.62, mw * 0.2, mw * 0.36] : [mw * 0.62, mw * 0.42, mw * 0.4]).map((value) => value * (breed.noseSize ?? 1))
  const nostril = round ? mw * 0.06 : mw * 0.13
  const field = makeField(
    [
      { shape: 'ellipsoid', c, r },
      ...[1, -1].map((side) => ({ shape: 'sphere', c: add(c, [side * r[0] * 0.45, -r[1] * 0.1, r[2] * 0.8]), r: nostril, k: nostril * 0.3, cut: true })),
      { shape: 'cone', a: add(c, [0, -r[1] * 0.2, r[2] * 0.92]), b: add(c, [0, -r[1] * 1.2, r[2] * 0.6]), r1: r[0] * 0.08, r2: r[0] * 0.1, k: 0.002, cut: true },
    ],
    0.02,
  )
  const bumpy = (x, y, z) => field(x, y, z) + (noise(x * 900, y * 900, z * 900) - 0.5) * r[0] * 0.03
  const pad = Math.max(...r) * 1.4
  return surfaceNets(bumpy, sub(c, [pad, pad, pad]), add(c, [pad, pad, pad]), r[0] / 18)
}

// Trọng số xương của một đỉnh thân: khối càng gần càng ảnh hưởng mạnh, giữ 4 xương mạnh nhất
function skinWeights(prims, boneIndex, p, sigma) {
  const byBone = new Map()
  let owner = prims[0]
  let best = Infinity
  for (const prim of prims) {
    const d = primitiveDistance(prim, p[0], p[1], p[2])
    if (d < best) {
      best = d
      owner = prim
    }
    const w = Math.exp(-Math.max(0, d) / sigma)
    if (w < 1e-4) continue
    const index = boneIndex[prim.bone]
    byBone.set(index, (byBone.get(index) ?? 0) + w)
  }
  const top = [...byBone.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4)
  const sum = top.reduce((total, [, w]) => total + w, 0) || 1
  return { owner, weights: top.length ? top.map(([index, w]) => [index, w / sum]) : [[boneIndex[owner.bone], 1]] }
}

// Hộp bao các khối (cộng lề để lưới không bị cắt)
function extent(prims, margin) {
  const min = [Infinity, Infinity, Infinity]
  const max = [-Infinity, -Infinity, -Infinity]
  for (const p of prims) {
    const points = p.shape === 'cone' ? [[p.a, p.r1], [p.b, p.r2]] : [[p.c, p.shape === 'ellipsoid' ? Math.max(...p.r) : p.r]]
    for (const [c, r] of points) {
      for (let i = 0; i < 3; i++) {
        min[i] = Math.min(min[i], c[i] - r - margin)
        max[i] = Math.max(max[i], c[i] + r + margin)
      }
    }
  }
  return { min, max }
}

function earExtent(ear, side) {
  const base = mirror(ear.base, side)
  const tip = mirror(ear.tip, side)
  const pad = Math.max(ear.width, ear.tipWidth) + ear.thickness * 2 + 0.01
  return {
    min: [0, 1, 2].map((i) => Math.min(base[i], tip[i]) - pad),
    max: [0, 1, 2].map((i) => Math.max(base[i], tip[i]) + pad),
  }
}
