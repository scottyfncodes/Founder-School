import { useEffect, useRef, useState } from 'react'
import { wait } from '../lib/motion'

type NodeId = 'app' | 'api' | 'db'
type Tone = 'req' | 'res' | 'err'

interface Hop {
  at: NodeId
  plain: string
  tech: string
  tone: Tone
  fail?: boolean
  warn?: boolean
}

const NODES: { id: NodeId; emoji: string; label: string; note: string }[] = [
  { id: 'app', emoji: '📱', label: 'App', note: 'What Scott sees' },
  { id: 'api', emoji: '🚪', label: 'API', note: 'The service window' },
  { id: 'db', emoji: '🗄️', label: 'Database', note: 'Where contacts live' },
]

const LOAD: Hop[] = [
  { at: 'app', tone: 'req', plain: 'Scott opens Contacts. The app asks: “Please send Scott’s contacts. Here’s his pass.”', tech: 'GET /api/contacts\nAuthorization: Bearer eyJhbGci…' },
  { at: 'api', tone: 'req', plain: 'API checks the pass — yes, this is Scott — and asks the database.', tech: 'token valid → user_id = 7' },
  { at: 'db', tone: 'res', plain: 'Database finds the 3 contacts that belong to Scott.', tech: 'SELECT id, name FROM contacts\nWHERE owner_id = 7  → 3 rows' },
  { at: 'api', tone: 'res', plain: 'API packs them up neatly and sends them back.', tech: '200 OK\n[{"id":482,"name":"Maria Lopez"}, …]' },
  { at: 'app', tone: 'res', plain: 'App draws the list. Round trip: 0.2 seconds.', tech: 'render(contacts) · 212 ms' },
]

const FAIL: Hop[] = [
  { at: 'app', tone: 'req', plain: 'Scott opens Contacts. The app asks for his contacts again.', tech: 'GET /api/contacts\nAuthorization: Bearer eyJhbGci…' },
  { at: 'api', tone: 'req', plain: 'API checks the pass — fine — and asks the database.', tech: 'token valid → user_id = 7' },
  { at: 'db', tone: 'err', fail: true, plain: 'No answer. The database is down (overloaded, or mid-maintenance).', tech: 'connect ECONNREFUSED 10.0.3.12:5432\n(timed out after 5 s)' },
  { at: 'api', tone: 'err', warn: true, plain: 'API can’t get the contacts. It tells the app honestly: “Not available right now.”', tech: '503 Service Unavailable\n{"error":"database_unavailable"}' },
  { at: 'app', tone: 'err', warn: true, plain: 'The app received an error instead of contacts. Now it has to decide what to show.', tech: 'response.ok === false' },
]

const CONTACTS = ['Maria Lopez', 'Dev Patel', 'Priya Shah']

type Choice = 'A' | 'B' | 'C' | 'D'
const CHOICES: { id: Choice; label: string; correct?: boolean; why: string; tone: 'good' | 'bad' }[] = [
  { id: 'A', label: 'Crash', tone: 'bad', why: 'A blank or frozen screen tells the user nothing and loses whatever they were doing. It also looks like the app is broken forever, not for a minute.' },
  { id: 'B', label: 'Show an error + Retry', correct: true, tone: 'good', why: 'Honest, calm and recoverable. The user knows their data is safe, and can try again when the database is back. This is what good apps do.' },
  { id: 'C', label: 'Pretend: show an empty list', tone: 'bad', why: '“You have no contacts” is a lie that causes panic. Users think their data was deleted, re-enter it (creating duplicates), and you never hear about the outage.' },
  { id: 'D', label: 'Delete the account and start fresh', tone: 'bad', why: 'Turns a one-minute outage into permanent data loss. Sounds absurd — but “if loading fails, create a fresh profile” code really gets written. Read error paths carefully.' },
]

