import { useEffect, useRef, useState } from 'react'
import { wait } from '../lib/motion'

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

/* A Tuesday morning: deploy v57 goes out at 9:02 and quietly breaks checkout. */
const START = 9 * 60
const STEP = 5
const FRAMES = 32 // 9:00 → 11:40
const BREAK_AT = 9 * 60 + 5
const THRESHOLD = 2 // % error rate that triggers an alert
const ALERT_AFTER = 2 // consecutive bad buckets

function errorRate(frame: number, fixed: boolean) {
  const t = START + frame * STEP
  if (fixed || t < BREAK_AT) return 0.4 + ((frame * 7) % 5) / 10
  return 17 + ((frame * 13) % 7) / 2
}

function clock(m: number) {
  const h = Math.floor(m / 60)
  const mm = m % 60
  return `${h > 12 ? h - 12 : h}:${String(mm).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
}

const LOGS = [
  { t: '09:14:01', lvl: 'INFO', id: 'req_a12', text: 'GET /dashboard → 200 (84 ms)' },
  { t: '09:14:03', lvl: 'ERROR', id: 'req_7f3', text: 'POST /checkout → 500 payment failed' },
  { t: '09:14:05', lvl: 'INFO', id: 'req_b44', text: 'GET /contacts → 200 (61 ms)' },
  { t: '09:14:06', lvl: 'ERROR', id: 'req_c90', text: 'POST /checkout → 500 payment failed' },
  { t: '09:14:09', lvl: 'INFO', id: 'req_d02', text: 'POST /login → 200 (130 ms)' },
]

const TRACE = [
  { emoji: '🎨', name: 'Frontend', text: 'POST /checkout sent (12 ms)', ok: true },
  { emoji: '🚪', name: 'API', text: 'User #482 authenticated', ok: true },
  { emoji: '⚙️', name: 'Backend', text: 'Order #9921 created, calling payments…', ok: true },
  { emoji: '💳', name: 'Payments provider', text: '401 invalid API key — PAYMENTS_KEY is empty since deploy v57 (9:02)', ok: false },
]

type Mode = 'off' | 'on'

export function MonitorBoard({ onDone }: { onDone?: () => void }) {
  const alive = useAlive()
  const [mode, setMode] = useState<Mode>('off')
  const [frame, setFrame] = useState(-1)
  const [running, setRunning] = useState(false)
  const [outcome, setOutcome] = useState<null | { mode: Mode; at: number }>(null)
  const [didOff, setDidOff] = useState(false)
  const [didOn, setDidOn] = useState(false)
  const [traced, setTraced] = useState<string | null>(null)
  const [rolledBack, setRolledBack] = useState(false)
  const fired = useRef(false)

  useEffect(() => {
    if (!fired.current && didOff && didOn && traced) {
      fired.current = true
      onDone?.()
    }
  }, [didOff, didOn, traced, onDone])

  async function run() {
    const m = mode
    setRunning(true)
    setOutcome(null)
    setTraced(null)
    setRolledBack(false)
    setFrame(-1)
    let bad = 0
    for (let f = 0; f <= FRAMES; f++) {
      await wait(m === 'off' ? 90 : 160)
      if (!alive.current) return
      setFrame(f)
      if (m === 'on') {
        bad = errorRate(f, false) > THRESHOLD ? bad + 1 : 0
        if (bad >= ALERT_AFTER) {
          setOutcome({ mode: 'on', at: START + f * STEP })
          setDidOn(true)
          setRunning(false)
          return
        }
      }
    }
    setOutcome({ mode: 'off', at: START + FRAMES * STEP })
    setDidOff(true)
    setRunning(false)
  }

  const shown = frame < 0 ? [] : Array.from({ length: frame + 1 }, (_, f) => errorRate(f, false))
  const now = frame < 0 ? START : START + frame * STEP
  const brokenMins = outcome ? outcome.at - BREAK_AT : 0
  const failed = Math.round(brokenMins * 0.4)

  // chart geometry
  const W = 300
  const H = 110
  const bw = W / (FRAMES + 1)
  const y = (v: number) => H - (v / 25) * H

  return (
    <div className="stack">
      <div className="card tight flat row nowrap">
        <div className="grow">
          <div style={{ fontWeight: 700 }}>📟 Monitoring & alerts</div>
          <div className="tiny muted">{mode === 'on' ? 'Error-rate chart + alert when checkout errors > 2%' : 'Nothing is watching the app'}</div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={mode === 'on'}
          aria-label="Monitoring and alerts"
          className="switch"
          disabled={running}
          onClick={() => {
            setMode(mode === 'on' ? 'off' : 'on')
            setFrame(-1)
            setOutcome(null)
            setTraced(null)
            setRolledBack(false)
          }}
        />
      </div>

      <button type="button" className="btn primary block" disabled={running} onClick={() => void run()}>
        ▶ Play Tuesday morning {mode === 'on' ? '(monitoring on)' : '(no monitoring)'}
      </button>

      <div className="well stack sm" style={{ padding: 12 }}>
        <div className="row between">
          <span className="kicker">Checkout error rate</span>
          <span className="mono small">🕘 {clock(now)}</span>
        </div>
        {mode === 'off' ? (
          <div className="center small muted" style={{ padding: '28px 8px' }}>
            {frame < 0 ? 'No dashboard. You’ll find out about problems… somehow.' : running ? '☕ Quiet morning. Nothing seems wrong.' : '…'}
            <div className="tiny" style={{ marginTop: 6 }}>
              v57 deployed at 9:02 AM ✓
            </div>
          </div>
        ) : (
          <svg viewBox={`0 0 ${W} ${H + 18}`} width="100%" role="img" aria-label={`Error rate chart up to ${clock(now)}`}>
            <line x1={0} x2={W} y1={y(THRESHOLD)} y2={y(THRESHOLD)} stroke="var(--warn)" strokeWidth={1.5} strokeDasharray="4 4" />
            <text x={W} y={y(THRESHOLD) - 4} textAnchor="end" fontSize={10} fill="var(--ink-2)">
              alert line: 2%
            </text>
            <line x1={0} x2={W} y1={H} y2={H} stroke="var(--line)" />
            {shown.map((v, f) => {
              const bad = v > THRESHOLD
              const fixedV = rolledBack && outcome && START + f * STEP > outcome.at ? errorRate(f, true) : v
              return (
                <rect
                  key={f}
                  x={f * bw + 1}
                  y={y(fixedV)}
                  width={Math.max(1, bw - 2)}
                  height={H - y(fixedV)}
                  rx={2}
                  fill={bad ? 'var(--bad)' : 'var(--ink-2)'}
                >
                  <title>{`${clock(START + f * STEP)}: ${fixedV.toFixed(1)}% errors`}</title>
                </rect>
              )
            })}
            <text x={0} y={H + 14} fontSize={10} fill="var(--muted)">
              9:00
            </text>
            <text x={W} y={H + 14} fontSize={10} fill="var(--muted)" textAnchor="end">
              11:40
            </text>
          </svg>
        )}
      </div>

      <div aria-live="polite" className="stack sm">
        {outcome?.mode === 'off' && (
          <div className="stack sm pop">
            <div className="card tight flat stack sm" style={{ borderColor: 'var(--bad)' }}>
              <div className="tiny muted">📧 11:40 AM · support inbox</div>
              <div className="small" style={{ fontWeight: 700 }}>
                “I’ve been trying to pay you for TWO HOURS. Is this company even real?”
              </div>
            </div>
            <div className="callout bad small">
              Checkout was broken for <b>{Math.floor(brokenMins / 60)}h {brokenMins % 60}m</b> and you heard it from an angry customer. ≈ {failed} payments failed; most of those people won’t email — they just leave.
            </div>
          </div>
        )}
        {outcome?.mode === 'on' && (
          <div className="stack sm pop">
            <div className="card tight flat stack sm" style={{ borderColor: 'var(--warn)' }}>
              <div className="tiny muted">📟 {clock(outcome.at)} · alert to your phone</div>
              <div className="small" style={{ fontWeight: 700 }}>
                Checkout errors {'>'} 2% for 10 minutes (now 18%)
              </div>
            </div>
            <div className="callout good small">
              You found out <b>{brokenMins} minutes</b> after it broke — before any customer emailed. Now find out why: open the logs.
            </div>
          </div>
        )}
      </div>

      {outcome?.mode === 'on' && (
        <div className="stack sm">
          <div className="kicker">📜 Logs · tap a failed request to trace it</div>
          <div className="stack sm" style={{ gap: 4 }}>
            {LOGS.map((l) => (
              <button
                key={l.id}
                type="button"
                className="chip mono"
                aria-pressed={traced === l.id}
                onClick={() => setTraced(l.id)}
                style={{ fontSize: 12, padding: '8px 10px', color: l.lvl === 'ERROR' ? 'var(--bad)' : undefined, overflowWrap: 'anywhere' }}
              >
                {l.t} {l.lvl} {l.id} {l.text}
              </button>
            ))}
          </div>
          {traced && (
            <div className="stack sm pop" key={traced}>
              {LOGS.find((l) => l.id === traced)?.lvl === 'ERROR' ? (
                <>
                  <div className="kicker">Trace for {traced}</div>
                  <div className="stack sm" style={{ gap: 0 }}>
                    {TRACE.map((s, i) => (
                      <div key={s.name}>
                        <div className={`node ${s.ok ? 'ok' : 'fail'}`}>
                          <span className="emoji">{s.emoji}</span>
                          <span className="grow">
                            <span style={{ display: 'block' }}>{s.name}</span>
                            <span className="tiny" style={{ display: 'block', fontWeight: 500 }}>
                              {s.text}
                            </span>
                          </span>
                        </div>
                        {i < TRACE.length - 1 && <div className="link" />}
                      </div>
                    ))}
                  </div>
                  <div className="callout info small">
                    One request ID, followed through every box. The cause: the 9:02 deploy forgot a setting, so the payments call fails.
                  </div>
                  <button type="button" className="btn small block" disabled={rolledBack} onClick={() => setRolledBack(true)}>
                    {rolledBack ? '✓ Rolled back to v56 — errors back to normal' : '↩︎ Roll back to v56'}
                  </button>
                </>
              ) : (
                <div className="callout info small">This request worked fine (200). Pick one of the red ERROR lines.</div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="row" style={{ gap: 6 }}>
        <span className="pill" style={{ color: didOff ? 'var(--good)' : undefined }}>{didOff ? '✓' : '○'} No monitoring</span>
        <span className="pill" style={{ color: didOn ? 'var(--good)' : undefined }}>{didOn ? '✓' : '○'} With alerts</span>
        <span className="pill" style={{ color: traced ? 'var(--good)' : undefined }}>{traced && LOGS.find((l) => l.id === traced)?.lvl === 'ERROR' ? '✓' : '○'} Trace a failure</span>
      </div>
    </div>
  )
}
