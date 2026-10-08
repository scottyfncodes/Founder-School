import { useEffect, useRef, useState } from 'react'
import { wait } from '../lib/motion'

export interface ChatQuestion {
  id: string
  /** What the founder asks. */
  q: string
  strong: boolean
  /** The agent’s reply. */
  reply: string
  /** Optional evidence block (diff, test output, code) shown in the reply. */
  evidence?: string
  /** Short label of the gap this question exposes, if any. */
  gap?: string
  /** For weak questions: why it doesn’t help. For strong ones: what made it work. */
  lesson: string
}

interface Props {
  /** The agent’s opening claim. */
  claim: string
  /** One line of setup shown above the chat. */
  setup?: string
  questions: ChatQuestion[]
  /** How many follow-ups the founder gets. */
  budget: number
  onDone?: () => void
}

type Msg = { from: 'agent' | 'you'; text: string; evidence?: string; gap?: string }

/**
 * A simulated chat with an AI coding agent. The founder picks follow-up
 * questions; strong, specific ones expose real gaps, vague ones get
 * confident reassurance. Ends with a scorecard.
 */
export function AgentChat({ claim, setup, questions, budget, onDone }: Props) {
  const [msgs, setMsgs] = useState<Msg[]>([{ from: 'agent', text: claim }])
  const [asked, setAsked] = useState<string[]>([])
  const [typing, setTyping] = useState(false)
  const [round, setRound] = useState(0)
  const runId = useRef(0)
  const fired = useRef(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => () => void runId.current++, [])

  const gaps = questions.filter((q) => q.gap)
  const found = gaps.filter((q) => asked.includes(q.id))
  const left = budget - asked.length
  const over = !typing && (left === 0 || found.length === gaps.length)
  const strongCount = asked.filter((id) => questions.find((q) => q.id === id)?.strong).length

  async function ask(q: ChatQuestion) {
    if (typing || over || asked.includes(q.id)) return
    const my = runId.current
    const nextAsked = [...asked, q.id]
    setAsked(nextAsked)
    setMsgs((m) => [...m, { from: 'you', text: q.q }])
    setTyping(true)
    await wait(900)
    if (runId.current !== my) return
    setTyping(false)
    setMsgs((m) => [...m, { from: 'agent', text: q.reply, evidence: q.evidence, gap: q.gap }])
    const nFound = gaps.filter((g) => nextAsked.includes(g.id)).length
    if (!fired.current && (nextAsked.length >= budget || nFound === gaps.length)) {
      fired.current = true
      onDone?.()
    }
  }

  useEffect(() => {
    if (msgs.length > 1 || typing) endRef.current?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' })
  }, [msgs.length, typing])

  function reset() {
    runId.current++
    setMsgs([{ from: 'agent', text: claim }])
    setAsked([])
    setTyping(false)
    setRound((r) => r + 1)
  }

  const grade =
    found.length === gaps.length
      ? { tone: 'good', text: '🏅 Every gap exposed. This is exactly how a strong technical lead questions an agent.' }
      : found.length >= Math.ceil(gaps.length / 2)
        ? { tone: 'warn', text: '👍 Good digging — but some gaps would have shipped. Look at what you missed below.' }
        : { tone: 'bad', text: '😬 The agent sounded sure, and most of the problems would have shipped. Specific questions get specific answers.' }

  return (
    <div className="stack">
      {setup && <div className="well small ink2">{setup}</div>}
      <div className="stack sm" aria-live="polite" key={round}>
        {msgs.map((m, i) =>
          m.from === 'agent' ? (
            <div key={i} className="row nowrap pop" style={{ alignItems: 'flex-start', gap: 8 }}>
              <span aria-hidden="true" style={{ fontSize: 22, lineHeight: 1.2 }}>
                🤖
              </span>
              <div className="stack sm" style={{ minWidth: 0, gap: 6 }}>
                <span className="sr-only">Agent says:</span>
                <span className="bubble" style={{ fontSize: 14.5, borderTopLeftRadius: 4 }}>
                  {m.text}
                </span>
                {m.evidence && <div className="code" style={{ fontSize: 12 }}>{m.evidence}</div>}
                {m.gap && (
                  <span className="pill" style={{ background: 'var(--bad-soft)', color: 'var(--bad)', whiteSpace: 'normal', alignSelf: 'flex-start' }}>
                    🚩 Gap exposed: {m.gap}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div key={i} className="row nowrap pop" style={{ justifyContent: 'flex-end' }}>
              <span className="sr-only">You ask:</span>
              <span className="bubble req" style={{ fontSize: 14.5, borderTopRightRadius: 4, maxWidth: '85%' }}>
                {m.text}
              </span>
            </div>
          ),
        )}
        {typing && (
          <div className="row nowrap" style={{ gap: 8 }}>
            <span aria-hidden="true" style={{ fontSize: 22 }}>
              🤖
            </span>
            <span className="bubble pulse" aria-label="Agent is typing">
              • • •
            </span>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {!over && (
        <div className="stack sm">
          <div className="row between">
            <span className="kicker">Your follow-up</span>
            <span className="pill">
              {left} question{left === 1 ? '' : 's'} left
            </span>
          </div>
          {questions
            .filter((q) => !asked.includes(q.id))
            .map((q) => (
              <button key={q.id} type="button" className="chip" disabled={typing} onClick={() => ask(q)}>
                “{q.q}”
              </button>
            ))}
        </div>
      )}

      {over && (
        <div className="stack sm pop">
          <div className="grid2">
            <div className="stat">
              <span className="v">
                {found.length}/{gaps.length}
              </span>
              <span className="l">gaps exposed</span>
            </div>
            <div className="stat">
              <span className="v">
                {strongCount}/{asked.length}
              </span>
              <span className="l">strong questions</span>
            </div>
          </div>
          <div className={`callout ${grade.tone}`}>{grade.text}</div>
          <div className="kicker">Debrief</div>
          {questions.map((q) => {
            const was = asked.includes(q.id)
            if (!was && !q.gap) return null
            return (
              <div key={q.id} className={`card tight flat stack sm`} style={{ gap: 4 }}>
                <div className="small" style={{ fontWeight: 650 }}>
                  {was ? (q.strong ? '✅ You asked' : '⚠️ You asked') : '❌ Missed'}: “{q.q}”
                </div>
                {!was && q.gap && <div className="tiny bad-text">Would have exposed: {q.gap}</div>}
                <div className="tiny ink2">{q.lesson}</div>
              </div>
            )
          })}
          <button type="button" className="btn small" onClick={reset}>
            ↺ Try the conversation again
          </button>
        </div>
      )}
    </div>
  )
}
