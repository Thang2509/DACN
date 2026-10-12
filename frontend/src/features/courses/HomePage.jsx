import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Badge, Button, Card, ProgressBar } from '../../components/ui'
import { useUser } from '../auth/api'
import { getEnrolledCourses, getLearningPaths } from './api'
import CourseCard from './CourseCard'

export default function HomePage() {
  const { user } = useUser()
  const { data: paths = [] } = useQuery({ queryKey: ['learning-paths'], queryFn: getLearningPaths })
  const { data: myCourses = [] } = useQuery({ queryKey: ['my-courses'], queryFn: getEnrolledCourses, enabled: !!user })
  const learning = myCourses.filter((course) => course.progress.completed < course.progress.total).slice(0, 3)

  return (
    <div className="space-y-12">
      <Hero />

      {learning.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-extrabold">Tiếp tục học</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {learning.map((course) => (
              <CourseCard key={course.id} course={course} to={`/learn/${course.progress.next_lesson_id}`}>
                <ProgressBar value={course.progress.completed} max={course.progress.total} />
              </CourseCard>
            ))}
          </div>
        </section>
      )}

      {paths.map((path) => (
        <section key={path.id} className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <Badge color="accent">Lộ trình</Badge>
              <h2 className="mt-1 text-2xl font-extrabold">{path.title}</h2>
              <p className="text-muted">{path.description}</p>
            </div>
            <Link to={`/courses?path=${path.slug}`} className="font-semibold text-primary-600">Xem tất cả →</Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {path.courses.map((course) => <CourseCard key={course.id} course={course} />)}
          </div>
        </section>
      ))}
    </div>
  )
}

function Hero() {
  return (
    <section className="grid items-center gap-8 rounded-3xl bg-gradient-to-br from-primary-600 to-primary-800 p-8 text-white md:grid-cols-[1.3fr_1fr] md:p-12">
      <div className="space-y-5">
        <h1 className="text-4xl font-extrabold leading-tight md:text-5xl">
          Học lập trình mỗi ngày,<br />
          <span className="text-accent-300">nuôi thú cưng lớn lên cùng bạn</span>
        </h1>
        <p className="text-lg text-primary-100">
          Bài học ngắn theo từng khối, code chạy ngay trên trình duyệt, nhận XP và xu để đổi voucher.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link to="/courses"><Button variant="accent" size="lg">Khám phá khóa học</Button></Link>
          <Link to="/pet"><Button variant="outline" size="lg">Gặp thú cưng</Button></Link>
        </div>
      </div>

      {/* Thẻ minh họa phần thưởng */}
      <Card className="space-y-4 text-ink">
        <div className="flex items-center justify-between">
          <span className="font-bold">Hôm nay</span>
          <Badge color="streak">Chuỗi 7 ngày</Badge>
        </div>
        <ProgressBar label="Cấp 4" value={320} max={500} />
        <ProgressBar label="Nhiệm vụ ngày" value={2} max={3} color="accent" />
        <div className="flex gap-2">
          <Badge color="xp">+20 XP</Badge>
          <Badge color="coin">+5 xu</Badge>
        </div>
      </Card>
    </section>
  )
}
