import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fieldError } from '../../lib/api'
import { Alert, Badge, Button, Card, Input, PageLoading, ProgressBar } from '../../components/ui'
import { getShop } from '../gamification/api'
import { adoptPet, equipItem, feedPet, getPets, getRoom, renamePet, toggleSleep, unequipSlot } from './api'
import ItemIcon from './ItemIcon'
import { EggCanvas } from './PetScene'
import { MOODS, PET_STATES, SLOT_LABELS, STAGES } from './petStates'
import RoomScene from './RoomScene'

export default function PetPage() {
  const { data, isLoading } = useQuery({ queryKey: ['pets'], queryFn: getPets })
  if (isLoading || !data) return <PageLoading />

  const pet = data.pets.find((item) => item.is_active) ?? data.pets[0]
  return (
    <>
      <PetNav />
      {pet ? <PetView key={pet.id} pet={pet} /> : <EggPicker species={data.species.filter((item) => item.is_starter)} />}
    </>
  )
}

// Chuyển giữa 3 trang của thú cưng
export function PetNav() {
  const links = { '/pet': 'Thú cưng', '/pet/collection': 'Bộ sưu tập', '/pet/room': 'Phòng', '/pet/games': 'Minigame' }
  return (
    <nav className="mb-6 flex flex-wrap gap-2">
      {Object.entries(links).map(([to, label]) => (
        <NavLink
          key={to}
          to={to}
          end
          className={({ isActive }) =>
            `rounded-xl px-4 py-2 font-bold transition ${isActive ? 'bg-primary-600 text-white' : 'bg-card text-primary-700 shadow-card hover:bg-primary-50'}`}
        >
          {label}
        </NavLink>
      ))}
    </nav>
  )
}

// Lần đầu: chọn 1 trong 3 quả trứng khởi đầu (các loài khác mua ở cửa hàng)
function EggPicker({ species }) {
  const queryClient = useQueryClient()
  const [chosen, setChosen] = useState(species[0]?.code)
  const adopt = useMutation({
    mutationFn: () => adoptPet(chosen),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pets'] }),
  })
  const chosenName = species.find((item) => item.code === chosen)?.name

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold">Chọn quả trứng đầu tiên</h1>
        <p className="text-muted">Trứng nở ngay khi nhận, mỗi bài học bạn hoàn thành giúp thú cưng lớn lên.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {species.map((item) => (
          <button
            key={item.code}
            type="button"
            onClick={() => setChosen(item.code)}
            className={`rounded-2xl border-4 bg-card p-4 text-left shadow-card transition
              ${chosen === item.code ? 'border-primary-500' : 'border-transparent hover:border-primary-200'}`}
          >
            <div className="h-44">
              <EggCanvas color={item.egg_color} active={chosen === item.code} />
            </div>
            <p className="text-lg font-bold">Trứng {item.name}</p>
            <p className="text-sm text-muted">{item.description}</p>
          </button>
        ))}
      </div>
      {adopt.error && <Alert tone="danger">{fieldError(adopt.error, 'species') ?? adopt.error.message}</Alert>}
      <div className="text-center">
        <Button size="lg" onClick={() => adopt.mutate()} disabled={!chosen || adopt.isPending}>
          Nhận trứng {chosenName}
        </Button>
      </div>
    </div>
  )
}

// Lệnh người dùng bấm thử; thú trong phòng tự làm xong rồi quay về hoạt động thường ngày
const COMMANDS = ['jump', 'eat', 'walk', 'run']

const CELEBRATIONS = {
  hatchling: 'Trứng đã nở!',
  baby: 'đã lớn thành con non!',
  adult: 'đã trưởng thành!',
  evolved: 'đã tiến hóa!',
}

const HATCH_SECONDS = 2

