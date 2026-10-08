import { useState } from 'react'
import { money, num } from '../lib/util'
import { BizLineChart } from './BizLineChart'
import { BizSlider } from './BizSlider'

/* ------------------------------------------------------------------ */
/* FunnelSim — visitors → signups → activated → paid                   */
/* ------------------------------------------------------------------ */

const VISITORS = 10000
const PRICE = 49

type Rates = { signup: number; activate: number; pay: number }

function funnel(r: Rates) {
  const signups = VISITORS * r.signup
  const activated = signups * r.activate
  const paid = activated * r.pay
  return { signups, activated, paid }
}

const STEPS: { key: keyof Rates; label: string; from: string; to: string; max: number; min: number; tip: string }[] = [
  { key: 'signup', label: 'Visitor → signup', from: 'visitors', to: 'signups', min: 1, max: 20, tip: 'Clearer landing page, a free trial, fewer form fields.' },
  { key: 'activate', label: 'Signup → activated', from: 'signups', to: 'activated', min: 10, max: 90, tip: '“Activated” = did the key thing (booked a first appointment). Better onboarding moves this.' },
  { key: 'pay', label: 'Activated → paid', from: 'activated', to: 'paid', min: 5, max: 60, tip: 'Pricing page, trial length, a reminder before the trial ends.' },
]

