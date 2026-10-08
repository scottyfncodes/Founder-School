import type { Lesson, Skill, World } from '../lib/types'
import w1 from './worlds/w01'
import w2 from './worlds/w02'
import w3 from './worlds/w03'
import w4 from './worlds/w04'
import w5 from './worlds/w05'
import w6 from './worlds/w06'
import w7 from './worlds/w07'
import w8 from './worlds/w08'
import w9 from './worlds/w09'
import w10 from './worlds/w10'
import w11 from './worlds/w11'
import w12 from './worlds/w12'

export const WORLDS: World[] = [w1, w2, w3, w4, w5, w6, w7, w8, w9, w10, w11, w12]

export const LESSONS: Lesson[] = WORLDS.flatMap((w) => w.lessons)

const lessonMap = new Map(LESSONS.map((l) => [l.id, l]))
const worldOf = new Map(WORLDS.flatMap((w) => w.lessons.map((l) => [l.id, w] as const)))

export const lessonById = (id: string) => lessonMap.get(id)
export const worldOfLesson = (id: string) => worldOf.get(id)
export const worldById = (id: string) => WORLDS.find((w) => w.id === id)

export const ALL_CONCEPTS = WORLDS.flatMap((w) => w.concepts.map((c) => ({ ...c, world: w })))

export const conceptName = (id: string) => ALL_CONCEPTS.find((c) => c.id === id)?.name ?? id

export const lessonSkill = (l: Lesson): Skill => l.skill ?? worldOfLesson(l.id)?.skill ?? 'tech'

export const SKILLS: { id: Skill; label: string }[] = [
  { id: 'tech', label: 'Technical literacy' },
  { id: 'data', label: 'Data' },
  { id: 'security', label: 'Security' },
  { id: 'architecture', label: 'Architecture' },
  { id: 'reliability', label: 'Reliability' },
  { id: 'ai', label: 'AI development' },
  { id: 'business', label: 'Business' },
]

/** Concepts grouped by the skill they count toward (via the lessons that teach them). */
export function conceptsBySkill(): Record<Skill, string[]> {
  const out = Object.fromEntries(SKILLS.map((s) => [s.id, [] as string[]])) as Record<Skill, string[]>
  for (const l of LESSONS) {
    const sk = lessonSkill(l)
    for (const c of l.concepts) if (!out[sk].includes(c)) out[sk].push(c)
  }
  return out
}

export function nextLesson(done: Record<string, number>): Lesson | undefined {
  return LESSONS.find((l) => !done[l.id])
}
