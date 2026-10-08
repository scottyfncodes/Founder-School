import { useRef, useState } from 'react'
import { money, num } from '../lib/util'

interface Inputs {
  users: number
  mb: number
  emails: number
  ai: number
}

interface BillLine {
  id: string
  emoji: string
  label: string
  cost: number
  what: string
  grows: string
}

/** Slider position 0–100 → 100 … 1,000,000 users (log scale). */
const toUsers = (p: number) => {
  const raw = 10 ** (2 + (p / 100) * 4)
  const mag = 10 ** (Math.floor(Math.log10(raw)) - 1)
  return Math.round(raw / mag) * mag
}
const fromUsers = (u: number) => ((Math.log10(u) - 2) / 4) * 100

function bill({ users, mb, emails, ai }: Inputs): BillLine[] {
  const storageGb = (users * mb) / 1000
  const bandwidthGb = users * 0.05 + storageGb * 0.4
  const emailCount = users * emails
  const dbTier = users < 5_000 ? 25 : users < 50_000 ? 120 : users < 300_000 ? 450 : 1_600
  return [
    {
      id: 'compute',
      emoji: '🖥️',
      label: 'Compute (servers)',
      cost: Math.max(20, Math.ceil(users / 8_000) * 45),
      what: 'The computers running your backend code, rented by the hour or by the request.',
      grows: 'More users making more requests → more or bigger servers.',
    },
    {
      id: 'db',
      emoji: '🗄️',
      label: 'Database',
      cost: dbTier,
      what: 'A managed database: storage, memory, backups and someone else keeping it running.',
      grows: 'Jumps in steps. When you outgrow a plan, the next one can cost 4× more.',
    },
    {
      id: 'storage',
      emoji: '🗂️',
      label: 'File storage',
      cost: storageGb * 0.023,
      what: 'Uploaded files — photos, PDFs, documents — kept in a storage bucket.',
      grows: 'Total gigabytes stored. Cheap per GB, but it never shrinks unless you delete things.',
    },
    {
      id: 'bandwidth',
      emoji: '📡',
      label: 'Bandwidth',
      cost: Math.max(0, bandwidthGb - 100) * 0.08,
      what: 'Data sent out of the cloud to users: pages, images, file downloads.',
      grows: 'Big files viewed often. A CDN and smaller images cut it sharply.',
    },
    {
      id: 'email',
      emoji: '📧',
      label: 'Email provider',
      cost: Math.max(0, emailCount - 3_000) * 0.0008,
      what: 'A third-party service that actually delivers your app’s emails.',
      grows: 'Number of emails sent. Free tier first, then per thousand.',
    },
    {
      id: 'ai',
      emoji: '🤖',
      label: 'AI API calls',
      cost: users * ai * 0.004,
      what: 'Paying an AI provider each time a feature calls a model (summaries, chat, drafting).',
      grows: 'Usage × price per call. Often the line that surprises founders most.',
    },
    {
      id: 'auth',
      emoji: '🔑',
      label: 'Auth provider',
      cost: Math.max(0, users - 10_000) * 0.02,
      what: 'The login service: passwords, 2FA, “Sign in with Google”.',
      grows: 'Free up to a number of monthly users, then a few cents per user.',
    },
    {
      id: 'tools',
      emoji: '📊',
      label: 'Monitoring & tools',
      cost: users < 10_000 ? 30 : 180,
      what: 'Error tracking, logs, uptime checks — the dashboards that tell you what’s broken.',
      grows: 'Mostly flat, stepping up with plan size and log volume.',
    },
  ]
}

const PRESETS: { label: string; v: Inputs }[] = [
  { label: '🌱 Launch', v: { users: 500, mb: 20, emails: 4, ai: 0 } },
  { label: '📈 Growing', v: { users: 20_000, mb: 50, emails: 6, ai: 10 } },
  { label: '🦄 Big', v: { users: 500_000, mb: 80, emails: 8, ai: 20 } },
]

