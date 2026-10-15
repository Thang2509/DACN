import { useEffect } from 'react'

/**
 * Thẻ có thuộc tính data-tilt nghiêng theo vị trí chuột trên thẻ (--tilt-x, --tilt-y) và có vệt sáng tại con trỏ
 * (--glare-x, --glare-y); kiểu nằm ở index.css. Chỉ khi dùng chuột, tắt khi người dùng chọn giảm chuyển động.
 */
export default function useDepthEffects() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let card = null

    const release = () => {
      for (const name of ['--tilt-x', '--tilt-y']) card?.style.removeProperty(name)
      card = null
    }
    const move = (event) => {
      if (event.pointerType !== 'mouse') return
      const next = event.target.closest?.('[data-tilt]') ?? null
      if (next !== card) release()
      card = next
      if (!card) return
      const rect = card.getBoundingClientRect()
      const x = (event.clientX - rect.left) / rect.width
      const y = (event.clientY - rect.top) / rect.height
      card.style.setProperty('--tilt-x', `${((0.5 - y) * 8).toFixed(2)}deg`)
      card.style.setProperty('--tilt-y', `${((x - 0.5) * 10).toFixed(2)}deg`)
      card.style.setProperty('--glare-x', `${(x * 100).toFixed(1)}%`)
      card.style.setProperty('--glare-y', `${(y * 100).toFixed(1)}%`)
    }

    window.addEventListener('pointermove', move, { passive: true })
    document.documentElement.addEventListener('pointerleave', release)
    return () => {
      window.removeEventListener('pointermove', move)
      document.documentElement.removeEventListener('pointerleave', release)
      release()
    }
  }, [])
}
