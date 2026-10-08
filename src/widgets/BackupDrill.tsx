import { useEffect, useRef, useState } from 'react'
import { wait } from '../lib/motion'
import { num } from '../lib/util'

function useAlive() {
  const alive = useRef(true)
  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])
  return alive
}

/* ================================================================== */
/* BackupChain — the four layers of copies, and which ones survive    */
/* ================================================================== */

type TierId = 'live' | 'nightly' | 'offsite' | 'immutable'

const TIERS: { id: TierId; emoji: string; label: string; meta: string; what: string }[] = [
  {
    id: 'live',
    emoji: '🗄️',
    label: 'Live database',
    meta: 'changes every second',
    what: 'Where your app reads and writes right now. It is not a backup of anything — it is the thing you’re protecting.',
  },
  {
    id: 'nightly',
    emoji: '🌙',
    label: 'Nightly backup',
    meta: 'same cloud account · kept 7 days',
    what: 'A full copy every night, plus a change log for point-in-time recovery. Fast to restore — but it lives next to the live database, and copies older than 7 days are deleted (retention).',
  },
  {
    id: 'offsite',
    emoji: '🌍',
    label: 'Offsite backup',
    meta: 'another region · weekly · kept 12 weeks',
    what: 'A copy far away — another region or provider. Survives a fire, flood or outage where your main servers live. Slower to restore.',
  },
  {
    id: 'immutable',
    emoji: '🧊',
    label: 'Immutable backup',
    meta: 'write-once lock · daily · 30 days',
    what: 'A copy that nobody can change or delete until its lock expires — not you, not an admin, not an attacker with your passwords.',
  },
]

type Fate = 'ok' | 'fail' | 'warn'

const DISASTERS: {
  id: string
  emoji: string
  label: string
  fates: Record<TierId, { fate: Fate; note: string }>
  result: string
}[] = [
  {
    id: 'delete',
    emoji: '🧹',
    label: 'A script deletes the customers table',
    fates: {
      live: { fate: 'fail', note: 'customers table gone' },
      nightly: { fate: 'ok', note: 'last night’s copy + change log ✓' },
      offsite: { fate: 'ok', note: 'Sunday’s copy ✓' },
      immutable: { fate: 'ok', note: 'today 1 AM copy ✓' },
    },
    result: 'Every layer survives. The nightly backup is the fastest restore, and its change log can rewind to one minute before the mistake.',
  },
  {
    id: 'silent',
    emoji: '🐛',
    label: 'A bug quietly corrupts data — noticed 10 days later',
    fates: {
      live: { fate: 'fail', note: 'corrupted for 10 days' },
      nightly: { fate: 'fail', note: 'all 7 copies already corrupted' },
      offsite: { fate: 'ok', note: '12 weeks kept → a clean copy ✓' },
      immutable: { fate: 'ok', note: '30 days kept → a clean copy ✓' },
    },
    result: 'Retention matters. Seven days of nightly copies were all made AFTER the bug. Only the copies kept longer still have clean data.',
  },
  {
    id: 'region',
    emoji: '🌩️',
    label: 'The whole cloud region goes down',
    fates: {
      live: { fate: 'fail', note: 'unreachable' },
      nightly: { fate: 'fail', note: 'same region — unreachable' },
      offsite: { fate: 'ok', note: 'different region ✓' },
      immutable: { fate: 'ok', note: 'stored in a third region ✓' },
    },
    result: 'Backups stored next to the thing they protect fail together. Offsite means “far enough that one disaster can’t reach both”.',
  },
  {
    id: 'ransom',
    emoji: '🦠',
    label: 'Ransomware: attacker steals your admin keys',
    fates: {
      live: { fate: 'fail', note: 'encrypted — “pay to unlock”' },
      nightly: { fate: 'fail', note: 'deleted with your admin keys' },
      offsite: { fate: 'fail', note: 'same keys could reach it — deleted' },
      immutable: { fate: 'ok', note: 'locked — delete refused ✓' },
    },
    result: 'Attackers go after your backups first. Anything your stolen keys can delete, they will. Only the immutable copy survives — so you can restore instead of paying.',
  },
]

