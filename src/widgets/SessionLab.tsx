import { useRef, useState } from 'react'

const EXPIRY_DAYS = 7

interface Session {
  id: string
  createdDay: number
  revoked: boolean
}

interface Msg {
  tone: 'good' | 'bad' | 'warn' | 'info'
  text: string
}

let counter = 0
const newId = () => `sess_${['7Hk2', 'Q9pa', 'mX4r', 'b2Lt', 'Zr81'][counter++ % 5]}`

/**
 * A session is a wristband: the browser shows it on every request instead of the password.
 * Reload, fast-forward past expiry, let a cookie get stolen, then log out everywhere.
 */
export function SessionLab({ onDone }: { onDone?: () => void }) {
  const [day, setDay] = useState(0)
  const [session, setSession] = useState<Session | null>(() => ({ id: newId(), createdDay: 0, revoked: false }))
  const [cookie, setCookie] = useState<string | null>(session?.id ?? null)
  const [stolen, setStolen] = useState<string | null>(null)
  const [attackerIn, setAttackerIn] = useState(false)
  const [msg, setMsg] = useState<Msg | null>(null)
  const [sawExpiry, setSawExpiry] = useState(false)
  const [revokedTheft, setRevokedTheft] = useState(false)
  const fired = useRef(false)

  const valid = (id: string | null) =>
    !!id && !!session && session.id === id && !session.revoked && day - session.createdDay < EXPIRY_DAYS
  const youIn = valid(cookie)
  const daysLeft = session ? EXPIRY_DAYS - (day - session.createdDay) : 0

  function check(e: boolean, r: boolean) {
    if (!fired.current && e && r) {
      fired.current = true
      onDone?.()
    }
  }

  function reload() {
    if (youIn) {
      setMsg({ tone: 'good', text: 'Still logged in. Your browser quietly sent the cookie with the request, and the server found a live session for it. No password needed.' })
    } else {
      setCookie(null)
      const expired = session && !session.revoked && cookie === session.id
      setMsg({
        tone: 'info',
        text: expired
          ? 'Logged out: the session expired. The wristband is no longer valid, so the server asks for your password again. That limits the damage if a cookie leaks.'
          : 'Logged out: the server has no live session for this browser. Log in to get a new one.',
      })
      if (expired) {
        setSawExpiry(true)
        check(true, revokedTheft)
      }
    }
  }

  function jump() {
    setDay(day + 8)
    setMsg({ tone: 'info', text: 'Eight days pass. Nothing visible changes yet — reload the page to see what the server thinks.' })
  }

  function login() {
    const s = { id: newId(), createdDay: day, revoked: false }
    setSession(s)
    setCookie(s.id)
    setStolen(null)
    setAttackerIn(false)
    setMsg({ tone: 'good', text: `Password (and 2FA) accepted. New session ${s.id} — valid for ${EXPIRY_DAYS} days.` })
  }

  function steal() {
    setStolen(cookie)
    setAttackerIn(false)
    setMsg({ tone: 'warn', text: 'A malicious browser extension copied your session cookie and sent it to an attacker. They never saw your password.' })
  }

  function attackerTry() {
    if (valid(stolen)) {
      setAttackerIn(true)
      setMsg({ tone: 'bad', text: 'The attacker is in your account — no password, no 2FA. The server only sees a valid wristband. That’s why stolen sessions are so dangerous.' })
    } else {
      setAttackerIn(false)
      setMsg({ tone: 'good', text: 'Rejected. The stolen cookie points to a session the server has killed. A copied wristband is worthless once it’s cut.' })
      if (session?.revoked) {
        setRevokedTheft(true)
        check(sawExpiry, true)
      }
    }
  }

  function logoutEverywhere() {
    if (!session) return
    setSession({ ...session, revoked: true })
    setCookie(null)
    setMsg({ tone: 'good', text: 'The server deleted the session. Your browser is logged out — and so is every copy of that cookie. Now let the attacker try again.' })
  }

  return (
    <div className="stack">
      <div className="grid2">
        <div className="stat">
          <span className="v">Day {day}</span>
          <span className="l">today</span>
        </div>
        <div className="stat">
          <span className={`v ${youIn ? 'good-text' : 'muted'}`}>{youIn ? 'Logged in' : 'Logged out'}</span>
          <span className="l">your laptop</span>
        </div>
      </div>

      <div className="card tight flat stack sm">
        <div className="kicker">🍪 Cookie in your browser</div>
        <div className="mono small">{cookie ? `session=${cookie}` : '(none)'}</div>
        <div className="kicker" style={{ marginTop: 6 }}>
          🗄️ Server’s session list
        </div>
        {session ? (
          <div className="small">
            <span className="mono">{session.id}</span> ·{' '}
            {session.revoked ? (
              <span className="bad-text">deleted</span>
            ) : daysLeft > 0 ? (
              <span className="good-text">valid, {daysLeft} day{daysLeft === 1 ? '' : 's'} left</span>
            ) : (
              <span className="warn-text">expired</span>
            )}
            {stolen && !session.revoked && stolen === session.id && (
              <div className="tiny warn-text">⚠️ Also used from: unknown device, another country</div>
            )}
          </div>
        ) : (
          <div className="small muted">(empty)</div>
        )}
      </div>

      <div className="stack sm">
        <div className="kicker">You</div>
        <div className="grid2">
          <button type="button" className="btn small" onClick={reload}>
            🔄 Reload page
          </button>
          <button type="button" className="btn small" onClick={jump}>
            ⏩ Skip 8 days
          </button>
          <button type="button" className="btn small" onClick={login} disabled={youIn}>
            🔑 Log in
          </button>
          <button type="button" className="btn small" onClick={logoutEverywhere} disabled={!session || session.revoked}>
            🚪 Log out everywhere
          </button>
        </div>
        <div className="kicker">Attacker</div>
        <div className="grid2">
          <button type="button" className="btn small danger" onClick={steal} disabled={!youIn}>
            🦹 Steal cookie
          </button>
          <button type="button" className="btn small" onClick={attackerTry} disabled={!stolen}>
            🦹 Use stolen cookie
          </button>
        </div>
        {attackerIn && <div className="tiny bad-text">🦹 Attacker is browsing your account right now.</div>}
      </div>

      {msg && (
        <div className={`callout ${msg.tone} small pop`} key={msg.text} aria-live="polite">
          {msg.text}
        </div>
      )}

      <p className="tiny muted">
        Goals: {sawExpiry ? '✓' : '○'} watch a session expire (skip days, then reload) · {revokedTheft ? '✓' : '○'} steal a
        cookie, log out everywhere, and see the thief rejected
      </p>
    </div>
  )
}
