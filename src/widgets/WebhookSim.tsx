import { useEffect, useRef, useState } from 'react'
import { wait } from '../lib/motion'

type RunId = 'happy' | 'missed' | 'safe'

interface Line {
  who: string
  text: string
  tone: 'req' | 'res' | 'err' | 'info'
}

interface Props {
  onDone?: () => void
}

const SCRIPTS: Record<RunId, { lines: (Line & { set?: Partial<Ledger> })[]; result: { tone: 'good' | 'bad'; text: string } }> = {
  happy: {
    lines: [
      { who: '🧑 Maya', text: 'Taps “Upgrade to Pro — $29/mo”', tone: 'req' },
      { who: '🖥️ Your app', text: 'Sends her to the provider’s checkout page. Your app never sees her card.', tone: 'req' },
      { who: '💳 Provider', text: 'Charges the card: $29 ✓', tone: 'res', set: { charged: true } },
      { who: '💳 Provider', text: 'Sends a webhook to your server: “checkout.completed — user 42 paid”', tone: 'req' },
      { who: '⚙️ Your server', text: 'Checks the webhook’s signature — it really came from the provider', tone: 'info' },
      { who: '🗄️ Database', text: 'Sets user 42 → plan = Pro', tone: 'res', set: { pro: true } },
      { who: '⚙️ Your server', text: 'Replies “200 OK — got it” to the provider', tone: 'res' },
      { who: '🧑 Maya', text: 'Sees the Pro badge. Happy customer.', tone: 'res' },
    ],
    result: { tone: 'good', text: 'Money and access stay in sync because the webhook arrived and your server recorded it.' },
  },
  missed: {
    lines: [
      { who: '🧑 Maya', text: 'Taps “Upgrade to Pro — $29/mo”', tone: 'req' },
      { who: '🖥️ Your app', text: 'Sends her to the provider’s checkout page', tone: 'req' },
      { who: '💳 Provider', text: 'Charges the card: $29 ✓', tone: 'res', set: { charged: true } },
      { who: '💳 Provider', text: 'Sends the “paid” webhook to your server…', tone: 'req' },
      { who: '⚙️ Your server', text: 'Mid-deploy — returns 503. The webhook is lost.', tone: 'err' },
      { who: '🗄️ Database', text: 'Still says user 42 → plan = Free', tone: 'err' },
      { who: '🧑 Maya', text: 'Charged $29, still on Free. Emails support: “Did you just take my money?”', tone: 'err' },
    ],
    result: { tone: 'bad', text: 'Charged but not upgraded. The provider and your database now disagree — and nobody noticed except an angry customer.' },
  },
  safe: {
    lines: [
      { who: '🧑 Maya', text: 'Taps “Upgrade to Pro — $29/mo”', tone: 'req' },
      { who: '💳 Provider', text: 'Charges the card: $29 ✓', tone: 'res', set: { charged: true } },
      { who: '💳 Provider', text: 'Sends the “paid” webhook…', tone: 'req' },
      { who: '⚙️ Your server', text: 'Mid-deploy — returns 503', tone: 'err' },
      { who: '💳 Provider', text: 'No “200 OK” came back, so it retries in 5 minutes', tone: 'info' },
      { who: '⚙️ Your server', text: 'Back up. Verifies signature, checks it hasn’t processed this event already', tone: 'info' },
      { who: '🗄️ Database', text: 'Sets user 42 → plan = Pro', tone: 'res', set: { pro: true } },
      { who: '🔎 Nightly check', text: 'Compares provider’s paid list vs. database: 0 mismatches', tone: 'res' },
    ],
    result: { tone: 'good', text: 'Same outage, no harm. Retries plus a reconciliation check mean a missed webhook gets caught — by your system, not your customer.' },
  },
}

interface Ledger {
  charged: boolean
  pro: boolean
}

/**
 * Checkout → provider → webhook → upgrade. Run the happy path, then a missed
 * webhook, then add the safety nets and run it again.
 */
