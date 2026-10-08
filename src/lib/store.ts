import { useSyncExternalStore } from 'react'
import type { Level } from './types'

export interface CapstoneResult {
  at: number
  scores: Record<string, number>
}

export interface Progress {
  /** lessonId -> completed timestamp */
  lessons: Record<string, number>
  /** quizId -> best result */
  quizzes: Record<string, { correct: boolean; tries: number }>
  /** conceptId -> highest demonstrated level */
  concepts: Record<string, Level>
  /** scenarioId -> completed; `correct` = got it right first try (ever) */
  scenarios: Record<string, { correct: boolean }>
  capstone: CapstoneResult | null
}

const KEY = 'founder-school.progress.v1'

const empty = (): Progress => ({ lessons: {}, quizzes: {}, concepts: {}, scenarios: {}, capstone: null })

function load(): Progress {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return empty()
    return { ...empty(), ...(JSON.parse(raw) as Partial<Progress>) }
  } catch {
    return empty()
  }
}

let state: Progress = load()
const listeners = new Set<() => void>()

function commit(next: Progress) {
  state = next
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* storage unavailable (private mode): progress lives for this visit only */
  }
  listeners.forEach((l) => l())
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function useProgress(): Progress {
  return useSyncExternalStore(subscribe, () => state, () => state)
}

export function getProgress(): Progress {
  return state
}

function raise(concepts: Record<string, Level>, ids: string[], level: Level) {
  const next = { ...concepts }
  for (const id of ids) if ((next[id] ?? 0) < level) next[id] = level
  return next
}

export function completeLesson(lessonId: string, conceptIds: string[]) {
  commit({
    ...state,
    lessons: { ...state.lessons, [lessonId]: state.lessons[lessonId] ?? Date.now() },
    concepts: raise(state.concepts, conceptIds, 1),
  })
}

/**
 * Record a quiz answer. Only a first-try correct answer counts as demonstrated
 * understanding; a later correct answer still marks the question as seen.
 */
export function recordQuiz(quizId: string, firstTryCorrect: boolean, level: Level, conceptIds: string[]) {
  const prev = state.quizzes[quizId]
  commit({
    ...state,
    quizzes: {
      ...state.quizzes,
      [quizId]: { correct: (prev?.correct ?? false) || firstTryCorrect, tries: (prev?.tries ?? 0) + 1 },
    },
    // Answering at all proves you've at least met the term.
    concepts: raise(state.concepts, conceptIds, firstTryCorrect ? level : 1),
  })
}

export function recordScenario(id: string, firstTryCorrect: boolean) {
  const correct = (state.scenarios[id]?.correct ?? false) || firstTryCorrect
  commit({ ...state, scenarios: { ...state.scenarios, [id]: { correct } } })
}

export function saveCapstone(result: CapstoneResult) {
  commit({ ...state, capstone: result })
}

export function resetProgress() {
  commit(empty())
}

/** Test/debug hook. */
export function _setProgress(p: Progress) {
  commit(p)
}
