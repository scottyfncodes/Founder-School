import { useEffect, useRef, useState } from 'react'
import { wait } from '../lib/motion'

interface Test {
  id: string
  name: string
  /** Does it pass with the buggy code? With the fixed code? */
  passBuggy: boolean
}

const BASE: Test[] = [
  { id: 't1', name: 'SAVE10 takes 10% off ($100 → $90)', passBuggy: true },
  { id: 't2', name: 'No code means full price', passBuggy: true },
  { id: 't3', name: 'Unknown code is ignored', passBuggy: true },
]

const CANDIDATES = [
  { id: 'c1', name: 'SAVE10 works on a $50 order too', right: false, why: 'Good to have — but it uses “SAVE10” in capitals again, so it passes and still misses Cleo’s bug.' },
  { id: 'c2', name: 'Lowercase “save10” also takes 10% off', right: true, why: 'Exactly what Cleo typed. This test fails against today’s code — which is the point: it proves the bug exists.' },
  { id: 'c3', name: 'The price is always a number', right: false, why: 'True and harmless, but it says nothing about discount codes. It would pass.' },
]

const ORDERS = [
  { who: 'Ana', code: 'SAVE10', charged: 90, expected: 90 },
  { who: 'Ben', code: '—', charged: 100, expected: 100 },
  { who: 'Cleo', code: 'save10', charged: 100, expected: 90 },
  { who: 'Dev', code: 'SAVE10', charged: 90, expected: 90 },
]

type Phase = 'start' | 'green' | 'prod' | 'pick' | 'red' | 'fixed' | 'done'
type Res = Record<string, 'run' | 'pass' | 'fail'>

/** All tests pass… and a real bug ships anyway. Then write the test that catches it. */
export function TestBench({ onDone }: { onDone?: () => void }) {
  const [phase, setPhase] = useState<Phase>('start')
  const [res, setRes] = useState<Res>({})
  const [busy, setBusy] = useState(false)
  const [pick, setPick] = useState<string | null>(null)
  const [shown, setShown] = useState(0)
  const alive = useRef(true)
  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])

  const fixed = phase === 'fixed' || phase === 'done'
  const tests: Test[] = phase === 'red' || fixed ? [...BASE, { id: 't4', name: CANDIDATES[1].name, passBuggy: false }] : BASE

  async function runTests(next: Phase) {
    setBusy(true)
    setRes({})
    const out: Res = {}
    for (const t of tests) {
      out[t.id] = 'run'
      setRes({ ...out })
      await wait(450)
      if (!alive.current) return
      out[t.id] = t.passBuggy || fixed ? 'pass' : 'fail'
      setRes({ ...out })
    }
    setBusy(false)
    setPhase(next)
    if (next === 'done') onDone?.()
  }

  async function ship() {
    setPhase('prod')
    setShown(0)
    for (let i = 1; i <= ORDERS.length; i++) {
      await wait(600)
      if (!alive.current) return
      setShown(i)
    }
    await wait(400)
    if (alive.current) setPhase('pick')
  }

  const passed = Object.values(res).filter((r) => r === 'pass').length
  const failed = Object.values(res).filter((r) => r === 'fail').length
  const finishedRun = !busy && passed + failed === tests.length && passed + failed > 0

  return (
    <div className="stack">
      <div className="code" style={{ fontSize: 12 }}>
        {'function applyDiscount(price, code) {\n'}
        {fixed ? (
          <span className="good-text">{"  if (code.toUpperCase() === 'SAVE10')\n"}</span>
        ) : (
          "  if (code === 'SAVE10')\n"
        )}
        {'    return price * 0.9\n'}
        {'  return price\n'}
        {'}'}
      </div>

      <div className="card tight flat stack sm">
        <div className="row between">
          <span className="kicker">🧪 Automated tests</span>
          {finishedRun && (
            <span className={`pill ${failed ? 'bad-text' : 'good-text'}`}>
              {failed ? `${failed} failed` : `${passed} passed`}
            </span>
          )}
        </div>
        {tests.map((t) => {
          const r = res[t.id]
          return (
            <div key={t.id} className={`row nowrap small ${r === 'fail' ? 'bad-text' : ''}`} style={{ alignItems: 'flex-start' }}>
              <span style={{ width: 20, flex: 'none' }} aria-hidden="true">
                {r === 'pass' ? '✅' : r === 'fail' ? '❌' : r === 'run' ? '⏳' : '◻️'}
              </span>
              <span className="grow">{t.name}</span>
            </div>
          )
        })}
      </div>

      {phase === 'start' && (
        <button type="button" className="btn primary" disabled={busy} onClick={() => runTests('green')}>
          ▶ Run tests
        </button>
      )}

      {phase === 'green' && (
        <div className="stack sm pop">
          <div className="callout good small">All 3 tests pass. The AI agent says: “Discount codes are done and fully tested.”</div>
          <button type="button" className="btn primary" onClick={ship}>
            🚀 Ship to customers
          </button>
        </div>
      )}

      {(phase === 'prod' || phase === 'pick' || phase === 'red') && (
        <div className="card tight flat stack sm">
          <span className="kicker">🌍 Real orders, first hour</span>
          {ORDERS.slice(0, phase === 'prod' ? shown : ORDERS.length).map((o) => {
            const bad = o.charged !== o.expected
            return (
              <div key={o.who} className={`row nowrap small pop ${bad ? 'bad-text' : ''}`}>
                <span className="grow">
                  {o.who} · code <span className="mono">{o.code}</span>
                </span>
                <b>${o.charged}</b>
                <span aria-hidden="true">{bad ? '❌' : '✓'}</span>
              </div>
            )
          })}
          {phase !== 'prod' && (
            <div className="callout bad small">
              📨 Cleo: “I typed your code save10 and got charged full price!” — every test was green.
            </div>
          )}
        </div>
      )}

      {phase === 'pick' && (
        <div className="stack sm pop">
          <div className="kicker">Which new test would have caught this?</div>
          {CANDIDATES.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`chip ${pick === c.id ? (c.right ? 'good' : 'bad') : ''}`}
              onClick={() => setPick(c.id)}
            >
              {c.name}
            </button>
          ))}
          {pick && <div className="small">{CANDIDATES.find((c) => c.id === pick)?.why}</div>}
          {pick === 'c2' && (
            <button type="button" className="btn primary" onClick={() => setPhase('red')}>
              ➕ Add this test
            </button>
          )}
        </div>
      )}

      {phase === 'red' && (
        <div className="stack sm pop">
          {!finishedRun && (
            <button type="button" className="btn primary" disabled={busy} onClick={() => runTests('red')}>
              ▶ Run tests again
            </button>
          )}
          {finishedRun && failed > 0 && (
            <>
              <div className="callout warn small">
                Red! A failing test is good news here: it reproduces the bug, so you’ll know for sure when it’s fixed — and
                it can never sneak back.
              </div>
              <button type="button" className="btn primary" onClick={() => setPhase('fixed')}>
                🔧 Fix: ignore upper/lower case
              </button>
            </>
          )}
        </div>
      )}

      {phase === 'fixed' && (
        <button type="button" className="btn primary" disabled={busy} onClick={() => runTests('done')}>
          ▶ Run tests with the fix
        </button>
      )}

      {phase === 'done' && (
        <div className="callout good small pop">
          4 of 4 pass — and this time “pass” means more, because a test now covers what real customers actually type. Tests
          only prove what someone thought to check.
        </div>
      )}
    </div>
  )
}
