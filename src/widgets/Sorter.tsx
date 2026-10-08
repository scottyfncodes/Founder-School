import { useMemo, useRef, useState } from 'react'
import { shuffle } from '../lib/util'

export interface SortItem {
  id: string
  label: string
  emoji?: string
}

interface Props {
  /** Items in the CORRECT order. They are shuffled for the learner. */
  items: SortItem[]
  /** Shown once the order is correct. */
  explain?: string
  topLabel?: string
  bottomLabel?: string
  onDone?: () => void
}

/**
 * Put things in order. Drag the handle (touch or mouse) or use the ↑ ↓ buttons.
 */
export function Sorter({ items, explain, topLabel = 'First', bottomLabel = 'Last', onDone }: Props) {
  const initial = useMemo(() => {
    let s = shuffle(items)
    // never start already solved
    while (items.length > 1 && s.every((x, i) => x.id === items[i].id)) s = shuffle(items)
    return s
  }, [items])
  const [order, setOrder] = useState(initial)
  const [checked, setChecked] = useState(false)
  const [solved, setSolved] = useState(false)
  const [drag, setDrag] = useState<{ id: string; dy: number } | null>(null)
  const listRef = useRef<HTMLOListElement>(null)
  const start = useRef<{ y: number; index: number; h: number } | null>(null)

  function move(from: number, to: number) {
    if (to < 0 || to >= order.length || from === to) return
    const next = order.slice()
    const [x] = next.splice(from, 1)
    next.splice(to, 0, x)
    setOrder(next)
    setChecked(false)
  }

  function check() {
    setChecked(true)
    if (order.every((x, i) => x.id === items[i].id)) {
      setSolved(true)
      onDone?.()
    }
  }

  function onPointerDown(e: React.PointerEvent, index: number, id: string) {
    if (solved) return
    const li = (e.currentTarget as HTMLElement).closest('li')
    const h = (li?.getBoundingClientRect().height ?? 56) + 8
    start.current = { y: e.clientY, index, h }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    setDrag({ id, dy: 0 })
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!start.current || !drag) return
    setDrag({ ...drag, dy: e.clientY - start.current.y })
  }
  function onPointerUp() {
    if (start.current && drag) {
      const shift = Math.round(drag.dy / start.current.h)
      move(start.current.index, Math.max(0, Math.min(order.length - 1, start.current.index + shift)))
    }
    start.current = null
    setDrag(null)
  }

  return (
    <div className="stack">
      <div className="tiny muted">↑ {topLabel}</div>
      <ol ref={listRef} className="stack sm" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {order.map((it, i) => {
          const right = checked && it.id === items[i].id
          const wrong = checked && !right
          const dragging = drag?.id === it.id
          return (
            <li
              key={it.id}
              className={`node ${right ? 'ok' : ''} ${wrong ? 'warn' : ''}`}
              style={{
                padding: '6px 6px 6px 4px',
                transform: dragging ? `translateY(${drag.dy}px) scale(1.02)` : undefined,
                zIndex: dragging ? 2 : undefined,
                boxShadow: dragging ? 'var(--shadow-lift)' : undefined,
                transition: dragging ? 'none' : undefined,
              }}
            >
              <span
                role="presentation"
                onPointerDown={(e) => onPointerDown(e, i, it.id)}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                style={{
                  touchAction: 'none',
                  cursor: solved ? 'default' : 'grab',
                  padding: '10px 8px',
                  color: 'var(--muted)',
                  fontSize: 18,
                }}
              >
                ⠿
              </span>
              <span className="tiny muted" style={{ width: 16, flex: 'none' }}>
                {i + 1}
              </span>
              {it.emoji && <span className="emoji">{it.emoji}</span>}
              <span className="grow small" style={{ fontWeight: 600 }}>
                {it.label}
              </span>
              {!solved && (
                <span className="row nowrap" style={{ gap: 4 }}>
                  <button
                    type="button"
                    className="btn icon small ghost"
                    aria-label={`Move ${it.label} up`}
                    disabled={i === 0}
                    onClick={() => move(i, i - 1)}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="btn icon small ghost"
                    aria-label={`Move ${it.label} down`}
                    disabled={i === order.length - 1}
                    onClick={() => move(i, i + 1)}
                  >
                    ↓
                  </button>
                </span>
              )}
            </li>
          )
        })}
      </ol>
      <div className="tiny muted">↓ {bottomLabel}</div>
      {!solved && (
        <button type="button" className="btn primary" onClick={check}>
          Check order
        </button>
      )}
      <div aria-live="polite">
        {checked && !solved && (
          <div className="callout warn pop">
            {order.filter((x, i) => x.id === items[i].id).length} of {items.length} in the right spot. The orange ones
            need to move.
          </div>
        )}
        {solved && <div className="callout good pop">✅ Exactly right. {explain}</div>}
      </div>
    </div>
  )
}
