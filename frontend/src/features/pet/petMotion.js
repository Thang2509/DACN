/**
 * Tư thế thú cưng theo trạng thái và thời gian (hàm thuần, không phụ thuộc three.js nên kiểm thử được).
 * Góc tính bằng radian (pitch dương = chúi xuống trước), độ dài theo đơn vị mô hình.
 * Bàn chân là vị trí đích (lệch so với lúc đứng); PetBody dùng IK để đặt chân đúng chỗ, nên chân bám sàn khi đi.
 * ctx: { kind: loài (dog, cat, rabbit, hamster, capybara, hedgehog), gait: 'walk' | 'trot' | 'hop',
 *        size: chiều cao vai, legs: chiều dài chân (từ sàn tới bụng), stride: độ dài bước, freq: số bước mỗi giây,
 *        gesture, gestureTime }
 * Độ hạ thân khi ngồi / nằm tính theo chiều dài chân, nên loài chân ngắn (corgi, hamster, nhím) không lún xuống sàn.
 */

export const LEG_NAMES = ['FL', 'FR', 'HL', 'HR']

const LEG_KEYS = LEG_NAMES.flatMap((leg) => [`${leg}x`, `${leg}y`, `${leg}z`, `${leg}curl`])

export const NEUTRAL = {
  lift: 0, // nâng cả thân
  sink: 0, // hạ thân (ngồi, nằm)
  hipsPitch: 0, // xoay cả thân quanh khớp hông (âm = ngóc phần trước lên khi ngồi)
  hipsRoll: 0,
  hipsYaw: 0,
  spinePitch: 0,
  spineYaw: 0,
  chestPitch: 0,
  chestRoll: 0,
  neckPitch: 0,
  neckYaw: 0,
  headPitch: 0,
  headYaw: 0,
  headRoll: 0,
  jaw: 0, // há miệng
  tongue: 0, // thè lưỡi
  eyes: 1, // 1 mở, 0 nhắm
  earsUp: 0, // dựng tai (+) / cụp tai (-)
  tailLift: 0,
  tailWag: 0,
  tailCurl: 0,
  look: 0, // mức nhìn theo người chơi
  breath: 1, // biên độ thở
  ...Object.fromEntries(LEG_KEYS.map((key) => [key, 0])),
}

const TAU = Math.PI * 2
const wave = (t, hz, phase = 0) => Math.sin(TAU * (t * hz + phase))
const smooth = (a) => a * a * (3 - 2 * a)
const clamp01 = (x) => Math.min(1, Math.max(0, x))
// Đi vào rồi đi ra mượt trong khoảng [0, duration] (dùng cho cử chỉ)
const envelope = (t, duration, ramp = 0.35) => smooth(clamp01(t / ramp)) * smooth(clamp01((duration - t) / ramp))

// Chớp mắt khoảng 3–5 giây một lần, thỉnh thoảng chớp đôi
export function blink(t) {
  const period = 4.2
  const phase = t % period
  const closed = (start) => phase > start && phase < start + 0.13
  return closed(period - 0.2) || (Math.floor(t / period) % 3 === 0 && closed(period - 0.45)) ? 0.05 : 1
}

/**
 * Vị trí một bàn chân trong chu kỳ bước: chạm sàn (duty) thì trượt dần về sau, nhấc lên thì vung ra trước theo cung.
 * Trả về [lệch z, độ cao, độ gập ngón].
 */
export function footCycle(phase, duty, stride, lift) {
  const p = ((phase % 1) + 1) % 1
  if (p < duty) return [stride * (0.5 - p / duty), 0, 0]
  const s = (p - duty) / (1 - duty)
  return [stride * (-0.5 + smooth(s)), lift * Math.sin(Math.PI * s), Math.sin(Math.PI * s)]
}

// Chiều dài chân (thiếu thì ước theo chiều cao vai như chó, mèo)
const legsOf = (ctx) => ctx.legs ?? ctx.size * 0.55

function setFoot(pose, leg, [z, y, curl], x = 0) {
  pose[`${leg}x`] = x
  pose[`${leg}y`] = y
  pose[`${leg}z`] = z
  pose[`${leg}curl`] = curl
}

