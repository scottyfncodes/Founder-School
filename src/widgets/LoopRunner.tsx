import { useEffect, useRef, useState } from 'react'
import { wait } from '../lib/motion'

type Gate = 'spec' | 'tests' | 'review' | 'founder'

const GATES: { id: Gate; label: string; emoji: string; cost: string }[] = [
  { id: 'spec', label: 'Clear spec', emoji: '📝', cost: '10 min' },
  { id: 'tests', label: 'Tests', emoji: '🧪', cost: '30 min' },
  { id: 'review', label: 'PR review', emoji: '👀', cost: '1 hour' },
  { id: 'founder', label: 'Founder testing', emoji: '🙋', cost: '2 hours' },
]

const CHANGES: { id: string; label: string; defect: string | null; caughtBy: Gate[] }[] = [
  { id: 'onboard', label: 'Onboarding checklist', defect: 'Agent built a pop-up; you meant a sidebar', caughtBy: ['spec', 'founder'] },
  { id: 'discount', label: 'Discount codes', defect: 'A 100%-off code makes the price negative', caughtBy: ['tests'] },
  { id: 'rename', label: 'Rename “Clients” → “Customers”', defect: 'Also quietly edited billing code', caughtBy: ['review'] },
  { id: 'export', label: 'CSV export', defect: 'Exports every company’s data, not just yours', caughtBy: ['review', 'tests'] },
  { id: 'mobile', label: 'New pricing page', defect: 'Buy button hidden on small phones', caughtBy: ['founder'] },
  { id: 'search', label: 'Faster search', defect: null, caughtBy: [] },
]

type Outcome = { id: string; gate: Gate | 'prod' | 'clean' }

interface Props {
  onDone?: () => void
}

/**
 * Switch the safety gates of the AI build loop on or off, then ship six
 * AI-built changes and see where each hidden defect gets caught — or escapes.
 */
export function LoopRunner({ onDone }: Props) {
  const [on, setOn] = useState<Record<Gate, boolean>>({ spec: true, tests: true, review: true, founder: true })
  const [outcomes, setOutcomes] = useState<Outcome[]>([])
  const [running, setRunning] = useState(false)
  const [configs, setConfigs] = useState<Set<string>>(new Set())
  const [escapedOnce, setEscapedOnce] = useState(false)
  const runId = useRef(0)
  const fired = useRef(false)

  useEffect(() => () => void runId.current++, [])

  async function ship() {
    const my = ++runId.current
    setRunning(true)
    setOutcomes([])
    let escaped = false
    for (const c of CHANGES) {
      await wait(450)
      if (runId.current !== my) return
      const order: Gate[] = ['spec', 'tests', 'review', 'founder']
      const g = c.defect ? (order.find((x) => on[x] && c.caughtBy.includes(x)) ?? 'prod') : 'clean'
      if (g === 'prod') escaped = true
      setOutcomes((o) => [...o, { id: c.id, gate: g }])
    }
    setRunning(false)
    const key = GATES.map((g) => (on[g.id] ? '1' : '0')).join('')
    const next = new Set(configs).add(key)
    setConfigs(next)
    const esc = escapedOnce || escaped
    setEscapedOnce(esc)
    if (!fired.current && next.size >= 2 && esc) {
      fired.current = true
      onDone?.()
    }
  }

  const prodCount = outcomes.filter((o) => o.gate === 'prod').length
  const finished = !running && outcomes.length === CHANGES.length

  return (
    <div className="stack">
      <div className="stack sm">
        <div className="kicker">Safety gates</div>
        {GATES.map((g) => (
          <div key={g.id} className="row nowrap between">
            <span className="small">
              <b>
                {g.emoji} {g.label}
              </b>{' '}
              <span className="muted">· fixing here costs {g.cost}</span>
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={on[g.id]}
              aria-label={g.label}
              className="switch"
              disabled={running}
              onClick={() => setOn({ ...on, [g.id]: !on[g.id] })}
            />
          </div>
        ))}
      </div>

      <button type="button" className="btn primary block" disabled={running} onClick={ship}>
        🤖 Ship 6 AI-built changes
      </button>

      <div className="stack sm" aria-live="polite">
        {CHANGES.map((c) => {
          const o = outcomes.find((x) => x.id === c.id)
          const g = o && o.gate !== 'prod' && o.gate !== 'clean' ? GATES.find((x) => x.id === o.gate) : null
          const tone = !o ? '' : o.gate === 'prod' ? 'fail' : o.gate === 'clean' ? 'ok' : 'warn'
          return (
            <div key={c.id} className={`node ${tone} ${!o && running ? 'dim' : ''}`} style={{ alignItems: 'flex-start' }}>
              <span className="emoji">{!o ? '📦' : o.gate === 'prod' ? '💥' : o.gate === 'clean' ? '✅' : '🛑'}</span>
              <span className="grow stack" style={{ gap: 2 }}>
                <span>{c.label}</span>
                {o && (
                  <span className="tiny ink2" style={{ fontWeight: 500 }}>
                    {o.gate === 'clean'
                      ? 'No defect. Shipped fine.'
                      : o.gate === 'prod'
                        ? `Reached customers: ${c.defect}.`
                        : `Caught at ${g?.label}: ${c.defect}.`}
                  </span>
                )}
              </span>
            </div>
          )
        })}
      </div>

      {finished && (
        <div className={`callout ${prodCount ? 'bad' : 'good'} pop`} key={configs.size + ':' + prodCount}>
          {prodCount
            ? `${prodCount} defect${prodCount > 1 ? 's' : ''} reached real customers. Each one costs a day of firefighting, plus trust. Every gate you skip moves bugs to the most expensive place to find them.`
            : 'Nothing reached customers. Notice that each gate catches different kinds of mistakes — none of them catches everything alone.'}
        </div>
      )}
      {finished && (configs.size < 2 || !escapedOnce) && (
        <p className="tiny muted">Now switch off a gate or two and ship again.</p>
      )}
    </div>
  )
}
