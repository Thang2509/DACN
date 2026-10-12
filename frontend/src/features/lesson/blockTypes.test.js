import { describe, expect, it } from 'vitest'
import * as Animations from './Animations'
import { ANIMATIONS, BLOCK_TYPES, youtubeEmbedUrl } from './blockTypes'

describe('ANIMATIONS', () => {
  it('mỗi tên hoạt ảnh trong trình soạn đều có component', () => {
    for (const name of ANIMATIONS) expect(Animations[name]).toBeTypeOf('function')
  })
})

describe('BLOCK_TYPES', () => {
  it('có đủ 6 loại khối như backend', () => {
    expect(Object.keys(BLOCK_TYPES)).toEqual(['markdown', 'video', 'quiz', 'animation', 'code', 'flashcard'])
  })

  it('mỗi lần tạo trả về đối tượng mới, không dùng chung', () => {
    const a = BLOCK_TYPES.quiz.create()
    const b = BLOCK_TYPES.quiz.create()
    a.questions[0].options.push('x')
    expect(b.questions[0].options).toHaveLength(2)
  })
})

describe('youtubeEmbedUrl', () => {
  const embed = 'https://www.youtube.com/embed/dQw4w9WgXcQ'

  it.each([
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://www.youtube.com/watch?list=abc&v=dQw4w9WgXcQ',
    'https://youtu.be/dQw4w9WgXcQ?t=10',
    'https://www.youtube.com/shorts/dQw4w9WgXcQ',
    embed,
  ])('chuyển %s', (url) => {
    expect(youtubeEmbedUrl(url)).toBe(embed)
  })

  it('trả null với link không phải YouTube', () => {
    expect(youtubeEmbedUrl('http://localhost:8000/storage/uploads/a.mp4')).toBeNull()
    expect(youtubeEmbedUrl('')).toBeNull()
  })
})
