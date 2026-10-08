import { useState } from 'react'
import { num } from '../lib/util'

/* ------------------------------------------------------------------ */
/* CodeReader: tap each line of real-looking code to read it in English */
/* ------------------------------------------------------------------ */

const LINES: { code: string; indent: number; say?: string }[] = [
  { code: "import { format } from 'date-fns'", indent: 0, say: 'Borrow a ready-made date formatter from a package someone else wrote.' },
  { code: 'async function saveContact(contact) {', indent: 0, say: 'Define a recipe called “saveContact”. It runs when someone taps Save.' },
  { code: "if (!contact.email.includes('@')) {", indent: 1, say: 'Check: does the email contain an “@”?' },
  { code: "return showError('Check the email')", indent: 2, say: 'If not, stop here and show a friendly message.' },
  { code: '}', indent: 1 },
  { code: "await api.post('/contacts', contact)", indent: 1, say: 'Send the contact to your server, and wait for the answer.' },
  { code: "showToast('Saved ' + format(new Date(), 'PPP'))", indent: 1, say: 'Show “Saved Oct 8, 2026” — the date formatting comes from the borrowed package.' },
  { code: '}', indent: 0 },
]

export function CodeReader({ onDone }: { onDone?: () => void }) {
  const [open, setOpen] = useState<number | null>(null)
  const [seen, setSeen] = useState<Set<number>>(new Set())
  const total = LINES.filter((l) => l.say).length

  function tap(i: number) {
    setOpen(open === i ? null : i)
    if (seen.has(i)) return
    const next = new Set(seen).add(i)
    setSeen(next)
    if (next.size === total) onDone?.()
  }

  return (
    <div className="stack sm">
      <div className="kicker">save-button.ts</div>
      <div className="stack" style={{ gap: 4 }}>
        {LINES.map((l, i) =>
          l.say ? (
            <div key={i} className="stack sm">
              <button
                type="button"
                className={`chip mono ${seen.has(i) ? 'good' : ''}`}
                aria-expanded={open === i}
                onClick={() => tap(i)}
                style={{
                  marginLeft: l.indent * 10,
                  fontSize: 12.5,
                  padding: '8px 10px',
                  overflowWrap: 'anywhere',
                  fontWeight: 500,
                }}
              >
                {l.code}
              </button>
              {open === i && <div className="callout info small pop">{l.say}</div>}
            </div>
          ) : (
            <div key={i} className="mono tiny muted" style={{ paddingLeft: 10 + l.indent * 10 }}>
              {l.code}
            </div>
          ),
        )}
      </div>
      <p className="tiny muted" aria-live="polite">
        {seen.size === total
          ? '✅ That’s it: code is just precise instructions, and some of it is borrowed.'
          : `${seen.size}/${total} lines translated`}
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* PackageTree: install packages, watch hidden dependencies pile up    */
/* ------------------------------------------------------------------ */

interface Pkg {
  id: string
  emoji: string
  label: string
  does: string
  lines: number
  deps: string[]
}

const PKGS: Pkg[] = [
  { id: 'react', emoji: '⚛️', label: 'react', does: 'Framework for building screens', lines: 120_000, deps: ['scheduler', 'loose-envify'] },
  { id: 'stripe', emoji: '💳', label: 'stripe-js', does: 'Takes card payments', lines: 40_000, deps: ['qs', 'tiny-color', 'side-channel', 'call-bind'] },
  { id: 'charts', emoji: '📈', label: 'chart-kit', does: 'Draws charts for dashboards', lines: 210_000, deps: ['tiny-color', 'd3-scale', 'd3-shape', 'd3-array', 'd3-path', 'd3-time', 'internmap'] },
  { id: 'pdf', emoji: '📄', label: 'pdf-maker', does: 'Exports invoices as PDFs', lines: 160_000, deps: ['fontkit', 'tiny-color', 'png-js', 'brotli', 'unicode-trie', 'restructure', 'dfa', 'base64-js'] },
  { id: 'dates', emoji: '📅', label: 'date-fns', does: 'Formats dates and times', lines: 75_000, deps: [] },
]
const YOUR_LINES = 3_200
const BAD = 'tiny-color'

export function PackageTree({ onDone }: { onDone?: () => void }) {
  const [installed, setInstalled] = useState<string[]>([])
  const [alert, setAlert] = useState(false)
  const [patched, setPatched] = useState(false)
  const [fired, setFired] = useState(false)

  const pkgs = PKGS.filter((p) => installed.includes(p.id))
  const hidden = new Set(pkgs.flatMap((p) => p.deps))
  const pkgLines = pkgs.reduce((s, p) => s + p.lines, 0) + hidden.size * 6_000
  const share = YOUR_LINES / (YOUR_LINES + pkgLines)
  const affected = pkgs.filter((p) => p.deps.includes(BAD))
  const canAlert = installed.length >= 3

  function toggle(id: string) {
    if (alert) return
    setInstalled(installed.includes(id) ? installed.filter((x) => x !== id) : [...installed, id])
  }

  function patch() {
    setPatched(true)
    if (!fired) {
      setFired(true)
      onDone?.()
    }
  }

  function reset() {
    setInstalled([])
    setAlert(false)
    setPatched(false)
  }

  return (
    <div className="stack">
      <div className="grid2">
        <div className="stat">
          <span className="v">{num(YOUR_LINES)}</span>
          <span className="l">Lines you (and your AI) wrote</span>
        </div>
        <div className="stat">
          <span className="v">{num(pkgLines)}</span>
          <span className="l">Lines you borrowed</span>
        </div>
      </div>
      <div className="stack sm">
        <div className="meter" aria-hidden="true">
          <span style={{ width: `${Math.max(2, share * 100)}%`, background: 'var(--good)' }} />
        </div>
        <p className="tiny muted">
          Your own code is <b>{(share * 100).toFixed(share < 0.1 ? 1 : 0)}%</b> of what ships.{' '}
          {pkgs.length > 0 && (
            <>
              {pkgs.length} package{pkgs.length > 1 ? 's' : ''} you chose pulled in <b>{hidden.size}</b> more you never
              picked.
            </>
          )}
        </p>
      </div>

      <div className="stack sm">
        <div className="kicker">Install packages (tap) — pick at least 3</div>
        {PKGS.map((p) => {
          const on = installed.includes(p.id)
          const hit = alert && on && p.deps.includes(BAD)
          return (
            <button
              key={p.id}
              type="button"
              className={`chip ${hit ? (patched ? 'good' : 'bad') : ''}`}
              aria-pressed={on}
              disabled={alert}
              onClick={() => toggle(p.id)}
              style={{ display: 'flex', gap: 10, alignItems: 'flex-start', opacity: 1 }}
            >
              <span aria-hidden="true" style={{ fontSize: 20 }}>
                {p.emoji}
              </span>
              <span className="grow stack" style={{ gap: 2 }}>
                <span className="mono" style={{ fontWeight: 700 }}>
                  {p.label} {on ? '✓' : ''}
                </span>
                <span className="tiny muted">{p.does}</span>
                {on && (
                  <span className="tiny" style={{ overflowWrap: 'anywhere' }}>
                    {p.deps.length ? (
                      <>
                        brings along:{' '}
                        {p.deps.map((d, k) => (
                          <span key={d} className={alert && d === BAD ? 'bad-text' : 'muted'} style={{ fontWeight: d === BAD && alert ? 700 : 400 }}>
                            {d}
                            {k < p.deps.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </>
                    ) : (
                      <span className="muted">no extra packages</span>
                    )}
                  </span>
                )}
              </span>
            </button>
          )
        })}
      </div>

      {canAlert && !alert && (
        <button type="button" className="btn danger" onClick={() => setAlert(true)}>
          🚨 Simulate: security flaw found in “{BAD}”
        </button>
      )}

      <div aria-live="polite" className="stack sm">
        {alert && !patched && (
          <div className="callout bad pop stack sm">
            <div>
              <b>Security alert:</b> attackers can abuse <span className="mono">{BAD}</span> 2.1. You never installed it — but{' '}
              {affected.length > 0 ? (
                <>
                  <b>{affected.map((a) => a.label).join(' and ')}</b> {affected.length > 1 ? 'do' : 'does'}, so it ships inside your app.
                </>
              ) : (
                'none of your chosen packages use it, so you are safe this time.'
              )}
            </div>
            {affected.length > 0 ? (
              <button type="button" className="btn primary" onClick={patch}>
                ⬆️ Update the affected packages
              </button>
            ) : (
              <button type="button" className="btn" onClick={patch}>
                Got it
              </button>
            )}
          </div>
        )}
        {patched && (
          <div className="callout good pop stack sm">
            <div>
              Updated. Your own code didn’t change at all — the risk lived in borrowed code two levels deep. Updates can also
              change behavior, so re-test before shipping.
            </div>
            <button type="button" className="btn small" onClick={reset}>
              ↺ Start over
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
