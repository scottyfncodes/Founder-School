import type { ReactNode } from 'react'

/** 0 = not seen, 1 = Novice, 2 = Literate, 3 = Founder, 4 = Advanced */
export type Level = 0 | 1 | 2 | 3 | 4

export type Skill = 'tech' | 'data' | 'security' | 'architecture' | 'reliability' | 'ai' | 'business'

export interface Concept {
  id: string
  name: string
}

/** WHAT IS IT + WHY DOES IT EXIST. */
export interface ConceptStep {
  kind: 'concept'
  title: string
  emoji?: string
  what: string
  why: string
}

/** WHAT DOES IT LOOK LIKE / HOW DOES IT WORK — an interactive widget. */
export interface WidgetStep {
  kind: 'widget'
  title: string
  /** One short sentence telling the learner what to do. */
  instruction: string
  /**
   * Render the widget. Call `done()` once the learner has done the key
   * interaction — that unlocks the Continue button.
   */
  render: (api: WidgetApi) => ReactNode
}

export interface WidgetApi {
  done: () => void
}

/** Compact term/explanation list. Keep each text to 1–2 short sentences. */
export interface PointsStep {
  kind: 'points'
  title: string
  points: { term: string; text: string }[]
}

/** WHY SHOULD A FOUNDER CARE? */
export interface CareStep {
  kind: 'care'
  points: string[]
}

export interface QuizOption {
  text: string
  correct?: boolean
  /** Explanation shown after picking this option. Always explain WHY. */
  why: string
}

export interface QuizStep {
  kind: 'quiz'
  /** Globally unique, e.g. "w2-api-q1" */
  id: string
  prompt: string
  /** Optional scene-setting line shown above the prompt. */
  context?: string
  options: QuizOption[]
  /** Level of understanding demonstrated by a first-try correct answer. */
  level: 2 | 3 | 4
  /** Concept ids (from the world's concept list) this question proves. */
  concepts: string[]
}

export type Step = ConceptStep | WidgetStep | PointsStep | CareStep | QuizStep

export interface Lesson {
  /** Globally unique, e.g. "w2-api" */
  id: string
  title: string
  subtitle: string
  minutes: number
  /** Concept ids introduced (Novice on completion). */
  concepts: string[]
  /** Architecture-map component ids this lesson unlocks. */
  unlocks?: string[]
  /** Overrides the world's skill for the readiness report. */
  skill?: Skill
  steps: Step[]
}

export interface World {
  id: string
  num: number
  title: string
  tagline: string
  emoji: string
  /** Accent color (hex). */
  color: string
  skill: Skill
  concepts: Concept[]
  lessons: Lesson[]
}

export interface ArchComponent {
  id: string
  name: string
  emoji: string
  /** Layer used for grouping in the map. */
  layer: 'people' | 'client' | 'network' | 'app' | 'data' | 'services' | 'ops'
  what: string
  input: string
  output: string
  fails: string
  care: string
  /** Lesson that teaches (and unlocks) it. */
  lesson: string
}

export interface GlossaryTerm {
  id: string
  term: string
  what: string
  why: string
  /** Lesson ids where the term is seen in action. */
  lessons: string[]
}

/** A "Founder reality check": a short, multi-decision situation. */
export interface Scenario {
  id: string
  title: string
  emoji: string
  /** The situation, 1–3 sentences. */
  setup: string
  /** One or more decisions, played in order. */
  steps: { prompt: string; context?: string; options: QuizOption[] }[]
  /** The one thing to remember. */
  takeaway: string
  /** Lessons to revisit. */
  lessons: string[]
  skill: Skill
}
