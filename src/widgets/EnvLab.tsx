import { useRef, useState } from 'react'

type EnvId = 'dev' | 'staging' | 'prod'

const ENVS: Record<
  EnvId,
  {
    emoji: string
    name: string
    who: string
    vars: { k: string; v: string }[]
    email: { tone: 'good' | 'warn' | 'bad'; text: string }
  }
> = {
  dev: {
    emoji: '💻',
    name: 'Development',
    who: 'One developer’s laptop. Fake data, break anything.',
    vars: [
      { k: 'APP_URL', v: 'localhost:5173' },
      { k: 'DATABASE_URL', v: 'dev db · 20 fake contacts' },
      { k: 'STRIPE_KEY', v: 'sk_test_… (play money)' },
      { k: 'EMAIL_MODE', v: 'catch-all fake inbox' },
    ],
    email: { tone: 'good', text: 'Landed in a fake inbox on the laptop. Nobody was bothered. This is what dev is for.' },
  },
  staging: {
    emoji: '🧪',
    name: 'Staging',
    who: 'A full copy of production for final checks. The team and testers use it.',
    vars: [
      { k: 'APP_URL', v: 'staging.acme-crm.app' },
      { k: 'DATABASE_URL', v: 'staging db · realistic fake data' },
      { k: 'STRIPE_KEY', v: 'sk_test_… (play money)' },
      { k: 'EMAIL_MODE', v: 'team addresses only' },
    ],
    email: { tone: 'warn', text: 'Went to the 6 people on the team. Mildly embarrassing, completely harmless.' },
  },
  prod: {
    emoji: '🌍',
    name: 'Production',
    who: 'The real thing. Real customers, real data, real money.',
    vars: [
      { k: 'APP_URL', v: 'acme-crm.app' },
      { k: 'DATABASE_URL', v: 'prod db · 1,240 real customers' },
      { k: 'STRIPE_KEY', v: 'sk_live_… (REAL money)' },
      { k: 'EMAIL_MODE', v: 'real delivery' },
    ],
    email: {
      tone: 'bad',
      text: '1,240 paying customers just got an email saying “test test pls ignore”. Same code, same button — the environment decided the consequences.',
    },
  },
}

/** Same code, three environments. Press the same button in each. */
export function EnvSwitcher({ onDone }: { onDone?: () => void }) {
  const [env, setEnv] = useState<EnvId>('dev')
  const [tried, setTried] = useState<Set<EnvId>>(new Set())
  const fired = useRef(false)
  const e = ENVS[env]

  function send() {
    const next = new Set(tried).add(env)
    setTried(next)
    if (!fired.current && next.size === 3) {
      fired.current = true
      onDone?.()
    }
  }

  return (
    <div className="stack">
      <div className="grid3" role="tablist" aria-label="Environment">
        {(Object.keys(ENVS) as EnvId[]).map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={env === id}
            className={`chip ${env === id ? 'on' : ''}`}
            onClick={() => setEnv(id)}
            style={{ textAlign: 'center', padding: '8px 4px' }}
          >
            <div aria-hidden="true">{ENVS[id].emoji}</div>
            <div className="tiny" style={{ fontWeight: 650 }}>
              {ENVS[id].name} {tried.has(id) ? '✓' : ''}
            </div>
          </button>
        ))}
      </div>

      <div className="card tight flat stack sm" style={env === 'prod' ? { borderColor: 'var(--bad)' } : undefined} role="tabpanel">
        <p className="small">{e.who}</p>
        <div className="code" style={{ fontSize: 12 }}>
          <span className="muted">{'// the code — identical everywhere\n'}</span>
          {'db = connect(env.DATABASE_URL)\n'}
          {'pay = stripe(env.STRIPE_KEY)'}
        </div>
        <div className="kicker">Environment variables here</div>
        <div className="stack" style={{ gap: 4 }}>
          {e.vars.map((v) => (
            <div key={v.k} className="small" style={{ overflowWrap: 'anywhere' }}>
              <span className="mono" style={{ fontWeight: 650 }}>
                {v.k}
              </span>{' '}
              = <span className={env === 'prod' ? 'bad-text' : 'ink2'}>{v.v}</span>
            </div>
          ))}
        </div>
      </div>

      <button type="button" className={`btn ${env === 'prod' ? 'danger' : ''}`} onClick={send}>
        📧 Send “test test pls ignore” to all users
      </button>

      {tried.has(env) && (
        <div className={`callout ${e.email.tone} small pop`} key={env}>
          {e.email.text}
        </div>
      )}
      <p className="tiny muted">Press the button in all three environments.</p>
    </div>
  )
}

interface CodeLine {
  id: string
  text: string
  fixed?: string
  secret?: string
  ok?: string
}

