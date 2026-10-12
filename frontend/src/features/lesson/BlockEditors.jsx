import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import CodeEditor from '../../components/CodeEditor'
import { Button, Input, Select, Textarea } from '../../components/ui'
import { uploadFile } from './api'
import { ANIMATIONS, newQuestion, youtubeEmbedUrl } from './blockTypes'

// Form soạn nội dung cho từng loại khối; onChange nhận content mới
export default function BlockEditor({ block, onChange }) {
  const Editor = EDITORS[block.type]
  return <Editor content={block.content} onChange={onChange} />
}

const CODE_FONT = 'font-mono text-sm'

// Sửa một phần tử trong mảng, trả mảng mới
const replaceAt = (list, index, value) => list.map((item, i) => (i === index ? value : item))

function MarkdownEditor({ content, onChange }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Textarea
        rows={10}
        className={CODE_FONT}
        placeholder="Viết bằng Markdown: ## tiêu đề, **đậm**, `code`, danh sách, bảng…"
        value={content.text}
        onChange={(e) => onChange({ ...content, text: e.target.value })}
      />
      <div className="markdown max-h-72 overflow-y-auto rounded-xl bg-surface p-4">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content.text || '*Xem trước nội dung…*'}</ReactMarkdown>
      </div>
    </div>
  )
}

function VideoEditor({ content, onChange }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const upload = async (file) => {
    setUploading(true)
    setError(null)
    try {
      const { url } = await uploadFile(file)
      onChange({ ...content, url })
    } catch (err) {
      setError(err.errors?.file?.[0] ?? err.message)
    }
    setUploading(false)
  }
  const embed = youtubeEmbedUrl(content.url)

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-2">
        <Input label="Link YouTube hoặc tệp MP4" value={content.url} onChange={(e) => onChange({ ...content, url: e.target.value })} error={error} />
        <label className="shrink-0 cursor-pointer pb-3 text-sm font-semibold text-primary-600">
          {uploading ? 'Đang tải…' : 'Tải MP4 lên'}
          <input type="file" accept="video/mp4" className="hidden" onChange={(e) => e.target.files[0] && upload(e.target.files[0])} />
        </label>
      </div>
      <Input label="Chú thích" value={content.caption ?? ''} onChange={(e) => onChange({ ...content, caption: e.target.value })} />
      {embed && <iframe className="aspect-video w-full max-w-xl rounded-xl" src={embed} title="Xem trước video" allowFullScreen />}
      {!embed && content.url && <video className="w-full max-w-xl rounded-xl" src={content.url} controls />}
    </div>
  )
}

function QuizEditor({ content, onChange }) {
  const questions = content.questions
  const setQuestion = (index, question) => onChange({ ...content, questions: replaceAt(questions, index, question) })

  return (
    <div className="space-y-4">
      {questions.map((q, index) => (
        <div key={index} className="space-y-3 rounded-xl border-2 border-primary-100 p-4">
          <div className="flex items-start gap-2">
            <Textarea rows={2} label={`Câu ${index + 1}`} value={q.question} onChange={(e) => setQuestion(index, { ...q, question: e.target.value })} />
            {questions.length > 1 && (
              <Button type="button" size="sm" variant="ghost" className="mt-6 text-danger"
                onClick={() => onChange({ ...content, questions: questions.filter((_, i) => i !== index) })}>✕</Button>
            )}
          </div>

          <p className="text-sm font-semibold">Lựa chọn (chọn ô tròn ở đáp án đúng)</p>
          {q.options.map((option, o) => (
            <div key={o} className="flex items-center gap-2">
              <input type="radio" checked={q.answer === o} onChange={() => setQuestion(index, { ...q, answer: o })} />
              <input
                className="flex-1 rounded-lg border-2 border-primary-100 px-3 py-1.5 outline-none focus:border-primary-500"
                value={option}
                placeholder={`Lựa chọn ${o + 1}`}
                onChange={(e) => setQuestion(index, { ...q, options: replaceAt(q.options, o, e.target.value) })}
              />
              {q.options.length > 2 && (
                <Button type="button" size="sm" variant="ghost"
                  onClick={() => setQuestion(index, {
                    ...q,
                    options: q.options.filter((_, i) => i !== o),
                    answer: q.answer === o ? 0 : q.answer > o ? q.answer - 1 : q.answer,
                  })}>✕</Button>
              )}
            </div>
          ))}
          {q.options.length < 6 && (
            <Button type="button" size="sm" variant="ghost" onClick={() => setQuestion(index, { ...q, options: [...q.options, ''] })}>
              + Lựa chọn
            </Button>
          )}
          <Input label="Giải thích (hiện sau khi trả lời)" value={q.explanation ?? ''} onChange={(e) => setQuestion(index, { ...q, explanation: e.target.value })} />
        </div>
      ))}
      <Button type="button" size="sm" variant="outline" onClick={() => onChange({ ...content, questions: [...questions, newQuestion()] })}>
        + Câu hỏi
      </Button>
    </div>
  )
}

