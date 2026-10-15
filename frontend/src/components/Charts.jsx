// Biểu đồ đơn giản vẽ bằng SVG/HTML (không dùng thư viện), dùng cho trang thống kê

// Biểu đồ cột theo ngày: data = [{ date: '2026-12-01', value: 3 }, ...]; rê chuột lên cột để xem số
export function BarChart({ data, barClass = 'fill-primary-500', format = (value) => value }) {
  const height = 120
  const step = 12
  const max = Math.max(1, ...data.map((item) => item.value))
  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted">
        <span>Cao nhất {format(max)}</span>
        <span>Tổng {format(total)}</span>
      </div>
      <svg viewBox={`0 0 ${data.length * step} ${height}`} preserveAspectRatio="none" className="h-32 w-full rounded-lg bg-primary-50">
        {data.map((item, i) => {
          const barHeight = (item.value / max) * (height - 6)
          return (
            <rect key={item.date} x={i * step + 2} y={height - barHeight} width={step - 4} height={barHeight} className={barClass}>
              <title>{`${shortDate(item.date)}: ${format(item.value)}`}</title>
            </rect>
          )
        })}
      </svg>
      <div className="flex justify-between text-xs text-muted">
        <span>{shortDate(data[0]?.date)}</span>
        <span>{shortDate(data.at(-1)?.date)}</span>
      </div>
    </div>
  )
}

// Thanh ngang so sánh: items = [{ label, value }]
export function HorizontalBars({ items, unit = '' }) {
  const max = Math.max(1, ...items.map((item) => item.value))
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="space-y-1">
          <div className="flex justify-between gap-3 text-sm">
            <span className="truncate">{item.label}</span>
            <span className="shrink-0 font-semibold">{item.value}{unit}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-primary-100">
            <div className="h-full rounded-full bg-primary-500" style={{ width: `${(item.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}

// Ô số liệu lớn
export function StatCard({ label, value, hint }) {
  return (
    <div className="rounded-2xl bg-card p-5 shadow-card">
      <p className="text-sm font-semibold text-muted">{label}</p>
      <p className="text-3xl font-extrabold">{value}</p>
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  )
}

// '2026-12-07' → '7/12'
function shortDate(date) {
  if (!date) return ''
  const [, month, day] = date.split('-')
  return `${Number(day)}/${Number(month)}`
}
