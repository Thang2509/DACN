import { describe, expect, it } from 'vitest'
import { moveItem, moveLesson } from './reorder'

describe('moveItem', () => {
  it('chuyển phần tử sang vị trí mới', () => {
    expect(moveItem(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a'])
    expect(moveItem(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b'])
  })

  it('giữ nguyên khi vị trí đích nằm ngoài mảng', () => {
    const list = ['a', 'b']
    expect(moveItem(list, 0, -1)).toBe(list)
    expect(moveItem(list, 1, 2)).toBe(list)
  })
})

describe('moveLesson', () => {
  const chapters = [
    { id: 1, lessons: [{ id: 10 }, { id: 11 }] },
    { id: 2, lessons: [{ id: 20 }] },
  ]
  const ids = (result) => result.map((chapter) => chapter.lessons.map((lesson) => lesson.id))

  it('đổi chỗ trong cùng chương', () => {
    expect(ids(moveLesson(chapters, 11, -1))).toEqual([[11, 10], [20]])
  })

  it('xuống khi ở cuối chương thì sang đầu chương sau', () => {
    expect(ids(moveLesson(chapters, 11, 1))).toEqual([[10], [11, 20]])
  })

  it('lên khi ở đầu chương thì sang cuối chương trước', () => {
    expect(ids(moveLesson(chapters, 20, -1))).toEqual([[10, 11, 20], []])
  })

  it('giữ nguyên ở đầu khóa hoặc cuối khóa', () => {
    expect(moveLesson(chapters, 10, -1)).toBe(chapters)
    expect(moveLesson(chapters, 20, 1)).toBe(chapters)
  })
})