/** Drag the usage sliders; watch each line of the cloud bill — and tap a line to see what it is. */
export function CloudBill({ onDone }: { onDone?: () => void }) {
  const [inp, setInp] = useState<Inputs>(PRESETS[0].v)
  const [moved, setMoved] = useState<Set<string>>(new Set())
  const [open, setOpen] = useState<string | null>(null)
  const [seen, setSeen] = useState<Set<string>>(new Set())
  const fired = useRef(false)

  const lines = bill(inp)
  const total = lines.reduce((s, l) => s + l.cost, 0)
  const max = Math.max(...lines.map((l) => l.cost), 1)
  const biggest = lines.reduce((a, b) => (b.cost > a.cost ? b : a))

  function check(m: Set<string>, s: Set<string>) {
    if (!fired.current && m.size >= 2 && s.size >= 3) {
      fired.current = true
      onDone?.()
    }
  }

  function set<K extends keyof Inputs>(k: K, v: number) {
    setInp((x) => ({ ...x, [k]: v }))
    const m = new Set(moved).add(k)
    setMoved(m)
    check(m, seen)
  }

  function tapLine(id: string) {
    setOpen(open === id ? null : id)
    const s = new Set(seen).add(id)
    setSeen(s)
    check(moved, s)
  }

  const sliders: { k: keyof Inputs; label: string; min: number; max: number; step: number; fmt: (n: number) => string }[] = [
    { k: 'mb', label: 'Files per user', min: 0, max: 500, step: 10, fmt: (n) => `${n} MB` },
    { k: 'emails', label: 'Emails per user / month', min: 0, max: 30, step: 1, fmt: (n) => `${n}` },
    { k: 'ai', label: 'AI calls per user / month', min: 0, max: 100, step: 5, fmt: (n) => `${n}` },
  ]

  return (
    <div className="stack">
      <div className="row" role="group" aria-label="Presets">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            className="chip"
            onClick={() => {
              setInp(p.v)
              const m = new Set(moved).add('preset')
              setMoved(m)
              check(m, seen)
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="stack sm">
        <label className="stack" style={{ gap: 0 }}>
          <span className="row between small">
            <b>Monthly active users</b>
            <span className="mono">{num(inp.users)}</span>
          </span>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={fromUsers(inp.users)}
            onChange={(e) => set('users', toUsers(Number(e.target.value)))}
          />
        </label>
        {sliders.map((s) => (
          <label key={s.k} className="stack" style={{ gap: 0 }}>
            <span className="row between small">
              <span>{s.label}</span>
              <span className="mono">{s.fmt(inp[s.k])}</span>
            </span>
            <input
              type="range"
              min={s.min}
              max={s.max}
              step={s.step}
              value={inp[s.k]}
              onChange={(e) => set(s.k, Number(e.target.value))}
            />
          </label>
        ))}
      </div>

      <div className="grid2">
        <div className="stat">
          <span className="v">{money(total)}</span>
          <span className="l">per month</span>
        </div>
        <div className="stat">
          <span className="v">${(total / inp.users).toFixed(total / inp.users < 0.1 ? 3 : 2)}</span>
          <span className="l">per user / month</span>
        </div>
      </div>

      <div className="stack sm">
        <span className="kicker">Your bill — tap a line</span>
        {lines.map((l) => (
          <div key={l.id}>
            <button
              type="button"
              className="chip"
              aria-expanded={open === l.id}
              onClick={() => tapLine(l.id)}
              style={{ width: '100%', padding: '8px 10px', borderColor: l.id === biggest.id && total > 0 ? 'var(--warn)' : undefined }}
            >
              <span className="row nowrap between small">
                <span>
                  {l.emoji} {l.label} {seen.has(l.id) ? '✓' : ''}
                </span>
                <b className="mono">{money(l.cost)}</b>
              </span>
              <span className="meter" style={{ display: 'block', height: 6, marginTop: 6 }}>
                <span style={{ width: `${(l.cost / max) * 100}%`, background: l.id === biggest.id ? 'var(--warn)' : undefined }} />
              </span>
            </button>
            {open === l.id && (
              <div className="well small stack sm pop" style={{ marginTop: 6 }}>
                <span>{l.what}</span>
                <span className="muted">
                  <b>Grows with:</b> {l.grows}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="callout info small">
        Biggest line right now: <b>{biggest.label}</b>. Watch how it changes as you move the sliders — most bills are
        dominated by one or two lines.
      </div>
      <p className="tiny muted">
        Move at least two sliders (or presets) and open three bill lines. Numbers are realistic ballparks, not quotes.
      </p>
    </div>
  )
}
