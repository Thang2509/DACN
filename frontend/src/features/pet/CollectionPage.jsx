import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Alert, Badge, Button, Card, PageLoading } from '../../components/ui'
import { fieldError } from '../../lib/api'
import { activatePet, getPets } from './api'
import { EggIcon } from './ItemIcon'
import { PetNav } from './PetPage'
import { PetScene } from './PetScene'
import { MOODS, STAGES } from './petStates'

// Bộ sưu tập: các loài đã có và chưa có; chọn thú đồng hành (thú nhận XP khi học)
export default function CollectionPage() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['pets'], queryFn: getPets })
  const [selected, setSelected] = useState(null)
  const activate = useMutation({
    mutationFn: (pet) => activatePet(pet.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pets'] }),
  })

  if (isLoading || !data) return <PageLoading />

  const petOf = Object.fromEntries(data.pets.map((pet) => [pet.species.code, pet]))
  const active = data.pets.find((pet) => pet.is_active)
  const code = selected ?? active?.species.code ?? data.species[0].code
  const species = data.species.find((item) => item.code === code)
  const pet = petOf[code]

  return (
    <>
      <PetNav />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <div className="relative h-[420px] overflow-hidden rounded-2xl shadow-card">
            {/* Loài chưa có: hiện bóng đen của con trưởng thành */}
            <PetScene
              key={code}
              pet={pet ?? { stage: 'adult', species, equipment: [] }}
              state={pet ? MOODS[pet.mood].state : 'idle'}
              silhouette={!pet}
            />
          </div>
          <Card className="flex flex-wrap items-center gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-extrabold">{pet ? pet.nickname : species.name}</h1>
              <p className="text-sm text-muted">{species.description}</p>
            </div>
            {pet?.is_active && <Badge color="success">Đang đồng hành</Badge>}
            {pet && !pet.is_active && (
              <Button onClick={() => activate.mutate(pet)} disabled={activate.isPending}>Chọn làm thú đồng hành</Button>
            )}
            {!pet && (
              <Link to="/shop?tab=eggs"><Button variant="accent">Mua trứng · {species.egg_price} xu</Button></Link>
            )}
          </Card>
          {activate.error && <Alert tone="danger">{fieldError(activate.error, 'pet') ?? activate.error.message}</Alert>}
        </div>

        <Card className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xl font-bold">Bộ sưu tập</h2>
            <span className="text-sm font-semibold text-muted">Đã có {data.pets.length}/{data.species.length}</span>
          </div>
          <ul className="space-y-2">
            {data.species.map((item) => {
              const owned = petOf[item.code]
              return (
                <li key={item.code}>
                  <button
                    type="button"
                    onClick={() => setSelected(item.code)}
                    className={`flex w-full items-center gap-3 rounded-xl border-2 p-2 text-left transition
                      ${item.code === code ? 'border-primary-500 bg-primary-50' : 'border-transparent hover:bg-primary-50'}`}
                  >
                    <EggIcon color={item.egg_color} locked={!owned} size="h-10 w-8" />
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold">{owned ? owned.nickname : item.name}</span>
                      <span className="text-xs text-muted">{owned ? `${item.name} · ${STAGES[owned.stage].label}` : 'Chưa có'}</span>
                    </span>
                    {owned?.is_active && <Badge color="success">Đồng hành</Badge>}
                  </button>
                </li>
              )
            })}
          </ul>
          <p className="text-xs text-muted">Chỉ thú đồng hành nhận XP và được chăm sóc khi bạn học bài.</p>
        </Card>
      </div>
    </>
  )
}
