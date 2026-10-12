import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Alert, Button, Card } from '../../components/ui'
import { fieldError } from '../../lib/api'
import { useUser } from '../auth/api'
import { enrollCourse } from '../courses/api'
import NotesPanel from '../notes/NotesPanel'
import { completeLesson, getLesson } from './api'
import BlockView from './Blocks'

export default function LessonPlayerPage() {
  const { lessonId } = useParams()
  const { data, isLoading, error } = useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: () => getLesson(lessonId),
    retry: false,
  })

  if (isLoading) return <p className="text-muted">Đang tải…</p>
  if (error) return <LockedLesson error={error} />
  return <Player key={lessonId} data={data} lessonId={lessonId} />
}

// Chưa đăng nhập (401) hoặc chưa đăng ký khóa (403)
function LockedLesson({ error }) {
  const location = useLocation()
  const course = error.data?.course
  return (
    <Card className="mx-auto max-w-lg space-y-4 text-center">
      <p className="text-lg font-bold">{error.message}</p>
      {error.status === 401 && (
        <Link to={`/login?redirect=${encodeURIComponent(location.pathname)}`}><Button>Đăng nhập</Button></Link>
      )}
      {course && <Link to={`/courses/${course.slug}`}><Button variant="outline">Xem khóa “{course.title}”</Button></Link>}
    </Card>
  )
}

