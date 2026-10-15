import { describe, expect, it } from 'vitest'
import { blendPose, blink, footCycle, GESTURES, LEG_NAMES, NEUTRAL, nextGesture, poseFor, spring } from './petMotion'
import { ITEM_ICONS, MOODS, PET_STATES, SPECIES } from './petStates'

const dog = { kind: 'dog', gait: 'walk', size: 0.55, legs: 0.3, stride: 0.25, freq: 1.6, gesture: null, gestureTime: 0 }
const cat = { ...dog, kind: 'cat', size: 0.34, legs: 0.18 }
const rabbit = { ...dog, kind: 'rabbit', gait: 'hop', size: 0.2, legs: 0.07, stride: 0.15 }
const hamster = { ...dog, kind: 'hamster', gait: 'trot', size: 0.15, legs: 0.03, stride: 0.06 }
const hedgehog = { ...hamster, kind: 'hedgehog', size: 0.14 }

describe('PET_STATES', () => {
  it('có đủ 9 trạng thái (8 theo yêu cầu + chơi đồ chơi trong phòng)', () => {
    expect(Object.keys(PET_STATES)).toEqual(['idle', 'walk', 'run', 'jump', 'eat', 'sleep', 'happy', 'sad', 'play'])
  })

  it('trạng thái kế tiếp và trạng thái theo tâm trạng luôn hợp lệ', () => {
    for (const { next } of Object.values(PET_STATES)) {
      if (next) expect(PET_STATES).toHaveProperty(next)
    }
    for (const { state } of Object.values(MOODS)) expect(PET_STATES).toHaveProperty(state)
  })

  it('có đủ 8 loài (khớp dữ liệu mẫu pet_species)', () => {
    expect(Object.keys(SPECIES)).toEqual(['shiba', 'rabbit', 'tabby', 'capybara', 'corgi', 'hamster', 'persian', 'hedgehog'])
  })
})

describe('poseFor', () => {
  it.each(Object.keys(PET_STATES))('tư thế %s có đủ khớp và mọi giá trị là số hữu hạn', (state) => {
    for (const ctx of [dog, cat, rabbit, hamster, hedgehog]) {
      for (const t of [0, 0.37, 1, 2.5, 10]) {
        const pose = poseFor(state, t, ctx)
        expect(Object.keys(pose).sort()).toEqual(Object.keys(NEUTRAL).sort())
        for (const value of Object.values(pose)) expect(Number.isFinite(value)).toBe(true)
      }
    }
  })

  it('khi đi, luôn có ít nhất hai bàn chân chạm sàn và các chân lệch nhịp nhau', () => {
    for (let t = 0; t < 1.25; t += 0.05) {
      const pose = poseFor('walk', t, dog)
      expect(LEG_NAMES.filter((leg) => pose[`${leg}y`] === 0).length).toBeGreaterThanOrEqual(2)
    }
    const pose = poseFor('walk', 0.3, dog)
    expect(new Set(LEG_NAMES.map((leg) => pose[`${leg}z`].toFixed(4))).size).toBe(4)
  })

  it('ngủ thì nằm xuống vừa chạm sàn (không lún), nhắm mắt; buồn thì cụp tai, cụp đuôi', () => {
    const sleep = poseFor('sleep', 3, dog)
    expect(sleep.eyes).toBe(0)
    expect(sleep.sink).toBeGreaterThan(dog.legs * 0.9)
    // Loài chân ngắn chỉ hạ thân đúng bằng chiều dài chân
    expect(poseFor('sleep', 3, hamster).sink).toBeLessThan(hamster.legs * 1.2)
    const sad = poseFor('sad', 1, dog)
    expect(sad.earsUp).toBeLessThan(0)
    expect(sad.tailLift).toBeLessThan(0)
  })

  it('vui: chó cúi chào thè lưỡi, mèo ngồi', () => {
    expect(poseFor('happy', 1, dog).tongue).toBeGreaterThan(0)
    expect(poseFor('happy', 1, dog).hipsPitch).toBeGreaterThan(0)
    expect(poseFor('happy', 1, cat).hipsPitch).toBeLessThan(0)
  })

  it('nhảy bắt đầu và kết thúc trên sàn, giữa chừng bay lên', () => {
    expect(poseFor('jump', 0, dog).lift).toBeCloseTo(0)
    expect(poseFor('jump', 0.5, dog).lift).toBeGreaterThan(dog.size * 0.4)
    expect(poseFor('jump', 1, dog).lift).toBeCloseTo(0)
  })

  it('cử chỉ lúc rảnh chồng lên tư thế đứng, xong thì trở lại bình thường', () => {
    const ctx = { ...dog, gesture: 'yawn', gestureTime: 0 }
    expect(poseFor('idle', GESTURES.yawn.duration / 2, ctx).jaw).toBeGreaterThan(0.9)
    expect(poseFor('idle', GESTURES.yawn.duration + 1, ctx).jaw).toBeCloseTo(0)
    expect(poseFor('idle', 4, { ...dog, gesture: 'sit', gestureTime: 0 }).sink).toBeGreaterThan(0.1)
  })

  it('thỏ nhảy: hai chân sau đạp cùng lúc, có lúc cả thân bay lên', () => {
    let airborne = false
    for (let t = 0; t < 1; t += 0.02) {
      const pose = poseFor('walk', t, rabbit)
      expect(Math.abs(pose.HLz - pose.HRz)).toBeLessThan(rabbit.stride * 0.1)
      if (pose.lift > rabbit.size * 0.1) airborne = true
    }
    expect(airborne).toBe(true)
  })

  it('hamster, nhím chạy lon ton: hai chân chéo nhau cùng nhịp, luôn có chân chạm sàn', () => {
    for (let t = 0; t < 1; t += 0.05) {
      const pose = poseFor('walk', t, hamster)
      expect(pose.FLz).toBeCloseTo(pose.HRz)
      expect(LEG_NAMES.filter((leg) => pose[`${leg}y`] === 0).length).toBeGreaterThanOrEqual(2)
    }
  })

  it('mỗi loài chỉ có cử chỉ của mình (mèo liếm lông, chó gãi tai)', () => {
    const catGestures = new Set(Array.from({ length: 50 }, (_, i) => nextGesture('cat', i / 50)))
    const dogGestures = new Set(Array.from({ length: 50 }, (_, i) => nextGesture('dog', i / 50)))
    expect(catGestures.has('groom')).toBe(true)
    expect(catGestures.has('scratch')).toBe(false)
    expect(dogGestures.has('scratch')).toBe(true)
    expect(dogGestures.has('groom')).toBe(false)
    const rabbitGestures = new Set(Array.from({ length: 50 }, (_, i) => nextGesture('rabbit', i / 50)))
    expect(rabbitGestures.has('stand')).toBe(true)
    expect(rabbitGestures.has('scratch')).toBe(false)
  })
})

