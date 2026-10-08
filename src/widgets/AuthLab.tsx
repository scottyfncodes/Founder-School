import { useRef, useState } from 'react'
import { wait } from '../lib/motion'

/** A tiny deterministic "hash" for display — looks like a real one, is NOT real crypto. */
function fakeHash(input: string, salt = 'k9Qz') {
  const alphabet = './ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let h1 = 0x811c9dc5
  let h2 = 0x01000193
  const s = salt + input
  let out = ''
  for (let round = 0; round < 31; round++) {
    for (let i = 0; i < s.length; i++) {
      h1 = Math.imul(h1 ^ s.charCodeAt(i), 16777619) >>> 0
      h2 = Math.imul(h2 + s.charCodeAt(i) + round, 2246822519) >>> 0
    }
    out += alphabet[(h1 ^ (h2 >>> 7)) & 63]
  }
  return `$2b$12$${out}`
}

const PASSWORD = 'sunflower42'
const CODE = '482913'

type Who = 'scott' | 'stranger'
type Screen = 'login' | 'mfa' | 'in'

interface LogLine {
  text: string
  tone?: 'good' | 'bad' | 'warn'
}

/**
 * A simulated login: password check → optional 2FA → session.
 * Then let a stranger with Scott's leaked password try it, with 2FA on and off.
 */
