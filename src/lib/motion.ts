import { useEffect, useState } from 'react'

const query = '(prefers-reduced-motion: reduce)'

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && !!window.matchMedia?.(query).matches
}

export function useReducedMotion() {
  const [reduced, setReduced] = useState(prefersReducedMotion)
  useEffect(() => {
    const mq = window.matchMedia?.(query)
    if (!mq) return
    const on = () => setReduced(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return reduced
}

/** Delay helper for step-by-step animations; much faster when motion is reduced. */
export function wait(ms: number) {
  return new Promise<void>((r) => setTimeout(r, prefersReducedMotion() ? Math.min(ms, 120) : ms))
}
