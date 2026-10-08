import { useEffect, useRef, useState } from 'react'
import { wait } from '../lib/motion'
import { LogLine, VulnCase, type VulnApi } from './AttackLab'

/* Attack Lab I — accounts & keys. Fictional sandbox app "KiteDesk".
   Everything here is a simplified simulation, not real attack tooling. */

interface CaseProps {
  onDone?: () => void
}

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

/* ------------------------------------------------------------------ */
/* 1. Weak passwords                                                    */
/* ------------------------------------------------------------------ */

const COMMON = ['123456', 'password', 'qwerty', '111111', 'iloveyou', 'password1', 'abc123', 'letmein']

export function WeakPasswordCase({ onDone }: CaseProps) {
  const alive = useAlive()
  const [account, setAccount] = useState<null | 'weak' | 'strong'>(null)
  const [tried, setTried] = useState<{ pw: string; hit: boolean }[]>([])
  const [outcome, setOutcome] = useState<string | null>(null)

  async function bot(api: VulnApi) {
    api.setBusy(true)
    setTried([])
    setOutcome(null)
    const weak = !api.fixOn
    for (const pw of COMMON) {
      await wait(260)
      if (!alive.current) return
      const hit = weak && pw === 'password1'
      setTried((t) => [...t, { pw, hit }])
      if (hit) break
    }
    await wait(400)
    if (!alive.current) return
    api.setBusy(false)
    if (weak) {
      setOutcome('✓ MATCH on guess #6 — logged in as Maya.')
      api.report('breach')
    } else {
      setOutcome('All 8 guesses wrong. And even a right guess would hit the 2FA code prompt.')
      api.report('blocked')
    }
  }

  return (
    <VulnCase
      emoji="🔑"
      name="Weak passwords"
      intended="Each person picks a password. Only the person who knows it can get into the account."
      happened="Maya chose ‘password1’ — one of the most common passwords on Earth. A bot that just tries popular passwords got in on guess 6. No hacking skill needed."
      fixName="Block common passwords + 2FA"
      fixText="Reject passwords found on breach lists, and ask for a one-time code from Maya’s phone."
      blocked="Maya was forced to pick a long passphrase at sign-up, so the list never matches. 2FA is the safety net if a password leaks anyway."
      url={() => 'kitedesk.example/login'}
      onDone={onDone}
      sandbox={(api) => (
        <>
          <div className="row between">
            <span className="small" style={{ fontWeight: 650 }}>
              👩 Maya’s account
            </span>
            <span className="pill">
              {account === null ? 'not created' : account === 'weak' ? 'password: password1' : 'passphrase + 2FA'}
            </span>
          </div>
          <button
            type="button"
            className="btn small block"
            disabled={api.busy}
            onClick={() => {
              setAccount(api.fixOn ? 'strong' : 'weak')
              setTried([])
              setOutcome(null)
              api.report('normal')
            }}
          >
            Sign Maya up with “password1”
          </button>
          {account && (
            <LogLine tone={account === 'weak' ? undefined : 'warn'}>
              {account === 'weak'
                ? '✓ Account created. The app accepted “password1”.'
                : '✕ “password1” rejected: it appears in breach lists. Maya picks a 4-word passphrase and turns on 2FA.'}
            </LogLine>
          )}
          {api.stage >= 1 && (
            <>
              <div className="divider" />
              <button
                type="button"
                className="btn small danger block"
                disabled={api.busy || !account}
                onClick={() => {
                  if (api.fixOn) setAccount('strong')
                  void bot(api)
                }}
              >
                🤖 Run the “top 8 passwords” bot
              </button>
              {tried.length > 0 && (
                <div className="row" style={{ gap: 6 }}>
                  {tried.map((t) => (
                    <span key={t.pw} className={`pill mono pop`} style={{ background: t.hit ? 'var(--bad-soft)' : undefined, color: t.hit ? 'var(--bad)' : undefined }}>
                      {t.hit ? '✓' : '✕'} {t.pw}
                    </span>
                  ))}
                </div>
              )}
              {outcome && <LogLine tone={api.fixOn ? 'good' : 'bad'}>{outcome}</LogLine>}
            </>
          )}
        </>
      )}
    />
  )
}

/* ------------------------------------------------------------------ */
/* 2. Stolen sessions                                                  */
/* ------------------------------------------------------------------ */

