import { useState } from 'react'

type StageId = 's10' | 's100' | 's1000'

const STAGES: { id: StageId; label: string; team: string }[] = [
  { id: 's10', label: '10 customers', team: '2 founders' },
  { id: 's100', label: '100 customers', team: '~5 people' },
  { id: 's1000', label: '1,000 customers', team: '~12–15 people' },
]

const AREAS: { id: string; emoji: string; name: string; at: Record<StageId, { text: string; load: number }> }[] = [
  {
    id: 'support',
    emoji: '🎧',
    name: 'Support',
    at: {
      s10: { text: '~5 tickets a week. You answer them from your phone.', load: 15 },
      s100: { text: '~40 a week. A shared inbox, saved replies, the first help articles.', load: 55 },
      s1000: { text: '~300 a week. Needs a support person, a help center, and tags to spot repeat problems.', load: 95 },
    },
  },
  {
    id: 'oncall',
    emoji: '🚨',
    name: 'On-call',
    at: {
      s10: { text: 'If it breaks, a customer texts you.', load: 10 },
      s100: { text: 'Monitoring and alerts wake a founder. A status page saves 40 “is it down?” emails.', load: 50 },
      s1000: { text: 'Every outage hits hundreds of clinics. You need a rotation, runbooks and an incident process.', load: 90 },
    },
  },
  {
    id: 'onboard',
    emoji: '🚀',
    name: 'Onboarding',
    at: {
      s10: { text: 'You set up each clinic on a 2-hour call. They love it.', load: 20 },
      s100: { text: '~5 new clinics a week = 10 hours of calls. Templates help.', load: 60 },
      s1000: { text: '~40 new a week = 80 hours of calls if done by hand. It must become self-serve.', load: 100 },
    },
  },
  {
    id: 'process',
    emoji: '📋',
    name: 'Process',
    at: {
      s10: { text: 'Ship straight to production; decide in a group chat.', load: 10 },
      s100: { text: 'Pull requests, a staging environment, a written roadmap.', load: 45 },
      s1000: { text: 'Release schedule, change reviews, written security and access policies.', load: 80 },
    },
  },
  {
    id: 'hiring',
    emoji: '🧑‍🤝‍🧑',
    name: 'Hiring',
    at: {
      s10: { text: 'No one to hire yet. Founders do everything.', load: 5 },
      s100: { text: 'First engineer and part-time support. Writing things down starts to matter.', load: 50 },
      s1000: { text: 'Support, success, engineering, sales. Founders spend real time hiring and managing.', load: 85 },
    },
  },
]

const INVEST: { id: string; text: string; good: boolean; why: string }[] = [
  { id: 'help', text: '📚 Help center + in-app guided setup', good: true, why: 'Turns 80 hours a week of onboarding calls into something customers do on their own — and cuts repeat tickets.' },
  { id: 'rewrite', text: '🧱 Rewrite everything as microservices', good: false, why: 'Months of work that customers can’t see. At 1,000 customers your pain is people and process, not architecture.' },
  { id: 'rota', text: '📟 On-call rotation + runbooks', good: true, why: 'Shares the 2 a.m. pager so no one burns out, and runbooks let anyone on the rota fix the common problems.' },
  { id: 'features', text: '✨ Ship 10 new features this quarter', good: false, why: 'More features means more to support. If support and onboarding are already overloaded, this makes it worse.' },
  { id: 'hire', text: '🙋 Hire your first full-time support person', good: true, why: 'Support is now a full-time job. A dedicated person answers faster — and spots patterns the engineers should fix.' },
  { id: 'heroics', text: '🦸 Founders answer every ticket at night', good: false, why: 'It worked at 10 customers. At 1,000 it burns out the founders and stops them doing the work only they can do.' },
]

export function ScaleDial({ onDone }: { onDone?: () => void }) {
  const [stage, setStage] = useState<StageId>('s10')
  const [visited, setVisited] = useState<Set<StageId>>(new Set(['s10']))
  const [picked, setPicked] = useState<string[]>([])
  const [last, setLast] = useState<string | null>(null)
  const goodCount = picked.filter((id) => INVEST.find((x) => x.id === id)?.good).length

  function go(id: StageId) {
    setStage(id)
    setVisited((v) => new Set(v).add(id))
  }

  function pick(id: string) {
    if (picked.includes(id) || goodCount >= 3) return
    const next = [...picked, id]
    setPicked(next)
    setLast(id)
    const good = next.filter((x) => INVEST.find((i) => i.id === x)?.good).length
    if (good === 3) onDone?.()
  }

  const lastItem = INVEST.find((x) => x.id === last)

  return (
    <div className="stack">
      <div className="row" role="group" aria-label="Company size" style={{ gap: 6 }}>
        {STAGES.map((s) => (
          <button key={s.id} type="button" className="chip grow" aria-pressed={stage === s.id} onClick={() => go(s.id)} style={{ textAlign: 'center', padding: '8px 6px' }}>
            {s.label}
          </button>
        ))}
      </div>
      <p className="small muted center">
        Team: <b className="ink2">{STAGES.find((s) => s.id === stage)?.team}</b>
      </p>
      <div className="stack sm">
        {AREAS.map((a) => {
          const v = a.at[stage]
          const color = v.load >= 80 ? 'var(--bad)' : v.load >= 45 ? 'var(--warn)' : 'var(--good)'
          return (
            <div key={`${a.id}-${stage}`} className="card tight flat stack sm pop">
              <div className="row between nowrap">
                <b className="small">
                  {a.emoji} {a.name}
                </b>
                <span className="tiny muted">{v.load >= 80 ? 'Breaking' : v.load >= 45 ? 'Strained' : 'Easy'}</span>
              </div>
              <div className="meter" aria-hidden="true">
                <span style={{ width: `${v.load}%`, background: color }} />
              </div>
              <div className="small ink2">{v.text}</div>
            </div>
          )
        })}
      </div>

      {!visited.has('s1000') && <p className="small muted center">Step up to 100, then 1,000 customers.</p>}

      {visited.has('s1000') && (
        <div className="card stack sm pop">
          <div className="kicker">You’re at 1,000 customers</div>
          <div style={{ fontWeight: 650 }}>Pick the 3 investments for this quarter ({goodCount}/3 good picks)</div>
          {INVEST.map((x) => {
            const isPicked = picked.includes(x.id)
            return (
              <button
                key={x.id}
                type="button"
                className={`chip ${isPicked ? (x.good ? 'good' : 'bad') : ''}`}
                disabled={isPicked || goodCount >= 3}
                onClick={() => pick(x.id)}
                style={{ opacity: 1 }}
              >
                {isPicked ? (x.good ? '✓ ' : '✕ ') : ''}
                {x.text}
              </button>
            )
          })}
          <div aria-live="polite">
            {lastItem && (
              <div className={`callout ${lastItem.good ? 'good' : 'bad'} small pop`} key={lastItem.id}>
                {lastItem.why}
                {!lastItem.good && <span className="muted"> Pick something else.</span>}
              </div>
            )}
          </div>
          {goodCount >= 3 && (
            <div className="callout info small pop">
              Notice the pattern: what got you to 10 customers (founder heroics) is exactly what breaks at 1,000. Scaling is mostly turning
              people’s effort into systems.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
