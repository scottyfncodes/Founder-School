import { useEffect, useRef, useState } from 'react'
import { wait } from '../lib/motion'

const NAMES: [number, string, string, string, boolean][] = [
  // id, full name, first, last, needs a human look
  [101, 'Maria Lopez', 'Maria', 'Lopez', false],
  [102, 'Dev Patel', 'Dev', 'Patel', false],
  [103, 'Cher', 'Cher', '', true],
  [104, 'Mary Ann de la Cruz', 'Mary', 'Ann de la Cruz', true],
  [105, 'Tom Becker', 'Tom', 'Becker', false],
]

interface DbState {
  hasName: boolean
  hasSplit: boolean
  filled: boolean
  app: 1 | 2
  broken: boolean
  backup: boolean
}

const START: DbState = { hasName: true, hasSplit: false, filled: false, app: 1, broken: false, backup: false }

const SAFE_STEPS: { label: string; sql: string; apply: (s: DbState) => DbState; say: string; tone: 'good' | 'warn' | 'info' }[] = [
  {
    label: '💾 Take a backup',
    sql: '-- snapshot: contacts_2026_10_08_0941',
    apply: (s) => ({ ...s, backup: true }),
    say: 'Backup taken. If anything below goes wrong, you can get back to exactly this moment.',
    tone: 'good',
  },
  {
    label: '➕ Add first_name & last_name (empty, optional)',
    sql: 'ALTER TABLE contacts\n  ADD first_name TEXT NULL,\n  ADD last_name TEXT NULL;',
    apply: (s) => ({ ...s, hasSplit: true }),
    say: 'New columns added, empty for now. The live app (v1) still reads “name” and doesn’t even notice. Nothing broke.',
    tone: 'good',
  },
  {
    label: '📋 Copy data across (backfill)',
    sql: "UPDATE contacts SET\n  first_name = split_part(name,' ',1),\n  last_name = …rest of name…;",
    apply: (s) => ({ ...s, filled: true }),
    say: 'Every row filled — but real data is messy. “Cher” has no last name, and “Mary Ann de la Cruz” got split in a guessable-but-wrong way. 2 rows flagged for a human.',
    tone: 'warn',
  },
  {
    label: '🚀 Release app v2 (reads the new columns)',
    sql: '-- deploy app v2',
    apply: (s) => ({ ...s, app: 2 }),
    say: 'App v2 is live and uses first_name / last_name. The old column is still there, so rolling back to v1 would still work.',
    tone: 'good',
  },
  {
    label: '🧹 A week later: remove the old name column',
    sql: 'ALTER TABLE contacts DROP COLUMN name;',
    apply: (s) => ({ ...s, hasName: false }),
    say: 'Only now, with v2 stable and nothing reading “name”, is it safe to remove. Zero downtime, zero lost data.',
    tone: 'good',
  },
]

