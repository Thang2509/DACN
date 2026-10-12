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

// Chạy SQL trên CSDL tạm trong trình duyệt (setup tạo bảng mẫu trước), trả về { results, error }
export async function runSql(setup, query) {
  const SQL = await loadSql()
  const db = new SQL.Database()
  try {
    if (setup) db.run(setup)
    return { results: db.exec(query), error: null }
  } catch (error) {
    return { results: [], error: error.message }
  } finally {
    db.close()
  }
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
