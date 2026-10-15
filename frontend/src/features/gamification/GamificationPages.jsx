import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Avatar, Badge, Button, Card, PageLoading, ProgressBar, Skeleton } from '../../components/ui'
import { formatDate } from '../../lib/format'
import { useUser } from '../auth/api'
import { getBadges, getLeaderboard, rewardLabel, saveStudyPlan, useGamification } from './api'

// Ba trang trò chơi hóa, mỗi trang một mục trên menu: Nhiệm vụ, Thành tích, Bảng xếp hạng

function PageTitle({ title, children }) {
  return (
    <div>
      <h1 className="text-3xl font-extrabold">{title}</h1>
      <p className="text-muted">{children}</p>
    </div>
  )
}

// Nhiệm vụ: chuỗi ngày học, kế hoạch học tập, nhiệm vụ ngày và tuần
export function QuestsPage() {
  const { data, isLoading } = useGamification()
  if (isLoading || !data) return <PageLoading title="Nhiệm vụ" />

  const daily = data.quests.filter((quest) => quest.period === 'daily')
  const weekly = data.quests.filter((quest) => quest.period === 'weekly')

  return (
    <div className="space-y-6">
      <PageTitle title="Nhiệm vụ">Học đều mỗi ngày, hoàn thành nhiệm vụ để nhận thêm XP và xu.</PageTitle>
      <Card className="flex flex-wrap items-center gap-x-6 gap-y-1">
        <div>
          <p className="text-sm font-semibold text-muted">Chuỗi ngày học</p>
          <p className="text-4xl font-extrabold text-streak">{data.streak.current} ngày</p>
        </div>
        <p className="font-semibold">
          {data.streak.studied_today ? 'Hôm nay bạn đã học rồi, giữ vững nhé!' : 'Hoàn thành 1 bài hôm nay để giữ chuỗi.'}
        </p>
        <Link to="/review" className="ml-auto"><Button variant="outline">Ôn tập flashcard</Button></Link>
      </Card>
      <StudyPlanCard plan={data.plan} />
      <div className="grid gap-4 md:grid-cols-2">
        <QuestList title="Nhiệm vụ hôm nay" quests={daily} />
        <QuestList title="Nhiệm vụ tuần này" quests={weekly} />
      </div>
    </div>
  )
}