describe('bước chân', () => {
  it('chạm sàn thì trượt về sau, nhấc lên thì vung ra trước theo cung', () => {
    expect(footCycle(0, 0.6, 0.2, 0.05)).toEqual([0.1, 0, 0])
    expect(footCycle(0.59, 0.6, 0.2, 0.05)[0]).toBeCloseTo(-0.1, 2)
    expect(footCycle(0.8, 0.6, 0.2, 0.05)[1]).toBeCloseTo(0.05)
    expect(footCycle(1.3, 0.6, 0.2, 0.05)).toEqual(footCycle(0.3, 0.6, 0.2, 0.05))
  })
})

describe('trộn và lò xo', () => {
  it('trộn dần từ tư thế hiện tại về tư thế đích', () => {
    const target = { ...NEUTRAL, lift: 1 }
    expect(blendPose(NEUTRAL, target, 0.25).lift).toBeCloseTo(0.25)
    expect(blendPose(NEUTRAL, target, 1).lift).toBe(1)
  })

  it('lò xo lắc qua đích rồi dừng hẳn ở đích', () => {
    let [value, velocity] = [0, 0]
    let overshoot = false
    for (let i = 0; i < 600; i++) {
      ;[value, velocity] = spring(value, velocity, 1, 1 / 60, 60, 8)
      if (value > 1.01) overshoot = true
    }
    expect(overshoot).toBe(true)
    expect(value).toBeCloseTo(1, 3)
  })

  it('chớp mắt thỉnh thoảng, phần lớn thời gian mắt mở', () => {
    expect(blink(1)).toBe(1)
    expect(blink(4.1)).toBeLessThan(0.5)
  })
})

it('mọi vật phẩm trong cửa hàng đều có biểu tượng', () => {
  const codes = ['cookie', 'apple', 'fish', 'cake', 'flower', 'party_hat', 'crown', 'scarf', 'bow_tie', 'bell_collar', 'backpack', 'wings',
    'food_bowl', 'pet_bed', 'rug_round', 'rug_rectangle', 'plant_small', 'plant_large', 'cardboard_box', 'teddy_bear', 'floor_lamp', 'bookcase',
    'armchair', 'coffee_table', 'sofa', 'scratching_post', 'hamster_wheel', 'pet_tunnel']
  for (const code of codes) expect(ITEM_ICONS).toHaveProperty(code)
})
