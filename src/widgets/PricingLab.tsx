import { useState } from 'react'
import { money, num } from '../lib/util'
import { BizSlider } from './BizSlider'

/* ------------------------------------------------------------------ */
/* PricingLab — five price points for a fictional B2B scheduling tool  */
/* ------------------------------------------------------------------ */

interface PricePoint {
  price: number
  customers: number
  /** Support tickets per customer per month. */
  tickets: number
  /** High-touch cost per customer per month (onboarding calls, account manager). */
  touch: number
  churn: number
  expect: string
  who: string
}

export const TICKET_COST = 8
export const INFRA_PER_CUSTOMER = 3

/** A plausible demand curve: same marketing, different prices. */
export const PRICES: PricePoint[] = [
  { price: 9, customers: 1400, tickets: 0.5, touch: 0, churn: 0.09, expect: 'Self-serve help docs', who: 'Solo practitioners trying it out; many never fully set it up.' },
  { price: 29, customers: 700, tickets: 0.6, touch: 0, churn: 0.06, expect: 'Email reply within 48h', who: 'Small clinics who use it a few days a week.' },
  { price: 99, customers: 260, tickets: 0.8, touch: 0, churn: 0.035, expect: 'Email reply within 24h', who: 'Busy clinics that run their whole week on it.' },
  { price: 199, customers: 140, tickets: 1, touch: 10, churn: 0.025, expect: 'Priority chat + setup help', who: 'Multi-room clinics; scheduling is mission-critical.' },
  { price: 499, customers: 40, tickets: 1.5, touch: 40, churn: 0.02, expect: 'Named contact, onboarding calls, 4h response', who: 'Clinic groups who need contracts, invoices and a security review.' },
]

export function economics(p: PricePoint) {
  const revenue = p.price * p.customers
  const tickets = p.tickets * p.customers
  const support = tickets * TICKET_COST + p.touch * p.customers
  const infra = INFRA_PER_CUSTOMER * p.customers
  return { revenue, tickets, support, infra, profit: revenue - support - infra }
}

