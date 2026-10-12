// Các component giao diện cơ bản của design system

const BUTTON_VARIANTS = {
  primary: 'bg-primary-600 text-white border-b-4 border-primary-800 hover:bg-primary-500',
  accent: 'bg-accent-500 text-white border-b-4 border-accent-700 hover:bg-accent-400',
  outline: 'bg-white text-primary-700 border-2 border-b-4 border-primary-200 hover:bg-primary-50',
  ghost: 'text-primary-700 hover:bg-primary-50',
}

const BUTTON_SIZES = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5',
  lg: 'px-7 py-3.5 text-lg',
}

export function Button({ variant = 'primary', size = 'md', className = '', ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-bold transition
        active:translate-y-0.5 active:border-b-2 disabled:opacity-50 disabled:pointer-events-none
        ${BUTTON_VARIANTS[variant]} ${BUTTON_SIZES[size]} ${className}`}
      {...props}
    />
  )
}

export function Card({ className = '', ...props }) {
  return <div className={`rounded-2xl bg-white p-6 shadow-card ${className}`} {...props} />
}

const BADGE_COLORS = {
  primary: 'bg-primary-100 text-primary-800',
  accent: 'bg-accent-100 text-accent-800',
  xp: 'bg-primary-100 text-xp',
  coin: 'bg-amber-100 text-amber-700',
  streak: 'bg-accent-100 text-streak',
  success: 'bg-green-100 text-success',
  danger: 'bg-rose-100 text-danger',
}

export function Badge({ color = 'primary', className = '', ...props }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${BADGE_COLORS[color]} ${className}`}
      {...props}
    />
  )
}

const BAR_COLORS = {
  primary: 'bg-primary-500',
  accent: 'bg-accent-500',
  coin: 'bg-coin',
  success: 'bg-success',
}

export function ProgressBar({ value, max = 100, color = 'primary', label }) {
  const percent = Math.min(100, Math.round((value / max) * 100))
  return (
    <div>
      {label && (
        <div className="mb-1 flex justify-between text-sm font-semibold">
          <span>{label}</span>
          <span className="text-muted">{value}/{max}</span>
        </div>
      )}
      <div className="h-3 overflow-hidden rounded-full bg-primary-100">
        <div className={`h-full rounded-full transition-all ${BAR_COLORS[color]}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

const FIELD_CLASS = 'w-full rounded-xl border-2 bg-white px-4 py-2.5 outline-none transition focus:border-primary-500'

// Khung chung cho ô nhập: nhãn ở trên, lỗi ở dưới; w-full để ô giãn hết chỗ trống khi nằm trong hàng flex
function Field({ label, error, children }) {
  return (
    <label className="block w-full">
      {label && <span className="mb-1 block text-sm font-semibold">{label}</span>}
      {children}
      {error && <span className="mt-1 block text-sm text-danger">{error}</span>}
    </label>
  )
}

export function Input({ label, error, className = '', ...props }) {
  return (
    <Field label={label} error={error}>
      <input className={`${FIELD_CLASS} ${error ? 'border-danger' : 'border-primary-100'} ${className}`} {...props} />
    </Field>
  )
}

export function Textarea({ label, error, className = '', ...props }) {
  return (
    <Field label={label} error={error}>
      <textarea
        rows={4}
        className={`${FIELD_CLASS} ${error ? 'border-danger' : 'border-primary-100'} ${className}`}
        {...props}
      />
    </Field>
  )
}

export function Select({ label, error, options, className = '', ...props }) {
  return (
    <Field label={label} error={error}>
      <select className={`${FIELD_CLASS} ${error ? 'border-danger' : 'border-primary-100'} ${className}`} {...props}>
        {Object.entries(options).map(([value, text]) => (
          <option key={value} value={value}>{text}</option>
        ))}
      </select>
    </Field>
  )
}

// Ảnh đại diện, chưa có ảnh thì hiện chữ cái đầu của tên
export function Avatar({ user, size = 'size-9' }) {
  if (user.avatar_url) return <img src={user.avatar_url} alt="" className={`${size} rounded-full object-cover`} />
  return (
    <span className={`${size} grid shrink-0 place-items-center rounded-full bg-primary-500 font-bold text-white`}>
      {user.name.charAt(0).toUpperCase()}
    </span>
  )
}

const ALERT_TONES = {
  info: 'bg-primary-50 text-primary-800 border-primary-200',
  success: 'bg-green-50 text-green-800 border-green-200',
  warning: 'bg-amber-50 text-amber-800 border-amber-200',
  danger: 'bg-rose-50 text-rose-800 border-rose-200',
}

export function Alert({ tone = 'info', className = '', ...props }) {
  return <div className={`rounded-xl border-2 px-4 py-3 text-sm ${ALERT_TONES[tone]} ${className}`} {...props} />
}