export function BackupChain({ onDone }: { onDone?: () => void }) {
  const alive = useAlive()
  const [openTier, setOpenTier] = useState<TierId | null>(null)
  const [states, setStates] = useState<Partial<Record<TierId, { fate: Fate | 'active'; note: string }>>>({})
  const [running, setRunning] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [ran, setRan] = useState<Set<string>>(new Set())
  const fired = useRef(false)

  async function run(d: (typeof DISASTERS)[number]) {
    setRunning(d.id)
    setResult(null)
    setOpenTier(null)
    setStates({})
    for (const t of TIERS) {
      setStates((s) => ({ ...s, [t.id]: { fate: 'active', note: 'checking…' } }))
      await wait(450)
      if (!alive.current) return
      setStates((s) => ({ ...s, [t.id]: d.fates[t.id] }))
      await wait(350)
      if (!alive.current) return
    }
    setRunning(null)
    setResult(d.result)
    const next = new Set(ran).add(d.id)
    setRan(next)
    if (!fired.current && next.size === DISASTERS.length) {
      fired.current = true
      onDone?.()
    }
  }

  return (
    <div className="stack">
      <div className="stack sm" style={{ gap: 0 }}>
        {TIERS.map((t, i) => {
          const st = states[t.id]
          const cls = st ? (st.fate === 'active' ? 'active' : st.fate) : running ? 'dim' : openTier === t.id ? 'active' : ''
          return (
            <div key={t.id}>
              <button type="button" className={`node ${cls}`} aria-expanded={openTier === t.id} onClick={() => setOpenTier(openTier === t.id ? null : t.id)} disabled={!!running}>
                <span className="emoji">{t.emoji}</span>
                <span className="grow">
                  <span style={{ display: 'block' }}>{t.label}</span>
                  <span className="tiny muted" style={{ display: 'block', fontWeight: 500 }}>
                    {st ? st.note : t.meta}
                  </span>
                </span>
                <span aria-hidden="true" style={{ fontSize: 18 }}>
                  {st?.fate === 'ok' ? '✅' : st?.fate === 'fail' ? '💥' : ''}
                </span>
              </button>
              {openTier === t.id && <p className="small card tight flat pop" style={{ marginTop: 6 }}>{t.what}</p>}
              {i < TIERS.length - 1 && <div className="link" />}
            </div>
          )
        })}
      </div>

      <div className="stack sm" role="group" aria-label="Disasters">
        <div className="kicker">Unleash a disaster ({ran.size}/{DISASTERS.length})</div>
        {DISASTERS.map((d) => (
          <button key={d.id} type="button" className="btn small danger block" style={{ justifyContent: 'flex-start', textAlign: 'left' }} disabled={!!running} onClick={() => void run(d)}>
            {d.emoji} {d.label}
            {ran.has(d.id) ? ' ✓' : ''}
          </button>
        ))}
      </div>

      <div aria-live="polite">{result && <div className="callout warn pop">{result}</div>}</div>
    </div>
  )
}

/* ================================================================== */
/* RestoreDrill — actually perform the restore                         */
/* ================================================================== */

/** Minutes since Wednesday 00:00. */
const DISASTER = 24 * 60 + 14 * 60 + 47 // Thu 2:47 PM
const DETECTED = DISASTER + 5 // alert fired at 2:52 PM
const NOW = 24 * 60 + 15 * 60 // Thu 3:00 PM
const ORDERS_PER_MIN = 1 / 3

const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu']

function fmt(m: number) {
  const d = Math.floor(m / 1440)
  const mm = ((m % 1440) + 1440) % 1440
  const h = Math.floor(mm / 60)
  const min = mm % 60
  const ampm = h < 12 ? 'AM' : 'PM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${DAY[d + 3]} ${h12}:${String(min).padStart(2, '0')} ${ampm}`
}

function dur(mins: number) {
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h >= 48) return `${Math.round(h / 24)} days`
  return m ? `${h}h ${m}m` : `${h}h`
}