function AnimationEditor({ content, onChange }) {
  const [paramsText, setParamsText] = useState(JSON.stringify(content.params ?? {}, null, 2))
  const [error, setError] = useState(null)
  const applyParams = () => {
    try {
      onChange({ ...content, params: JSON.parse(paramsText || '{}') })
      setError(null)
    } catch {
      setError('Tham số phải là JSON hợp lệ, ví dụ {"values": [5, 1, 4]}')
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <Input label="Component hoạt ảnh" list="animation-list" value={content.component} onChange={(e) => onChange({ ...content, component: e.target.value })} />
        <datalist id="animation-list">
          {ANIMATIONS.map((name) => <option key={name} value={name} />)}
        </datalist>
      </div>
      <Textarea label="Tham số (JSON)" rows={4} className={CODE_FONT} value={paramsText} onChange={(e) => setParamsText(e.target.value)} onBlur={applyParams} error={error} />
    </div>
  )
}

function CodeBlockEditor({ content, onChange }) {
  const bind = (field) => ({ value: content[field] ?? '', onChange: (e) => onChange({ ...content, [field]: e.target.value }) })
  const code = (field) => ({ value: content[field] ?? '', language: content.language, onChange: (text) => onChange({ ...content, [field]: text }) })
  const isSql = content.language === 'sql'

  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-[180px_1fr]">
        <Select label="Ngôn ngữ" options={{ javascript: 'JavaScript', sql: 'SQL' }} {...bind('language')} />
        <Input label="Đề bài" {...bind('instructions')} />
      </div>
      {isSql && <LabeledCode label="SQL tạo bảng và dữ liệu mẫu (chạy trước, học viên không thấy)" {...code('setup')} />}
      <div className="grid gap-3 md:grid-cols-2">
        <LabeledCode label="Code ban đầu" {...code('starter')} />
        <LabeledCode label="Lời giải" {...code('solution')} />
      </div>
      {!isSql && <Input label="Kết quả in ra mong đợi (để chấm)" className={CODE_FONT} {...bind('expected')} />}
    </div>
  )
}

function LabeledCode({ label, ...props }) {
  return (
    <div className="min-w-0">
      <span className="mb-1 block text-sm font-semibold">{label}</span>
      <CodeEditor minHeight="6rem" {...props} />
    </div>
  )
}

function FlashcardEditor({ content, onChange }) {
  const cards = content.cards
  const setCard = (index, card) => onChange({ ...content, cards: replaceAt(cards, index, card) })

  return (
    <div className="space-y-2">
      {cards.map((card, index) => (
        <div key={index} className="flex items-start gap-2">
          <span className="w-6 pt-3 text-sm text-muted">{index + 1}</span>
          <Input placeholder="Mặt trước" value={card.front} onChange={(e) => setCard(index, { ...card, front: e.target.value })} />
          <Input placeholder="Mặt sau" value={card.back} onChange={(e) => setCard(index, { ...card, back: e.target.value })} />
          {cards.length > 1 && (
            <Button type="button" size="sm" variant="ghost" className="mt-1.5"
              onClick={() => onChange({ ...content, cards: cards.filter((_, i) => i !== index) })}>✕</Button>
          )}
        </div>
      ))}
      <Button type="button" size="sm" variant="outline" onClick={() => onChange({ ...content, cards: [...cards, { front: '', back: '' }] })}>
        + Thẻ
      </Button>
    </div>
  )
}

const EDITORS = {
  markdown: MarkdownEditor,
  video: VideoEditor,
  quiz: QuizEditor,
  animation: AnimationEditor,
  code: CodeBlockEditor,
  flashcard: FlashcardEditor,
}
