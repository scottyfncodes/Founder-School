import { useMemo, useState } from 'react'
import { ARCH, LAYERS, neighbors } from '../content/architecture'
import { lessonById } from '../content/curriculum'
import { href } from '../lib/router'
import { useProgress } from '../lib/store'

interface Props {
  /** Only show these components (e.g. inside a lesson). Default: all. */
  only?: string[]
  /** Treat every component as unlocked. */
  revealAll?: boolean
  /** Called when the learner has opened N distinct components. */
  onExplored?: (count: number) => void
  initial?: string
}

/**
 * The interactive architecture diagram. Tap a box: it highlights, its
 * connections light up, and a panel explains it.
 */
export function ArchMap({ only, revealAll, onExplored, initial }: Props) {
  const progress = useProgress()
  const [sel, setSel] = useState<string | null>(initial ?? null)
  const [seen, setSeen] = useState<Set<string>>(new Set())
  const comps = useMemo(() => (only ? ARCH.filter((c) => only.includes(c.id)) : ARCH), [only])
  const unlocked = (lessonId: string) => revealAll || !!progress.lessons[lessonId]
  const selected = ARCH.find((c) => c.id === sel) ?? null
  const near = selected ? neighbors(selected.id) : { ins: [], outs: [] }
  const name = (id: string) => ARCH.find((c) => c.id === id)?.name ?? id

  function pick(id: string) {
    setSel(id === sel ? null : id)
    if (!seen.has(id)) {
      const next = new Set(seen).add(id)
      setSeen(next)
      onExplored?.(next.size)
    }
  }

  return (
    <div className="stack">
      <div className="stack sm">
        {LAYERS.map((layer) => {
          const items = comps.filter((c) => c.layer === layer.id)
          if (!items.length) return null
          return (
            <section key={layer.id} className="stack sm" aria-label={layer.label}>
              <div className="kicker">{layer.label}</div>
              <div className="row" style={{ gap: 6 }}>
                {items.map((c) => {
                  const open = unlocked(c.lesson)
                  const isSel = sel === c.id
                  const isNear = near.ins.includes(c.id) || near.outs.includes(c.id)
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => pick(c.id)}
                      aria-pressed={isSel}
                      aria-label={open ? c.name : `${c.name} (locked)`}
                      className={`node ${isSel ? 'active' : isNear ? 'ok' : selected ? 'dim' : ''}`}
                      style={{
                        width: 'auto',
                        minHeight: 44,
                        padding: '8px 12px',
                        fontSize: 14,
                        borderStyle: open ? 'solid' : 'dashed',
                        opacity: open || isSel ? undefined : 0.6,
                        cursor: 'pointer',
                      }}
                    >
                      <span aria-hidden="true" style={{ fontSize: 18 }}>
                        {open ? c.emoji : '🔒'}
                      </span>
                      {c.name}
                    </button>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>

      <div aria-live="polite">
        {selected ? (
          unlocked(selected.lesson) ? (
            <div className="card stack pop" key={selected.id}>
              <div className="row nowrap">
                <span style={{ fontSize: 32 }} aria-hidden="true">
                  {selected.emoji}
                </span>
                <div className="grow">
                  <h3>{selected.name}</h3>
                  <p className="small ink2">{selected.what}</p>
                </div>
              </div>
              <div className="grid2">
                <div className="well stack sm">
                  <div className="kicker">⬇ Goes in</div>
                  <p className="small">{selected.input}</p>
                  {near.ins.length > 0 && <p className="tiny muted">From: {near.ins.map(name).join(', ')}</p>}
                </div>
                <div className="well stack sm">
                  <div className="kicker">⬆ Comes out</div>
                  <p className="small">{selected.output}</p>
                  {near.outs.length > 0 && <p className="tiny muted">To: {near.outs.map(name).join(', ')}</p>}
                </div>
              </div>
              <div className="callout bad">
                <b>💥 If it fails: </b>
                {selected.fails}
              </div>
              <div className="callout info">
                <b>🧭 Why you care: </b>
                {selected.care}
              </div>
              <a className="btn small" href={href(`/lesson/${selected.lesson}`)}>
                Lesson: {lessonById(selected.lesson)?.title ?? 'Open lesson'} →
              </a>
            </div>
          ) : (
            <div className="card stack pop" key={selected.id + '-locked'}>
              <h3>🔒 {selected.name}</h3>
              <p className="small ink2">
                You’ll unlock this box in the lesson “{lessonById(selected.lesson)?.title}”.
              </p>
              <a className="btn primary small" href={href(`/lesson/${selected.lesson}`)}>
                Go to lesson →
              </a>
            </div>
          )
        ) : (
          <p className="small muted center">Tap any box to see what it does, what flows through it, and what breaks.</p>
        )}
      </div>
    </div>
  )
}
