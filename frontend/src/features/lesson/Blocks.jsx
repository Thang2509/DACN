import { useEffect, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import CodeEditor from '../../components/CodeEditor'
import { Alert, Button } from '../../components/ui'
import { BubbleSortAnimation, StackAnimation } from './Animations'
import { submitQuiz } from './api'
import { youtubeId } from './blockTypes'
import { lastRows, runJavaScript, runSql, sameRows } from './runCode'

// Hiển thị một khối nội dung cho học viên
export default function BlockView({ block, lessonId, attempt, canAnswer, onAttempt, registerPlayer }) {
  switch (block.type) {
    case 'markdown':
      return <Markdown text={block.content.text} />
    case 'video':
      return <VideoBlock blockId={block.id} content={block.content} registerPlayer={registerPlayer} />
    case 'quiz':
      return <QuizBlock key={attempt ? 'graded' : 'new'} block={block} lessonId={lessonId} attempt={attempt} canAnswer={canAnswer} onAttempt={onAttempt} />
    case 'animation':
      return <AnimationBlock content={block.content} />
    case 'code':
      return <CodeBlock content={block.content} />
    case 'flashcard':
      return <FlashcardBlock cards={block.content.cards} />
    default:
      return null
  }
}

export function Markdown({ text }) {
  return (
    <div className="markdown">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
    </div>
  )
}

// Nạp YouTube IFrame API một lần (cần để lấy thời điểm đang phát cho ghi chú)
let youtubeApi
function loadYoutubeApi() {
  youtubeApi ??= new Promise((resolve) => {
    window.onYouTubeIframeAPIReady = () => resolve(window.YT)
    const script = document.createElement('script')
    script.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(script)
  })
  return youtubeApi
}

// Video YouTube hoặc MP4; đăng ký getTime/seek để ghi chú gắn mốc thời gian
function VideoBlock({ blockId, content, registerPlayer }) {
  const videoId = youtubeId(content.url)
  const container = useRef(null)
  const video = useRef(null)

  useEffect(() => {
    if (!videoId) {
      registerPlayer?.(blockId, {
        getTime: () => video.current?.currentTime ?? 0,
        seek: (time) => {
          video.current.currentTime = time
          video.current.play()
        },
      })
      return () => registerPlayer?.(blockId, null)
    }

    // YouTube thay thế phần tử đích bằng iframe, nên tạo phần tử đích ngoài React quản lý
    let player
    const target = document.createElement('div')
    container.current.appendChild(target)
    loadYoutubeApi().then((YT) => {
      player = new YT.Player(target, { videoId, width: '100%', height: '100%' })
      registerPlayer?.(blockId, {
        getTime: () => player.getCurrentTime?.() ?? 0,
        seek: (time) => {
          player.seekTo(time, true)
          player.playVideo()
        },
      })
    })
    const host = container.current
    return () => {
      player?.destroy?.()
      host.replaceChildren()
      registerPlayer?.(blockId, null)
    }
  }, [blockId, videoId, registerPlayer])

  return (
    <figure className="space-y-2">
      {videoId
        ? <div ref={container} className="aspect-video w-full overflow-hidden rounded-xl bg-ink" />
        : <video ref={video} src={content.url} controls className="w-full rounded-xl bg-ink" />}
      {content.caption && <figcaption className="text-center text-sm text-muted">{content.caption}</figcaption>}
    </figure>
  )
}

function QuizBlock({ block, lessonId, attempt, canAnswer, onAttempt }) {
  const questions = block.content.questions
  const [answers, setAnswers] = useState(() => attempt?.answers ?? questions.map(() => null))
  const [result, setResult] = useState(attempt ?? null)
  const mutation = useMutation({
    mutationFn: () => submitQuiz(lessonId, block.id, answers),
    onSuccess: (graded) => {
      setResult(graded)
      onAttempt(block.id, graded)
    },
  })
  const allAnswered = answers.every((answer) => answer !== null)

  const optionClass = (q, o) => {
    if (!result) {
      return answers[q] === o ? 'border-primary-500 bg-primary-50' : 'border-primary-100 hover:border-primary-300'
    }
    if (result.results[q].answer === o) return 'border-success bg-green-50'
    if (answers[q] === o) return 'border-danger bg-rose-50'
    return 'border-primary-100 opacity-60'
  }

  return (
    <div className="space-y-5">
      {questions.map((question, q) => (
        <div key={q} className="space-y-2">
          <p className="font-semibold">{questions.length > 1 && `${q + 1}. `}{question.question}</p>
          <div className="grid gap-2">
            {question.options.map((option, o) => (
              <button
                key={o}
                type="button"
                disabled={!!result}
                onClick={() => setAnswers(answers.map((answer, i) => (i === q ? o : answer)))}
                className={`rounded-xl border-2 px-4 py-2.5 text-left transition ${optionClass(q, o)}`}
              >
                {option}
              </button>
            ))}
          </div>
          {result && (
            <p className={`text-sm ${result.results[q].correct ? 'text-success' : 'text-danger'}`}>
              {result.results[q].correct ? 'Chính xác!' : 'Chưa đúng.'} {result.results[q].explanation}
            </p>
          )}
        </div>
      ))}

      {!canAnswer && <Alert>Đăng nhập để làm quiz và lưu kết quả.</Alert>}
      {mutation.error && <Alert tone="danger">{mutation.error.message}</Alert>}
      <div className="flex items-center gap-3">
        {result ? (
          <>
            <span className="font-bold">Đúng {result.correct_count}/{questions.length} câu</span>
            <Button size="sm" variant="outline" onClick={() => { setResult(null); setAnswers(questions.map(() => null)) }}>Làm lại</Button>
          </>
        ) : (
          <Button size="sm" onClick={() => mutation.mutate()} disabled={!canAnswer || !allAnswered || mutation.isPending}>Kiểm tra</Button>
        )}
      </div>
    </div>
  )
}

const ANIMATION_COMPONENTS = { StackAnimation, BubbleSortAnimation }

function AnimationBlock({ content }) {
  const Animation = ANIMATION_COMPONENTS[content.component]
  if (!Animation) return <Alert tone="warning">Hoạt ảnh “{content.component}” chưa có.</Alert>
  return <Animation {...(content.params ?? {})} />
}

// Ô code chạy thử: JavaScript trong iframe cách ly, SQL bằng sql.js; tự chấm nếu có đáp án
function CodeBlock({ content }) {
  const isSql = content.language === 'sql'
  const [code, setCode] = useState(content.starter ?? '')
  const [run, setRun] = useState(null)
  const [running, setRunning] = useState(false)
  const [showSolution, setShowSolution] = useState(false)

  const execute = async () => {
    setRunning(true)
    if (isSql) {
      const mine = await runSql(content.setup, code)
      let correct = null
      if (content.solution && !mine.error) {
        const answer = await runSql(content.setup, content.solution)
        correct = sameRows(lastRows(mine.results), lastRows(answer.results), /order\s+by/i.test(content.solution))
      }
      setRun({ ...mine, correct })
    } else {
      const result = await runJavaScript(code)
      const correct = content.expected ? !result.error && result.output.join('\n').trim() === content.expected.trim() : null
      setRun({ ...result, correct })
    }
    setRunning(false)
  }

  return (
    <div className="space-y-3">
      {content.instructions && <p className="font-semibold">{content.instructions}</p>}
      <CodeEditor value={code} onChange={setCode} language={content.language} />
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={execute} disabled={running}>{running ? 'Đang chạy…' : '▶ Chạy'}</Button>
        <Button size="sm" variant="ghost" onClick={() => { setCode(content.starter ?? ''); setRun(null) }}>Làm lại</Button>
        {content.solution && (
          <Button size="sm" variant="ghost" onClick={() => setShowSolution(!showSolution)}>
            {showSolution ? 'Ẩn lời giải' : 'Xem lời giải'}
          </Button>
        )}
      </div>

      {run && <RunResult run={run} isSql={isSql} />}
      {showSolution && <CodeEditor value={content.solution} language={content.language} readOnly minHeight="3rem" />}
    </div>
  )
}

function RunResult({ run, isSql }) {
  const table = run.results?.at(-1)
  return (
    <div className="space-y-2">
      {run.correct === true && <Alert tone="success">Chính xác! Kết quả khớp với yêu cầu.</Alert>}
      {run.correct === false && <Alert tone="warning">Chưa đúng, hãy thử lại.</Alert>}
      {run.error && <pre className="overflow-x-auto rounded-xl bg-rose-50 p-3 text-sm text-danger">{run.error}</pre>}
      {!isSql && run.output.length > 0 && (
        <pre className="overflow-x-auto rounded-xl bg-ink p-3 text-sm text-white">{run.output.join('\n')}</pre>
      )}
      {isSql && table && (
        <div className="markdown overflow-x-auto">
          <table>
            <thead><tr>{table.columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
            <tbody>
              {table.values.map((row, r) => (
                <tr key={r}>{row.map((cell, c) => <td key={c}>{cell === null ? 'NULL' : String(cell)}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {isSql && !run.error && !table && <p className="text-sm text-muted">Câu lệnh chạy xong, không có dữ liệu trả về.</p>}
    </div>
  )
}

// Thẻ ghi nhớ lật hai mặt
function FlashcardBlock({ cards }) {
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const go = (next) => {
    setIndex(next)
    setFlipped(false)
  }
  const face = 'absolute inset-0 grid place-items-center rounded-2xl p-6 text-center text-xl font-bold [backface-visibility:hidden]'

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setFlipped(!flipped)}
        className="relative mx-auto block h-48 w-full max-w-md [perspective:1000px]"
        aria-label="Lật thẻ"
      >
        <div
          className="relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d]"
          style={{ transform: flipped ? 'rotateY(180deg)' : 'none' }}
        >
          <div className={`${face} bg-primary-600 text-white`}>{cards[index].front}</div>
          <div className={`${face} bg-accent-100 text-accent-800 [transform:rotateY(180deg)]`}>{cards[index].back}</div>
        </div>
      </button>
      <p className="text-center text-sm text-muted">Bấm vào thẻ để lật · Thẻ {index + 1}/{cards.length}</p>
      <div className="flex justify-center gap-2">
        <Button size="sm" variant="outline" disabled={index === 0} onClick={() => go(index - 1)}>← Trước</Button>
        <Button size="sm" variant="outline" disabled={index === cards.length - 1} onClick={() => go(index + 1)}>Sau →</Button>
      </div>
    </div>
  )
}