function Player({ data, lessonId }) {
  const { user } = useUser()
  const queryClient = useQueryClient()
  const { hash } = useLocation()
  const [tab, setTab] = useState('outline')
  const [noteTarget, setNoteTarget] = useState(null)

  // Trình phát video của từng khối (getTime/seek) để ghi chú gắn mốc thời gian
  const players = useRef({})
  const registerPlayer = useCallback((blockId, player) => {
    if (player) players.current[blockId] = player
    else delete players.current[blockId]
  }, [])

  const attempts = data.quiz_attempts ?? {}
  const remainingQuizzes = data.blocks.filter((block) => block.type === 'quiz' && !attempts[block.id]).length

  const onAttempt = (blockId, attempt) =>
    queryClient.setQueryData(['lesson', lessonId], (old) => ({ ...old, quiz_attempts: { ...old.quiz_attempts, [blockId]: attempt } }))

  const noteForBlock = (block) => {
    const time = players.current[block.id]?.getTime()
    setNoteTarget({ blockId: block.id, videoTime: time != null ? Math.floor(time) : null })
    setTab('notes')
  }
  const jumpToNote = (note) => {
    if (note.lesson_block_id) document.getElementById(`block-${note.lesson_block_id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    if (note.video_time != null) players.current[note.lesson_block_id]?.seek(note.video_time)
  }

  // Mở từ trang ghi chú: /learn/12#block-34 → cuộn tới khối
  useEffect(() => {
    if (hash) document.querySelector(hash)?.scrollIntoView({ block: 'start' })
  }, [hash])

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <article className="space-y-5">
        <div>
          <Link to={`/courses/${data.course.slug}`} className="text-sm font-semibold text-primary-600">← {data.course.title}</Link>
          <h1 className="text-3xl font-extrabold">{data.lesson.title}</h1>
        </div>

        {data.blocks.map((block) => (
          <Card key={block.id} id={`block-${block.id}`} className="group relative scroll-mt-20">
            {user && (
              <button
                type="button"
                onClick={() => noteForBlock(block)}
                className="absolute right-3 top-3 rounded-lg px-2 py-1 text-xs font-semibold text-muted opacity-0 transition hover:bg-primary-50 hover:text-primary-600 group-hover:opacity-100 focus:opacity-100"
              >
                + Ghi chú
              </button>
            )}
            <BlockView
              block={block}
              lessonId={lessonId}
              attempt={attempts[block.id]}
              canAnswer={!!user}
              onAttempt={onAttempt}
              registerPlayer={registerPlayer}
            />
          </Card>
        ))}

        <CompleteBar data={data} lessonId={lessonId} remainingQuizzes={remainingQuizzes} />
        <div className="flex justify-between">
          {data.prev_lesson_id ? <Link to={`/learn/${data.prev_lesson_id}`}><Button variant="ghost">← Bài trước</Button></Link> : <span />}
          {data.next_lesson_id && <Link to={`/learn/${data.next_lesson_id}`}><Button variant="ghost">Bài sau →</Button></Link>}
        </div>
      </article>

      <aside className="space-y-3 lg:sticky lg:top-20">
        <div className="flex gap-2">
          <Button size="sm" variant={tab === 'outline' ? 'primary' : 'outline'} onClick={() => setTab('outline')}>Mục lục</Button>
          <Button size="sm" variant={tab === 'notes' ? 'primary' : 'outline'} onClick={() => setTab('notes')}>Ghi chú</Button>
        </div>
        <Card className="max-h-[calc(100vh-10rem)] overflow-y-auto p-4">
          {tab === 'outline' ? (
            <Outline course={data.course} currentId={data.lesson.id} fullAccess={data.enrolled || data.can_manage} />
          ) : (
            <NotesPanel
              lessonId={lessonId}
              blocks={data.blocks}
              canWrite={!!user}
              target={noteTarget}
              onClearTarget={() => setNoteTarget(null)}
              onJump={jumpToNote}
            />
          )}
        </Card>
      </aside>
    </div>
  )
}

function Outline({ course, currentId, fullAccess }) {
  return (
    <div className="space-y-4">
      {course.chapters.map((chapter) => (
        <div key={chapter.id} className="space-y-1">
          <p className="text-xs font-bold uppercase text-muted">{chapter.title}</p>
          {chapter.lessons.map((lesson) => {
            const open = fullAccess || lesson.is_preview
            const icon = lesson.completed ? '✓' : open ? '○' : '🔒'
            const className = `flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm ${lesson.id === currentId ? 'bg-primary-50 font-bold text-primary-700' : ''}`
            return open ? (
              <Link key={lesson.id} to={`/learn/${lesson.id}`} className={`${className} hover:bg-primary-50`}>
                <span className={lesson.completed ? 'text-success' : 'text-muted'}>{icon}</span> {lesson.title}
              </Link>
            ) : (
              <span key={lesson.id} className={`${className} text-muted`}>{icon} {lesson.title}</span>
            )
          })}
        </div>
      ))}
    </div>
  )
}

// Cuối bài: đăng ký khóa / hoàn thành bài
function CompleteBar({ data, lessonId, remainingQuizzes }) {
  const { user } = useUser()
  const location = useLocation()
  const queryClient = useQueryClient()
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['lesson', lessonId] })
    queryClient.invalidateQueries({ queryKey: ['course-detail'] })
    queryClient.invalidateQueries({ queryKey: ['my-courses'] })
  }
  const enroll = useMutation({ mutationFn: () => enrollCourse(data.course.id), onSuccess: refresh })
  const complete = useMutation({ mutationFn: () => completeLesson(lessonId), onSuccess: refresh })
  const error = enroll.error ?? complete.error

  let content
  if (!user) {
    content = (
      <>
        <p className="font-semibold">Đăng nhập để lưu tiến độ học.</p>
        <Link to={`/login?redirect=${encodeURIComponent(location.pathname)}`}><Button>Đăng nhập</Button></Link>
      </>
    )
  } else if (data.can_manage && !data.enrolled) {
    content = <p className="font-semibold text-muted">Bạn đang xem bài với tư cách người soạn khóa học.</p>
  } else if (!data.enrolled) {
    content = data.course.price > 0 ? (
      <p className="font-semibold">Đây là bài học thử. Chức năng mua khóa học sẽ mở ở đợt sau.</p>
    ) : (
      <>
        <p className="font-semibold">Đăng ký khóa học (miễn phí) để lưu tiến độ.</p>
        <Button onClick={() => enroll.mutate()} disabled={enroll.isPending}>Đăng ký học</Button>
      </>
    )
  } else if (data.completed) {
    content = <p className="font-bold text-success">✓ Bạn đã hoàn thành bài này</p>
  } else {
    content = (
      <>
        {remainingQuizzes > 0 && <p className="text-sm text-muted">Còn {remainingQuizzes} khối quiz chưa trả lời.</p>}
        <Button variant="accent" size="lg" onClick={() => complete.mutate()} disabled={remainingQuizzes > 0 || complete.isPending}>
          Hoàn thành bài
        </Button>
      </>
    )
  }

  return (
    <Card className="flex flex-col items-center gap-3 text-center">
      {content}
      {error && (
        <Alert tone="danger">
          {error.status === 403 ? 'Hãy xác thực email trước khi đăng ký khóa học.' : fieldError(error, 'lesson') ?? fieldError(error, 'course') ?? error.message}
        </Alert>
      )}
    </Card>
  )
}
