import { useEffect, useRef, useState } from 'react'
import { wait } from '../lib/motion'

export interface FlowNode {
  id: string
  label: string
  emoji: string
  /** Small caption under the label. */
  note?: string
}

export interface FlowHop {
  /** Node id the message arrives at. */
  at: string
  /** Plain-English message shown at that node. */
  say?: string
  tone?: 'req' | 'res' | 'err'
  /** Visual state for the node at this hop (default: active then ok). */
  status?: 'ok' | 'fail' | 'warn'
  /** ms to hold on this hop (default 900). */
  hold?: number
}

export interface FlowScenario {
  id: string
  /** Button label, e.g. "Load my contacts" */
  label: string
  danger?: boolean
  hops: FlowHop[]
  /** Shown after the run finishes. */
  result?: { tone: 'good' | 'bad' | 'warn' | 'info'; text: string }
  /** What the user sees on screen at the end (rendered in a little phone). */
  screen?: string
}

interface Props {
  nodes: FlowNode[]
  scenarios: FlowScenario[]
  /** Scenario ids that must be run before done() fires. Default: all. */
  required?: string[]
  onDone?: () => void
}

type NodeState = 'idle' | 'active' | 'ok' | 'fail' | 'warn'

/**
 * Animated cause-and-effect pipeline. Press a scenario button and watch the
 * message travel node to node, with a plain-English log of each hop.
 */
export function FlowSim({ nodes, scenarios, required, onDone }: Props) {
  const [states, setStates] = useState<Record<string, NodeState>>({})
  const [bubble, setBubble] = useState<{ at: string; say: string; tone?: string } | null>(null)
  const [activeLink, setActiveLink] = useState<{ i: number; fail: boolean } | null>(null)
  const [log, setLog] = useState<{ from: string; to: string; say?: string; tone?: string }[]>([])
  const [running, setRunning] = useState<string | null>(null)
  const [finished, setFinished] = useState<FlowScenario | null>(null)
  const [ran, setRan] = useState<Set<string>>(new Set())
  const runId = useRef(0)
  const doneFired = useRef(false)

  useEffect(() => () => void runId.current++, [])

  const idx = (id: string) => nodes.findIndex((n) => n.id === id)
  const label = (id: string) => nodes.find((n) => n.id === id)?.label ?? id

  async function run(s: FlowScenario) {
    const my = ++runId.current
    setRunning(s.id)
    setFinished(null)
    setStates({})
    setLog([])
    setBubble(null)
    setActiveLink(null)
    let prev: string | null = null
    for (const hop of s.hops) {
      if (runId.current !== my) return
      const i = idx(hop.at)
      if (prev !== null) {
        const p = idx(prev)
        setActiveLink({ i: Math.min(p, i), fail: hop.status === 'fail' })
      }
      setStates((st) => ({ ...st, [hop.at]: hop.status ?? 'active' }))
      if (hop.say) setBubble({ at: hop.at, say: hop.say, tone: hop.tone })
      const entry = { from: prev ?? '', to: hop.at, say: hop.say, tone: hop.tone }
      setLog((l) => [...l, entry])
      await wait(hop.hold ?? 900)
      if (runId.current !== my) return
      if (!hop.status) setStates((st) => ({ ...st, [hop.at]: 'ok' }))
      prev = hop.at
    }
    setActiveLink(null)
    setRunning(null)
    setFinished(s)
    const next = new Set(ran).add(s.id)
    setRan(next)
    const need = required ?? scenarios.map((x) => x.id)
    if (!doneFired.current && need.every((id) => next.has(id))) {
      doneFired.current = true
      onDone?.()
    }
  }

  return (
    <div className="stack">
      <div role="group" aria-label="Simulation controls" className="row">
        {scenarios.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`btn small ${s.danger ? 'danger' : 'primary'}`}
            disabled={running !== null}
            onClick={() => run(s)}
          >
            {s.danger ? '⚠️ ' : '▶ '}
            {s.label}
            {ran.has(s.id) ? ' ✓' : ''}
          </button>
        ))}
      </div>

      <div className="stack sm" style={{ gap: 0 }} aria-hidden="true">
        {nodes.map((n, i) => {
          const st = states[n.id] ?? 'idle'
          const cls = st === 'idle' ? (running ? 'dim' : '') : st
          return (
            <div key={n.id}>
              <div className={`node ${cls}`}>
                <span className="emoji">{n.emoji}</span>
                <div className="grow">
                  <div>{n.label}</div>
                  {n.note && <div className="tiny muted" style={{ fontWeight: 500 }}>{n.note}</div>}
                  {bubble?.at === n.id && (
                    <div style={{ marginTop: 6 }}>
                      <span className={`bubble ${bubble.tone ?? ''}`} key={bubble.say}>
                        {bubble.say}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              {i < nodes.length - 1 && (
                <div className={`link ${activeLink?.i === i ? (activeLink.fail ? 'fail' : 'active') : ''}`} />
              )}
            </div>
          )
        })}
      </div>

      <div className="well stack sm" aria-live="polite">
        <div className="kicker">What just happened</div>
        {log.length === 0 && <p className="small muted">Press a button above to watch it happen.</p>}
        <ol className="small" style={{ margin: 0, paddingLeft: 20 }}>
          {log.map((l, i) => (
            <li key={i} className={l.tone === 'err' ? 'bad-text' : ''}>
              <b>{l.from ? `${label(l.from)} → ${label(l.to)}` : label(l.to)}</b>
              {l.say ? `: ${l.say}` : ''}
            </li>
          ))}
        </ol>
      </div>

      {finished?.screen && (
        <div className="phone pop">
          <div className="screen">
            <div className="tiny muted">What the user sees</div>
            <div style={{ fontWeight: 600 }}>{finished.screen}</div>
          </div>
        </div>
      )}
      {finished?.result && <div className={`callout ${finished.result.tone} pop`}>{finished.result.text}</div>}
    </div>
  )
}