export function MigrationSim({ onDone }: { onDone?: () => void }) {
  const [mode, setMode] = useState<'quick' | 'safe'>('quick')
  const [db, setDb] = useState<DbState>(START)
  const [step, setStep] = useState(0) // safe steps completed
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ tone: 'good' | 'bad' | 'warn' | 'info'; text: string; sql?: string } | null>(null)
  const [quickDone, setQuickDone] = useState(false)
  const [safeDone, setSafeDone] = useState(false)
  const [fired, setFired] = useState(false)
  const alive = useRef(true)
  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])

  function finish(q: boolean, s: boolean) {
    if (!fired && q && s) {
      setFired(true)
      onDone?.()
    }
  }

  function reset(m: 'quick' | 'safe' = mode) {
    setMode(m)
    setDb(START)
    setStep(0)
    setMsg(null)
  }

  async function quick() {
    setBusy(true)
    const sql = "ALTER TABLE contacts DROP COLUMN name;\nALTER TABLE contacts\n  ADD first_name TEXT NOT NULL DEFAULT '',\n  ADD last_name TEXT NOT NULL DEFAULT '';"
    setMsg({ tone: 'info', text: 'Running on the live database…', sql })
    await wait(900)
    if (!alive.current) return
    setDb({ ...START, hasName: false, hasSplit: true, filled: false, broken: true })
    setMsg({
      tone: 'bad',
      sql,
      text: 'Two disasters at once. Every name is gone — the column was deleted before anything copied it. And the live app still asks for “name”, so every contact screen now errors. No backup was taken.',
    })
    setBusy(false)
    setQuickDone(true)
    finish(true, safeDone)
  }

  async function next() {
    const st = SAFE_STEPS[step]
    setBusy(true)
    setMsg({ tone: 'info', text: 'Running…', sql: st.sql })
    await wait(650)
    if (!alive.current) return
    setDb((d) => st.apply(d))
    setMsg({ tone: st.tone, text: st.say, sql: st.sql })
    setStep(step + 1)
    setBusy(false)
    if (step + 1 === SAFE_STEPS.length) {
      setSafeDone(true)
      finish(quickDone, true)
    }
  }

  const cols = ['id', ...(db.hasName ? ['name'] : []), ...(db.hasSplit ? ['first_name', 'last_name'] : [])]

  return (
    <div className="stack">
      <div className="callout info small">
        📋 <b>The change:</b> the new invoice feature needs first and last names separately. 214 people are using the app right now.
      </div>

      <div className="grid2">
        <button type="button" className="chip" aria-pressed={mode === 'quick'} disabled={busy} onClick={() => reset('quick')}>
          ⚡ Quick way {quickDone ? '✓' : ''}
        </button>
        <button type="button" className="chip" aria-pressed={mode === 'safe'} disabled={busy} onClick={() => reset('safe')}>
          🛡️ Safe way {safeDone ? '✓' : ''}
        </button>
      </div>

      <div className="row nowrap" style={{ gap: 8 }}>
        <div className={`node grow ${db.broken ? 'fail' : 'ok'}`} style={{ minHeight: 48, padding: '8px 12px' }}>
          <span className="emoji">📱</span>
          <div className="grow small">
            <div>Live app v{db.app}</div>
            <div className="tiny" style={{ fontWeight: 500 }}>
              {db.broken ? '💥 column “name” does not exist' : db.app === 1 ? 'reads “name” · working' : 'reads first/last · working'}
            </div>
          </div>
        </div>
        <div className={`node ${db.backup ? 'ok' : ''}`} style={{ minHeight: 48, padding: '8px 10px', flex: 'none' }}>
          <span className="emoji">💾</span>
          <span className="tiny">{db.backup ? 'Backup ✓' : 'No backup'}</span>
        </div>
      </div>

      <div className="tbl-wrap">
        <table className="tbl">
          <caption className="sr-only">contacts table</caption>
          <thead>
            <tr>
              {cols.map((c) => (
                <th key={c} className="mono">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {NAMES.map(([id, full, first, last, flag]) => {
              const lost = db.hasSplit && !db.filled && !db.hasName
              const warn = db.filled && flag
              return (
                <tr key={id} className={lost ? 'hl-bad' : warn ? '' : db.filled ? 'hl-good' : ''}>
                  <td className="mono">{id}</td>
                  {db.hasName && <td>{full}</td>}
                  {db.hasSplit && (
                    <>
                      <td style={warn ? { background: 'var(--warn-soft)' } : undefined}>{db.filled ? first : <span className="muted">{lost ? "''" : '—'}</span>}</td>
                      <td style={warn ? { background: 'var(--warn-soft)' } : undefined}>
                        {db.filled ? last || <span className="warn-text">⚠ empty</span> : <span className="muted">{lost ? "''" : '—'}</span>}
                        {warn && last ? ' ⚠' : ''}
                      </td>
                    </>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {mode === 'quick' && (
        <div className="stack sm">
          {db.broken ? (
            <button type="button" className="btn" onClick={() => reset('quick')}>
              ↺ Undo (in real life you can’t)
            </button>
          ) : (
            <button type="button" className="btn danger" onClick={quick} disabled={busy}>
              ⚡ Run one command on the live database
            </button>
          )}
        </div>
      )}

      {mode === 'safe' && (
        <div className="stack sm">
          <ol className="stack sm" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {SAFE_STEPS.map((s, i) => (
              <li key={s.label} className={`small ${i < step ? 'good-text' : i === step ? '' : 'muted'}`}>
                {i < step ? '✅' : i === step ? '👉' : '⬜'} {s.label}
              </li>
            ))}
          </ol>
          {step < SAFE_STEPS.length ? (
            <button type="button" className="btn primary" onClick={next} disabled={busy}>
              Run step {step + 1}: {SAFE_STEPS[step].label.replace(/^\S+\s/, '')}
            </button>
          ) : (
            <button type="button" className="btn" onClick={() => reset('safe')}>
              ↺ Run it again
            </button>
          )}
        </div>
      )}

      <div aria-live="polite" className="stack sm">
        {msg?.sql && <div className="code" style={{ fontSize: 12 }}>{msg.sql}</div>}
        {msg && <div className={`callout ${msg.tone} pop`} key={msg.text}>{msg.text}</div>}
        {!(quickDone && safeDone) && (
          <p className="tiny muted">Try both: the quick way, then the safe way.</p>
        )}
      </div>
    </div>
  )
}
