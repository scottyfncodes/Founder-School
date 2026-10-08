import { useEffect, useMemo, useRef, useState } from 'react'
import type { Skill } from '../lib/types'
import { SKILLS, lessonById } from '../content/curriculum'
import { saveCapstone, useProgress } from '../lib/store'
import { skillScores } from '../lib/levels'
import { href } from '../lib/router'
import { prefersReducedMotion, wait } from '../lib/motion'
import { money, num, shuffle } from '../lib/util'
import { BackLink, Meter } from '../components/bits'
import {
  DECISIONS,
  EVENTS,
  LESSON_TITLES,
  SKILL_LESSONS,
  STAGE_NAMES,
  applyFx,
  computeStats,
  decisionByKey,
  eventsInStage,
  labelOf,
  mergeFx,
  newSim,
  optionOf,
  quality,
  simScores,
  worstTone,
  type Choices,
  type Fx,
  type Line,
  type Sim,
  type Stats,
  type Tone,
  type Upgrade,
} from './model'
import './capstone.css'

type Phase =
  | { kind: 'landing' }
  | { kind: 'decide'; i: number; fromPlan: boolean }
  | { kind: 'plan' }
  | { kind: 'growing' }
  | { kind: 'event'; idx: number }
  | { kind: 'summary' }
  | { kind: 'report' }
  | { kind: 'saved' }

interface Current {
  /** Choices in force when the event happened (labels stay correct after an upgrade). */
  at: Choices
  lines: Line[]
  fx: Fx
  order: number[]
  picked: number | null
  upgrade: Upgrade | null
  upgradeDone: 'yes' | 'no' | null
}

const TONE_ICON: Record<Tone, string> = { good: '✅', warn: '⚠️', bad: '💥' }
const lessonTitle = (id: string) => lessonById(id)?.title ?? LESSON_TITLES[id] ?? id
const top = () => window.scrollTo({ top: 0 })

