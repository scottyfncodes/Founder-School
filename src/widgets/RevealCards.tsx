import { useState } from 'react'

export interface RevealCard {
  id: string
  emoji: string
  title: string
  /** Revealed on tap. */
  body: string
  tone?: 'good' | 'bad' | 'warn' | 'info'
}

interface Props {
  cards: RevealCard[]
  columns?: 1 | 2
  onDone?: () => void
}

/** Tap each card to flip it and reveal what's behind it. */
export function RevealCards({ cards, columns = 2, onDone }: Props) {
  const [open, setOpen] = useState<Set<string>>(new Set())

  function flip(id: string) {
    if (open.has(id)) return
    const next = new Set(open).add(id)
    setOpen(next)
    if (next.size === cards.length) onDone?.()
  }

  return (
    <div className="stack sm">
      <div className={columns === 2 ? 'grid2' : 'stack sm'}>
        {cards.map((c) => {
          const isOpen = open.has(c.id)
          return (
            <button
              key={c.id}
              type="button"
              aria-expanded={isOpen}
              onClick={() => flip(c.id)}
              className={`card tight flat ${isOpen && c.tone ? `callout ${c.tone}` : ''}`}
              style={{
                textAlign: 'left',
                cursor: isOpen ? 'default' : 'pointer',
                minHeight: 92,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                borderRadius: 'var(--r)',
              }}
            >
              <div style={{ fontSize: 26, lineHeight: 1 }}>{c.emoji}</div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{c.title}</div>
              {isOpen ? (
                <div className="small ink2 pop">{c.body}</div>
              ) : (
                <div className="tiny muted">Tap to reveal</div>
              )}
            </button>
          )
        })}
      </div>
      <p className="tiny muted">
        {open.size}/{cards.length} revealed
      </p>
    </div>
  )
}
