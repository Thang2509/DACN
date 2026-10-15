import { describe, expect, it } from 'vitest'
import { categoryAt, coinsFor, GRAVITY, JUMP_SPEED, KEYWORD_SETS, nextGap, overlaps, randomWord, runnerSpeed, seededRandom } from './minigames'

describe('overlaps', () => {
  const pet = { x: 0, y: 0.5, w: 0.6, h: 1 }

  it('chạm nhau khi hai hộp giao nhau', () => {
    expect(overlaps(pet, { x: 0.5, y: 0.3, w: 0.5, h: 0.6 })).toBe(true)
  })

  it('không chạm khi cách nhau theo trục x hoặc đã nhảy qua', () => {
    expect(overlaps(pet, { x: 1, y: 0.3, w: 0.5, h: 0.6 })).toBe(false)
    expect(overlaps({ ...pet, y: 1.5 }, { x: 0, y: 0.3, w: 0.5, h: 0.6 })).toBe(false)
  })
})

describe('vượt chướng ngại', () => {
  it('tốc độ tăng dần và có giới hạn', () => {
    expect(runnerSpeed(0)).toBe(5)
    expect(runnerSpeed(20)).toBe(8)
    expect(runnerSpeed(100)).toBe(12)
  })

  it('khoảng cách chướng ngại luôn dài hơn quãng bay của một cú nhảy', () => {
    const speed = 12
    const jumpDistance = speed * ((2 * JUMP_SPEED) / -GRAVITY)
    expect(nextGap(speed, () => 0)).toBeGreaterThan(jumpDistance)
  })
})

describe('hứng từ khóa', () => {
  it('đổi chủ đề mỗi 20 giây', () => {
    expect([categoryAt(0), categoryAt(19), categoryAt(20), categoryAt(45), categoryAt(60)]).toEqual(['sql', 'sql', 'javascript', 'html', 'sql'])
  })

  it('chữ đúng lấy từ chủ đề hiện tại, chữ sai từ chủ đề khác', () => {
    const right = randomWord('sql', () => 0.1)
    expect(right.correct).toBe(true)
    expect(KEYWORD_SETS.sql.words).toContain(right.text)

    const wrong = randomWord('sql', () => 0.9)
    expect(wrong.correct).toBe(false)
    expect(KEYWORD_SETS.sql.words).not.toContain(wrong.text)
  })

  it('không có chữ nào thuộc hai chủ đề', () => {
    const all = Object.values(KEYWORD_SETS).flatMap((set) => set.words)
    expect(new Set(all).size).toBe(all.length)
  })
})

describe('coinsFor', () => {
  it('điểm chia 100, tối đa 5 xu', () => {
    expect([coinsFor(99), coinsFor(350), coinsFor(5000)]).toEqual([0, 3, 5])
  })
})

describe('seededRandom', () => {
  it('cùng hạt giống cho cùng dãy số, luôn nằm trong khoảng yêu cầu', () => {
    const a = seededRandom(42)
    const b = seededRandom(42)
    const values = Array.from({ length: 50 }, () => a(2, 5))
    expect(values).toEqual(Array.from({ length: 50 }, () => b(2, 5)))
    expect(values.every((value) => value >= 2 && value < 5)).toBe(true)
    expect(seededRandom(1)()).not.toBe(seededRandom(2)())
  })
})
