import { useState } from 'react'
import type { Scenario } from '../lib/types'
import { SCENARIOS } from '../content/scenarios'
import { lessonById } from '../content/curriculum'
import { recordScenario, useProgress } from '../lib/store'
import { href } from '../lib/router'
import { BackLink } from '../components/bits'
import { Quiz } from '../components/Quiz'

export function ScenariosPage({ playId }: { playId?: string }) {
  const p = useProgress()
  const playing = SCENARIOS.find((s) => s.id === playId)
  if (playing) return <ScenarioPlayer key={playing.id} s={playing} />

  return (
    <main className="page">
      <div className="stack lg">
        <BackLink to="/" label="Home" />
        <header className="stack sm">
          <div className="kicker">Founder reality checks</div>
          <h1>What would you do?</h1>
          <p className="lead">Situations real founders face. No trick questions — just the decisions that matter.</p>
        </header>
        <ol className="stack sm" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {SCENARIOS.map((s, i) => {
            const res = p.scenarios[s.id]
            return (
              <li key={s.id}>
                <a href={href(`/scenarios/${s.id}`)} className="card tight row nowrap" style={{ textDecoration: 'none', gap: 14 }}>
                  <span style={{ fontSize: 30 }} aria-hidden="true">
                    {s.emoji}
                  </span>
                  <div className="grow">
                    <div className="tiny muted" style={{ fontWeight: 650 }}>
                      Scenario {i + 1}
                    </div>
                    <div style={{ fontWeight: 700, lineHeight: 1.25 }}>{s.title}</div>
                  </div>
                  <span className="pill" style={{ flex: 'none' }}>
                    {res ? (res.correct ? '🏆 Nailed it' : '✓ Done') : 'Play'}
                  </span>
                </a>
              </li>
            )
          })}
        </ol>
      </div>
    </main>
  )
}

function ScenarioPlayer({ s }: { s: Scenario }) {
  const [i, setI] = useState(0)
  const [solved, setSolved] = useState(false)
  const [done, setDone] = useState(false)
  const [allFirst, setAllFirst] = useState(true)
  const idx = SCENARIOS.indexOf(s)
  const nextS = SCENARIOS[idx + 1]
  const step = s.steps[i]

  function advance() {
    if (i < s.steps.length - 1) {
      setI(i + 1)
      setSolved(false)
      window.scrollTo({ top: 0 })
    } else {
      recordScenario(s.id, allFirst)
      setDone(true)
      window.scrollTo({ top: 0 })
    }
  }

  return (
    <main className="page">
      <div className="stack lg">
        <BackLink to="/scenarios" label="All scenarios" />
        <header className="stack sm">
          <div style={{ fontSize: 44 }} aria-hidden="true">
            {s.emoji}
          </div>
          <div className="kicker">
            Reality check {idx + 1} of {SCENARIOS.length}
          </div>
          <h2>{s.title}</h2>
          <div className="callout warn">{s.setup}</div>
        </header>

        {!done ? (
          <div className="card stack" key={i}>
            {s.steps.length > 1 && (
              <div className="tiny muted">
                Decision {i + 1} of {s.steps.length}
              </div>
            )}
            <Quiz
              kicker="Your call"
              prompt={step.prompt}
              context={step.context}
              options={step.options}
              onFirstAnswer={(ok) => {
                if (!ok) setAllFirst(false)
              }}
              onSolved={() => setSolved(true)}
            />
            {solved && (
              <button type="button" className="btn primary block" onClick={advance}>
                {i < s.steps.length - 1 ? 'Next decision →' : 'See the takeaway →'}
              </button>
            )}
          </div>
        ) : (
          <div className="stack pop">
            <div className={`callout ${allFirst ? 'good' : 'info'}`}>
              {allFirst ? '🏆 Every call right on the first try.' : '✓ Scenario complete. Replay it any time to nail it first try.'}
            </div>
            <div className="card stack sm">
              <div className="kicker">Remember this</div>
              <p className="lead" style={{ color: 'var(--ink)' }}>
                {s.takeaway}
              </p>
            </div>
            {s.lessons.length > 0 && (
              <div className="stack sm">
                <div className="kicker">Go deeper</div>
                {s.lessons.map((id) => (
                  <a key={id} className="btn small" href={href(`/lesson/${id}`)} style={{ justifyContent: 'flex-start' }}>
                    ▶ {lessonById(id)?.title ?? id}
                  </a>
                ))}
              </div>
            )}
            {nextS ? (
              <a className="btn primary block" href={href(`/scenarios/${nextS.id}`)}>
                Next scenario: {nextS.title} →
              </a>
            ) : (
              <a className="btn primary block" href={href('/capstone')}>
                Ready for the capstone →
              </a>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
