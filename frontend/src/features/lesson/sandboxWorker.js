// Code JavaScript của học viên chạy trong Web Worker được tạo bên trong iframe sandbox:
// không đụng được tới trang chính, cookie hay DOM. File này được nhúng dạng văn bản (?raw) vào runCode.js.

// In giá trị giống Node.js: [ 1, 2 ], { a: 1 }; chuỗi nằm trong mảng/đối tượng có dấu nháy đơn
export function formatValue(value, nested = false) {
  if (typeof value === 'string') return nested ? `'${value}'` : value
  if (typeof value === 'function') return `[Function: ${value.name || '(anonymous)'}]`
  if (value === null || typeof value !== 'object') return String(value)
  if (Array.isArray(value)) {
    return value.length ? `[ ${value.map((item) => formatValue(item, true)).join(', ')} ]` : '[]'
  }
  const entries = Object.entries(value)
  return entries.length ? `{ ${entries.map(([key, item]) => `${key}: ${formatValue(item, true)}`).join(', ')} }` : '{}'
}

const isWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope

if (isWorker) {
  const print = (...args) => self.postMessage({ type: 'log', text: args.map((arg) => formatValue(arg)).join(' ') })
  const fakeConsole = { log: print, info: print, warn: print, error: print }

  self.onmessage = (event) => {
    try {
      new Function('console', event.data)(fakeConsole)
      // Chờ một chút cho các lệnh in bất đồng bộ (setTimeout, Promise) kịp chạy
      setTimeout(() => self.postMessage({ type: 'done' }), 100)
    } catch (error) {
      self.postMessage({ type: 'done', error: `${error.name}: ${error.message}` })
    }
  }
}
