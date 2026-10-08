import { WORLDS, nextLesson, worldOfLesson } from '../content/curriculum'
import { SCENARIOS } from '../content/scenarios'
import { ARCH } from '../content/architecture'
import { useProgress } from '../lib/store'
import { LEVELS, overall } from '../lib/levels'
import { href } from '../lib/router'
import { Meter, Ring } from '../components/bits'
import { inkOn } from '../lib/theme'

export function Home() {
  const p = useProgress()
  const o = overall(p)
  const next = nextLesson(p.lessons)
  const nextWorld = next ? worldOfLesson(next.id) : undefined
  const lessonsDone = Object.keys(p.lessons).length
  const lessonsTotal = WORLDS.reduce((s, w) => s + w.lessons.length, 0)
  const scenariosDone = Object.keys(p.scenarios).length
  const unlocked = ARCH.filter((c) => p.lessons[c.lesson]).length
  const rank = LEVELS[o.rank]
  const nextRank = LEVELS[Math.min(4, o.rank + 1)]

  return (
    <main className="page wide">
      <div className="stack xl">
        <header className="stack sm" style={{ paddingTop: 12 }}>
          <div className="kicker">Software Founder School</div>
          <h1>Learn how the machine works.</h1>
          <p className="lead">
            Enough to make great founder decisions, question your AI agents, and spot risks before they bite.
          </p>
        </header>

        <section className="grid-home">
          <div className="card stack">
            <div className="row between">
              <div className="kicker">Current level</div>
              <a href={href('/progress')} className="tiny muted">
                How levels work →
              </a>
            </div>
            <div className="row nowrap" style={{ gap: 12 }}>
              <span style={{ fontSize: 34 }} aria-hidden="true">
                {o.rank === 0 ? '🌱' : rank.emoji}
              </span>
              <div className="grow stack" style={{ gap: 6 }}>
                <div style={{ fontWeight: 700, fontSize: 20 }}>{o.rank === 0 ? 'Just getting started' : rank.name}</div>
                <Meter value={o.rank === 4 ? 1 : o.toNext} color={o.rank === 0 ? undefined : rank.color} label="Progress to next level" />
                <div className="tiny muted">
                  {o.rank === 4 ? 'Top level reached.' : `Next: ${nextRank.emoji} ${nextRank.name} — “${nextRank.claim}”`}
                </div>
              </div>
            </div>
            <div className="grid3">
              <div className="stat">
                <span className="v">
                  {lessonsDone}
                  <span className="tiny muted">/{lessonsTotal}</span>
                </span>
                <span className="l">Lessons</span>
              </div>
              <div className="stat">
                <span className="v">
                  {o.mastered}
                  <span className="tiny muted">/{o.total}</span>
                </span>
                <span className="l">Concepts mastered</span>
              </div>
              <div className="stat">
                <span className="v">
                  {scenariosDone}
                  <span className="tiny muted">/{SCENARIOS.length}</span>
                </span>
                <span className="l">Scenarios</span>
              </div>
            </div>
          </div>

          {next && nextWorld ? (
            <a
              href={href(`/lesson/${next.id}`)}
              className="card stack"
              style={{
                textDecoration: 'none',
                background: nextWorld.color,
                borderColor: nextWorld.color,
                color: inkOn(nextWorld.color),
              }}
            >
              <div className="kicker" style={{ color: 'inherit', opacity: 0.8 }}>
                {lessonsDone === 0 ? 'Start here' : 'Next lesson'} · World {nextWorld.num}
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, lineHeight: 1.15, fontWeight: 600 }}>
                {next.title}
              </div>
              <div style={{ opacity: 0.9 }}>{next.subtitle}</div>
              <div className="row between" style={{ marginTop: 'auto' }}>
                <span className="pill" style={{ background: 'color-mix(in srgb, currentColor 18%, transparent)', color: 'inherit' }}>
                  ⏱ {next.minutes} min
                </span>
                <span style={{ fontWeight: 700 }}>Start →</span>
              </div>
            </a>
          ) : (
            <a href={href('/capstone')} className="card stack" style={{ textDecoration: 'none' }}>
              <div className="kicker">All lessons complete</div>
              <h2>Build a software company</h2>
              <p className="ink2">Put it all together in the capstone simulation.</p>
            </a>
          )}
        </section>

        <section className="stack">
          <div className="row between">
            <h2>The curriculum</h2>
            <span className="tiny muted">12 worlds</span>
          </div>
          <ol className="world-path" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {WORLDS.map((w, idx) => {
              const done = w.lessons.filter((l) => p.lessons[l.id]).length
              const ratio = w.lessons.length ? done / w.lessons.length : 0
              const isNext = nextWorld?.id === w.id
              return (
                <li key={w.id} style={{ ['--i' as string]: idx }}>
                  <a
                    href={href(`/world/${w.id}`)}
                    className="card tight row nowrap world-tile"
                    style={{
                      textDecoration: 'none',
                      gap: 12,
                      borderColor: isNext ? w.color : undefined,
                      boxShadow: isNext ? `0 0 0 3px color-mix(in srgb, ${w.color} 22%, transparent)` : undefined,
                    }}
                  >
                    <Ring value={ratio} color={w.color}>
                      {ratio === 1 ? '✓' : w.emoji}
                    </Ring>
                    <div className="grow">
                      <div className="tiny muted" style={{ fontWeight: 650 }}>
                        World {w.num}
                        {isNext && <span style={{ color: w.color }}> · you are here</span>}
                      </div>
                      <div style={{ fontWeight: 700, lineHeight: 1.25 }}>{w.title}</div>
                      <div className="tiny muted">{w.tagline}</div>
                    </div>
                    <span className="tiny muted" style={{ flex: 'none' }}>
                      {done}/{w.lessons.length}
                    </span>
                  </a>
                </li>
              )
            })}
          </ol>
        </section>

        <section className="stack">
          <h2>Put it to work</h2>
          <div className="grid-home">
            <a href={href('/map')} className="card stack sm" style={{ textDecoration: 'none' }}>
              <div style={{ fontSize: 30 }} aria-hidden="true">
                🗺️
              </div>
              <h3>Architecture map</h3>
              <p className="small ink2">The whole machine, box by box. Tap anything to see what it does and what breaks.</p>
              <span className="tiny muted">
                {unlocked}/{ARCH.length} boxes unlocked
              </span>
            </a>
            <a href={href('/scenarios')} className="card stack sm" style={{ textDecoration: 'none' }}>
              <div style={{ fontSize: 30 }} aria-hidden="true">
                🧯
              </div>
              <h3>Founder reality checks</h3>
              <p className="small ink2">Real situations founders face. What do you do first?</p>
              <span className="tiny muted">
                {scenariosDone}/{SCENARIOS.length} completed
              </span>
            </a>
            <a href={href('/capstone')} className="card stack sm" style={{ textDecoration: 'none' }}>
              <div style={{ fontSize: 30 }} aria-hidden="true">
                🚀
              </div>
              <h3>Capstone: build a software company</h3>
              <p className="small ink2">Make the calls, grow from 10 to 10,000 users, survive what goes wrong.</p>
              <span className="tiny muted">{p.capstone ? 'Readiness report available' : 'Best after a few worlds'}</span>
            </a>
            <a href={href('/glossary')} className="card stack sm" style={{ textDecoration: 'none' }}>
              <div style={{ fontSize: 30 }} aria-hidden="true">
                📚
              </div>
              <h3>Glossary</h3>
              <p className="small ink2">Every term in plain English, linked back to where you can see it in action.</p>
            </a>
          </div>
        </section>
      </div>
    </main>
  )
}
