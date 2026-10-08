import { useState } from 'react'
import { money, num } from '../lib/util'
import { BizLineChart } from './BizLineChart'
import { BizSlider } from './BizSlider'

export interface SaasInputs {
  price: number
  newPerMonth: number
  /** Monthly churn as a fraction, e.g. 0.08 */
  churn: number
  /** Infrastructure + support cost per customer per month. */
  infra: number
  cac: number
}

export const FIXED_COSTS = 6000
const MONTHS = 24

export function simulate(inp: SaasInputs) {
  let customers = 0
  let cumulative = 0
  const monthly: number[] = []
  const cum: number[] = []
  const custs: number[] = []
  for (let m = 1; m <= MONTHS; m++) {
    customers = customers * (1 - inp.churn) + inp.newPerMonth
    const revenue = customers * inp.price
    const profit = revenue - customers * inp.infra - inp.newPerMonth * inp.cac - FIXED_COSTS
    cumulative += profit
    monthly.push(Math.round(profit))
    cum.push(Math.round(cumulative))
    custs.push(customers)
  }
  return { monthly, cum, custs }
}

/** Unit economics: the standard simple formulas. */
export function unitEconomics(inp: SaasInputs) {
  const arpu = inp.price
  const margin = (inp.price - inp.infra) / inp.price
  const grossProfitPerCustomer = arpu * margin // = price - infra
  const ltv = (arpu * margin) / inp.churn
  const payback = grossProfitPerCustomer > 0 ? inp.cac / grossProfitPerCustomer : Infinity
  const ratio = inp.cac > 0 ? ltv / inp.cac : Infinity
  return { arpu, margin, ltv, payback, ratio }
}

const START: SaasInputs = { price: 29, newPerMonth: 40, churn: 0.08, infra: 6, cac: 400 }

