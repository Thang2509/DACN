import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Alert, Badge, Button, Card, PageLoading } from '../../components/ui'
import { refreshRewardsSoon } from '../gamification/api'
import { getMinigame, getPets, submitScore } from './api'
import KeywordGame from './KeywordGame'
import { coinsFor, GAMES, REWARDED_PLAYS_PER_DAY } from './minigames'
import { PetNav } from './PetPage'
import RunnerGame from './RunnerGame'

const GAME_COMPONENTS = { runner: RunnerGame, keywords: KeywordGame }

// Minigame với thú đồng hành: chọn game → chơi → gửi điểm → xem thưởng và bảng điểm cao
export default function MinigamesPage() {
  const { data, isLoading } = useQuery({ queryKey: ['pets'], queryFn: getPets })
  const [game, setGame] = useState(null)
  if (isLoading || !data) return <PageLoading />

  const pet = data.pets.find((item) => item.is_active)
  let content
  if (!pet) {
    content = <Card className="text-center">Hãy <Link to="/pet" className="font-semibold text-primary-600">nhận trứng</Link> trước khi chơi minigame.</Card>
  } else if (game) {
    content = <Playing key={game} game={game} pet={pet} onExit={() => setGame(null)} />
  } else {
    content = (
      <div className="grid gap-4 md:grid-cols-2">
        {Object.keys(GAMES).map((key) => <GameCard key={key} game={key} onPlay={() => setGame(key)} />)}
      </div>
    )
  }

  return (
    <>
      <PetNav />
      {content}
    </>
  )
}

function GameCard({ game, onPlay }) {
  const { data: board } = useQuery({ queryKey: ['minigame', game], queryFn: () => getMinigame(game) })
  const info = GAMES[game]

  return (
    <Card className="flex flex-col gap-3">
      <h2 className="text-2xl font-extrabold">{info.title}</h2>
      <p className="text-muted">{info.description}</p>
      <p className="text-sm"><b>Điều khiển:</b> {info.controls}</p>
      {board && (
        <div className="flex flex-wrap gap-1.5">
          <Badge>Kỷ lục của bạn: {board.my_best}</Badge>
          <Badge color="coin">Còn {board.rewarded_plays_left}/{REWARDED_PLAYS_PER_DAY} lượt có thưởng hôm nay</Badge>
        </div>
      )}
      <Button className="mt-auto" onClick={onPlay}>Chơi</Button>
    </Card>
  )
}

// Một lượt chơi; "Chơi lại" tạo lượt mới bằng cách đổi key của game
function Playing({ game, pet, onExit }) {
  const queryClient = useQueryClient()
  const [round, setRound] = useState(1)
  const { data: board } = useQuery({ queryKey: ['minigame', game], queryFn: () => getMinigame(game) })
  const submit = useMutation({
    mutationFn: ({ score, duration }) => submitScore(game, score, duration),
    onSuccess: (result) => {
      queryClient.setQueryData(['minigame', game], result)
      queryClient.invalidateQueries({ queryKey: ['pets'] }) // thú vui hơn, mệt hơn
      refreshRewardsSoon(queryClient)
    },
  })
  const { mutate } = submit
  const gameOver = useCallback((score, duration) => mutate({ score, duration }), [mutate])
  const Game = GAME_COMPONENTS[game]

  const replay = () => {
    submit.reset()
    setRound(round + 1)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="relative h-[480px] overflow-hidden rounded-2xl shadow-card">
        <Game key={round} pet={pet} onGameOver={gameOver} />
        {(submit.isPending || submit.data || submit.error) && (
          <div className="absolute inset-0 grid place-items-center bg-ink/30 p-4">
            <Card className="w-full max-w-sm space-y-3 text-center">
              {submit.isPending && <p className="font-semibold">Đang lưu điểm…</p>}
              {submit.error && <Alert tone="danger">{submit.error.message}</Alert>}
              {submit.data && (
                <>
                  <p className="text-sm font-semibold text-muted">Kết thúc!</p>
                  <p className="text-5xl font-extrabold text-primary-700">{submit.data.score}</p>
                  <p className="font-semibold">
                    {submit.data.coins > 0
                      ? `Nhận ${submit.data.coins} xu (vài giây nữa sẽ cộng vào ví)`
                      : submit.data.rewarded_plays_left === 0 && coinsFor(submit.data.score) > 0
                        ? 'Hết lượt có thưởng hôm nay, chơi cho vui thôi nhé!'
                        : 'Đạt từ 100 điểm để nhận xu.'}
                  </p>
                  {submit.data.score >= submit.data.my_best && submit.data.score > 0 && <Badge color="accent">Kỷ lục mới!</Badge>}
                </>
              )}
              <div className="flex justify-center gap-2">
                <Button onClick={replay} disabled={submit.isPending}>Chơi lại</Button>
                <Button variant="outline" onClick={onExit}>Chọn game khác</Button>
              </div>
            </Card>
          </div>
        )}
      </div>

      <Card className="space-y-3">
        <h2 className="text-xl font-bold">{GAMES[game].title}</h2>
        <p className="text-sm text-muted">{GAMES[game].controls}</p>
        <p className="text-sm text-muted">
          Mỗi 100 điểm được 1 xu (tối đa 5 xu một lượt), 4 lượt đầu mỗi ngày. Chơi xong thú vui hơn (+15) nhưng mệt hơn (−10 năng lượng).
        </p>
        <h3 className="pt-2 font-bold">Bảng điểm cao</h3>
        <ol className="space-y-1">
          {board?.top.map((row, i) => (
            <li key={i} className={`flex justify-between rounded-lg px-2 py-1 text-sm ${row.is_me ? 'bg-primary-50 font-bold' : ''}`}>
              <span>{i + 1}. {row.name}</span>
              <span className="font-semibold">{row.score}</span>
            </li>
          ))}
          {board?.top.length === 0 && <li className="text-sm text-muted">Chưa có ai chơi, hãy lập kỷ lục đầu tiên!</li>}
        </ol>
        <Button variant="ghost" className="w-full" onClick={onExit}>← Chọn game khác</Button>
      </Card>
    </div>
  )
}
