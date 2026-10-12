import { useEffect, useRef } from 'react'
import { basicSetup, EditorView } from 'codemirror'
import { EditorState } from '@codemirror/state'
import { javascript } from '@codemirror/lang-javascript'
import { sql } from '@codemirror/lang-sql'

const theme = EditorView.theme({
  '&': { fontSize: '14px', backgroundColor: '#fff' },
  '.cm-scroller': { fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace', minHeight: 'var(--editor-min-height)' },
  '.cm-gutters': { backgroundColor: '#f7f7fc', borderRight: '1px solid #e0e3ff' },
  '&.cm-focused': { outline: 'none' },
})

// Ô soạn code CodeMirror; value được đồng bộ khi thay đổi từ bên ngoài (vd. bấm "Làm lại")
export default function CodeEditor({ value, onChange, language = 'javascript', minHeight = '8rem', readOnly = false }) {
  const host = useRef(null)
  const view = useRef(null)
  const onChangeRef = useRef(onChange)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    view.current = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: value ?? '',
        extensions: [
          basicSetup,
          language === 'sql' ? sql() : javascript(),
          theme,
          EditorState.readOnly.of(readOnly),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) onChangeRef.current?.(update.state.doc.toString())
          }),
        ],
      }),
    })
    return () => view.current.destroy()
    // Chỉ tạo lại editor khi đổi ngôn ngữ/chế độ; nội dung đồng bộ ở effect bên dưới
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [language, readOnly])

  useEffect(() => {
    const current = view.current.state.doc.toString()
    if ((value ?? '') !== current) {
      view.current.dispatch({ changes: { from: 0, to: current.length, insert: value ?? '' } })
    }
  }, [value])

  return (
    <div
      ref={host}
      style={{ '--editor-min-height': minHeight }}
      className="overflow-hidden rounded-xl border-2 border-primary-100 focus-within:border-primary-400"
    />
  )
}
