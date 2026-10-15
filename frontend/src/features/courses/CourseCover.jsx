import { useId } from 'react'

/**
 * Ảnh bìa vẽ bằng SVG cho khóa học chưa tải ảnh lên: mỗi lĩnh vực một bảng màu, một hình minh họa
 * và một "mẩu code" mờ ở góc; vị trí các hình tròn trang trí đổi theo id để các khóa cùng lĩnh vực không giống hệt nhau.
 */
const THEMES = {
  database: { colors: ['#0ea5e9', '#6366f1'], code: 'SELECT *', art: DatabaseArt },
  frontend: { colors: ['#fb923c', '#ec4899'], code: '</>', art: FrontendArt },
  backend: { colors: ['#10b981', '#0e7490'], code: '{ api }', art: BackendArt },
  programming: { colors: ['#06b6d4', '#3730a3'], code: 'print()', art: ProgrammingArt },
  algorithms: { colors: ['#8b5cf6', '#4c1d95'], code: 'O(n log n)', art: AlgorithmArt },
  devops: { colors: ['#f59e0b', '#ef4444'], code: '$ deploy', art: DevopsArt },
  security: { colors: ['#14b8a6', '#1e293b'], code: '#!secure', art: SecurityArt },
}

// Số giả ngẫu nhiên 0–1 cố định theo id khóa học và số thứ tự
const seeded = (id, n) => {
  const x = Math.sin(id * 97.3 + n * 13.7) * 10000
  return x - Math.floor(x)
}

export default function CourseCover({ course, className = 'h-36' }) {
  const gradientId = useId()
  const theme = THEMES[course.category] ?? THEMES.frontend
  const Art = theme.art

  return (
    <svg viewBox="0 0 320 150" preserveAspectRatio="xMidYMid slice" className={`${className} w-full`} role="img" aria-label={course.title}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={theme.colors[0]} />
          <stop offset="1" stopColor={theme.colors[1]} />
        </linearGradient>
      </defs>
      <rect width="320" height="150" fill={`url(#${gradientId})`} />
      {[0, 1, 2].map((n) => (
        <circle key={n} cx={40 + seeded(course.id, n) * 240} cy={15 + seeded(course.id, n + 3) * 120} r={26 + n * 18} fill="#fff" opacity={0.08} />
      ))}
      <text x="18" y="130" fill="#fff" opacity="0.35" fontFamily="ui-monospace, monospace" fontSize="20" fontWeight="700">
        {theme.code}
      </text>
      <g transform="translate(195 22)" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
        <Art />
      </g>
    </svg>
  )
}

// Các hình minh họa nằm trong ô 100 × 100
function DatabaseArt() {
  return (
    <>
      <ellipse cx="50" cy="15" rx="38" ry="12" fill="#fff" fillOpacity="0.25" />
      <path d="M12 15v60c0 7 17 12 38 12s38-5 38-12V15M12 35c0 7 17 12 38 12s38-5 38-12M12 55c0 7 17 12 38 12s38-5 38-12" />
    </>
  )
}

function FrontendArt() {
  return (
    <>
      <rect x="0" y="5" width="100" height="78" rx="10" fill="#fff" fillOpacity="0.2" />
      <path d="M0 25h100M12 15h1M22 15h1M32 15h1M38 45l-12 12 12 12M62 45l12 12-12 12M55 40l-10 34" />
    </>
  )
}

function BackendArt() {
  return (
    <>
      {[0, 30, 60].map((y) => (
        <g key={y}>
          <rect x="5" y={y} width="90" height="22" rx="6" fill="#fff" fillOpacity="0.2" />
          <path d={`M20 ${y + 11}h1M32 ${y + 11}h1M60 ${y + 11}h22`} />
        </g>
      ))}
    </>
  )
}

// Cửa sổ dòng lệnh có dấu nhắc ">_"
function ProgrammingArt() {
  return (
    <>
      <rect x="0" y="8" width="100" height="76" rx="10" fill="#fff" fillOpacity="0.2" />
      <path d="M18 34l14 12-14 12M42 62h28" />
    </>
  )
}

function AlgorithmArt() {
  const nodes = [[50, 10], [20, 50], [80, 50], [5, 90], [35, 90], [95, 90]]
  return (
    <>
      <path d="M50 10L20 50M50 10L80 50M20 50L5 90M20 50L35 90M80 50L95 90" />
      {nodes.map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="9" fill="#fff" fillOpacity="0.9" stroke="none" />)}
    </>
  )
}

function DevopsArt() {
  return (
    <>
      <path d="M50 50c-12-18-40-18-40 0s28 18 40 0 40-18 40 0-28 18-40 0z" fill="#fff" fillOpacity="0.15" />
      <path d="M80 30l8 8-8 8" />
    </>
  )
}

function SecurityArt() {
  return (
    <>
      <path d="M50 2l40 15v28c0 25-18 42-40 50C28 87 10 70 10 45V17z" fill="#fff" fillOpacity="0.2" />
      <rect x="34" y="44" width="32" height="26" rx="5" />
      <path d="M40 44v-8a10 10 0 0120 0v8" />
    </>
  )
}
