import { useEffect, useRef, useState } from 'react'
import { wait } from '../lib/motion'

/* A founder's security checkup: MFA on key accounts, who has access, and
   outdated dependencies. Then simulate a realistic attack and see which doors hold. */

const ACCOUNTS = [
  { id: 'email', emoji: '📧', label: 'Company email' },
  { id: 'cloud', emoji: '☁️', label: 'Cloud hosting' },
  { id: 'github', emoji: '🐙', label: 'GitHub' },
  { id: 'domain', emoji: '🌐', label: 'Domain registrar' },
  { id: 'payments', emoji: '💳', label: 'Payments dashboard' },
]

const PEOPLE = [
  { id: 'jordan', who: 'Jordan · contractor, left in March', bad: 'Admin', good: 'Removed', action: 'Remove access' },
  { id: 'sam', who: 'Sam · support', bad: 'Admin', good: 'Support (read-only)', action: 'Downgrade' },
]

const DEPS = [
  { id: 'img', name: 'image-resizer', from: '2.1.0', to: '2.1.4', note: 'known critical flaw' },
  { id: 'pdf', name: 'pdf-maker', from: '4.0.2', to: '4.0.9', note: 'known flaw, fix released' },
]

interface Door {
  label: string
  open: boolean
  how: string
}

export function SecurityCheckup({ onDone }: { onDone?: () => void }) {
  const alive = useRef(true)
  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])
  const [mfa, setMfa] = useState<Record<string, boolean>>({ email: true })
  const [people, setPeople] = useState<Record<string, boolean>>({})
  const [deps, setDeps] = useState<Record<string, 'old' | 'updating' | 'new'>>({})
  const [doors, setDoors] = useState<Door[] | null>(null)
  const [running, setRunning] = useState(false)
  const fired = useRef(false)

  const total = ACCOUNTS.length + PEOPLE.length + DEPS.length
  const fixed =
    ACCOUNTS.filter((a) => mfa[a.id]).length + PEOPLE.filter((p) => people[p.id]).length + DEPS.filter((d) => deps[d.id] === 'new').length

  async function update(id: string) {
    setDeps((d) => ({ ...d, [id]: 'updating' }))
    await wait(900)
    if (!alive.current) return
    setDeps((d) => ({ ...d, [id]: 'new' }))
  }

  async function attack() {
    setRunning(true)
    setDoors([])
    const plan: Door[] = [
      ...ACCOUNTS.map((a) => ({
        label: `${a.emoji} ${a.label}`,
        open: !mfa[a.id],
        how: mfa[a.id] ? 'Phished password works… but no 2FA code. Blocked.' : 'Phished password works. No 2FA. They’re in.',
      })),
      ...PEOPLE.map((p) => ({
        label: `👤 ${p.who.split(' · ')[0]}`,
        open: !people[p.id],
        how: people[p.id]
          ? 'Their old login no longer has admin powers.'
          : p.id === 'jordan'
            ? 'Jordan’s old laptop was stolen — still logged in as Admin.'
            : 'Sam clicked a phishing link. Sam had Admin, so the attacker does too.',
      })),
      ...DEPS.map((d) => ({
        label: `📦 ${d.name}`,
        open: deps[d.id] !== 'new',
        how: deps[d.id] === 'new' ? 'Patched — the known flaw is gone.' : 'Automated scanner finds the publicly known flaw within hours.',
      })),
    ]
    for (const door of plan) {
      await wait(300)
      if (!alive.current) return
      setDoors((d) => [...(d ?? []), door])
    }
    setRunning(false)
    if (plan.every((d) => !d.open) && !fired.current) {
      fired.current = true
      onDone?.()
    }
  }

  const openDoors = doors?.filter((d) => d.open).length ?? 0

  return (
    <div className="stack">
      <div className="stack sm">
        <div className="row between">
          <span className="kicker">Security checkup</span>
          <span className="small mono">
            {fixed}/{total} fixed
          </span>
        </div>
        <div className="meter">
          <span style={{ width: `${(fixed / total) * 100}%`, background: fixed === total ? 'var(--good)' : 'var(--warn)' }} />
        </div>
      </div>

      <section className="card tight flat stack sm" aria-label="Two-factor authentication">
        <div style={{ fontWeight: 700 }}>1 · Two-factor (MFA) on the accounts that run your company</div>
        {ACCOUNTS.map((a) => (
          <div key={a.id} className="row nowrap between">
            <span className="small">
              {a.emoji} {a.label}
            </span>
            <span className="row nowrap" style={{ gap: 8 }}>
              <span className={`tiny ${mfa[a.id] ? 'good-text' : 'bad-text'}`}>{mfa[a.id] ? '2FA on' : 'password only'}</span>
              <button
                type="button"
                role="switch"
                className="switch"
                aria-checked={!!mfa[a.id]}
                aria-label={`2FA for ${a.label}`}
                disabled={running}
                onClick={() => setMfa((m) => ({ ...m, [a.id]: !m[a.id] }))}
              />
            </span>
          </div>
        ))}
      </section>

      <section className="card tight flat stack sm" aria-label="Who has access">
        <div style={{ fontWeight: 700 }}>2 · Who has admin access?</div>
        <div className="row nowrap between small">
          <span>👩‍💻 You · founder</span>
          <span className="pill">Owner</span>
        </div>
        {PEOPLE.map((p) => (
          <div key={p.id} className="stack sm">
            <div className="row nowrap between small">
              <span className="grow">👤 {p.who}</span>
              <span className="pill" style={{ color: people[p.id] ? 'var(--good)' : 'var(--bad)' }}>
                {people[p.id] ? p.good : p.bad}
              </span>
            </div>
            {!people[p.id] && (
              <button type="button" className="btn small" disabled={running} onClick={() => setPeople((x) => ({ ...x, [p.id]: true }))}>
                {p.action}
              </button>
            )}
          </div>
        ))}
      </section>

      <section className="card tight flat stack sm" aria-label="Dependencies">
        <div style={{ fontWeight: 700 }}>3 · Outdated packages (dependencies)</div>
        {DEPS.map((d) => (
          <div key={d.id} className="row nowrap between">
            <span className="small grow">
              📦 <span className="mono">{d.name}</span> {deps[d.id] === 'new' ? d.to : d.from}
              <span className={`tiny ${deps[d.id] === 'new' ? 'good-text' : 'bad-text'}`} style={{ display: 'block' }}>
                {deps[d.id] === 'new' ? 'updated · tests passed ✓' : d.note}
              </span>
            </span>
            <button type="button" className="btn small" disabled={deps[d.id] !== undefined || running} onClick={() => void update(d.id)}>
              {deps[d.id] === 'updating' ? 'Testing…' : deps[d.id] === 'new' ? '✓' : `Update → ${d.to}`}
            </button>
          </div>
        ))}
      </section>

      <button type="button" className="btn danger block" disabled={running} onClick={() => void attack()}>
        🎣 Simulate a phishing campaign + scan
      </button>

      {doors && (
        <div className="stack sm" aria-live="polite">
          {doors.map((d, i) => (
            <div key={i} className={`node ${d.open ? 'fail' : 'ok'} pop`} style={{ minHeight: 0, alignItems: 'flex-start' }}>
              <span className="grow">
                <span style={{ display: 'block' }}>
                  {d.open ? '🚪 OPEN' : '🔒 held'} · {d.label}
                </span>
                <span className="tiny" style={{ display: 'block', fontWeight: 500 }}>
                  {d.how}
                </span>
              </span>
            </div>
          ))}
          {!running && (
            <div className={`callout ${openDoors ? 'bad' : 'good'} pop`}>
              {openDoors
                ? `${openDoors} door${openDoors === 1 ? '' : 's'} open. An attacker only needs one. Fix them and run it again.`
                : 'Every door held. None of this needed a security team — just habits.'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
