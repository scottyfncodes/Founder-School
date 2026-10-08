import type { Level } from '../lib/types'
import { levelInfo } from '../lib/levels'
import { href } from '../lib/router'

export function LevelDot({ level, showName = true }: { level: Level; showName?: boolean }) {
  const info = levelInfo(level)
  return (
    <span className="pill" style={{ gap: 6 }} title={info.claim}>
      <span
        aria-hidden="true"
        style={{ width: 9, height: 9, borderRadius: '50%', background: info.color, display: 'inline-block' }}
      />
      {showName && info.name}
      {!showName && <span className="sr-only">{info.name}</span>}
    </span>
  )
}

export function Meter({ value, color, label }: { value: number; color?: string; label?: string }) {
  const v = Math.max(0, Math.min(1, value))
  return (
    <div
      className="meter"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(v * 100)}
      aria-label={label}
    >
      <span style={{ width: `${v * 100}%`, background: color }} />
    </div>
  )
}

export function Ring({ value, size = 44, color = 'var(--accent)', children }: { value: number; size?: number; color?: string; children?: React.ReactNode }) {
  const r = (size - 6) / 2
  const c = 2 * Math.PI * r
  return (
    <span style={{ position: 'relative', width: size, height: size, display: 'inline-grid', placeItems: 'center', flex: 'none' }}>
      <svg width={size} height={size} style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={4} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.max(0, Math.min(1, value)))}
          style={{ transition: 'stroke-dashoffset .6s' }}
        />
      </svg>
      <span style={{ position: 'relative', fontSize: size * 0.42, lineHeight: 1 }}>{children}</span>
    </span>
  )
}

export function BackLink({ to, label }: { to: string; label: string }) {
  return (
    <a href={href(to)} className="btn ghost small" style={{ alignSelf: 'flex-start', marginLeft: -10 }}>
      ← {label}
    </a>
  )
}

const TABS = [
  { to: '/', label: 'Learn', icon: '🏫', match: ['', 'world', 'lesson', 'scenarios', 'capstone'] },
  { to: '/map', label: 'Map', icon: '🗺️', match: ['map'] },
  { to: '/glossary', label: 'Glossary', icon: '📚', match: ['glossary'] },
  { to: '/progress', label: 'Progress', icon: '📈', match: ['progress'] },
]

export function TabBar({ section }: { section: string }) {
  return (
    <nav
      aria-label="Main"
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10,
        background: 'color-mix(in srgb, var(--surface) 92%, transparent)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderTop: '1px solid var(--line)',
        paddingBottom: 'var(--safe-b)',
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', maxWidth: 560, margin: '0 auto' }}>
        {TABS.map((t) => {
          const on = t.match.includes(section)
          return (
            <a
              key={t.to}
              href={href(t.to)}
              aria-current={on ? 'page' : undefined}
              style={{
                height: 'var(--tabbar-h)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                textDecoration: 'none',
                fontSize: 11,
                fontWeight: 650,
                color: on ? 'var(--ink)' : 'var(--muted)',
              }}
            >
              <span aria-hidden="true" style={{ fontSize: 22, filter: on ? 'none' : 'grayscale(1)', opacity: on ? 1 : 0.7 }}>
                {t.icon}
              </span>
              {t.label}
            </a>
          )
        })}
      </div>
    </nav>
  )
}

/** Readable text color (near-black or white) for a solid background color. */
export function inkOn(hex: string) {
  const n = parseInt(hex.replace('#', ''), 16)
  const lin = (c: number) => {
    const v = c / 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  }
  const L = 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255)
  // pick whichever gives the higher contrast ratio
  return (L + 0.05) / 0.05 > 1.05 / (L + 0.05) ? '#111215' : '#ffffff'
}

/**
 * Theme a page with a world's color. In dark mode the `[data-world]` rule in
 * index.css lightens the accent so it stays readable on dark surfaces.
 */
export function worldStyle(color: string): React.CSSProperties {
  return {
    '--world': color,
    '--world-ink': inkOn(color),
  } as React.CSSProperties
}
