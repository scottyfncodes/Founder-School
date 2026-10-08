import { useState } from 'react'
import { CONTACTS, TABLES } from './miniDbData'
import type { Cell, Table } from './miniDbData'

/* ------------------------------------------------------------------ */
/* Shared table renderer                                               */
/* ------------------------------------------------------------------ */

export function DbTable({
  table,
  rowClass,
  cellStyle,
  onRow,
  onHeader,
  selectedCol,
  caption,
  rows,
}: {
  table: Table
  rowClass?: (r: Cell[], i: number) => string
  cellStyle?: (col: string, r: Cell[]) => React.CSSProperties | undefined
  onRow?: (i: number) => void
  onHeader?: (col: string) => void
  selectedCol?: string | null
  caption?: string
  rows?: Cell[][]
}) {
  const data = rows ?? table.rows
  return (
    <div className="tbl-wrap">
      <table className="tbl">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr>
            {table.columns.map((c) => (
              <th key={c} style={selectedCol === c ? { background: 'var(--accent-soft)', color: 'var(--ink)' } : undefined}>
                {onHeader ? (
                  <button
                    type="button"
                    onClick={() => onHeader(c)}
                    className="mono"
                    style={{
                      all: 'unset',
                      cursor: 'pointer',
                      display: 'inline-block',
                      padding: '10px 2px',
                      margin: '-8px 0',
                      minWidth: 30,
                      textDecoration: 'underline dotted',
                    }}
                  >
                    {c}
                    {c === 'id' ? ' 🔑' : ''}
                  </button>
                ) : (
                  <span className="mono">
                    {c}
                    {c === 'id' ? ' 🔑' : ''}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((r, i) => (
            <tr
              key={i}
              className={`${rowClass?.(r, i) ?? ''} ${onRow ? 'clickable' : ''}`}
              onClick={onRow ? () => onRow(i) : undefined}
              tabIndex={onRow ? 0 : undefined}
              onKeyDown={
                onRow
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onRow(i)
                      }
                    }
                  : undefined
              }
            >
              {table.columns.map((c, k) => (
                <td
                  key={c}
                  className={c.endsWith('id') ? 'mono' : undefined}
                  style={{
                    ...(selectedCol === c ? { background: 'var(--accent-soft)' } : undefined),
                    ...cellStyle?.(c, r),
                  }}
                >
                  {r[k] === null || r[k] === '' ? <span className="muted">—</span> : r[k]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* TableBrowser: explore tables, rows, columns, primary keys           */
/* ------------------------------------------------------------------ */

type Task = 'tables' | 'row' | 'col' | 'pk'
const TASKS: { id: Task; label: string }[] = [
  { id: 'tables', label: 'Open 3 different tables' },
  { id: 'row', label: 'Tap a row' },
  { id: 'col', label: 'Tap a column name' },
  { id: 'pk', label: 'Find the primary key (🔑)' },
]

export function TableBrowser({ onDone }: { onDone?: () => void }) {
  const [tab, setTab] = useState('contacts')
  const [opened, setOpened] = useState<Set<string>>(new Set(['contacts']))
  const [row, setRow] = useState<number | null>(null)
  const [col, setCol] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [done, setDone] = useState<Set<Task>>(new Set())
  const [fired, setFired] = useState(false)
  const t = TABLES.find((x) => x.id === tab)!

  function tick(task: Task, extra?: Set<string>) {
    const next = new Set(done)
    if (task !== 'tables') next.add(task)
    if ((extra ?? opened).size >= 3) next.add('tables')
    setDone(next)
    if (!fired && next.size === TASKS.length) {
      setFired(true)
      onDone?.()
    }
  }

  function open(id: string) {
    setTab(id)
    setRow(null)
    setCol(null)
    const tb = TABLES.find((x) => x.id === id)!
    setMsg(`${tb.name}: ${tb.what} ${tb.rows.length} rows, ${tb.columns.length} columns.`)
    const next = new Set(opened).add(id)
    setOpened(next)
    tick('tables', next)
  }

  return (
    <div className="stack">
      <div className="row" style={{ gap: 6 }} role="group" aria-label="Tables">
        {TABLES.map((x) => (
          <button key={x.id} type="button" className="chip small" aria-pressed={tab === x.id} onClick={() => open(x.id)} style={{ padding: '6px 10px', fontSize: 13 }}>
            {x.emoji} {x.name}
          </button>
        ))}
      </div>
      <DbTable
        table={t}
        caption={t.name}
        selectedCol={col}
        rowClass={(_, i) => (i === row ? 'hl' : '')}
        onRow={(i) => {
          setRow(i)
          setCol(null)
          setMsg(`One row = one thing. This row is ${t.rowLabel(t.rows[i])}. Its id is ${t.rows[i][0]}.`)
          tick('row')
        }}
        onHeader={(c) => {
          setCol(c)
          setRow(null)
          if (c === 'id') {
            setMsg(`🔑 The primary key. Every ${t.name} row gets a unique id that never changes and is never reused — so the app can always point at exactly one row.`)
            tick('pk')
          } else {
            setMsg(`One column = one kind of fact, for every row. “${c}”: ${t.colInfo[c] ?? ''}`)
            tick('col')
          }
        }}
      />
      <p className="tiny muted">Tables scroll sideways. Tap rows and column names.</p>
      <div aria-live="polite">{msg && <div className="callout info small pop" key={msg}>{msg}</div>}</div>
      <ul className="stack sm" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {TASKS.map((x) => (
          <li key={x.id} className={`small ${done.has(x.id) ? 'good-text' : 'muted'}`}>
            {done.has(x.id) ? '✅' : '⬜'} {x.label}
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* TwoMarias: why you delete by id, not by name                        */
/* ------------------------------------------------------------------ */

export function TwoMarias({ onDone }: { onDone?: () => void }) {
  const [mode, setMode] = useState<'name' | 'id' | null>(null)
  const [fired, setFired] = useState(false)
  const rows = CONTACTS.rows.slice(0, 5)

  function run(m: 'name' | 'id') {
    setMode(m)
    if (m === 'id' && !fired) {
      setFired(true)
      onDone?.()
    }
  }

  const hit = (r: Cell[]) => (mode === 'name' ? r[1] === 'Maria Lopez' : mode === 'id' ? r[0] === 105 : false)
  const wrong = (r: Cell[]) => mode === 'name' && r[0] === 101

  return (
    <div className="stack">
      <div className="well small">
        📨 <b>Support ticket:</b> “Please delete my contact record — Maria Lopez, Lopez Ag Services, Boston.”
      </div>
      <DbTable
        table={CONTACTS}
        rows={rows}
        caption="Contacts"
        rowClass={(r) => (wrong(r) ? 'hl-bad' : hit(r) ? 'hl-good' : '')}
        cellStyle={(c, r) => (hit(r) && mode ? { textDecoration: 'line-through' } : c === 'name' && r[1] === 'Maria Lopez' ? { fontWeight: 700 } : undefined)}
      />
      <div className="stack sm">
        <button type="button" className="chip mono" aria-pressed={mode === 'name'} onClick={() => run('name')} style={{ fontSize: 13 }}>
          DELETE WHERE name = 'Maria Lopez'
        </button>
        <button type="button" className="chip mono" aria-pressed={mode === 'id'} onClick={() => run('id')} style={{ fontSize: 13 }}>
          DELETE WHERE id = 105
        </button>
      </div>
      <div aria-live="polite">
        {mode === 'name' && (
          <div className="callout bad pop">
            2 rows deleted — including the <b>wrong</b> Maria, a Denver customer with notes and documents. Names aren’t unique. Try the other
            one.
          </div>
        )}
        {mode === 'id' && (
          <div className="callout good pop">
            1 row deleted — exactly the right one. That’s the job of a primary key: one id, one row, no guessing.
          </div>
        )}
      </div>
    </div>
  )
}
