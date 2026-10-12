import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Alert, Button, Card, Input } from '../../components/ui'
import { fieldError } from '../../lib/api'
import { useForm } from '../../lib/useForm'
import { canTeach, forgotPassword, login, register, resetPassword, verifyEmail } from './api'

function AuthCard({ title, children, footer }) {
  return (
    <div className="mx-auto max-w-md space-y-4 py-6">
      <Card className="space-y-5">
        <h1 className="text-center text-2xl font-extrabold">{title}</h1>
        {children}
      </Card>
      {footer && <p className="text-center text-sm text-muted">{footer}</p>}
    </div>
  )
}

// Lỗi không gắn với trường nào (mất mạng, lỗi máy chủ…)
function GeneralError({ error }) {
  if (!error || error.errors) return null
  return <Alert tone="danger">{error.message}</Alert>
}

// Sau khi đăng nhập: về trang định vào trước đó, hoặc trang phù hợp vai trò
function useAfterLogin() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [params] = useSearchParams()

  return (user) => {
    queryClient.setQueryData(['me'], user)
    navigate(params.get('redirect') || (canTeach(user) ? '/instructor' : '/'), { replace: true })
  }
}

export function LoginPage() {
  const afterLogin = useAfterLogin()
  const { values, bind } = useForm({ email: '', password: '' })
  const mutation = useMutation({ mutationFn: login, onSuccess: afterLogin })
  const submit = (e) => {
    e.preventDefault()
    mutation.mutate({ ...values, remember: true })
  }

  return (
    <AuthCard title="Đăng nhập" footer={<>Chưa có tài khoản? <Link className="font-semibold text-primary-600" to="/register">Đăng ký</Link></>}>
      <form className="space-y-4" onSubmit={submit}>
        <GeneralError error={mutation.error} />
        <Input label="Email" type="email" autoComplete="email" {...bind('email')} error={fieldError(mutation.error, 'email')} />
        <Input label="Mật khẩu" type="password" autoComplete="current-password" {...bind('password')} error={fieldError(mutation.error, 'password')} />
        <div className="text-right text-sm">
          <Link className="text-primary-600" to="/forgot-password">Quên mật khẩu?</Link>
        </div>
        <Button className="w-full" disabled={mutation.isPending}>Đăng nhập</Button>
      </form>
    </AuthCard>
  )
}

export function RegisterPage() {
  const afterLogin = useAfterLogin()
  const { values, bind } = useForm({ name: '', email: '', password: '', password_confirmation: '' })
  const mutation = useMutation({ mutationFn: register, onSuccess: afterLogin })
  const submit = (e) => {
    e.preventDefault()
    mutation.mutate(values)
  }

  return (
    <AuthCard title="Tạo tài khoản" footer={<>Đã có tài khoản? <Link className="font-semibold text-primary-600" to="/login">Đăng nhập</Link></>}>
      <form className="space-y-4" onSubmit={submit}>
        <GeneralError error={mutation.error} />
        <Input label="Họ tên" autoComplete="name" {...bind('name')} error={fieldError(mutation.error, 'name')} />
        <Input label="Email" type="email" autoComplete="email" {...bind('email')} error={fieldError(mutation.error, 'email')} />
        <Input label="Mật khẩu" type="password" autoComplete="new-password" placeholder="Ít nhất 8 ký tự, có chữ và số" {...bind('password')} error={fieldError(mutation.error, 'password')} />
        <Input label="Nhập lại mật khẩu" type="password" autoComplete="new-password" {...bind('password_confirmation')} />
        <Button className="w-full" disabled={mutation.isPending}>Đăng ký</Button>
      </form>
    </AuthCard>
  )
}

export function ForgotPasswordPage() {
  const { values, bind } = useForm({ email: '' })
  const mutation = useMutation({ mutationFn: forgotPassword })
  const submit = (e) => {
    e.preventDefault()
    mutation.mutate(values)
  }

  return (
    <AuthCard title="Quên mật khẩu" footer={<Link className="font-semibold text-primary-600" to="/login">Quay lại đăng nhập</Link>}>
      <form className="space-y-4" onSubmit={submit}>
        {mutation.isSuccess && <Alert tone="success">{mutation.data.message}</Alert>}
        <GeneralError error={mutation.error} />
        <p className="text-sm text-muted">Nhập email đã đăng ký, chúng tôi sẽ gửi link đặt lại mật khẩu.</p>
        <Input label="Email" type="email" {...bind('email')} error={fieldError(mutation.error, 'email')} />
        <Button className="w-full" disabled={mutation.isPending}>Gửi link</Button>
      </form>
    </AuthCard>
  )
}

export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const { values, bind } = useForm({ password: '', password_confirmation: '' })
  const mutation = useMutation({ mutationFn: resetPassword })
  const submit = (e) => {
    e.preventDefault()
    mutation.mutate({ ...values, token: params.get('token'), email: params.get('email') })
  }

  if (mutation.isSuccess) {
    return (
      <AuthCard title="Đặt lại mật khẩu">
        <Alert tone="success">{mutation.data.message}</Alert>
        <Link to="/login"><Button className="w-full">Đăng nhập</Button></Link>
      </AuthCard>
    )
  }

  return (
    <AuthCard title="Đặt lại mật khẩu">
      <form className="space-y-4" onSubmit={submit}>
        <GeneralError error={mutation.error} />
        {fieldError(mutation.error, 'email') && <Alert tone="danger">{fieldError(mutation.error, 'email')}</Alert>}
        <Input label="Mật khẩu mới" type="password" autoComplete="new-password" {...bind('password')} error={fieldError(mutation.error, 'password')} />
        <Input label="Nhập lại mật khẩu" type="password" autoComplete="new-password" {...bind('password_confirmation')} />
        <Button className="w-full" disabled={mutation.isPending}>Đổi mật khẩu</Button>
      </form>
    </AuthCard>
  )
}

// Mở từ link trong email: /email/verify/:id/:hash?expires=...&signature=...
export function VerifyEmailPage() {
  const { pathname, search } = useLocation()
  const queryClient = useQueryClient()
  const { isPending, isSuccess, error } = useQuery({
    queryKey: ['verify-email', pathname + search],
    queryFn: async () => {
      const result = await verifyEmail(pathname + search)
      queryClient.invalidateQueries({ queryKey: ['me'] })
      return result
    },
    retry: false,
  })

  return (
    <AuthCard title="Xác thực email">
      {isPending && <p className="text-center text-muted">Đang xác thực…</p>}
      {isSuccess && <Alert tone="success">Xác thực email thành công. Bạn đã có thể dùng đầy đủ tính năng.</Alert>}
      {error && <Alert tone="danger">Link không hợp lệ hoặc đã hết hạn. Hãy đăng nhập và bấm “Gửi lại email xác thực”.</Alert>}
      <Link to="/"><Button variant="outline" className="w-full">Về trang chủ</Button></Link>
    </AuthCard>
  )
}