// Thành tích: cấp độ, xu, chuỗi dài nhất, huy hiệu, lịch sử nhận thưởng
export function AchievementsPage() {
  const { data, isLoading } = useGamification()
  if (isLoading || !data) return <PageLoading title="Thành tích" />

  return (
    <div className="space-y-6">
      <PageTitle title="Thành tích">Cấp độ, huy hiệu và mọi phần thưởng bạn đã nhận.</PageTitle>
      <div className="grid gap-4 md:grid-cols-3">
        <LevelCard data={data} />
        <Card className="space-y-1">
          <p className="text-sm font-semibold text-muted">Xu</p>
          <p className="text-4xl font-extrabold text-amber-600">{data.coins}</p>
          <p className="text-sm text-muted">Dùng để đổi voucher giảm giá và mua đồ cho thú cưng.</p>
        </Card>
        <Card className="space-y-1">
          <p className="text-sm font-semibold text-muted">Chuỗi ngày dài nhất</p>
          <p className="text-4xl font-extrabold text-streak">{data.streak.longest} ngày</p>
        </Card>
      </div>

      <BadgeGrid />

      <Card>
        <h2 className="mb-3 text-xl font-bold">Lịch sử XP và xu</h2>
        {data.recent.length === 0 && <p className="text-muted">Chưa có phần thưởng nào. Hãy bắt đầu học một bài!</p>}
        <ul className="divide-y divide-primary-100">
          {data.recent.map((row) => (
            <li key={row.id} className="flex flex-wrap items-center gap-2 py-2.5">
              <span className="font-semibold">{rewardLabel(row)}</span>
              <span className="text-xs text-muted">{new Date(row.created_at).toLocaleString('vi-VN')}</span>
              <span className="ml-auto flex gap-1.5">
                {row.xp > 0 && <Badge color="xp">+{row.xp} XP</Badge>}
                {row.coins > 0 && <Badge color="coin">+{row.coins} xu</Badge>}
                {row.coins < 0 && <Badge color="danger">{row.coins} xu</Badge>}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}

function LevelCard({ data }) {
  const gained = data.xp - data.level_start_xp
  const needed = data.next_level_xp - data.level_start_xp

  return (
    <Card className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="grid size-14 place-items-center rounded-2xl bg-primary-600 text-2xl font-extrabold text-white">
          {data.level}
        </span>
        <div>
          <p className="text-sm font-semibold text-muted">Cấp độ</p>
          <p className="font-bold">{data.xp} XP</p>
        </div>
      </div>
      <ProgressBar value={gained} max={needed} />
      <p className="text-sm text-muted">Còn {needed - gained} XP để lên cấp {data.level + 1}</p>
    </Card>
  )
}

function QuestList({ title, quests }) {
  return (
    <Card className="space-y-4">
      <h2 className="text-xl font-bold">{title}</h2>
      {quests.map((quest) => (
        <div key={quest.id} className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`font-semibold ${quest.completed ? 'text-success' : ''}`}>
              {quest.completed && '✓ '}{quest.title}
            </span>
            <span className="ml-auto flex gap-1.5">
              <Badge color="xp">{quest.reward_xp} XP</Badge>
              <Badge color="coin">{quest.reward_coins} xu</Badge>
            </span>
          </div>
          <ProgressBar value={quest.progress} max={quest.target_value} color={quest.completed ? 'success' : 'accent'} />
          <p className="text-right text-xs text-muted">{quest.progress}/{quest.target_value}</p>
        </div>
      ))}
    </Card>
  )
}

const WEEKDAYS = { 1: 'T2', 2: 'T3', 3: 'T4', 4: 'T5', 5: 'T6', 6: 'T7', 7: 'CN' }

// Kế hoạch học tập: chọn ngày học trong tuần và số bài mỗi ngày, xem tiến độ hôm nay
function StudyPlanCard({ plan }) {
  const queryClient = useQueryClient()
  const [days, setDays] = useState(plan.study_days)
  const [perDay, setPerDay] = useState(plan.lessons_per_day)
  const save = useMutation({
    mutationFn: () => saveStudyPlan(days, perDay),
    onSuccess: (saved) => queryClient.setQueryData(['gamification'], (old) => ({ ...old, plan: saved })),
  })
  const toggle = (day) => setDays(days.includes(day) ? days.filter((item) => item !== day) : [...days, day])
  const dirty = [...days].sort().join() !== plan.study_days.join() || perDay !== plan.lessons_per_day
  const reached = plan.done_today >= plan.lessons_per_day

  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-xl font-bold">Kế hoạch học tập</h2>
        {plan.has_plan && (
          <span className={`ml-auto text-sm font-semibold ${reached ? 'text-success' : ''}`}>
            {plan.is_study_day ? `Hôm nay: ${plan.done_today}/${plan.lessons_per_day} bài${reached ? ' ✓' : ''}` : 'Hôm nay là ngày nghỉ'}
          </span>
        )}
      </div>
      {plan.has_plan && plan.is_study_day && (
        <ProgressBar value={Math.min(plan.done_today, plan.lessons_per_day)} max={plan.lessons_per_day} color={reached ? 'success' : 'primary'} />
      )}
      {!plan.has_plan && <p className="text-sm text-muted">Chọn những ngày bạn sẽ học và số bài mỗi ngày, trang chủ sẽ nhắc việc hôm nay.</p>}
      <div className="flex flex-wrap items-center gap-2">
        {Object.entries(WEEKDAYS).map(([key, label]) => {
          const day = Number(key)
          return (
            <button
              key={day}
              type="button"
              onClick={() => toggle(day)}
              className={`size-10 rounded-xl border-2 font-bold transition
                ${days.includes(day) ? 'border-primary-500 bg-primary-600 text-white' : 'border-primary-100 text-muted hover:border-primary-300'}`}
            >
              {label}
            </button>
          )
        })}
        <label className="ml-auto flex items-center gap-2 text-sm font-semibold">
          Mỗi ngày
          <input
            type="number"
            min={1}
            max={10}
            value={perDay}
            onChange={(event) => setPerDay(Math.max(1, Math.min(10, Number(event.target.value) || 1)))}
            className="w-16 rounded-xl border-2 border-primary-100 bg-card px-2 py-1.5 text-center"
          />
          bài
        </label>
        <Button size="sm" onClick={() => save.mutate()} disabled={!dirty || days.length === 0 || save.isPending}>Lưu</Button>
      </div>
    </Card>
  )
}

// Huy hiệu đã đạt (sáng màu) và chưa đạt (mờ, kèm tiến độ)
function BadgeGrid() {
  const { data: badges = [] } = useQuery({ queryKey: ['badges'], queryFn: getBadges })
  const earned = badges.filter((badge) => badge.earned_at).length

  return (
    <Card className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xl font-bold">Huy hiệu</h2>
        <span className="text-sm font-semibold text-muted">Đã đạt {earned}/{badges.length}</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {badges.map((badge) => (
          <div
            key={badge.id}
            className={`space-y-1.5 rounded-2xl border-2 p-3 text-center ${badge.earned_at ? 'border-accent-300 bg-accent-50' : 'border-primary-100'}`}
          >
            <span className={`block text-4xl ${badge.earned_at ? '' : 'opacity-40 grayscale'}`}>{badge.icon}</span>
            <p className="font-bold">{badge.name}</p>
            <p className="text-xs text-muted">{badge.description}</p>
            {badge.earned_at ? (
              <Badge color="success">Đạt ngày {formatDate(badge.earned_at)}</Badge>
            ) : (
              <div className="space-y-1">
                <div className="h-2 overflow-hidden rounded-full bg-primary-100">
                  <div className="h-full rounded-full bg-accent-500" style={{ width: `${(badge.progress / badge.condition_value) * 100}%` }} />
                </div>
                <p className="text-xs text-muted">{badge.progress}/{badge.condition_value} · +{badge.reward_coins} xu</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}

const PERIODS = { week: 'Tuần này', last_week: 'Tuần trước', all: 'Mọi thời gian' }
const MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' }

// Bảng xếp hạng theo XP: top 20 và hạng của chính mình
export function LeaderboardPage() {
  const { user } = useUser()
  const [period, setPeriod] = useState('week')
  const { data, isLoading } = useQuery({ queryKey: ['leaderboard', period], queryFn: () => getLeaderboard(period) })

  return (
    <div className="space-y-6">
      <PageTitle title="Bảng xếp hạng">Xếp theo XP nhận được trong kỳ, tuần mới bắt đầu từ thứ Hai.</PageTitle>
      <Card className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {Object.entries(PERIODS).map(([key, label]) => (
            <Button key={key} size="sm" variant={period === key ? 'primary' : 'outline'} onClick={() => setPeriod(key)}>
              {label}
            </Button>
          ))}
          {data?.from && <span className="ml-auto text-sm text-muted">{formatDate(data.from)} – {formatDate(data.to)}</span>}
        </div>

        {isLoading || !data ? (
          <Skeleton className="h-48" />
        ) : data.top.length === 0 ? (
          <p className="text-muted">Chưa có ai nhận XP trong kỳ này. Hãy là người đầu tiên!</p>
        ) : (
          <ol className="divide-y divide-primary-100">
            {data.top.map((row) => (
              <li key={row.user_id} className={`flex items-center gap-3 px-2 py-2.5 ${row.user_id === user?.id ? 'rounded-xl bg-primary-50' : ''}`}>
                <span className="w-8 text-center text-lg font-extrabold text-muted">{MEDALS[row.rank] ?? row.rank}</span>
                <Avatar user={{ name: row.name, avatar_url: row.avatar_url }} />
                <span className="min-w-0 flex-1 truncate font-semibold">
                  {row.name}
                  {row.user_id === user?.id && ' (bạn)'}
                </span>
                <span className="text-sm text-muted">Cấp {row.level}</span>
                <span className="w-20 text-right font-extrabold text-xp">{row.xp} XP</span>
              </li>
            ))}
          </ol>
        )}

        {data && (
          <p className="text-sm font-semibold">
            {data.me ? `Bạn đang hạng ${data.me.rank} với ${data.me.xp} XP.` : 'Bạn chưa có XP trong kỳ này, học một bài để có tên trên bảng.'}
          </p>
        )}
      </Card>
    </div>
  )
}
