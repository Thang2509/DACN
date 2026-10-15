import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Alert, Button, Card, PageLoading } from '../../components/ui'
import { getPets, getRoom, saveRoom } from './api'
import ItemIcon from './ItemIcon'
import { PetNav } from './PetPage'
import RoomScene from './RoomScene'
import { canPlace } from './room'

export default function RoomPage() {
  const { data: room } = useQuery({ queryKey: ['room'], queryFn: getRoom })
  const { data: pets } = useQuery({ queryKey: ['pets'], queryFn: getPets })
  if (!room || !pets) return <PageLoading />

  return (
    <>
      <PetNav />
      <RoomEditor room={room} pet={pets.pets.find((item) => item.is_active)} />
    </>
  )
}

/**
 * Sửa bố cục trên bản nháp rồi mới lưu: chọn món trong túi (hoặc bấm món đã đặt để dời),
 * rê chuột trên sàn để xem chỗ đặt, bấm để đặt. Phím R xoay, Esc hủy.
 */
function RoomEditor({ room, pet }) {
  const queryClient = useQueryClient()
  const [layout, setLayout] = useState(room.items)
  const [tool, setTool] = useState(null)
  const [hover, setHover] = useState(null)
  const itemsById = useMemo(() => Object.fromEntries(room.furniture.map((item) => [item.id, item])), [room.furniture])
  const save = useMutation({
    mutationFn: () => saveRoom(layout),
    onSuccess: (data) => queryClient.setQueryData(['room'], data),
  })

  const placed = (itemId) => layout.filter((placement) => placement.pet_item_id === itemId).length
  const dirty = JSON.stringify(layout) !== JSON.stringify(room.items)
  const holding = tool && itemsById[tool.itemId]

  const rotate = () => setTool((current) => current && { ...current, rotation: (current.rotation + 1) % 4 })
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'r' || event.key === 'R') rotate()
      if (event.key === 'Escape') setTool(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const placeAt = ([x, z]) => {
    if (!tool) return
    const placement = { pet_item_id: tool.itemId, x, z, rotation: tool.rotation }
    if (!canPlace(layout, itemsById, placement, tool.index ?? -1)) return
    setLayout(tool.index === undefined ? [...layout, placement] : layout.map((old, i) => (i === tool.index ? placement : old)))
    setTool(null)
  }
  const pickUp = (index) => {
    if (tool) return
    setTool({ itemId: layout[index].pet_item_id, rotation: layout[index].rotation, index })
  }
  const putAway = () => {
    setLayout(layout.filter((_, i) => i !== tool.index))
    setTool(null)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="relative h-[520px] overflow-hidden rounded-2xl shadow-card">
        <RoomScene
          layout={layout}
          itemsById={itemsById}
          tool={tool}
          hover={hover}
          onHover={setHover}
          onFloorClick={placeAt}
          onItemClick={pickUp}
          pet={pet}
        />
        {holding && (
          <div className="absolute inset-x-0 top-4 flex justify-center px-4">
            <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-card/95 px-4 py-2 shadow-card">
              <span className="font-semibold">Đang cầm: {holding.name}</span>
              <Button size="sm" variant="outline" onClick={rotate}>Xoay (R)</Button>
              {tool.index !== undefined && <Button size="sm" variant="outline" onClick={putAway}>Cất vào túi</Button>}
              <Button size="sm" variant="ghost" onClick={() => setTool(null)}>Hủy (Esc)</Button>
            </div>
          </div>
        )}
      </div>

      <Card className="space-y-4">
        <div>
          <h1 className="text-2xl font-extrabold">{pet ? `Phòng của ${pet.nickname}` : 'Phòng thú cưng'}</h1>
          <p className="text-sm text-muted">Chọn món trong túi rồi bấm vào sàn để đặt. Bấm món đã đặt để dời hoặc cất đi.</p>
        </div>

        {room.furniture.length === 0 ? (
          <p className="text-sm text-muted">
            Túi chưa có nội thất. <Link to="/shop?tab=furniture" className="font-semibold text-primary-600">Mua ở cửa hàng</Link>
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {room.furniture.map((item) => {
              const left = item.quantity - placed(item.id)
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTool({ itemId: item.id, rotation: 0 })}
                  disabled={left < 1}
                  className={`flex flex-col items-center rounded-xl border-2 p-1.5 text-center text-xs font-semibold transition disabled:opacity-40
                    ${tool?.itemId === item.id && tool.index === undefined ? 'border-primary-500 bg-primary-50' : 'border-primary-100 hover:border-primary-400'}`}
                >
                  <ItemIcon item={item} size="size-12" />
                  <span className="line-clamp-1">{item.name}</span>
                  <span className="text-muted">còn {left}</span>
                </button>
              )
            })}
          </div>
        )}

        <div className="flex gap-2">
          <Button className="flex-1" onClick={() => save.mutate()} disabled={!dirty || save.isPending}>
            {save.isPending ? 'Đang lưu…' : 'Lưu phòng'}
          </Button>
          <Button variant="outline" onClick={() => setLayout(room.items)} disabled={!dirty}>Hoàn tác</Button>
        </div>
        {save.isSuccess && !dirty && <Alert tone="success">Đã lưu phòng.</Alert>}
        {save.error && <Alert tone="danger">{Object.values(save.error.errors ?? {})[0]?.[0] ?? save.error.message}</Alert>}
        <p className="text-xs text-muted">Nội thất: Kenney Furniture Kit (CC0).</p>
      </Card>
    </div>
  )
}
