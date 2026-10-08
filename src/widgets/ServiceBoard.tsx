import { useRef, useState } from 'react'
import { Quiz } from '../components/Quiz'

type SvcId = 'db' | 'email' | 'files' | 'pay' | 'auth' | 'analytics' | 'ai' | 'sms' | 'push'

const SERVICES: { id: SvcId; label: string; emoji: string; vendor: string }[] = [
  { id: 'db', label: 'Database', emoji: '🗄️', vendor: 'Managed database host' },
  { id: 'auth', label: 'Auth', emoji: '🔐', vendor: 'Login provider' },
  { id: 'email', label: 'Email', emoji: '✉️', vendor: 'Email sending service' },
  { id: 'files', label: 'File storage', emoji: '🗂️', vendor: 'Storage bucket' },
  { id: 'pay', label: 'Payments', emoji: '💳', vendor: 'Payment provider' },
  { id: 'analytics', label: 'Analytics', emoji: '📊', vendor: 'Analytics tool' },
  { id: 'ai', label: 'AI', emoji: '✨', vendor: 'AI model API' },
  { id: 'sms', label: 'SMS', emoji: '💬', vendor: 'Text message API' },
  { id: 'push', label: 'Push', emoji: '🔔', vendor: 'Apple / Google push' },
]

interface Feature {
  id: string
  label: string
  emoji: string
  /** Breaks completely without these. */
  needs: SvcId[]
  /** Still works, but worse, without these. */
  nice?: SvcId[]
  /** What the user sees when it's degraded. */
  degraded?: string
  /** What the user sees when it's broken. */
  broken: string
}

const FEATURES: Feature[] = [
  { id: 'login', label: 'Log in', emoji: '🔑', needs: ['auth', 'db'], nice: ['analytics'], degraded: 'Works. You just stop seeing login stats.', broken: 'Nobody can get in. Total outage.' },
  { id: 'signup', label: 'Sign up', emoji: '🆕', needs: ['auth', 'db'], nice: ['email'], degraded: 'Account created, but the welcome email never arrives.', broken: 'New users can’t create accounts.' },
  { id: 'reset', label: 'Reset password', emoji: '🔁', needs: ['email', 'auth', 'db'], broken: 'Reset emails never arrive. Users are locked out.' },
  { id: 'upload', label: 'Upload a photo', emoji: '🖼️', needs: ['files', 'db'], broken: 'Uploads spin forever, then fail.' },
  { id: 'upgrade', label: 'Upgrade to Pro', emoji: '⭐', needs: ['pay', 'db'], nice: ['email'], degraded: 'Upgrade works, but no receipt email.', broken: 'Nobody can pay you. Revenue stops.' },
  { id: 'summary', label: 'AI summary', emoji: '✨', needs: ['ai', 'db'], broken: '“Summarize” button errors out.' },
  { id: '2fa', label: 'Login code by text', emoji: '📲', needs: ['sms'], broken: 'Users with 2FA can’t finish logging in.' },
  { id: 'remind', label: 'Phone reminders', emoji: '⏰', needs: ['push'], nice: ['email'], degraded: 'Push works; email backup reminders don’t.', broken: 'Reminders silently stop. Nobody notices for days.' },
  { id: 'growth', label: 'Your growth dashboard', emoji: '📈', needs: ['analytics'], broken: 'You’re flying blind — but customers don’t notice.' },
]

type Status = 'ok' | 'degraded' | 'broken' | 'delayed'

const FALLBACKS = [
  {
    id: 'queue',
    label: 'Queue & retry',
    emoji: '📬',
    effect: 'Emails wait in a queue and send automatically when the provider recovers. Resets arrive late instead of never.',
    tradeoff: 'Cheap and simple. But a reset email that arrives 2 hours late still frustrates people.',
  },
  {
    id: 'second',
    label: 'Second provider',
    emoji: '🔀',
    effect: 'The app notices failures and switches to a backup email provider. Users barely notice.',
    tradeoff: 'Most resilient, but you set up, pay for and maintain two providers.',
  },
  {
    id: 'graceful',
    label: 'Graceful degradation',
    emoji: '🪂',
    effect: 'The app says “Email is delayed — use a login code by text instead.” Core features keep working.',
    tradeoff: 'Honest and calm. Needs an alternative path (like SMS) and a clear message designed in advance.',
  },
] as const

