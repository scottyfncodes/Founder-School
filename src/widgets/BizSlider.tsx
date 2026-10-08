import { useId } from 'react'

interface Props {
  label: string
  value: number
  min: number
  max: number
  step?: number
  /** Formats the visible value. */
  show: (n: number) => string
  onChange: (n: number) => void
  hint?: string
}

/** A native range slider with a visible label and value. */
export function BizSlider({ label, value, min, max, step = 1, show, onChange, hint }: Props) {
  const id = useId()
  return (
    <div className="stack" style={{ gap: 0 }}>
      <div className="row between nowrap" style={{ gap: 8 }}>
        <label htmlFor={id} className="small" style={{ fontWeight: 600 }}>
          {label}
        </label>
        <span className="small mono" style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
          {show(value)}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={show(value)}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {hint && <span className="tiny muted">{hint}</span>}
    </div>
  )
}
