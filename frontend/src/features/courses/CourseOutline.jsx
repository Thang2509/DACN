import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Alert, Button, Card, Input } from '../../components/ui'
import { moveItem, moveLesson } from '../../lib/reorder'
import {
  addChapter, addLesson, courseKey, deleteChapter, deleteLesson, renameChapter, saveOutline, updateLesson,
} from './api'

// Mục lục khóa học: thêm, đổi tên, xóa, sắp xếp chương và bài
export default function CourseOutline({ course }) {
  const queryClient = useQueryClient()
  const key = courseKey(course.id)
  const refresh = () => queryClient.invalidateQueries({ queryKey: key })
  const chapters = course.chapters

  const reorder = useMutation({
    mutationFn: (next) => saveOutline(course.id, next),
    // Cập nhật giao diện ngay, lỗi thì tải lại dữ liệu thật
    onMutate: (next) => queryClient.setQueryData(key, (old) => ({ ...old, chapters: next })),
    onError: refresh,
  })
  const apply = (next) => next !== chapters && reorder.mutate(next)

  return (
    <Card className="space-y-4">
      <h2 className="text-lg font-bold">Mục lục</h2>
      {reorder.error && <Alert tone="danger">{reorder.error.message}</Alert>}

      {chapters.map((chapter, index) => (
        <ChapterItem
          key={chapter.id}
          chapter={chapter}
          number={index + 1}
          onMove={(direction) => apply(moveItem(chapters, index, index + direction))}
          onMoveLesson={(lessonId, direction) => apply(moveLesson(chapters, lessonId, direction))}
          onChanged={refresh}
        />
      ))}

      <AddRow placeholder="Tên chương mới" buttonText="+ Thêm chương" onAdd={(title) => addChapter(course.id, title).then(refresh)} />
    </Card>
  )
}

function ChapterItem({ chapter, number, onMove, onMoveLesson, onChanged }) {
  const remove = () => {
    if (confirm(`Xóa chương "${chapter.title}" cùng toàn bộ bài học bên trong?`)) deleteChapter(chapter.id).then(onChanged)
  }

  return (
    <div className="rounded-2xl border-2 border-primary-100">
      <div className="flex items-center gap-2 bg-primary-50 px-4 py-2">
        <span className="font-bold text-primary-700">Chương {number}.</span>
        <InlineEdit value={chapter.title} onSave={(title) => renameChapter(chapter.id, title).then(onChanged)} />
        <MoveButtons onMove={onMove} onRemove={remove} />
      </div>

      <ul className="divide-y divide-primary-50">
        {chapter.lessons.map((lesson, index) => (
          <li key={lesson.id} className="flex items-center gap-2 px-4 py-2">
            <span className="w-6 text-sm text-muted">{index + 1}</span>
            <InlineEdit value={lesson.title} onSave={(title) => updateLesson(lesson.id, { title }).then(onChanged)} />
            <Link to={`/instructor/lessons/${lesson.id}`} className="shrink-0 text-sm font-semibold text-primary-600">
              Soạn ({lesson.blocks_count ?? 0} khối)
            </Link>
            <label className="flex shrink-0 items-center gap-1 text-xs text-muted" title="Cho phép học thử khi chưa mua">
              <input
                type="checkbox"
                checked={lesson.is_preview}
                onChange={(e) => updateLesson(lesson.id, { is_preview: e.target.checked }).then(onChanged)}
              />
              Học thử
            </label>
            <MoveButtons
              onMove={(direction) => onMoveLesson(lesson.id, direction)}
              onRemove={() => confirm(`Xóa bài "${lesson.title}"?`) && deleteLesson(lesson.id).then(onChanged)}
            />
          </li>
        ))}
      </ul>

      <div className="px-4 pb-3 pt-1">
        <AddRow placeholder="Tên bài học mới" buttonText="+ Bài" onAdd={(title) => addLesson(chapter.id, title).then(onChanged)} />
      </div>
    </div>
  )
}

function MoveButtons({ onMove, onRemove }) {
  return (
    <div className="ml-auto flex shrink-0">
      <Button type="button" size="sm" variant="ghost" aria-label="Lên" onClick={() => onMove(-1)}>↑</Button>
      <Button type="button" size="sm" variant="ghost" aria-label="Xuống" onClick={() => onMove(1)}>↓</Button>
      <Button type="button" size="sm" variant="ghost" aria-label="Xóa" className="text-danger" onClick={onRemove}>✕</Button>
    </div>
  )
}

// Hiện chữ, bấm vào thì thành ô nhập; Enter để lưu, Esc để hủy
function InlineEdit({ value, onSave }) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(value)

  if (!editing) {
    return (
      <button
        type="button"
        className="min-w-0 flex-1 truncate text-left hover:text-primary-600"
        onClick={() => {
          setText(value)
          setEditing(true)
        }}
      >
        {value}
      </button>
    )
  }

  const finish = async (save) => {
    if (save && text.trim() && text !== value) await onSave(text.trim())
    else setText(value)
    setEditing(false)
  }
  return (
    <input
      autoFocus
      className="min-w-0 flex-1 rounded-lg border-2 border-primary-300 px-2 py-1 outline-none"
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => finish(true)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') finish(true)
        if (e.key === 'Escape') finish(false)
      }}
    />
  )
}

function AddRow({ placeholder, buttonText, onAdd }) {
  const [title, setTitle] = useState('')
  const [error, setError] = useState(null)
  const submit = async (e) => {
    e.preventDefault()
    if (!title.trim()) return
    try {
      await onAdd(title.trim())
      setTitle('')
      setError(null)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <form className="flex gap-2" onSubmit={submit}>
      <Input className="py-1.5" placeholder={placeholder} value={title} onChange={(e) => setTitle(e.target.value)} error={error} />
      <Button size="sm" variant="outline" className="shrink-0 self-start">{buttonText}</Button>
    </form>
  )
}
