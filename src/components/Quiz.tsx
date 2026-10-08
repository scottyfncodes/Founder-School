import { useMemo, useRef, useState } from 'react'
import type { QuizOption } from '../lib/types'
import { levelInfo } from '../lib/levels'

interface Props {
  prompt: string
  context?: string
  options: QuizOption[]
  level?: 2 | 3 | 4
  /** Called once, on the first answer, with whether it was right. */
  onFirstAnswer?: (correct: boolean) => void
  /** Called when the learner reaches the correct answer. */
  onSolved?: () => void
  kicker?: string
}

const LETTERS = 'ABCDEFG'

/**
 * A tiny challenge. Wrong answers explain why and let you try again;
 * the right answer reveals the reasoning behind every option.
 */
export function Quiz({ prompt, context, options, level, onFirstAnswer, onSolved, kicker }: Props) {
  const [tried, setTried] = useState<number[]>([])
  const [solved, setSolved] = useState(false)
  const first = useRef(true)
  const correctIdx = useMemo(() => options.findIndex((o) => o.correct), [options])
  const last = tried[tried.length - 1]

  function pick(i: number) {
    if (solved || tried.includes(i)) return
    const right = i === correctIdx
    if (first.current) {
      first.current = false
      onFirstAnswer?.(right)
    }
    setTried([...tried, i])
    if (right) {
      setSolved(true)
      onSolved?.()
    }
  }

  return (
    <div className="stack">
      <div className="row between">
        <span className="kicker">{kicker ?? 'Challenge'}</span>
        {level && (
          <span className="pill" style={{ color: levelInfo(level).color }}>
            {levelInfo(level).emoji} proves {levelInfo(level).name}
          </span>
        )}
      </div>
      {context && <div className="well small ink2">{context}</div>}
      <h3 style={{ fontSize: 20, lineHeight: 1.3 }}>{prompt}</h3>
      <div className="stack sm" role="group" aria-label="Answer options">
        {options.map((o, i) => {
          const wasTried = tried.includes(i)
          const isRight = i === correctIdx
          const cls = wasTried ? (isRight ? 'good' : 'bad') : solved && isRight ? 'good' : ''
          return (
            <div key={i} className="stack sm">
              <button
                type="button"
                className={`chip ${cls}`}
                disabled={solved || wasTried}
                onClick={() => pick(i)}
                style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '12px 14px', opacity: 1 }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    flex: 'none',
                    width: 26,
                    height: 26,
                    borderRadius: 8,
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 13,
                    fontWeight: 700,
                    background: 'var(--surface-2)',
                  }}
                >
                  {wasTried ? (isRight ? '✓' : '✕') : LETTERS[i]}
                </span>
                <span>{o.text}</span>
              </button>
              {solved && i !== last && (
                <p className="tiny muted" style={{ padding: '0 6px 0 42px' }}>
                  {o.why}
                </p>
              )}
            </div>
          )
        })}
      </div>
      <div aria-live="polite">
        {last !== undefined && (
          <div className={`callout ${last === correctIdx ? 'good' : 'bad'} pop`} key={last}>
            <b>
              {last === correctIdx
                ? tried.length === 1
                  ? 'Right — and here’s why. '
                  : 'There it is. '
                : 'Not quite. '}
            </b>
            {options[last].why}
            {last !== correctIdx && <span className="muted"> Try another answer.</span>}
          </div>
        )}
      </div>
    </div>
  )
}
