import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Drawer from '../../components/Drawer'
import { Alert, Button, Card, Input, PageLoading, ProgressBar } from '../../components/ui'
import { fieldError } from '../../lib/api'
import { formatDuration } from '../../lib/format'
import { useUser } from '../auth/api'
import { enrollCourse, lessonPath } from '../courses/api'
import { refreshRewardsSoon } from '../gamification/api'
import { completeLesson, getLesson } from './api'
import BlockView, { VideoBlock } from './Blocks'
import { sectionNumbers } from './blockTypes'
import SqlPlayground from './SqlPlayground'

export default function LessonPlayerPage() {
  const { slug, lessonSlug } = useParams()
  const { data, isLoading, error } = useQuery({
    queryKey: ['lesson', slug, lessonSlug],
    queryFn: () => getLesson(slug, lessonSlug),
    retry: false,
  })

  if (isLoading) return <PageLoading />
  if (error) return <LockedLesson error={error} />
  return <Player key={`${slug}/${lessonSlug}`} data={data} queryKey={['lesson', slug, lessonSlug]} />
}

// Chưa đăng nhập (401) hoặc chưa đăng ký khóa (403)
function LockedLesson({ error }) {
  const location = useLocation()
  const course = error.data?.course
  return (
    <Card className="mx-auto max-w-lg space-y-4 text-center">
      <p className="text-lg font-bold">{error.status === 404 ? 'Không tìm thấy bài học.' : error.message}</p>
      {error.status === 401 && (
        <Link to={`/login?redirect=${encodeURIComponent(location.pathname)}`}><Button>Đăng nhập</Button></Link>
      )}
      {course && <Link to={`/courses/${course.slug}`}><Button variant="outline">Xem khóa “{course.title}”</Button></Link>}
    </Card>
  )
}

function Player({ data, queryKey }) {
  const { user } = useUser()
  const queryClient = useQueryClient()
  const { hash } = useLocation()
  const { course, lesson, blocks } = data
  const [drawer, setDrawer] = useState(null) // 'sql' | null

  const numbers = useMemo(() => sectionNumbers(blocks), [blocks])
  const sections = blocks
    .map((block, i) => ({ ...block, number: numbers[i] }))
    .filter((block) => block.type === 'section')

  const attempts = data.quiz_attempts ?? {}
  const remainingQuizzes = blocks.filter((block) => block.type === 'quiz' && !attempts[block.id]?.completed_once).length
  const onAttempt = (blockId, attempt) => {
    queryClient.setQueryData(queryKey, (old) => ({ ...old, quiz_attempts: { ...old.quiz_attempts, [blockId]: attempt } }))
    refreshRewardsSoon(queryClient)
  }

  const closeDrawer = useCallback(() => setDrawer(null), [])

  // Mở link có #section-... / #block-... thì cuộn tới đúng chỗ
  useEffect(() => {
    if (hash) document.querySelector(hash)?.scrollIntoView({ block: 'start' })
  }, [hash])

  return (
    <>
      <div className="grid items-start gap-8 lg:grid-cols-[260px_minmax(0,1fr)_36px]">
        <LessonSidebar course={course} currentId={lesson.id} fullAccess={data.enrolled || data.can_manage} />

        <article className="min-w-0 space-y-6">
          <LessonHeader course={course} lesson={lesson} sections={sections}>
            {lesson.intro_video_url && <VideoBlock content={{ url: lesson.intro_video_url }} />}
          </LessonHeader>

          {blocks.map((block, i) =>
            block.type === 'section' ? (
              <SectionHeading key={block.id} block={block} number={numbers[i]} />
            ) : (
              <div key={block.id} id={`block-${block.id}`} className="scroll-mt-20">
                {/* Văn bản đọc liền mạch; khối tương tác nằm trong thẻ */}
                {block.type === 'markdown' ? (
                  <BlockView block={block} />
                ) : (
                  <Card>
                    <BlockView
                      block={block}
                      lessonId={lesson.id}
                      attempt={attempts[block.id]}
                      canAnswer={!!user}
                      onAttempt={onAttempt}
                    />
                  </Card>
                )}
              </div>
            ),
          )}

          <CompleteBar data={data} queryKey={queryKey} remainingQuizzes={remainingQuizzes} />
          {data.next_lesson && <NextLessonCard course={course} next={data.next_lesson} />}
          {data.prev_lesson && (
            <Link to={lessonPath(course.slug, data.prev_lesson.slug)} className="block text-sm font-semibold text-primary-600">
              ← Bài trước: {data.prev_lesson.title}
            </Link>
          )}
        </article>

        <SectionRail sections={sections} hasPlayground={!!course.playground_sql} onOpen={setDrawer} />
      </div>

      {course.playground_sql && (
        <Drawer open={drawer === 'sql'} title="SQL Playground" onClose={closeDrawer}>
          <SqlPlayground setupSql={course.playground_sql} />
        </Drawer>
      )}
    </>
  )
}

