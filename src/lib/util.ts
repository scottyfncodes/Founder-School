export function shuffle<T>(arr: readonly T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export const money = (n: number) => {
  const sign = n < 0 ? '-' : ''
  const v = Math.abs(n)
  if (v >= 1_000_000) return `${sign}$${(v / 1_000_000).toFixed(v >= 10_000_000 ? 0 : 1)}M`
  if (v >= 10_000) return `${sign}$${Math.round(v / 1000)}k`
  return `${sign}$${Math.round(v).toLocaleString('en-US')}`
}

export const num = (n: number) => Math.round(n).toLocaleString('en-US')

export const pct = (n: number, digits = 0) => `${(n * 100).toFixed(digits)}%`

export const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))