interface Source {
  id: string
  emoji: string
  label: string
  note: string
  /** Available restore points (minutes); empty = continuous. */
  points: number[]
  /** Continuous range for point-in-time recovery. */
  range?: [number, number]
  restoreMins: number
}

const SOURCES: Source[] = [
  { id: 'pitr', emoji: '⏪', label: 'Point-in-time recovery', note: 'Any minute in the last 7 days · restore ≈ 45 min', points: [], range: [0, NOW], restoreMins: 45 },
  { id: 'nightly', emoji: '🌙', label: 'Nightly backup', note: 'Snapshots at 2:00 AM · restore ≈ 20 min', points: [120, 1440 + 120], restoreMins: 20 },
  { id: 'immutable', emoji: '🧊', label: 'Immutable backup', note: 'Daily at 1:00 AM · restore ≈ 70 min', points: [60, 1440 + 60], restoreMins: 70 },
  { id: 'offsite', emoji: '🌍', label: 'Offsite backup', note: 'Weekly, Sunday 3:00 AM · restore ≈ 3 h', points: [-3 * 1440 + 180], restoreMins: 180 },
]

const NOW_CHOICES = [
  { id: 'restart', text: 'Restart the server — maybe the data comes back', right: false, why: 'Restarting reloads the app, not the data. The rows were deleted from the database itself.' },
  { id: 'restore', text: 'Stop writes and restore from a backup', right: true, why: 'Right. Pause the app so nothing new lands on the broken database, then restore a known-good copy.' },
  { id: 'wait', text: 'Wait and see if it fixes itself', right: false, why: 'Deleted data never comes back on its own. Every minute you wait is downtime.' },
]

type Phase = 'now' | 'source' | 'point' | 'restoring' | 'restored' | 'verified'