export function AuthLab({ onDone }: { onDone?: () => void }) {
  const [who, setWho] = useState<Who>('scott')
  const [mfaOn, setMfaOn] = useState(true)
  const [screen, setScreen] = useState<Screen>('login')
  const [pw, setPw] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [log, setLog] = useState<LogLine[]>([])
  const [result, setResult] = useState<{ tone: 'good' | 'bad' | 'warn'; text: string } | null>(null)
  const [scottIn, setScottIn] = useState(false)
  const [strangerBlocked, setStrangerBlocked] = useState(false)
  const fired = useRef(false)

  function check(si: boolean, sb: boolean) {
    if (!fired.current && si && sb) {
      fired.current = true
      onDone?.()
    }
  }

  function reset(nextWho: Who = who) {
    setWho(nextWho)
    setScreen('login')
    setPw(nextWho === 'stranger' ? PASSWORD : '')
    setCode('')
    setError('')
    setLog([])
    setResult(null)
  }

  async function submitPassword() {
    if (busy) return
    setBusy(true)
    setError('')
    const l: LogLine[] = [{ text: `Login attempt for scott@acme.co (${who === 'scott' ? 'Scott’s laptop' : 'unknown device, other country'})` }]
    setLog(l)
    await wait(500)
    const ok = pw === PASSWORD
    l.push({
      text: `Hash what was typed → compare with stored hash… ${ok ? 'match ✓' : 'no match ✕'}`,
      tone: ok ? 'good' : 'bad',
    })
    setLog([...l])
    await wait(500)
    setBusy(false)
    if (!ok) {
      setError('Incorrect email or password.')
      setResult({
        tone: 'warn',
        text: 'Notice the message doesn’t say WHICH part was wrong — that would help attackers guess. The password is still: sunflower42.',
      })
      return
    }
    if (mfaOn) {
      l.push({ text: 'Password OK, but 2FA is required → code sent to Scott’s phone', tone: 'warn' })
      setLog([...l])
      setScreen('mfa')
      setResult(null)
    } else {
      finishLogin(l)
    }
  }

  function finishLogin(l: LogLine[]) {
    l.push({ text: 'Identity confirmed → session created: sess_7Hk2…  (expires in 7 days)', tone: 'good' })
    setLog([...l])
    setScreen('in')
    if (who === 'scott') {
      setScottIn(true)
      setResult({
        tone: 'good',
        text: 'Scott proved who he is. The server hands his browser a session — a wristband — so he doesn’t retype his password on every tap.',
      })
      check(true, strangerBlocked)
    } else {
      setResult({
        tone: 'bad',
        text: 'With 2FA off, a leaked password is all a stranger needs. The app can’t tell them apart from Scott. Switch 2FA on and try again.',
      })
    }
  }

  async function submitCode(value: string) {
    if (busy) return
    setBusy(true)
    const l = [...log, { text: `Checking 2FA code ${value || '(empty)'}…` }]
    setLog(l)
    await wait(500)
    setBusy(false)
    if (value === CODE) {
      l.push({ text: 'Code matches the one sent to Scott’s phone ✓', tone: 'good' })
      finishLogin(l)
    } else {
      l.push({ text: 'Wrong code ✕ — login blocked, Scott gets an alert', tone: 'bad' })
      setLog([...l])
      setError('That code isn’t right.')
      if (who === 'stranger') {
        setStrangerBlocked(true)
        setResult({
          tone: 'good',
          text: 'Blocked. The stranger had the password (something you KNOW) but not Scott’s phone (something you HAVE). That second factor is the whole point of 2FA.',
        })
        check(scottIn, true)
      }
    }
  }

  return (
    <div className="stack">
      <div className="stack sm">
        <div className="kicker">Who’s at the keyboard?</div>
        <div className="grid2">
          <button type="button" className="chip" aria-pressed={who === 'scott'} onClick={() => reset('scott')}>
            🧑 Scott
            <div className="tiny muted">The real owner {scottIn ? '✓' : ''}</div>
          </button>
          <button type="button" className="chip" aria-pressed={who === 'stranger'} onClick={() => reset('stranger')}>
            🦹 Stranger
            <div className="tiny muted">Bought a leaked password {strangerBlocked ? '✓' : ''}</div>
          </button>
        </div>
        <div className="row nowrap between well" style={{ padding: '8px 12px' }}>
          <span className="small">
            <b>2FA required</b>
            <span className="muted"> — a code from Scott’s phone</span>
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={mfaOn}
            aria-label="Require two-factor authentication"
            className="switch"
            onClick={() => {
              setMfaOn(!mfaOn)
              reset()
            }}
          />
        </div>
      </div>

      <div className="phone">
        <div className="screen">
          <div className="tiny muted">acme-crm.app · {who === 'scott' ? 'Scott’s laptop' : 'Stranger’s laptop'}</div>
          {screen === 'login' && (
            <form
              className="stack sm"
              onSubmit={(e) => {
                e.preventDefault()
                void submitPassword()
              }}
            >
              <b>Log in</b>
              <label className="tiny muted" htmlFor="authlab-email">
                Email
              </label>
              <input id="authlab-email" className="chip mono" value="scott@acme.co" readOnly style={{ width: '100%' }} />
              <label className="tiny muted" htmlFor="authlab-pw">
                Password {who === 'scott' ? '(it’s “sunflower42”)' : '(from a leak list)'}
              </label>
              <input
                id="authlab-pw"
                className="chip mono"
                type="text"
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="type a password"
                style={{ width: '100%' }}
              />
              {error && <div className="tiny bad-text">{error}</div>}
              <button type="submit" className="btn primary small" disabled={busy}>
                {busy ? 'Checking…' : 'Log in'}
              </button>
            </form>
          )}
          {screen === 'mfa' && (
            <div className="stack sm pop">
              <b>Enter the 6-digit code</b>
              <p className="tiny muted">We texted a code to Scott’s phone (•••• 0142).</p>
              {who === 'scott' ? (
                <div className="callout info small">
                  📱 Scott’s phone: <b className="mono">{CODE}</b>
                </div>
              ) : (
                <div className="callout warn small">📵 The stranger doesn’t have Scott’s phone.</div>
              )}
              <input
                aria-label="2FA code"
                className="chip mono"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                style={{ width: '100%' }}
              />
              {error && <div className="tiny bad-text">{error}</div>}
              <div className="row">
                {who === 'scott' ? (
                  <button type="button" className="btn small" disabled={busy} onClick={() => setCode(CODE)}>
                    Copy from phone
                  </button>
                ) : (
                  <button type="button" className="btn small" disabled={busy} onClick={() => setCode('123456')}>
                    Guess a code
                  </button>
                )}
                <button type="button" className="btn primary small grow" disabled={busy} onClick={() => submitCode(code)}>
                  Verify
                </button>
              </div>
            </div>
          )}
          {screen === 'in' && (
            <div className="stack sm pop">
              <b>{who === 'scott' ? '👋 Welcome back, Scott' : '👋 Welcome back, “Scott”'}</b>
              <div className="tiny muted">Logged in. Every tap from here carries the session.</div>
              <div className="code" style={{ fontSize: 12 }}>
                cookie: session=sess_7Hk2…{'\n'}expires: in 7 days
              </div>
              <button type="button" className="btn small" onClick={() => reset()}>
                Log out
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="well stack sm" aria-live="polite">
        <div className="kicker">Server log</div>
        {log.length === 0 && <p className="small muted">Try logging in to see what the server checks.</p>}
        {log.map((l, i) => (
          <div key={i} className={`tiny ${l.tone ? `${l.tone}-text` : ''}`}>
            › {l.text}
          </div>
        ))}
      </div>

      {result && <div className={`callout ${result.tone} pop small`}>{result.text}</div>}

      <p className="tiny muted">
        Goal: log in as Scott (with 2FA), then block the stranger. {scottIn ? '✓ Scott in' : '○ Scott in'} ·{' '}
        {strangerBlocked ? '✓ Stranger blocked' : '○ Stranger blocked'}
      </p>
    </div>
  )
}

const OTHERS = [
  { email: 'maria@acme.co', pw: 'Maria1985!' },
  { email: 'li@blue.sky', pw: 'password123' },
]

/** Type a password; see what the database stores, then leak the database. */
export function HashVault({ onDone }: { onDone?: () => void }) {
  const [pw, setPw] = useState('sunflower42')
  const [mode, setMode] = useState<'plain' | 'hashed'>('plain')
  const [leaked, setLeaked] = useState<Set<string>>(new Set())
  const fired = useRef(false)
  const isLeaked = leaked.has(mode)
  const rows = [{ email: 'scott@acme.co', pw }, ...OTHERS]

  function leak() {
    const next = new Set(leaked).add(mode)
    setLeaked(next)
    if (!fired.current && next.size === 2) {
      fired.current = true
      onDone?.()
    }
  }

  return (
    <div className="stack">
      <label className="stack sm">
        <span className="kicker">Scott’s password</span>
        <input
          className="chip mono"
          value={pw}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          onChange={(e) => setPw(e.target.value.slice(0, 24))}
        />
      </label>
      <div className="stack sm">
        <span className="kicker">How the database stores it</span>
        <div className="grid2" role="group" aria-label="Storage method">
          <button type="button" className="chip" aria-pressed={mode === 'plain'} onClick={() => setMode('plain')}>
            📝 Plain text {leaked.has('plain') ? '✓' : ''}
          </button>
          <button type="button" className="chip" aria-pressed={mode === 'hashed'} onClick={() => setMode('hashed')}>
            🧂 Hashed {leaked.has('hashed') ? '✓' : ''}
          </button>
        </div>
      </div>

      <div className="card tight flat stack sm" style={isLeaked ? { borderColor: 'var(--bad)' } : undefined}>
        <div className="tiny muted">{isLeaked ? '🦹 What the attacker downloaded' : '🗄️ users table'}</div>
        {rows.map((r) => (
          <div key={r.email} className="stack" style={{ gap: 0 }}>
            <span className="tiny muted">{r.email}</span>
            <span
              className={`mono small ${isLeaked ? (mode === 'plain' ? 'bad-text' : 'good-text') : ''}`}
              style={{ overflowWrap: 'anywhere' }}
            >
              {mode === 'plain' ? r.pw || '(empty)' : fakeHash(r.pw, r.email)}
            </span>
          </div>
        ))}
      </div>

      <button type="button" className="btn danger" onClick={leak}>
        💥 The database gets stolen
      </button>

      {isLeaked && (
        <div className={`callout ${mode === 'plain' ? 'bad' : 'good'} pop small`}>
          {mode === 'plain'
            ? 'Game over: every password is readable. And people reuse passwords, so the attacker now tries them on email and banking too.'
            : 'The attacker gets scrambled gibberish. A hash is one-way: the server can check a typed password against it, but nobody can turn it back. (Weak ones like “password123” can still be guessed — hashing buys time, not magic.)'}
        </div>
      )}
      <p className="tiny muted">Leak the database in both modes to compare. Change the password and watch the hash change completely.</p>
    </div>
  )
}
