import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, Input } from '../../components/ui'
import { formatTime } from '../../lib/format'
import { getNotes } from './api'
import { NoteItem } from './NotesPanel'

// Mọi ghi chú của học viên, nhóm theo khóa học → bài học
export default function NotesPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['notes', { search }],
    queryFn: () => getNotes({ search }),
    placeholderData: keepPreviousData,
  })

  const groups = groupByCourse(notes)
  const openNote = (note) => {
    const hash = note.lesson_block_id ? `#block-${note.lesson_block_id}` : ''
    navigate(`/learn/${note.lesson_id}${hash}`)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold">Ghi chú của tôi</h1>
        <p className="text-muted">Bấm vào nhãn của ghi chú để mở đúng chỗ trong bài học.</p>
      </div>
      <Input placeholder="Tìm trong ghi chú…" value={search} onChange={(e) => setSearch(e.target.value)} />

      {isLoading && <p className="text-muted">Đang tải…</p>}
      {!isLoading && notes.length === 0 && (
        <Card className="text-center text-muted">
          Chưa có ghi chú nào. Hãy mở một bài trong <Link className="font-semibold text-primary-600" to="/my-courses">khóa học của tôi</Link> để bắt đầu.
        </Card>
      )}

      {groups.map((group) => (
        <Card key={group.course.slug} className="space-y-4">
          <Link to={`/courses/${group.course.slug}`} className="text-lg font-bold text-primary-700">{group.course.title}</Link>
          {group.lessons.map(({ lesson, notes: lessonNotes }) => (
            <div key={lesson.id} className="space-y-2">
              <h3 className="font-semibold">{lesson.title}</h3>
              <ul className="space-y-2">
                {lessonNotes.map((note) => (
                  <NoteItem
                    key={note.id}
                    note={note}
                    label={note.video_time != null ? `Mở bài · ${formatTime(note.video_time)}` : 'Mở bài'}
                    onJump={() => openNote(note)}
                    onChanged={() => queryClient.invalidateQueries({ queryKey: ['notes'] })}
                  />
                ))}
              </ul>
            </div>
          ))}
        </Card>
      ))}
    </div>
  )
}

function groupByCourse(notes) {
  const courses = new Map()
  for (const note of notes) {
    const course = note.lesson.chapter.course
    if (!courses.has(course.slug)) courses.set(course.slug, { course, lessons: new Map() })
    const lessons = courses.get(course.slug).lessons
    if (!lessons.has(note.lesson_id)) lessons.set(note.lesson_id, { lesson: note.lesson, notes: [] })
    lessons.get(note.lesson_id).notes.push(note)
  }
  return [...courses.values()].map((group) => ({ ...group, lessons: [...group.lessons.values()] }))
}
