import { useEffect, useRef, useState } from 'react'
import { wait } from '../lib/motion'

/* ------------------------------------------------------------------ */
/* UrlAnatomy: tap each part of a URL                                  */
/* ------------------------------------------------------------------ */

const PARTS = [
  { id: 'scheme', text: 'https://', name: 'Scheme', say: 'How to talk: “https” means the secure, encrypted way. Plain “http” is readable by anyone in between.' },
  { id: 'domain', text: 'app.acme.com', name: 'Domain', say: 'Which company’s servers to ask. Your browser looks this name up in DNS to find the real address.' },
  { id: 'path', text: '/contacts/482', name: 'Path', say: 'Which thing you want: the contacts collection, item number 482. Like a street address inside the app.' },
  { id: 'query', text: '?tab=notes', name: 'Query', say: 'Extra options for this request — here, “open the Notes tab”. Never put secrets here: URLs get logged and shared.' },
]

export function UrlAnatomy({ onDone }: { onDone?: () => void }) {
  const [sel, setSel] = useState<string | null>(null)
  const [seen, setSeen] = useState<Set<string>>(new Set())
  const part = PARTS.find((p) => p.id === sel)

  function tap(id: string) {
    setSel(id)
    if (seen.has(id)) return
    const next = new Set(seen).add(id)
    setSeen(next)
    if (next.size === PARTS.length) onDone?.()
  }

  return (
    <div className="stack">
      <div className="well row" style={{ gap: 4 }} role="group" aria-label="URL parts">
        {PARTS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`chip mono ${seen.has(p.id) && sel !== p.id ? 'good' : ''}`}
            aria-pressed={sel === p.id}
            onClick={() => tap(p.id)}
            style={{ padding: '8px 8px', fontSize: 14, fontWeight: 600 }}
          >
            {p.text}
          </button>
        ))}
      </div>
      <div aria-live="polite">
        {part ? (
          <div className="callout info pop" key={part.id}>
            <b>{part.name}.</b> {part.say}
          </div>
        ) : (
          <p className="small muted">Tap a piece of the address.</p>
        )}
      </div>
      <p className="tiny muted">
        {seen.size}/{PARTS.length} parts explored
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* RequestLab: build a request, send it, collect status codes          */
/* ------------------------------------------------------------------ */

const REQS = [
  { id: 'get', method: 'GET', path: '/contacts/482', say: 'Show me Maria' },
  { id: 'post', method: 'POST', path: '/contacts', say: 'Save a new contact' },
  { id: 'del', method: 'DELETE', path: '/contacts/482', say: 'Delete Maria' },
  { id: 'missing', method: 'GET', path: '/contacts/999', say: 'Show me contact 999' },
  { id: 'admin', method: 'GET', path: '/admin/users', say: 'List every user (admin page)' },
] as const

const WHO = [
  { id: 'none', label: '🚪 Logged out' },
  { id: 'alex', label: '🙂 Alex (user)' },
  { id: 'scott', label: '👑 Scott (admin)' },
] as const

type ReqId = (typeof REQS)[number]['id']
type WhoId = (typeof WHO)[number]['id']

interface Resp {
  code: number
  name: string
  plain: string
  screen: string
  tone: 'good' | 'bad' | 'warn'
}

const CODES = [200, 201, 401, 403, 404, 500]

function respond(req: ReqId, who: WhoId, bug: boolean): Resp {
  if (bug) return { code: 500, name: 'Internal Server Error', plain: 'The server tripped over its own code. Not your fault, user — ours.', screen: '😵 Something went wrong on our end.', tone: 'bad' }
  if (who === 'none') return { code: 401, name: 'Unauthorized', plain: '“I don’t know who you are.” Log in first.', screen: '🔑 Please log in to continue.', tone: 'warn' }
  if (req === 'admin' && who !== 'scott') return { code: 403, name: 'Forbidden', plain: '“I know who you are, Alex — and you’re not allowed in here.”', screen: '⛔ You don’t have access to this page.', tone: 'warn' }
  if (req === 'missing') return { code: 404, name: 'Not Found', plain: '“There’s no contact 999.” The address points at nothing.', screen: '🤷 Contact not found.', tone: 'warn' }
  if (req === 'post') return { code: 201, name: 'Created', plain: '“Saved it. The new contact is #483.”', screen: '✅ Contact saved', tone: 'good' }
  if (req === 'del') return { code: 200, name: 'OK', plain: '“Done — Maria is deleted.”', screen: '🗑️ Maria Lopez deleted', tone: 'good' }
  if (req === 'admin') return { code: 200, name: 'OK', plain: '“Here are all 1,204 users.”', screen: '👥 1,204 users', tone: 'good' }
  return { code: 200, name: 'OK', plain: '“Here’s Maria: maria@skyways.aero, Denver.”', screen: '👤 Maria Lopez · Denver', tone: 'good' }
}

const cookieFor = (w: WhoId) => (w === 'none' ? '(none)' : w === 'alex' ? 'session=al3x-7f2c' : 'session=sc0tt-91be')

