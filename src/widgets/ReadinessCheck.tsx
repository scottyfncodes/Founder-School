import { useEffect, useRef, useState } from 'react'
import { wait } from '../lib/motion'

type Sev = 'critical' | 'serious' | 'annoying'

const ITEMS: { id: string; emoji: string; label: string; sev: Sev; day: number; incident: string }[] = [
  { id: 'secrets', emoji: '🔐', label: 'Move secrets out of the code', sev: 'critical', day: 1, incident: 'A live payment key in the repo gets scraped. Fraudulent refunds start within the hour.' },
  { id: 'errors', emoji: '🧯', label: 'Handle errors & timeouts', sev: 'serious', day: 1, incident: 'Payment provider is slow. Users see a blank screen, tap “Pay” again — and get charged twice.' },
  { id: 'authz', emoji: '🛂', label: 'Server-side permission checks', sev: 'critical', day: 2, incident: 'A customer changes a number in the URL and sees another company’s invoices.' },
  { id: 'edge', emoji: '🧩', label: 'Edge cases (empty, huge, weird input)', sev: 'annoying', day: 2, incident: 'New users with zero projects hit a crash on their very first screen.' },
  { id: 'limits', emoji: '🚦', label: 'Rate limits on signup & login', sev: 'annoying', day: 3, incident: 'A bot creates 30,000 fake accounts. Your email bill jumps by $900.' },
  { id: 'monitoring', emoji: '📟', label: 'Monitoring & alerts', sev: 'serious', day: 4, incident: 'The site is down for 6 hours overnight. You find out from a customer’s angry post.' },
  { id: 'scale', emoji: '🐘', label: 'Test with realistic data volume', sev: 'annoying', day: 6, incident: 'Your biggest customer’s dashboard takes 40 seconds to load. They start a trial elsewhere.' },
  { id: 'backups', emoji: '🛟', label: 'Backups + a tested restore', sev: 'critical', day: 9, incident: 'A bad migration wipes the notes table. There is no restore. The data is gone.' },
]

const DAYS = 5
const SEV: Record<Sev, { tone: string; label: string }> = {
  critical: { tone: 'fail', label: 'Critical' },
  serious: { tone: 'warn', label: 'Serious' },
  annoying: { tone: '', label: 'Annoying' },
}

interface Props {
  onDone?: () => void
}

/**
 * The app works in the demo. You have 5 days before launch and 8 things you
 * could harden. Pick, launch, and live through the first two weeks.
 */
export function ReadinessCheck({ onDone }: Props) {
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [phase, setPhase] = useState<'plan' | 'launching' | 'done'>('plan')
  const [shown, setShown] = useState<string[]>([])
  const runId = useRef(0)
  const fired = useRef(false)

  useEffect(() => () => void runId.current++, [])

  function toggle(id: string) {
    if (phase !== 'plan') return
    const n = new Set(picked)
    if (n.has(id)) n.delete(id)
    else if (n.size < DAYS) n.add(id)
    setPicked(n)
  }

  async function launch() {
    const my = ++runId.current
    setPhase('launching')
    setShown([])
    const incidents = ITEMS.filter((i) => !picked.has(i.id))
    for (const i of incidents) {
      await wait(800)
      if (runId.current !== my) return
      setShown((s) => [...s, i.id])
    }
    await wait(300)
    if (runId.current !== my) return
    setPhase('done')
    if (!fired.current) {
      fired.current = true
      onDone?.()
    }
  }

  function again() {
    runId.current++
    setPhase('plan')
    setShown([])
  }

  const incidents = ITEMS.filter((i) => shown.includes(i.id))
  const crit = ITEMS.filter((i) => i.sev === 'critical' && !picked.has(i.id)).length
  const serious = ITEMS.filter((i) => i.sev === 'serious' && !picked.has(i.id)).length

  return (
    <div className="stack">
      <div className="phone" style={{ maxWidth: 260 }}>
        <div className="screen" style={{ minHeight: 0 }}>
          <div className="tiny muted">The demo, on your laptop</div>
          <div className="callout good" style={{ fontSize: 14 }}>
            ✅ Sign up, create a project, invite a teammate, pay. Everything works.
          </div>
        </div>
      </div>

      <div className="row between">
        <span className="kicker">Launch in {DAYS} days · 1 day per item</span>
        <span className="pill">
          {picked.size}/{DAYS} days used
        </span>
      </div>

      <div className="stack sm">
        {ITEMS.map((i) => {
          const on = picked.has(i.id)
          const hit = shown.includes(i.id)
          return (
            <button
              key={i.id}
              type="button"
              className={`chip ${hit ? 'bad' : on && phase !== 'plan' ? 'good' : ''}`}
              aria-pressed={on}
              disabled={phase !== 'plan' || (!on && picked.size >= DAYS)}
              onClick={() => toggle(i.id)}
              style={{ display: 'flex', gap: 8, alignItems: 'center', opacity: phase === 'plan' && !on && picked.size >= DAYS ? 0.55 : 1 }}
            >
              <span aria-hidden="true">{on ? '☑️' : '⬜️'}</span>
              <span className="grow">
                {i.emoji} {i.label}
              </span>
            </button>
          )
        })}
      </div>

      {phase === 'plan' && (
        <button type="button" className="btn primary block" disabled={picked.size === 0} onClick={launch}>
          🚀 Launch {picked.size < DAYS ? `(${DAYS - picked.size} day${DAYS - picked.size === 1 ? '' : 's'} unused)` : ''}
        </button>
      )}

      {phase !== 'plan' && (
        <div className="stack sm" aria-live="polite">
          <div className="kicker">The first two weeks in production</div>
          {incidents.map((i) => (
            <div key={i.id} className={`node ${SEV[i.sev].tone} pop`} style={{ alignItems: 'flex-start', animation: 'none' }}>
              <span className="emoji">{i.emoji}</span>
              <span className="grow stack" style={{ gap: 2 }}>
                <span className="tiny" style={{ fontWeight: 700 }}>
                  Day {i.day} · {SEV[i.sev].label}
                </span>
                <span className="small" style={{ fontWeight: 500 }}>
                  {i.incident}
                </span>
              </span>
            </div>
          ))}
          {phase === 'launching' && <p className="tiny muted pulse">Time passes…</p>}
          {phase === 'done' && (
            <div className="stack sm pop">
              <div className={`callout ${crit ? 'bad' : serious ? 'warn' : 'good'}`}>
                {crit
                  ? `${crit} critical incident${crit > 1 ? 's' : ''}: data leaked, money lost or data gone. These are the ones that end companies — they come first.`
                  : serious
                    ? 'No critical incidents — good prioritizing. A serious one still hurt. With limited time, that’s a fair trade.'
                    : 'Only annoyances. You protected money, data and trust first — exactly the right order.'}
              </div>
              <p className="small muted">Every one of these apps “worked”. Production-ready means it keeps working when real people, real data and real failures show up.</p>
              <button type="button" className="btn small" onClick={again}>
                ↺ Re-plan and launch again
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
