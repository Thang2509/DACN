import { describe, expect, it } from 'vitest'
import { formatValue } from './sandboxWorker'
import { diffTables, sameRows } from './runCode'

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

describe('diffTables', () => {
  const table = (name, rows, total = rows.length) => ({ name, columns: [], rows, total })
  const before = [table('students', [{ rowid: 1, values: [1, 'An'] }, { rowid: 2, values: [2, 'Bình'] }, { rowid: 3, values: [3, 'Chi'] }])]

  it('đánh dấu dòng thêm, dòng sửa và đếm dòng xóa', () => {
    const after = [table('students', [
      { rowid: 1, values: [1, 'An'] },
      { rowid: 2, values: [2, 'Bình Minh'] },
      { rowid: 4, values: [4, 'Dũng'] },
    ])]
    const [students] = diffTables(before, after)
    expect(students.rows.map((row) => row.status)).toEqual([null, 'updated', 'inserted'])
    expect(students.deleted).toBe(1) // dòng 3 (Chi) bị xóa
  })

  it('bảng mới tạo thì mọi dòng là thêm mới', () => {
    const [, scores] = diffTables(before, [before[0], table('scores', [{ rowid: 1, values: [9] }])])
    expect(scores.isNew).toBe(true)
    expect(scores.rows[0].status).toBe('inserted')
  })

  it('không đổi gì thì không đánh dấu', () => {
    const [students] = diffTables(before, before)
    expect(students.rows.every((row) => row.status === null)).toBe(true)
    expect(students.deleted).toBe(0)
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
