import { useState } from 'react'
import { money, num } from '../lib/util'

/* ------------------------------------------------------------------ */
/* MrrBuilder — add customers & payments, watch MRR / ARR / ARPU       */
/* ------------------------------------------------------------------ */

interface Item {
  id: string
  label: string
  emoji: string
  customers: number
  mrr: number
  cash: number
  explain: string
}

const ITEMS: Item[] = [
  { id: 'basic', emoji: '🙂', label: 'Basic · $10/mo', customers: 1, mrr: 10, cash: 10, explain: 'A monthly subscriber adds exactly their monthly price to MRR.' },
  { id: 'pro', emoji: '💼', label: 'Pro · $50/mo', customers: 1, mrr: 50, cash: 50, explain: 'A pricier plan raises MRR faster — and pulls ARPU (average revenue per customer) up.' },
  { id: 'team', emoji: '🏢', label: 'Team · $200/mo', customers: 1, mrr: 200, cash: 200, explain: 'One Team customer is worth 20 Basic customers in MRR.' },
  {
    id: 'annual',
    emoji: '📅',
    label: 'Annual · $1,200/yr upfront',
    customers: 1,
    mrr: 100,
    cash: 1200,
    explain: 'You collect $1,200 today, but MRR only rises by $100 — the yearly price spread over 12 months. Cash ≠ MRR.',
  },
  {
    id: 'setup',
    emoji: '🧾',
    label: 'One-time $500 setup fee',
    customers: 0,
    mrr: 0,
    cash: 500,
    explain: 'Nice cash, but it won’t repeat next month, so it adds $0 to MRR. MRR only counts recurring money.',
  },
]

