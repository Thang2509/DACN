import { useEffect, useState } from 'react'
import { Alert } from '../../components/ui'
import { useSetupTables } from './runCode'

const ROW_STYLES = { inserted: 'bg-green-50', updated: 'bg-amber-50' }

/**
 * Khung xem các bảng dữ liệu: mỗi bảng một tab, hiện cột (kiểu, khóa chính) và dữ liệu.
 * Dòng thêm mới tô xanh, dòng bị sửa tô vàng. onPickTable(tên) hiện nút gợi ý viết SELECT cho bảng.
 */
export default function TableViewer({ tables, title = 'Bảng dữ liệu', onPickTable }) {
  const changed = tables.find((table) => table.isNew || table.deleted > 0 || table.rows.some((row) => row.status))
  const [active, setActive] = useState(changed?.name ?? tables[0]?.name)
  const [open, setOpen] = useState(true)
  const table = tables.find((item) => item.name === active) ?? tables[0]

  if (!table) return null

  return (
    <div className="overflow-hidden rounded-xl border-2 border-primary-100">
      <div className="flex flex-wrap items-center gap-2 bg-primary-50 px-3 py-2">
        <span className="text-sm font-bold text-primary-700">{title}</span>
        {changed && <span className="text-xs text-muted">· xanh: dòng thêm · vàng: dòng sửa</span>}
        <button type="button" onClick={() => setOpen(!open)} className="ml-auto text-xs font-semibold text-primary-600">
          {open ? 'Thu gọn' : 'Xem bảng dữ liệu'}
        </button>
      </div>

      {open && (
        <>
          <div className="flex flex-wrap gap-1 border-b border-primary-100 px-3 pt-2">
            {tables.map((item) => (
              <button
                key={item.name}
                type="button"
                onClick={() => setActive(item.name)}
                className={`rounded-t-lg px-3 py-1.5 text-sm font-semibold ${item.name === table.name ? 'bg-primary-600 text-white' : 'text-muted hover:bg-primary-50'}`}
              >
                {item.name} <span className="opacity-70">({item.total})</span>
                {item.isNew && <span className="ml-1 text-xs text-success">mới</span>}
              </button>
            ))}
          </div>

          <div className="max-h-72 overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-card">
                <tr>
                  {table.columns.map((column) => (
                    <th key={column.name} className="border-b border-primary-100 px-3 py-2">
                      <span className="font-bold">{column.pk && '🔑 '}{column.name}</span>
                      <span className="block text-xs font-normal uppercase text-muted">{column.type || 'any'}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row, r) => (
                  <tr key={row.rowid ?? r} className={`border-b border-primary-50 ${ROW_STYLES[row.status] ?? ''}`}>
                    {row.values.map((cell, c) => (
                      <td key={c} className="px-3 py-1.5">
                        {cell === null ? <span className="italic text-muted">NULL</span> : String(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
                {table.rows.length === 0 && (
                  <tr><td colSpan={table.columns.length} className="px-3 py-3 text-center text-muted">Bảng chưa có dữ liệu</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center gap-3 px-3 py-2 text-xs text-muted">
            {table.total > table.rows.length && <span>Hiển thị {table.rows.length}/{table.total} dòng</span>}
            {table.deleted > 0 && <span className="font-semibold text-danger">Đã xóa {table.deleted} dòng</span>}
            {onPickTable && (
              <button type="button" onClick={() => onPickTable(table.name)} className="ml-auto font-semibold text-primary-600">
                Viết SELECT cho bảng này
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// Xem trước bảng trong trình soạn: chờ giảng viên ngừng gõ 600ms rồi mới chạy SQL tạo bảng
export function SetupPreview({ sql }) {
  const [debounced, setDebounced] = useState(sql)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(sql), 600)
    return () => clearTimeout(timer)
  }, [sql])
  const { data } = useSetupTables(debounced)

  if (!debounced?.trim() || !data) return null
  if (data.error) return <Alert tone="danger">{data.error}</Alert>
  if (data.tables.length === 0) return <p className="text-sm text-muted">SQL chưa tạo bảng nào.</p>
  return <TableViewer key={debounced} tables={data.tables} title="Xem trước dữ liệu mẫu" />
}
