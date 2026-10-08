import { useState } from 'react'

/* Model: each sprint has 10 team-days. Every unit of debt costs 0.6 days per sprint in "interest"
   (bugs, workarounds, scary code). A proper feature costs 5 days; a shortcut feature costs 2.5 days
   but adds 1 unit of debt. Paying down removes 1 unit of debt per 2 days. */
const DAYS = 10
const INTEREST = 0.6
const SPRINTS = 10
const DEMO_SPRINT = 3
const DEMO_TARGET = 7

type Move = 'shortcut' | 'proper' | 'paydown'

interface SprintResult {
  move: Move
  capacity: number
  interest: number
  shipped: number
  debtAfter: number
}

function playSprint(debt: number, move: Move): SprintResult {
  const interest = Math.min(DAYS, debt * INTEREST)
  const capacity = DAYS - interest
  if (move === 'shortcut') {
    const shipped = capacity / 2.5
    return { move, capacity, interest, shipped, debtAfter: debt + shipped }
  }
  if (move === 'proper') return { move, capacity, interest, shipped: capacity / 5, debtAfter: debt }
  const repaid = Math.min(debt, capacity / 2)
  const leftover = capacity - repaid * 2
  return { move, capacity, interest, shipped: leftover / 5, debtAfter: debt - repaid }
}

function playAll(moves: Move[]) {
  let debt = 0
  let total = 0
  let atDemo = 0
  moves.forEach((m, i) => {
    const r = playSprint(debt, m)
    debt = r.debtAfter
    total += r.shipped
    if (i === DEMO_SPRINT - 1) atDemo = total
  })
  return { total, debt, atDemo }
}

const MOVES: { id: Move; emoji: string; label: string; text: string }[] = [
  { id: 'shortcut', emoji: '⚡', label: 'Take shortcuts', text: 'Twice the features, but each one adds debt.' },
  { id: 'proper', emoji: '🧱', label: 'Build it properly', text: 'Normal speed, no new debt.' },
  { id: 'paydown', emoji: '🧹', label: 'Pay down debt', text: 'Clean up and fix. Few features this sprint.' },
]

const f1 = (n: number) => n.toFixed(1)

