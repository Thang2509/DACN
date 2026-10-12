import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Alert, Avatar, Badge, Button, Card, Input, Textarea } from '../../components/ui'
import { fieldError } from '../../lib/api'
import { useForm } from '../../lib/useForm'
import { updateAvatar, updatePassword, updateProfile, useUser } from './api'

const ROLE_LABELS = { student: 'Học viên', instructor: 'Giảng viên', admin: 'Quản trị viên' }

export default function ProfilePage() {
  const { user } = useUser()

  return (
    <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-[260px_1fr]">
      <AvatarCard user={user} />
      <div className="space-y-6">
        <InfoForm user={user} />
        <PasswordForm />
      </div>
    </div>
  )
}

function AvatarCard({ user }) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: updateAvatar,
    onSuccess: (updated) => queryClient.setQueryData(['me'], updated),
  })

  return (
    <Card className="space-y-3 text-center">
      <div className="flex justify-center">
        <Avatar user={user} size="size-28 text-4xl" />
      </div>
      <p className="font-bold">{user.name}</p>
      <Badge>{ROLE_LABELS[user.role]}</Badge>
      <label className="block cursor-pointer text-sm font-semibold text-primary-600">
        {mutation.isPending ? 'Đang tải lên…' : 'Đổi ảnh đại diện'}
        <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files[0] && mutation.mutate(e.target.files[0])} />
      </label>
      {fieldError(mutation.error, 'avatar') && <p className="text-sm text-danger">{fieldError(mutation.error, 'avatar')}</p>}
    </Card>
  )
}

function InfoForm({ user }) {
  const queryClient = useQueryClient()
  const { values, bind } = useForm({ name: user.name, bio: user.bio ?? '' })
  const mutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (updated) => queryClient.setQueryData(['me'], updated),
  })
  const submit = (e) => {
    e.preventDefault()
    mutation.mutate(values)
  }

  return (
    <Card>
      <form className="space-y-4" onSubmit={submit}>
        <h2 className="text-lg font-bold">Thông tin cá nhân</h2>
        {mutation.isSuccess && <Alert tone="success">Đã lưu thay đổi.</Alert>}
        <Input label="Email" value={user.email} disabled />
        <Input label="Họ tên" {...bind('name')} error={fieldError(mutation.error, 'name')} />
        <Textarea label="Giới thiệu" {...bind('bio')} error={fieldError(mutation.error, 'bio')} />
        <Button disabled={mutation.isPending}>Lưu</Button>
      </form>
    </Card>
  )
}

function PasswordForm() {
  const empty = { current_password: '', password: '', password_confirmation: '' }
  const { values, setValues, bind } = useForm(empty)
  const mutation = useMutation({ mutationFn: updatePassword, onSuccess: () => setValues(empty) })
  const submit = (e) => {
    e.preventDefault()
    mutation.mutate(values)
  }

  return (
    <Card>
      <form className="space-y-4" onSubmit={submit}>
        <h2 className="text-lg font-bold">Đổi mật khẩu</h2>
        {mutation.isSuccess && <Alert tone="success">{mutation.data.message}</Alert>}
        <Input label="Mật khẩu hiện tại" type="password" autoComplete="current-password" {...bind('current_password')} error={fieldError(mutation.error, 'current_password')} />
        <Input label="Mật khẩu mới" type="password" autoComplete="new-password" {...bind('password')} error={fieldError(mutation.error, 'password')} />
        <Input label="Nhập lại mật khẩu mới" type="password" autoComplete="new-password" {...bind('password_confirmation')} />
        <Button disabled={mutation.isPending}>Đổi mật khẩu</Button>
      </form>
    </Card>
  )
}
