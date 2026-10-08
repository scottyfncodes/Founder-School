import { useMemo, useState } from 'react'
import { shuffle } from '../lib/util'

export interface Bucket {
  id: string
  label: string
  emoji?: string
}

export interface CatItem {
  id: string
  label: string
  bucket: string
  /** Why it belongs there — shown after it's placed. */
  why: string
}

interface Props {
  buckets: Bucket[]
  items: CatItem[]
  onDone?: () => void
}

/** Tap an item, then tap the bucket it belongs in. */
export function Categorize({ buckets, items, onDone }: Props) {
  const pool = useMemo(() => shuffle(items), [items])
  const [placed, setPlaced] = useState<Record<string, string>>({})
  const [sel, setSel] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ tone: 'good' | 'bad'; text: string } | null>(null)

  const remaining = pool.filter((i) => !placed[i.id])
  const current = sel ?? remaining[0]?.id ?? null

  function drop(bucketId: string) {
    const item = items.find((i) => i.id === current)
    if (!item) return
    if (item.bucket === bucketId) {
      const next = { ...placed, [item.id]: bucketId }
      setPlaced(next)
      setSel(null)
      setFeedback({ tone: 'good', text: `✅ ${item.label}: ${item.why}` })
      if (Object.keys(next).length === items.length) onDone?.()
    } else {
      const b = buckets.find((x) => x.id === bucketId)
      setFeedback({ tone: 'bad', text: `Not quite — "${item.label}" doesn't belong in ${b?.label}. Try another.` })
    }
  }

  return (
    <div className="stack">
      {remaining.length > 0 && (
        <div className="stack sm">
          <div className="kicker">
            Sort these ({remaining.length} left) — tap one, then a bucket
          </div>
          <div className="row">
            {remaining.map((i) => (
              <button
                key={i.id}
                type="button"
                className="chip"
                aria-pressed={current === i.id}
                onClick={() => setSel(i.id)}
              >
                {i.label}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className={buckets.length === 2 || buckets.length === 4 ? 'grid2' : 'grid3'}>
        {buckets.map((b) => (
          <button
            key={b.id}
            type="button"
            className="card tight flat stack sm"
            onClick={() => drop(b.id)}
            disabled={remaining.length === 0}
            aria-label={`Put in ${b.label}`}
            style={{ textAlign: 'left', cursor: remaining.length ? 'pointer' : 'default', minHeight: 96, alignItems: 'stretch' }}
          >
            <div style={{ fontWeight: 700, fontSize: 15 }}>
              {b.emoji} {b.label}
            </div>
            <div className="row" style={{ gap: 4 }}>
              {items
                .filter((i) => placed[i.id] === b.id)
                .map((i) => (
                  <span key={i.id} className="pill pop" style={{ whiteSpace: 'normal' }}>
                    {i.label}
                  </span>
                ))}
            </div>
          </button>
        ))}
      </div>
      <div aria-live="polite">
        {feedback && (
          <div className={`callout ${feedback.tone} pop`} key={feedback.text}>
            {feedback.text}
          </div>
        )}
      </div>
    </div>
  )
}
