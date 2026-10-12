import { describe, expect, it } from 'vitest'
import { formatValue } from './sandboxWorker'
import { sameRows } from './runCode'

describe('formatValue', () => {
  it('in giống Node.js', () => {
    expect(formatValue('Shiba')).toBe('Shiba')
    expect(formatValue(42)).toBe('42')
    expect(formatValue([2, 4, 6])).toBe('[ 2, 4, 6 ]')
    expect(formatValue([])).toBe('[]')
    expect(formatValue({ name: 'An', tags: ['a'] })).toBe("{ name: 'An', tags: [ 'a' ] }")
    expect(formatValue(null)).toBe('null')
    expect(formatValue(undefined)).toBe('undefined')
  })
})

describe('sameRows', () => {
  const rows = [[1, 'An'], [2, 'Bình']]
  const reversed = [[2, 'Bình'], [1, 'An']]

  it('không có ORDER BY thì bỏ qua thứ tự dòng', () => {
    expect(sameRows(reversed, rows, false)).toBe(true)
  })

  it('có ORDER BY thì thứ tự phải khớp', () => {
    expect(sameRows(reversed, rows, true)).toBe(false)
    expect(sameRows(rows, rows, true)).toBe(true)
  })

  it('khác giá trị thì sai', () => {
    expect(sameRows([[1, 'An']], rows, false)).toBe(false)
  })
})