export function PricingLab({ onDone }: { onDone?: () => void }) {
  const [sel, setSel] = useState<number | null>(null)
  const [tried, setTried] = useState<Set<number>>(new Set())
  const p = PRICES.find((x) => x.price === sel)
  const e = p ? economics(p) : null
  const maxProfit = Math.max(...PRICES.map((x) => economics(x).profit))

  function pick(price: number) {
    setSel(price)
    const next = new Set(tried).add(price)
    setTried(next)
    if (next.size === 4 && tried.size < 4) onDone?.()
  }

  return (
    <div className="stack">
      <div className="well small ink2">
        🩺 <b>ClinicBook</b> (fictional) books appointments for small clinics. Same marketing budget every time — only the monthly price
        changes.
      </div>
      <div className="row" role="group" aria-label="Monthly price" style={{ gap: 6 }}>
        {PRICES.map((x) => (
          <button
            key={x.price}
            type="button"
            className="chip grow"
            aria-pressed={sel === x.price}
            onClick={() => pick(x.price)}
            style={{ textAlign: 'center', padding: '8px 2px', minWidth: 0 }}
          >
            ${x.price}
          </button>
        ))}
      </div>
      {!p && <p className="small muted center">Pick a price to see what happens. Try at least four.</p>}
      {p && e && (
        <div className="stack sm pop" key={p.price}>
          <div className="grid2">
            <div className="stat">
              <span className="v">{num(p.customers)}</span>
              <span className="l">Paying customers</span>
            </div>
            <div className="stat">
              <span className="v">{money(e.revenue)}</span>
              <span className="l">Revenue / month</span>
            </div>
            <div className="stat">
              <span className="v">{num(e.tickets)}</span>
              <span className="l">Support tickets / month</span>
            </div>
            <div className="stat">
              <span className="v">{money(e.support)}</span>
              <span className="l">Support cost / month</span>
            </div>
            <div className="stat">
              <span className="v">{money(e.infra)}</span>
              <span className="l">Infra cost (${INFRA_PER_CUSTOMER}/customer)</span>
            </div>
            <div className="stat">
              <span className={`v ${e.profit === maxProfit ? 'good-text' : ''}`}>{money(e.profit)}</span>
              <span className="l">Profit before team costs</span>
            </div>
          </div>
          <div className="card tight flat stack sm small">
            <div>
              <b>Who buys:</b> {p.who}
            </div>
            <div>
              <b>What they expect:</b> {p.expect}
            </div>
            <div>
              <b>Monthly churn:</b> {Math.round(p.churn * 1000) / 10}%
            </div>
          </div>
        </div>
      )}
      {tried.size > 0 && (
        <div className="card tight flat stack sm">
          <div className="kicker">Profit by price (tried so far)</div>
          {PRICES.map((x) => {
            const pr = economics(x).profit
            const seen = tried.has(x.price)
            return (
              <div key={x.price} className="row nowrap" style={{ gap: 8 }}>
                <span className="small mono" style={{ width: 40, flex: 'none' }}>
                  ${x.price}
                </span>
                <div className="grow meter" style={{ height: 14 }} aria-hidden="true">
                  <span
                    style={{
                      width: seen ? `${Math.max(2, (pr / maxProfit) * 100)}%` : '0%',
                      background: x.price === sel ? 'var(--accent)' : 'var(--info)',
                    }}
                  />
                </div>
                <span className="small mono" style={{ width: 56, flex: 'none', textAlign: 'right' }}>
                  {seen ? money(pr) : '?'}
                </span>
              </div>
            )
          })}
          <p className="tiny muted">
            Support = tickets × ${TICKET_COST} + high-touch help per customer. {tried.size}/5 prices tried.
          </p>
        </div>
      )}
      {tried.size >= 4 && (
        <div className="callout good pop">
          <b>The cheapest price made the least money.</b> At $9 you serve 35× more customers than at $499 — 12× the tickets — for a fraction
          of the profit. Higher prices attract fewer, more serious customers who churn less but expect more of you.
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* ValueCalc — price from the value you create, not the cost to build  */
/* ------------------------------------------------------------------ */

export function ValueCalc({ onDone }: { onDone?: () => void }) {
  const [hours, setHours] = useState(6)
  const [rate, setRate] = useState(30)
  const [price, setPrice] = useState(99)
  const [moved, setMoved] = useState<Set<string>>(new Set())

  function touch(k: string) {
    const next = new Set(moved).add(k)
    setMoved(next)
    if (next.size === 3 && moved.size < 3) onDone?.()
  }

  // 52 weeks / 12 months ≈ 4.33 weeks per month
  const value = hours * rate * (52 / 12)
  const share = price / value
  const verdict =
    share < 0.05
      ? { tone: 'warn', text: 'An easy yes — but you’re leaving a lot of money on the table.' }
      : share <= 0.25
        ? { tone: 'good', text: 'A no-brainer for the customer and healthy for you. A common target is roughly 10–25% of the value created.' }
        : share <= 0.6
          ? { tone: 'warn', text: 'Still worth it on paper, but buyers will hesitate and compare alternatives.' }
          : { tone: 'bad', text: 'The price is close to (or above) the value. Expect a hard sell and high churn.' }

  return (
    <div className="stack">
      <div className="card tight flat stack sm">
        <BizSlider
          label="⏱️ Staff hours saved per week"
          value={hours}
          min={1}
          max={20}
          show={(v) => `${v} h`}
          onChange={(v) => {
            setHours(v)
            touch('h')
          }}
        />
        <BizSlider
          label="👩‍⚕️ Cost of an hour of staff time"
          value={rate}
          min={15}
          max={80}
          show={(v) => `$${v}`}
          onChange={(v) => {
            setRate(v)
            touch('r')
          }}
        />
        <BizSlider
          label="🏷️ Your price"
          value={price}
          min={9}
          max={999}
          show={(v) => `$${v}/mo`}
          onChange={(v) => {
            setPrice(v)
            touch('p')
          }}
        />
      </div>
      <div className="grid2">
        <div className="stat">
          <span className="v">{money(value)}</span>
          <span className="l">Value created per clinic / month</span>
        </div>
        <div className="stat">
          <span className="v">{Math.round(share * 100)}%</span>
          <span className="l">Your price as a share of that value</span>
        </div>
      </div>
      <p className="tiny muted mono">
        Value = {hours} h × ${rate} × 4.33 weeks = {money(value)}/mo
      </p>
      <div aria-live="polite" className={`callout ${verdict.tone}`}>
        {verdict.text}
      </div>
      <div className="well small ink2">
        💡 Notice what’s <b>not</b> in this calculator: how long it took you to build. The customer never sees your costs — only their own
        time and money saved.
      </div>
    </div>
  )
}
