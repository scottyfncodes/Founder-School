import { useRef, useState } from 'react'
import { wait } from '../lib/motion'

type UserId = 'scott' | 'alex' | 'nobody'
type RoomId = 'dash' | 'inv-alex' | 'inv-scott' | 'admin'

const USERS: Record<UserId, { name: string; emoji: string; role: string; badge: string }> = {
  scott: { name: 'Scott', emoji: '🧑‍💼', role: 'ADMIN', badge: '👑 ADMIN' },
  alex: { name: 'Alex', emoji: '🙂', role: 'USER', badge: 'USER' },
  nobody: { name: 'Nobody', emoji: '👤', role: '—', badge: 'logged out' },
}

const ROOMS: { id: RoomId; emoji: string; label: string; path: string }[] = [
  { id: 'dash', emoji: '🏠', label: 'Dashboard', path: '/dashboard' },
  { id: 'inv-alex', emoji: '🧾', label: 'Alex’s invoices', path: '/invoices?user=alex' },
  { id: 'inv-scott', emoji: '🧾', label: 'Scott’s invoices', path: '/invoices?user=scott' },
  { id: 'admin', emoji: '⚙️', label: 'Admin settings', path: '/admin' },
]

/** The rule the server is supposed to enforce. */
function allowed(user: UserId, room: RoomId) {
  if (user === 'scott') return true
  if (room === 'dash') return true
  if (room === 'inv-alex') return user === 'alex'
  return false
}

const RULE: Record<RoomId, string> = {
  dash: 'any logged-in user',
  'inv-alex': 'Alex, or an ADMIN',
  'inv-scott': 'Scott, or an ADMIN',
  admin: 'ADMINs only',
}

type Gate = 'idle' | 'checking' | 'pass' | 'fail' | 'skipped'

interface Outcome {
  status: 200 | 401 | 403
  screen: string
  tone: 'good' | 'bad' | 'warn' | 'info'
  text: string
}