// Độ chạm đất (duty) của mỗi kiểu di chuyển: [đi, chạy]; PetBody dùng để khớp nhịp bước với tốc độ
export const DUTY = { walk: [0.62, 0.38], trot: [0.55, 0.45], hop: [0.5, 0.5] }

/**
 * Đi 4 nhịp (chó, mèo, capybara): sau trái → trước trái → sau phải → trước phải.
 * Mỗi lần chân chạm đất thân hơi hạ; hông và vai lắc ngược pha; hông xoay theo chân sau đang đẩy còn ngực xoay ngược lại
 * nên cột sống uốn chữ S nhẹ; đầu bù lại nhịp nhấp nhô để giữ ổn định như thú thật.
 */
function walk(t, ctx) {
  const cycle = t * ctx.freq
  const pose = {}
  const offsets = { HL: 0, FL: 0.25, HR: 0.5, FR: 0.75 }
  for (const leg of LEG_NAMES) setFoot(pose, leg, footCycle(cycle + offsets[leg], DUTY.walk[0], ctx.stride, ctx.size * 0.09))
  const bob = Math.cos(TAU * cycle * 2)
  return {
    ...pose,
    lift: ctx.size * 0.012 * bob,
    hipsRoll: 0.05 * wave(cycle, 1),
    hipsYaw: 0.05 * wave(cycle, 1, 0.05),
    spineYaw: -0.08 * wave(cycle, 1, 0.05),
    chestRoll: -0.04 * wave(cycle, 1, 0.25),
    neckPitch: 0.04 * bob,
    headPitch: -0.035 * bob,
    headYaw: -0.03 * wave(cycle, 1),
    tailWag: 0.3 * wave(cycle, 1, 0.5),
    tailLift: 0.1,
    earsUp: 0.1,
    eyes: blink(t),
  }
}

// Phi nước đại: hai chân sau đạp gần nhau, hai chân trước đáp gần nhau; lưng co lại rồi duỗi ra, đầu giữ ổn định
function gallop(t, ctx) {
  const cycle = t * ctx.freq
  const pose = {}
  const offsets = { HL: 0, HR: 0.1, FL: 0.55, FR: 0.65 }
  for (const leg of LEG_NAMES) setFoot(pose, leg, footCycle(cycle + offsets[leg], DUTY.walk[1], ctx.stride, ctx.size * 0.16))
  const flex = wave(cycle, 1, 0.1)
  return {
    ...pose,
    lift: ctx.size * 0.05 * Math.max(0, wave(cycle, 1, 0.3)),
    spinePitch: 0.14 * flex,
    chestPitch: -0.1 * flex,
    hipsPitch: -0.07 * flex,
    neckPitch: -0.1 - 0.06 * flex,
    headPitch: 0.1 * flex,
    earsUp: -0.6,
    tailLift: 0.15,
    tailWag: 0.1 * flex,
    jaw: 0.35,
    tongue: ctx.kind === 'dog' ? 0.7 : 0,
    eyes: 1,
  }
}

// Chạy lon ton (hamster, nhím): hai chân chéo nhau cùng nhịp, bước ngắn và nhanh; thân lắc lư (nhím lạch bạch hơn)
function trot(t, ctx, fast) {
  const cycle = t * ctx.freq
  const pose = {}
  const offsets = { FL: 0, HR: 0, FR: 0.5, HL: 0.5 }
  for (const leg of LEG_NAMES) setFoot(pose, leg, footCycle(cycle + offsets[leg], DUTY.trot[fast ? 1 : 0], ctx.stride, ctx.size * (fast ? 0.14 : 0.09)))
  const waddle = ctx.kind === 'hedgehog' ? 2 : 1
  return {
    ...pose,
    lift: ctx.size * 0.02 * Math.abs(wave(cycle, 1)),
    hipsRoll: 0.06 * waddle * wave(cycle, 1),
    chestRoll: -0.05 * waddle * wave(cycle, 1),
    spineYaw: 0.04 * wave(cycle, 1),
    headYaw: -0.03 * wave(cycle, 1),
    neckPitch: fast ? -0.08 : 0.02,
    earsUp: fast ? -0.3 : 0.1,
    tailWag: 0.2 * wave(cycle, 1),
    eyes: blink(t),
  }
}