export function CapstonePage() {
  const progress = useProgress()
  const [phase, setPhase] = useState<Phase>({ kind: 'landing' })
  const [draft, setDraft] = useState<Partial<Choices>>({})
  const [sim, setSim] = useState<Sim | null>(null)
  const [cur, setCur] = useState<Current | null>(null)
  const [result, setResult] = useState<{ sim: Record<Skill, number>; lessons: Record<Skill, number>; blended: Record<Skill, number> } | null>(null)
  const run = useRef(0)

  // Cancel any pending timed transition when leaving the page.
  useEffect(() => () => void run.current++, [])

  function playAgain() {
    run.current++
    setDraft({})
    setSim(null)
    setCur(null)
    setResult(null)
    setPhase({ kind: 'decide', i: 0, fromPlan: false })
    top()
  }

  function openEvent(base: Sim, idx: number) {
    const ev = EVENTS[idx]
    const lines = ev.lines(base.choices)
    const fx = mergeFx(lines.map((l) => l.fx ?? {}))
    const next = applyFx(base, fx)
    const tone = worstTone(lines)
    next.turns = [
      ...base.turns,
      { eventId: ev.id, tone, lines: lines.map((l) => `Because you chose “${labelOf(l.key, base.choices[l.key])}”, ${l.text}`) },
    ]
    setSim(next)
    setCur({
      at: base.choices,
      lines,
      fx,
      order: shuffle(ev.responses.map((_, i) => i)),
      picked: null,
      upgrade: ev.upgrades.find((u) => u.from.includes(base.choices[u.key])) ?? null,
      upgradeDone: null,
    })
    setPhase({ kind: 'event', idx })
    top()
  }

  function grow(base: Sim, stage: number) {
    const next = { ...base, stage }
    setSim(next)
    setCur(null)
    setPhase({ kind: 'growing' })
    top()
    const id = ++run.current
    void wait(1600).then(() => {
      if (run.current !== id) return
      openEvent(next, EVENTS.indexOf(eventsInStage(stage)[0]))
    })
  }

  function respond(i: number) {
    if (!sim || !cur || cur.picked !== null || phase.kind !== 'event') return
    const ev = EVENTS[phase.idx]
    const r = ev.responses[i]
    const next = applyFx(sim, r.fx ?? {})
    next.answers = [...sim.answers, { skills: ev.skills, q: r.q, lesson: ev.lesson }]
    setSim(next)
    setCur({ ...cur, picked: i })
  }

  function decideUpgrade(yes: boolean) {
    if (!sim || !cur?.upgrade || cur.upgradeDone) return
    const u = cur.upgrade
    const d = decisionByKey(u.key)
    let next: Sim = { ...sim, answers: [...sim.answers, { skills: d.skills, q: yes ? 0.8 : 0.3, lesson: d.lesson }] }
    if (yes) {
      next = applyFx(next, { users: 0.96 })
      next.choices = { ...next.choices, [u.key]: u.to }
      next.upgrades = [...next.upgrades, `${d.title}: ${labelOf(u.key, sim.choices[u.key])} → ${labelOf(u.key, u.to)}`]
    }
    setSim(next)
    setCur({ ...cur, upgradeDone: yes ? 'yes' : 'no' })
  }

  function nextFromEvent() {
    if (!sim || phase.kind !== 'event') return
    const nextEv = EVENTS[phase.idx + 1]
    if (nextEv && nextEv.stage === sim.stage) openEvent(sim, phase.idx + 1)
    else {
      setCur(null)
      setPhase({ kind: 'summary' })
      top()
    }
  }

  function finish() {
    if (!sim) return
    const simS = simScores(sim)
    const lessons = skillScores(progress)
    const blended = {} as Record<Skill, number>
    for (const s of SKILLS) blended[s.id] = Math.round((simS[s.id] + lessons[s.id]) / 2)
    saveCapstone({ at: Date.now(), scores: blended })
    setResult({ sim: simS, lessons, blended })
    setPhase({ kind: 'report' })
    top()
  }

  let body: React.ReactNode
  switch (phase.kind) {
    case 'landing':
      body = (
        <Landing
          hasSaved={!!progress.capstone}
          onStart={playAgain}
          onView={() => {
            setPhase({ kind: 'saved' })
            top()
          }}
        />
      )
      break
    case 'decide': {
      const d = DECISIONS[phase.i]
      body = (
        <DecisionCard
          key={d.key}
          i={phase.i}
          picked={draft[d.key]}
          onPick={(id) => setDraft({ ...draft, [d.key]: id })}
          onBack={() => {
            if (phase.fromPlan) setPhase({ kind: 'plan' })
            else if (phase.i === 0) setPhase({ kind: 'landing' })
            else setPhase({ kind: 'decide', i: phase.i - 1, fromPlan: false })
            top()
          }}
          backLabel={phase.fromPlan ? 'Back to plan' : phase.i === 0 ? 'Back to intro' : 'Previous'}
          onLock={() => {
            if (phase.fromPlan || phase.i === DECISIONS.length - 1) setPhase({ kind: 'plan' })
            else setPhase({ kind: 'decide', i: phase.i + 1, fromPlan: false })
            top()
          }}
        />
      )
      break
    }
    case 'plan':
      body = (
        <Plan
          draft={draft}
          onEdit={(i) => {
            setPhase({ kind: 'decide', i, fromPlan: true })
            top()
          }}
          onLaunch={() => {
            if (DECISIONS.some((d) => !draft[d.key])) return
            grow(newSim(draft as Choices), 0)
          }}
        />
      )
      break
    case 'growing':
    case 'event':
    case 'summary':
      body = sim && (
        <StageView
          sim={sim}
          phase={phase}
          cur={cur}
          onRespond={respond}
          onUpgrade={decideUpgrade}
          onNext={nextFromEvent}
          onGrow={() => (sim.stage < 3 ? grow(sim, sim.stage + 1) : finish())}
        />
      )
      break
    case 'report':
      body = result && sim && <Report result={result} sim={sim} onPlayAgain={playAgain} />
      break
    case 'saved':
      body = progress.capstone ? (
        <SavedReport at={progress.capstone.at} scores={progress.capstone.scores} onPlayAgain={playAgain} />
      ) : (
        <Landing hasSaved={false} onStart={playAgain} onView={() => undefined} />
      )
      break
  }

  return (
    <main className="page cap">
      <div className="stack lg">{body}</div>
    </main>
  )
}

/* ============================================================ landing */

