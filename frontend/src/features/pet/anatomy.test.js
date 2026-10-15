import { describe, expect, it } from 'vitest'
import { BREEDS, buildBody, skeletonOf } from './anatomy'

// Bước lưới thô để kiểm thử nhanh (ứng dụng dùng bước mịn hơn trong Web Worker)
const COARSE = 0.02

describe('bộ xương', () => {
  it.each(Object.keys(BREEDS))('%s: đủ xương, xương cha luôn đứng trước xương con', (code) => {
    const { bones } = skeletonOf(code)
    const names = bones.map((bone) => bone.name)
    for (const name of ['root', 'hips', 'spine', 'chest', 'neck1', 'neck2', 'head', 'jaw', 'earL', 'earR', 'tail1', 'FL4', 'HR4']) {
      expect(names).toContain(name)
    }
    bones.forEach((bone, i) => expect(bone.parent).toBeLessThan(i))
  })

  it('tỉ lệ như thật: Capybara cao hơn Corgi, mèo nhỏ hơn chó, hamster nhỏ nhất; thú con đầu to, chân ngắn', () => {
    expect(BREEDS.capybara.withers).toBeGreaterThan(BREEDS.corgi.withers)
    expect(BREEDS.tabby.withers).toBeLessThan(BREEDS.shiba.withers)
    expect(Math.min(...Object.values(BREEDS).map((breed) => breed.withers))).toBeLessThan(BREEDS.rabbit.withers)
    expect(BREEDS.rabbit.rump).toBeGreaterThan(BREEDS.rabbit.withers) // thỏ lưng gù, mông cao hơn vai
    const adult = skeletonOf('shiba', 0)
    const puppy = skeletonOf('shiba', 1)
    expect(puppy.breed.head.width).toBeGreaterThan(adult.breed.head.width)
    expect(puppy.breed.withers).toBeLessThan(adult.breed.withers)
    expect(puppy.breed.head.muzzle).toBeLessThan(adult.breed.head.muzzle)
  })
})

describe('buildBody', () => {
  it.each(['shiba', 'tabby', 'rabbit', 'hedgehog'])('%s: lưới có trọng số xương chuẩn hóa, bàn chân chạm sàn, có tai và mũi', (code) => {
    const body = buildBody(code, 0, COARSE)
    const { positions, skinIndex, skinWeight, colors, furLength, indices } = body.mesh
    const count = positions.length / 3
    expect(count).toBeGreaterThan(1000)
    expect(indices.length % 3).toBe(0)
    let lowest = Infinity
    for (let v = 0; v < count; v++) {
      lowest = Math.min(lowest, positions[v * 3 + 1])
      const sum = skinWeight[v * 4] + skinWeight[v * 4 + 1] + skinWeight[v * 4 + 2] + skinWeight[v * 4 + 3]
      expect(sum).toBeCloseTo(1, 3)
      for (let k = 0; k < 4; k++) expect(skinIndex[v * 4 + k]).toBeLessThan(body.bones.length)
      expect(furLength[v]).toBeGreaterThanOrEqual(0)
    }
    expect(Math.abs(lowest)).toBeLessThan(0.02)
    for (const value of colors) expect(value).toBeGreaterThanOrEqual(0)
    // Đỉnh của tai gắn hoàn toàn vào xương tai
    const ear = body.boneIndex.earL
    expect(Array.from({ length: count }, (_, v) => skinIndex[v * 4] === ear && skinWeight[v * 4] === 1).some(Boolean)).toBe(true)
    expect(body.nose.positions.length).toBeGreaterThan(0)
  })

  it('chỉ nhím có gai (lông cứng) ở lưng, bụng vẫn là lông mềm', () => {
    const hedgehog = buildBody('hedgehog', 0, COARSE)
    const { furStiff, normals } = hedgehog.mesh
    const count = furStiff.length
    const back = Array.from({ length: count }, (_, v) => v).filter((v) => normals[v * 3 + 1] > 0.8)
    const belly = Array.from({ length: count }, (_, v) => v).filter((v) => normals[v * 3 + 1] < -0.8)
    expect(back.filter((v) => furStiff[v] > 0.5).length / back.length).toBeGreaterThan(0.5)
    expect(belly.every((v) => furStiff[v] < 0.1)).toBe(true)
    expect(buildBody('rabbit', 0, COARSE).mesh.furStiff.every((value) => value === 0)).toBe(true)
  }, 20000) // dựng 2 con thú, máy chậm có thể quá 5 giây mặc định
})