const scrollToId = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

// Mục lục khóa bên trái: tìm bài, chương thu gọn được, bài khóa có ổ khóa
function LessonSidebar({ course, currentId, fullAccess }) {
  const [search, setSearch] = useState('')
  const [openOnMobile, setOpenOnMobile] = useState(false)
  const [collapsed, setCollapsed] = useState({}) // { chapterId: true } khi thu gọn
  const lessons = course.chapters.flatMap((chapter) => chapter.lessons)
  const completed = lessons.filter((item) => item.completed).length
  const keyword = search.trim().toLowerCase()

  return (
    <aside className="space-y-3 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pr-1">
      <div className="flex items-center justify-between">
        <Link to={`/courses/${course.slug}`} className="text-lg font-extrabold hover:text-primary-600">{course.title}</Link>
        <button type="button" className="text-sm font-semibold text-primary-600 lg:hidden" onClick={() => setOpenOnMobile(!openOnMobile)}>
          {openOnMobile ? 'Ẩn mục lục' : 'Mục lục'}
        </button>
      </div>
      {fullAccess && <ProgressBar value={completed} max={lessons.length} />}

      <div className={`space-y-3 ${openOnMobile ? '' : 'hidden lg:block'}`}>
        <Input placeholder="Tìm bài học…" value={search} onChange={(e) => setSearch(e.target.value)} className="py-2" />
        {course.chapters.map((chapter) => {
          const visible = chapter.lessons.filter((item) => item.title.toLowerCase().includes(keyword))
          if (keyword && visible.length === 0) return null
          const isCollapsed = collapsed[chapter.id] && !keyword
          return (
            <div key={chapter.id} className="border-b border-primary-100 pb-2">
              <button
                type="button"
                onClick={() => setCollapsed({ ...collapsed, [chapter.id]: !collapsed[chapter.id] })}
                className="flex w-full items-center justify-between py-2 text-left font-bold"
              >
                {chapter.title}
                <span className="text-xs text-muted">{isCollapsed ? '▸' : '▾'}</span>
              </button>
              {!isCollapsed && visible.map((item) => {
                const open = fullAccess || item.is_preview
                const current = item.id === currentId
                const className = `flex items-center gap-2 rounded-lg border-l-4 px-3 py-2 text-sm ${
                  current ? 'border-primary-500 bg-primary-50 font-bold text-primary-700' : 'border-transparent'
                }`
                const content = (
                  <>
                    <span className="flex-1">{item.title}</span>
                    <span className={`text-xs ${item.completed ? 'text-success' : 'text-muted'}`}>{item.completed ? '✓' : open ? '' : '🔒'}</span>
                  </>
                )
                return open ? (
                  <Link key={item.id} to={lessonPath(course.slug, item.slug)} className={`${className} hover:bg-primary-50`}>{content}</Link>
                ) : (
                  <span key={item.id} className={`${className} text-muted`}>{content}</span>
                )
              })}
            </div>
          )
        })}
      </div>
    </aside>
  )
}

// Đầu bài: breadcrumb, tiêu đề, tóm tắt, video mở đầu (children), lộ trình bài học
function LessonHeader({ course, lesson, sections, children }) {
  const numbered = sections.filter((section) => section.number)
  return (
    <header className="space-y-4">
      <nav className="flex flex-wrap gap-1 text-sm text-muted">
        <Link to="/" className="hover:text-primary-600">Trang chủ</Link> ›
        <Link to="/courses" className="hover:text-primary-600">Khóa học</Link> ›
        <Link to={`/courses/${course.slug}`} className="hover:text-primary-600">{course.title}</Link>
      </nav>
      <h1 className="text-4xl font-extrabold leading-tight">{lesson.title}</h1>
      {lesson.summary && <p className="text-lg text-muted">{lesson.summary}</p>}
      <p className="text-sm font-semibold text-muted">
        ⏱ {formatDuration(lesson.duration_minutes)}{numbered.length > 0 && ` · ${numbered.length} phần`}
      </p>
      {children}

      {sections.length > 0 && (
        <Card className="space-y-2 p-5">
          <p className="font-bold">Lộ trình bài học</p>
          <ol className="space-y-1">
            {sections.map((section) => (
              <li key={section.id}>
                <button type="button" onClick={() => scrollToId(`section-${section.id}`)} className="text-left text-sm hover:text-primary-600">
                  <span className="font-semibold text-primary-600">{section.number ? `Phần ${section.number}` : '•'}</span> {section.content.title}
                </button>
              </li>
            ))}
          </ol>
        </Card>
      )}
    </header>
  )
}

