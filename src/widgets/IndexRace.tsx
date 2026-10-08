import { useEffect, useRef, useState } from 'react'
import { wait } from '../lib/motion'
import { num } from '../lib/util'

const SIZES = [
  { n: 1_000, label: '1,000', scanMs: 0.4, anim: 500 },
  { n: 100_000, label: '100,000', scanMs: 45, anim: 1300 },
  { n: 10_000_000, label: '10 million', scanMs: 4200, anim: 3000 },
]

const HOPS = ['Open the email index', 'Jump to the “t” section', 'Jump to “tom@…”', 'Found → row 104']

const fmtMs = (ms: number) => (ms >= 1000 ? `${(ms / 1000).toFixed(1)} s` : ms >= 1 ? `${Math.round(ms)} ms` : `${ms.toFixed(1)} ms`)

/**
 * Two lanes search the same table for one email: a full scan vs. an index lookup.
 */
export function IndexRace({ onDone }: { onDone?: () => void }) {
  const [size, setSize] = useState(1)
  const [busy, setBusy] = useState(false)
  const [scan, setScan] = useState(0) // 0..1
  const [hop, setHop] = useState(-1)
  const [result, setResult] = useState<{ size: number } | null>(null)
  const [raced, setRaced] = useState<Set<number>>(new Set())
  const [fired, setFired] = useState(false)
  const runId = useRef(0)
  useEffect(() => () => void runId.current++, [])

  const S = SIZES[size]

  async function race() {
    const my = ++runId.current
    setBusy(true)
    setResult(null)
    setScan(0)
    setHop(-1)
    const indexRun = (async () => {
      for (let i = 0; i < HOPS.length; i++) {
        await wait(110)
        if (runId.current !== my) return
        setHop(i)
      }
    })()
    const frames = 20
    for (let i = 1; i <= frames; i++) {
      await wait(S.anim / frames)
      if (runId.current !== my) return
      setScan(Math.min(1, (i / frames) * 1.0))
    }
    await indexRun
    if (runId.current !== my) return
    setBusy(false)
    setResult({ size })
    const next = new Set(raced).add(size)
    setRaced(next)
    if (!fired && next.has(2)) {
      setFired(true)
      onDone?.()
    }
  }

  return (
    <div className="stack">
      <div className="stack sm">
        <div className="kicker">How many contacts in the table?</div>
        <div className="grid3">
          {SIZES.map((s, i) => (
            <button
              key={s.n}
              type="button"
              className="chip small center"
              aria-pressed={size === i}
              disabled={busy}
              onClick={() => {
                setSize(i)
                setResult(null)
                setScan(0)
                setHop(-1)
              }}
              style={{ padding: '6px 8px', textAlign: 'center' }}
            >
              {s.label} {raced.has(i) ? '✓' : ''}
            </button>
          ))}
        </div>
      </div>

      <div className="code" style={{ fontSize: 12 }}>
        SELECT * FROM contacts{'\n'}WHERE email = 'tom@becker.aero';
      </div>

      <button type="button" className="btn primary" onClick={race} disabled={busy}>
        {busy ? 'Searching…' : `🏁 Race on ${S.label} rows`}
      </button>

      <div className="card tight flat stack sm">
        <div className="row between">
          <b className="small">🐢 No index</b>
          <span className="tiny muted">check every row, in order</span>
        </div>
        <div className="meter">
          <span style={{ width: `${scan * 100}%`, background: 'var(--warn)', transition: 'none' }} />
        </div>
        <div className="tiny mono">
          rows checked: {num(scan * S.n)} / {S.label}
          {result && <b className="warn-text"> · {fmtMs(S.scanMs)}</b>}
        </div>
      </div>

      <div className="card tight flat stack sm">
        <div className="row between">
          <b className="small">⚡ With an index on email</b>
          <span className="tiny muted">like the index at the back of a book</span>
        </div>
        <div className="meter">
          <span style={{ width: `${((hop + 1) / HOPS.length) * 100}%`, background: 'var(--good)' }} />
        </div>
        <ol className="tiny" style={{ margin: 0, paddingLeft: 18 }}>
          {HOPS.map((h, i) => (
            <li key={h} className={i <= hop ? '' : 'muted'} style={{ opacity: i <= hop ? 1 : 0.4 }}>
              {h}
            </li>
          ))}
        </ol>
        <div className="tiny mono">
          rows checked: {hop >= HOPS.length - 1 ? 4 : Math.max(0, hop + 1)}
          {hop >= HOPS.length - 1 && <b className="good-text"> · 0.1 ms</b>}
        </div>
      </div>

      <div aria-live="polite" className="stack sm">
        {result && (
          <div className={`callout ${result.size === 2 ? 'bad' : result.size === 1 ? 'warn' : 'info'} pop`}>
            {result.size === 0 && 'With 1,000 rows, both feel instant. This is why apps are fast in testing — and slow down as they grow.'}
            {result.size === 1 && 'Already 450× slower without the index. Users won’t notice once — but your database does this for every search, every user.'}
            {result.size === 2 &&
              '4.2 seconds vs. 0.1 ms. Same data, same question. Without the index, the search box times out and the database gets hammered.'}
          </div>
        )}
        {result && raced.has(2) && (
          <div className="grid2 pop">
            <div className="stat">
              <span className="v">+10%</span>
              <span className="l">Slower saves (the index must be updated too)</span>
            </div>
            <div className="stat">
              <span className="v">+6%</span>
              <span className="l">Extra disk space</span>
            </div>
          </div>
        )}
        {!raced.has(2) && <p className="tiny muted">Race at least once with 10 million rows.</p>}
      </div>
    </div>
  )
}