function Landing({ hasSaved, onStart, onView }: { hasSaved: boolean; onStart: () => void; onView: () => void }) {
  return (
    <>
      <BackLink to="/" label="Home" />
      <header className="stack sm">
        <div className="kicker">Final capstone</div>
        <h1>Build a software company</h1>
        <p className="lead">Make the founding calls, then live with them from 10 to 10,000 users.</p>
      </header>

      <section className="card cap-hero stack">
        <div className="row nowrap" style={{ gap: 12 }}>
          <span style={{ fontSize: 40 }} aria-hidden="true">
            ✈️
          </span>
          <div className="grow">
            <h2 style={{ fontFamily: 'var(--font)', fontWeight: 750 }}>FlightLog</h2>
            <p className="small ink2">Maintenance tracking for small-aircraft owners and their mechanics.</p>
          </div>
        </div>
        <div className="callout warn stack sm">
          <b>The customer problem</b>
          <span>
            Dana owns a 1978 Cessna. Its whole maintenance history lives in three paper logbooks and a shoebox of receipts.
          </span>
        </div>
        <ul className="stack sm small ink2" style={{ margin: 0, paddingLeft: 20 }}>
          <li>Miss an inspection and the plane is grounded — or unsafe.</li>
          <li>Lost logbooks can cut a plane’s resale value by 20%.</li>
          <li>Her mechanic re-types everything, every visit.</li>
        </ul>
      </section>

      <section className="stack sm">
        <div className="kicker">How it works</div>
        <ol className="stack sm" style={{ margin: 0, paddingLeft: 22 }}>
          <li>
            <b>13 founding decisions.</b> <span className="ink2">Each has real tradeoffs.</span>
          </li>
          <li>
            <b>Grow: 10 → 100 → 1,000 → 10,000 users.</b>{' '}
            <span className="ink2">Outages, attacks and surprises test your choices.</span>
          </li>
          <li>
            <b>Readiness report.</b> <span className="ink2">Your strengths, gaps and what to revisit.</span>
          </li>
        </ol>
        <p className="tiny muted">About 12 minutes. There’s no perfect path — the goal is to see consequences.</p>
      </section>

      <div className="stack sm">
        {hasSaved ? (
          <>
            <button type="button" className="btn primary block" onClick={onView}>
              View last report
            </button>
            <button type="button" className="btn block" onClick={onStart}>
              Play again
            </button>
          </>
        ) : (
          <button type="button" className="btn primary block" onClick={onStart}>
            Start: found FlightLog →
          </button>
        )}
      </div>
    </>
  )
}

/* ============================================================ decisions */

function DecisionCard({
  i,
  picked,
  onPick,
  onLock,
  onBack,
  backLabel,
}: {
  i: number
  picked?: string
  onPick: (id: string) => void
  onLock: () => void
  onBack: () => void
  backLabel: string
}) {
  const d = DECISIONS[i]
  return (
    <>
      <button type="button" className="btn ghost small" style={{ alignSelf: 'flex-start', marginLeft: -10 }} onClick={onBack}>
        ← {backLabel}
      </button>
      <div className="stack sm">
        <div className="row between">
          <span className="kicker">
            Decision {i + 1} of {DECISIONS.length}
          </span>
          <span className="row" style={{ gap: 4 }}>
            {d.skills.map((s) => (
              <span key={s} className="pill">
                {SKILLS.find((x) => x.id === s)?.label}
              </span>
            ))}
          </span>
        </div>
        <Meter value={(i + 1) / DECISIONS.length} label="Decisions made" />
      </div>
      <section className="card stack pop">
        <div className="stack sm">
          <div className="kicker">{d.title}</div>
          <h2>{d.question}</h2>
        </div>
        <div className="stack sm" role="group" aria-label={d.title}>
          {d.options.map((o) => (
            <button key={o.id} type="button" className="chip cap-opt" aria-pressed={picked === o.id} onClick={() => onPick(o.id)}>
              <span className="e" aria-hidden="true">
                {o.emoji}
              </span>
              <span className="stack" style={{ gap: 2 }}>
                <b style={{ lineHeight: 1.3 }}>{o.label}</b>
                <span className="small ink2" style={{ fontWeight: 450 }}>
                  {o.tradeoff}
                </span>
              </span>
            </button>
          ))}
        </div>
      </section>
      <button type="button" className="btn primary block" disabled={!picked} onClick={onLock}>
        {picked ? 'Lock it in →' : 'Pick an option'}
      </button>
    </>
  )
}

