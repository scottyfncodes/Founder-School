import { useEffect, useRef, useState } from 'react'
import { wait } from '../lib/motion'

const STAGES = [
  { id: 'code', emoji: '💻', label: 'Working code' },
  { id: 'commit', emoji: '📌', label: 'Commit' },
  { id: 'branch', emoji: '🌿', label: 'Branch' },
  { id: 'pr', emoji: '🔀', label: 'Pull request' },
  { id: 'ci', emoji: '🤖', label: 'CI tests' },
  { id: 'merge', emoji: '🧩', label: 'Merge' },
  { id: 'deploy', emoji: '🚀', label: 'Deploy' },
  { id: 'live', emoji: '🌍', label: 'Live app' },
] as const

type StageId = (typeof STAGES)[number]['id']
type St = 'idle' | 'active' | 'ok' | 'fail' | 'warn'
type ScenarioId = 'happy' | 'tests' | 'conflict' | 'deploy' | 'bad'

const SAY: Record<StageId, string> = {
  code: 'You change the checkout page on your laptop.',
  commit: 'Saved as a commit: “Show tax at checkout”.',
  branch: 'Pushed on branch “checkout-tax”, away from main.',
  pr: 'Pull request opened: “please review & merge into main”.',
  ci: 'Robots run 214 automated tests…',
  merge: 'Merged into main.',
  deploy: 'New version built and shipped to the servers.',
  live: 'Customers now see tax at checkout.',
}

const SCENARIOS: { id: ScenarioId; label: string; danger?: boolean }[] = [
  { id: 'happy', label: 'Happy path' },
  { id: 'tests', label: 'Tests fail', danger: true },
  { id: 'conflict', label: 'Merge conflict', danger: true },
  { id: 'deploy', label: 'Deploy fails', danger: true },
  { id: 'bad', label: 'Bad change goes live', danger: true },
]

interface Panel {
  tone: 'good' | 'bad' | 'warn' | 'info'
  title: string
  text: string
  action?: 'fix-tests' | 'resolve' | 'fix-deploy' | 'rollback'
}

