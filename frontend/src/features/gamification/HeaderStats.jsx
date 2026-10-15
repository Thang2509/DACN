import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Badge } from '../../components/ui'
import { rewardLabel, useGamification } from './api'

// Cấp, chuỗi ngày, xu trên thanh điều hướng + thông báo khi có phần thưởng mới
export default function HeaderStats() {
  const { data } = useGamification()
  if (!data) return null

  return (
    <>
      <div className="hidden items-center gap-1.5 2xl:flex">
        <Link to="/achievements" title="Xem thành tích"><Badge color="xp">Cấp {data.level}</Badge></Link>
        <Link to="/quests" title="Xem nhiệm vụ"><Badge color="streak">Chuỗi {data.streak.current} ngày</Badge></Link>
        <Link to="/achievements" title="Xem thành tích"><Badge color="coin">{data.coins} xu</Badge></Link>
      </div>
      <RewardToasts recent={data.recent} />
    </>
  )
}

const TOAST_SECONDS = 4.5

// Các dòng sổ cái có id lớn hơn mốc đã xem là phần thưởng mới
function RewardToasts({ recent }) {
  const queryClient = useQueryClient()
  const newestId = recent[0]?.id ?? 0
  const [seenId, setSeenId] = useState(null)
  // Lần tải đầu: coi mọi phần thưởng cũ là đã xem (cập nhật state ngay khi render, không cần effect)
  if (seenId === null) setSeenId(newestId)

  // Chỉ báo các lần được thưởng; lần tiêu xu (mua đồ) do chính người dùng bấm nên không cần báo
  const fresh = seenId === null ? [] : recent.filter((row) => row.id > seenId && (row.xp > 0 || row.coins > 0)).reverse()

  useEffect(() => {
    if (!fresh.length) return
    // Thú cưng lớn lên và đổi chỉ số theo phần thưởng
    queryClient.invalidateQueries({ queryKey: ['pets'] })
    queryClient.invalidateQueries({ queryKey: ['badges'] })
    const timer = setTimeout(() => setSeenId(newestId), TOAST_SECONDS * 1000)
    return () => clearTimeout(timer)
  }, [fresh.length, newestId, queryClient])

  if (!fresh.length) return null
  return (
    <div className="fixed right-4 bottom-20 z-50 flex w-72 flex-col gap-2 xl:bottom-4">
      {groupRewards(fresh).map((group) => (
        <div
          key={group.id}
          className={`animate-drop rounded-2xl border-2 bg-card px-4 py-3 shadow-card
            ${['level_up', 'badge'].includes(group.reason) ? 'border-accent-300' : 'border-primary-100'}`}
        >
          <p className="text-sm font-bold">{group.label}{group.count > 1 && ` ×${group.count}`}</p>
          <div className="mt-1 flex gap-1.5">
            {group.xp > 0 && <Badge color="xp">+{group.xp} XP</Badge>}
            {group.coins > 0 && <Badge color="coin">+{group.coins} xu</Badge>}
          </div>
        </div>
      ))}
    </div>
  )
}

// Gộp các phần thưởng giống nhau (vd. ôn 10 thẻ = 10 dòng +1 XP) thành một thông báo
function groupRewards(rows) {
  const groups = new Map()
  for (const row of rows) {
    const label = rewardLabel(row)
    const group = groups.get(label) ?? { id: row.id, reason: row.reason, label, xp: 0, coins: 0, count: 0 }
    groups.set(label, { ...group, xp: group.xp + row.xp, coins: group.coins + row.coins, count: group.count + 1 })
  }
  return [...groups.values()]
}