function Plan({ draft, onEdit, onLaunch }: { draft: Partial<Choices>; onEdit: (i: number) => void; onLaunch: () => void }) {
  return (
    <>
      <header className="stack sm">
        <div className="kicker">Launch plan</div>
        <h2>Your FlightLog blueprint</h2>
        <p className="small ink2">Tap any decision to change it. Once you launch, choices stick — unless events give you a chance to fix them.</p>
      </header>
      <ul className="stack sm" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {DECISIONS.map((d, i) => {
          const o = draft[d.key] ? optionOf(d.key, draft[d.key]!) : undefined
          return (
            <li key={d.key}>
              <button type="button" className="chip cap-opt" onClick={() => onEdit(i)} aria-label={`Change ${d.title}: ${o?.label ?? 'not chosen'}`}>
                <span className="e" aria-hidden="true">
                  {o?.emoji ?? '❔'}
                </span>
                <span className="stack grow" style={{ gap: 0 }}>
                  <span className="tiny muted" style={{ fontWeight: 650 }}>
                    {d.title}
                  </span>
                  <span style={{ lineHeight: 1.3 }}>{o?.label ?? 'Not chosen'}</span>
                </span>
                <span className="tiny muted" aria-hidden="true" style={{ alignSelf: 'center' }}>
                  Edit
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      <button type="button" className="btn primary block" onClick={onLaunch}>
        Launch FlightLog 🚀
      </button>
    </>
  )
}

/* ============================================================ simulation */

function useTween(target: Stats): Stats {
  const [shown, setShown] = useState(target)
  const curr = useRef(target)
  useEffect(() => {
    let live = true
    const from = curr.current
    const steps = prefersReducedMotion() ? 1 : 18
    void (async () => {
      for (let k = 1; k <= steps; k++) {
        await wait(32)
        if (!live) return
        const t = 1 - Math.pow(1 - k / steps, 3)
        const m = (a: number, b: number) => a + (b - a) * t
        const v: Stats = {
          users: m(from.users, target.users),
          mrr: m(from.mrr, target.mrr),
          bill: m(from.bill, target.bill),
          margin: from.margin === null || target.margin === null ? target.margin : m(from.margin, target.margin),
          uptime: m(from.uptime, target.uptime),
          team: m(from.team, target.team),
          trust: m(from.trust, target.trust),
        }
        curr.current = v
        setShown(v)
      }
    })()
    return () => {
      live = false
    }
  }, [target])
  return shown
}

const fmtMargin = (m: number | null) => (m === null ? '—' : m < -1 ? '< −100%' : `${Math.round(m * 100)}%`)

function Dashboard({ sim }: { sim: Sim }) {
  const target = useMemo(() => computeStats(sim), [sim])
  const s = useTween(target)
  const trustColor = s.trust >= 65 ? 'var(--good)' : s.trust >= 40 ? 'var(--warn)' : 'var(--bad)'
  const tiles: { l: string; v: string; cls?: string }[] = [
    { l: 'Users', v: num(s.users) },
    { l: 'MRR', v: money(s.mrr) },
    { l: 'Cloud bill / mo', v: money(s.bill), cls: s.bill > s.mrr ? 'bad-text' : undefined },
    { l: 'Gross margin', v: fmtMargin(s.margin), cls: s.margin === null || s.margin < 0 ? 'bad-text' : s.margin < 0.6 ? 'warn-text' : undefined },
    { l: 'Uptime', v: `${s.uptime.toFixed(2)}%`, cls: s.uptime < 99 ? 'bad-text' : s.uptime < 99.5 ? 'warn-text' : undefined },
    { l: 'Team', v: num(s.team) },
  ]
  return (
    <section className="card tight stack sm" aria-label="Company stats">
      <div className="row between">
        <span className="kicker">✈️ FlightLog</span>
        <span className="tiny muted">Stage {sim.stage + 1} of 4</span>
      </div>
      <div className="cap-track" aria-hidden="true">
        {STAGE_NAMES.map((n, i) => (
          <span key={n} className={i < sim.stage ? 'done' : i === sim.stage ? 'now' : ''}>
            {n}
          </span>
        ))}
      </div>
      <div className="cap-stats" aria-hidden="true">
        {tiles.map((t) => (
          <div key={t.l} className="stat">
            <span className={`v ${t.cls ?? ''}`}>{t.v}</span>
            <span className="l">{t.l}</span>
          </div>
        ))}
      </div>
      <div className="stack" style={{ gap: 4 }} aria-hidden="true">
        <div className="row between small">
          <span className="ink2">Customer trust</span>
          <b style={{ color: trustColor }}>{Math.round(s.trust)}/100</b>
        </div>
        <Meter value={s.trust / 100} color={trustColor} />
      </div>
      <p className="sr-only" aria-live="polite">
        {`Stage ${STAGE_NAMES[sim.stage]} users. Users ${num(target.users)}, monthly revenue ${money(target.mrr)}, cloud bill ${money(
          target.bill,
        )}, gross margin ${fmtMargin(target.margin)}, uptime ${target.uptime.toFixed(2)} percent, team ${target.team}, customer trust ${target.trust} of 100.`}
      </p>
    </section>
  )
}

function fxChips(fx: Fx): { t: string; good: boolean }[] {
  const out: { t: string; good: boolean }[] = []
  if (fx.trust) out.push({ t: `Trust ${fx.trust > 0 ? '+' : '−'}${Math.abs(fx.trust)}`, good: fx.trust > 0 })
  if (fx.down && fx.down >= 0.5) out.push({ t: `${Math.round(fx.down)}h downtime`, good: false })
  if (fx.users && fx.users !== 1) out.push({ t: `Users ${fx.users > 1 ? '+' : '−'}${Math.round(Math.abs(fx.users - 1) * 100)}%`, good: fx.users > 1 })
  if (fx.bill) out.push({ t: `Bill ${fx.bill > 0 ? '+' : '−'}${money(Math.abs(fx.bill))}/mo`, good: fx.bill < 0 })
  if (fx.team) out.push({ t: `Team ${fx.team > 0 ? '+' : '−'}${Math.abs(fx.team)}`, good: fx.team > 0 })
  return out
}

function Chips({ fx }: { fx: Fx }) {
  const chips = fxChips(fx)
  if (!chips.length) return <span className="pill">No lasting damage</span>
  return (
    <div className="row" style={{ gap: 6 }}>
      {chips.map((c) => (
        <span key={c.t} className={`pill ${c.good ? 'good-text' : 'bad-text'}`}>
          {c.t}
        </span>
      ))}
    </div>
  )
}

function StageView({
  sim,
  phase,
  cur,
  onRespond,
  onUpgrade,
  onNext,
  onGrow,
}: {
  sim: Sim
  phase: Phase
  cur: Current | null
  onRespond: (i: number) => void
  onUpgrade: (yes: boolean) => void
  onNext: () => void
  onGrow: () => void
}) {
  const stageEvents = eventsInStage(sim.stage)
  return (
    <>
      <Dashboard sim={sim} />
      {phase.kind === 'growing' && (
        <section className="card stack center pop" aria-live="polite">
          <div style={{ fontSize: 44 }} aria-hidden="true" className="pulse">
            {sim.stage === 0 ? '🚀' : '📈'}
          </div>
          <h2>{sim.stage === 0 ? 'Launching to your first 10 users…' : `Growing to ${STAGE_NAMES[sim.stage]} users…`}</h2>
          <p className="small muted">Watch the numbers move.</p>
        </section>
      )}
      {phase.kind === 'event' && cur && (
        <EventCard
          key={phase.idx}
          idx={phase.idx}
          n={stageEvents.findIndex((e) => e.id === EVENTS[phase.idx].id) + 1}
          of={stageEvents.length}
          sim={sim}
          cur={cur}
          onRespond={onRespond}
          onUpgrade={onUpgrade}
          onNext={onNext}
        />
      )}
      {phase.kind === 'summary' && <StageSummary sim={sim} onGrow={onGrow} />}
    </>
  )
}

function EventCard({
  idx,
  n,
  of,
  sim,
  cur,
  onRespond,
  onUpgrade,
  onNext,
}: {
  idx: number
  n: number
  of: number
  sim: Sim
  cur: Current
  onRespond: (i: number) => void
  onUpgrade: (yes: boolean) => void
  onNext: () => void
}) {
  const ev = EVENTS[idx]
  const tone = worstTone(cur.lines)
  const picked = cur.picked
  const best = ev.responses.reduce((b, r, i) => (r.q > ev.responses[b].q ? i : b), 0)
  const ready = picked !== null && (!cur.upgrade || cur.upgradeDone !== null)
  const u = cur.upgrade
  return (
    <section className="card stack pop" aria-labelledby={`ev-${ev.id}`}>
      <div className="row between">
        <span className="kicker">
          {STAGE_NAMES[sim.stage]} users · event {n} of {of}
        </span>
      </div>
      <div className="row nowrap" style={{ gap: 12, alignItems: 'flex-start' }}>
        <span style={{ fontSize: 34, lineHeight: 1 }} aria-hidden="true">
          {ev.emoji}
        </span>
        <h2 id={`ev-${ev.id}`}>{ev.title}</h2>
      </div>
      <p>{ev.story}</p>

      <div className={`callout ${tone} stack sm`}>
        <b>
          {TONE_ICON[tone]} {tone === 'good' ? 'Your choices paid off' : tone === 'warn' ? 'It stung' : 'It hurt'}
        </b>
        {cur.lines.map((l, i) => (
          <span key={i}>
            Because you chose <b>“{labelOf(l.key, cur.at[l.key])}”</b>, {l.text}
          </span>
        ))}
        <Chips fx={cur.fx} />
      </div>

      <div className="divider" />
      <h3>{ev.prompt}</h3>
      <div className="stack sm" role="group" aria-label="Your response">
        {cur.order.map((i) => {
          const r = ev.responses[i]
          const isPicked = picked === i
          const cls = picked === null ? '' : isPicked ? (r.q >= 0.9 ? 'good' : r.q >= 0.4 ? 'on' : 'bad') : i === best ? 'good' : ''
          return (
            <div key={i} className="stack sm">
              <button
                type="button"
                className={`chip ${cls}`}
                disabled={picked !== null}
                aria-pressed={picked === null ? undefined : isPicked}
                onClick={() => onRespond(i)}
                style={{ padding: '12px 14px', opacity: 1 }}
              >
                {r.text}
              </button>
              {picked !== null && !isPicked && (
                <p className="tiny muted" style={{ padding: '0 6px' }}>
                  {i === best ? '⭐ Best move: ' : ''}
                  {r.why}
                </p>
              )}
            </div>
          )
        })}
      </div>
      <div aria-live="polite" className="stack">
        {picked !== null && (
          <div className={`callout ${picked === best ? 'good' : ev.responses[picked].q >= 0.4 ? 'warn' : 'bad'} stack sm pop`}>
            <span>
              <b>{picked === best ? 'Strong call. ' : ev.responses[picked].q >= 0.4 ? 'Reasonable, not ideal. ' : 'Ouch. '}</b>
              {ev.responses[picked].why}
            </span>
            {ev.responses[picked].fx && <Chips fx={ev.responses[picked].fx!} />}
          </div>
        )}
        {picked !== null && u && (
          <div className="well stack sm pop">
            <b>🔧 Change an earlier decision?</b>
            <span className="small ink2">
              {u.pitch} You chose “{labelOf(u.key, cur.at[u.key])}”.
            </span>
            <span className="tiny muted">Cost: a week of focus (growth −4%) and a different monthly bill.</span>
            {cur.upgradeDone === null ? (
              <div className="grid2">
                <button type="button" className="btn primary small" onClick={() => onUpgrade(true)}>
                  Upgrade
                </button>
                <button type="button" className="btn small" onClick={() => onUpgrade(false)}>
                  Keep it
                </button>
              </div>
            ) : (
              <div className={`callout ${cur.upgradeDone === 'yes' ? 'good' : 'info'} small`}>
                {cur.upgradeDone === 'yes'
                  ? `Done: now using “${labelOf(u.key, u.to)}”. Future events will reflect it.`
                  : 'Kept as-is. Future events will reflect that too.'}
              </div>
            )}
          </div>
        )}
      </div>
      {ready && (
        <button type="button" className="btn primary block" onClick={onNext}>
          Continue →
        </button>
      )}
      <a className="tiny muted" href={href(`/lesson/${ev.lesson}`)} target="_blank" rel="noreferrer" style={{ alignSelf: 'flex-start' }}>
        Learn more: {lessonTitle(ev.lesson)} ↗
      </a>
    </section>
  )
}

function StageSummary({ sim, onGrow }: { sim: Sim; onGrow: () => void }) {
  const turns = sim.turns.slice(-eventsInStage(sim.stage).length)
  const last = sim.stage === 3
  return (
    <section className="card stack pop">
      <div className="kicker">Stage complete</div>
      <h2>{last ? 'FlightLog made it to 10,000 users' : `You survived ${STAGE_NAMES[sim.stage]} users`}</h2>
      <ul className="stack sm" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {turns.map((t) => {
          const ev = EVENTS.find((e) => e.id === t.eventId)!
          return (
            <li key={t.eventId} className="row nowrap" style={{ alignItems: 'flex-start' }}>
              <span aria-hidden="true">{TONE_ICON[t.tone]}</span>
              <span className="small">
                <b>{ev.title}</b> <span className="muted">— {t.tone === 'good' ? 'handled well' : t.tone === 'warn' ? 'bumpy' : 'painful'}</span>
              </span>
            </li>
          )
        })}
      </ul>
      <p className="small ink2">
        {last ? 'Time to see what this run says about you as a founder.' : 'Same decisions, 10× the users. Small cracks get bigger.'}
      </p>
      <button type="button" className="btn primary block" onClick={onGrow}>
        {last ? 'See your readiness report →' : `Grow to ${STAGE_NAMES[sim.stage + 1]} users →`}
      </button>
    </section>
  )
}

/* ============================================================ report */

function verdict(avg: number) {
  if (avg >= 80) return { t: 'Ready to lead', e: '🏆' }
  if (avg >= 60) return { t: 'Solid foundation', e: '🧭' }
  if (avg >= 40) return { t: 'Getting there', e: '🌱' }
  return { t: 'Early days', e: '🛫' }
}

function SkillBars({ blended, simS, lessons }: { blended: Record<string, number>; simS?: Record<string, number>; lessons?: Record<string, number> }) {
  return (
    <div className="stack">
      {SKILLS.map((s) => {
        const v = blended[s.id] ?? 0
        const color = v >= 70 ? 'var(--good)' : v >= 45 ? 'var(--warn)' : 'var(--bad)'
        return (
          <div key={s.id} className="stack" style={{ gap: 4 }}>
            <div className="row between nowrap small">
              <span style={{ fontWeight: 650, textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: 13 }}>{s.label}</span>
              <b style={{ color }}>{v}%</b>
            </div>
            <Meter value={v / 100} color={color} label={`${s.label} ${v}%`} />
            {simS && lessons && (
              <span className="tiny muted">
                Capstone {simS[s.id]}% · Lessons {lessons[s.id]}%
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

function Recommendations({ blended, extra }: { blended: Record<string, number>; extra: { lesson: string; why: string }[] }) {
  const ranked = [...SKILLS].sort((a, b) => (blended[b.id] ?? 0) - (blended[a.id] ?? 0))
  const strengths = ranked.filter((s) => (blended[s.id] ?? 0) >= 60).slice(0, 3)
  const weak = [...ranked].reverse().filter((s) => (blended[s.id] ?? 0) < 60).slice(0, 3)
  const recs: { lesson: string; why: string }[] = []
  const seen = new Set<string>()
  const push = (lesson: string, why: string) => {
    if (seen.has(lesson) || recs.length >= 6) return
    seen.add(lesson)
    recs.push({ lesson, why })
  }
  extra.forEach((r) => push(r.lesson, r.why))
  const weakOrLowest = weak.length ? weak : ranked.slice(-2).reverse()
  for (const s of weakOrLowest) for (const l of SKILL_LESSONS[s.id].slice(0, 2)) push(l, `Builds ${s.label.toLowerCase()}`)

  return (
    <>
      <div className="grid2" style={{ alignItems: 'start' }}>
        <section className="callout good stack sm">
          <b>💪 Strengths</b>
          {strengths.length ? (
            strengths.map((s) => (
              <span key={s.id} className="small">
                {s.label} · {blended[s.id]}%
              </span>
            ))
          ) : (
            <span className="small">Strongest so far: {ranked[0].label}. Keep going!</span>
          )}
        </section>
        <section className="callout warn stack sm">
          <b>🎯 Grow next</b>
          {weak.length ? (
            weak.map((s) => (
              <span key={s.id} className="small">
                {s.label} · {blended[s.id]}%
              </span>
            ))
          ) : (
            <span className="small">No weak spots — sharpen {ranked[ranked.length - 1].label}.</span>
          )}
        </section>
      </div>
      <section className="stack sm">
        <div className="kicker">Revisit these lessons</div>
        {recs.map((r) => (
          <a key={r.lesson} className="card tight row nowrap" href={href(`/lesson/${r.lesson}`)} style={{ textDecoration: 'none', gap: 12 }}>
            <span aria-hidden="true">▶</span>
            <span className="grow stack" style={{ gap: 0 }}>
              <b className="small">{lessonTitle(r.lesson)}</b>
              <span className="tiny muted">{r.why}</span>
            </span>
          </a>
        ))}
      </section>
    </>
  )
}

const Footnote = () => (
  <p className="tiny muted">
    * Each skill blends 50% your capstone calls (founding decisions, event responses and fixes) with 50% what you’ve shown in
    lessons (first-try quiz answers). Finish more lessons to lift the lesson half.
  </p>
)

function Report({
  result,
  sim,
  onPlayAgain,
}: {
  result: { sim: Record<Skill, number>; lessons: Record<Skill, number>; blended: Record<Skill, number> }
  sim: Sim
  onPlayAgain: () => void
}) {
  const stats = computeStats(sim)
  const avg = Math.round(SKILLS.reduce((a, s) => a + result.blended[s.id], 0) / SKILLS.length)
  const v = verdict(avg)
  const extra: { lesson: string; why: string }[] = []
  for (const d of DECISIONS)
    if (quality(d.key, sim.initial) < 0.5) extra.push({ lesson: d.lesson, why: `You chose “${labelOf(d.key, sim.initial[d.key])}”` })
  const simAvg = Math.round(SKILLS.reduce((a, s) => a + result.sim[s.id], 0) / SKILLS.length)
  const lessonAvg = Math.round(SKILLS.reduce((a, s) => a + result.lessons[s.id], 0) / SKILLS.length)
  const healthy = stats.trust >= 65 && (stats.margin ?? -1) >= 0.6

  return (
    <>
      <header className="stack sm">
        <div className="kicker">Capstone complete</div>
        <h1 style={{ fontSize: 'clamp(26px, 7.5vw, 36px)' }}>Software Founder Readiness Report</h1>
      </header>

      <section className="card stack center">
        <div style={{ fontSize: 44 }} aria-hidden="true">
          {v.e}
        </div>
        <h2>{v.t}</h2>
        <p className="lead">Overall readiness: <b style={{ color: 'var(--ink)' }}>{avg}%</b></p>
        <p className="small ink2">
          Capstone calls <b>{simAvg}%</b> · Lessons <b>{lessonAvg}%</b>
        </p>
        {lessonAvg < 40 && simAvg >= 60 && (
          <p className="callout info small" style={{ textAlign: 'left' }}>
            Great founder instincts! Readiness also counts what you’ve proven in lessons — finish more to raise it.
          </p>
        )}
      </section>

      <section className="card stack sm">
        <div className="kicker">Where FlightLog ended up</div>
        <div className="cap-stats">
          <div className="stat"><span className="v">{num(stats.users)}</span><span className="l">Users</span></div>
          <div className="stat"><span className="v">{money(stats.mrr)}</span><span className="l">MRR</span></div>
          <div className="stat"><span className="v">{fmtMargin(stats.margin)}</span><span className="l">Gross margin</span></div>
          <div className="stat"><span className="v">{stats.uptime.toFixed(2)}%</span><span className="l">Uptime</span></div>
          <div className="stat"><span className="v">{stats.trust}</span><span className="l">Trust /100</span></div>
          <div className="stat"><span className="v">{stats.team}</span><span className="l">Team</span></div>
        </div>
        <p className="small ink2">
          {healthy
            ? 'A healthy, trusted business. Your early calls made growth boring — in the best way.'
            : stats.trust < 40
              ? 'FlightLog survived, but customers are wary. Most of the damage traces back to a few early shortcuts.'
              : 'FlightLog is alive and growing, with some scars. Each one below has a clear cause.'}
        </p>
        {sim.upgrades.length > 0 && (
          <p className="tiny muted">Fixes you made along the way: {sim.upgrades.join('; ')}.</p>
        )}
      </section>

      <details className="card tight">
        <summary style={{ cursor: 'pointer', fontWeight: 700, minHeight: 32, display: 'flex', alignItems: 'center' }}>
          Turning points ({sim.turns.length}) ▾
        </summary>
        <ol className="stack sm" style={{ margin: '10px 0 0', paddingLeft: 0, listStyle: 'none' }}>
          {sim.turns.map((t) => (
            <li key={t.eventId} className="stack" style={{ gap: 2 }}>
              <b className="small">
                {TONE_ICON[t.tone]} {EVENTS.find((e) => e.id === t.eventId)?.title}
              </b>
              {t.lines.map((l, i) => (
                <span key={i} className="tiny ink2">
                  {l}
                </span>
              ))}
            </li>
          ))}
        </ol>
      </details>

      <section className="card stack">
        <div className="kicker">Skills *</div>
        <SkillBars blended={result.blended} simS={result.sim} lessons={result.lessons} />
        <Footnote />
      </section>

      <Recommendations blended={result.blended} extra={extra} />

      <div className="stack sm">
        <button type="button" className="btn primary block" onClick={onPlayAgain}>
          Play again
        </button>
        <a className="btn block" href={href('/')}>
          Back to home
        </a>
      </div>
    </>
  )
}

function SavedReport({ at, scores, onPlayAgain }: { at: number; scores: Record<string, number>; onPlayAgain: () => void }) {
  const avg = Math.round(SKILLS.reduce((a, s) => a + (scores[s.id] ?? 0), 0) / SKILLS.length)
  const v = verdict(avg)
  return (
    <>
      <BackLink to="/" label="Home" />
      <header className="stack sm">
        <div className="kicker">Last capstone · {new Date(at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
        <h1 style={{ fontSize: 'clamp(26px, 7.5vw, 36px)' }}>Software Founder Readiness Report</h1>
      </header>
      <section className="card stack center">
        <div style={{ fontSize: 44 }} aria-hidden="true">
          {v.e}
        </div>
        <h2>{v.t}</h2>
        <p className="lead">Overall readiness: <b style={{ color: 'var(--ink)' }}>{avg}%</b></p>
      </section>
      <section className="card stack">
        <div className="kicker">Skills *</div>
        <SkillBars blended={scores} />
        <Footnote />
      </section>
      <Recommendations blended={scores} extra={[]} />
      <div className="stack sm">
        <button type="button" className="btn primary block" onClick={onPlayAgain}>
          Play again
        </button>
        <a className="btn block" href={href('/')}>
          Back to home
        </a>
      </div>
    </>
  )
}