export function RoleLab({ onDone }: { onDone?: () => void }) {
  const [user, setUser] = useState<UserId>('alex')
  const [authzOn, setAuthzOn] = useState(true)
  const [gate1, setGate1] = useState<Gate>('idle')
  const [gate2, setGate2] = useState<Gate>('idle')
  const [room, setRoom] = useState<RoomId | null>(null)
  const [out, setOut] = useState<Outcome | null>(null)
  const [busy, setBusy] = useState(false)
  const [alexDenied, setAlexDenied] = useState(false)
  const [breached, setBreached] = useState(false)
  const run = useRef(0)
  const fired = useRef(false)

  function finish(d: boolean, b: boolean) {
    if (!fired.current && d && b) {
      fired.current = true
      onDone?.()
    }
  }

  function clear() {
    run.current++
    setGate1('idle')
    setGate2('idle')
    setRoom(null)
    setOut(null)
    setBusy(false)
  }

  async function attempt(r: RoomId) {
    const my = ++run.current
    setBusy(true)
    setRoom(r)
    setOut(null)
    setGate1('checking')
    setGate2('idle')
    await wait(650)
    if (run.current !== my) return
    if (user === 'nobody') {
      setGate1('fail')
      setBusy(false)
      setOut({
        status: 401,
        screen: '🔒 Please log in',
        tone: 'info',
        text: 'Stopped at checkpoint 1: the server doesn’t know who this is. That’s an authentication failure — “401: who are you?”',
      })
      return
    }
    setGate1('pass')
    setGate2(authzOn ? 'checking' : 'skipped')
    await wait(authzOn ? 650 : 400)
    if (run.current !== my) return
    setBusy(false)
    const ok = allowed(user, r)
    const name = USERS[user].name
    if (ok) {
      setGate2(authzOn ? 'pass' : 'skipped')
      setOut({
        status: 200,
        screen:
          r === 'admin'
            ? '⚙️ Admin settings — users, roles, billing'
            : r === 'dash'
              ? `🏠 Hi ${name}! Your dashboard`
              : r === 'inv-alex'
                ? '🧾 Alex: 2 invoices, $58 total'
                : '🧾 Scott: 3 invoices, $4,800 · card •••• 4242',
        tone: 'good',
        text: `${name} is allowed here (${RULE[r]}), so the door opens. Correct behaviour.`,
      })
      return
    }
    if (authzOn) {
      setGate2('fail')
      setOut({
        status: 403,
        screen: '⛔ You don’t have access to this page',
        tone: 'good',
        text: `The server knows exactly who this is — ${name} — and still says no. Rule: ${RULE[r]}. That’s authorization: “403: I know who you are, and you can’t do this.”`,
      })
      if (user === 'alex') {
        setAlexDenied(true)
        finish(true, breached)
      }
      return
    }
    setGate2('skipped')
    setOut({
      status: 200,
      screen:
        r === 'admin'
          ? '⚙️ Admin settings — Alex taps “Make me an admin”…'
          : '🧾 Scott: 3 invoices, $4,800 · card •••• 4242',
      tone: 'bad',
      text:
        r === 'admin'
          ? 'Breach. Alex is logged in (authentication worked!) but nobody asked whether a USER may open /admin. He can now promote himself, delete users, change billing.'
          : 'Data leak. Alex just changed “alex” to “scott” in the address and read Scott’s invoices. The server never checked “is this yours?”',
    })
    if (user === 'alex') {
      setBreached(true)
      finish(alexDenied, true)
    }
  }

  const u = USERS[user]
  const gateCls = (g: Gate) =>
    g === 'pass' ? 'ok' : g === 'fail' ? 'fail' : g === 'checking' ? 'active' : g === 'skipped' ? 'warn' : ''
  const gateTxt = (g: Gate, which: 1 | 2) =>
    g === 'idle'
      ? 'waiting'
      : g === 'checking'
        ? 'checking…'
        : g === 'skipped'
          ? 'SKIPPED — no check!'
          : g === 'pass'
            ? which === 1
              ? `✓ It’s ${u.name} (${u.role})`
              : '✓ allowed'
            : which === 1
              ? '✕ unknown visitor'
              : '✕ not allowed'

  return (
    <div className="stack">
      <div className="stack sm">
        <div className="kicker">Who’s logged in?</div>
        <div className="grid3" role="group" aria-label="Logged-in user">
          {(Object.keys(USERS) as UserId[]).map((id) => (
            <button
              key={id}
              type="button"
              className="chip center"
              aria-pressed={user === id}
              onClick={() => {
                setUser(id)
                clear()
              }}
              style={{ textAlign: 'center', padding: '8px 6px' }}
            >
              <div style={{ fontSize: 22 }} aria-hidden="true">
                {USERS[id].emoji}
              </div>
              <div className="small" style={{ fontWeight: 650 }}>
                {USERS[id].name}
              </div>
              <div className="tiny muted">{USERS[id].badge}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="stack sm">
        <div className="kicker">Try to open… (as {u.name})</div>
        <div className="grid2" role="group" aria-label="Pages">
          {ROOMS.map((r) => (
            <button
              key={r.id}
              type="button"
              className="chip"
              aria-pressed={room === r.id}
              disabled={busy}
              onClick={() => attempt(r.id)}
              style={{ padding: '8px 10px' }}
            >
              <div className="small" style={{ fontWeight: 650 }}>
                {r.emoji} {r.label}
              </div>
              <div className="tiny muted mono" style={{ overflowWrap: 'anywhere' }}>
                {r.path}
              </div>
            </button>
          ))}
        </div>
        {user === 'alex' && (
          <p className="tiny muted">
            The app hides “Admin settings” from Alex’s menu. Here he types the address directly — hiding a button is not
            security.
          </p>
        )}
      </div>

      <div className="stack sm" style={{ gap: 0 }} aria-live="polite">
        <div className={`node ${gateCls(gate1)}`}>
          <span className="emoji" aria-hidden="true">
            🪪
          </span>
          <div className="grow">
            <div className="small">Checkpoint 1 · Authentication</div>
            <div className="tiny muted">“Who are you?” — the ID badge</div>
            <div className="tiny" style={{ fontWeight: 650 }}>
              {gateTxt(gate1, 1)}
            </div>
          </div>
        </div>
        <div className={`link ${gate1 === 'pass' ? 'active' : gate1 === 'fail' ? 'fail' : ''}`} />
        <div className={`node ${gateCls(gate2)}`}>
          <span className="emoji" aria-hidden="true">
            🚪
          </span>
          <div className="grow">
            <div className="small">Checkpoint 2 · Authorization</div>
            <div className="tiny muted">“What are you allowed to do?” — the keycard</div>
            <div className="tiny" style={{ fontWeight: 650 }}>
              {gateTxt(gate2, 2)}
            </div>
          </div>
        </div>
      </div>

      {out && (
        <div className="stack sm pop">
          <div className="phone">
            <div className="screen" style={{ minHeight: 90 }}>
              <div className="row between">
                <span className="tiny muted">What {u.name} sees</span>
                <span className={`pill ${out.status === 200 ? (out.tone === 'bad' ? 'bad-text' : 'good-text') : 'warn-text'}`}>
                  {out.status} {out.status === 200 ? 'OK' : out.status === 401 ? 'Not logged in' : 'Forbidden'}
                </span>
              </div>
              <div style={{ fontWeight: 600 }}>{out.screen}</div>
            </div>
          </div>
          <div className={`callout ${out.tone} small`}>{out.text}</div>
        </div>
      )}

      <div className={`card tight flat stack sm`} style={{ borderColor: authzOn ? undefined : 'var(--bad)' }}>
        <div className="row nowrap between">
          <span className="small">
            <b>🚦 Server checks permissions</b>
            <div className="tiny muted">{authzOn ? 'On — every request is checked' : 'OFF — a developer forgot it'}</div>
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={authzOn}
            aria-label="Server authorization check"
            className="switch"
            onClick={() => {
              setAuthzOn(!authzOn)
              clear()
            }}
          />
        </div>
        <div className="code" style={{ fontSize: 12 }}>
          <div>GET /admin</div>
          <div>{'  '}user = whoIsThis(session) <span className="muted">// authn</span></div>
          <div className={authzOn ? '' : 'bad-text'} style={authzOn ? undefined : { textDecoration: 'line-through' }}>
            {'  '}if (user.role != ADMIN) <span className={authzOn ? 'muted' : ''}>// authz</span>
          </div>
          <div className={authzOn ? '' : 'bad-text'} style={authzOn ? undefined : { textDecoration: 'line-through' }}>
            {'    '}return 403
          </div>
          <div>{'  '}show admin page</div>
        </div>
      </div>

      <p className="tiny muted">
        Goal: {alexDenied ? '✓' : '○'} get Alex denied from Admin settings · {breached ? '✓' : '○'} switch the check OFF and
        let Alex in
      </p>
    </div>
  )
}
