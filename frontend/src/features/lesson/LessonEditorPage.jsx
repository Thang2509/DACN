import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Alert, Badge, Button, Card, Input, Textarea } from '../../components/ui'
import { fieldError } from '../../lib/api'
import { useForm } from '../../lib/useForm'
import { lessonPath, updateLesson } from '../courses/api'
import { moveItem } from '../../lib/reorder'
import { getLessonEditor, saveBlocks, uploadFile } from './api'
import BlockEditor from './BlockEditors'
import { BLOCK_TYPES } from './blockTypes'

export default function LessonEditorPage() {
  const { lessonId } = useParams()
  const { data: lesson, isLoading, error } = useQuery({
    queryKey: ['lesson-editor', lessonId],
    queryFn: () => getLessonEditor(lessonId),
    refetchOnMount: 'always', // luôn lấy bản mới nhất khi mở trình soạn
  })

  if (isLoading) return <p className="text-muted">Đang tải…</p>
  if (error) return <Alert tone="danger">{error.message}</Alert>
  return <Editor key={lesson.id} lesson={lesson} />
}

// Mỗi khối cần key ổn định để React không lẫn form khi kéo-thả; khối mới chưa có id
const withKey = (block) => ({ ...block, key: block.id ?? crypto.randomUUID() })

function Editor({ lesson }) {
  const queryClient = useQueryClient()
  const course = lesson.chapter.course
  const [blocks, setBlocks] = useState(() => lesson.blocks.map(withKey))
  const [dirty, setDirty] = useState(false)
  const [dragIndex, setDragIndex] = useState(null)

  const save = useMutation({
    mutationFn: () => saveBlocks(lesson.id, blocks.map(({ id, type, content }) => ({ id, type, content }))),
    onSuccess: (saved) => {
      setBlocks(saved.map(withKey))
      setDirty(false)
      queryClient.invalidateQueries({ queryKey: ['course'] }) // số khối ở mục lục thay đổi
    },
  })

  const change = (next) => {
    setBlocks(next)
    setDirty(true)
  }
  // Thêm/xóa/đổi chỗ làm lệch số thứ tự khối trong thông báo lỗi cũ nên xóa lỗi đi
  const changeOrder = (next) => {
    change(next)
    save.reset()
  }
  const errorsOf = (index) =>
    Object.entries(save.error?.errors ?? {})
      .filter(([field]) => field.startsWith(`blocks.${index}.`))
      .map(([, messages]) => messages[0])

  useUnsavedWarning(dirty)

  return (
    <div className="space-y-6">
      <div className="sticky top-14 z-10 -mx-4 flex flex-wrap items-center gap-3 border-b border-primary-100 bg-surface/95 px-4 py-3 backdrop-blur">
        <div className="min-w-0">
          <Link to={`/instructor/courses/${course.id}`} className="text-sm font-semibold text-primary-600">← {course.title}</Link>
          <h1 className="truncate text-2xl font-extrabold">{lesson.title}</h1>
        </div>
        <Link to={lessonPath(course.slug, lesson.slug)} className="ml-auto text-sm font-semibold text-primary-600" title="Lưu bài trước để xem bản mới nhất">
          Xem như học viên
        </Link>
        <span className="text-sm text-muted">{dirty ? 'Chưa lưu' : 'Đã lưu'}</span>
        <Button onClick={() => save.mutate()} disabled={!dirty || save.isPending}>
          {save.isPending ? 'Đang lưu…' : 'Lưu bài'}
        </Button>
      </div>

      <LessonInfoForm lesson={lesson} />

      {save.error && <Alert tone="danger">Chưa lưu được: {save.error.errors ? 'kiểm tra các khối được đánh dấu đỏ.' : save.error.message}</Alert>}
      {blocks.length === 0 && <Card className="text-center text-muted">Bài học chưa có khối nào. Thêm khối ở bên dưới.</Card>}

      {blocks.map((block, index) => (
        <div
          key={block.key}
          data-block
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => {
            if (dragIndex !== null) changeOrder(moveItem(blocks, dragIndex, index))
            setDragIndex(null)
          }}
          className={`rounded-2xl bg-card shadow-card transition
            ${errorsOf(index).length ? 'ring-2 ring-danger' : ''}
            ${dragIndex === index ? 'opacity-40' : ''}
            ${dragIndex !== null && dragIndex !== index ? 'outline-2 outline-dashed outline-primary-300' : ''}`}
        >
          <div className="flex items-center gap-2 border-b border-primary-50 px-4 py-2">
            <span
              draggable
              title="Kéo để sắp xếp"
              className="cursor-grab select-none px-1 text-lg text-muted"
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = 'move'
                e.dataTransfer.setData('text/plain', String(index)) // Firefox cần có dữ liệu mới cho kéo
                e.dataTransfer.setDragImage(e.currentTarget.closest('[data-block]'), 24, 24)
                setDragIndex(index)
              }}
              onDragEnd={() => setDragIndex(null)}
            >
              ⠿
            </span>
            <Badge>{index + 1}. {BLOCK_TYPES[block.type].label}</Badge>
            <div className="ml-auto flex">
              <Button size="sm" variant="ghost" aria-label="Lên" onClick={() => changeOrder(moveItem(blocks, index, index - 1))}>↑</Button>
              <Button size="sm" variant="ghost" aria-label="Xuống" onClick={() => changeOrder(moveItem(blocks, index, index + 1))}>↓</Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-danger"
                aria-label="Xóa khối"
                onClick={() => confirm('Xóa khối này?') && changeOrder(blocks.filter((_, i) => i !== index))}
              >
                ✕
              </Button>
            </div>
          </div>

          <div className="p-4">
            <BlockEditor
              block={block}
              onChange={(content) => change(blocks.map((b, i) => (i === index ? { ...b, content } : b)))}
            />
            {errorsOf(index).map((message) => <p key={message} className="mt-2 text-sm text-danger">{message}</p>)}
          </div>
        </div>
      ))}

      <Card className="flex flex-wrap items-center gap-2">
        <span className="mr-2 font-semibold">Thêm khối:</span>
        {Object.entries(BLOCK_TYPES).map(([type, { label, create }]) => (
          <Button key={type} size="sm" variant="outline" onClick={() => changeOrder([...blocks, withKey({ type, content: create() })])}>
            + {label}
          </Button>
        ))}
      </Card>
    </div>
  )
}