/**
 * Thỏ nhảy: hai chân sau cùng đạp đẩy thân bay về trước, hai chân trước chạm đất trước rồi chân sau đáp xuống;
 * lưng cong lại lúc gom chân, duỗi ra lúc bay, tai lắc theo (PetBody thêm độ trễ lò xo cho tai)
 */
function hop(t, ctx, fast) {
  const cycle = t * ctx.freq
  const phase = ((cycle % 1) + 1) % 1
  const pose = {}
  const lift = ctx.size * (fast ? 0.3 : 0.16)
  setFoot(pose, 'HL', footCycle(cycle, DUTY.hop[0], ctx.stride, lift), ctx.size * 0.01)
  setFoot(pose, 'HR', footCycle(cycle + 0.02, DUTY.hop[0], ctx.stride, lift), -ctx.size * 0.01)
  setFoot(pose, 'FL', footCycle(cycle + 0.42, 0.4, ctx.stride, lift * 0.8))
  setFoot(pose, 'FR', footCycle(cycle + 0.47, 0.4, ctx.stride, lift * 0.8))
  const flight = Math.sin(Math.PI * clamp01((phase - 0.45) / 0.3))
  const gather = Math.sin(Math.PI * clamp01((phase - 0.72) / 0.28))
  return {
    ...pose,
    lift: ctx.size * (fast ? 0.32 : 0.15) * flight,
    spinePitch: 0.2 * gather - 0.08 * flight,
    hipsPitch: -0.12 * flight + 0.1 * gather,
    neckPitch: 0.06 * flight,
    earsUp: fast ? -0.35 : -0.1 * flight,
    tailLift: 0.3,
    eyes: blink(t),
  }
}

const GAITS = {
  walk: (t, ctx, fast) => (fast ? gallop(t, ctx) : walk(t, ctx)),
  trot,
  hop,
}

// Ngồi: hạ mông, ngóc thân trước, chân sau gập ra trước; chân trước vẫn đặt ở chỗ cũ
function sitPose(ctx) {
  const pose = { sink: legsOf(ctx) * 0.6, hipsPitch: -0.62, spinePitch: 0.12, chestPitch: 0.1, neckPitch: 0.1, headPitch: 0.15, tailLift: -0.5, tailCurl: 0.6 }
  setFoot(pose, 'HL', [ctx.size * 0.26, 0, 0.2], ctx.size * 0.03)
  setFoot(pose, 'HR', [ctx.size * 0.26, 0, 0.2], -ctx.size * 0.03)
  setFoot(pose, 'FL', [-ctx.size * 0.02, ctx.size * 0.02, 0])
  setFoot(pose, 'FR', [-ctx.size * 0.02, ctx.size * 0.02, 0])
  return pose
}

// Nằm: thân áp xuống sàn, chân trước duỗi ra trước, chân sau gập sang hai bên
function liePose(ctx) {
  const pose = { sink: legsOf(ctx) * 1.02, hipsPitch: 0.04, hipsRoll: ctx.kind === 'cat' ? 0.12 : 0.08, neckPitch: 0.25, headPitch: 0.35, headRoll: 0.1, earsUp: -0.4, tailLift: -0.5, tailCurl: 1, tailWag: 0.6 }
  setFoot(pose, 'FL', [ctx.size * 0.32, ctx.size * 0.03, 0.1], ctx.size * 0.02)
  setFoot(pose, 'FR', [ctx.size * 0.28, ctx.size * 0.03, 0.1], -ctx.size * 0.01)
  setFoot(pose, 'HL', [ctx.size * 0.32, ctx.size * 0.05, 0.3], ctx.size * 0.16)
  setFoot(pose, 'HR', [ctx.size * 0.3, ctx.size * 0.05, 0.3], ctx.size * 0.14)
  return pose
}

// Cúi chào khi vui (chó): ngực hạ sát sàn, mông chổng lên, đuôi vẫy mạnh
function bowPose(ctx) {
  const pose = { hipsPitch: 0.42, sink: legsOf(ctx) * 0.1, neckPitch: -0.45, headPitch: -0.15, earsUp: 0.3, tailLift: 0.6 }
  setFoot(pose, 'FL', [ctx.size * 0.2, 0, 0])
  setFoot(pose, 'FR', [ctx.size * 0.2, 0, 0])
  return pose
}

