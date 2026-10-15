import { useState } from 'react'
import { Link } from 'react-router-dom'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { BarChart, HorizontalBars, StatCard } from '../../components/Charts'
import { Button, Card, PageLoading } from '../../components/ui'
import { getInstructorStats } from './api'

// Thống kê khóa học của giảng viên: học viên, tỉ lệ hoàn thành, bài nào học viên dừng lại, câu quiz nào hay sai
export default function InstructorStatsPage() {
  const [courseId, setCourseId] = useState(null)
  const { data, isLoading } = useQuery({
    queryKey: ['instructor-stats', courseId],
    queryFn: () => getInstructorStats(courseId),
    placeholderData: keepPreviousData,
  })
  if (isLoading || !data) return <PageLoading />

  const { course } = data
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-extrabold">Thống kê khóa học</h1>
        <Link to="/instructor" className="ml-auto text-sm font-semibold text-primary-600">← Khóa học của tôi</Link>
      </div>

      {!course ? (
        <Card className="text-center text-muted">Bạn chưa có khóa học nào.</Card>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {data.courses.map((item) => (
              <Button key={item.id} size="sm" variant={item.id === course.id ? 'primary' : 'outline'} onClick={() => setCourseId(item.id)}>
                {item.title}
              </Button>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Học viên đăng ký" value={course.enrollments} />
            <StatCard label="Đã học xong khóa" value={course.completed} />
            <StatCard label="Tỉ lệ hoàn thành" value={`${course.completion_rate}%`} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="space-y-2">
              <h2 className="font-bold">Đăng ký mới (30 ngày)</h2>
              <BarChart data={course.new_enrollments} />
            </Card>
            <Card className="space-y-3">
              <h2 className="font-bold">Số học viên hoàn thành từng bài</h2>
              <p className="text-xs text-muted">Bài bị giảm mạnh so với bài trước thường là chỗ học viên bỏ dở.</p>
              <HorizontalBars items={course.lessons.map((lesson) => ({ label: lesson.title, value: lesson.completed }))} />
            </Card>
          </div>

          <Card className="space-y-3">
            <h2 className="font-bold">Câu quiz học viên hay sai nhất</h2>
            <p className="text-xs text-muted">Tính trên lượt làm đầu tiên của mỗi học viên.</p>
            {course.hardest_questions.length === 0 ? (
              <p className="text-sm text-muted">Chưa có học viên làm quiz.</p>
            ) : (
              <ul className="divide-y divide-primary-100">
                {course.hardest_questions.map((question, i) => (
                  <li key={i} className="flex flex-wrap items-center gap-3 py-2.5">
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{question.question}</span>
                      <span className="text-xs text-muted">{question.lesson} · {question.answered} lượt trả lời</span>
                    </span>
                    <span className={`text-lg font-extrabold ${question.correct_rate < 50 ? 'text-danger' : 'text-success'}`}>
                      {question.correct_rate}% đúng
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
