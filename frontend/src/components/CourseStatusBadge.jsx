import { Badge } from './ui'

const STATUSES = {
  draft: ['Nháp', 'primary'],
  pending: ['Chờ duyệt', 'coin'],
  published: ['Đã xuất bản', 'success'],
  rejected: ['Bị từ chối', 'danger'],
}

export default function CourseStatusBadge({ status }) {
  const [label, color] = STATUSES[status] ?? [status, 'primary']
  return <Badge color={color}>{label}</Badge>
}
