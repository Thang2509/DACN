import { useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import CodeEditor from '../../components/CodeEditor'
import { Alert, Badge, Button } from '../../components/ui'
import { fieldError } from '../../lib/api'
import { BubbleSortAnimation, StackAnimation } from './Animations'
import { answerQuestion } from './api'
import { QUIZ_VARIANTS, youtubeId } from './blockTypes'
import { lastRows, runJavaScript, runSql, sameRows, useSetupTables } from './runCode'
import TableViewer from './TableViewer'

// Hiển thị một khối nội dung cho học viên (khối "Phần" do trang học bài tự vẽ)
export default function BlockView({ block, lessonId, attempt, canAnswer, onAttempt }) {
  switch (block.type) {
    case 'markdown':
      return <Markdown text={block.content.text} />
    case 'video':
      return <VideoBlock content={block.content} />
    case 'quiz':
      return <QuizBlock block={block} lessonId={lessonId} attempt={attempt} canAnswer={canAnswer} onAttempt={onAttempt} />
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
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ pre: CodePre }}>{text}</ReactMarkdown>
    </div>
  )
}

// Khung code trong Markdown kèm nút "Sao chép mã"
function CodePre({ children }) {
  const ref = useRef(null)
  return (
    <div className="group/code relative">
      <pre ref={ref}>{children}</pre>
      <CopyButton getText={() => ref.current.innerText} className="absolute right-2 top-2 opacity-0 group-hover/code:opacity-100 focus:opacity-100" />
    </div>
  )
}

function CopyButton({ getText, className = '' }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    await navigator.clipboard.writeText(getText())
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button type="button" onClick={copy} className={`rounded-lg bg-white/10 px-2 py-1 text-xs font-semibold text-white transition hover:bg-white/20 ${className}`}>
      {copied ? 'Đã chép ✓' : 'Sao chép mã'}
    </button>
  )
}

