import type { CSSProperties } from 'react'

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
export function worldStyle(color: string): CSSProperties {
  return {
    '--world': color,
    '--world-ink': inkOn(color),
  } as CSSProperties
}
