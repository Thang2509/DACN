import { describe, expect, it } from 'vitest'
import { bubbleSortSteps } from './animationSteps'

const valuesOf = (step) => step.items.map((item) => item.value)

describe('bubbleSortSteps', () => {
  it('bước cuối là mảng đã sắp xếp', () => {
    const steps = bubbleSortSteps([5, 1, 4, 2, 8])
    expect(valuesOf(steps.at(-1))).toEqual([1, 2, 4, 5, 8])
    expect(steps.at(-1).sorted).toBe(5)
  })

  it('số lần đổi chỗ bằng số cặp nghịch thế', () => {
    // [5, 1, 4, 2, 8] có 4 cặp nghịch thế: (5,1) (5,4) (5,2) (4,2)
    const swaps = bubbleSortSteps([5, 1, 4, 2, 8]).filter((step) => step.swapped)
    expect(swaps).toHaveLength(4)
  })

  it('mảng đã sắp xếp thì không đổi chỗ lần nào', () => {
    expect(bubbleSortSteps([1, 2, 3]).some((step) => step.swapped)).toBe(false)
  })
})
