import { useEffect, useRef, useState } from 'react'
import { wait } from '../lib/motion'

const STAGES = [
  { id: 'laptop', emoji: '💻', label: 'My laptop' },
  { id: 'github', emoji: '🐙', label: 'GitHub' },
  { id: 'ci', emoji: '🤖', label: 'CI' },
  { id: 'build', emoji: '🏗️', label: 'Build' },
  { id: 'hosting', emoji: '🏠', label: 'Hosting' },
  { id: 'live', emoji: '🌍', label: 'Live website' },
] as const

type StageId = (typeof STAGES)[number]['id']
type St = 'idle' | 'active' | 'ok' | 'fail'

interface RunDef {
  button: string
  commit: string
  lines: { at: StageId; text: string; err?: boolean }[]
  failAt?: StageId
  /** Why each wrong stage guess is wrong. */
  hints?: Partial<Record<StageId, string>>
  reasons?: { text: string; right: boolean; why: string }[]
  success: string
}

const RUNS: RunDef[] = [
  {
    button: '🚀 DEPLOY',
    commit: 'Add dark mode',
    lines: [
      { at: 'laptop', text: '$ git push   (“Add dark mode”)' },
      { at: 'github', text: 'Push received on main' },
      { at: 'ci', text: 'Running 214 tests… 214 passed' },
      { at: 'build', text: 'Installing packages… done' },
      { at: 'build', text: 'Bundling app… done (2.1 MB)' },
      { at: 'hosting', text: 'Uploading to servers… starting v13' },
      { at: 'hosting', text: 'Health check passed — switching traffic' },
      { at: 'live', text: 'v13 is live at acme-crm.app' },
    ],
    success: 'Three minutes from “git push” to every customer having dark mode — with tests and checks along the way. Nobody copied files by hand.',
  },
  {
    button: '🚀 Deploy Alex’s change',
    commit: 'Add calendar view',
    lines: [
      { at: 'laptop', text: '$ git push   (“Add calendar view”)' },
      { at: 'github', text: 'Push received on main' },
      { at: 'ci', text: 'Running 214 tests… 214 passed' },
      { at: 'build', text: 'Installing packages… done' },
      { at: 'build', text: 'Bundling app…' },
      { at: 'build', text: "ERROR: Cannot find module 'date-picker-pro'", err: true },
      { at: 'build', text: '  imported from src/calendar.tsx', err: true },
      { at: 'build', text: 'Exited with code 1. Deploy cancelled.', err: true },
    ],
    failAt: 'build',
    hints: {
      laptop: 'The laptop did its job: the code was pushed (first line).',
      github: 'GitHub received the push fine — see line 2.',
      ci: 'CI says 214 tests passed. That stage succeeded.',
      hosting: 'Nothing was ever uploaded to hosting — no line mentions servers.',
      live: 'The live site never changed. The failure happened before anything got there.',
    },
    reasons: [
      { text: 'The tests found a bug', right: false, why: 'Read the CI line again: 214 passed. Tests weren’t the problem.' },
      { text: 'The code uses a package that was never added to the project’s package list', right: true, why: 'Alex installed “date-picker-pro” on his laptop, so it worked there. The clean build machine had never heard of it.' },
      { text: 'Too many customers were online', right: false, why: 'Customers don’t affect a build. The build happens before anything reaches them.' },
    ],
    success: 'Diagnosed. The fix is one line in the package list. And notice: the live website stayed on v13 the whole time — a failed build never reaches customers.',
  },
  {
    button: '🚀 Deploy welcome emails',
    commit: 'Send welcome emails',
    lines: [
      { at: 'laptop', text: '$ git push   (“Send welcome emails”)' },
      { at: 'github', text: 'Push received on main' },
      { at: 'ci', text: 'Running 216 tests… 216 passed' },
      { at: 'build', text: 'Installing packages… done' },
      { at: 'build', text: 'Bundling app… done (2.2 MB)' },
      { at: 'hosting', text: 'Uploading to servers… starting v14' },
      { at: 'hosting', text: 'Error: EMAIL_API_KEY is not set', err: true },
      { at: 'hosting', text: 'Health check failed — v14 never became healthy', err: true },
      { at: 'hosting', text: 'Keeping v13 live. Deploy rolled back.', err: true },
    ],
    failAt: 'hosting',
    hints: {
      laptop: 'The push left the laptop fine.',
      github: 'GitHub received it — line 2.',
      ci: 'All 216 tests passed.',
      build: 'The build finished: “Bundling app… done (2.2 MB)”. It got further than that.',
      live: 'Close — but the new version never went live. Customers stayed on v13. Something stopped it just before.',
    },
    reasons: [
      { text: 'The build broke', right: false, why: 'The bundle was built successfully (2.2 MB). It failed later, when starting up.' },
      { text: 'The live servers are missing a setting the code needs', right: true, why: 'It worked on the laptop because the laptop has EMAIL_API_KEY in a local settings file. Production’s hosting settings didn’t have it yet.' },
      { text: 'GitHub lost the code', right: false, why: 'The code reached GitHub, CI and the build. The problem is a missing setting, not missing code.' },
    ],
    success: 'Diagnosed. Add EMAIL_API_KEY to the hosting platform’s secret settings and redeploy. That’s exactly the next lesson: environments & secrets.',
  },
]