export function StolenSessionCase({ onDone }: CaseProps) {
  const alive = useAlive()
  const [loggedIn, setLoggedIn] = useState(false)
  const [log, setLog] = useState<{ tone?: 'good' | 'bad' | 'warn'; text: string }[]>([])
  const [attacker, setAttacker] = useState<null | 'in' | 'denied'>(null)

  async function attack(api: VulnApi) {
    api.setBusy(true)
    setLog([])
    setAttacker(null)
    const push = (tone: 'good' | 'bad' | 'warn' | undefined, text: string) => setLog((l) => [...l, { tone, text }])
    push(undefined, 'A buggy chat widget on the page runs a script…')
    await wait(700)
    if (!alive.current) return
    if (!api.fixOn) {
      push('bad', 'Script reads the cookie: session=7f3a…c91')
      await wait(700)
      if (!alive.current) return
      push('bad', 'Sends it to the attacker’s server.')
      await wait(700)
      if (!alive.current) return
      setAttacker('in')
      api.setBusy(false)
      api.report('breach')
    } else {
      push('good', 'Script tries to read the cookie → nothing there. HttpOnly cookies are invisible to scripts.')
      await wait(800)
      if (!alive.current) return
      push(undefined, 'Attacker tries an older token stolen last month…')
      await wait(700)
      if (!alive.current) return
      push('good', '401: session expired (30 min idle) and revoked by “Log out everywhere”.')
      setAttacker('denied')
      api.setBusy(false)
      api.report('blocked')
    }
  }

  return (
    <VulnCase
      emoji="🍪"
      name="Stolen sessions"
      intended="After Maya logs in, her browser keeps a session cookie — like a festival wristband — so she isn’t asked for her password on every click."
      happened="The attacker never learned Maya’s password. They copied her wristband. While it’s valid, the app can’t tell the attacker from Maya."
      fixName="Secure session cookies"
      fixText="Mark cookies HttpOnly + Secure, expire idle sessions, and let users “log out everywhere”."
      blocked="Scripts can’t read the cookie, and old tokens die quickly. A stolen wristband is now worthless."
      url={() => (loggedIn ? 'kitedesk.example/dashboard' : 'kitedesk.example/login')}
      onDone={onDone}
      sandbox={(api) => (
        <>
          <div className="well stack sm" style={{ padding: 10 }}>
            <div className="tiny muted">👩 Maya’s browser</div>
            {loggedIn ? (
              <>
                <div className="small" style={{ fontWeight: 650 }}>
                  Welcome back, Maya 👋
                </div>
                <div className="mono tiny ink2">
                  cookie: session=7f3a…c91{api.fixOn ? ' · HttpOnly · Secure · 30 min' : ''}
                </div>
              </>
            ) : (
              <button
                type="button"
                className="btn small"
                onClick={() => {
                  setLoggedIn(true)
                  api.report('normal')
                }}
              >
                Log in as Maya
              </button>
            )}
          </div>
          {api.stage >= 1 && (
            <>
              <button type="button" className="btn small danger block" disabled={api.busy} onClick={() => void attack(api)}>
                🕵️ Run the leaky script
              </button>
              {log.map((l, i) => (
                <LogLine key={i} tone={l.tone}>
                  {l.text}
                </LogLine>
              ))}
              {attacker && (
                <div className="well stack sm pop" style={{ padding: 10, background: attacker === 'in' ? 'var(--bad-soft)' : 'var(--good-soft)' }}>
                  <div className="tiny muted">🕵️ Attacker’s browser (pasted the cookie)</div>
                  <div className="small" style={{ fontWeight: 650 }}>
                    {attacker === 'in' ? 'Welcome back, Maya 👋 — no password asked.' : '401 · Please log in.'}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    />
  )
}

/* ------------------------------------------------------------------ */
/* 3. Missing authorization                                            */
/* ------------------------------------------------------------------ */

const INVOICES: Record<number, { owner: string; company: string; amount: string; mine: boolean }> = {
  1041: { owner: 'Alex', company: 'Alex’s Bakery', amount: '$120.00', mine: true },
  1042: { owner: 'Maya', company: 'Skyline Flight School', amount: '$4,800.00', mine: false },
  1043: { owner: 'Priya', company: 'Priya Legal LLP', amount: '$2,150.00', mine: false },
}

export function MissingAuthzCase({ onDone }: CaseProps) {
  const [open, setOpen] = useState<number | null>(null)
  const [denied, setDenied] = useState(false)

  function view(id: number, api: VulnApi) {
    setOpen(id)
    const inv = INVOICES[id]
    if (inv.mine) {
      setDenied(false)
      api.report('normal')
    } else if (api.fixOn) {
      setDenied(true)
      api.report('blocked')
    } else {
      setDenied(false)
      api.report('breach')
    }
  }

  return (
    <VulnCase
      emoji="🚪"
      name="Missing authorization"
      intended="Each customer can see only their own invoices. Alex runs a bakery; he should only ever see the bakery’s bills."
      happened="The server checked WHO Alex is (logged in ✓) but never checked whether invoice 1042 is HIS. Changing one number showed another company’s private bill."
      fixName="Ownership check on the server"
      fixText="Before returning any invoice, the backend checks: does this invoice belong to the logged-in customer?"
      blocked="Same URL trick, but the server now asks “is this yours?” on every request. 403 Forbidden."
      url={() => `kitedesk.example/invoices/${open ?? ''}`}
      onDone={onDone}
      sandbox={(api) => (
        <>
          <div className="tiny muted">Logged in as 🧑‍🍳 Alex (Alex’s Bakery)</div>
          <button type="button" className="btn small block" onClick={() => view(1041, api)}>
            Open my invoice #1041
          </button>
          {api.stage >= 1 && (
            <div className="stack sm">
              <div className="tiny ink2">Edit the number in the address bar:</div>
              <div className="row" style={{ gap: 6 }}>
                {[1042, 1043].map((id) => (
                  <button key={id} type="button" className="chip mono" aria-pressed={open === id} onClick={() => view(id, api)}>
                    …/invoices/{id}
                  </button>
                ))}
              </div>
            </div>
          )}
          {open !== null && (
            <div
              className="well stack sm pop"
              key={`${open}-${denied}`}
              style={{ padding: 10, background: denied ? 'var(--good-soft)' : INVOICES[open].mine ? undefined : 'var(--bad-soft)' }}
            >
              {denied ? (
                <>
                  <div className="mono small" style={{ fontWeight: 700 }}>
                    403 Forbidden
                  </div>
                  <div className="tiny">This invoice belongs to another account.</div>
                </>
              ) : (
                <>
                  <div className="row between">
                    <span className="small" style={{ fontWeight: 650 }}>
                      Invoice #{open}
                    </span>
                    <span className="mono small">{INVOICES[open].amount}</span>
                  </div>
                  <div className="tiny">
                    Billed to: {INVOICES[open].company} ({INVOICES[open].owner})
                  </div>
                  {!INVOICES[open].mine && <div className="tiny bad-text">⚠️ This is not Alex’s data.</div>}
                </>
              )}
            </div>
          )}
        </>
      )}
    />
  )
}

/* ------------------------------------------------------------------ */
/* 4. Exposed secrets                                                  */
/* ------------------------------------------------------------------ */

export function ExposedSecretCase({ onDone }: CaseProps) {
  const alive = useAlive()
  const [bought, setBought] = useState(false)
  const [source, setSource] = useState(false)
  const [log, setLog] = useState<{ tone?: 'good' | 'bad'; text: string }[]>([])

  async function tryKey(api: VulnApi) {
    api.setBusy(true)
    setLog([])
    const push = (tone: 'good' | 'bad' | undefined, text: string) => setLog((l) => [...l, { tone, text }])
    push(undefined, 'Attacker’s laptop → payment provider, using the copied key…')
    await wait(800)
    if (!alive.current) return
    if (!api.fixOn) {
      push('bad', '✓ List all customers → 2,311 records')
      await wait(600)
      if (!alive.current) return
      push('bad', '✓ Issue refunds → allowed')
      api.setBusy(false)
      api.report('breach')
    } else {
      push('good', '401 Unauthorized — this key was revoked.')
      api.setBusy(false)
      api.report('blocked')
    }
  }

  return (
    <VulnCase
      emoji="🗝️"
      name="Exposed secrets"
      intended="KiteDesk uses a secret key to charge cards through a payment provider. Only KiteDesk’s servers were supposed to know it."
      happened="The key was in the frontend code, and every visitor downloads the frontend. Anyone can press “view source”. That key could read every customer and issue refunds."
      fixName="Key on the server + rotate it"
      fixText="Move the key into a server environment variable, and rotate (replace) the leaked key so the old one stops working."
      blocked="The page only asks KiteDesk’s own server to charge. The old key was revoked, so the copy the attacker holds is useless."
      url={() => (source ? 'view-source:kitedesk.example/app.js' : 'kitedesk.example/upgrade')}
      onDone={onDone}
      sandbox={(api) => (
        <>
          <button
            type="button"
            className="btn small block"
            onClick={() => {
              setBought(true)
              api.report('normal')
            }}
          >
            Buy the Pro plan ($29)
          </button>
          {bought && <LogLine>✓ Card charged $29. Welcome to Pro!</LogLine>}
          {api.stage >= 1 && (
            <>
              <div className="divider" />
              <button
                type="button"
                className="btn small danger block"
                disabled={api.busy}
                onClick={() => {
                  setSource(true)
                  setLog([])
                }}
              >
                🔍 View page source
              </button>
              {source && (
                <div className="code pop" key={String(api.fixOn)}>
                  {'// app.js — downloaded by every visitor\n'}
                  {!api.fixOn ? (
                    <>
                      <span style={{ background: 'var(--bad-soft)', color: 'var(--bad)', fontWeight: 700 }}>
                        {'const PAY_KEY = "sk_live_EXAMPLE_9f2c…"'}
                      </span>
                      {'\npayments.charge(PAY_KEY, 29)'}
                    </>
                  ) : (
                    <>{"fetch('/api/checkout', { plan: 'pro' })\n// no keys in here"}</>
                  )}
                </div>
              )}
              {source && (
                <button type="button" className="btn small danger block" disabled={api.busy} onClick={() => void tryKey(api)}>
                  🗝️ Use the copied key
                </button>
              )}
              {log.map((l, i) => (
                <LogLine key={i} tone={l.tone}>
                  {l.text}
                </LogLine>
              ))}
            </>
          )}
        </>
      )}
    />
  )
}