// Video YouTube (nhúng iframe) hoặc tệp MP4
export function VideoBlock({ content }) {
  const videoId = youtubeId(content.url)
  return (
    <figure className="space-y-2">
      {videoId ? (
        <iframe
          className="aspect-video w-full rounded-xl bg-code"
          src={`https://www.youtube.com/embed/${videoId}`}
          title={content.caption || 'Video bài học'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <video src={content.url} controls className="w-full rounded-xl bg-code" />
      )}
      {content.caption && <figcaption className="text-center text-sm text-muted">{content.caption}</figcaption>}
    </figure>
  )
}

const LETTERS = 'ABCDEF'

const emptyAttempt = (total) => ({
  answers: Array(total).fill(null),
  results: Array(total).fill(null),
  correct_count: 0,
  completed: false,
})

// Quiz kiểu Sydexa: hiện từng câu, chọn A–D, "Gửi câu trả lời" để máy chủ chấm ngay câu đó
function QuizBlock({ block, lessonId, attempt, canAnswer, onAttempt }) {
  const { variant = 'quick', questions } = block.content
  const total = questions.length
  const [state, setState] = useState(() => attempt ?? emptyAttempt(total))
  // Bắt đầu ở câu đầu tiên chưa trả lời (hoặc câu cuối nếu đã làm xong)
  const [current, setCurrent] = useState(() => {
    const index = (attempt?.answers ?? []).findIndex((answer) => answer === null)
    return attempt ? (index === -1 ? total - 1 : index) : 0
  })
  const [choice, setChoice] = useState(null)

  const mutation = useMutation({
    mutationFn: () => answerQuestion(lessonId, block.id, current, choice),
    onSuccess: (view) => {
      setState(view)
      setChoice(null)
      onAttempt(block.id, view)
    },
  })

  const question = questions[current]
  const result = state.results[current] // null khi câu này chưa trả lời
  const go = (index) => {
    setCurrent(index)
    setChoice(null)
    mutation.reset()
  }
  const retry = () => {
    setState(emptyAttempt(total))
    go(0)
  }

  const optionClass = (o) => {
    if (!result) return choice === o ? 'border-primary-500 bg-primary-50' : 'border-primary-100 hover:border-primary-300'
    if (result.answer === o) return 'border-success bg-green-50'
    if (state.answers[current] === o) return 'border-danger bg-rose-50'
    return 'border-primary-100 opacity-60'
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Badge color={variant === 'test' ? 'accent' : variant === 'predict' ? 'coin' : 'primary'}>{QUIZ_VARIANTS[variant]}</Badge>
        {total > 1 && <span className="text-sm font-semibold text-muted">Câu {current + 1}/{total}</span>}
      </div>

      <p className="text-lg font-semibold">{question.question}</p>
      <div className="grid gap-2">
        {question.options.map((option, o) => (
          <button
            key={o}
            type="button"
            disabled={!!result || !canAnswer}
            onClick={() => setChoice(o)}
            className={`flex items-center gap-3 rounded-xl border-2 px-4 py-2.5 text-left transition ${optionClass(o)}`}
          >
            <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary-100 text-sm font-bold text-primary-700">{LETTERS[o]}</span>
            {option}
          </button>
        ))}
      </div>

      {result && (
        <Alert tone={result.correct ? 'success' : 'danger'}>
          <b>{result.correct ? 'Chính xác!' : `Chưa đúng, đáp án là ${LETTERS[result.answer]}.`}</b> {result.explanation}
          {variant === 'predict' && ' Xem minh họa bên dưới để kiểm chứng dự đoán của bạn.'}
        </Alert>
      )}
      {!canAnswer && <Alert>Đăng nhập để làm quiz và lưu kết quả.</Alert>}
      {mutation.error && <Alert tone="danger">{fieldError(mutation.error, 'question') ?? mutation.error.message}</Alert>}

      <div className="flex flex-wrap items-center gap-2">
        {!result && (
          <Button size="sm" onClick={() => mutation.mutate()} disabled={choice === null || !canAnswer || mutation.isPending}>
            Gửi câu trả lời
          </Button>
        )}
        {current > 0 && <Button size="sm" variant="ghost" onClick={() => go(current - 1)}>← Câu trước</Button>}
        {result && current < total - 1 && <Button size="sm" variant="outline" onClick={() => go(current + 1)}>Câu tiếp theo →</Button>}
        {state.completed && (
          <>
            <span className="ml-auto font-bold">Đúng {state.correct_count}/{total}</span>
            <Button size="sm" variant="ghost" onClick={retry}>Làm lại</Button>
          </>
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
  const [runCount, setRunCount] = useState(0)
  const [running, setRunning] = useState(false)
  const [showSolution, setShowSolution] = useState(false)
  const { data: initial } = useSetupTables(isSql ? content.setup : null)
  // Chưa chạy: dữ liệu mẫu ban đầu; đã chạy: dữ liệu sau khi chạy (đánh dấu dòng thay đổi)
  const tables = run?.tables?.length ? run.tables : initial?.tables ?? []

  const execute = async () => {
    setRunning(true)
    setRunCount((count) => count + 1)
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
      {isSql && tables.length > 0 && (
        <TableViewer key={run ? `run-${runCount}` : 'initial'} tables={tables} title={run ? 'Dữ liệu sau khi chạy' : 'Bảng dữ liệu'} />
      )}
      <CodeEditor value={code} onChange={setCode} language={content.language} />
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={execute} disabled={running}>{running ? 'Đang chạy…' : '▶ Chạy'}</Button>
        <Button size="sm" variant="ghost" onClick={() => { setCode(content.starter ?? ''); setRun(null) }}>Làm lại</Button>
        <Button size="sm" variant="ghost" onClick={() => navigator.clipboard.writeText(code)}>Sao chép mã</Button>
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

export function RunResult({ run, isSql }) {
  const table = run.results?.at(-1)
  return (
    <div className="space-y-2">
      {run.correct === true && <Alert tone="success">Chính xác! Kết quả khớp với yêu cầu.</Alert>}
      {run.correct === false && <Alert tone="warning">Chưa đúng, hãy thử lại.</Alert>}
      {run.error && <pre className="overflow-x-auto rounded-xl bg-rose-50 p-3 text-sm text-danger">{run.error}</pre>}
      {!isSql && run.output.length > 0 && (
        <pre className="overflow-x-auto rounded-xl bg-code p-3 text-sm text-white">{run.output.join('\n')}</pre>
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
      <p className="text-center text-sm text-muted">Nhấp vào thẻ để lật · {index + 1}/{cards.length}</p>
      <div className="flex justify-center gap-2">
        <Button size="sm" variant="outline" disabled={index === 0} onClick={() => go(index - 1)}>← Trước</Button>
        <Button size="sm" variant="outline" disabled={index === cards.length - 1} onClick={() => go(index + 1)}>Sau →</Button>
      </div>
    </div>
  )
}
