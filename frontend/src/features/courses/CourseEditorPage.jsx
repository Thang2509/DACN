import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import CodeEditor from '../../components/CodeEditor'
import CourseStatusBadge from '../../components/CourseStatusBadge'
import { Alert, Button, Card, Input, PageLoading, Select, Textarea } from '../../components/ui'
import { fieldError } from '../../lib/api'
import { useForm } from '../../lib/useForm'
import { CATEGORY_OPTIONS, courseKey, deleteCourse, getCourse, LEVEL_OPTIONS, submitCourse, updateCourse, uploadThumbnail } from './api'
import CourseOutline from './CourseOutline'
import { Thumbnail } from './CourseCard'
import { SetupPreview } from '../lesson/TableViewer'

export default function CourseEditorPage() {
  const { courseId } = useParams()
  const { data: course, isLoading, error } = useQuery({ queryKey: courseKey(courseId), queryFn: () => getCourse(courseId) })

  if (isLoading) return <PageLoading />
  if (error) return <Alert tone="danger">{error.message}</Alert>

  return (
    <div className="space-y-6">
      <CourseHeader course={course} />
      {course.status === 'rejected' && <Alert tone="danger"><b>Lý do từ chối:</b> {course.review_note}</Alert>}
      {course.status === 'pending' && <Alert tone="warning">Khóa học đang chờ quản trị viên duyệt.</Alert>}
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_1.2fr]">
        <CourseInfoForm key={course.updated_at} course={course} />
        <CourseOutline course={course} />
      </div>
    </div>
  )
}

function CourseHeader({ course }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const canSubmit = ['draft', 'rejected'].includes(course.status)

  const submit = useMutation({
    mutationFn: () => submitCourse(course.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: courseKey(course.id) }),
  })
  const remove = useMutation({
    mutationFn: () => deleteCourse(course.id),
    onSuccess: () => navigate('/instructor'),
  })
  const confirmRemove = () => {
    if (confirm(`Xóa khóa học "${course.title}"? Không thể hoàn tác.`)) remove.mutate()
  }

  return (
    <div className="space-y-3">
      <Link to="/instructor" className="text-sm font-semibold text-primary-600">← Khóa học của tôi</Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-extrabold">{course.title}</h1>
        <CourseStatusBadge status={course.status} />
        {canSubmit && (
          <div className="ml-auto flex gap-2">
            <Button variant="ghost" onClick={confirmRemove} disabled={remove.isPending}>Xóa</Button>
            <Button variant="accent" onClick={() => submit.mutate()} disabled={submit.isPending}>Gửi duyệt</Button>
          </div>
        )}
      </div>
      {(submit.error || remove.error) && (
        <Alert tone="danger">{fieldError(submit.error ?? remove.error, 'course') ?? (submit.error ?? remove.error).message}</Alert>
      )}
    </div>
  )
}

function CourseInfoForm({ course }) {
  const queryClient = useQueryClient()
  const refresh = () => queryClient.invalidateQueries({ queryKey: courseKey(course.id) })
  const { values, setValues, bind } = useForm({
    title: course.title,
    summary: course.summary ?? '',
    description: course.description ?? '',
    level: course.level,
    category: course.category,
    price: course.price,
    playground_sql: course.playground_sql ?? '',
  })

  const save = useMutation({ mutationFn: (data) => updateCourse(course.id, data), onSuccess: refresh })
  const thumbnail = useMutation({ mutationFn: (file) => uploadThumbnail(course.id, file), onSuccess: refresh })
  const submit = (e) => {
    e.preventDefault()
    save.mutate({ ...values, price: Number(values.price) })
  }
  const error = (field) => fieldError(save.error, field)

  return (
    <Card className="space-y-4">
      <h2 className="text-lg font-bold">Thông tin khóa học</h2>
      <div className="overflow-hidden rounded-2xl">
        <Thumbnail course={course} className="h-40" />
      </div>
      <label className="block cursor-pointer text-sm font-semibold text-primary-600">
        {thumbnail.isPending ? 'Đang tải lên…' : 'Đổi ảnh bìa'}
        <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files[0] && thumbnail.mutate(e.target.files[0])} />
      </label>
      {fieldError(thumbnail.error, 'thumbnail') && <p className="text-sm text-danger">{fieldError(thumbnail.error, 'thumbnail')}</p>}

      <form className="space-y-4" onSubmit={submit}>
        <Input label="Tên khóa học" {...bind('title')} error={error('title')} />
        <Input label="Mô tả ngắn" {...bind('summary')} error={error('summary')} />
        <Textarea label="Giới thiệu chi tiết" rows={6} {...bind('description')} error={error('description')} />
        <div className="grid grid-cols-3 gap-4">
          <Select label="Chủ đề" options={CATEGORY_OPTIONS} {...bind('category')} />
          <Select label="Cấp độ" options={LEVEL_OPTIONS} {...bind('level')} />
          <Input label="Giá (VND)" type="number" min="0" step="1000" {...bind('price')} error={error('price')} />
        </div>
        <div>
          <span className="mb-1 block text-sm font-semibold">SQL Playground: SQL tạo bảng mẫu (để trống nếu khóa không cần)</span>
          <CodeEditor value={values.playground_sql} onChange={(text) => setValues((v) => ({ ...v, playground_sql: text }))} language="sql" minHeight="5rem" />
          {error('playground_sql') && <p className="mt-1 text-sm text-danger">{error('playground_sql')}</p>}
        </div>
        <SetupPreview sql={values.playground_sql} />
        <Button disabled={save.isPending}>Lưu thông tin</Button>
      </form>
    </Card>
  )
}
