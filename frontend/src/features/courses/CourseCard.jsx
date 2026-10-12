import { Link } from 'react-router-dom'
import { Badge, Card } from '../../components/ui'
import { formatDuration, formatPrice } from '../../lib/format'
import { LEVEL_OPTIONS } from './api'

// Thẻ khóa học dùng ở trang chủ, danh mục, khóa của tôi, khu giảng viên; children hiện ở cuối thẻ
export default function CourseCard({ course, to = `/courses/${course.slug}`, children }) {
  return (
    <Link to={to} className="block h-full">
      <Card className="flex h-full flex-col overflow-hidden p-0 transition hover:-translate-y-0.5">
        <Thumbnail course={course} />
        <div className="flex flex-1 flex-col gap-2 p-5">
          <div className="flex flex-wrap gap-2">
            <Badge>{LEVEL_OPTIONS[course.level]}</Badge>
            <Badge color={course.price ? 'accent' : 'success'}>{formatPrice(course.price)}</Badge>
          </div>
          <h3 className="text-lg font-bold">{course.title}</h3>
          {course.summary && <p className="line-clamp-2 text-sm text-muted">{course.summary}</p>}
          <p className="mt-auto pt-1 text-xs text-muted">
            {[
              course.instructor?.name,
              course.lessons_count != null && `${course.lessons_count} bài`,
              formatDuration(course.lessons_sum_duration_minutes),
            ].filter(Boolean).join(' · ')}
          </p>
          {children}
        </div>
      </Card>
    </Link>
  )
}

export function Thumbnail({ course, className = 'h-36' }) {
  if (course.thumbnail_url) {
    return <img src={course.thumbnail_url} alt="" className={`${className} w-full object-cover`} />
  }
  return (
    <div className={`${className} grid place-items-center bg-gradient-to-br from-primary-500 to-accent-400 text-4xl font-extrabold text-white`}>
      {course.title.charAt(0)}
    </div>
  )
}
