import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Alert, Badge, Button, Card, PageLoading } from '../../components/ui'
import { formatDate, formatPrice } from '../../lib/format'
import ItemIcon, { EggIcon } from '../pet/ItemIcon'
import { SLOT_LABELS } from '../pet/petStates'
import { buyEgg, buyItem, getShop, redeemVoucher } from './api'

const TABS = { food: 'Thức ăn', accessory: 'Trang bị', furniture: 'Nội thất', eggs: 'Trứng', vouchers: 'Voucher' }

// Cửa hàng đổi xu; tab đang mở nằm trên URL (?tab=eggs) để các trang khác dẫn thẳng tới
export default function ShopPage() {
  const [params, setParams] = useSearchParams()
  const tab = TABS[params.get('tab')] ? params.get('tab') : 'food'
  const queryClient = useQueryClient()
  const { data: shop, isLoading } = useQuery({ queryKey: ['shop'], queryFn: getShop })
  const [message, setMessage] = useState(null)

  // Mọi lần mua: máy chủ trả lại cửa hàng mới; cập nhật thêm số xu ở header, thú cưng, voucher, phòng
  const purchase = useMutation({
    mutationFn: ({ action }) => action(),
    onSuccess: (data, { name }) => {
      queryClient.setQueryData(['shop'], data)
      for (const key of ['gamification', 'pets', 'my-vouchers', 'room']) queryClient.invalidateQueries({ queryKey: [key] })
      setMessage(`Đã đổi: ${name}`)
    },
    onError: () => setMessage(null),
  })
  const buy = (name, action) => purchase.mutate({ name, action })

  if (isLoading || !shop) return <PageLoading />

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-extrabold">Cửa hàng</h1>
        <span className="ml-auto rounded-2xl bg-amber-100 px-4 py-2 text-xl font-extrabold text-amber-700">{shop.coins} xu</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {Object.entries(TABS).map(([key, label]) => (
          <Button key={key} size="sm" variant={tab === key ? 'primary' : 'outline'} onClick={() => setParams({ tab: key }, { replace: true })}>
            {label}
          </Button>
        ))}
      </div>

      {message && <Alert tone="success">{message}</Alert>}
      {purchase.error && <Alert tone="danger">{Object.values(purchase.error.errors ?? {})[0]?.[0] ?? purchase.error.message}</Alert>}

      {tab === 'eggs' && <EggList shop={shop} onBuy={buy} busy={purchase.isPending} />}
      {tab === 'vouchers' && <VoucherList shop={shop} onBuy={buy} busy={purchase.isPending} />}
      {TABS[tab] && !['eggs', 'vouchers'].includes(tab) && (
        <ItemList items={shop.items.filter((item) => item.type === tab)} coins={shop.coins} onBuy={buy} busy={purchase.isPending} />
      )}
      <p className="text-sm text-muted">Kiếm xu bằng cách học bài, giữ chuỗi ngày và làm nhiệm vụ.</p>
    </div>
  )
}

function itemNote(item) {
  if (item.type === 'food') return `+${item.effect.fullness} đầy bụng, +5 vui vẻ`
  if (item.type === 'accessory') return `Đeo ở ${SLOT_LABELS[item.bone_slot].toLowerCase()}`
  return `Chiếm ${item.size_x}×${item.size_z} ô${item.effect?.floor ? ', đặt đồ lên được' : ''}`
}

function ItemList({ items, coins, onBuy, busy }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => {
        const ownedAccessory = item.type === 'accessory' && item.owned > 0
        return (
          <Card key={item.id} className="flex flex-col items-center gap-2 text-center">
            <ItemIcon item={item} size="size-20" />
            <p className="font-bold">{item.name}</p>
            <p className="text-xs text-muted">{itemNote(item)}</p>
            {item.owned > 0 && <Badge color="success">{ownedAccessory ? 'Đã có' : `Đang có ${item.owned}`}</Badge>}
            <Button
              size="sm"
              className="mt-auto w-full"
              onClick={() => onBuy(item.name, () => buyItem(item.id))}
              disabled={busy || ownedAccessory || coins < item.price}
            >
              {item.price} xu
            </Button>
          </Card>
        )
      })}
    </div>
  )
}

function EggList({ shop, onBuy, busy }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {shop.eggs.map((egg) => (
        <Card key={egg.id} className="flex flex-col items-center gap-2 text-center">
          <EggIcon color={egg.egg_color} size="h-20 w-16" />
          <p className="font-bold">Trứng {egg.name}</p>
          <p className="text-xs text-muted">{egg.description}</p>
          {egg.owned ? (
            <Badge color="success" className="mt-auto">Đã có trong bộ sưu tập</Badge>
          ) : (
            <Button size="sm" className="mt-auto w-full" onClick={() => onBuy(`Trứng ${egg.name}`, () => buyEgg(egg.code))} disabled={busy || shop.coins < egg.egg_price}>
              {egg.egg_price} xu
            </Button>
          )}
        </Card>
      ))}
    </div>
  )
}

function VoucherList({ shop, onBuy, busy }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {shop.vouchers.map((voucher) => (
          <Card key={voucher.id} className="flex items-center gap-4 border-2 border-dashed border-accent-300">
            <span className="text-4xl font-extrabold text-accent-500">-{voucher.discount_percent}%</span>
            <div className="min-w-0 flex-1">
              <p className="font-bold">{voucher.name}</p>
              <p className="text-sm text-muted">Dùng khi mua khóa học, hạn {voucher.valid_days} ngày kể từ lúc đổi.</p>
            </div>
            <Button onClick={() => onBuy(voucher.name, () => redeemVoucher(voucher.id))} disabled={busy || shop.coins < voucher.coin_cost}>
              {voucher.coin_cost} xu
            </Button>
          </Card>
        ))}
      </div>

      <Card>
        <h2 className="mb-3 text-xl font-bold">Voucher của tôi</h2>
        {shop.my_vouchers.length === 0 && <p className="text-muted">Bạn chưa đổi voucher nào.</p>}
        <ul className="divide-y divide-primary-100">
          {shop.my_vouchers.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center gap-2 py-2.5">
              <code className="rounded-lg bg-primary-50 px-2 py-1 font-bold text-primary-800">{item.code}</code>
              <span className="text-sm">{item.voucher.name} · tối đa {formatPrice(item.voucher.max_discount)}</span>
              <span className="ml-auto text-xs text-muted">Hạn {formatDate(item.expires_on)}</span>
              {item.used_at ? <Badge>Đã dùng</Badge>
                : item.usable ? <Badge color="success">Dùng được</Badge>
                  : item.reserved ? <Badge color="coin">Đang giữ cho đơn chờ</Badge>
                    : <Badge color="danger">Hết hạn</Badge>}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-muted">
          Chọn voucher ở bước thanh toán trong trang chi tiết <Link to="/courses" className="font-semibold text-primary-600">khóa học có phí</Link>.
        </p>
      </Card>
    </div>
  )
}