export function DebtSim({ onDone }: { onDone?: () => void }) {
  const [log, setLog] = useState<SprintResult[]>([])
  const debt = log.length ? log[log.length - 1].debtAfter : 0
  const total = log.reduce((s, r) => s + r.shipped, 0)
  const sprint = log.length
  const over = sprint >= SPRINTS
  const nextInterest = Math.min(DAYS, debt * INTEREST)
  const atDemo = log.slice(0, DEMO_SPRINT).reduce((s, r) => s + r.shipped, 0)
  const demoPassed = atDemo >= DEMO_TARGET

  function play(m: Move) {
    if (over) return
    const next = [...log, playSprint(debt, m)]
    setLog(next)
    if (next.length === SPRINTS) onDone?.()
  }

  const allProper = playAll(Array(SPRINTS).fill('proper'))
  const allShort = playAll(Array(SPRINTS).fill('shortcut'))
  const smart = playAll(['shortcut', 'shortcut', 'proper', 'paydown', 'paydown', 'proper', 'proper', 'proper', 'proper', 'proper'])
  const maxBar = DAYS / 2.5

  return (
    <div className="stack">
      <div className="well small ink2">
        🎯 Investor demo after sprint {DEMO_SPRINT}: show <b>{DEMO_TARGET} features</b>. Then keep shipping until sprint {SPRINTS}. Each sprint
        = {DAYS} team-days; every unit of debt eats {INTEREST} days per sprint.
      </div>

      <div className="grid3">
        <div className="stat">
          <span className="v">
            {Math.min(sprint, SPRINTS)}/{SPRINTS}
          </span>
          <span className="l">Sprint</span>
        </div>
        <div className="stat">
          <span className="v">{f1(total)}</span>
          <span className="l">Features shipped</span>
        </div>
        <div className="stat">
          <span className={`v ${debt >= 8 ? 'bad-text' : debt >= 3 ? 'warn-text' : ''}`}>{f1(debt)}</span>
          <span className="l">Debt</span>
        </div>
      </div>

      <div className="stack sm">
        <div className="row between small">
          <span>Team speed next sprint</span>
          <b className="mono">{Math.round(((DAYS - nextInterest) / DAYS) * 100)}%</b>
        </div>
        <div className="meter" aria-hidden="true">
          <span
            style={{
              width: `${((DAYS - nextInterest) / DAYS) * 100}%`,
              background: nextInterest > 4 ? 'var(--bad)' : nextInterest > 1.5 ? 'var(--warn)' : 'var(--good)',
            }}
          />
        </div>
        <span className="tiny muted">
          Interest: {f1(nextInterest)} of {DAYS} days go to bugs and workarounds before any new work starts.
        </span>
      </div>

      {!over && (
        <div className="stack sm" role="group" aria-label="Choose this sprint’s approach">
          <div className="kicker">Sprint {sprint + 1}: how will you build?</div>
          {MOVES.map((m) => (
            <button key={m.id} type="button" className="chip" onClick={() => play(m.id)} disabled={m.id === 'paydown' && debt === 0}>
              <b>
                {m.emoji} {m.label}
              </b>
              <span className="tiny muted" style={{ display: 'block' }}>
                {m.id === 'paydown' && debt === 0 ? 'No debt to pay down yet.' : m.text}
              </span>
            </button>
          ))}
        </div>
      )}

      {log.length > 0 && (
        <div className="card tight flat stack sm">
          <div className="kicker">Features shipped per sprint</div>
          <div
            className="row nowrap"
            style={{ alignItems: 'flex-end', height: 90, gap: 4 }}
            role="img"
            aria-label={`Features per sprint: ${log.map((r) => f1(r.shipped)).join(', ')}`}
          >
            {Array.from({ length: SPRINTS }, (_, i) => {
              const r = log[i]
              return (
                <div key={i} className="grow stack" style={{ gap: 2, alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                  <span className="tiny muted mono" style={{ fontSize: 10 }}>
                    {r ? f1(r.shipped) : ''}
                  </span>
                  <div
                    style={{
                      width: '100%',
                      height: r ? `${Math.max(2, (r.shipped / maxBar) * 60)}px` : 2,
                      background: r ? (r.move === 'shortcut' ? 'var(--lv4)' : r.move === 'proper' ? 'var(--info)' : 'var(--lv3)') : 'var(--line)',
                      borderRadius: '4px 4px 0 0',
                    }}
                  />
                </div>
              )
            })}
          </div>
          <div className="row" style={{ gap: 10 }}>
            {MOVES.map((m) => (
              <span key={m.id} className="tiny ink2 row nowrap" style={{ gap: 4 }}>
                <span
                  aria-hidden="true"
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 3,
                    background: m.id === 'shortcut' ? 'var(--lv4)' : m.id === 'proper' ? 'var(--info)' : 'var(--lv3)',
                  }}
                />
                {m.label}
              </span>
            ))}
          </div>
          <div aria-live="polite" className="small ink2">
            {(() => {
              const r = log[log.length - 1]
              const verb = r.move === 'shortcut' ? `+${f1(r.shipped)} debt` : r.move === 'paydown' ? 'debt reduced' : 'no new debt'
              return `Sprint ${log.length}: shipped ${f1(r.shipped)} features (${verb}). Interest ate ${f1(r.interest)} days.`
            })()}
          </div>
        </div>
      )}

      {sprint >= DEMO_SPRINT && (
        <div className={`callout ${demoPassed ? 'good' : 'bad'} small`}>
          <b>Investor demo: {f1(atDemo)} features.</b>{' '}
          {demoPassed
            ? 'You hit the target. Shortcuts bought you speed when it mattered.'
            : `Short of ${DEMO_TARGET}. Sometimes borrowing (shortcuts) is the right call for a deadline.`}
        </div>
      )}

      {over && (
        <div className="stack sm pop">
          <div className="callout info small">
            <b>Final: {f1(total)} features, {f1(debt)} debt left.</b> Compare:
            <br />🧱 Always proper: {f1(allProper.total)} features — but only {f1(allProper.atDemo)} at the demo.
            <br />⚡ Always shortcuts: {f1(allShort.total)} features, ending with {f1(allShort.debt)} debt and a crawling team.
            <br />🧹 Borrow, then repay (2 shortcuts, 1 proper, 2 pay-downs, then proper): {f1(smart.total)} features and {f1(smart.atDemo)} at
            the demo.
          </div>
          <button type="button" className="btn small" onClick={() => setLog([])}>
            ↺ Play again with a different strategy
          </button>
        </div>
      )}
    </div>
  )
}
