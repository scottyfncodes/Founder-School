import { useMemo, useState } from 'react'
import { shuffle } from '../lib/util'

export interface MatchPair {
  id: string
  left: string
  right: string
}

interface Props {
  pairs: MatchPair[]
  leftTitle?: string
  rightTitle?: string
  onDone?: () => void
}

/** Connect each term on the left with its match on the right: tap one, then the other. */
export function Matcher({ pairs, leftTitle = 'Term', rightTitle = 'Meaning', onDone }: Props) {
  const lefts = useMemo(() => shuffle(pairs), [pairs])
  const rights = useMemo(() => shuffle(pairs), [pairs])
  const [pickL, setPickL] = useState<string | null>(null)
  const [pickR, setPickR] = useState<string | null>(null)
  const [matched, setMatched] = useState<Set<string>>(new Set())
  const [miss, setMiss] = useState<{ l: string; r: string } | null>(null)
  const [msg, setMsg] = useState('')

  function attempt(l: string | null, r: string | null) {
    if (!l || !r) return
    if (l === r) {
      const next = new Set(matched).add(l)
      setMatched(next)
      setMsg(`Matched: ${pairs.find((p) => p.id === l)?.left}`)
      if (next.size === pairs.length) onDone?.()
    } else {
      setMiss({ l, r })
      setMsg('Not a match — try another pairing.')
      setTimeout(() => setMiss(null), 500)
    }
    setPickL(null)
    setPickR(null)
  }

  const done = matched.size === pairs.length

  return (
    <div className="stack">
      <div className="grid2" style={{ alignItems: 'start' }}>
        <div className="stack sm">
          <div className="kicker">{leftTitle}</div>
          {lefts.map((p) => {
            const m = matched.has(p.id)
            return (
              <button
                key={p.id}
                type="button"
                className={`chip ${m ? 'good' : ''} ${miss?.l === p.id ? 'bad' : ''}`}
                aria-pressed={pickL === p.id}
                disabled={m}
                onClick={() => {
                  setPickL(p.id)
                  attempt(p.id, pickR)
                }}
                style={{ fontWeight: 700 }}
              >
                {p.left}
              </button>
            )
          })}
        </div>
        <div className="stack sm">
          <div className="kicker">{rightTitle}</div>
          {rights.map((p) => {
            const m = matched.has(p.id)
            return (
              <button
                key={p.id}
                type="button"
                className={`chip small ${m ? 'good' : ''} ${miss?.r === p.id ? 'bad' : ''}`}
                aria-pressed={pickR === p.id}
                disabled={m}
                onClick={() => {
                  setPickR(p.id)
                  attempt(pickL, p.id)
                }}
                style={{ fontSize: 14 }}
              >
                {p.right}
              </button>
            )
          })}
        </div>
      </div>
      <p className="tiny muted" aria-live="polite">
        {done ? '✅ All connected.' : msg || 'Tap a term, then tap what it means.'}
      </p>
    </div>
  )
}
