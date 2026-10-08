import { describe, expect, it } from 'vitest'
import { WORLDS, LESSONS, lessonById } from '../src/content/curriculum'
import { ARCH, ARCH_EDGES } from '../src/content/architecture'
import { GLOSSARY } from '../src/content/glossary'
import { SCENARIOS } from '../src/content/scenarios'
import type { QuizStep } from '../src/lib/types'

const quizzes = LESSONS.flatMap((l) => l.steps.filter((s): s is QuizStep => s.kind === 'quiz').map((q) => ({ q, l })))

describe('curriculum structure', () => {
  it('has 12 worlds, each with lessons and concepts', () => {
    expect(WORLDS).toHaveLength(12)
    for (const w of WORLDS) {
      expect(w.lessons.length, w.id).toBeGreaterThan(0)
      expect(w.concepts.length, w.id).toBeGreaterThan(0)
    }
  })

  it('lesson ids are unique and prefixed by world', () => {
    const ids = LESSONS.map((l) => l.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const w of WORLDS) for (const l of w.lessons) expect(l.id.startsWith(w.id + '-'), l.id).toBe(true)
  })

  it('concept ids are unique across worlds', () => {
    const ids = WORLDS.flatMap((w) => w.concepts.map((c) => c.id))
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every lesson follows the teaching pattern', () => {
    for (const l of LESSONS) {
      const kinds = l.steps.map((s) => s.kind)
      expect(kinds, l.id).toContain('concept')
      expect(kinds, l.id).toContain('widget')
      expect(kinds, l.id).toContain('care')
      expect(kinds.filter((k) => k === 'quiz').length, l.id).toBeGreaterThanOrEqual(2)
      expect(l.minutes, l.id).toBeGreaterThanOrEqual(3)
    }
  })

  it('lesson concepts belong to their world; every world concept is taught and tested', () => {
    for (const w of WORLDS) {
      const ids = new Set(w.concepts.map((c) => c.id))
      const taught = new Set<string>()
      const tested = new Set<string>()
      for (const l of w.lessons) {
        for (const c of l.concepts) {
          expect(ids.has(c), `${l.id} → ${c}`).toBe(true)
          taught.add(c)
        }
        for (const s of l.steps) if (s.kind === 'quiz') for (const c of s.concepts) {
          expect(ids.has(c), `${s.id} → ${c}`).toBe(true)
          tested.add(c)
        }
      }
      for (const c of ids) {
        expect(taught.has(c), `${w.id} concept not taught: ${c}`).toBe(true)
        expect(tested.has(c), `${w.id} concept not tested: ${c}`).toBe(true)
      }
    }
  })

  it('quizzes: unique ids, exactly one correct answer, every option explained', () => {
    const ids = quizzes.map(({ q }) => q.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const { q } of quizzes) {
      expect(q.options.filter((o) => o.correct).length, q.id).toBe(1)
      expect(q.options.length, q.id).toBeGreaterThanOrEqual(2)
      for (const o of q.options) expect(o.why.length, q.id).toBeGreaterThan(15)
      expect(q.concepts.length, q.id).toBeGreaterThan(0)
    }
  })

  it('every world has at least one founder-level (3) challenge', () => {
    for (const w of WORLDS) {
      const lv = w.lessons.flatMap((l) => l.steps.filter((s): s is QuizStep => s.kind === 'quiz').map((q) => q.level))
      expect(lv.some((x) => x >= 3), w.id).toBe(true)
    }
  })
})

describe('architecture map', () => {
  it('each box is unlocked by an existing lesson that lists it', () => {
    for (const c of ARCH) {
      const l = lessonById(c.lesson)
      expect(l, `${c.id} → ${c.lesson}`).toBeDefined()
      expect(l?.unlocks ?? [], `${c.lesson} should unlock ${c.id}`).toContain(c.id)
    }
  })
  it('lessons only unlock real boxes they own', () => {
    for (const l of LESSONS) for (const u of l.unlocks ?? []) {
      const c = ARCH.find((a) => a.id === u)
      expect(c, `${l.id} unlocks unknown ${u}`).toBeDefined()
      expect(c?.lesson, `${u} is owned by another lesson`).toBe(l.id)
    }
  })
  it('edges reference real boxes', () => {
    for (const [a, b] of ARCH_EDGES) {
      expect(ARCH.some((c) => c.id === a), a).toBe(true)
      expect(ARCH.some((c) => c.id === b), b).toBe(true)
    }
  })
})

describe('glossary', () => {
  it('has a substantial set of unique terms linking to real lessons', () => {
    expect(GLOSSARY.length).toBeGreaterThanOrEqual(100)
    const ids = GLOSSARY.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const t of GLOSSARY) {
      expect(t.what.length, t.id).toBeGreaterThan(10)
      expect(t.why.length, t.id).toBeGreaterThan(10)
      for (const l of t.lessons) expect(lessonById(l), `${t.id} → ${l}`).toBeDefined()
    }
  })
})

describe('scenarios', () => {
  it('has the 8 founder reality checks, well formed', () => {
    expect(SCENARIOS.length).toBeGreaterThanOrEqual(8)
    for (const s of SCENARIOS) {
      expect(s.steps.length, s.id).toBeGreaterThan(0)
      for (const st of s.steps) {
        expect(st.options.filter((o) => o.correct).length, s.id).toBe(1)
        for (const o of st.options) expect(o.why.length, s.id).toBeGreaterThan(15)
      }
      for (const l of s.lessons) expect(lessonById(l), `${s.id} → ${l}`).toBeDefined()
    }
  })
})