export function FunnelSim({ onDone }: { onDone?: () => void }) {
  const [r, setR] = useState<Rates>({ signup: 0.04, activate: 0.3, pay: 0.2 })
  const [moved, setMoved] = useState<Set<string>>(new Set())
  const f = funnel(r)

  function set(k: keyof Rates, pctVal: number) {
    setR((p) => ({ ...p, [k]: pctVal / 100 }))
    const next = new Set(moved).add(k)
    setMoved(next)
    if (next.size === 3 && moved.size < 3) onDone?.()
  }

  // Which single +5-point improvement adds the most paying customers?
  const gains = STEPS.map((s) => {
    const bumped = { ...r, [s.key]: Math.min(1, r[s.key] + 0.05) }
    return { s, extra: funnel(bumped).paid - f.paid }
  }).sort((a, b) => b.extra - a.extra)

  const rows = [
    { label: '👀 Visitors', n: VISITORS, share: 1 },
    { label: '✍️ Signed up', n: f.signups, share: f.signups / VISITORS },
    { label: '⚡ Activated', n: f.activated, share: f.activated / VISITORS },
    { label: '💳 Paying', n: f.paid, share: f.paid / VISITORS },
  ]

  return (
    <div className="stack">
      <div className="card tight flat stack sm" aria-label="Funnel">
        {rows.map((row, i) => (
          <div key={row.label} className="stack" style={{ gap: 2 }}>
            <div className="row between nowrap small">
              <span>{row.label}</span>
              <span className="mono">
                <b>{num(row.n)}</b>
                {i > 0 && <span className="muted"> · {(row.share * 100).toFixed(row.share < 0.01 ? 2 : 1)}%</span>}
              </span>
            </div>
            <div
              aria-hidden="true"
              style={{
                height: 16,
                width: `${Math.max(1.5, Math.sqrt(row.share) * 100)}%`,
                margin: '0 auto',
                borderRadius: 4,
                background: i === 3 ? 'var(--good)' : 'var(--info)',
                opacity: 1 - i * 0.12,
                transition: 'width .3s',
              }}
            />
          </div>
        ))}
        <p className="tiny muted">Bar widths are square-root scaled so the small stages stay visible.</p>
      </div>

      <div className="card tight flat stack sm">
        {STEPS.map((s) => (
          <BizSlider
            key={s.key}
            label={s.label}
            value={Math.round(r[s.key] * 100)}
            min={s.min}
            max={s.max}
            show={(v) => `${v}%`}
            onChange={(v) => set(s.key, v)}
            hint={s.tip}
          />
        ))}
      </div>

      <div className="grid2">
        <div className="stat">
          <span className="v">{num(f.paid)}</span>
          <span className="l">New paying customers / month</span>
        </div>
        <div className="stat">
          <span className="v">{money(Math.round(f.paid) * PRICE)}</span>
          <span className="l">New MRR / month (at ${PRICE})</span>
        </div>
      </div>
      <div className="callout info small" aria-live="polite">
        <b>Best next fix:</b> +5 points on “{gains[0].s.label}” adds ~{num(gains[0].extra)} paying customers a month
        {gains[2].extra > 0 ? `, vs. ~${num(gains[2].extra)} for “${gains[2].s.label}”` : ''}. Each step multiplies the next, so the
        weakest step is usually the cheapest win.
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* RetentionCurves — what a healthy cohort looks like                  */
/* ------------------------------------------------------------------ */

const SHAPES = [
  {
    id: 'leaky',
    label: '🪣 Leaky bucket',
    values: [100, 60, 42, 31, 24, 18, 14, 11, 8, 6, 5, 4, 3],
    tone: 'bad',
    text: 'Every month’s signups drain away to almost nothing. More marketing just pours water into a bucket with a hole. Fix the product first.',
  },
  {
    id: 'flat',
    label: '📏 Flattens out',
    values: [100, 65, 52, 46, 43, 41, 40, 39, 39, 38, 38, 38, 38],
    tone: 'good',
    text: 'Some people leave early, then the curve goes flat: ~38% stay for good. That flat line is product–market fit for that group — now growth compounds.',
  },
  {
    id: 'smile',
    label: '😊 Smile',
    values: [100, 80, 74, 72, 73, 75, 78, 82, 86, 90, 95, 100, 106],
    tone: 'good',
    text: 'Some customers leave, but those who stay upgrade and add seats. After a year the cohort pays more than when it started (>100% net revenue retention).',
  },
] as const

export function RetentionCurves({ onDone }: { onDone?: () => void }) {
  const [cur, setCur] = useState<(typeof SHAPES)[number]['id']>('leaky')
  const [seen, setSeen] = useState<Set<string>>(new Set(['leaky']))
  const shape = SHAPES.find((s) => s.id === cur)!

  function pick(id: (typeof SHAPES)[number]['id']) {
    setCur(id)
    const next = new Set(seen).add(id)
    setSeen(next)
    if (next.size === SHAPES.length && seen.size < SHAPES.length) onDone?.()
  }

  return (
    <div className="stack">
      <div className="row" role="group" aria-label="Retention curve shape" style={{ gap: 6 }}>
        {SHAPES.map((s) => (
          <button key={s.id} type="button" className="chip grow" aria-pressed={cur === s.id} onClick={() => pick(s.id)} style={{ textAlign: 'center' }}>
            {s.label}
          </button>
        ))}
      </div>
      <div className="card tight flat stack sm">
        <div className="kicker">January signups: revenue still coming in</div>
        <BizLineChart
          ariaLabel={`${shape.label} retention curve: after 12 months ${shape.values[12]}% of the starting revenue remains.`}
          xLabel="Months since signup"
          yLabel="Revenue kept (%)"
          xTicks={[0, 3, 6, 9, 12]}
          fmt={(v) => `${Math.round(v)}%`}
          yInclude={[0, 110]}
          series={[
            ...SHAPES.filter((s) => s.id !== cur).map((s) => ({ id: s.id, label: s.label, color: 'var(--muted)', values: [...s.values], faint: true })),
            { id: shape.id, label: shape.label, color: shape.tone === 'bad' ? 'var(--lv4)' : 'var(--info)', values: [...shape.values] },
          ]}
        />
      </div>
      <div className={`callout ${shape.tone} pop`} key={shape.id} aria-live="polite">
        <b>After 12 months: {shape.values[12]}%.</b> {shape.text}
      </div>
      <p className="tiny muted">{seen.size}/3 shapes explored. A “cohort” is everyone who signed up in the same month, followed over time.</p>
    </div>
  )
}