function PetView({ pet }) {
  const queryClient = useQueryClient()
  const { data: room } = useQuery({ queryKey: ['room'], queryFn: getRoom })
  const itemsById = useMemo(() => Object.fromEntries((room?.furniture ?? []).map((item) => [item.id, item])), [room])
  const [command, setCommand] = useState(null)
  // Thú vừa nhận (chưa xem trên máy này, chưa có XP) hoặc lần trước còn là trứng: cho xem trứng lắc và nứt rồi mới nở
  const [hatching, setHatching] = useState(() => {
    const seen = loadSeenStage(pet.id)
    return seen === 'egg' || (seen === null && pet.growth_xp === 0)
  })
  const [seenStage, setSeenStage] = useState(() => loadSeenStage(pet.id) ?? (hatching ? 'egg' : pet.stage))
  const celebrating = !hatching && stageIndex(pet.stage) > stageIndex(seenStage)

  useEffect(() => {
    if (!hatching) return
    const hatchTimer = setTimeout(() => setHatching(false), HATCH_SECONDS * 1000)
    return () => clearTimeout(hatchTimer)
  }, [hatching])

  // Lần đầu xem thì ghi nhớ giai đoạn hiện tại; lên giai đoạn mới thì chúc mừng tới khi bấm đóng
  useEffect(() => {
    if (!celebrating) saveSeenStage(pet.id, pet.stage)
  }, [celebrating, pet.id, pet.stage])
  const dismiss = () => setSeenStage(pet.stage)

  const updatePet = (view) =>
    queryClient.setQueryData(['pets'], (old) => ({ ...old, pets: old.pets.map((item) => (item.id === view.id ? view : item)) }))
  const sleep = useMutation({ mutationFn: () => toggleSleep(pet.id), onSuccess: updatePet })

  const play = (type) => setCommand((previous) => ({ type, id: (previous?.id ?? 0) + 1 }))

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="relative h-[480px] overflow-hidden rounded-2xl shadow-card">
        <RoomScene
          layout={room?.items ?? []}
          itemsById={itemsById}
          pet={pet}
          command={command}
          celebrate={celebrating}
          hatching={hatching}
          follow
        />
        {hatching && (
          <p className="absolute inset-x-0 top-8 animate-pulse text-center text-2xl font-extrabold text-primary-700">Trứng đang nở…</p>
        )}
        {!hatching && !celebrating && (
          <p className="pointer-events-none absolute bottom-3 left-3 rounded-xl bg-card/85 px-3 py-1.5 text-xs font-semibold text-muted">
            Bấm sàn để ném bóng · bấm vào thú để vuốt ve · kéo để xoay phòng
          </p>
        )}
        {celebrating && (
          <div className="absolute inset-x-0 top-6 flex justify-center px-4">
            <div className="animate-drop rounded-2xl bg-card/95 px-6 py-4 text-center shadow-card">
              <p className="text-xl font-extrabold text-primary-700">
                {pet.stage === 'hatchling' ? CELEBRATIONS.hatchling : `${pet.nickname} ${CELEBRATIONS[pet.stage]}`}
              </p>
              <Button size="sm" className="mt-2" onClick={dismiss}>Tuyệt vời!</Button>
            </div>
          </div>
        )}
      </div>

      <Card className="space-y-5">
        <NameForm pet={pet} onSaved={updatePet} />
        <div className="flex flex-wrap gap-1.5">
          <Badge>{pet.species.name}</Badge>
          <Badge color="accent">{STAGES[pet.stage].label}</Badge>
          <Badge color={pet.mood === 'sad' ? 'danger' : 'success'}>{MOODS[pet.mood].label}</Badge>
        </div>

        <GrowthBar pet={pet} />

        <div className="space-y-3">
          <ProgressBar label="Đầy bụng" value={pet.fullness} color="accent" />
          <ProgressBar label="Vui vẻ" value={pet.happiness} color="coin" />
          <ProgressBar label="Năng lượng" value={pet.energy} color="success" />
        </div>

        <div className="space-y-2">
          <div className="grid grid-cols-4 gap-2">
            {COMMANDS.map((key) => (
              <Button key={key} size="sm" variant="outline" onClick={() => play(key)} disabled={pet.is_sleeping || hatching}>
                {PET_STATES[key].label}
              </Button>
            ))}
          </div>
          <Button variant="accent" className="w-full" onClick={() => sleep.mutate()} disabled={sleep.isPending || hatching}>
            {pet.is_sleeping ? 'Đánh thức' : 'Cho ngủ'}
          </Button>
        </div>

        <CarePanel pet={pet} onUpdated={updatePet} onAte={() => play('eat')} />

        <p className="text-xs text-muted">
          Hoàn thành bài học: +15 đầy bụng, +10 vui vẻ. Trả lời đúng quiz: +2 vui vẻ. Thú nhận một nửa số XP bạn kiếm được.
          Thú cưng, đồ đạc và căn phòng đều dựng bằng code với three.js.
        </p>
      </Card>
    </div>
  )
}