export function RestoreDrill({ onDone }: { onDone?: () => void }) {
  const alive = useAlive()
  const [phase, setPhase] = useState<Phase>('now')
  const [nowPick, setNowPick] = useState<string | null>(null)
  const [src, setSrc] = useState<Source | null>(null)
  const [pointIdx, setPointIdx] = useState(0)
  const [pitr, setPitr] = useState(DISASTER + 30)
  const [progress, setProgress] = useState(0)
  const [verify, setVerify] = useState<null | { ok: boolean }>(null)
  const [runs, setRuns] = useState<{ src: string; rpo: number; rto: number }[]>([])
  const fired = useRef(false)

  const point = src ? (src.range ? pitr : src.points[pointIdx]) : 0
  const afterDisaster = point >= DISASTER
  const rpo = DISASTER - point
  const rto = src ? DETECTED - DISASTER + src.restoreMins + 10 : 0

  function chooseSource(s: Source) {
    setSrc(s)
    setPointIdx(s.points.length ? s.points.length - 1 : 0)
    setVerify(null)
    setPhase('point')
  }

  async function restore() {
    if (!src) return
    setPhase('restoring')
    setProgress(0)
    for (let i = 1; i <= 10; i++) {
      await wait(220)
      if (!alive.current) return
      setProgress(i / 10)
    }
    setPhase('restored')
  }

  function runVerify() {
    if (!src) return
    const ok = !afterDisaster
    setVerify({ ok })
    if (ok) {
      setPhase('verified')
      setRuns((r) => [...r, { src: src.label, rpo, rto }])
      if (!fired.current) {
        fired.current = true
        onDone?.()
      }
    }
  }

  function reset() {
    setSrc(null)
    setVerify(null)
    setProgress(0)
    setPitr(DISASTER + 30)
    setPhase('source')
  }

  const pct = (m: number) => `${Math.max(0, Math.min(100, (m / NOW) * 100))}%`

  return (
    <div className="stack">
      <div className="callout bad stack sm">
        <div style={{ fontWeight: 800, fontSize: 18 }}>💥 DATABASE DESTROYED</div>
        <div className="small">
          {fmt(DISASTER)}: a migration script wiped the live database. Alert fired at {fmt(DETECTED).split(' ').slice(1).join(' ')}. The app shows empty accounts to every customer.
        </div>
      </div>

      {phase === 'now' && (
        <div className="stack sm">
          <div className="kicker">What happens now?</div>
          {NOW_CHOICES.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`chip ${nowPick === c.id ? (c.right ? 'good' : 'bad') : ''}`}
              onClick={() => {
                setNowPick(c.id)
                if (c.right) setPhase('source')
              }}
            >
              {c.text}
            </button>
          ))}
          {nowPick && !NOW_CHOICES.find((c) => c.id === nowPick)?.right && (
            <div className="callout bad small pop" aria-live="polite">
              {NOW_CHOICES.find((c) => c.id === nowPick)?.why} Try again.
            </div>
          )}
        </div>
      )}

      {phase !== 'now' && (
        <div className="callout good small">
          ✅ Right: stop writes, then restore a known-good copy. Maintenance page is up.
        </div>
      )}

      {phase === 'source' && (
        <div className="stack sm pop">
          <div className="kicker">Step 1 · Pick a backup source</div>
          {SOURCES.map((s) => (
            <button key={s.id} type="button" className="node" onClick={() => chooseSource(s)}>
              <span className="emoji">{s.emoji}</span>
              <span className="grow">
                <span style={{ display: 'block' }}>{s.label}</span>
                <span className="tiny muted" style={{ display: 'block', fontWeight: 500 }}>
                  {s.note}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}

      {src && phase !== 'source' && phase !== 'now' && (
        <div className="stack sm">
          <div className="row between">
            <span className="kicker">Step 2 · Choose a restore point</span>
            <span className="pill">
              {src.emoji} {src.label}
            </span>
          </div>

          {/* timeline */}
          <div aria-hidden="true" style={{ position: 'relative', height: 46, margin: '8px 4px 0' }}>
            <div style={{ position: 'absolute', left: 0, right: 0, top: 20, height: 6, borderRadius: 3, background: 'var(--surface-3)' }} />
            {src.range && <div style={{ position: 'absolute', left: 0, right: 0, top: 20, height: 6, borderRadius: 3, background: 'var(--info-soft)' }} />}
            {src.points
              .filter((p) => p >= 0)
              .map((p) => (
                <div key={p} style={{ position: 'absolute', left: pct(p), top: 17, width: 12, height: 12, marginLeft: -6, borderRadius: 6, background: 'var(--info)' }} />
              ))}
            {src.points.some((p) => p < 0) && (
              <div className="tiny" style={{ position: 'absolute', left: 0, top: 30, color: 'var(--info)', fontWeight: 700 }}>
                ← Sunday
              </div>
            )}
            <div style={{ position: 'absolute', left: pct(DISASTER), top: 0, marginLeft: -9, fontSize: 16 }}>💥</div>
            <div style={{ position: 'absolute', left: pct(DISASTER), top: 20, width: 2, height: 22, background: 'var(--bad)' }} />
            <div
              style={{
                position: 'absolute',
                left: pct(point),
                top: 14,
                width: 4,
                height: 18,
                marginLeft: -2,
                borderRadius: 2,
                background: afterDisaster ? 'var(--bad)' : 'var(--good)',
                transition: 'left 0.15s',
              }}
            />
            <div className="tiny muted" style={{ position: 'absolute', left: 0, bottom: -4 }}>
              Wed
            </div>
            <div className="tiny muted" style={{ position: 'absolute', left: pct(1440), bottom: -4 }}>
              Thu
            </div>
          </div>

          <input
            type="range"
            aria-label="Restore point"
            min={src.range ? src.range[0] : 0}
            max={src.range ? src.range[1] : src.points.length - 1}
            step={1}
            value={src.range ? pitr : pointIdx}
            disabled={phase === 'restoring'}
            onChange={(e) => {
              const v = Number(e.target.value)
              if (src.range) setPitr(v)
              else setPointIdx(v)
              setVerify(null)
              if (phase !== 'point') setPhase('point')
            }}
          />
          {src.range && (
            <div className="row" style={{ gap: 6 }}>
              {[-60, -10, -1, 1, 10].map((d) => (
                <button
                  key={d}
                  type="button"
                  className="btn small"
                  style={{ flex: '1 1 0', minWidth: 48, padding: '8px 4px' }}
                  disabled={phase === 'restoring'}
                  onClick={() => {
                    setPitr((p) => Math.max(0, Math.min(NOW, p + d)))
                    setVerify(null)
                    if (phase !== 'point') setPhase('point')
                  }}
                >
                  {d > 0 ? '+' : '−'}
                  {Math.abs(d) === 60 ? '1h' : `${Math.abs(d)}m`}
                </button>
              ))}
            </div>
          )}
          <div className="row between">
            <span className="small">
              Restore to: <b className="mono">{fmt(point)}</b>
            </span>
            <span className={`tiny ${afterDisaster ? 'bad-text' : 'muted'}`}>
              {afterDisaster ? 'after the 💥' : `${dur(rpo)} before the 💥`}
            </span>
          </div>

          {phase === 'point' && (
            <div className="row nowrap" style={{ gap: 8 }}>
              <button type="button" className="btn small ghost" onClick={reset}>
                ← Source
              </button>
              <button type="button" className="btn primary grow" onClick={() => void restore()}>
                Restore to this point
              </button>
            </div>
          )}

          {phase !== 'point' && (
            <div className="stack sm">
              <div className="kicker">Step 3 · Restoring</div>
              <div className="meter">
                <span style={{ width: `${progress * 100}%`, background: 'var(--good)' }} />
              </div>
              <div className="tiny muted">
                {phase === 'restoring'
                  ? `Copying data back… (in real life ≈ ${dur(src.restoreMins)})`
                  : `Restore finished after ≈ ${dur(src.restoreMins)}.`}
              </div>
            </div>
          )}

          {(phase === 'restored' || phase === 'verified') && (
            <div className="stack sm pop">
              <div className="kicker">Step 4 · Verify before you reopen</div>
              {!verify && (
                <button type="button" className="btn primary block" onClick={runVerify}>
                  🔎 Run verification checks
                </button>
              )}
              {verify && !verify.ok && (
                <div className="callout bad pop stack sm">
                  <div className="mono small">✕ customers: 0 rows · orders: 0 rows</div>
                  <div className="small">You restored to a moment AFTER the disaster, so you got the destroyed database back. Pick an earlier point.</div>
                  <button type="button" className="btn small block" onClick={() => { setVerify(null); setPhase('point') }}>
                    ← Choose another restore point
                  </button>
                </div>
              )}
              {verify?.ok && (
                <div className="stack sm pop">
                  <div className="well stack sm" style={{ padding: 10 }}>
                    <div className="mono tiny good-text">✓ customers: 2,311 rows</div>
                    <div className="mono tiny good-text">✓ app logins work on a test account</div>
                    <div className={`mono tiny ${rpo > 5 ? 'warn-text' : 'good-text'}`}>
                      {rpo > 5 ? '⚠' : '✓'} latest order: {fmt(point)}
                    </div>
                  </div>
                  <div className="grid2">
                    <div className="stat">
                      <span className={`v ${rpo > 60 ? 'bad-text' : 'good-text'}`}>{dur(rpo)}</span>
                      <span className="l">of data lost (RPO)</span>
                    </div>
                    <div className="stat">
                      <span className={`v ${rto > 120 ? 'bad-text' : ''}`}>{dur(rto)}</span>
                      <span className="l">down until fixed (RTO)</span>
                    </div>
                  </div>
                  <p className="small ink2">
                    ≈ {num(rpo * ORDERS_PER_MIN)} orders placed after {fmt(point)} are gone and must be recovered by hand (from payment records or emails).
                  </p>
                  <button type="button" className="btn small block" onClick={reset}>
                    ↻ Try another backup source
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {runs.length > 0 && (
        <div className="stack sm">
          <div className="kicker">Your restore drills</div>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Data lost</th>
                  <th>Downtime</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((r, i) => (
                  <tr key={i}>
                    <td>{r.src}</td>
                    <td>{dur(r.rpo)}</td>
                    <td>{dur(r.rto)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="callout info small">
            <b>A backup that has never been restored is a theory.</b> You just turned it into a fact — with real numbers for data lost and time down.
          </div>
        </div>
      )}
    </div>
  )
}