function SectionHeading({ block, number }) {
  return (
    <div id={`section-${block.id}`} className="scroll-mt-20 pt-6">
      {number && <p className="text-xs font-bold uppercase tracking-widest text-accent-600">Phần {number}</p>}
      <h2 className="text-2xl font-extrabold">{block.content.title}</h2>
      <hr className="mt-3 border-primary-100" />
    </div>
  )
}

// Mép phải: thanh chấm theo Phần (sáng ở Phần đang đọc) + nút mở SQL Playground
function SectionRail({ sections, hasPlayground, onOpen }) {
  const [active, setActive] = useState(null)

  useEffect(() => {
    const onScroll = () => {
      let current = sections[0]?.id ?? null
      for (const section of sections) {
        const element = document.getElementById(`section-${section.id}`)
        if (element && element.getBoundingClientRect().top < window.innerHeight * 0.35) current = section.id
      }
      setActive(current)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [sections])

  const tools = hasPlayground && <RailButton label="SQL Playground" onClick={() => onOpen('sql')}>SQL</RailButton>

  return (
    <>
      <div className="sticky top-24 hidden flex-col items-center gap-2 lg:flex">
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            title={section.content.title}
            onClick={() => scrollToId(`section-${section.id}`)}
            className={`h-1 rounded-full transition-all ${active === section.id ? 'w-8 bg-primary-500' : 'w-5 bg-primary-200 hover:bg-primary-300'}`}
          />
        ))}
        <div className="mt-4 flex flex-col gap-2">{tools}</div>
      </div>
      {/* Màn hình nhỏ: nút nổi góc phải, nằm trên thanh tab */}
      <div className="fixed bottom-20 right-4 z-20 flex gap-2 lg:hidden">{tools}</div>
    </>
  )
}

function RailButton({ label, onClick, children }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="grid size-9 place-items-center rounded-xl bg-card text-xs font-bold text-primary-600 shadow-card hover:bg-primary-50"
    >
      {children}
    </button>
  )
}

function NextLessonCard({ course, next }) {
  return (
    <Link to={lessonPath(course.slug, next.slug)} className="block">
      <Card className="flex items-center gap-4 border-2 border-primary-100 transition hover:border-primary-300">
        <div className="flex-1 space-y-1">
          <p className="text-xs font-bold uppercase tracking-widest text-accent-600">Bài tiếp theo</p>
          <p className="text-xl font-extrabold">{next.title}</p>
          {next.summary && <p className="line-clamp-2 text-sm text-muted">{next.summary}</p>}
        </div>
        <span className="text-2xl text-primary-600">→</span>
      </Card>
    </Link>
  )
}

// Cuối bài: đăng ký khóa / hoàn thành bài
function CompleteBar({ data, queryKey, remainingQuizzes }) {
  const { user } = useUser()
  const location = useLocation()
  const queryClient = useQueryClient()
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey })
    queryClient.invalidateQueries({ queryKey: ['course-detail'] })
    queryClient.invalidateQueries({ queryKey: ['my-courses'] })
  }
  const enroll = useMutation({ mutationFn: () => enrollCourse(data.course.id), onSuccess: refresh })
  const complete = useMutation({
    mutationFn: () => completeLesson(data.lesson.id),
    onSuccess: () => {
      refresh()
      refreshRewardsSoon(queryClient)
    },
  })
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
      <>
        <p className="font-semibold">Đây là bài học thử. Mua khóa học để học tất cả các bài.</p>
        <Link to={`/courses/${data.course.slug}`}><Button>Mua khóa học</Button></Link>
      </>
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
        {remainingQuizzes > 0 && <p className="text-sm text-muted">Còn {remainingQuizzes} khối quiz chưa làm xong.</p>}
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