export function WebhookSim({ onDone }: Props) {
  const [lines, setLines] = useState<Line[]>([])
  const [ledger, setLedger] = useState<Ledger>({ charged: false, pro: false })
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<{ tone: 'good' | 'bad'; text: string } | null>(null)
  const [ran, setRan] = useState<Set<RunId>>(new Set())
  const [retries, setRetries] = useState(false)
  const [recon, setRecon] = useState(false)
  const runId = useRef(0)
  const fired = useRef(false)

  useEffect(() => () => void runId.current++, [])

  async function run(id: RunId) {
    const my = ++runId.current
    setRunning(true)
    setLines([])
    setResult(null)
    setLedger({ charged: false, pro: false })
    for (const l of SCRIPTS[id].lines) {
      await wait(750)
      if (runId.current !== my) return
      setLines((x) => [...x, l])
      if (l.set) setLedger((g) => ({ ...g, ...l.set }))
    }
    await wait(400)
    if (runId.current !== my) return
    setRunning(false)
    setResult(SCRIPTS[id].result)
    const next = new Set(ran).add(id)
    setRan(next)
    if (!fired.current && next.has('happy') && next.has('missed') && next.has('safe')) {
      fired.current = true
      onDone?.()
    }
  }

  const mismatch = ledger.charged && !ledger.pro && !running && result?.tone === 'bad'
  const safeReady = retries && recon

  return (
    <div className="stack">
      <div className="row">
        <button type="button" className="btn small primary" disabled={running} onClick={() => run('happy')}>
          ▶ Normal upgrade{ran.has('happy') ? ' ✓' : ''}
        </button>
        <button type="button" className="btn small danger" disabled={running} onClick={() => run('missed')}>
          ⚠️ Server down when webhook arrives{ran.has('missed') ? ' ✓' : ''}
        </button>
      </div>

      <div className="grid2">
        <div className={`card tight flat stack sm ${ledger.charged ? 'pop' : ''}`} key={`c${ledger.charged}`}>
          <div className="tiny muted" style={{ fontWeight: 650 }}>💳 Provider says</div>
          <div style={{ fontWeight: 700 }} className={ledger.charged ? 'good-text' : 'muted'}>
            {ledger.charged ? 'PAID $29' : 'Not paid'}
          </div>
        </div>
        <div className={`card tight flat stack sm ${ledger.pro ? 'pop' : ''}`} key={`p${ledger.pro}`}>
          <div className="tiny muted" style={{ fontWeight: 650 }}>🗄️ Your database says</div>
          <div style={{ fontWeight: 700 }} className={ledger.pro ? 'good-text' : mismatch ? 'bad-text' : 'muted'}>
            {ledger.pro ? 'Plan: PRO' : 'Plan: FREE'}
          </div>
        </div>
      </div>
      {mismatch && <div className="callout bad pop">⚠️ Mismatch: money taken, access not given.</div>}

      <div className="well stack sm" aria-live="polite">
        <div className="kicker">Timeline</div>
        {lines.length === 0 && <p className="small muted">Press a button above to run a checkout.</p>}
        {lines.map((l, i) => (
          <div key={i} className="stack pop" style={{ gap: 2, alignItems: 'flex-start' }}>
            <span className="tiny" style={{ fontWeight: 700 }}>{l.who}</span>
            <span className={`bubble ${l.tone === 'info' ? '' : l.tone}`} style={{ fontSize: 13, background: l.tone === 'info' ? 'var(--surface)' : undefined }}>
              {l.text}
            </span>
          </div>
        ))}
        {running && <p className="tiny muted pulse">…</p>}
      </div>

      {result && <div className={`callout ${result.tone} pop`}>{result.text}</div>}

      {ran.has('missed') && (
        <div className="card tight flat stack sm pop">
          <div className="kicker">Add the safety nets</div>
          <div className="row nowrap between">
            <span className="small">
              <b>Webhook retries</b>
              <br />
              <span className="muted">Only say “200 OK” after saving, so the provider retries on failure.</span>
            </span>
            <button type="button" role="switch" aria-checked={retries} aria-label="Webhook retries" className="switch" onClick={() => setRetries(!retries)} />
          </div>
          <div className="row nowrap between">
            <span className="small">
              <b>Nightly reconciliation</b>
              <br />
              <span className="muted">Compare who paid (provider) with who’s Pro (database).</span>
            </span>
            <button type="button" role="switch" aria-checked={recon} aria-label="Nightly reconciliation" className="switch" onClick={() => setRecon(!recon)} />
          </div>
          <button type="button" className="btn small primary" disabled={running || !safeReady} onClick={() => run('safe')}>
            ▶ Run the outage again{ran.has('safe') ? ' ✓' : ''}
          </button>
          {!safeReady && <p className="tiny muted">Switch on both safety nets to re-run.</p>}
        </div>
      )}
    </div>
  )
}
