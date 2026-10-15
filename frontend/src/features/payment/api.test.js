import { describe, expect, it } from 'vitest'
import { discountFor } from './api'

describe('discountFor', () => {
  const tenPercent = { discount_percent: 10, max_discount: 50000 }

  it('giảm theo % giá', () => {
    expect(discountFor(199000, tenPercent)).toBe(19900)
  })

  it('không vượt mức giảm tối đa', () => {
    expect(discountFor(1000000, tenPercent)).toBe(50000)
  })

  it('sau khi giảm vẫn còn ít nhất 1.000đ (mức MoMo nhận)', () => {
    expect(discountFor(1200, { discount_percent: 25, max_discount: 50000 })).toBe(200)
    expect(discountFor(1000, tenPercent)).toBe(0)
  })

  it('không có voucher thì không giảm', () => {
    expect(discountFor(199000, null)).toBe(0)
  })
})