// Đứng bằng hai chân sau ngó nghiêng (thỏ, hamster): ngóc thân trước lên, hai chân trước co trước ngực
function standPose(ctx) {
  const s = ctx.size
  const pose = { hipsPitch: -0.95, sink: legsOf(ctx) * 0.07, spinePitch: 0.12, neckPitch: 0.3, headPitch: 0.35, earsUp: 0.4, tailLift: -0.3 }
  setFoot(pose, 'FL', [s * 0.12, s * 0.35, 1])
  setFoot(pose, 'FR', [s * 0.12, s * 0.35, 1])
  setFoot(pose, 'HL', [s * 0.08, 0, 0])
  setFoot(pose, 'HR', [s * 0.08, 0, 0])
  return pose
}

const ALL_KINDS = ['dog', 'cat', 'rabbit', 'hamster', 'capybara', 'hedgehog']

// Cử chỉ lúc rảnh, chồng lên tư thế đứng/ngồi; t: thời gian từ lúc bắt đầu cử chỉ
export const GESTURES = {
  look: { duration: 5, kinds: ALL_KINDS },
  sit: { duration: 8, kinds: ['dog', 'cat', 'capybara'] },
  scratch: { duration: 3.2, kinds: ['dog'] },
  yawn: { duration: 2.6, kinds: ['dog', 'cat', 'capybara', 'hamster'] },
  sniff: { duration: 3.5, kinds: ['dog', 'rabbit', 'hamster', 'capybara', 'hedgehog'] },
  shake: { duration: 1.6, kinds: ['dog'] },
  groom: { duration: 4, kinds: ['cat', 'rabbit', 'hamster'] },
  loaf: { duration: 9, kinds: ['cat', 'rabbit', 'capybara', 'hedgehog'] },
  stand: { duration: 3.5, kinds: ['rabbit', 'hamster'] },
}

function gesturePose(name, t, ctx) {
  const g = GESTURES[name]
  const k = envelope(t, g.duration)
  const scaled = (pose) => Object.fromEntries(Object.entries(pose).map(([key, value]) => [key, value * k]))
  const s = ctx.size
  if (name === 'look') return { look: k }
  if (name === 'sit') return { ...scaled(sitPose(ctx)), look: k * 0.8 }
  if (name === 'stand') return { ...scaled(standPose(ctx)), headYaw: 0.45 * wave(t, 0.35) * k, look: k * 0.5 }
  if (name === 'loaf') return { ...scaled({ ...liePose(ctx), headPitch: 0.05, neckPitch: -0.05, earsUp: 0, FLz: s * 0.12, FRz: s * 0.12 }), look: k * 0.6, eyes: 1 - 0.6 * k }
  if (name === 'yawn') {
    const open = Math.sin(Math.PI * clamp01(t / g.duration))
    return { headPitch: -0.45 * open, neckPitch: -0.15 * open, jaw: open, tongue: 0.3 * open, eyes: 1 - open, earsUp: -0.4 * open }
  }
  if (name === 'sniff') {
    // Cúi xuống đánh hơi, mũi khụt khịt nhanh (thú nhỏ khụt khịt nhanh hơn)
    const twitch = ctx.kind === 'dog' || ctx.kind === 'capybara' ? 6 : 11
    return { neckPitch: 0.7 * k, headPitch: 0.35 * k + 0.05 * wave(t, twitch) * k, headYaw: 0.25 * wave(t, 0.4) * k, earsUp: 0.2 * k, tailWag: 0.2 * wave(t, 1.5) * k }
  }
  if (name === 'shake') {
    const shake = Math.sin(TAU * t * 5.5) * k
    return { chestRoll: 0.35 * shake, hipsRoll: -0.3 * shake, headRoll: 0.45 * shake, headYaw: 0.2 * shake, earsUp: 0.6 * shake, eyes: 1 - 0.7 * k, tailWag: 0.6 * shake }
  }
  if (name === 'scratch') {
    // Ngồi rồi đưa chân sau lên gãi sau tai thật nhanh
    const sit = scaled(sitPose(ctx))
    return { ...sit, headRoll: -0.35 * k, headYaw: -0.2 * k, eyes: 1 - 0.7 * k, HLx: s * 0.1 * k, HLy: s * (0.38 + 0.05 * wave(t, 7)) * k, HLz: s * 0.32 * k, HLcurl: k }
  }
  if (name === 'groom') {
    // Mèo ngồi liếm chân trước rồi vuốt lên mặt; thỏ, hamster ngồi dựng lên dùng hai chân trước rửa mặt
    const lick = 0.5 + 0.5 * wave(t, 1.6)
    if (ctx.kind !== 'cat') {
      const wash = scaled(standPose(ctx))
      return { ...wash, neckPitch: 0.5 * k, headPitch: (0.45 + 0.15 * lick) * k, eyes: 1 - 0.7 * k, FLy: s * (0.42 + 0.06 * lick) * k, FRy: s * (0.42 + 0.06 * lick) * k, FLz: s * 0.2 * k, FRz: s * 0.2 * k }
    }
    const sit = scaled(sitPose(ctx))
    return { ...sit, neckPitch: 0.35 * k, headPitch: (0.35 + 0.15 * lick) * k, headRoll: 0.2 * k, eyes: 1 - 0.6 * k, tongue: 0.5 * lick * k, jaw: 0.15 * lick * k, FLy: s * 0.3 * k, FLz: s * (0.2 + 0.03 * lick) * k, FLcurl: k }
  }
  return {}
}

