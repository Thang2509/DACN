import { useQuery } from '@tanstack/react-query'
import initSqlJs from 'sql.js'
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url'
import workerSource from './sandboxWorker.js?raw'

const TIMEOUT_MS = 3000

// Iframe sandbox không cho tạo Worker kiểu module, nên bỏ chữ "export" để chạy như Worker thường
const classicWorkerSource = workerSource.replace(/^export /gm, '')

// Trang chạy trong iframe sandbox (không có allow-same-origin): tạo Worker chạy code, quá giờ thì dừng Worker
const RUNNER_HTML = `<!doctype html><script>
const worker = new Worker(URL.createObjectURL(new Blob([${JSON.stringify(classicWorkerSource).replace(/<\//g, '<\\/')}], { type: 'text/javascript' })));
const send = (data) => parent.postMessage(data, '*');
let timer;
worker.onmessage = (e) => { if (e.data.type === 'done') clearTimeout(timer); send(e.data); };
worker.onerror = (e) => { clearTimeout(timer); send({ type: 'done', error: e.message || 'Không khởi động được trình chạy code.' }); };
onmessage = (e) => {
  timer = setTimeout(() => {
    worker.terminate();
    send({ type: 'done', error: 'Code chạy quá ${TIMEOUT_MS / 1000} giây (có thể bị lặp vô hạn) nên đã bị dừng.' });
  }, ${TIMEOUT_MS});
  worker.postMessage(e.data);
};
send({ type: 'ready' });
</script>`

// Chạy code JavaScript, trả về { output: [dòng in ra], error }
export function runJavaScript(code) {
  return new Promise((resolve) => {
    const iframe = document.createElement('iframe')
    iframe.setAttribute('sandbox', 'allow-scripts')
    iframe.style.display = 'none'
    const output = []

    const finish = (error) => {
      clearTimeout(guard)
      window.removeEventListener('message', onMessage)
      iframe.remove()
      resolve({ output, error })
    }
    const onMessage = (event) => {
      if (event.source !== iframe.contentWindow) return
      const { type, text, error } = event.data
      if (type === 'ready') iframe.contentWindow.postMessage(code, '*')
      if (type === 'log') output.push(text)
      if (type === 'done') finish(error ?? null)
    }
    // Phòng trường hợp iframe không phản hồi
    const guard = setTimeout(() => finish('Không chạy được code, hãy thử lại.'), TIMEOUT_MS + 2000)

    window.addEventListener('message', onMessage)
    iframe.srcdoc = RUNNER_HTML
    document.body.appendChild(iframe)
  })
}

let sqlLoader
const loadSql = () => (sqlLoader ??= initSqlJs({ locateFile: () => sqlWasmUrl }))

/**
 * Chạy SQL trên CSDL tạm trong trình duyệt: setup tạo bảng mẫu trước rồi mới chạy query.
 * Trả về { results, error, tables }: tables là dữ liệu các bảng sau khi chạy, đã đánh dấu dòng thêm/sửa.
 * query rỗng = chỉ xem dữ liệu mẫu.
 */
export async function runSql(setup, query) {
  const SQL = await loadSql()
  const db = new SQL.Database()
  try {
    try {
      if (setup) db.run(setup)
    } catch (error) {
      return { results: [], error: `Lỗi ở SQL tạo dữ liệu mẫu: ${error.message}`, tables: [] }
    }
    const before = readTables(db)
    try {
      const results = query?.trim() ? db.exec(query) : []
      return { results, error: null, tables: diffTables(before, readTables(db)) }
    } catch (error) {
      // Lệnh lỗi giữa chừng vẫn có thể đã đổi dữ liệu ở các câu lệnh trước đó
      return { results: [], error: error.message, tables: diffTables(before, readTables(db)) }
    }
  } finally {
    db.close()
  }
}

// Dữ liệu mẫu ban đầu (chạy SQL setup, chưa chạy gì thêm), lưu cache theo nội dung setup
export function useSetupTables(setup) {
  return useQuery({
    queryKey: ['sql-setup-tables', setup],
    queryFn: () => runSql(setup, ''),
    enabled: !!setup?.trim(),
    staleTime: Infinity,
  })
}

const ROW_LIMIT = 50
const rowsOf = (results) => results[0]?.values ?? []

// Đọc mọi bảng: cột (tên, kiểu, khóa chính), tối đa 50 dòng đầu kèm rowid để so sánh trước/sau
function readTables(db) {
  const names = rowsOf(db.exec("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"))
  return names.map(([name]) => {
    const table = `"${name.replaceAll('"', '""')}"`
    const columns = rowsOf(db.exec(`PRAGMA table_info(${table})`))
      .map(([, column, type, , , pk]) => ({ name: column, type, pk: pk > 0 }))
    const total = rowsOf(db.exec(`SELECT COUNT(*) FROM ${table}`))[0][0]
    let rows
    try {
      rows = rowsOf(db.exec(`SELECT rowid, * FROM ${table} LIMIT ${ROW_LIMIT}`)).map(([rowid, ...values]) => ({ rowid, values }))
    } catch {
      // Bảng WITHOUT ROWID: không theo dõi được thay đổi từng dòng
      rows = rowsOf(db.exec(`SELECT * FROM ${table} LIMIT ${ROW_LIMIT}`)).map((values) => ({ rowid: null, values }))
    }
    return { name, columns, rows, total }
  })
}

/**
 * So dữ liệu sau khi chạy với trước khi chạy:
 * dòng có rowid mới → 'inserted', cùng rowid nhưng khác giá trị → 'updated', deleted = số dòng bị xóa.
 */
export function diffTables(before, after) {
  return after.map((table) => {
    const old = before.find((item) => item.name === table.name)
    if (!old) {
      return { ...table, isNew: true, deleted: 0, rows: table.rows.map((row) => ({ ...row, status: 'inserted' })) }
    }
    const oldValues = new Map(old.rows.map((row) => [row.rowid, JSON.stringify(row.values)]))
    const rows = table.rows.map((row) => {
      if (row.rowid === null) return { ...row, status: null }
      if (!oldValues.has(row.rowid)) return { ...row, status: 'inserted' }
      return { ...row, status: oldValues.get(row.rowid) === JSON.stringify(row.values) ? null : 'updated' }
    })
    const inserted = rows.filter((row) => row.status === 'inserted').length
    return { ...table, rows, deleted: Math.max(0, old.total - (table.total - inserted)) }
  })
}

// So kết quả của học viên với lời giải: chỉ so giá trị (bỏ qua tên cột);
// lời giải có ORDER BY thì thứ tự dòng cũng phải khớp
export function sameRows(actual, expected, ordered) {
  const normalize = (rows) => {
    const lines = rows.map((row) => JSON.stringify(row))
    return ordered ? lines : [...lines].sort()
  }
  return JSON.stringify(normalize(actual)) === JSON.stringify(normalize(expected))
}

// Dòng dữ liệu của câu lệnh SELECT cuối cùng
export const lastRows = (results) => results.at(-1)?.values ?? []
