import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import Icon from '../../components/Icons'
import { Button, Card } from '../../components/ui'
import { getPublicStats } from './api'
import HomeHero from './HomeHero'

const FEATURES = [
  { icon: 'blocks', color: 'bg-primary-100 text-primary-700', title: 'Bài học theo từng khối', text: 'Video, văn bản, hoạt ảnh và quiz xen kẽ nhau. Mỗi bài ngắn gọn, học xong là nhớ.' },
  { icon: 'code', color: 'bg-accent-100 text-accent-700', title: 'Code chạy ngay', text: 'Viết SQL và JavaScript ngay trên trình duyệt, xem bảng dữ liệu thay đổi và được chấm tự động.' },
  { icon: 'paw', color: 'bg-green-100 text-success', title: 'Thú cưng 3D lớn lên', text: 'Trứng nở ngay khi nhận; học bài để thú lớn lên, cho ăn, mua trang bị, trang trí phòng và chơi minigame cùng thú.' },
  { icon: 'gift', color: 'bg-amber-100 text-amber-700', title: 'Đổi thưởng thật', text: 'Kiếm XP, xu, huy hiệu, giữ chuỗi ngày học; đổi xu lấy voucher giảm giá khóa học.' },
]

const STEPS = [
  ['Chọn khóa học', 'Lập trình web, cơ sở dữ liệu, thuật toán… từ cơ bản đến nâng cao.'],
  ['Học và làm quiz', 'Đi qua từng phần của bài, trả lời quiz, chạy thử code.'],
  ['Nhận thưởng', 'XP, xu và nhiệm vụ mỗi ngày; thú cưng lớn lên cùng tiến độ học.'],
]

// Trang chủ cho khách; children: các lộ trình học (dùng chung với trang chủ khi đã đăng nhập)
export default function Landing({ children }) {
  const { data: stats } = useQuery({ queryKey: ['public-stats'], queryFn: getPublicStats })

  return (
    <div className="space-y-20">
      <HomeHero
        intro={
          <>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-sm font-semibold">
              <Icon name="sparkle" className="size-4" /> Học lập trình kiểu trò chơi
            </span>
            <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl md:text-6xl">
              Học lập trình mỗi ngày,<br />
              <span className="text-accent-300">nuôi thú cưng lớn lên cùng bạn</span>
            </h1>
            <p className="max-w-lg text-white/80 md:text-lg">
              Bài học ngắn theo từng khối, code chạy ngay trên trình duyệt, nhận XP và xu để đổi voucher.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/register"><Button variant="accent" size="lg">Bắt đầu miễn phí</Button></Link>
              <Link to="/courses"><Button variant="outline" size="lg">Xem khóa học</Button></Link>
            </div>
          </>
        }
        cta={<Link to="/register" className="inline-block"><Button variant="accent">Nhận trứng miễn phí</Button></Link>}
        decor={
          <>
            <FloatingChip className="top-[18%] right-[30%]" delay="0s">+20 XP · Hoàn thành bài</FloatingChip>
            <FloatingChip className="top-[30%] right-[2%]" delay="1.2s">🔥 Chuỗi 7 ngày</FloatingChip>
            <FloatingChip className="bottom-[16%] right-[36%]" delay="2.4s">🏅 Huy hiệu: Về đích</FloatingChip>
          </>
        }
      />

      {stats && (
        <section className="reveal grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            [stats.courses, 'khóa học'],
            [stats.lessons, 'bài học'],
            [stats.students, 'học viên'],
            [stats.species, 'loài thú cưng'],
          ].map(([value, label]) => (
            <Card key={label} data-tilt className="text-center">
              <p className="text-4xl font-extrabold text-primary-700">{value}</p>
              <p className="font-semibold text-muted">{label}</p>
            </Card>
          ))}
        </section>
      )}

      <section className="reveal space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold">Học như chơi, chơi mà học</h2>
          <p className="text-muted">Mọi thứ bạn cần để học lập trình đều đặn mỗi ngày.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <Card key={feature.title} data-tilt className="space-y-3">
              <span className={`grid size-12 place-items-center rounded-2xl ${feature.color}`}>
                <Icon name={feature.icon} />
              </span>
              <h3 className="text-lg font-bold">{feature.title}</h3>
              <p className="text-sm text-muted">{feature.text}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="reveal space-y-6">
        <h2 className="text-center text-3xl font-extrabold">Bắt đầu chỉ với 3 bước</h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {STEPS.map(([title, text], i) => (
            <li key={title} data-tilt className="glass flex gap-4 rounded-2xl p-5">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-600 text-lg font-extrabold text-white">{i + 1}</span>
              <div>
                <p className="font-bold">{title}</p>
                <p className="text-sm text-muted">{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {children}

      <section className="reveal flex flex-col items-center gap-4 rounded-3xl bg-gradient-to-r from-accent-500 to-[#ec4899] p-10 text-center text-white shadow-[0_30px_60px_-30px_rgb(236_72_153/0.7)]">
        <h2 className="text-3xl font-extrabold">Quả trứng đầu tiên đang chờ bạn</h2>
        <p className="max-w-xl text-white/90">Đăng ký miễn phí, chọn một trong ba quả trứng và xem nó nở ngay, rồi học bài để thú lớn lên.</p>
        <Link to="/register"><Button size="lg" variant="outline">Tạo tài khoản miễn phí</Button></Link>
      </section>
    </div>
  )
}

// Thẻ nhỏ bay lơ lửng quanh thú cưng (trang trí)
function FloatingChip({ className, delay, children }) {
  return (
    <span
      className={`glass absolute rounded-2xl px-3 py-2 text-sm font-bold text-ink motion-safe:animate-float ${className}`}
      style={{ animationDelay: delay }}
    >
      {children}
    </span>
  )
}