// Nhảy (chạy 1 lần trong 1 giây): nén người → bật lên → co chân trên không → tiếp đất
function jump(t, ctx) {
  const s = ctx.size
  const time = clamp01(t)
  const crouch = Math.sin(Math.PI * clamp01(time / 0.3)) * (time < 0.3 ? 1 : 0)
  const air = Math.sin(Math.PI * clamp01((time - 0.25) / 0.55))
  const land = Math.sin(Math.PI * clamp01((time - 0.78) / 0.22))
  const pose = {
    sink: legsOf(ctx) * (0.2 * crouch + 0.14 * land),
    lift: s * 0.55 * air,
    hipsPitch: -0.25 * air * (time < 0.5 ? 1 : -0.6),
    neckPitch: -0.2 * air,
    earsUp: -0.4 * air,
    tailLift: 0.4 * air,
    jaw: 0.2 * air,
    eyes: 1,
  }
  for (const leg of LEG_NAMES) {
    const frontLeg = leg[0] === 'F'
    setFoot(pose, leg, [s * (frontLeg ? 0.12 : -0.12) * air, s * 0.12 * air, air])
  }
  return pose
}

// Vui: mỗi loài một kiểu
function happy(t, ctx) {
  const s = ctx.size
  if (ctx.kind === 'cat') return { ...sitPose(ctx), look: 1, eyes: blink(t) * (0.6 + 0.4 * Math.abs(wave(t, 0.3))), tailLift: 0.4, tailWag: 0.35 * wave(t, 0.5), earsUp: 0.3, headRoll: 0.15 * wave(t, 0.4) }
  if (ctx.kind === 'rabbit') {
    // "Binky": bật nhảy tại chỗ, xoắn người giữa không trung
    const phase = (t * 0.8) % 1
    const air = Math.sin(Math.PI * clamp01(phase / 0.4))
    const pose = { lift: s * 0.6 * air, hipsYaw: 0.45 * air * (Math.floor(t * 0.8) % 2 ? 1 : -1), headYaw: -0.3 * air, earsUp: 0.3 - 0.6 * air, look: 1 - air, eyes: blink(t) }
    for (const leg of LEG_NAMES) setFoot(pose, leg, [0, s * 0.15 * air, air])
    return pose
  }
  if (ctx.kind === 'hamster') return { ...standPose(ctx), headRoll: 0.2 * wave(t, 0.8), look: 1, eyes: blink(t) }
  if (ctx.kind === 'capybara') return { ...sitPose(ctx), look: 1, eyes: 0.45, earsUp: 0.15 * wave(t, 0.5) } // ngồi lim dim "chill"
  if (ctx.kind === 'hedgehog') {
    const bounce = Math.max(0, wave(t, 1.4))
    return { lift: s * 0.08 * bounce, headPitch: -0.2, hipsRoll: 0.1 * wave(t, 1.4), look: 1, eyes: blink(t) }
  }
  const bounce = Math.max(0, wave(t, 1.6))
  return { ...bowPose(ctx), lift: s * 0.05 * bounce, tailWag: 0.9 * wave(t, 4.5), jaw: 0.35, tongue: 0.8, look: 1, eyes: blink(t), headRoll: 0.18 * wave(t, 0.8) }
}

