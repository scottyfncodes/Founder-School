import { useEffect, useMemo, useRef, useState } from 'react'
import type { Lesson, Step, World } from '../lib/types'
import { completeLesson, recordQuiz, useProgress } from '../lib/store'
import { href } from '../lib/router'
import { ARCH } from '../content/architecture'
import { LESSONS, conceptName } from '../content/curriculum'
import { Quiz } from './Quiz'
import { LevelDot } from './bits'

interface Props {
  lesson: Lesson
  world: World
}

const STEP_LABEL: Record<Step['kind'], string> = {
  concept: 'New idea',
  widget: 'Try it',
  points: 'Key ideas',
  care: 'Why a founder cares',
  quiz: 'Challenge',
}

export function LessonPlayer({ lesson, world }: Props) {
  const [i, setI] = useState(0)
  const [ready, setReady] = useState<Set<number>>(new Set())
  const [firstTry, setFirstTry] = useState<Record<string, boolean>>({})
  const [finished, setFinished] = useState(false)
  const topRef = useRef<HTMLDivElement>(null)
  const progress = useProgress()
  const step = lesson.steps[i]
  const total = lesson.steps.length

  // a fresh lesson (navigating between lessons) starts at step 0
  useEffect(() => {
    setI(0)
    setReady(new Set())
    setFirstTry({})
    setFinished(false)
  }, [lesson.id])

  useEffect(() => {
    topRef.current?.scrollIntoView({ block: 'start' })
    window.scrollTo({ top: 0 })
  }, [i, finished])

  const markReady = (n: number) => setReady((r) => (r.has(n) ? r : new Set(r).add(n)))
  const gated = step && (step.kind === 'widget' || step.kind === 'quiz') && !ready.has(i)

  function next() {
    if (i < total - 1) setI(i + 1)
    else {
      completeLesson(lesson.id, lesson.concepts)
      setFinished(true)
    }
  }

  const nextL = useMemo(() => {
    const idx = LESSONS.findIndex((l) => l.id === lesson.id)
    return LESSONS[idx + 1]
  }, [lesson.id])

  const style = { '--accent': world.color, '--accent-soft': `color-mix(in srgb, ${world.color} 14%, var(--surface))` } as React.CSSProperties

  if (finished) {
    const quizzes = lesson.steps.filter((s) => s.kind === 'quiz')
    const right = quizzes.filter((q) => firstTry[q.id]).length
    const unlocked = ARCH.filter((c) => lesson.unlocks?.includes(c.id))
    return (
      <div className="page" style={style} ref={topRef}>
        <div className="stack lg pop">
          <div className="center stack sm" style={{ paddingTop: 24 }}>
            <div style={{ fontSize: 56 }} aria-hidden="true">
              {right === quizzes.length ? '🏆' : '✅'}
            </div>
            <div className="kicker">Lesson complete</div>
            <h1 style={{ fontSize: 30 }}>{lesson.title}</h1>
          </div>

          {quizzes.length > 0 && (
            <div className="card stack sm">
              <div className="kicker">Demonstrated understanding</div>
              <p>
                <b>
                  {right} of {quizzes.length}
                </b>{' '}
                challenges right on the first try.
              </p>
              <p className="small muted">
                {right === quizzes.length
                  ? 'Every concept here moved up a level.'
                  : 'Concepts only level up when you get them right first time. Replay the lesson later to prove it.'}
              </p>
            </div>
          )}

          <div className="card stack sm">
            <div className="kicker">Concepts</div>
            {lesson.concepts.map((c) => (
              <div key={c} className="row nowrap between">
                <span className="small">{conceptName(c)}</span>
                <LevelDot level={progress.concepts[c] ?? 0} />
              </div>
            ))}
          </div>

          {unlocked.length > 0 && (
            <a className="card stack sm" href={href('/map')} style={{ textDecoration: 'none' }}>
              <div className="kicker">Added to your architecture map</div>
              <div className="row">
                {unlocked.map((c) => (
                  <span key={c.id} className="pill">
                    {c.emoji} {c.name}
                  </span>
                ))}
              </div>
              <span className="small" style={{ color: 'var(--accent)', fontWeight: 600 }}>
                See it on the map →
              </span>
            </a>
          )}

          <div className="stack sm">
            {nextL && (
              <a className="btn primary block" href={href(`/lesson/${nextL.id}`)}>
                Next: {nextL.title} →
              </a>
            )}
            <a className="btn block" href={href(`/world/${world.id}`)}>
              Back to {world.title}
            </a>
            <button
              type="button"
              className="btn ghost block"
              onClick={() => {
                setFinished(false)
                setI(0)
                setReady(new Set())
                setFirstTry({})
              }}
            >
              ↺ Replay lesson
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={style} ref={topRef}>
      <header
        className="lesson-top"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 5,
          background: 'color-mix(in srgb, var(--bg) 92%, transparent)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          paddingTop: 'var(--safe-t)',
          borderBottom: '1px solid var(--line)',
        }}
      >
        <div className="row nowrap" style={{ maxWidth: 680, margin: '0 auto', padding: '8px 12px', gap: 10 }}>
          <a className="btn icon ghost" href={href(`/world/${world.id}`)} aria-label="Close lesson">
            ✕
          </a>
          <div className="grow stack" style={{ gap: 4 }}>
            <div className="tiny muted" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {world.emoji} {lesson.title}
            </div>
            <div
              className="row nowrap"
              style={{ gap: 3 }}
              role="progressbar"
              aria-valuemin={1}
              aria-valuemax={total}
              aria-valuenow={i + 1}
              aria-label={`Step ${i + 1} of ${total}`}
            >
              {lesson.steps.map((_, k) => (
                <span
                  key={k}
                  style={{
                    flex: 1,
                    height: 5,
                    borderRadius: 3,
                    background: k <= i ? 'var(--accent)' : 'var(--surface-3)',
                    transition: 'background .3s',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="page" style={{ paddingTop: 20, paddingBottom: 'calc(120px + var(--safe-b))' }}>
        <div className="stack lg" key={`${lesson.id}-${i}`}>
          <div className="kicker" style={{ color: 'var(--accent)' }}>
            {STEP_LABEL[step.kind]} · {i + 1}/{total}
          </div>
          <StepView
            step={step}
            onReady={() => markReady(i)}
            onFirst={(id, ok) => {
              // Going back and re-answering in the same run doesn't count twice.
              if (id in firstTry) return
              const q = lesson.steps.find((s) => s.kind === 'quiz' && s.id === id)
              if (q?.kind === 'quiz') recordQuiz(q.id, ok, q.level, q.concepts)
              setFirstTry((f) => ({ ...f, [id]: ok }))
            }}
          />
        </div>
      </main>

      <footer
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 5,
          background: 'color-mix(in srgb, var(--bg) 94%, transparent)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderTop: '1px solid var(--line)',
          padding: '10px 16px calc(10px + var(--safe-b))',
        }}
      >
        <div className="row nowrap" style={{ maxWidth: 680, margin: '0 auto', gap: 8 }}>
          {i > 0 && (
            <button type="button" className="btn" onClick={() => setI(i - 1)} aria-label="Previous step">
              ←
            </button>
          )}
          {gated && step.kind === 'widget' && (
            <button type="button" className="btn ghost small" onClick={() => markReady(i)}>
              Skip activity
            </button>
          )}
          <button type="button" className="btn primary grow" onClick={next} disabled={!!gated}>
            {gated
              ? step.kind === 'quiz'
                ? 'Answer to continue'
                : 'Try it to continue'
              : i === total - 1
                ? 'Finish lesson'
                : 'Continue'}
          </button>
        </div>
      </footer>
    </div>
  )
}

function StepView({
  step,
  onReady,
  onFirst,
}: {
  step: Step
  onReady: () => void
  onFirst: (quizId: string, ok: boolean) => void
}) {
  switch (step.kind) {
    case 'concept':
      return (
        <div className="stack lg">
          {step.emoji && (
            <div style={{ fontSize: 52, lineHeight: 1 }} aria-hidden="true">
              {step.emoji}
            </div>
          )}
          <h2>{step.title}</h2>
          <div className="card stack sm">
            <div className="kicker">What is it?</div>
            <p className="lead" style={{ color: 'var(--ink)' }}>
              {step.what}
            </p>
          </div>
          <div className="card stack sm">
            <div className="kicker">Why does it exist?</div>
            <p className="ink2">{step.why}</p>
          </div>
        </div>
      )
    case 'widget':
      return (
        <div className="stack">
          <h2>{step.title}</h2>
          <p className="ink2">👉 {step.instruction}</p>
          <div className="card">{step.render({ done: onReady })}</div>
        </div>
      )
    case 'points':
      return (
        <div className="stack">
          <h2>{step.title}</h2>
          <div className="stack sm">
            {step.points.map((p) => (
              <div key={p.term} className="card tight stack" style={{ gap: 4 }}>
                <b>{p.term}</b>
                <p className="small ink2">{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      )
    case 'care':
      return (
        <div className="stack">
          <h2>Why should a founder care?</h2>
          <div className="stack sm">
            {step.points.map((p, k) => (
              <div key={k} className="callout info row nowrap" style={{ alignItems: 'flex-start', gap: 10 }}>
                <span aria-hidden="true">🧭</span>
                <span>{p}</span>
              </div>
            ))}
          </div>
        </div>
      )
    case 'quiz':
      return <QuizStepView step={step} onReady={onReady} onFirst={onFirst} />
  }
}

function QuizStepView({
  step,
  onReady,
  onFirst,
}: {
  step: Extract<Step, { kind: 'quiz' }>
  onReady: () => void
  onFirst: (quizId: string, ok: boolean) => void
}) {
  return (
    <Quiz
      prompt={step.prompt}
      context={step.context}
      options={step.options}
      level={step.level}
      onFirstAnswer={(ok) => onFirst(step.id, ok)}
      onSolved={onReady}
    />
  )
}