export function RequestLab({ onDone }: { onDone?: () => void }) {
  const [req, setReq] = useState<ReqId>('get')
  const [who, setWho] = useState<WhoId>('alex')
  const [bug, setBug] = useState(false)
  const [https, setHttps] = useState(true)
  const [phase, setPhase] = useState<'idle' | 'out' | 'back'>('idle')
  const [resp, setResp] = useState<(Resp & { https: boolean; req: ReqId; who: WhoId }) | null>(null)
  const [found, setFound] = useState<Set<number>>(new Set())
  const fired = useRef(false)
  const alive = useRef(true)
  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])

  const r = REQS.find((x) => x.id === req)!

  async function send() {
    setResp(null)
    setPhase('out')
    await wait(700)
    if (!alive.current) return
    setPhase('back')
    await wait(600)
    if (!alive.current) return
    const out = respond(req, who, bug)
    setResp({ ...out, https, req, who })
    setPhase('idle')
    const next = new Set(found).add(out.code)
    setFound(next)
    if (!fired.current && next.size >= 5) {
      fired.current = true
      onDone?.()
    }
  }

  const busy = phase !== 'idle'
  const shownReq = resp ? REQS.find((x) => x.id === resp.req)! : r

  return (
    <div className="stack">
      <div className="stack sm">
        <div className="kicker">Codes discovered: {found.size}/{CODES.length} (find 5)</div>
        <div className="row" style={{ gap: 6 }}>
          {CODES.map((c) => (
            <span key={c} className="pill mono" style={found.has(c) ? { background: 'var(--good-soft)', color: 'var(--good)' } : undefined}>
              {found.has(c) ? '✓ ' : ''}
              {c}
            </span>
          ))}
        </div>
      </div>

      <div className="stack sm">
        <div className="kicker">1 · What do you want?</div>
        <div className="stack" style={{ gap: 6 }}>
          {REQS.map((x) => (
            <button key={x.id} type="button" className="chip" aria-pressed={req === x.id} disabled={busy} onClick={() => setReq(x.id)}>
              <span className="mono" style={{ fontWeight: 700 }}>
                {x.method}
              </span>{' '}
              <span className="mono small">{x.path}</span>
              <span className="tiny muted" style={{ display: 'block' }}>
                {x.say}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="stack sm">
        <div className="kicker">2 · Who is asking?</div>
        <div className="row" style={{ gap: 6 }}>
          {WHO.map((w) => (
            <button key={w.id} type="button" className="chip small" aria-pressed={who === w.id} disabled={busy} onClick={() => setWho(w.id)}>
              {w.label}
            </button>
          ))}
        </div>
      </div>

      <div className="stack sm">
        <div className="kicker">3 · Conditions</div>
        <div className="row nowrap between">
          <span className="small">🐞 Server has a bug</span>
          <button type="button" role="switch" aria-checked={bug} aria-label="Server has a bug" className="switch" disabled={busy} onClick={() => setBug(!bug)} />
        </div>
        <div className="row nowrap between">
          <span className="small">🔒 Use HTTPS (encrypted)</span>
          <button type="button" role="switch" aria-checked={https} aria-label="Use HTTPS" className="switch" disabled={busy} onClick={() => setHttps(!https)} />
        </div>
      </div>

      <button type="button" className="btn primary" onClick={send} disabled={busy}>
        {busy ? 'Sending…' : `Send ${r.method} ${r.path}`}
      </button>

      <div className="stack sm" aria-hidden="true">
        <div className={`node ${phase === 'out' ? 'active' : ''}`}>
          <span className="emoji">📱</span>
          <span className="grow">Your app</span>
          {phase === 'out' && <span className="bubble req">request →</span>}
        </div>
        <div className={`link ${busy ? 'active' : ''}`} />
        <div className={`node ${phase === 'back' ? 'active' : resp ? (resp.tone === 'bad' ? 'fail' : resp.tone === 'warn' ? 'warn' : 'ok') : ''}`}>
          <span className="emoji">⚙️</span>
          <span className="grow">Server</span>
          {phase === 'back' && <span className="bubble res">← response</span>}
        </div>
      </div>

      <div aria-live="polite" className="stack sm">
        {resp && (
          <div className="stack sm pop" key={`${resp.code}-${resp.req}-${resp.who}-${found.size}`}>
            <div className="code">
              {`${shownReq.method} ${shownReq.path}\nHost: app.acme.com\nCookie: ${cookieFor(resp.who)}\n\n→ ${resp.code} ${resp.name}`}
            </div>
            <div className={`callout ${resp.tone}`}>
              <b className="mono">{resp.code}</b> — {resp.plain}
            </div>
            <div className="phone">
              <div className="screen" style={{ minHeight: 70 }}>
                <div className="tiny muted">What the user sees</div>
                <div style={{ fontWeight: 600 }}>{resp.screen}</div>
              </div>
            </div>
            <div className={`callout ${resp.https ? 'good' : 'bad'} small`}>
              <b>👀 Someone on the same café Wi‑Fi sees:</b>
              <div className="mono tiny" style={{ marginTop: 4, overflowWrap: 'anywhere' }}>
                {resp.https
                  ? 'app.acme.com · 8f3a 91c0 e27b 4d1f 0a6e … (scrambled)'
                  : `${shownReq.method} ${shownReq.path} · Cookie: ${cookieFor(resp.who)}`}
              </div>
              <div className="tiny" style={{ marginTop: 4 }}>
                {resp.https
                  ? 'Only which site you visited. Everything else is encrypted.'
                  : resp.who === 'none'
                    ? 'Everything — including any password you type on the login page.'
                    : 'Everything — including the session cookie, which lets them act as you.'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
