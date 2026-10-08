import { useRef, useState } from 'react'

interface Spot {
  id: string
  emoji: string
  label: string
  code: string
  safe: boolean
  who: string
  what: string
}

const SPOTS: Spot[] = [
  {
    id: 'frontend',
    emoji: '🎨',
    label: 'In the frontend code',
    code: 'const pay = new Payments("sk_live_9f3a…")  // checkout.js',
    safe: false,
    who: 'Everyone who opens your website',
    what: 'Frontend code is downloaded to every visitor’s browser. Anyone can open developer tools and copy the key — then issue refunds or download your customer list.',
  },
  {
    id: 'repo',
    emoji: '🐙',
    label: 'Pasted in the GitHub repo',
    code: 'PAYMENTS_KEY=sk_live_9f3a…   # config.txt, committed',
    safe: false,
    who: 'Everyone with repo access — forever',
    what: 'Bots scan code for live keys within minutes. Deleting the line later doesn’t help: it’s still in the history.',
  },
  {
    id: 'secret',
    emoji: '🔐',
    label: 'Server secret (environment variable)',
    code: 'process.env.PAYMENTS_SECRET_KEY  // set in hosting dashboard',
    safe: true,
    who: 'Only your backend server',
    what: 'The key lives in your hosting’s secret settings and is only read by server code. Users never receive it.',
  },
]

const LEAK_STEPS = [
  { id: 'rotate', label: 'Roll the key now (create a new one, kill the old one)', good: true, why: 'First move, every time. The leaked key stops working within seconds.' },
  { id: 'logs', label: 'Check the provider’s logs for anything the key was used for', good: true, why: 'Tells you whether anyone actually used it — refunds, data exports, new charges.' },
  { id: 'delete', label: 'Just delete the line from the code', good: false, why: 'The key still works, and it’s still in your history. Deleting the line is cleanup, not containment.' },
  { id: 'wait', label: 'Wait and see if anything weird happens', good: false, why: 'Attackers move in minutes. Waiting turns a near-miss into an incident.' },
]

interface Props {
  onDone?: () => void
}

/** Where should the payment provider’s secret key live? Then: it leaked — what do you do? */
export function KeyVault({ onDone }: Props) {
  const [pick, setPick] = useState<string | null>(null)
  const [seen, setSeen] = useState<Set<string>>(new Set())
  const [leak, setLeak] = useState(false)
  const [chosen, setChosen] = useState<Set<string>>(new Set())
  const fired = useRef(false)
  const spot = SPOTS.find((s) => s.id === pick)

  function choose(id: string) {
    setPick(id)
    setSeen((s) => new Set(s).add(id))
  }

  function respond(id: string) {
    const next = new Set(chosen).add(id)
    setChosen(next)
    const goods = LEAK_STEPS.filter((s) => s.good).every((s) => next.has(s.id))
    if (goods && !fired.current) {
      fired.current = true
      onDone?.()
    }
  }

  return (
    <div className="stack">
      <div className="well small">
        Your payment provider gives you a <b>secret key</b> (<span className="mono">sk_live_…</span>). Whoever has it can move money on your account. Where do you put it?
      </div>
      <div className="stack sm">
        {SPOTS.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`chip ${seen.has(s.id) ? (s.safe ? 'good' : 'bad') : ''}`}
            aria-pressed={pick === s.id}
            onClick={() => choose(s.id)}
          >
            {s.emoji} {s.label}
          </button>
        ))}
      </div>
      {spot && (
        <div className="stack sm pop" key={spot.id}>
          <div className="code">{spot.code}</div>
          <div className="row nowrap" style={{ alignItems: 'flex-start' }}>
            <span className="pill">👀 Who can see it</span>
            <span className={`small ${spot.safe ? 'good-text' : 'bad-text'}`} style={{ fontWeight: 650 }}>
              {spot.who}
            </span>
          </div>
          <div className={`callout ${spot.safe ? 'good' : 'bad'}`}>
            {spot.safe ? '✅ ' : '🚨 '}
            {spot.what}
          </div>
        </div>
      )}

      {seen.size === SPOTS.length && !leak && (
        <button type="button" className="btn danger block pop" onClick={() => setLeak(true)}>
          💥 Oops — a contractor pasted the live key in a public repo
        </button>
      )}
      {seen.size < SPOTS.length && <p className="tiny muted">Try all three spots ({seen.size}/3).</p>}

      {leak && (
        <div className="stack sm pop">
          <div className="callout bad">
            <b>The live secret key is public.</b> Tap every action you’d take right now.
          </div>
          {LEAK_STEPS.map((s) => {
            const on = chosen.has(s.id)
            return (
              <div key={s.id} className="stack sm">
                <button type="button" className={`chip ${on ? (s.good ? 'good' : 'bad') : ''}`} onClick={() => respond(s.id)} disabled={on}>
                  {on ? (s.good ? '✓ ' : '✕ ') : ''}
                  {s.label}
                </button>
                {on && <p className={`tiny ${s.good ? 'good-text' : 'bad-text'}`} style={{ padding: '0 6px' }}>{s.why}</p>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
