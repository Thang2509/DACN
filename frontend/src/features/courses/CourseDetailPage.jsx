import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Alert, Avatar, Badge, Button, Card, ProgressBar } from '../../components/ui'
import { fieldError } from '../../lib/api'
import { formatDuration, formatPrice } from '../../lib/format'
import { useUser } from '../auth/api'
import { CATEGORY_OPTIONS, enrollCourse, getCourseDetail, lessonPath, LEVEL_OPTIONS } from './api'
import { Thumbnail } from './CourseCard'

export default function CourseDetailPage() {
  const { slug } = useParams()
  const { data: course, isLoading, error } = useQuery({
    queryKey: ['course-detail', slug],
    queryFn: () => getCourseDetail(slug),
    retry: false,
  })

  if (isLoading) return <p className="text-muted">Đang tải…</p>
  if (error) return <Alert tone="danger">{error.status === 404 ? 'Không tìm thấy khóa học.' : error.message}</Alert>

  const lessons = course.chapters.flatMap((chapter) => chapter.lessons)
  const firstPreview = lessons.find((lesson) => lesson.is_preview)

  return (
    <div className="space-y-8">
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge color="accent">{CATEGORY_OPTIONS[course.category]}</Badge>
            <Badge>{LEVEL_OPTIONS[course.level]}</Badge>
            <Badge color={course.price ? 'accent' : 'success'}>{formatPrice(course.price)}</Badge>
          </div>
          <h1 className="text-4xl font-extrabold">{course.title}</h1>
          <p className="text-lg text-muted">{course.summary}</p>
          <div className="flex items-center gap-3">
            <Avatar user={course.instructor} />
            <div>
              <p className="font-semibold">{course.instructor.name}</p>
              <p className="text-sm text-muted">
                {course.lessons_count} bài học · {formatDuration(course.lessons_sum_duration_minutes)} · {course.enrollments_count} học viên
              </p>
            </div>
          </div>
        </div>

        <Card className="space-y-4 overflow-hidden p-0">
          <Thumbnail course={course} className="h-40" />
          <div className="space-y-3 px-5 pb-5">
            <EnrollBox course={course} firstPreview={firstPreview} />
          </div>
        </Card>
      </div>

      {course.description && (
        <Card className="space-y-2">
          <h2 className="text-xl font-bold">Giới thiệu</h2>
          <p className="whitespace-pre-line leading-relaxed">{course.description}</p>
        </Card>
      )}

      <Card className="space-y-4">
        <h2 className="text-xl font-bold">Nội dung khóa học</h2>
        {course.chapters.map((chapter, c) => (
          <div key={chapter.id} className="rounded-2xl border-2 border-primary-100">
            <p className="bg-primary-50 px-4 py-2 font-bold text-primary-700">Chương {c + 1}. {chapter.title}</p>
            <ul className="divide-y divide-primary-50">
              {chapter.lessons.map((lesson) => {
                const open = course.enrolled || lesson.is_preview
                return (
                  <li key={lesson.id} className="flex items-center gap-3 px-4 py-2.5">
                    <span className={lesson.completed ? 'text-success' : 'text-muted'}>{lesson.completed ? '✓' : open ? '▶' : '🔒'}</span>
                    {open ? <Link to={lessonPath(course.slug, lesson.slug)} className="flex-1 hover:text-primary-600">{lesson.title}</Link> : <span className="flex-1 text-muted">{lesson.title}</span>}
                    <span className="text-xs text-muted">{formatDuration(lesson.duration_minutes)}</span>
                    {lesson.is_preview && !course.enrolled && <Badge color="success">Học thử</Badge>}
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </Card>
    </div>
  )
}

// Hộp hành động: học tiếp / đăng ký miễn phí / mua (sắp có) / học thử
function EnrollBox({ course, firstPreview }) {
  const { user } = useUser()
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const enroll = useMutation({
    mutationFn: () => enrollCourse(course.id),
    onSuccess: ({ progress }) => {
      queryClient.invalidateQueries({ queryKey: ['course-detail'] })
      queryClient.invalidateQueries({ queryKey: ['my-courses'] })
      if (progress.next_lesson) navigate(lessonPath(course.slug, progress.next_lesson.slug))
    },
  })

  if (course.enrolled && course.progress.next_lesson) {
    const { completed, total, next_lesson: nextLesson } = course.progress
    return (
      <>
        <ProgressBar label="Tiến độ" value={completed} max={total} />
        <Link to={lessonPath(course.slug, nextLesson.slug)}><Button className="w-full">{completed === 0 ? 'Bắt đầu học' : completed === total ? 'Ôn lại' : 'Học tiếp'}</Button></Link>
      </>
    )
  }

  const previewButton = firstPreview && (
    <Link to={lessonPath(course.slug, firstPreview.slug)}><Button variant="outline" className="w-full">Học thử miễn phí</Button></Link>
  )

  if (course.price > 0) {
    return (
      <>
        <p className="text-2xl font-extrabold text-accent-600">{formatPrice(course.price)}</p>
        <Button className="w-full" disabled>Mua khóa học (sắp có)</Button>
        {previewButton}
      </>
    )
  }

  if (!user) {
    return (
      <Link to={`/login?redirect=${encodeURIComponent(location.pathname)}`}><Button className="w-full">Đăng nhập để học</Button></Link>
    )
  }

  return (
    <>
      <Button className="w-full" onClick={() => enroll.mutate()} disabled={enroll.isPending}>Đăng ký học miễn phí</Button>
      {enroll.error && (
        <Alert tone="danger">{enroll.error.status === 403 ? 'Hãy xác thực email trước khi đăng ký khóa học.' : fieldError(enroll.error, 'course') ?? enroll.error.message}</Alert>
      )}
    </>
  )
}
