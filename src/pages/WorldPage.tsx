import type { World } from '../lib/types'
import { WORLDS } from '../content/curriculum'
import { useProgress } from '../lib/store'
import { href } from '../lib/router'
import { BackLink, LevelDot } from '../components/bits'
import { worldStyle } from '../lib/theme'

export function WorldPage({ world }: { world: World }) {
  const p = useProgress()
  const firstOpen = world.lessons.find((l) => !p.lessons[l.id])
  const idx = WORLDS.indexOf(world)
  const prev = WORLDS[idx - 1]
  const next = WORLDS[idx + 1]

  return (
    <main className="page" data-world style={worldStyle(world.color)}>
      <div className="stack lg">
        <BackLink to="/" label="All worlds" />
        <header className="stack sm">
          <div style={{ fontSize: 48, lineHeight: 1 }} aria-hidden="true">
            {world.emoji}
          </div>
          <div className="kicker" style={{ color: 'var(--accent)' }}>
            World {world.num}
          </div>
          <h1>{world.title}</h1>
          <p className="lead">{world.tagline}</p>
        </header>

        <section className="stack sm" aria-label="Lessons">
          {world.lessons.map((l, k) => {
            const done = !!p.lessons[l.id]
            const isNext = firstOpen?.id === l.id
            return (
              <a
                key={l.id}
                href={href(`/lesson/${l.id}`)}
                className="card tight row nowrap"
                style={{
                  textDecoration: 'none',
                  gap: 14,
                  borderColor: isNext ? 'var(--accent)' : undefined,
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 36,
                    height: 36,
                    flex: 'none',
                    borderRadius: 12,
                    display: 'grid',
                    placeItems: 'center',
                    fontWeight: 700,
                    background: done ? 'var(--accent)' : 'var(--surface-2)',
                    color: done ? 'var(--accent-ink)' : 'var(--ink-2)',
                  }}
                >
                  {done ? '✓' : k + 1}
                </span>
                <div className="grow">
                  <div style={{ fontWeight: 700, lineHeight: 1.25 }}>{l.title}</div>
                  <div className="small muted">{l.subtitle}</div>
                </div>
                <span className="tiny muted" style={{ flex: 'none' }}>
                  {l.minutes} min
                </span>
              </a>
            )
          })}
        </section>

        {firstOpen && (
          <a className="btn primary block" href={href(`/lesson/${firstOpen.id}`)}>
            {firstOpen.id === world.lessons[0]?.id ? 'Start this world' : 'Continue'}: {firstOpen.title} →
          </a>
        )}

        <section className="card stack sm">
          <div className="kicker">Concepts in this world</div>
          <p className="tiny muted">Levels rise only when you answer challenges correctly on the first try.</p>
          {world.concepts.map((c) => (
            <div key={c.id} className="row nowrap between">
              <span className="small">{c.name}</span>
              <LevelDot level={p.concepts[c.id] ?? 0} />
            </div>
          ))}
        </section>

        <nav className="row between" aria-label="Other worlds">
          {prev ? (
            <a className="btn small" href={href(`/world/${prev.id}`)}>
              ← {prev.emoji} World {prev.num}
            </a>
          ) : (
            <span />
          )}
          {next && (
            <a className="btn small" href={href(`/world/${next.id}`)}>
              World {next.num} {next.emoji} →
            </a>
          )}
        </nav>
      </div>
    </main>
  )
}
