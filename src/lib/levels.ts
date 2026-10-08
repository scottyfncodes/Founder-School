import { ALL_CONCEPTS, SKILLS, conceptsBySkill } from '../content/curriculum'
import type { Progress } from './store'
import type { Level, Skill } from './types'

export const LEVELS: { level: Level; name: string; emoji: string; color: string; claim: string }[] = [
  { level: 0, name: 'Unseen', emoji: '⚪', color: 'var(--surface-3)', claim: 'Not met yet.' },
  { level: 1, name: 'Novice', emoji: '🟢', color: 'var(--lv1)', claim: 'I recognize the term.' },
  { level: 2, name: 'Literate', emoji: '🔵', color: 'var(--lv2)', claim: 'I can explain the concept.' },
  { level: 3, name: 'Founder', emoji: '🟣', color: 'var(--lv3)', claim: 'I can make decisions involving the concept.' },
  { level: 4, name: 'Advanced', emoji: '🟠', color: 'var(--lv4)', claim: 'I can discuss tradeoffs with an experienced engineer.' },
]

export const levelInfo = (l: Level) => LEVELS[l]

/** Concepts at Founder level or above count as "mastered". */
export const MASTERED: Level = 3

export function overall(p: Progress) {
  const total = ALL_CONCEPTS.length || 1
  const points = ALL_CONCEPTS.reduce((s, c) => s + (p.concepts[c.id] ?? 0), 0)
  const ratio = points / (total * 4)
  // Rank thresholds: average level across all concepts.
  const avg = points / total
  const rank: Level = avg >= 3.25 ? 4 : avg >= 2.25 ? 3 : avg >= 1.25 ? 2 : points > 0 ? 1 : 0
  const nextAt = [0.01, 1.25, 2.25, 3.25, 4][rank]
  const prevAt = [0, 0, 1.25, 2.25, 3.25][rank]
  const toNext = rank === 4 ? 1 : Math.max(0, Math.min(1, (avg - prevAt) / (nextAt - prevAt)))
  const mastered = ALL_CONCEPTS.filter((c) => (p.concepts[c.id] ?? 0) >= MASTERED).length
  return { ratio, rank, toNext, mastered, total }
}

/** 0–100 per skill, from demonstrated concept levels. */
export function skillScores(p: Progress): Record<Skill, number> {
  const by = conceptsBySkill()
  const out = {} as Record<Skill, number>
  for (const s of SKILLS) {
    const ids = by[s.id]
    out[s.id] = ids.length ? Math.round((ids.reduce((a, id) => a + (p.concepts[id] ?? 0), 0) / (ids.length * 4)) * 100) : 0
  }
  return out
}