type FallbackId = (typeof FALLBACKS)[number]['id']

interface Props {
  onDone?: () => void
}

/**
 * A live "team of services" board. Toggle each third-party service and see
 * which product features keep working, degrade, or break. Then run an
 * "email provider down" drill and try fallback strategies.
 */
export function ServiceBoard({ onDone }: Props) {
  const [up, setUp] = useState<Record<SvcId, boolean>>(() => Object.fromEntries(SERVICES.map((s) => [s.id, true])) as Record<SvcId, boolean>)
  const [toggled, setToggled] = useState<Set<SvcId>>(new Set())
  const [drill, setDrill] = useState(false)
  const [answered, setAnswered] = useState(false)
  const [fallback, setFallback] = useState<FallbackId | null>(null)
  const [tried, setTried] = useState<Set<FallbackId>>(new Set())
  const [focus, setFocus] = useState<string | null>(null)
  const fired = useRef(false)

  function statusOf(f: Feature): Status {
    const missing = f.needs.filter((s) => !up[s])
    if (missing.length) {
      if (drill && fallback && missing.length === 1 && missing[0] === 'email') {
        return fallback === 'queue' ? 'delayed' : fallback === 'second' ? 'ok' : 'degraded'
      }
      return 'broken'
    }
    if (f.nice?.some((s) => !up[s])) {
      if (drill && fallback === 'second' && f.nice.filter((s) => !up[s]).every((s) => s === 'email')) return 'ok'
      if (drill && fallback === 'queue' && f.nice.filter((s) => !up[s]).every((s) => s === 'email')) return 'delayed'
      return 'degraded'
    }
    return 'ok'
  }

  function describe(f: Feature, st: Status) {
    if (st === 'ok') return drill && fallback === 'second' && (f.needs.includes('email') || f.nice?.includes('email')) ? 'Works — sent through the backup provider.' : 'Working normally.'
    if (st === 'delayed') return 'Works, but emails go out late — they’re waiting in the queue.'
    if (st === 'degraded') {
      if (drill && fallback === 'graceful' && f.needs.includes('email')) return 'Shows “Email is delayed — get a code by text instead.” Users still get in.'
      return f.degraded ?? 'Works, but worse.'
    }
    return f.broken
  }

  function toggle(id: SvcId) {
    if (drill) return
    setUp((u) => ({ ...u, [id]: !u[id] }))
    setToggled((t) => new Set(t).add(id))
    setFocus(null)
  }

  function startDrill() {
    setUp(Object.fromEntries(SERVICES.map((s) => [s.id, s.id !== 'email'])) as Record<SvcId, boolean>)
    setDrill(true)
    setAnswered(false)
    setFallback(null)
    setFocus(null)
  }

  function endDrill() {
    setUp(Object.fromEntries(SERVICES.map((s) => [s.id, true])) as Record<SvcId, boolean>)
    setDrill(false)
    setFallback(null)
  }

  function pickFallback(id: FallbackId) {
    setFallback(id)
    const next = new Set(tried).add(id)
    setTried(next)
    if (!fired.current && next.size >= 2) {
      fired.current = true
      onDone?.()
    }
  }

  const statuses = FEATURES.map((f) => ({ f, st: statusOf(f) }))
  const count = (s: Status) => statuses.filter((x) => x.st === s).length
  const icon: Record<Status, string> = { ok: '✅', degraded: '🟠', delayed: '⏳', broken: '❌' }
  const cls: Record<Status, string> = { ok: 'ok', degraded: 'warn', delayed: 'warn', broken: 'fail' }
  const fb = FALLBACKS.find((x) => x.id === fallback)

  return (
    <div className="stack">
      <div className="stack sm">
        <div className="row between">
          <span className="kicker">Your app’s services</span>
          <span className="tiny muted">{drill ? 'Drill running' : `${toggled.size} toggled`}</span>
        </div>
        <div className="grid3">
          {SERVICES.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`chip ${up[s.id] ? '' : 'bad'}`}
              aria-pressed={up[s.id]}
              aria-label={`${s.label}: ${up[s.id] ? 'up' : 'down'}`}
              onClick={() => toggle(s.id)}
              disabled={drill}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '8px 4px', textAlign: 'center', opacity: 1 }}
            >
              <span aria-hidden="true" style={{ fontSize: 20, lineHeight: 1, filter: up[s.id] ? 'none' : 'grayscale(1)' }}>
                {s.emoji}
              </span>
              <span className="tiny" style={{ fontWeight: 650 }}>{s.label}</span>
              <span className={`tiny ${up[s.id] ? 'good-text' : 'bad-text'}`} style={{ fontWeight: 700 }}>
                {up[s.id] ? 'UP' : 'DOWN'}
              </span>
            </button>
          ))}
        </div>
        {!drill && <p className="tiny muted">Tap a service to switch it off (or back on).</p>}
      </div>

      <div className="grid3" aria-live="polite">
        <div className="stat">
          <span className="v good-text">{count('ok')}</span>
          <span className="l">working</span>
        </div>
        <div className="stat">
          <span className="v warn-text">{count('degraded') + count('delayed')}</span>
          <span className="l">degraded</span>
        </div>
        <div className="stat">
          <span className="v bad-text">{count('broken')}</span>
          <span className="l">broken</span>
        </div>
      </div>

      <div className="stack sm">
        <div className="kicker">What your users can do</div>
        {statuses.map(({ f, st }) => (
          <button
            key={f.id}
            type="button"
            className={`node ${st === 'ok' ? '' : cls[st]}`}
            aria-expanded={focus === f.id}
            onClick={() => setFocus(focus === f.id ? null : f.id)}
            style={{ alignItems: 'flex-start' }}
          >
            <span className="emoji">{f.emoji}</span>
            <span className="grow stack" style={{ gap: 2 }}>
              <span>{f.label}</span>
              {(st !== 'ok' || focus === f.id) && <span className="tiny ink2" style={{ fontWeight: 500 }}>{describe(f, st)}</span>}
              {focus === f.id && (
                <span className="tiny muted" style={{ fontWeight: 500 }}>
                  Needs: {f.needs.map((n) => SERVICES.find((s) => s.id === n)?.label).join(' + ')}
                  {f.nice?.length ? ` · Nice to have: ${f.nice.map((n) => SERVICES.find((s) => s.id === n)?.label).join(', ')}` : ''}
                </span>
              )}
            </span>
            <span aria-label={st}>{icon[st]}</span>
          </button>
        ))}
        <p className="tiny muted">Tap a feature to see which services it depends on.</p>
      </div>

      {!drill ? (
        <button type="button" className="btn danger block" onClick={startDrill}>
          💥 Drill: EMAIL PROVIDER DOWN
        </button>
      ) : (
        <div className="stack pop">
          <div className="callout bad">
            <b>💥 Your email provider is having an outage.</b> Everything else is up. Look at the feature list above.
          </div>
          <div className="card tight flat">
            <Quiz
              kicker="Incident drill"
              prompt="What happens to the application?"
              options={[
                { text: 'The whole app goes down', why: 'Login, uploads, payments and AI don’t touch email — they keep working. One provider down rarely means everything is down.' },
                { text: 'Nothing — email is a nice-to-have', why: 'Look at “Reset password”: it can’t work without email. Anyone who forgot their password is locked out.' },
                { text: 'Most things work; password resets break and some emails silently go missing', correct: true, why: 'Exactly. Reset password is broken (critical), while welcome and receipt emails quietly vanish (degraded). Partial failures are the most common kind.' },
                { text: 'Payments stop working', why: 'Payments run through the payment provider. Only the receipt email is lost — the money still arrives.' },
              ]}
              onSolved={() => setAnswered(true)}
            />
          </div>
          {answered && (
            <div className="stack sm pop">
              <div className="kicker">Pick a fallback strategy (try at least two)</div>
              <div className="stack sm">
                {FALLBACKS.map((x) => (
                  <button
                    key={x.id}
                    type="button"
                    className="chip"
                    aria-pressed={fallback === x.id}
                    onClick={() => pickFallback(x.id)}
                  >
                    {x.emoji} {x.label}
                    {tried.has(x.id) ? ' ✓' : ''}
                  </button>
                ))}
              </div>
              {fb && (
                <div className="stack sm pop" key={fb.id}>
                  <div className="callout good">
                    <b>Effect:</b> {fb.effect}
                  </div>
                  <div className="callout warn">
                    <b>Tradeoff:</b> {fb.tradeoff}
                  </div>
                </div>
              )}
              <button type="button" className="btn small" onClick={endDrill}>
                ↺ End drill — provider recovered
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
