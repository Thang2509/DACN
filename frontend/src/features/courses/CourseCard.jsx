import { Link } from 'react-router-dom'
import { Badge, Card } from '../../components/ui'
import { formatDuration, formatPrice } from '../../lib/format'
import { LEVEL_OPTIONS } from './api'
import CourseCover from './CourseCover'

// Thẻ khóa học dùng ở trang chủ, danh mục, khóa của tôi, khu giảng viên; children hiện ở cuối thẻ
export default function CourseCard({ course, to = `/courses/${course.slug}`, children }) {
  return (
    <Link to={to} className="block h-full">
      <Card data-tilt className="group flex h-full flex-col overflow-hidden p-0">
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

// Ảnh bìa giảng viên tải lên; chưa có thì vẽ bìa theo lĩnh vực của khóa
export function Thumbnail({ course, className = 'h-36' }) {
  if (course.thumbnail_url) {
    return <img src={course.thumbnail_url} alt="" className={`${className} w-full object-cover`} />
  }
  return <CourseCover course={course} className={className} />
}