/** The full trip from laptop to live, with each classic failure — and its fix. */
export function GitPipeline({ onDone }: { onDone?: () => void }) {
  const [st, setSt] = useState<Partial<Record<StageId, St>>>({})
  const [busy, setBusy] = useState(false)
  const [panel, setPanel] = useState<Panel | null>(null)
  const [now, setNow] = useState<string>('')
  const [version, setVersion] = useState(41)
  const [liveOk, setLiveOk] = useState(true)
  const [solved, setSolved] = useState<Set<ScenarioId>>(new Set())
  const [conflictPick, setConflictPick] = useState<string | null>(null)
  const runId = useRef(0)
  const fired = useRef(false)

  useEffect(() => () => void runId.current++, [])

  function markSolved(id: ScenarioId) {
    const next = new Set(solved).add(id)
    setSolved(next)
    const need: ScenarioId[] = ['tests', 'conflict', 'deploy', 'bad']
    if (!fired.current && need.every((n) => next.has(n))) {
      fired.current = true
      onDone?.()
    }
  }

  /** Walk stages from `from` to `to` (inclusive). Returns false if interrupted. */
  async function walk(from: StageId, to: StageId, my: number) {
    const a = STAGES.findIndex((s) => s.id === from)
    const b = STAGES.findIndex((s) => s.id === to)
    for (let i = a; i <= b; i++) {
      if (runId.current !== my) return false
      const s = STAGES[i].id
      setSt((x) => ({ ...x, [s]: 'active' }))
      setNow(SAY[s])
      await wait(s === 'ci' || s === 'deploy' ? 900 : 550)
      if (runId.current !== my) return false
      setSt((x) => ({ ...x, [s]: 'ok' }))
    }
    return true
  }

  async function fail(at: StageId, my: number) {
    if (runId.current !== my) return
    setSt((x) => ({ ...x, [at]: 'active' }))
    setNow(SAY[at])
    await wait(900)
    if (runId.current !== my) return
    setSt((x) => ({ ...x, [at]: 'fail' }))
  }

  async function run(id: ScenarioId) {
    const my = ++runId.current
    setBusy(true)
    setSt({})
    setPanel(null)
    setConflictPick(null)
    setLiveOk(true)
    if (id === 'happy' || id === 'bad') {
      if (!(await walk('code', 'live', my))) return
      setVersion((v) => v + 1)
      if (id === 'happy') {
        setPanel({ tone: 'good', title: 'Shipped ✓', text: 'Every gate passed. Customers got the change minutes after it was written — and it was checked on the way.' })
      } else {
        setNow('Customers start using the new version…')
        await wait(900)
        if (runId.current !== my) return
        setLiveOk(false)
        setSt((x) => ({ ...x, live: 'fail' }))
        setNow('')
        setPanel({
          tone: 'bad',
          title: '💥 Checkout is broken in production',
          text: 'Tests passed, review passed — but tax is now added twice for customers outside the US. Orders are failing right now. Fixing the code could take an hour.',
          action: 'rollback',
        })
      }
    } else if (id === 'tests') {
      if (!(await walk('code', 'pr', my))) return
      await fail('ci', my)
      setPanel({
        tone: 'bad',
        title: '❌ 1 of 214 tests failed',
        text: '“Order total includes tax” expected $108 but got $100. The pull request is blocked from merging — nothing reached customers.',
        action: 'fix-tests',
      })
    } else if (id === 'conflict') {
      if (!(await walk('code', 'ci', my))) return
      await fail('merge', my)
      setSt((x) => ({ ...x, merge: 'warn' }))
      setPanel({
        tone: 'warn',
        title: '🧩 Merge conflict',
        text: 'While you worked, a teammate changed the SAME line on main. Git can’t guess which version is right — a human has to choose.',
        action: 'resolve',
      })
    } else if (id === 'deploy') {
      if (!(await walk('code', 'merge', my))) return
      await fail('deploy', my)
      setPanel({
        tone: 'bad',
        title: '🚀 Deploy failed',
        text: 'The new version wouldn’t start: “missing setting TAX_API_KEY”. The hosting platform kept the OLD version running, so customers noticed nothing.',
        action: 'fix-deploy',
      })
    }
    if (runId.current === my) setBusy(false)
  }

  async function continueFrom(from: StageId, solvedId: ScenarioId, msg: string) {
    const my = ++runId.current
    setBusy(true)
    setPanel(null)
    if (!(await walk(from, 'live', my))) return
    setVersion((v) => v + 1)
    setBusy(false)
    setPanel({ tone: 'good', title: 'Back on track ✓', text: msg })
    markSolved(solvedId)
  }

  async function rollback() {
    const my = ++runId.current
    setBusy(true)
    setPanel(null)
    setNow('Switching the servers back to the previous version…')
    setSt((x) => ({ ...x, deploy: 'active', live: 'warn' }))
    await wait(1000)
    if (runId.current !== my) return
    setVersion((v) => v - 1)
    setLiveOk(true)
    setSt((x) => ({ ...x, deploy: 'ok', live: 'ok' }))
    setNow('')
    setBusy(false)
    setPanel({
      tone: 'good',
      title: '⏪ Rolled back in 40 seconds',
      text: 'Customers are on the last good version again. Now the team can fix the bug calmly, add a test for it, and ship again.',
    })
    markSolved('bad')
  }

  const CONFLICT = [
    { id: 'yours', label: 'Keep yours: Pro plan $29/mo', ok: false, why: 'That would quietly undo your teammate’s change. Last week the team agreed the new price is $39.' },
    { id: 'theirs', label: 'Keep theirs: Pro plan $39/mo', ok: true, why: 'Right — the agreed new price. You checked what the other change was for before choosing.' },
  ]

  return (
    <div className="stack">
      <div className="row" role="group" aria-label="Scenarios">
        {SCENARIOS.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`btn small ${s.danger ? 'danger' : 'primary'}`}
            disabled={busy}
            onClick={() => run(s.id)}
          >
            {s.danger ? '⚠️ ' : '▶ '}
            {s.label}
            {solved.has(s.id) ? ' ✓' : ''}
          </button>
        ))}
      </div>

      <div className="grid2" aria-hidden="true" style={{ gap: 6 }}>
        {STAGES.map((s, i) => {
          const x = st[s.id] ?? 'idle'
          return (
            <div
              key={s.id}
              className={`node ${x === 'idle' ? (busy ? 'dim' : '') : x}`}
              style={{ minHeight: 44, padding: '6px 10px', fontSize: 13, gap: 6 }}
            >
              <span className="tiny muted" style={{ width: 12 }}>
                {i + 1}
              </span>
              <span className="emoji" style={{ fontSize: 18 }}>
                {s.emoji}
              </span>
              <span className="grow">{s.label}</span>
            </div>
          )
        })}
      </div>

      <div aria-live="polite" className="stack sm">
        {now && <div className="bubble req">{now}</div>}
        {panel && (
          <div className={`callout ${panel.tone} stack sm pop`} key={panel.title}>
            <b>{panel.title}</b>
            <span className="small">{panel.text}</span>
            {panel.action === 'fix-tests' && (
              <button
                type="button"
                className="btn small primary"
                onClick={() =>
                  continueFrom('commit', 'tests', 'The developer fixed the tax calculation and pushed a new commit. CI re-ran, everything passed, and it merged. The test did its job: the bug never reached a customer.')
                }
              >
                🔧 Fix the bug & push again
              </button>
            )}
            {panel.action === 'resolve' && (
              <div className="stack sm">
                <div className="code" style={{ fontSize: 12 }}>
                  {'<<<<<<< your branch\n'}
                  {'  Pro plan: $29/mo\n'}
                  {'=======\n'}
                  {'  Pro plan: $39/mo\n'}
                  {'>>>>>>> main (teammate)'}
                </div>
                {CONFLICT.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`chip ${conflictPick === c.id ? (c.ok ? 'good' : 'bad') : ''}`}
                    onClick={() => setConflictPick(c.id)}
                  >
                    {c.label}
                  </button>
                ))}
                {conflictPick && (
                  <div className="small">{CONFLICT.find((c) => c.id === conflictPick)?.why}</div>
                )}
                {conflictPick === 'theirs' && (
                  <button
                    type="button"
                    className="btn small primary"
                    onClick={() =>
                      continueFrom('merge', 'conflict', 'Conflict resolved by a human who understood both changes, then merged and shipped. Small, frequent pull requests make conflicts rarer and easier.')
                    }
                  >
                    ✅ Save resolution & merge
                  </button>
                )}
              </div>
            )}
            {panel.action === 'fix-deploy' && (
              <button
                type="button"
                className="btn small primary"
                onClick={() =>
                  continueFrom('deploy', 'deploy', 'Someone added TAX_API_KEY to the hosting settings and redeployed. It started, passed its health check, and only then took over from the old version.')
                }
              >
                🔧 Add the missing setting & redeploy
              </button>
            )}
            {panel.action === 'rollback' && (
              <button type="button" className="btn small danger" onClick={rollback}>
                ⏪ Roll back to v{version - 1}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="phone">
        <div className="screen" style={{ minHeight: 0 }}>
          <div className="row between">
            <span className="tiny muted">🌍 Live app</span>
            <span className="pill">v{version}</span>
          </div>
          <div style={{ fontWeight: 600 }} className={liveOk ? '' : 'bad-text'}>
            {liveOk ? '🛒 Checkout working' : '💥 Checkout failing — orders: 0/min'}
          </div>
        </div>
      </div>

      <p className="tiny muted">
        Resolve all four problems:{' '}
        {(['tests', 'conflict', 'deploy', 'bad'] as ScenarioId[]).map((s) => (solved.has(s) ? '✓' : '○')).join(' ')}
      </p>
    </div>
  )
}
