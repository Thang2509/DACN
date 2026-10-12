import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { MODEL_URL, PET_STATES } from './petStates'

// Đọc tên các clip từ phần JSON của file .glb (header 12 byte + header chunk 8 byte)
function readClipNames(path) {
  const buffer = readFileSync(path)
  const jsonLength = buffer.readUInt32LE(12)
  const gltf = JSON.parse(buffer.subarray(20, 20 + jsonLength).toString('utf8'))
  return gltf.animations.map((animation) => animation.name)
}

describe('PET_STATES', () => {
  const clips = readClipNames(`public${MODEL_URL}`)

  it('có đủ 8 trạng thái theo yêu cầu', () => {
    expect(Object.keys(PET_STATES)).toEqual(['idle', 'walk', 'run', 'jump', 'eat', 'sleep', 'happy', 'sad'])
  })

  it.each(Object.entries(PET_STATES))('trạng thái %s dùng clip có trong mô hình', (_, { clip }) => {
    expect(clips).toContain(clip)
  })

  it('trạng thái kế tiếp luôn hợp lệ', () => {
    for (const { next } of Object.values(PET_STATES)) {
      if (next) expect(PET_STATES).toHaveProperty(next)
    }
  })
})
