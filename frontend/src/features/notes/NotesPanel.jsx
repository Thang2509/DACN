import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Alert, Button, Textarea } from '../../components/ui'
import { formatDate, formatTime } from '../../lib/format'
import { BLOCK_TYPES } from '../lesson/blockTypes'
import { createNote, deleteNote, getNotes, updateNote } from './api'

// Khung ghi chú bên cạnh trình học bài.
// target: { blockId, videoTime } khi học viên bấm "Ghi chú" ở một khối; onJump(note) để cuộn/tua tới chỗ ghi chú.
export default function NotesPanel({ lessonId, blocks, canWrite, target, onClearTarget, onJump }) {
  const queryClient = useQueryClient()
  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['notes', { lessonId }],
    queryFn: () => getNotes({ lesson_id: lessonId }),
    enabled: canWrite,
  })
  const [text, setText] = useState('')
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['notes'] })
  const create = useMutation({
    mutationFn: () => createNote(lessonId, {
      content: text,
      lesson_block_id: target?.blockId ?? null,
      video_time: target?.videoTime ?? null,
    }),
    onSuccess: () => {
      setText('')
      onClearTarget()
      refresh()
    },
  })

  if (!canWrite) return <Alert>Đăng nhập để ghi chú bài học.</Alert>

  const labelOf = (note) => noteLabel(blocks, note.lesson_block_id, note.video_time)
  const submit = (e) => {
    e.preventDefault()
    if (text.trim()) create.mutate()
  }

  return (
    <div className="space-y-4">
      <form className="space-y-2" onSubmit={submit}>
        {target && (
          <div className="flex items-center gap-2 text-xs font-semibold text-primary-700">
            <span className="rounded-full bg-primary-100 px-2 py-0.5">Gắn với: {noteLabel(blocks, target.blockId, target.videoTime)}</span>
            <button type="button" onClick={onClearTarget} aria-label="Bỏ gắn">✕</button>
          </div>
        )}
        <Textarea rows={3} placeholder="Viết ghi chú…" value={text} onChange={(e) => setText(e.target.value)} />
        <Button size="sm" disabled={!text.trim() || create.isPending}>Lưu ghi chú</Button>
      </form>

      {isLoading && <p className="text-sm text-muted">Đang tải…</p>}
      {!isLoading && notes.length === 0 && <p className="text-sm text-muted">Chưa có ghi chú. Bấm “Ghi chú” ở mỗi khối để ghi chú gắn với khối đó.</p>}
      <ul className="space-y-3">
        {notes.map((note) => (
          <NoteItem key={note.id} note={note} label={labelOf(note)} onJump={() => onJump(note)} onChanged={refresh} />
        ))}
      </ul>
    </div>
  )
}

// "Khối 3 · Video · 01:23"
function noteLabel(blocks, blockId, videoTime) {
  if (!blockId) return 'Cả bài'
  const index = blocks.findIndex((block) => block.id === blockId)
  if (index === -1) return 'Khối đã bị xóa'
  const parts = [`Khối ${index + 1}`, BLOCK_TYPES[blocks[index].type].label]
  if (videoTime != null) parts.push(formatTime(videoTime))
  return parts.join(' · ')
}

export function NoteItem({ note, label, onJump, onChanged }) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(note.content)
  const save = useMutation({
    mutationFn: () => updateNote(note.id, text),
    onSuccess: () => {
      setEditing(false)
      onChanged()
    },
  })
  const remove = useMutation({ mutationFn: () => deleteNote(note.id), onSuccess: onChanged })

  return (
    <li className="space-y-2 rounded-xl border-2 border-primary-50 bg-white p-3">
      <div className="flex items-center gap-2 text-xs">
        <button type="button" className="font-semibold text-primary-600 hover:underline" onClick={onJump}>{label}</button>
        <span className="ml-auto text-muted">{formatDate(note.updated_at)}</span>
      </div>
      {editing ? (
        <>
          <Textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} />
          <div className="flex gap-2">
            <Button size="sm" onClick={() => save.mutate()} disabled={!text.trim() || save.isPending}>Lưu</Button>
            <Button size="sm" variant="ghost" onClick={() => { setText(note.content); setEditing(false) }}>Hủy</Button>
          </div>
        </>
      ) : (
        <>
          <p className="whitespace-pre-wrap text-sm">{note.content}</p>
          <div className="flex gap-3 text-xs font-semibold text-muted">
            <button type="button" className="hover:text-primary-600" onClick={() => setEditing(true)}>Sửa</button>
            <button type="button" className="hover:text-danger" onClick={() => confirm('Xóa ghi chú này?') && remove.mutate()}>Xóa</button>
          </div>
        </>
      )}
    </li>
  )
}
