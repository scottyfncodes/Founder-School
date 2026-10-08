import { useState } from 'react'

export interface Stage {
  id: string
  emoji: string
  label: string
  /** What happens at this stage. */
  what: string
  /** Optional "what if it goes wrong here?" reveal. */
  fail?: string
}

interface Props {
  stages: Stage[]
  onDone?: () => void
}

/** A vertical pipeline. Tap each stage to open it; flip to "What can go wrong?" where offered. */
export function StageExplorer({ stages, onDone }: Props) {
  const [openId, setOpenId] = useState<string | null>(null)
  const [seen, setSeen] = useState<Set<string>>(new Set())
  const [failView, setFailView] = useState<Set<string>>(new Set())

  function open(id: string) {
    setOpenId(openId === id ? null : id)
    if (!seen.has(id)) {
      const next = new Set(seen).add(id)
      setSeen(next)
      if (next.size === stages.length) onDone?.()
    }
  }

  return (
    <div className="stack sm" style={{ gap: 0 }}>
      {stages.map((s, i) => {
        const isOpen = openId === s.id
        const showFail = failView.has(s.id)
        return (
          <div key={s.id}>
            <button
              type="button"
              className={`node ${isOpen ? 'active' : seen.has(s.id) ? 'ok' : ''}`}
              aria-expanded={isOpen}
              onClick={() => open(s.id)}
            >
              <span className="emoji">{s.emoji}</span>
              <span className="grow">{s.label}</span>
              <span className="tiny muted">{seen.has(s.id) ? '✓' : 'tap'}</span>
            </button>
            {isOpen && (
              <div className="card tight flat stack sm pop" style={{ margin: '8px 0 0' }}>
                <p className="small">{showFail && s.fail ? s.fail : s.what}</p>
                {s.fail && (
                  <button
                    type="button"
                    className={`btn small ${showFail ? '' : 'danger'}`}
                    onClick={() => {
                      const n = new Set(failView)
                      if (showFail) n.delete(s.id)
                      else n.add(s.id)
                      setFailView(n)
                    }}
                  >
                    {showFail ? '← Back to normal' : '💥 What can go wrong here?'}
                  </button>
                )}
              </div>
            )}
            {i < stages.length - 1 && <div className={`link ${seen.has(s.id) ? 'active' : ''}`} />}
          </div>
        )
      })}
      <p className="tiny muted" style={{ marginTop: 10 }}>
        {seen.size}/{stages.length} stages explored
      </p>
    </div>
  )
}
