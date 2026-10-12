import { useState } from 'react'
import CodeEditor from '../../components/CodeEditor'
import { Alert, Button } from '../../components/ui'
import { RunResult } from './Blocks'
import { runSql, useSetupTables } from './runCode'
import TableViewer from './TableViewer'

// SQL Playground dùng chung cho cả khóa: chạy SQL tự do trên dữ liệu mẫu của khóa học
export default function SqlPlayground({ setupSql }) {
  const { data: initial } = useSetupTables(setupSql)
  const [code, setCode] = useState(null)
  const [run, setRun] = useState(null)
  const [runCount, setRunCount] = useState(0)
  const [running, setRunning] = useState(false)

  // Chưa gõ gì thì gợi ý xem bảng đầu tiên
  const firstTable = initial?.tables[0]?.name
  const query = code ?? (firstTable ? `SELECT * FROM ${firstTable} LIMIT 10;` : '')
  const tables = run?.tables?.length ? run.tables : initial?.tables ?? []

  const execute = async () => {
    setRunning(true)
    setRunCount((count) => count + 1)
    setRun({ ...(await runSql(setupSql, query)), correct: null })
    setRunning(false)
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">Dữ liệu mẫu của khóa học, được tạo lại mỗi lần chạy nên cứ thoải mái thử INSERT, UPDATE, DELETE.</p>
      {initial?.error && <Alert tone="danger">{initial.error}</Alert>}
      {tables.length > 0 && (
        <TableViewer
          key={run ? `run-${runCount}` : 'initial'}
          tables={tables}
          title={run ? 'Dữ liệu sau khi chạy' : 'Bảng dữ liệu'}
          onPickTable={(name) => setCode(`SELECT * FROM ${name} LIMIT 10;`)}
        />
      )}
      <CodeEditor value={query} onChange={setCode} language="sql" minHeight="7rem" />
      <div className="flex gap-2">
        <Button size="sm" onClick={execute} disabled={running || !query.trim()}>{running ? 'Đang chạy…' : '▶ Chạy'}</Button>
        {run && <Button size="sm" variant="ghost" onClick={() => setRun(null)}>Về dữ liệu gốc</Button>}
      </div>
      {run && <RunResult run={run} isSql />}
    </div>
  )
}
