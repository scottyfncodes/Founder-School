import { useEffect, useRef, useState } from 'react'
import { wait } from '../lib/motion'
import { Meter } from '../components/bits'

type Kind = 'accept' | 'edge' | 'constraint' | 'vague'

interface Addition {
  id: string
  kind: Kind
  text: string
  /** Problem id this line fixes. */
  fixes?: string
}

const ADDITIONS: Addition[] = [
  { id: 'a1', kind: 'accept', text: 'Invite links expire after 7 days and work only once.', fixes: 'expire' },
  { id: 'a2', kind: 'accept', text: 'Include tests for: expired link, existing account, seat limit.', fixes: 'tests' },
  { id: 'e1', kind: 'edge', text: 'If the email already has an account, add them to the team — don’t create a second account.', fixes: 'dupe' },
  { id: 'c1', kind: 'constraint', text: 'Only team admins can send invites. Check this on the server.', fixes: 'perm' },
  { id: 'c2', kind: 'constraint', text: 'Starter plan: max 5 seats. At the limit, show an upgrade prompt.', fixes: 'seats' },
  { id: 'c3', kind: 'constraint', text: 'Only change the Team settings screen. Don’t touch other pages.', fixes: 'scope' },
  { id: 'v1', kind: 'vague', text: 'Make it secure.' },
  { id: 'v2', kind: 'vague', text: 'Use best practices.' },
  { id: 'v3', kind: 'vague', text: 'Make it intuitive.' },
]

const PROBLEMS: { id: string; bad: string; good: string }[] = [
  { id: 'perm', bad: 'Any member — even a guest — can invite people.', good: 'Only admins can invite; the server rejects anyone else.' },
  { id: 'expire', bad: 'Invite links never expire. A forwarded link works forever.', good: 'Links expire after 7 days and are single-use.' },
  { id: 'dupe', bad: 'Inviting an existing user creates a duplicate account.', good: 'Existing users are added to the team.' },
  { id: 'seats', bad: 'No seat limit: a $9 Starter team invited 140 people.', good: 'Starter teams stop at 5 seats with an upgrade prompt.' },
  { id: 'scope', bad: 'Also “improved” the Billing page while it was there.', good: 'Only the Team settings screen changed.' },
  { id: 'tests', bad: 'No tests. You’ll find out in production.', good: 'Tests cover expiry, existing accounts and seat limits.' },
]

const KIND: Record<Kind, { label: string; emoji: string }> = {
  accept: { label: 'Acceptance criteria', emoji: '✅' },
  edge: { label: 'Edge cases', emoji: '🧩' },
  constraint: { label: 'Constraints', emoji: '🚧' },
  vague: { label: 'Vague wishes', emoji: '☁️' },
}

interface Props {
  onDone?: () => void
}

/**
 * Start from a vague request, see what an AI agent builds, then improve the
 * spec with acceptance criteria, edge cases and constraints and build again.
 */
export function SpecBuilder({ onDone }: Props) {
  const [spec, setSpec] = useState<string[]>([])
  const [built, setBuilt] = useState<string[] | null>(null)
  const [building, setBuilding] = useState(false)
  const [builds, setBuilds] = useState(0)
  const [note, setNote] = useState<string | null>(null)
  const runId = useRef(0)
  const fired = useRef(false)

  useEffect(() => () => void runId.current++, [])

  const fixedBy = (lines: string[]) => new Set(lines.map((id) => ADDITIONS.find((a) => a.id === id)?.fixes).filter(Boolean) as string[])
  const liveFixed = fixedBy(spec)

  function toggle(a: Addition) {
    if (spec.includes(a.id)) {
      setSpec(spec.filter((x) => x !== a.id))
      setNote(null)
    } else {
      setSpec([...spec, a.id])
      setNote(
        a.kind === 'vague'
          ? '☁️ The agent will happily agree — but this changes nothing. What does “secure” or “intuitive” mean here? Say the specific rule instead.'
          : null,
      )
    }
  }

  async function build() {
    const my = ++runId.current
    setBuilding(true)
    await wait(1100)
    if (runId.current !== my) return
    setBuilding(false)
    setBuilt(spec.slice())
    const n = builds + 1
    setBuilds(n)
    if (!fired.current && n >= 2 && fixedBy(spec).size >= 5) {
      fired.current = true
      onDone?.()
    }
  }

  const builtFixed = built ? fixedBy(built) : new Set<string>()
  const vagueCount = spec.filter((id) => ADDITIONS.find((a) => a.id === id)?.kind === 'vague').length

  return (
    <div className="stack">
      <div className="card tight flat stack sm">
        <div className="kicker">📝 Your spec</div>
        <p style={{ fontWeight: 650 }}>“Let users invite teammates.”</p>
        {spec.map((id) => {
          const a = ADDITIONS.find((x) => x.id === id)
          if (!a) return null
          return (
            <p key={id} className={`small pop ${a.kind === 'vague' ? 'muted' : ''}`}>
              {KIND[a.kind].emoji} {a.text}
            </p>
          )
        })}
        <div className="row between tiny muted">
          <span>Spec strength</span>
          <span>{liveFixed.size}/6 gaps closed{vagueCount ? ` · ${vagueCount} vague` : ''}</span>
        </div>
        <Meter value={liveFixed.size / 6} color={liveFixed.size >= 5 ? 'var(--good)' : liveFixed.size >= 3 ? 'var(--warn)' : 'var(--bad)'} label="Spec strength" />
      </div>

      {builds > 0 && (
        <div className="stack sm">
          <div className="kicker">Add lines to the spec</div>
          {(['accept', 'edge', 'constraint', 'vague'] as Kind[]).map((k) => (
            <div key={k} className="stack sm">
              <div className="tiny" style={{ fontWeight: 700 }}>
                {KIND[k].emoji} {KIND[k].label}
              </div>
              {ADDITIONS.filter((a) => a.kind === k).map((a) => (
                <button key={a.id} type="button" className="chip" aria-pressed={spec.includes(a.id)} onClick={() => toggle(a)} style={{ fontSize: 14 }}>
                  {spec.includes(a.id) ? '✓ ' : '+ '}
                  {a.text}
                </button>
              ))}
            </div>
          ))}
          <div aria-live="polite">{note && <div className="callout warn pop">{note}</div>}</div>
        </div>
      )}
      <button type="button" className="btn primary block" disabled={building} onClick={build}>
        {building ? '🤖 Agent is building…' : builds === 0 ? '🤖 Ask the agent to build it' : '🤖 Build again with this spec'}
      </button>

      {built && !building && (
        <div className="stack sm pop" key={builds}>
          <div className="kicker">What the agent built (build #{builds})</div>
          {PROBLEMS.map((p) => {
            const ok = builtFixed.has(p.id)
            return (
              <div key={p.id} className={`node ${ok ? 'ok' : 'fail'}`} style={{ alignItems: 'flex-start', animation: 'none' }}>
                <span className="emoji" style={{ fontSize: 18 }}>{ok ? '✅' : '❌'}</span>
                <span className="small grow" style={{ fontWeight: 500 }}>{ok ? p.good : p.bad}</span>
              </div>
            )
          })}
          <div className="tiny muted">🤖 Agent’s message: “Done! Team invites are fully implemented.”</div>
          {builtFixed.size >= 5 && builds >= 2 && <div className="callout good pop">Same agent, same model — a much better result. The difference was entirely in what you asked for.</div>}
        </div>
      )}
    </div>
  )
}
