import { Component } from 'react'
import { Button, Card } from './ui'

/**
 * Bắt lỗi xảy ra khi vẽ phần giao diện bên trong (kể cả lỗi tải chunk sau khi cập nhật bản mới):
 * hiện thông báo thay vì làm trắng cả trang. fallback: giao diện thay thế riêng (vd. cho cảnh 3D).
 */
export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error(error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    if (this.props.fallback) return this.props.fallback

    return (
      <Card className="mx-auto max-w-lg space-y-3 text-center">
        <p className="text-xl font-bold">Trang này gặp sự cố</p>
        <p className="text-sm text-muted">Có thể do mạng chập chờn hoặc trang vừa được cập nhật. Hãy thử tải lại.</p>
        <Button onClick={() => window.location.reload()}>Tải lại trang</Button>
      </Card>
    )
  }
}

// Thay cho khung 3D khi trình duyệt không bật được WebGL hoặc không tải được mô hình
export function SceneFallback() {
  return (
    <div className="grid h-full place-items-center bg-primary-50 p-6 text-center">
      <p className="max-w-xs text-sm font-semibold text-muted">
        Không hiển thị được cảnh 3D. Hãy bật tăng tốc phần cứng (WebGL) trong trình duyệt hoặc thử trình duyệt khác.
      </p>
    </div>
  )
}
