import { describe, expect, it } from 'vitest'
import { daylight, isNight, mixColor } from './daylight'

describe('daylight', () => {
  it('giữa trưa nắng mạnh nhất, nửa đêm tối hẳn', () => {
    const noon = daylight(12)
    const midnight = daylight(0)
    expect(noon.sun).toBeCloseTo(1)
    expect(noon.night).toBe(0)
    expect(midnight.sun).toBe(0)
    expect(midnight.night).toBe(1)
    expect(noon.sunIntensity).toBeGreaterThan(midnight.sunIntensity)
  })

  it('ban đêm từ khoảng 18 giờ tới 6 giờ sáng', () => {
    expect([7, 12, 16].map(isNight)).toEqual([false, false, false])
    expect([19, 22, 3].map(isNight)).toEqual([true, true, true])
  })

  it('trộn màu hex theo tỉ lệ', () => {
    expect(mixColor('#000000', '#ffffff', 0.5)).toBe('#808080')
    expect(mixColor('#ff0000', '#0000ff', 0)).toBe('#ff0000')
    expect(daylight(12).sky).toMatch(/^#[0-9a-f]{6}$/)
  })
})
