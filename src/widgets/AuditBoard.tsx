import { useState } from 'react'
import type { QuizOption } from '../lib/types'

export interface AuditItem {
  id: string
  emoji: string
  title: string
  /** Facts shown before the fix, e.g. "Owner: jordan@freelance.dev". */
  before: { k: string; v: string }[]
  /** Facts shown after the fix. */
  after: { k: string; v: string }[]
  /** What the learner must decide for this item. */
  ask: string
  options: QuizOption[]
}

interface Props {
  items: AuditItem[]
  /** e.g. "Accounts secured" */
  meterLabel: string
  /** Label for unfixed items, e.g. "At risk". */
  riskLabel?: string
  fixedLabel?: string
  /** Shown when every item is fixed. Receives first-try score. */
  finale: (firstTry: number, total: number) => string
  onDone?: () => void
}

/**
 * A checklist of risky things. Open one, pick the right fix; wrong picks
 * explain why. Completes when everything is fixed.
 */
export function AuditBoard({ items, meterLabel, riskLabel = 'At risk', fixedLabel = 'Fixed', finale, onDone }: Props) {
  const [open, setOpen] = useState<string | null>(items[0]?.id ?? null)
  const [fixed, setFixed] = useState<Set<string>>(new Set())
  const [tries, setTries] = useState<Record<string, number[]>>({})
  const [firstTry, setFirstTry] = useState(0)

  function pick(item: AuditItem, i: number) {
    if (fixed.has(item.id)) return
    const t = tries[item.id] ?? []
    if (t.includes(i)) return
    setTries({ ...tries, [item.id]: [...t, i] })
    if (item.options[i].correct) {
      if (t.length === 0) setFirstTry((n) => n + 1)
      const next = new Set(fixed).add(item.id)
      setFixed(next)
      if (next.size === items.length) onDone?.()
    }
  }

  const pctFixed = (fixed.size / items.length) * 100

  return (
    <div className="stack">
      <div className="stack sm">
        <div className="row between small">
          <b>{meterLabel}</b>
          <span className="mono">
            {fixed.size}/{items.length}
          </span>
        </div>
        <div className="meter" role="progressbar" aria-valuemin={0} aria-valuemax={items.length} aria-valuenow={fixed.size} aria-label={meterLabel}>
          <span style={{ width: `${pctFixed}%`, background: fixed.size === items.length ? 'var(--good)' : 'var(--warn)' }} />
        </div>
      </div>

      <div className="stack sm">
        {items.map((item) => {
          const isOpen = open === item.id
          const isFixed = fixed.has(item.id)
          const t = tries[item.id] ?? []
          const last = t[t.length - 1]
          const facts = isFixed ? item.after : item.before
          return (
            <div key={item.id} className={`card tight flat stack sm`} style={{ borderColor: isFixed ? 'var(--good)' : undefined }}>
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : item.id)}
                className="row between nowrap"
                style={{ background: 'none', border: 0, padding: 0, minHeight: 44, cursor: 'pointer', textAlign: 'left', width: '100%' }}
              >
                <span className="row nowrap" style={{ gap: 10, minWidth: 0 }}>
                  <span style={{ fontSize: 22 }} aria-hidden="true">
                    {item.emoji}
                  </span>
                  <b style={{ fontSize: 15 }}>{item.title}</b>
                </span>
                <span className={`pill ${isFixed ? 'good-text' : 'warn-text'}`}>{isFixed ? `✅ ${fixedLabel}` : `⚠️ ${riskLabel}`}</span>
              </button>
              {isOpen && (
                <div className="stack sm pop">
                  <div className="well stack" style={{ gap: 4, padding: 10 }}>
                    {facts.map((f) => (
                      <div key={f.k} className="small" style={{ overflowWrap: 'anywhere' }}>
                        <span className="muted">{f.k}: </span>
                        {f.v}
                      </div>
                    ))}
                  </div>
                  {!isFixed && <div className="small" style={{ fontWeight: 650 }}>{item.ask}</div>}
                  {item.options.map((o, i) => {
                    const tried = t.includes(i)
                    const cls = tried ? (o.correct ? 'good' : 'bad') : ''
                    if (isFixed && !o.correct) return null
                    return (
                      <button
                        key={i}
                        type="button"
                        className={`chip ${cls}`}
                        disabled={isFixed || tried}
                        onClick={() => pick(item, i)}
                        style={{ opacity: 1 }}
                      >
                        {tried ? (o.correct ? '✓ ' : '✕ ') : ''}
                        {o.text}
                      </button>
                    )
                  })}
                  <div aria-live="polite">
                    {last !== undefined && (
                      <div className={`callout ${item.options[last].correct ? 'good' : 'bad'} small pop`} key={`${item.id}-${last}`}>
                        {item.options[last].why}
                        {!item.options[last].correct && <span className="muted"> Try another fix.</span>}
                      </div>
                    )}
                  </div>
                  {isFixed && (
                    (() => {
                      const nextItem = items.find((x) => !fixed.has(x.id))
                      return nextItem ? (
                        <button type="button" className="btn small" onClick={() => setOpen(nextItem.id)}>
                          Next: {nextItem.emoji} {nextItem.title} →
                        </button>
                      ) : null
                    })()
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {fixed.size === items.length && (
        <div className="callout good pop" aria-live="polite">
          {finale(firstTry, items.length)}
        </div>
      )}
    </div>
  )
}