const CODE: CodeLine[] = [
  { id: 'a', text: "import Stripe from 'stripe'", ok: 'Loading a library. Nothing secret.' },
  { id: 'b', text: 'const TAX_RATE = 0.08', ok: 'A business setting, not a secret. Fine in code.' },
  {
    id: 'c',
    text: 'const stripe = Stripe("sk_live_51Hx9…Qa")',
    fixed: 'const stripe = Stripe(env.STRIPE_SECRET_KEY)',
    secret: 'A LIVE payments secret key. With it, anyone can issue refunds, read customers and move money through your account.',
  },
  {
    id: 'd',
    text: 'const PUBLIC_KEY = "pk_live_8Rw…" // for the browser',
    ok: 'Trick question: “pk_” publishable keys are designed to be public. They go to every visitor’s browser anyway. Knowing which keys are which matters.',
  },
  {
    id: 'e',
    text: 'const db = connect("postgres://admin:Tr0ub4dor@db.acme.io/prod")',
    fixed: 'const db = connect(env.DATABASE_URL)',
    secret: 'The production database password, inside the address. Whoever reads this line can read — or delete — every customer’s data.',
  },
  { id: 'f', text: 'const SUPPORT = "help@acme.co"', ok: 'A public email address. Not a secret.' },
]

const SECRETS = CODE.filter((c) => c.secret).length

/** Spot the secrets committed to code, move them out, then deal with Git history. */
export function SecretHunt({ onDone }: { onDone?: () => void }) {
  const [tapped, setTapped] = useState<Set<string>>(new Set())
  const [last, setLast] = useState<CodeLine | null>(null)
  const [moved, setMoved] = useState(false)
  const [answer, setAnswer] = useState<'ignore' | 'rotate' | null>(null)
  const fired = useRef(false)
  const found = CODE.filter((c) => c.secret && tapped.has(c.id)).length

  return (
    <div className="stack">
      <div className="row between">
        <span className="kicker">📄 payments.ts — tap anything secret</span>
        <span className={`pill ${found === SECRETS ? 'good-text' : ''}`}>
          {found}/{SECRETS} found
        </span>
      </div>
      <div className="card tight flat" style={{ padding: 6 }}>
        {CODE.map((c) => {
          const t = tapped.has(c.id)
          return (
            <button
              key={c.id}
              type="button"
              aria-pressed={t}
              disabled={moved}
              onClick={() => {
                setTapped(new Set(tapped).add(c.id))
                setLast(c)
              }}
              className="mono"
              style={{
                display: 'flex',
                gap: 6,
                width: '100%',
                minHeight: 44,
                alignItems: 'center',
                padding: '4px 6px',
                border: 0,
                borderRadius: 8,
                fontSize: 12,
                textAlign: 'left',
                overflowWrap: 'anywhere',
                cursor: moved ? 'default' : 'pointer',
                background: moved && c.fixed ? 'var(--good-soft)' : t ? (c.secret ? 'var(--bad-soft)' : 'var(--surface-2)') : 'transparent',
                opacity: 1,
              }}
            >
              <span className="grow">{moved && c.fixed ? c.fixed : c.text}</span>
              {t && !moved && <span aria-hidden="true">{c.secret ? '🔑' : '👌'}</span>}
            </button>
          )
        })}
      </div>

      {last && !moved && (
        <div className={`callout ${last.secret ? 'bad' : 'info'} small pop`} key={last.id} aria-live="polite">
          {last.secret ?? last.ok}
        </div>
      )}

      {found === SECRETS && !moved && (
        <button type="button" className="btn primary pop" onClick={() => setMoved(true)}>
          🔐 Move secrets into environment variables
        </button>
      )}

      {moved && (
        <div className="stack sm pop">
          <div className="callout good small">
            The code now just says <span className="mono">env.STRIPE_SECRET_KEY</span>. The real values live in the hosting
            platform’s secret settings — different per environment, never in Git.
          </div>
          <div className="kicker">But that old commit is still in Git history. Now what?</div>
          <button
            type="button"
            className={`chip ${answer === 'ignore' ? 'bad' : ''}`}
            onClick={() => setAnswer('ignore')}
          >
            Nothing — it’s removed from the code now
          </button>
          <button
            type="button"
            className={`chip ${answer === 'rotate' ? 'good' : ''}`}
            onClick={() => {
              setAnswer('rotate')
              if (!fired.current) {
                fired.current = true
                onDone?.()
              }
            }}
          >
            Rotate: create new keys and cancel the old ones
          </button>
          {answer === 'ignore' && (
            <div className="callout bad small">
              Git remembers every version. Anyone with a copy of the repo — or a bot scanning GitHub — can still find the old
              key. Removing it from today’s code doesn’t un-leak it.
            </div>
          )}
          {answer === 'rotate' && (
            <div className="callout good small">
              Right. Treat a committed secret as leaked: issue new keys, revoke the old ones, change the database password.
              Then the old values in history are worthless.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
