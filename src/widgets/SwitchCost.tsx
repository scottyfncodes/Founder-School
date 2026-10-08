import { useRef, useState } from 'react'
import { Meter } from '../components/bits'

interface Choice {
  id: string
  label: string
  /** Weeks of engineering this adds to switching away. */
  weeks: number
  note: string
}

const CHOICES: Choice[] = [
  { id: 'direct', label: 'Call their SDK directly from 38 files', weeks: 4, note: 'Every one of those 38 places must be found, changed and retested.' },
  { id: 'templates', label: 'Build all email templates in their editor', weeks: 2, note: 'Templates live in their dashboard, in their format. You rebuild them by hand.' },
  { id: 'data', label: 'Keep subscriber lists only in their system', weeks: 3, note: 'Your users’ preferences live only with them. Exporting and mapping it is a project.' },
  { id: 'webhooks', label: 'Rely on their unsubscribe webhooks', weeks: 1, note: 'A new provider sends different events. That plumbing gets rewritten.' },
  { id: 'contract', label: 'Sign a 2-year contract for 20% off', weeks: 0, note: 'Cheaper now, but you can’t leave for two years, whatever happens.' },
]

interface Props {
  onDone?: () => void
}

/** Make integration choices, then see how hard it is to leave when the vendor triples its price. */
export function SwitchCost({ onDone }: Props) {
  const [on, setOn] = useState<Set<string>>(new Set(['direct', 'templates']))
  const [touched, setTouched] = useState<Set<string>>(new Set())
  const [shock, setShock] = useState(false)
  const fired = useRef(false)

  const weeks = 1 + CHOICES.filter((c) => on.has(c.id)).reduce((a, c) => a + c.weeks, 0)
  const contract = on.has('contract')

  function flip(id: string) {
    const n = new Set(on)
    if (n.has(id)) n.delete(id)
    else n.add(id)
    setOn(n)
    const t = new Set(touched).add(id)
    setTouched(t)
    if (shock && !fired.current && t.size >= 2) {
      fired.current = true
      onDone?.()
    }
  }

  function priceShock() {
    setShock(true)
    if (!fired.current && touched.size >= 2) {
      fired.current = true
      onDone?.()
    }
  }

  const verdict = contract
    ? { tone: 'bad', text: '🔒 Locked in by contract. You pay the new price until the term ends — no engineering can fix that.' }
    : weeks <= 2
      ? { tone: 'good', text: `🟢 About ${weeks} week${weeks === 1 ? '' : 's'} to switch. You can credibly say “we’ll leave” — and negotiate.` }
      : weeks <= 5
        ? { tone: 'warn', text: `🟠 About ${weeks} weeks of work to switch. Painful, but possible.` }
        : { tone: 'bad', text: `🔴 About ${weeks} weeks to switch. That’s a quarter of a developer’s year — so you’ll probably just pay.` }

  return (
    <div className="stack">
      <div className="well small">You’re choosing how to integrate an email provider. Switch choices on and off.</div>
      <div className="stack sm">
        {CHOICES.map((c) => (
          <div key={c.id} className="stack sm">
            <div className="row nowrap between">
              <span className="small" style={{ fontWeight: 600 }}>
                {c.label}
              </span>
              <button type="button" role="switch" aria-checked={on.has(c.id)} aria-label={c.label} className="switch" onClick={() => flip(c.id)} />
            </div>
            {on.has(c.id) && <p className="tiny muted pop">{c.note}</p>}
          </div>
        ))}
      </div>

      <div className="card tight flat stack sm" aria-live="polite">
        <div className="row between">
          <span className="kicker">Switching cost</span>
          <b>{contract ? 'Contract lock' : `~${weeks} wk`}</b>
        </div>
        <Meter value={contract ? 1 : weeks / 11} color={contract || weeks > 5 ? 'var(--bad)' : weeks > 2 ? 'var(--warn)' : 'var(--good)'} label="Switching cost" />
        {!on.has('direct') && <p className="tiny good-text">✓ One wrapper (your own sendEmail function) means only one file changes when you switch.</p>}
      </div>

      {!shock ? (
        <button type="button" className="btn danger block" onClick={priceShock}>
          📈 The vendor just tripled its price
        </button>
      ) : (
        <div className={`callout ${verdict.tone} pop`} key={verdict.text}>
          {verdict.text}
        </div>
      )}
      {shock && touched.size < 2 && <p className="tiny muted">Now change a couple of choices and watch the verdict move.</p>}
    </div>
  )
}