/** Press DEPLOY, then diagnose two failed deploys from their logs. */
export function DeployConsole({ onDone }: { onDone?: () => void }) {
  const [runIdx, setRunIdx] = useState(0)
  const [st, setSt] = useState<Partial<Record<StageId, St>>>({})
  const [lines, setLines] = useState<RunDef['lines']>([])
  const [phase, setPhase] = useState<'ready' | 'running' | 'stage' | 'why' | 'solved'>('ready')
  const [version, setVersion] = useState(12)
  const [stagePick, setStagePick] = useState<StageId | null>(null)
  const [whyPick, setWhyPick] = useState<number | null>(null)
  const alive = useRef(true)
  const fired = useRef(false)
  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])

  const run = RUNS[runIdx]
  const failed = !!run.failAt

  async function deploy() {
    setPhase('running')
    setSt({})
    setLines([])
    setStagePick(null)
    setWhyPick(null)
    let prev: StageId | null = null
    for (const l of run.lines) {
      if (l.at !== prev) {
        if (prev && !failed) {
          const p = prev
          setSt((x) => ({ ...x, [p]: 'ok' }))
        }
        if (!failed) {
          const a = l.at
          setSt((x) => ({ ...x, [a]: 'active' }))
        }
        prev = l.at
      }
      setLines((x) => [...x, l])
      await wait(l.err ? 500 : 650)
      if (!alive.current) return
    }
    if (!failed) {
      setSt((x) => ({ ...x, live: 'ok' }))
      setVersion(13)
      setPhase('solved')
    } else {
      // During a failed run we deliberately don't reveal which stage broke.
      setSt({})
      setPhase('stage')
    }
  }

  function pickStage(s: StageId) {
    setStagePick(s)
    if (s === run.failAt) {
      setSt(() => {
        const out: Partial<Record<StageId, St>> = {}
        for (const x of STAGES) {
          if (x.id === s) {
            out[x.id] = 'fail'
            break
          }
          out[x.id] = 'ok'
        }
        return out
      })
      setPhase('why')
    }
  }

  function pickWhy(i: number) {
    setWhyPick(i)
    if (run.reasons?.[i].right) {
      setPhase('solved')
      if (runIdx === RUNS.length - 1 && !fired.current) {
        fired.current = true
        onDone?.()
      }
    }
  }

  function nextRun() {
    setRunIdx(runIdx + 1)
    setPhase('ready')
    setSt({})
    setLines([])
  }

  return (
    <div className="stack">
      <div className="row between">
        <span className="kicker">
          Deploy #{runIdx + 1} of {RUNS.length}
        </span>
        <span className="tiny muted">commit: “{run.commit}”</span>
      </div>

      <div className="grid3" style={{ gap: 6 }}>
        {STAGES.map((s) => {
          const x = st[s.id] ?? 'idle'
          const pickable = phase === 'stage'
          const wrong = phase === 'stage' && stagePick === s.id && s.id !== run.failAt
          return (
            <button
              key={s.id}
              type="button"
              className={`node ${wrong ? 'warn' : x === 'idle' ? '' : x}`}
              disabled={!pickable}
              onClick={() => pickStage(s.id)}
              style={{
                flexDirection: 'column',
                justifyContent: 'center',
                gap: 2,
                minHeight: 64,
                padding: '6px 4px',
                fontSize: 12,
                textAlign: 'center',
                cursor: pickable ? 'pointer' : 'default',
                outline: pickable ? '2px dashed var(--accent)' : undefined,
                outlineOffset: -4,
              }}
            >
              <span className="emoji" aria-hidden="true">
                {s.emoji}
              </span>
              <span>{s.label}</span>
            </button>
          )
        })}
      </div>

      {phase === 'ready' && (
        <button
          type="button"
          className="btn primary block"
          onClick={deploy}
          style={{ minHeight: 64, fontSize: 22, letterSpacing: '0.04em', borderRadius: 18 }}
        >
          {run.button}
        </button>
      )}

      {lines.length > 0 && (
        <div
          className="code"
          role="log"
          aria-label="Deploy log"
          style={{ fontSize: 12, background: '#16181d', color: '#d9dce3', borderColor: '#16181d', minHeight: 60 }}
        >
          {lines.map((l, i) => (
            <div key={i} style={l.err ? { color: '#ff8787' } : undefined}>
              {l.text}
            </div>
          ))}
          {phase === 'running' && <span className="pulse">▍</span>}
        </div>
      )}

      {phase === 'stage' && (
        <div className="stack sm pop" aria-live="polite">
          <div className="callout bad small">
            <b>❌ Deploy #{runIdx + 1} failed.</b> Read the log. Then tap the stage above where it broke.
          </div>
          {stagePick && stagePick !== run.failAt && <div className="callout warn small">{run.hints?.[stagePick]}</div>}
        </div>
      )}

      {(phase === 'why' || (phase === 'solved' && failed)) && run.reasons && (
        <div className="stack sm pop">
          <div className="kicker">✓ It broke at {STAGES.find((s) => s.id === run.failAt)?.label}. Why?</div>
          {run.reasons.map((r, i) => (
            <button
              key={i}
              type="button"
              className={`chip ${whyPick === i ? (r.right ? 'good' : 'bad') : ''}`}
              disabled={phase === 'solved'}
              onClick={() => pickWhy(i)}
            >
              {r.text}
            </button>
          ))}
          {whyPick !== null && !run.reasons[whyPick].right && <div className="small">{run.reasons[whyPick].why}</div>}
        </div>
      )}

      {phase === 'solved' && (
        <div className="callout good small pop">
          {failed && whyPick !== null && <b>{run.reasons?.[whyPick].why} </b>}
          {run.success}
        </div>
      )}

      <div className="phone">
        <div className="screen" style={{ minHeight: 0 }}>
          <div className="row between">
            <span className="tiny muted">🌍 acme-crm.app</span>
            <span className="pill">v{version}</span>
          </div>
          <div style={{ fontWeight: 600 }}>{version >= 13 ? '🌙 Dark mode is here!' : '☀️ Welcome to Acme CRM'}</div>
          {failed && phase !== 'ready' && phase !== 'running' && (
            <div className="tiny good-text">Still serving v13 — customers noticed nothing.</div>
          )}
        </div>
      </div>

      {phase === 'solved' && runIdx < RUNS.length - 1 && (
        <button type="button" className="btn ink block" onClick={nextRun}>
          Next deploy →
        </button>
      )}
    </div>
  )
}
