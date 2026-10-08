import { useState } from 'react'

export interface BizSeries {
  id: string
  label: string
  /** CSS color, e.g. 'var(--info)'. Identity only — text never uses it. */
  color: string
  values: number[]
  dashed?: boolean
  /** Draw faintly (context lines). */
  faint?: boolean
}

interface Props {
  series: BizSeries[]
  /** Label for the x axis, e.g. "Month". */
  xLabel: string
  /** Label for the y axis, e.g. "Profit". */
  yLabel: string
  /** Format a y value for axis ticks and the readout. */
  fmt: (n: number) => string
  /** Index of the first x value (0 or 1). */
  xStart?: number
  /** Which x indexes get tick labels. */
  xTicks?: number[]
  /** Force the y range to include these values. */
  yInclude?: number[]
  ariaLabel: string
}

const W = 320
const H = 190
const PAD = { l: 52, r: 10, t: 12, b: 34 }

function niceTicks(lo: number, hi: number, count = 4) {
  if (lo === hi) hi = lo + 1
  const raw = (hi - lo) / count
  const mag = Math.pow(10, Math.floor(Math.log10(raw)))
  const step = [1, 2, 2.5, 3, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw
  const start = Math.floor(lo / step) * step
  const end = Math.ceil(hi / step) * step
  const out: number[] = []
  for (let v = start; v <= end + step / 2; v += step) out.push(Math.round(v * 1e6) / 1e6)
  return out
}

/**
 * A small, single-axis line chart with labeled axes, a legend,
 * and a tap/hover readout. Colors come from CSS vars so dark mode works.
 */
export function BizLineChart({ series, xLabel, yLabel, fmt, xStart = 0, xTicks, yInclude = [], ariaLabel }: Props) {
  const [hover, setHover] = useState<number | null>(null)
  const n = Math.max(...series.map((s) => s.values.length))
  const all = [...series.flatMap((s) => s.values), ...yInclude]
  const ticks = niceTicks(Math.min(...all), Math.max(...all))
  const lo = ticks[0]
  const hi = ticks[ticks.length - 1]
  const x = (i: number) => PAD.l + (i / Math.max(1, n - 1)) * (W - PAD.l - PAD.r)
  const y = (v: number) => PAD.t + (1 - (v - lo) / (hi - lo)) * (H - PAD.t - PAD.b)
  const xt = xTicks ?? [0, Math.round((n - 1) / 2), n - 1]

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    const r = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - r.left) / r.width) * W
    const i = Math.round(((px - PAD.l) / (W - PAD.l - PAD.r)) * (n - 1))
    setHover(Math.max(0, Math.min(n - 1, i)))
  }

  const shown = series.filter((s) => !s.faint)

  return (
    <div className="stack sm">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        role="img"
        aria-label={ariaLabel}
        onPointerMove={onMove}
        onPointerDown={onMove}
        onPointerLeave={() => setHover(null)}
        style={{ display: 'block', touchAction: 'pan-y', overflow: 'visible' }}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={PAD.l}
              x2={W - PAD.r}
              y1={y(t)}
              y2={y(t)}
              stroke={t === 0 ? 'var(--muted)' : 'var(--line)'}
              strokeWidth={t === 0 ? 1.2 : 1}
            />
            <text x={PAD.l - 6} y={y(t) + 4} textAnchor="end" fontSize="10" fill="var(--muted)">
              {fmt(t)}
            </text>
          </g>
        ))}
        {xt.map((i) => (
          <text key={i} x={x(i)} y={H - PAD.b + 14} textAnchor="middle" fontSize="10" fill="var(--muted)">
            {i + xStart}
          </text>
        ))}
        <text x={(PAD.l + W - PAD.r) / 2} y={H - 4} textAnchor="middle" fontSize="11" fill="var(--ink-2)">
          {xLabel}
        </text>
        <text
          x={12}
          y={(PAD.t + H - PAD.b) / 2}
          textAnchor="middle"
          fontSize="11"
          fill="var(--ink-2)"
          transform={`rotate(-90 12 ${(PAD.t + H - PAD.b) / 2})`}
        >
          {yLabel}
        </text>
        {series.map((s) => (
          <polyline
            key={s.id}
            fill="none"
            stroke={s.color}
            strokeWidth={s.faint ? 1.5 : 2.2}
            strokeOpacity={s.faint ? 0.3 : 1}
            strokeDasharray={s.dashed ? '5 4' : undefined}
            strokeLinejoin="round"
            strokeLinecap="round"
            points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(' ')}
          />
        ))}
        {hover !== null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={H - PAD.b} stroke="var(--muted)" strokeDasharray="2 3" />
            {shown.map((s) =>
              s.values[hover] !== undefined ? (
                <circle
                  key={s.id}
                  cx={x(hover)}
                  cy={y(s.values[hover])}
                  r={4.5}
                  fill={s.color}
                  stroke="var(--surface)"
                  strokeWidth={2}
                />
              ) : null,
            )}
          </g>
        )}
      </svg>
      <div className="row" style={{ gap: 12 }} aria-hidden="true">
        {shown.map((s) => (
          <span key={s.id} className="tiny ink2 row nowrap" style={{ gap: 6 }}>
            <svg width="18" height="8" aria-hidden="true">
              <line x1="1" x2="17" y1="4" y2="4" stroke={s.color} strokeWidth="2.5" strokeDasharray={s.dashed ? '4 3' : undefined} />
            </svg>
            {s.label}
          </span>
        ))}
      </div>
      <div className="tiny muted" aria-live="polite" style={{ minHeight: 17 }}>
        {hover === null
          ? 'Touch or hover the chart to read exact values.'
          : `${xLabel} ${hover + xStart}: ` + shown.map((s) => `${s.label} ${fmt(s.values[hover] ?? 0)}`).join(' · ')}
      </div>
    </div>
  )
}