// Tóm tắt (hiện dưới tiêu đề bài) và thời lượng ước tính
function LessonInfoForm({ lesson }) {
  const queryClient = useQueryClient()
  const { values, setValues, bind } = useForm({
    summary: lesson.summary ?? '',
    intro_video_url: lesson.intro_video_url ?? '',
    duration_minutes: lesson.duration_minutes,
  })
  const upload = useMutation({
    mutationFn: uploadFile,
    onSuccess: ({ url }) => setValues((current) => ({ ...current, intro_video_url: url })),
  })
  const save = useMutation({
    mutationFn: () => updateLesson(lesson.id, { ...values, duration_minutes: Number(values.duration_minutes) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['course'] }),
  })
  const submit = (e) => {
    e.preventDefault()
    save.mutate()
  }

  return (
    <Card>
      <form className="grid gap-4 md:grid-cols-[1fr_160px_auto] md:items-end" onSubmit={submit}>
        <Textarea label="Tóm tắt bài học" rows={2} {...bind('summary')} error={fieldError(save.error, 'summary')} />
        <Input label="Thời lượng (phút)" type="number" min="1" {...bind('duration_minutes')} error={fieldError(save.error, 'duration_minutes')} />
        <Button variant="outline" disabled={save.isPending}>{save.isSuccess ? 'Đã lưu ✓' : 'Lưu thông tin'}</Button>
        <div className="flex items-end gap-3 md:col-span-3">
          <Input
            label="Video mở đầu (link YouTube hoặc MP4, hiện ngay dưới tiêu đề bài)"
            placeholder="https://www.youtube.com/watch?v=..."
            {...bind('intro_video_url')}
            error={fieldError(save.error, 'intro_video_url') ?? fieldError(upload.error, 'file')}
          />
          <label className="shrink-0 cursor-pointer pb-3 text-sm font-semibold text-primary-600">
            {upload.isPending ? 'Đang tải…' : 'Tải MP4 lên'}
            <input type="file" accept="video/mp4" className="hidden" onChange={(e) => e.target.files[0] && upload.mutate(e.target.files[0])} />
          </label>
        </div>
      </form>
    </Card>
  )
}

// Hỏi lại khi đóng tab lúc còn thay đổi chưa lưu
function useUnsavedWarning(dirty) {
  useEffect(() => {
    if (!dirty) return
    const warn = (e) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])
}