export function ApiLab({ onDone }: { onDone?: () => void }) {
  const [tech, setTech] = useState(false)
  const [running, setRunning] = useState(false)
  const [at, setAt] = useState<NodeId | null>(null)
  const [states, setStates] = useState<Partial<Record<NodeId, 'ok' | 'fail' | 'warn' | 'active'>>>({})
  const [log, setLog] = useState<Hop[]>([])
  const [phase, setPhase] = useState<'start' | 'loaded' | 'failed' | 'recovered'>('start')
  const [screen, setScreen] = useState<'blank' | 'loading' | 'list' | 'error-wait' | Choice>('blank')
  const [choice, setChoice] = useState<Choice | null>(null)
  const [tried, setTried] = useState<Set<Choice>>(new Set())
  const [fired, setFired] = useState(false)
  const runId = useRef(0)
  useEffect(() => () => void runId.current++, [])

  async function play(hops: Hop[]) {
    const my = ++runId.current
    setRunning(true)
    setLog([])
    setStates({})
    setScreen('loading')
    for (const h of hops) {
      if (runId.current !== my) return false
      setAt(h.at)
      setStates((s) => ({ ...s, [h.at]: h.fail ? 'fail' : h.warn ? 'warn' : 'active' }))
      setLog((l) => [...l, h])
      await wait(h.fail ? 1500 : 1000)
      if (runId.current !== my) return false
      if (!h.fail && !h.warn) setStates((s) => ({ ...s, [h.at]: 'ok' }))
    }
    setAt(null)
    setRunning(false)
    return true
  }

  async function load() {
    setChoice(null)
    if (await play(LOAD)) {
      setScreen('list')
      setPhase('loaded')
    }
  }

  async function breakIt() {
    setChoice(null)
    setTried(new Set())
    if (await play(FAIL)) {
      setScreen('error-wait')
      setPhase('failed')
    }
  }

  function decide(c: Choice) {
    setChoice(c)
    setScreen(c)
    setTried(new Set(tried).add(c))
  }

  async function retry() {
    setChoice('B')
    if (await play(LOAD)) {
      setScreen('list')
      setPhase('recovered')
      if (!fired) {
        setFired(true)
        onDone?.()
      }
    }
  }

  const picked = CHOICES.find((c) => c.id === choice)
  const bubble = at ? log[log.length - 1] : null

  return (
    <div className="stack">
      <div className="row">
        <button type="button" className="btn primary small" onClick={load} disabled={running}>
          ▶ Load my contacts {phase !== 'start' ? '✓' : ''}
        </button>
        <button type="button" className="btn danger small" onClick={breakIt} disabled={running || phase === 'start'}>
          ⚠️ Database unavailable
        </button>
      </div>
      {phase === 'start' && !running && <p className="tiny muted">Start with “Load my contacts”.</p>}

      <div className="row nowrap between">
        <span className="small">🧑‍💻 Show what developers see</span>
        <button type="button" role="switch" aria-checked={tech} aria-label="Show what developers see" className="switch" onClick={() => setTech(!tech)} />
      </div>

      <div className="stack sm" style={{ gap: 0 }} aria-hidden="true">
        {NODES.map((n, i) => {
          const st = states[n.id]
          const cls = st === 'active' || at === n.id ? (st === 'fail' ? 'fail' : st === 'warn' ? 'warn' : 'active') : st ?? (running ? 'dim' : '')
          return (
            <div key={n.id}>
              <div className={`node ${cls}`} style={{ alignItems: 'flex-start' }}>
                <span className="emoji">{n.emoji}</span>
                <div className="grow">
                  <div>{n.label}</div>
                  <div className="tiny muted" style={{ fontWeight: 500 }}>
                    {n.note}
                  </div>
                  {bubble && bubble.at === n.id && (
                    <div style={{ marginTop: 6 }}>
                      <span className={`bubble ${bubble.tone}`} key={bubble.plain} style={{ fontWeight: 500, whiteSpace: tech ? 'pre-wrap' : undefined }}>
                        {tech ? <span className="mono tiny">{bubble.tech}</span> : bubble.plain}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              {i < NODES.length - 1 && <div className={`link ${running ? 'active' : ''}`} />}
            </div>
          )
        })}
      </div>

      {log.length > 0 && (
        <div className="well stack sm" aria-live="polite">
          <div className="kicker">The round trip · APP → API → DATABASE → API → APP</div>
          <ol className="small" style={{ margin: 0, paddingLeft: 20 }}>
            {log.map((h, i) => (
              <li key={i} className={h.tone === 'err' ? 'bad-text' : ''} style={{ marginBottom: 4 }}>
                <b>{NODES.find((n) => n.id === h.at)?.label}:</b>{' '}
                {tech ? (
                  <span className="mono tiny" style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                    {h.tech}
                  </span>
                ) : (
                  h.plain
                )}
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="phone">
        <div className="screen" style={screen === 'A' ? { background: 'var(--surface-3)' } : undefined}>
          <div className="row between tiny muted">
            <span>Contacts</span>
            <span>Scott</span>
          </div>
          {screen === 'blank' && <div className="small muted">Nothing loaded yet.</div>}
          {screen === 'loading' && <div className="small pulse">Loading…</div>}
          {screen === 'list' &&
            CONTACTS.map((c) => (
              <div key={c} className="small pop" style={{ background: 'var(--surface)', borderRadius: 10, padding: '6px 10px' }}>
                👤 {c}
              </div>
            ))}
          {screen === 'error-wait' && <div className="small" style={{ fontWeight: 600 }}>❓ The app is waiting for you to decide…</div>}
          {screen === 'A' && (
            <div className="stack sm pop center" style={{ paddingTop: 10 }}>
              <div style={{ fontSize: 28 }}>💥</div>
              <div className="small" style={{ fontWeight: 700 }}>App stopped responding</div>
              <div className="mono tiny muted">TypeError: contacts.map is not a function</div>
            </div>
          )}
          {screen === 'B' && (
            <div className="stack sm pop">
              <div className="small" style={{ fontWeight: 700 }}>⚠️ Couldn’t load your contacts</div>
              <div className="tiny ink2">Your data is safe. This is on our side — please try again in a moment.</div>
              <button type="button" className="btn primary small" onClick={retry} disabled={running}>
                ↻ Try again
              </button>
            </div>
          )}
          {screen === 'C' && (
            <div className="stack sm pop center" style={{ paddingTop: 6 }}>
              <div style={{ fontSize: 28 }}>📭</div>
              <div className="small" style={{ fontWeight: 700 }}>You have no contacts yet</div>
              <div className="tiny muted">Add your first contact to get started!</div>
            </div>
          )}
          {screen === 'D' && (
            <div className="stack sm pop center" style={{ paddingTop: 6 }}>
              <div style={{ fontSize: 28 }}>🗑️</div>
              <div className="small bad-text" style={{ fontWeight: 700 }}>Account reset. Welcome, new user!</div>
              <div className="tiny muted">All 3 contacts, notes and files: permanently gone.</div>
            </div>
          )}
        </div>
      </div>

      {(phase === 'failed' || (phase === 'recovered' && choice)) && (
        <div className="stack sm pop">
          <div className="kicker">What should the app do?</div>
          <div className="grid2">
            {CHOICES.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`chip ${tried.has(c.id) ? (c.correct ? 'good' : 'bad') : ''}`}
                aria-pressed={choice === c.id}
                disabled={running || phase === 'recovered'}
                onClick={() => decide(c.id)}
                style={{ opacity: 1 }}
              >
                <b>{c.id}</b> · {c.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div aria-live="polite">
        {picked && phase === 'failed' && (
          <div className={`callout ${picked.tone} pop`} key={picked.id}>
            <b>{picked.correct ? 'Yes. ' : 'No. '}</b>
            {picked.why}
            {picked.correct ? <b> Now tap “Try again” in the phone — the database is back.</b> : <span className="muted"> Try another.</span>}
          </div>
        )}
        {phase === 'recovered' && (
          <div className="callout good pop">
            Recovered. The database came back, Retry worked, and nobody lost anything. Every API call can fail — good apps plan
            the failure screen, not just the happy path.
          </div>
        )}
      </div>
    </div>
  )
}
