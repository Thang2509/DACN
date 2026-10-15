import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Badge, Button, Card, PageLoading, ProgressBar } from '../../components/ui'
import { useUser } from '../auth/api'
import { useGamification } from '../gamification/api'
import { getReviews } from '../lesson/api'
import { getEnrolledCourses, getLearningPaths, lessonPath } from './api'
import CourseCard from './CourseCard'
import HomeHero from './HomeHero'
import Landing from './Landing'

// Khách: trang giới thiệu; đã đăng nhập: việc hôm nay, khóa đang học, lộ trình
export default function HomePage() {
  const { user, isLoading } = useUser()
  const { data: paths = [] } = useQuery({ queryKey: ['learning-paths'], queryFn: getLearningPaths })
  const { data: myCourses = [] } = useQuery({ queryKey: ['my-courses'], queryFn: getEnrolledCourses, enabled: !!user })
  const learning = myCourses.filter((course) => course.progress.next_lesson && course.progress.completed < course.progress.total).slice(0, 3)

  const pathSections = paths.map((path) => (
    <section key={path.id} className="reveal space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <Badge color="accent">Lộ trình</Badge>
          <h2 className="mt-1 text-2xl font-extrabold">{path.title}</h2>
          <p className="text-muted">{path.description}</p>
        </div>
        <Link to={`/courses?path=${path.slug}`} className="font-semibold text-primary-600">Xem tất cả →</Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Trang chủ chỉ hiện 3 khóa đầu của lộ trình, xem đủ ở "Xem tất cả" */}
        {path.courses.slice(0, 3).map((course) => <CourseCard key={course.id} course={course} />)}
      </div>
    </section>
  ))

  if (isLoading) return <PageLoading />
  if (!user) return <Landing>{pathSections}</Landing>

  return (
    <div className="space-y-12">
      <HomeHero
        intro={<Greeting name={user.name} />}
        cta={<Link to="/pet" className="inline-block"><Button variant="accent">Gặp thú cưng của bạn</Button></Link>}
      />
      <TodayPanel />

      {learning.length > 0 && (
        <section className="reveal space-y-4">
          <h2 className="text-2xl font-extrabold">Tiếp tục học</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {learning.map((course) => (
              <CourseCard key={course.id} course={course} to={lessonPath(course.slug, course.progress.next_lesson.slug)}>
                <ProgressBar value={course.progress.completed} max={course.progress.total} />
              </CourseCard>
            ))}
          </div>
        </section>
      )}

      {pathSections}
    </div>
  )
}

// Việc hôm nay: kế hoạch học tập, thẻ cần ôn, nhiệm vụ ngày
function TodayPanel() {
  const { data: summary } = useGamification()
  const { data: reviews } = useQuery({ queryKey: ['reviews'], queryFn: getReviews })
  if (!summary) return null

  const { plan } = summary
  const daily = summary.quests.filter((quest) => quest.period === 'daily')
  const dueCards = reviews?.stats.due ?? 0
  const items = [
    {
      title: 'Kế hoạch học tập',
      text: !plan.has_plan
        ? 'Chưa đặt kế hoạch, hãy chọn ngày học trong tuần.'
        : plan.is_study_day
          ? `Hôm nay: ${plan.done_today}/${plan.lessons_per_day} bài${plan.done_today >= plan.lessons_per_day ? ' ✓' : ''}`
          : 'Hôm nay là ngày nghỉ theo kế hoạch.',
      to: '/quests',
      action: plan.has_plan ? 'Xem kế hoạch' : 'Đặt kế hoạch',
    },
    {
      title: 'Ôn tập flashcard',
      text: dueCards ? `${dueCards} thẻ đến hạn hôm nay.` : 'Không còn thẻ nào cần ôn hôm nay.',
      to: '/review',
      action: 'Ôn ngay',
    },
    {
      title: 'Nhiệm vụ hôm nay',
      text: `Đã xong ${daily.filter((quest) => quest.completed).length}/${daily.length} nhiệm vụ.`,
      to: '/quests',
      action: 'Xem nhiệm vụ',
    },
  ]

  return (
    <section className="reveal grid gap-4 md:grid-cols-3">
      {items.map((item) => (
        <Card key={item.title} data-tilt className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-muted">{item.title}</p>
          <p className="flex-1 font-bold">{item.text}</p>
          <Link to={item.to} className="text-sm font-semibold text-primary-600">{item.action} →</Link>
        </Card>
      ))}
    </section>
  )
}

// Phần chữ mở đầu khi đã đăng nhập: lời chào, nút học, thẻ tiến độ hôm nay
function Greeting({ name }) {
  return (
    <>
      <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl md:text-5xl">
        Chào {name.split(' ').at(-1)},<br />
        <span className="text-accent-300">hôm nay học gì nào?</span>
      </h1>
      <p className="max-w-lg text-white/80 md:text-lg">Học thêm một bài để thú cưng no hơn, vui hơn và lớn nhanh hơn.</p>
      <div className="flex flex-wrap gap-3">
        <Link to="/my-courses"><Button variant="accent" size="lg">Học tiếp</Button></Link>
        <Link to="/courses"><Button variant="outline" size="lg">Khám phá khóa học</Button></Link>
      </div>
      <HeroStats />
    </>
  )
}

// Đã đăng nhập: cấp, chuỗi ngày, nhiệm vụ thật của người dùng; khách: thẻ minh họa
function HeroStats() {
  const { data } = useGamification()
  const daily = data?.quests.filter((quest) => quest.period === 'daily') ?? []
  const stats = data
    ? {
        streak: data.streak.current,
        level: data.level,
        xp: data.xp - data.level_start_xp,
        needed: data.next_level_xp - data.level_start_xp,
        questsDone: daily.filter((quest) => quest.completed).length,
        quests: daily.length,
      }
    : { streak: 7, level: 4, xp: 320, needed: 400, questsDone: 2, quests: 3 }

  return (
    // Màn hẹp ẩn thẻ này để không che thú (ngay dưới khối mở đầu đã có "việc hôm nay")
    <Card data-tilt className="hidden max-w-sm space-y-4 text-ink md:block">
      <div className="flex items-center justify-between">
        <span className="font-bold">Hôm nay</span>
        <Badge color="streak">Chuỗi {stats.streak} ngày</Badge>
      </div>
      <ProgressBar label={`Cấp ${stats.level}`} value={stats.xp} max={stats.needed} />
      <ProgressBar label="Nhiệm vụ ngày" value={stats.questsDone} max={stats.quests} color="accent" />
      {!data && (
        <div className="flex gap-2">
          <Badge color="xp">+20 XP</Badge>
          <Badge color="coin">+5 xu</Badge>
        </div>
      )}
    </Card>
  )
}
