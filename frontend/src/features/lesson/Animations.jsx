import { useEffect, useMemo, useState } from 'react'
import { Button } from '../../components/ui'
import { bubbleSortSteps } from './animationSteps'

// Hoạt ảnh tương tác bằng SVG + CSS. Tên component phải khớp ANIMATIONS trong blockTypes.js

const COLORS = {
  normal: 'var(--color-primary-400)',
  active: 'var(--color-accent-400)',
  done: 'var(--color-success)',
}

const MAX_STACK = 6

// Ngăn xếp: push thêm vào đỉnh, pop lấy ra từ đỉnh (LIFO)
export function StackAnimation({ values = [3, 7, 1] }) {
  const [items, setItems] = useState(() => values.map((value, id) => ({ id, value })))
  const [nextId, setNextId] = useState(values.length)
  const [message, setMessage] = useState('Bấm push để thêm phần tử vào đỉnh ngăn xếp.')

  const push = () => {
    const value = Math.floor(Math.random() * 9) + 1
    setItems([...items, { id: nextId, value }])
    setNextId(nextId + 1)
    setMessage(`push(${value}): ${value} được đặt lên đỉnh.`)
  }
  const pop = () => {
    const top = items.at(-1)
    setItems(items.slice(0, -1))
    setMessage(`pop() → ${top.value}: phần tử vào sau cùng được lấy ra trước.`)
  }

  return (
    <div className="space-y-3">
      <svg viewBox="0 0 320 310" className="mx-auto w-full max-w-xs" role="img" aria-label="Ngăn xếp">
        <path d="M100 20 V296 H220 V20" fill="none" style={{ stroke: 'var(--color-primary-200)' }} strokeWidth="5" strokeLinecap="round" />
        {items.map((item, i) => (
          <g key={item.id} transform={`translate(0 ${-i * 44})`}>
            <g className="animate-drop">
              <rect x="110" y="250" width="100" height="38" rx="8" style={{ fill: i === items.length - 1 ? COLORS.active : COLORS.normal }} />
              <text x="160" y="275" textAnchor="middle" fill="white" fontWeight="700" fontSize="18">{item.value}</text>
            </g>
          </g>
        ))}
        {items.length > 0 && (
          <text x="228" y={275 - (items.length - 1) * 44} fontSize="14" fontWeight="700" style={{ fill: 'var(--color-accent-600)' }}>
            ← đỉnh
          </text>
        )}
      </svg>
      <p className="text-center text-sm text-muted">{message}</p>
      <div className="flex justify-center gap-2">
        <Button size="sm" onClick={push} disabled={items.length >= MAX_STACK}>push</Button>
        <Button size="sm" variant="accent" onClick={pop} disabled={items.length === 0}>pop</Button>
      </div>
    </div>
  )
}

// Sắp xếp nổi bọt: xem từng bước so sánh và đổi chỗ
export function BubbleSortAnimation({ values = [5, 1, 4, 2, 8] }) {
  const steps = useMemo(() => bubbleSortSteps(values), [values])
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const step = steps[index]
  const atEnd = index === steps.length - 1
  const isPlaying = playing && !atEnd
  const max = Math.max(...values)

  useEffect(() => {
    if (!isPlaying) return
    const timer = setTimeout(() => setIndex((i) => i + 1), 800)
    return () => clearTimeout(timer)
  }, [isPlaying, index])

  const reset = () => {
    setIndex(0)
    setPlaying(false)
  }

  // Vẽ theo thứ tự id cố định, chỉ đổi vị trí x, để CSS transition tạo hiệu ứng trượt khi đổi chỗ
  const positionOf = (id) => step.items.findIndex((item) => item.id === id)
  const colorOf = (position) => {
    if (position >= values.length - step.sorted) return COLORS.done
    if (step.compare?.includes(position)) return COLORS.active
    return COLORS.normal
  }

  return (
    <div className="space-y-3">
      <svg viewBox={`0 0 ${values.length * 56 + 8} 220`} className="mx-auto w-full max-w-md" role="img" aria-label="Sắp xếp nổi bọt">
        {steps[0].items.map((item) => {
          const position = positionOf(item.id)
          const height = 30 + (item.value / max) * 150
          return (
            <g key={item.id} style={{ transform: `translateX(${8 + position * 56}px)`, transition: 'transform 0.45s ease' }}>
              <rect x="0" y={190 - height} width="44" height={height} rx="8" style={{ fill: colorOf(position), transition: 'fill 0.3s' }} />
              <text x="22" y="210" textAnchor="middle" fontWeight="700" style={{ fill: 'var(--color-ink)' }}>{item.value}</text>
            </g>
          )
        })}
      </svg>
      <p className="text-center text-sm font-semibold">{step.message}</p>
      <p className="text-center text-xs text-muted">Bước {index + 1}/{steps.length}</p>
      <div className="flex flex-wrap justify-center gap-2">
        <Button size="sm" variant="outline" onClick={() => setIndex(index - 1)} disabled={index === 0 || isPlaying}>← Trước</Button>
        <Button size="sm" onClick={() => setPlaying(!isPlaying)} disabled={atEnd}>{isPlaying ? 'Tạm dừng' : 'Tự chạy'}</Button>
        <Button size="sm" variant="outline" onClick={() => setIndex(index + 1)} disabled={atEnd || isPlaying}>Tiếp →</Button>
        <Button size="sm" variant="ghost" onClick={reset}>Làm lại</Button>
      </div>
    </div>
  )
}