export function MrrBuilder({ onDone }: { onDone?: () => void }) {
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [last, setLast] = useState<Item | null>(null)
  const [tried, setTried] = useState<Set<string>>(new Set())

  const customers = ITEMS.reduce((s, it) => s + (counts[it.id] ?? 0) * it.customers, 0)
  const mrr = ITEMS.reduce((s, it) => s + (counts[it.id] ?? 0) * it.mrr, 0)
  const cash = ITEMS.reduce((s, it) => s + (counts[it.id] ?? 0) * it.cash, 0)
  const arpu = customers ? mrr / customers : 0

  function add(it: Item) {
    setCounts((c) => ({ ...c, [it.id]: (c[it.id] ?? 0) + 1 }))
    setLast(it)
    const next = new Set(tried).add(it.id)
    setTried(next)
    if (next.size >= 4 && tried.size < 4) onDone?.()
  }

  return (
    <div className="stack">
      <div className="grid2">
        <div className="stat">
          <span className="v">{money(mrr)}</span>
          <span className="l">MRR · monthly recurring revenue</span>
        </div>
        <div className="stat">
          <span className="v">{money(mrr * 12)}</span>
          <span className="l">ARR · MRR × 12</span>
        </div>
        <div className="stat">
          <span className="v">{customers ? `$${arpu.toFixed(2)}` : '—'}</span>
          <span className="l">ARPU · MRR ÷ customers ({num(customers)})</span>
        </div>
        <div className="stat">
          <span className="v">{money(cash)}</span>
          <span className="l">Cash collected this month</span>
        </div>
      </div>
      <div className="stack sm">
        <div className="kicker">Add to your business ({tried.size}/5 kinds tried)</div>
        {ITEMS.map((it) => (
          <button key={it.id} type="button" className="chip row between nowrap" onClick={() => add(it)} style={{ display: 'flex' }}>
            <span>
              {it.emoji} {it.label}
            </span>
            <span className="pill">×{counts[it.id] ?? 0}</span>
          </button>
        ))}
      </div>
      <div aria-live="polite">
        {last && (
          <div className={`callout ${last.mrr === 0 || last.cash !== last.mrr ? 'warn' : 'info'} pop`} key={`${last.id}-${counts[last.id]}`}>
            <b>
              +{money(last.mrr)} MRR, +{money(last.cash)} cash.
            </b>{' '}
            {last.explain}
          </div>
        )}
      </div>
      {mrr + cash > 0 && (
        <button
          type="button"
          className="btn ghost small"
          onClick={() => {
            setCounts({})
            setLast(null)
          }}
        >
          ↺ Start over
        </button>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* RevenueCompare — same MRR, two very different businesses            */
/* ------------------------------------------------------------------ */

interface Test {
  id: string
  label: string
  emoji: string
  a: { head: string; text: string; tone: 'good' | 'bad' | 'warn' }
  b: { head: string; text: string; tone: 'good' | 'bad' | 'warn' }
  lesson: string
}

const TESTS: Test[] = [
  {
    id: 'biggest',
    emoji: '🚪',
    label: 'Your biggest customer leaves',
    a: { head: '−$10 MRR (−0.1%)', text: 'Nobody notices. No customer is more than 0.1% of revenue.', tone: 'good' },
    b: { head: '−$1,000 MRR (−10%)', text: 'A tenth of the company walks out in one email. That’s concentration risk.', tone: 'bad' },
    lesson: 'Concentration risk: the fewer customers you have, the more each one can hurt you.',
  },
  {
    id: 'support',
    emoji: '🎧',
    label: 'A month of support',
    a: { head: '~250 tickets', text: 'Lots of small “how do I…?” questions. You need help docs and automation, fast.', tone: 'warn' },
    b: { head: '~15 tickets', text: 'Few tickets — but each one expects a reply within hours and a named person.', tone: 'warn' },
    lesson: 'Many small customers = volume. Few big ones = high expectations per customer.',
  },
  {
    id: 'sale',
    emoji: '🤝',
    label: 'Win one more customer',
    a: { head: 'Minutes, +$10', text: 'They sign up and pay by card on their own. Growth comes from marketing, not meetings.', tone: 'good' },
    b: { head: '1–3 months, +$1,000', text: 'Demos, a security questionnaire, a contract, procurement. You need a sales motion.', tone: 'warn' },
    lesson: 'The price decides the sales motion: self-serve vs. sales-led.',
  },
  {
    id: 'churn',
    emoji: '📉',
    label: 'A normal 5% churn month',
    a: { head: '−50 customers, −$500', text: 'Smooth and predictable. You can forecast it almost to the dollar.', tone: 'warn' },
    b: { head: '−$0 or −$1,000+', text: '5% of 10 is half a customer — so really you lose one or none. Revenue is lumpy and hard to forecast.', tone: 'bad' },
    lesson: 'With few customers, churn arrives in big, unpredictable chunks.',
  },
]

export function RevenueCompare({ onDone }: { onDone?: () => void }) {
  const [run, setRun] = useState<Set<string>>(new Set())
  const [cur, setCur] = useState<Test | null>(null)

  function go(t: Test) {
    setCur(t)
    const next = new Set(run).add(t.id)
    setRun(next)
    if (next.size === TESTS.length && run.size < TESTS.length) onDone?.()
  }

  const biz = [
    { id: 'a', emoji: '🐜', name: 'Many small', line: '1,000 customers × $10/mo' },
    { id: 'b', emoji: '🐘', name: 'Few big', line: '10 customers × $1,000/mo' },
  ] as const

  return (
    <div className="stack">
      <div className="grid2">
        {biz.map((b) => (
          <div key={b.id} className="card tight flat stack sm">
            <div style={{ fontSize: 26, lineHeight: 1 }} aria-hidden="true">
              {b.emoji}
            </div>
            <div style={{ fontWeight: 700 }}>{b.name}</div>
            <div className="tiny muted">{b.line}</div>
            <div className="pill" style={{ alignSelf: 'flex-start' }}>
              MRR $10,000
            </div>
            {cur && (
              <div className={`callout ${cur[b.id].tone} pop small`} key={cur.id}>
                <b>{cur[b.id].head}</b>
                <div className="tiny" style={{ marginTop: 4 }}>
                  {cur[b.id].text}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="stack sm">
        <div className="kicker">Stress-test both ({run.size}/{TESTS.length})</div>
        {TESTS.map((t) => (
          <button
            key={t.id}
            type="button"
            className="chip"
            aria-pressed={cur?.id === t.id}
            onClick={() => go(t)}
          >
            {t.emoji} {t.label} {run.has(t.id) && <span className="muted">✓</span>}
          </button>
        ))}
      </div>
      <div aria-live="polite">
        {cur && (
          <div className="callout info pop" key={cur.id}>
            {cur.lesson}
          </div>
        )}
      </div>
    </div>
  )
}
