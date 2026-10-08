import { useRef, useState } from 'react'
import { money, num } from '../lib/util'
import { Meter } from '../components/bits'

const USER_STEPS = [100, 1_000, 5_000, 20_000, 100_000]
const BASIC_LIMIT = 600
const PRO_LIMIT = 3_000
const PRO_TIER_FEE = 500

interface Props {
  onDone?: () => void
}

/**
 * Drag users up and watch an AI provider’s rate limit (429s) and your
 * usage-based bill grow. Then pull levers: caching, queue & retry, bigger tier.
 */
export function LimitsLab({ onDone }: Props) {
  const [step, setStep] = useState(1)
  const [cache, setCache] = useState(false)
  const [queue, setQueue] = useState(false)
  const [tier, setTier] = useState(false)
  const [levers, setLevers] = useState<Set<string>>(new Set())
  const [maxSeen, setMaxSeen] = useState(1)
  const fired = useRef(false)

  const users = USER_STEPS[step]
  const aiPerUser = cache ? 0.3 : 0.6
  const ai = users * aiPerUser
  const email = users * 0.02
  const sms = users * 0.03
  const fee = tier ? PRO_TIER_FEE : 0
  const bill = ai + email + sms + fee
  const revenue = users * 0.05 * 19
  const margin = revenue - bill
  const peak = users * 0.02 * (cache ? 0.5 : 1)
  const limit = tier ? PRO_LIMIT : BASIC_LIMIT
  const over = Math.max(0, peak - limit)
  const errRate = peak > 0 ? over / peak : 0

  function check(nextMax: number, nextLevers: Set<string>) {
    if (!fired.current && nextMax >= 4 && nextLevers.size >= 2) {
      fired.current = true
      onDone?.()
    }
  }

  function lever(id: string, set: (v: boolean) => void, v: boolean) {
    set(v)
    const n = new Set(levers).add(id)
    setLevers(n)
    check(maxSeen, n)
  }

  function slide(v: number) {
    setStep(v)
    const m = Math.max(maxSeen, v)
    setMaxSeen(m)
    check(m, levers)
  }

  const screen =
    over === 0
      ? { tone: 'good', text: '✨ Summary ready.' }
      : queue
        ? { tone: 'warn', text: '⏳ Busy right now — your summary will be ready in ~30 seconds.' }
        : { tone: 'bad', text: '❌ Something went wrong. (429: Too Many Requests)' }

  return (
    <div className="stack">
      <div className="stack sm">
        <div className="row between">
          <span className="kicker">Active users</span>
          <b style={{ fontVariantNumeric: 'tabular-nums' }}>{num(users)}</b>
        </div>
        <input
          type="range"
          min={0}
          max={USER_STEPS.length - 1}
          step={1}
          value={step}
          aria-label="Active users"
          aria-valuetext={`${num(users)} users`}
          onChange={(e) => slide(Number(e.target.value))}
        />
        <div className="row between tiny muted">
          <span>100</span>
          <span>100,000</span>
        </div>
      </div>

      <div className="card tight flat stack sm">
        <div className="row between">
          <span className="small" style={{ fontWeight: 650 }}>✨ AI requests at peak</span>
          <span className="small mono">
            {num(peak)}/min · limit {num(limit)}
          </span>
        </div>
        <Meter value={peak / Math.max(limit, peak)} color={over ? 'var(--bad)' : 'var(--good)'} label="AI requests vs. rate limit" />
        {over > 0 ? (
          <p className="small bad-text" style={{ fontWeight: 600 }}>
            {num(over)} requests/min get “429 Too Many Requests” ({Math.round(errRate * 100)}% of AI calls fail{queue ? ' — but they’re queued and retried' : ''}).
          </p>
        ) : (
          <p className="small good-text" style={{ fontWeight: 600 }}>Under the limit. Every AI call goes through.</p>
        )}
      </div>

      <div className="phone" style={{ maxWidth: 260 }}>
        <div className="screen" style={{ minHeight: 0 }}>
          <div className="tiny muted">User taps “Summarize”</div>
          <div className={`callout ${screen.tone}`} style={{ fontSize: 14 }} key={screen.text}>
            {screen.text}
          </div>
        </div>
      </div>

      <div className="stack sm">
        <div className="kicker">Monthly third-party bill (usage-based)</div>
        <div className="tbl-wrap">
          <table className="tbl">
            <tbody>
              <tr>
                <td>✨ AI (30 summaries/user)</td>
                <td className="mono">{money(ai)}</td>
              </tr>
              <tr>
                <td>✉️ Email (20/user)</td>
                <td className="mono">{money(email)}</td>
              </tr>
              <tr>
                <td>💬 SMS codes (3/user)</td>
                <td className="mono">{money(sms)}</td>
              </tr>
              {tier && (
                <tr>
                  <td>⬆️ Higher AI tier</td>
                  <td className="mono">{money(fee)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="grid3">
          <div className="stat">
            <span className="v" style={{ fontSize: 18 }}>{money(revenue)}</span>
            <span className="l">revenue*</span>
          </div>
          <div className="stat">
            <span className="v" style={{ fontSize: 18 }}>{money(bill)}</span>
            <span className="l">vendor bill</span>
          </div>
          <div className="stat">
            <span className={`v ${margin < 0 ? 'bad-text' : 'good-text'}`} style={{ fontSize: 18 }}>
              {money(margin)}
            </span>
            <span className="l">left over</span>
          </div>
        </div>
        <p className="tiny muted">*5% of users pay $19/mo. Free users still cost you AI, email and SMS.</p>
      </div>

      <div className="card tight flat stack sm">
        <div className="kicker">Levers (try at least two at 100,000 users)</div>
        {[
          { id: 'cache', on: cache, set: setCache, label: 'Cache AI answers', note: 'Same note, same summary — don’t pay twice. Halves AI calls.' },
          { id: 'queue', on: queue, set: setQueue, label: 'Queue & retry', note: 'Requests over the limit wait and retry instead of failing.' },
          { id: 'tier', on: tier, set: setTier, label: 'Buy a higher tier', note: `Limit ${num(PRO_LIMIT)}/min for ${money(PRO_TIER_FEE)}/mo extra.` },
        ].map((l) => (
          <div key={l.id} className="row nowrap between">
            <span className="small">
              <b>{l.label}</b>
              <br />
              <span className="muted">{l.note}</span>
            </span>
            <button type="button" role="switch" aria-checked={l.on} aria-label={l.label} className="switch" onClick={() => lever(l.id, l.set, !l.on)} />
          </div>
        ))}
      </div>
    </div>
  )
}
