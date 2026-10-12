import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import CourseStatusBadge from '../../components/CourseStatusBadge'
import { Button, Card, Input, Select } from '../../components/ui'
import { fieldError } from '../../lib/api'
import { formatPrice } from '../../lib/format'
import { useForm } from '../../lib/useForm'
import { createCourse, getMyCourses, LEVEL_OPTIONS } from './api'

export default function InstructorCoursesPage() {
  const { data: courses = [], isLoading } = useQuery({ queryKey: ['instructor-courses'], queryFn: getMyCourses })
  const [creating, setCreating] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Khóa học của tôi</h1>
          <p className="text-muted">Soạn nội dung, gửi duyệt và theo dõi trạng thái khóa học.</p>
        </div>
        {!creating && <Button onClick={() => setCreating(true)}>+ Tạo khóa học</Button>}
      </div>

      {creating && <NewCourseForm onCancel={() => setCreating(false)} />}

      {isLoading && <p className="text-muted">Đang tải…</p>}
      {!isLoading && courses.length === 0 && <Card className="text-center text-muted">Bạn chưa có khóa học nào.</Card>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => <CourseCard key={course.id} course={course} />)}
      </div>
    </div>
  )
}

function NewCourseForm({ onCancel }) {
  const navigate = useNavigate()
  const { values, bind } = useForm({ title: '', level: 'beginner', price: 0 })
  const mutation = useMutation({
    mutationFn: createCourse,
    onSuccess: (course) => navigate(`/instructor/courses/${course.id}`),
  })
  const submit = (e) => {
    e.preventDefault()
    mutation.mutate({ ...values, price: Number(values.price) })
  }

  return (
    <Card>
      <form className="grid gap-4 md:grid-cols-[2fr_1fr_1fr_auto] md:items-end" onSubmit={submit}>
        <Input label="Tên khóa học" autoFocus {...bind('title')} error={fieldError(mutation.error, 'title')} />
        <Select label="Cấp độ" options={LEVEL_OPTIONS} {...bind('level')} />
        <Input label="Giá (VND)" type="number" min="0" step="1000" {...bind('price')} error={fieldError(mutation.error, 'price')} />
        <div className="flex gap-2">
          <Button disabled={mutation.isPending}>Tạo</Button>
          <Button type="button" variant="ghost" onClick={onCancel}>Hủy</Button>
        </div>
      </form>
    </Card>
  )
}

function CourseCard({ course }) {
  return (
    <Link to={`/instructor/courses/${course.id}`}>
      <Card className="h-full space-y-3 p-0 transition hover:-translate-y-0.5">
        <Thumbnail course={course} />
        <div className="space-y-2 px-5 pb-5">
          <CourseStatusBadge status={course.status} />
          <h3 className="text-lg font-bold">{course.title}</h3>
          <p className="text-sm text-muted">
            {LEVEL_OPTIONS[course.level]} · {course.lessons_count} bài · {formatPrice(course.price)}
          </p>
        </div>
      </Card>
    </Link>
  )
}

export function Thumbnail({ course, className = 'h-36' }) {
  if (course.thumbnail_url) {
    return <img src={course.thumbnail_url} alt="" className={`${className} w-full rounded-t-2xl object-cover`} />
  }
  return (
    <div className={`${className} grid place-items-center rounded-t-2xl bg-gradient-to-br from-primary-500 to-accent-400 text-3xl font-extrabold text-white`}>
      {course.title.charAt(0)}
    </div>
  )
}
