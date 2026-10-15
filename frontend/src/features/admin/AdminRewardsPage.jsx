import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Alert, Badge, Button, Card, PageLoading } from '../../components/ui'
import { formatPrice } from '../../lib/format'
import { AdminLayout } from './AdminPages'
import { getRewardConfig, saveRewardConfig } from './api'

// Các cột của từng loại cấu hình; options là hàm vì danh sách lựa chọn lấy từ máy chủ
const TABLES = {
  quests: {
    title: 'Nhiệm vụ',
    blank: { title: '', period: 'daily', target_type: 'lessons_completed', target_value: 1, reward_xp: 10, reward_coins: 5, is_active: true },
    fields: [
      { key: 'title', label: 'Tên nhiệm vụ', type: 'text' },
      { key: 'period', label: 'Kỳ', type: 'select', options: () => ({ daily: 'Ngày', weekly: 'Tuần' }) },
      { key: 'target_type', label: 'Đếm', type: 'select', options: (config) => config.quest_targets },
      { key: 'target_value', label: 'Mục tiêu', type: 'number' },
      { key: 'reward_xp', label: 'XP', type: 'number' },
      { key: 'reward_coins', label: 'Xu', type: 'number' },
      { key: 'is_active', label: 'Bật', type: 'checkbox' },
    ],
  },
  badges: {
    title: 'Huy hiệu',
    blank: { icon: '🏅', name: '', description: '', condition_type: 'lessons_completed', condition_value: 1, reward_coins: 10, is_active: true },
    fields: [
      { key: 'icon', label: 'Biểu tượng', type: 'text', width: 'w-16' },
      { key: 'name', label: 'Tên', type: 'text' },
      { key: 'description', label: 'Mô tả', type: 'text' },
      { key: 'condition_type', label: 'Điều kiện', type: 'select', options: (config) => config.badge_conditions },
      { key: 'condition_value', label: 'Ngưỡng', type: 'number' },
      { key: 'reward_coins', label: 'Xu', type: 'number' },
      { key: 'is_active', label: 'Bật', type: 'checkbox' },
    ],
  },
  vouchers: {
    title: 'Voucher',
    blank: { name: '', discount_percent: 10, max_discount: 50000, coin_cost: 200, valid_days: 30, is_active: true },
    fields: [
      { key: 'name', label: 'Tên', type: 'text' },
      { key: 'discount_percent', label: 'Giảm %', type: 'number' },
      { key: 'max_discount', label: 'Giảm tối đa', type: 'number', format: formatPrice },
      { key: 'coin_cost', label: 'Giá (xu)', type: 'number' },
      { key: 'valid_days', label: 'Hạn (ngày)', type: 'number' },
      { key: 'is_active', label: 'Bật', type: 'checkbox' },
    ],
  },
}

// Cấu hình nhiệm vụ, huy hiệu, voucher. Không xóa hẳn, chỉ tắt để giữ lịch sử học viên đã nhận
export default function AdminRewardsPage() {
  const { data: config, isLoading } = useQuery({ queryKey: ['admin-rewards'], queryFn: getRewardConfig })

  return (
    <AdminLayout title="Quản trị">
      {isLoading || !config ? (
        <PageLoading />
      ) : (
        <div className="space-y-6">
          {Object.entries(TABLES).map(([type, table]) => (
            <RewardTable key={type} type={type} table={table} rows={config[type]} config={config} />
          ))}
        </div>
      )}
    </AdminLayout>
  )
}

function RewardTable({ type, table, rows, config }) {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(null) // bản nháp của dòng đang sửa (không có id: dòng mới)
  const save = useMutation({
    mutationFn: () => saveRewardConfig(type, editing),
    onSuccess: () => {
      setEditing(null)
      queryClient.invalidateQueries({ queryKey: ['admin-rewards'] })
    },
  })
  const start = (row) => {
    save.reset()
    setEditing(row)
  }
  const error = save.error && (Object.values(save.error.errors ?? {})[0]?.[0] ?? save.error.message)

  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{table.title}</h2>
        <Button size="sm" onClick={() => start(table.blank)} disabled={editing && !editing.id}>+ Thêm</Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted">
              {table.fields.map((field) => <th key={field.key} className="px-2 py-1.5 font-semibold">{field.label}</th>)}
              <th />
            </tr>
          </thead>
          <tbody className="divide-y divide-primary-100">
            {editing && !editing.id && <EditRow table={table} config={config} draft={editing} onChange={setEditing} onSave={() => save.mutate()} onCancel={() => setEditing(null)} busy={save.isPending} />}
            {rows.map((row) =>
              editing?.id === row.id ? (
                <EditRow key={row.id} table={table} config={config} draft={editing} onChange={setEditing} onSave={() => save.mutate()} onCancel={() => setEditing(null)} busy={save.isPending} />
              ) : (
                <tr key={row.id} className={row.is_active ? '' : 'opacity-50'}>
                  {table.fields.map((field) => (
                    <td key={field.key} className="px-2 py-2">{display(field, row[field.key], config)}</td>
                  ))}
                  <td className="px-2 py-2 text-right">
                    <Button size="sm" variant="ghost" onClick={() => start(row)} disabled={!!editing}>Sửa</Button>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
      {error && <Alert tone="danger">{error}</Alert>}
    </Card>
  )
}

function display(field, value, config) {
  if (field.type === 'checkbox') return value ? <Badge color="success">Bật</Badge> : <Badge>Tắt</Badge>
  if (field.type === 'select') return field.options(config)[value] ?? value
  return field.format ? field.format(value) : value
}

function EditRow({ table, config, draft, onChange, onSave, onCancel, busy }) {
  const input = 'w-full rounded-lg border-2 border-primary-100 bg-card px-2 py-1 focus:border-primary-500 focus:outline-none'
  const set = (key, value) => onChange({ ...draft, [key]: value })

  return (
    <tr className="bg-primary-50">
      {table.fields.map((field) => (
        <td key={field.key} className="px-1 py-1.5">
          {field.type === 'select' ? (
            <select className={input} value={draft[field.key]} onChange={(event) => set(field.key, event.target.value)}>
              {Object.entries(field.options(config)).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          ) : field.type === 'checkbox' ? (
            <input type="checkbox" className="size-5" checked={!!draft[field.key]} onChange={(event) => set(field.key, event.target.checked)} />
          ) : (
            <input
              type={field.type}
              className={`${input} ${field.width ?? ''}`}
              value={draft[field.key]}
              onChange={(event) => set(field.key, field.type === 'number' ? Number(event.target.value) : event.target.value)}
            />
          )}
        </td>
      ))}
      <td className="whitespace-nowrap px-1 py-1.5 text-right">
        <Button size="sm" onClick={onSave} disabled={busy}>Lưu</Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>Hủy</Button>
      </td>
    </tr>
  )
}
