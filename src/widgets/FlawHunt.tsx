import { useRef, useState } from 'react'

export interface FlawLine {
  /** The code line as shown. */
  code: string
  /** File header shown above this line (starts a new file block). */
  file?: string
  /** If set, this line hides a flaw. */
  flaw?: { name: string; why: string }
  /** Shown when a clean line is tapped. */
  fine?: string
}

interface Props {
  /** What the agent said it did. */
  claim: string
  lines: FlawLine[]
  onDone?: () => void
}

/**
 * An AI agent’s change, line by line. Tap the lines you’re suspicious of to
 * find the classic AI mistakes hiding in it.
 */
export function FlawHunt({ claim, lines, onDone }: Props) {
  const [tapped, setTapped] = useState<Set<number>>(new Set())
  const [last, setLast] = useState<number | null>(null)
  const fired = useRef(false)
  const total = lines.filter((l) => l.flaw).length
  const found = lines.filter((l, i) => l.flaw && tapped.has(i)).length
  const misses = [...tapped].filter((i) => !lines[i].flaw).length

  function tap(i: number) {
    setLast(i)
    const n = new Set(tapped).add(i)
    setTapped(n)
    const f = lines.filter((l, k) => l.flaw && n.has(k)).length
    if (!fired.current && f === total) {
      fired.current = true
      onDone?.()
    }
  }

  const lastLine = last !== null ? lines[last] : null

  return (
    <div className="stack">
      <div className="row nowrap" style={{ alignItems: 'flex-start', gap: 8 }}>
        <span aria-hidden="true" style={{ fontSize: 22 }}>🤖</span>
        <span className="bubble" style={{ fontSize: 14 }}>{claim}</span>
      </div>
      <div className="row between">
        <span className="kicker">Tap suspicious lines</span>
        <span className="pill" aria-live="polite">
          Found {found}/{total}
          {misses ? ` · ${misses} false alarm${misses > 1 ? 's' : ''}` : ''}
        </span>
      </div>
      <div className="stack sm" style={{ gap: 4 }}>
        {lines.map((l, i) => {
          const hit = tapped.has(i)
          return (
            <div key={i} className="stack sm" style={{ gap: 4 }}>
              {l.file && <div className="tiny muted mono" style={{ marginTop: i ? 8 : 0 }}>📄 {l.file}</div>}
              <button
                type="button"
                onClick={() => tap(i)}
                aria-label={`Line: ${l.code}`}
                className="mono"
                style={{
                  appearance: 'none',
                  textAlign: 'left',
                  minHeight: 44,
                  padding: '8px 10px',
                  borderRadius: 10,
                  fontSize: 12.5,
                  lineHeight: 1.45,
                  whiteSpace: 'pre-wrap',
                  overflowWrap: 'anywhere',
                  cursor: 'pointer',
                  border: `1.5px solid ${hit ? (l.flaw ? 'var(--bad)' : 'var(--line)') : 'var(--line)'}`,
                  background: hit ? (l.flaw ? 'var(--bad-soft)' : 'var(--surface-2)') : 'var(--surface)',
                }}
              >
                {hit && l.flaw ? '🚩 ' : ''}
                {l.code}
              </button>
            </div>
          )
        })}
      </div>
      <div aria-live="polite">
        {lastLine && (
          <div className={`callout ${lastLine.flaw ? 'bad' : 'info'} pop`} key={last}>
            {lastLine.flaw ? (
              <>
                <b>🚩 {lastLine.flaw.name}.</b> {lastLine.flaw.why}
              </>
            ) : (
              <>✅ {lastLine.fine ?? 'This line is fine. Keep looking.'}</>
            )}
          </div>
        )}
      </div>
      {found === total && <div className="callout good pop">All {total} found. Clicking around the app would likely miss every one of these. They’re found by reading the change and testing the edge cases.</div>}
    </div>
  )
}