const POSES = {
  idle: (t) => ({
    lift: 0,
    headYaw: 0.15 * wave(t, 0.07),
    headPitch: 0.04 * wave(t, 0.11, 0.3),
    earsUp: 0.15 + 0.1 * Math.max(0, wave(t, 0.23)) ** 8, // thỉnh thoảng giật tai
    tailWag: 0.18 * wave(t, 0.6),
    look: 0.6,
    eyes: blink(t),
  }),
  walk: (t, ctx) => GAITS[ctx.gait ?? 'walk'](t, ctx, false),
  run: (t, ctx) => GAITS[ctx.gait ?? 'walk'](t, ctx, true),
  jump,
  eat: (t, ctx) => {
    const chew = 0.5 + 0.5 * wave(t, 2.4)
    const pose = { neckPitch: 0.75, headPitch: 0.4, chestPitch: 0.08, jaw: 0.25 * chew, tongue: 0.2 * chew, eyes: 0.7, tailWag: 0.4 * wave(t, 1.2), earsUp: 0.1 }
    setFoot(pose, 'FL', [ctx.size * 0.05, 0, 0], ctx.size * 0.03)
    setFoot(pose, 'FR', [ctx.size * 0.05, 0, 0], -ctx.size * 0.03)
    return pose
  },
  sleep: (t, ctx) => {
    const pose = { ...liePose(ctx), eyes: 0, breath: 1.8, lift: ctx.size * 0.006 * wave(t, 0.22) }
    // Nhím ngủ cuộn tròn: cúi gập đầu vào bụng
    return ctx.kind === 'hedgehog' ? { ...pose, sink: legsOf(ctx) * 1.1, neckPitch: 0.9, headPitch: 0.8, hipsPitch: 0.15 } : pose
  },
  happy,
  sad: (t, ctx) => ({ sink: legsOf(ctx) * 0.08, neckPitch: 0.35, headPitch: 0.3, earsUp: -0.8, tailLift: -0.8, tailWag: 0.05 * wave(t, 0.3), eyes: 0.6 + 0.4 * blink(t), breath: 0.7 }),
}

// Tư thế đầy đủ (mọi khớp) cho một trạng thái; idle có thể kèm cử chỉ ctx.gesture bắt đầu lúc ctx.gestureTime
export function poseFor(state, t, ctx) {
  const pose = { ...NEUTRAL, ...(POSES[state] ?? POSES.idle)(t, ctx) }
  if (state === 'idle' && ctx.gesture) {
    const extra = gesturePose(ctx.gesture, t - ctx.gestureTime, ctx)
    for (const [key, value] of Object.entries(extra)) {
      pose[key] = key === 'eyes' ? Math.min(pose.eyes, value) : key === 'look' ? Math.max(pose.look, value) : pose[key] + value
    }
  }
  return pose
}

// Chọn cử chỉ kế tiếp theo loài (mỗi loài có bộ cử chỉ riêng), random: số trong [0, 1)
export function nextGesture(kind, random) {
  const names = Object.keys(GESTURES).filter((name) => GESTURES[name].kinds.includes(kind))
  return names[Math.floor(random * names.length)]
}

// Trộn hai tư thế: alpha 0 → a, 1 → b (dùng khi chuyển trạng thái)
export function blendPose(a, b, alpha) {
  const result = {}
  for (const key of Object.keys(NEUTRAL)) result[key] = a[key] + (b[key] - a[key]) * alpha
  return result
}

/**
 * Lò xo tắt dần cho chuyển động theo quán tính (đuôi, tai): kéo giá trị về đích, có vận tốc nên lắc qua lại rồi dừng.
 * Trả về [giá trị mới, vận tốc mới].
 */
export function spring(value, velocity, target, delta, stiffness = 60, damping = 8) {
  const acceleration = stiffness * (target - value) - damping * velocity
  const nextVelocity = velocity + acceleration * delta
  return [value + nextVelocity * delta, nextVelocity]
}