// Cho ăn và đeo trang bị bằng đồ trong túi (mua ở cửa hàng)
function CarePanel({ pet, onUpdated, onAte }) {
  const queryClient = useQueryClient()
  const { data: shop } = useQuery({ queryKey: ['shop'], queryFn: getShop })
  const done = (view) => {
    onUpdated(view)
    queryClient.invalidateQueries({ queryKey: ['shop'] })
  }
  const feed = useMutation({
    mutationFn: (item) => feedPet(pet.id, item.id),
    onSuccess: (view) => {
      done(view)
      onAte()
    },
  })
  const equip = useMutation({ mutationFn: (item) => equipItem(pet.id, item.id), onSuccess: done })
  const unequip = useMutation({ mutationFn: (slot) => unequipSlot(pet.id, slot), onSuccess: done })
  if (!shop) return null

  const owned = shop.items.filter((item) => item.owned > 0)
  const foods = owned.filter((item) => item.type === 'food')
  const accessories = owned.filter((item) => item.type === 'accessory')
  const worn = Object.fromEntries(pet.equipment.map((item) => [item.slot, item.code]))
  const error = feed.error ?? equip.error ?? unequip.error

  return (
    <div className="space-y-4">
      <div>
        <h2 className="mb-2 font-bold">Cho ăn</h2>
        {foods.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {foods.map((item) => (
              <button
                key={item.id}
                type="button"
                title={`${item.name} (+${item.effect.fullness} đầy bụng)`}
                onClick={() => feed.mutate(item)}
                disabled={feed.isPending}
                className="relative rounded-xl border-2 border-primary-100 p-1 transition hover:border-primary-400"
              >
                <ItemIcon item={item} size="size-10" />
                <span className="absolute -top-1.5 -right-1.5 rounded-full bg-primary-600 px-1.5 text-xs font-bold text-white">{item.owned}</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">
            Túi chưa có thức ăn. <Link to="/shop" className="font-semibold text-primary-600">Mua ở cửa hàng</Link>
          </p>
        )}
      </div>

      <div>
        <h2 className="mb-2 font-bold">Trang bị</h2>
        {accessories.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {accessories.map((item) => {
              const wearing = worn[item.bone_slot] === item.code
              return (
                <button
                  key={item.id}
                  type="button"
                  title={`${item.name} · ${SLOT_LABELS[item.bone_slot]}${wearing ? ' (bấm để tháo)' : ''}`}
                  onClick={() => (wearing ? unequip.mutate(item.bone_slot) : equip.mutate(item))}
                  disabled={equip.isPending || unequip.isPending}
                  className={`rounded-xl border-2 p-1 transition ${wearing ? 'border-primary-500 bg-primary-50' : 'border-primary-100 hover:border-primary-400'}`}
                >
                  <ItemIcon item={item} size="size-10" />
                </button>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-muted">
            Chưa có trang bị. <Link to="/shop?tab=accessory" className="font-semibold text-primary-600">Mua ở cửa hàng</Link>
          </p>
        )}
      </div>
      {error && <Alert tone="danger">{fieldError(error, 'item') ?? error.message}</Alert>}
    </div>
  )
}

function GrowthBar({ pet }) {
  if (!pet.next_stage) return <Alert tone="success">Thú cưng đã tiến hóa hoàn toàn.</Alert>

  const gained = pet.growth_xp - pet.stage_start_xp
  const needed = pet.next_stage_xp - pet.stage_start_xp
  return (
    <div className="space-y-1">
      <ProgressBar
        label={`Lớn lên: ${STAGES[pet.next_stage].label}`}
        value={Math.min(gained, needed)}
        max={needed}
        color="primary"
      />
      {pet.next_stage === 'evolved' && (
        <p className="text-xs text-muted">Tiến hóa cần đủ XP và chuỗi học 7 ngày liên tiếp.</p>
      )}
    </div>
  )
}

function NameForm({ pet, onSaved }) {
  const [name, setName] = useState(null) // null: không sửa
  const save = useMutation({
    mutationFn: () => renamePet(pet.id, name),
    onSuccess: (view) => {
      onSaved(view)
      setName(null)
    },
  })

  if (name === null) {
    return (
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-extrabold">{pet.nickname}</h1>
        <button type="button" className="text-sm font-semibold text-primary-600 hover:underline" onClick={() => setName(pet.nickname)}>
          Đổi tên
        </button>
      </div>
    )
  }
  return (
    <form
      className="flex items-start gap-2"
      onSubmit={(event) => {
        event.preventDefault()
        save.mutate()
      }}
    >
      <Input value={name} onChange={(event) => setName(event.target.value)} maxLength={50} autoFocus error={fieldError(save.error, 'nickname')} />
      <Button type="submit" disabled={save.isPending}>Lưu</Button>
    </form>
  )
}

const stageIndex = (stage) => Object.keys(STAGES).indexOf(stage)

// Giai đoạn đã xem lần trước (theo từng trình duyệt) để biết khi nào cần chúc mừng
function loadSeenStage(petId) {
  try {
    return localStorage.getItem(`pet-stage-${petId}`)
  } catch {
    return null
  }
}

function saveSeenStage(petId, stage) {
  try {
    localStorage.setItem(`pet-stage-${petId}`, stage)
  } catch {
    // trình duyệt chặn localStorage: lần sau có thể chúc mừng lại, không sao
  }
}
