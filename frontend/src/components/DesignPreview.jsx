import { lazy, Suspense, useState } from 'react'
import { PET_STATES, SPECIES } from '../features/pet/petStates'
import { Badge, Button, Card, Input, ProgressBar, Skeleton } from './ui'

const PetGallery = lazy(() => import('../features/pet/PetScene').then((module) => ({ default: module.PetGallery })))

// Trang xem nhanh design system (màu, chữ, component) trong lúc phát triển
const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]
const GAME_COLORS = ['xp', 'coin', 'streak', 'success', 'danger', 'ink', 'muted']

export default function DesignPreview() {
  const [petState, setPetState] = useState('idle')
  const [petFocus, setPetFocus] = useState(null)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-extrabold">Design system</h1>
        <p className="mt-2 text-muted">Tím indigo cho thương hiệu, cam để nhấn hành động và phần thưởng.</p>
      </div>

      <Section title="Thú cưng (dựng bằng code)">
        <div className="flex flex-wrap gap-2">
          {Object.entries(PET_STATES).map(([key, { label }]) => (
            <Button key={key} size="sm" variant={petState === key ? 'primary' : 'outline'} onClick={() => setPetState(key)}>
              {label}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {[null, ...Object.keys(SPECIES)].map((code) => (
            <Button key={code ?? 'all'} size="sm" variant={petFocus === code ? 'accent' : 'ghost'} onClick={() => setPetFocus(code)}>
              {code ?? 'Tất cả'}
            </Button>
          ))}
        </div>
        <div className="h-96 overflow-hidden rounded-2xl">
          <Suspense fallback={<Skeleton className="h-96" />}>
            <PetGallery state={petState} focus={petFocus} />
          </Suspense>
        </div>
      </Section>

      <Section title="Màu sắc">
        <Palette name="primary" />
        <Palette name="accent" />
        <div className="flex flex-wrap gap-3">
          {GAME_COLORS.map((c) => (
            <div key={c} className="text-center text-xs font-semibold">
              <div className="size-14 rounded-xl" style={{ background: `var(--color-${c})` }} />
              {c}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Chữ (Be Vietnam Pro)">
        <p className="text-4xl font-extrabold">Tiêu đề lớn – Học lập trình</p>
        <p className="text-2xl font-bold">Tiêu đề mục – Cấu trúc dữ liệu</p>
        <p className="text-lg font-semibold">Tiêu đề nhỏ – Bài 3: Mảng và vòng lặp</p>
        <p>Nội dung thường: mỗi bài học là chuỗi khối nội dung gồm văn bản, video, quiz và code.</p>
        <p className="text-sm text-muted">Chú thích: cập nhật 5 phút trước</p>
      </Section>

      <Section title="Nút">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Học tiếp</Button>
          <Button variant="accent">Nhận thưởng</Button>
          <Button variant="outline">Xem chi tiết</Button>
          <Button variant="ghost">Bỏ qua</Button>
          <Button size="sm">Nhỏ</Button>
          <Button size="lg">Lớn</Button>
          <Button disabled>Đã khóa</Button>
        </div>
      </Section>

      <Section title="Huy hiệu & tiến độ">
        <div className="flex flex-wrap gap-2">
          <Badge color="xp">+50 XP</Badge>
          <Badge color="coin">120 xu</Badge>
          <Badge color="streak">Chuỗi 7 ngày</Badge>
          <Badge color="success">Hoàn thành</Badge>
          <Badge color="danger">Hết hạn</Badge>
          <Badge>Beginner</Badge>
          <Badge color="accent">Advanced</Badge>
        </div>
        <ProgressBar label="Cấp 4" value={320} max={500} />
        <ProgressBar label="Nhiệm vụ ngày" value={2} max={3} color="accent" />
      </Section>

      <Section title="Thẻ & ô nhập">
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="space-y-3 border-2 border-primary-100">
            <div className="flex gap-2">
              <Badge>Beginner</Badge>
              <Badge color="coin">Miễn phí</Badge>
            </div>
            <h3 className="text-xl font-bold">SQL cơ bản</h3>
            <p className="text-muted">10 bài · Thực hành truy vấn ngay trên trình duyệt</p>
            <ProgressBar value={4} max={10} />
          </Card>
          <Card className="space-y-4 border-2 border-primary-100">
            <Input label="Email" placeholder="ban@vidu.com" />
            <Input label="Mật khẩu" type="password" error="Mật khẩu tối thiểu 8 ký tự" />
          </Card>
        </div>
      </Section>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <Card className="space-y-4">
      <h2 className="text-lg font-bold text-primary-700">{title}</h2>
      {children}
    </Card>
  )
}

function Palette({ name }) {
  return (
    <div className="flex flex-wrap gap-1">
      {SHADES.map((shade) => (
        <div key={shade} className="w-16 text-center text-xs">
          <div className="h-12 rounded-lg" style={{ background: `var(--color-${name}-${shade})` }} />
          {name}-{shade}
        </div>
      ))}
    </div>
  )
}