export function SaasModel({ onDone }: { onDone?: () => void }) {
  const [inp, setInp] = useState<SaasInputs>(START)
  const [touched, setTouched] = useState<Set<string>>(new Set())

  function set<K extends keyof SaasInputs>(k: K, v: number) {
    setInp((p) => ({ ...p, [k]: v }))
    const next = new Set(touched).add(k)
    setTouched(next)
    if (next.size === 3 && touched.size < 3) onDone?.()
  }

  const { monthly, cum, custs } = simulate(inp)
  const ue = unitEconomics(inp)
  const end = custs[MONTHS - 1]
  const mrr = end * inp.price
  const cap = inp.newPerMonth / inp.churn
  const ratioTone = ue.ratio >= 3 ? 'good' : ue.ratio >= 1 ? 'warn' : 'bad'
  const paybackTone = ue.payback <= 12 ? 'good' : ue.payback <= 24 ? 'warn' : 'bad'
  const win = ue.ratio >= 3 && monthly[MONTHS - 1] > 0
  const tone = (t: string) => (t === 'good' ? 'good-text' : t === 'warn' ? 'warn-text' : 'bad-text')
  const icon = (t: string) => (t === 'good' ? '✅' : t === 'warn' ? '⚠️' : '⛔')

  return (
    <div className="stack">
      <div className={`callout ${win ? 'good' : 'info'}`}>
        <b>{win ? '🎉 Mission complete. ' : '🎯 Mission: '}</b>
        {win
          ? 'LTV:CAC is 3 or better and the business makes money every month by month 24. Notice which levers did it.'
          : 'Get LTV:CAC to 3 or more AND monthly profit above $0 by month 24. Team & tools cost a fixed $6,000/mo.'}
      </div>

      <div className="card tight flat stack sm">
        <BizSlider label="💵 Price per customer" value={inp.price} min={5} max={300} show={(v) => `$${v}/mo`} onChange={(v) => set('price', v)} />
        <BizSlider label="🧲 New customers per month" value={inp.newPerMonth} min={5} max={200} show={(v) => `${v}`} onChange={(v) => set('newPerMonth', v)} />
        <BizSlider
          label="📉 Monthly churn"
          value={Math.round(inp.churn * 1000) / 10}
          min={1}
          max={15}
          step={0.5}
          show={(v) => `${v}%`}
          onChange={(v) => set('churn', v / 100)}
          hint="Share of paying customers who cancel each month."
        />
        <BizSlider
          label="🖥️ Infra + support cost per customer"
          value={inp.infra}
          min={0}
          max={60}
          show={(v) => `$${v}/mo`}
          onChange={(v) => set('infra', v)}
        />
        <BizSlider
          label="📣 Acquisition cost (CAC)"
          value={inp.cac}
          min={0}
          max={1500}
          step={10}
          show={(v) => `$${v}`}
          onChange={(v) => set('cac', v)}
          hint="Ads, sales time and tools spent to win one paying customer."
        />
      </div>

      <div className="grid2">
        <div className="stat">
          <span className="v">{money(mrr)}</span>
          <span className="l">MRR at month 24 ({num(end)} customers)</span>
        </div>
        <div className="stat">
          <span className="v">{money(mrr * 12)}</span>
          <span className="l">ARR at month 24</span>
        </div>
        <div className="stat">
          <span className={`v ${ue.margin >= 0.7 ? '' : ue.margin >= 0 ? 'warn-text' : 'bad-text'}`}>{Math.round(ue.margin * 100)}%</span>
          <span className="l">Gross margin</span>
        </div>
        <div className="stat">
          <span className="v">{ue.ltv > 0 ? money(ue.ltv) : '$0'}</span>
          <span className="l">LTV per customer</span>
        </div>
        <div className="stat">
          <span className={`v ${tone(paybackTone)}`}>
            {icon(paybackTone)} {Number.isFinite(ue.payback) ? `${ue.payback.toFixed(1)} mo` : 'never'}
          </span>
          <span className="l">CAC payback</span>
        </div>
        <div className="stat">
          <span className={`v ${tone(ratioTone)}`}>
            {icon(ratioTone)} {Number.isFinite(ue.ratio) ? `${Math.max(0, ue.ratio).toFixed(1)}×` : '∞'}
          </span>
          <span className="l">LTV : CAC (aim for 3×+)</span>
        </div>
      </div>

      <div className="well stack sm tiny mono" style={{ overflowWrap: 'anywhere' }}>
        <div>Gross margin = (${inp.price} − ${inp.infra}) ÷ ${inp.price} = {Math.round(ue.margin * 100)}%</div>
        <div>
          LTV = ${inp.price} × {Math.round(ue.margin * 100)}% ÷ {Math.round(inp.churn * 1000) / 10}% = {money(Math.max(0, ue.ltv))}
        </div>
        <div>
          Payback = ${inp.cac} ÷ (${inp.price} × {Math.round(ue.margin * 100)}%) ={' '}
          {Number.isFinite(ue.payback) ? `${ue.payback.toFixed(1)} months` : 'never'}
        </div>
      </div>

      <div className="card tight flat stack sm">
        <div className="kicker">Profit over 24 months</div>
        <BizLineChart
          ariaLabel={`Profit over 24 months. Month 24 profit ${money(monthly[MONTHS - 1])}; total after 24 months ${money(cum[MONTHS - 1])}.`}
          xLabel="Month"
          yLabel="Profit ($)"
          xStart={1}
          xTicks={[0, 5, 11, 17, 23]}
          fmt={money}
          yInclude={[0]}
          series={[
            { id: 'm', label: 'Profit that month', color: 'var(--info)', values: monthly },
            { id: 'c', label: 'Total so far', color: 'var(--lv3)', values: cum, dashed: true },
          ]}
        />
        <div className="row between small">
          <span>
            Month 24: <b className={monthly[MONTHS - 1] >= 0 ? 'good-text' : 'bad-text'}>{money(monthly[MONTHS - 1])}</b>
          </span>
          <span>
            24-month total: <b className={cum[MONTHS - 1] >= 0 ? 'good-text' : 'bad-text'}>{money(cum[MONTHS - 1])}</b>
          </span>
        </div>
      </div>

      <div className="callout warn small">
        <b>Churn caps your size.</b> At {inp.newPerMonth} new customers a month and {Math.round(inp.churn * 1000) / 10}% churn, you level
        off around <b>{num(cap)} customers</b> (new ÷ churn) — however long you wait.
      </div>

      <button
        type="button"
        className="btn ghost small"
        onClick={() => setInp(START)}
        disabled={JSON.stringify(inp) === JSON.stringify(START)}
      >
        ↺ Reset to the starting business
      </button>
    </div>
  )
}
