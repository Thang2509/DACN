import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Alert, Badge, Button, Card, PageLoading, ProgressBar } from '../../components/ui'
import { refreshRewardsSoon } from '../gamification/api'
import { getReviews, reviewCard } from './api'
import { FlipCard } from './Blocks'

// Nút đánh giá mức nhớ (SM-2); phím tắt 1–4
const RATINGS = [
  { key: 'again', label: 'Quên', className: 'border-rose-200 text-danger' },
  { key: 'hard', label: 'Khó', className: 'border-amber-200 text-amber-700' },
  { key: 'good', label: 'Nhớ', className: 'border-primary-200 text-primary-700' },
  { key: 'easy', label: 'Dễ', className: 'border-green-200 text-success' },
]

export default function ReviewPage() {
  const { data, isLoading } = useQuery({ queryKey: ['reviews'], queryFn: getReviews })
  if (isLoading || !data) return <PageLoading />

  const { stats } = data
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Ôn tập</h1>
          <p className="text-muted">Lặp lại ngắt quãng: thẻ nhớ tốt sẽ được hẹn ôn thưa dần.</p>
        </div>
        <div className="ml-auto flex gap-1.5">
          <Badge color="accent">Đến hạn {stats.due}</Badge>
          <Badge color="success">Đã thuộc {stats.learned}/{stats.total}</Badge>
        </div>
      </div>
      {data.cards.length ? <ReviewSession cards={data.cards} /> : <NothingDue stats={stats} />}
    </div>
  )
}

function NothingDue({ stats }) {
  return (
    <Card className="space-y-3 text-center">
      <p className="text-xl font-bold">Hôm nay không còn thẻ nào cần ôn.</p>
      <p className="text-muted">
        {stats.total === 0
          ? 'Thẻ flashcard của bài học sẽ vào đây sau khi bạn hoàn thành bài đó.'
          : `Ngày mai có ${stats.tomorrow} thẻ đến hạn.`}
      </p>
      <Link to="/my-courses"><Button variant="outline">Về khóa học của tôi</Button></Link>
    </Card>
  )
}

// Một phiên ôn: danh sách thẻ chụp lại lúc mở trang, ôn lần lượt từng thẻ
function ReviewSession({ cards }) {
  const queryClient = useQueryClient()
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const rate = useMutation({
    mutationFn: (rating) => reviewCard(cards[index].id, rating),
    onSuccess: () => {
      setIndex(index + 1)
      setFlipped(false)
      if (index + 1 === cards.length) {
        queryClient.invalidateQueries({ queryKey: ['reviews'] })
        refreshRewardsSoon(queryClient)
      }
    },
  })
  const card = cards[index]

  // Space lật thẻ, 1–4 chấm điểm sau khi đã lật
  useEffect(() => {
    if (!card) return
    const onKey = (event) => {
      if (event.code === 'Space') {
        event.preventDefault()
        setFlipped((value) => !value)
      }
      const rating = RATINGS[Number(event.key) - 1]
      if (flipped && rating && !rate.isPending) rate.mutate(rating.key)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [card, flipped, rate])

  if (!card) {
    return (
      <Card className="space-y-3 text-center">
        <p className="text-5xl">🎉</p>
        <p className="text-xl font-bold">Xong phiên ôn tập: {cards.length} thẻ.</p>
        <p className="text-muted">Mỗi thẻ đến hạn được 1 XP (tối đa 30 XP mỗi ngày) và tính vào nhiệm vụ ôn thẻ.</p>
        <Link to="/quests"><Button variant="outline">Xem nhiệm vụ</Button></Link>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <ProgressBar value={index} max={cards.length} label={`Thẻ ${index + 1}/${cards.length}`} />
      <p className="text-center text-sm text-muted">
        {card.course.title} · {card.lesson} {card.is_new && <Badge color="accent">Mới</Badge>}
      </p>
      <FlipCard front={card.front} back={card.back} flipped={flipped} onFlip={() => setFlipped(!flipped)} />

      {flipped ? (
        <div className="grid grid-cols-4 gap-2">
          {RATINGS.map((rating, i) => (
            <button
              key={rating.key}
              type="button"
              onClick={() => rate.mutate(rating.key)}
              disabled={rate.isPending}
              className={`rounded-xl border-2 border-b-4 bg-card px-2 py-2 font-bold transition hover:bg-primary-50 disabled:opacity-50 ${rating.className}`}
            >
              {rating.label}
              <span className="block text-xs font-semibold text-muted">
                {card.next_days[rating.key]} ngày · phím {i + 1}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <p className="text-center text-sm text-muted">Nhớ lại mặt sau rồi bấm vào thẻ (hoặc phím Space) để lật.</p>
      )}
      {rate.error && <Alert tone="danger">{rate.error.message}</Alert>}
    </div>
  )
}
