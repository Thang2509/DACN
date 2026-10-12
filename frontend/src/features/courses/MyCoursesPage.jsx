import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Badge, Button, Card, ProgressBar } from '../../components/ui'
import { getEnrolledCourses, lessonPath } from './api'
import CourseCard from './CourseCard'

export default function MyCoursesPage() {
  const { data: courses = [], isLoading } = useQuery({ queryKey: ['my-courses'], queryFn: getEnrolledCourses })

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold">Khóa học của tôi</h1>
      {isLoading && <p className="text-muted">Đang tải…</p>}
      {!isLoading && courses.length === 0 && (
        <Card className="space-y-3 text-center">
          <p className="text-muted">Bạn chưa đăng ký khóa học nào.</p>
          <Link to="/courses"><Button>Khám phá khóa học</Button></Link>
        </Card>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => {
          const { completed, total, next_lesson: nextLesson } = course.progress
          return (
            <CourseCard key={course.id} course={course} to={nextLesson ? lessonPath(course.slug, nextLesson.slug) : `/courses/${course.slug}`}>
              <ProgressBar value={completed} max={total} />
              {completed === total && <Badge color="success">Đã hoàn thành</Badge>}
            </CourseCard>
          )
        })}
      </div>
    </div>
  )
}
