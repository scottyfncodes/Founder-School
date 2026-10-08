import { useState } from 'react'
import { SKILLS, WORLDS } from '../content/curriculum'
import { resetProgress, useProgress } from '../lib/store'
import { LEVELS, overall, skillScores } from '../lib/levels'
import { href } from '../lib/router'
import { LevelDot, Meter } from '../components/bits'
import type { Level } from '../lib/types'

export function ProgressPage() {
  const p = useProgress()
  const o = overall(p)
  const scores = skillScores(p)
  const [confirm, setConfirm] = useState(false)
  const [resetDone, setResetDone] = useState(false)
  const counts = LEVELS.map((l) => Object.values(p.concepts).filter((v) => v === l.level).length)
  const quizzes = Object.values(p.quizzes)
  const firstTry = quizzes.filter((q) => q.correct).length

  return (
    <main className="page">
      <div className="stack xl">
        <header className="stack sm">
          <div className="kicker">Your progress</div>
          <h1>What you’ve proven</h1>
          <p className="lead">Completion alone doesn’t level you up. Getting challenges right on the first try does.</p>
        </header>

        <section className="card stack">
          <div className="kicker">The four levels</div>
          {LEVELS.slice(1).map((l) => (
            <div key={l.level} className="row nowrap" style={{ gap: 12, alignItems: 'flex-start' }}>
              <span
                style={{ width: 12, height: 12, borderRadius: '50%', background: l.color, marginTop: 6, flex: 'none' }}
                aria-hidden="true"
              />
              <div className="grow">
                <b>{l.name}</b> <span className="small muted">· {counts[l.level]} concepts</span>
                <div className="small ink2">“{l.claim}”</div>
                <div className="tiny muted">
                  {l.level === 1
                    ? 'Earned by completing the lesson that introduces it.'
                    : `Earned by a first-try correct answer on a “proves ${l.name}” challenge.`}
                </div>
              </div>
            </div>
          ))}
          <hr className="divider" />
          <div className="grid2">
            <div className="stat">
              <span className="v">{o.mastered}</span>
              <span className="l">Concepts at Founder+</span>
            </div>
            <div className="stat">
              <span className="v">
                {firstTry}/{quizzes.length}
              </span>
              <span className="l">Challenges right first try</span>
            </div>
          </div>
        </section>

        <section className="stack">
          <h2>Skills</h2>
          <div className="card stack">
            {SKILLS.map((s) => (
              <div key={s.id} className="stack" style={{ gap: 4 }}>
                <div className="row between small">
                  <span>{s.label}</span>
                  <b>{scores[s.id]}%</b>
                </div>
                <Meter value={scores[s.id] / 100} label={s.label} />
              </div>
            ))}
            {p.capstone ? (
              <a className="btn small" href={href('/capstone')}>
                View your Software Founder Readiness Report →
              </a>
            ) : (
              <p className="tiny muted">Finish the capstone simulation to get your full readiness report.</p>
            )}
          </div>
        </section>

        <section className="stack">
          <h2>Concepts by world</h2>
          {WORLDS.map((w) => (
            <details key={w.id} className="card tight">
              <summary style={{ cursor: 'pointer', fontWeight: 700, minHeight: 32, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span aria-hidden="true">{w.emoji}</span>
                <span className="grow">{w.title}</span>
                <span className="row nowrap" style={{ gap: 2 }} aria-hidden="true">
                  {w.concepts.map((c) => (
                    <span
                      key={c.id}
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        background: LEVELS[(p.concepts[c.id] ?? 0) as Level].color,
                      }}
                    />
                  ))}
                </span>
              </summary>
              <div className="stack sm" style={{ paddingTop: 10 }}>
                {w.concepts.map((c) => (
                  <div key={c.id} className="row nowrap between">
                    <span className="small">{c.name}</span>
                    <LevelDot level={p.concepts[c.id] ?? 0} />
                  </div>
                ))}
                <a className="btn small" href={href(`/world/${w.id}`)}>
                  Open world →
                </a>
              </div>
            </details>
          ))}
        </section>

        <section className="card stack sm">
          <div className="kicker">Start over</div>
          <p className="small ink2">
            Progress is saved only on this device (no account needed). Resetting erases lessons, levels, scenarios and
            your capstone report.
          </p>
          {resetDone && <div className="callout good">Progress reset. Fresh start.</div>}
          {!confirm ? (
            <button type="button" className="btn" onClick={() => { setConfirm(true); setResetDone(false) }}>
              Reset all progress…
            </button>
          ) : (
            <div className="row">
              <button
                type="button"
                className="btn danger"
                onClick={() => {
                  resetProgress()
                  setConfirm(false)
                  setResetDone(true)
                }}
              >
                Yes, erase everything
              </button>
              <button type="button" className="btn" onClick={() => setConfirm(false)}>
                Cancel
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
