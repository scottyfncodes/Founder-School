import { useState } from 'react'

interface Props {
  onDone?: () => void
}

type Where = 'front' | 'back'

interface Outcome {
  where: Where
  typed: number
  sent: string
  server: string
  charged: number
  tone: 'good' | 'bad' | 'info'
  lesson: string
}

const PRICE = 99

/**
 * A checkout where the learner can edit the price "in the page" (like anyone
 * can with browser dev tools) and see whether the backend trusts it.
 */
export function FrontBackLab({ onDone }: Props) {
  const [where, setWhere] = useState<Where>('front')
  const [price, setPrice] = useState(String(PRICE))
  const [out, setOut] = useState<Outcome | null>(null)
  const [tampered, setTampered] = useState<Set<Where>>(new Set())
  const [fired, setFired] = useState(false)

  const typed = Math.max(0, Math.round(Number(price) || 0))
  const edited = typed !== PRICE

  function pay() {
    let o: Outcome
    if (where === 'front') {
      o = {
        where,
        typed,
        sent: `{ plan: "pro", price: ${typed} }`,
        server: edited ? `Takes the browser’s word for it: charges $${typed}.` : `Charges $${typed}.`,
        charged: typed,
        tone: edited ? 'bad' : 'info',
        lesson: edited
          ? `You just sold a $${PRICE} plan for $${typed}. The price lived in code on the customer’s device — and the customer can change anything on their device.`
          : 'Works fine for honest customers. Now change the price in the page and pay again.',
      }
    } else {
      o = {
        where,
        typed,
        sent: `{ plan: "pro", price: ${typed} }`,
        server: edited
          ? `Ignores the browser’s price. Looks up “pro” in its own list: $${PRICE}. Charges $${PRICE}.`
          : `Looks up “pro” in its own list: $${PRICE}. Charges $${PRICE}.`,
        charged: PRICE,
        tone: edited ? 'good' : 'info',
        lesson: edited
          ? 'The edit changed what the customer saw, but not what they paid. The server decides; the page only displays.'
          : 'Same result as before for honest customers. Now try editing the price.',
      }
    }
    setOut(o)
    if (edited) {
      const next = new Set(tampered).add(where)
      setTampered(next)
      if (!fired && next.size === 2) {
        setFired(true)
        onDone?.()
      }
    }
  }

  return (
    <div className="stack">
      <div className="stack sm">
        <div className="kicker">Who checks the price?</div>
        <div className="grid2">
          <button
            type="button"
            className="chip"
            aria-pressed={where === 'front'}
            onClick={() => {
              setWhere('front')
              setOut(null)
            }}
          >
            🎨 Frontend only {tampered.has('front') ? '✓' : ''}
          </button>
          <button
            type="button"
            className="chip"
            aria-pressed={where === 'back'}
            onClick={() => {
              setWhere('back')
              setOut(null)
            }}
          >
            ⚙️ Backend {tampered.has('back') ? '✓' : ''}
          </button>
        </div>
      </div>

      <div className="phone">
        <div className="screen">
          <div className="tiny muted">acme.app/checkout</div>
          <div style={{ fontWeight: 700 }}>Pro plan · 1 year</div>
          <label className="stack sm small">
            <span className="muted tiny">Price shown in the page (editable — like browser dev tools)</span>
            <span className="row nowrap" style={{ gap: 6 }}>
              <span style={{ fontWeight: 700, fontSize: 20 }}>$</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={price}
                aria-label="Price in the page"
                onChange={(e) => {
                  setPrice(e.target.value)
                  setOut(null)
                }}
                style={{
                  width: '100%',
                  minWidth: 0,
                  minHeight: 44,
                  fontSize: 20,
                  fontWeight: 700,
                  padding: '6px 10px',
                  borderRadius: 10,
                  border: `1.5px solid ${edited ? 'var(--bad)' : 'var(--line)'}`,
                  background: 'var(--surface)',
                  color: 'var(--ink)',
                }}
              />
            </span>
          </label>
          <button type="button" className="btn primary block" onClick={pay}>
            Pay ${typed}
          </button>
        </div>
      </div>
      {!edited && !out && <p className="tiny muted">Tip: change 99 to 1, then pay. Try it with both settings.</p>}

      <div aria-live="polite" className="stack sm">
        {out && (
          <div className="stack sm pop" key={`${out.where}-${out.typed}-${tampered.size}`}>
            <div className="node">
              <span className="emoji">📱</span>
              <div className="grow small">
                <div className="tiny muted">The browser sends</div>
                <span className="mono">{out.sent}</span>
              </div>
            </div>
            <div className="link active" />
            <div className={`node ${out.tone === 'bad' ? 'fail' : out.tone === 'good' ? 'ok' : ''}`}>
              <span className="emoji">⚙️</span>
              <div className="grow small">
                <div className="tiny muted">Your server</div>
                {out.server}
              </div>
            </div>
            <div className="grid2">
              <div className="stat">
                <span className="v">${out.charged}</span>
                <span className="l">Charged</span>
              </div>
              <div className="stat">
                <span className={`v ${out.charged < PRICE ? 'bad-text' : 'good-text'}`}>
                  {out.charged < PRICE ? `−$${PRICE - out.charged}` : '$0'}
                </span>
                <span className="l">Revenue lost</span>
              </div>
            </div>
            <div className={`callout ${out.tone}`}>{out.lesson}</div>
          </div>
        )}
      </div>
    </div>
  )
}
