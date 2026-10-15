import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Alert, Button, Card, Input, PageLoading, Textarea } from '../../components/ui'
import { AdminLayout } from './AdminPages'
import { deletePath, getPaths, savePath } from './api'

// Quản lý lộ trình học: tên, mô tả và danh sách khóa học theo thứ tự (hiện ở trang chủ)
export default function AdminPathsPage() {
  const { data, isLoading } = useQuery({ queryKey: ['admin-paths'], queryFn: getPaths })
  const [creating, setCreating] = useState(false)

  return (
    <AdminLayout title="Quản trị">
      {isLoading || !data ? (
        <PageLoading />
      ) : (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setCreating(true)} disabled={creating}>+ Tạo lộ trình</Button>
          </div>
          {creating && <PathEditor path={{ title: '', description: '', courses: [] }} courses={data.courses} onDone={() => setCreating(false)} />}
          {data.paths.map((path) => <PathEditor key={path.id} path={path} courses={data.courses} />)}
          {data.paths.length === 0 && !creating && <Card className="text-center text-muted">Chưa có lộ trình nào.</Card>}
        </div>
      )}
    </AdminLayout>
  )
}

function PathEditor({ path, courses, onDone }) {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState(path.title)
  const [description, setDescription] = useState(path.description ?? '')
  const [ids, setIds] = useState(path.courses.map((course) => course.id))
  const [adding, setAdding] = useState('')
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-paths'] })
    queryClient.invalidateQueries({ queryKey: ['learning-paths'] })
  }
  const save = useMutation({
    mutationFn: () => savePath({ id: path.id, title, description, course_ids: ids }),
    onSuccess: () => {
      refresh()
      onDone?.()
    },
  })
  const remove = useMutation({ mutationFn: () => deletePath(path.id), onSuccess: refresh })

  const titleOf = (id) => courses.find((course) => course.id === id)?.title ?? `Khóa #${id} (chưa xuất bản)`
  const move = (index, step) => {
    const next = [...ids]
    ;[next[index], next[index + step]] = [next[index + step], next[index]]
    setIds(next)
  }
  const available = courses.filter((course) => !ids.includes(course.id))

  return (
    <Card className="space-y-3">
      <div className="grid gap-3 md:grid-cols-2">
        <Input label="Tên lộ trình" value={title} onChange={(event) => setTitle(event.target.value)} />
        <Textarea label="Mô tả" rows={2} value={description} onChange={(event) => setDescription(event.target.value)} />
      </div>

      <div>
        <p className="mb-1 text-sm font-semibold">Khóa học theo thứ tự học</p>
        <ol className="space-y-1.5">
          {ids.map((id, index) => (
            <li key={id} className="flex items-center gap-2 rounded-xl bg-primary-50 px-3 py-1.5">
              <span className="font-bold text-muted">{index + 1}.</span>
              <span className="flex-1 font-semibold">{titleOf(id)}</span>
              <Button size="sm" variant="ghost" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Lên">↑</Button>
              <Button size="sm" variant="ghost" onClick={() => move(index, 1)} disabled={index === ids.length - 1} aria-label="Xuống">↓</Button>
              <Button size="sm" variant="ghost" onClick={() => setIds(ids.filter((item) => item !== id))}>Bỏ</Button>
            </li>
          ))}
          {ids.length === 0 && <li className="text-sm text-muted">Chưa có khóa học nào.</li>}
        </ol>
        {available.length > 0 && (
          <div className="mt-2 flex gap-2">
            <select
              className="flex-1 rounded-xl border-2 border-primary-100 bg-card px-3 py-2"
              value={adding}
              onChange={(event) => setAdding(event.target.value)}
            >
              <option value="">Chọn khóa học đã xuất bản…</option>
              {available.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
            </select>
            <Button
              variant="outline"
              disabled={!adding}
              onClick={() => {
                setIds([...ids, Number(adding)])
                setAdding('')
              }}
            >
              Thêm
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => save.mutate()} disabled={save.isPending || !title.trim()}>Lưu lộ trình</Button>
        {path.id ? (
          <Button variant="ghost" onClick={() => window.confirm(`Xóa lộ trình "${path.title}"?`) && remove.mutate()} disabled={remove.isPending}>
            Xóa
          </Button>
        ) : (
          <Button variant="ghost" onClick={onDone}>Hủy</Button>
        )}
        {save.isSuccess && path.id && <span className="self-center text-sm font-semibold text-success">Đã lưu</span>}
      </div>
      {save.error && <Alert tone="danger">{Object.values(save.error.errors ?? {})[0]?.[0] ?? save.error.message}</Alert>}
    </Card>
  )
}
