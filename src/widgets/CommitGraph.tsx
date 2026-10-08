import { useRef, useState } from 'react'

type Branch = 'main' | 'new-pricing'

interface Commit {
  id: string
  msg: string
  branch: Branch
  merge?: boolean
  /** What the app contains at this commit. */
  snap: string[]
}

const HASHES = ['a1f3e9c', '7b20d4e', 'c94e1a2', 'e03b7f5', '5d8c2b1', '9f61ae0', '2ac7d38', 'b48e916', '61d0f2a', 'd7c3b05']

const CHANGES: Record<Branch, { msg: string; add: string }[]> = {
  main: [
    { msg: 'Fix typo on login page', add: '✏️ Login typo fixed' },
    { msg: 'Make contacts page faster', add: '⚡ Faster contacts' },
    { msg: 'Add CSV export', add: '📤 CSV export' },
  ],
  'new-pricing': [
    { msg: 'Add pricing page', add: '💳 Pricing page' },
    { msg: 'Add annual plan', add: '📅 Annual plan' },
    { msg: 'Add coupon codes', add: '🎟️ Coupon codes' },
  ],
}

const START: Commit = { id: HASHES[0], msg: 'First version of the app', branch: 'main', snap: ['🔑 Login', '📇 Contacts'] }

/**
 * A tiny Git you can drive: commit, branch, switch, merge, and tap any commit to time-travel.
 */
export function CommitGraph({ onDone }: { onDone?: () => void }) {
  const [commits, setCommits] = useState<Commit[]>([START])
  const [current, setCurrent] = useState<Branch>('main')
  const [branchState, setBranchState] = useState<'none' | 'open' | 'merged'>('none')
  const [forkIdx, setForkIdx] = useState(-1)
  const [used, setUsed] = useState<Record<Branch, number>>({ main: 0, 'new-pricing': 0 })
  const [viewing, setViewing] = useState<string | null>(null)
  const [msg, setMsg] = useState('You’re on main — the official version of your app. Make a change and commit it.')
  const fired = useRef(false)

  const head = (b: Branch) => {
    for (let i = commits.length - 1; i >= 0; i--) {
      const c = commits[i]
      if (b === 'main' ? c.branch === 'main' : c.branch === 'new-pricing') return c
      if (b === 'new-pricing' && i === forkIdx) return c
    }
    return commits[0]
  }
  const branchCommitsUnmerged = commits.filter((c, i) => c.branch === 'new-pricing' && i > forkIdx).length > 0
  const queue = CHANGES[current]
  const nextChange = queue[used[current]]

  function commit() {
    if (!nextChange) return
    const parent = head(current)
    const c: Commit = {
      id: HASHES[commits.length % HASHES.length],
      msg: nextChange.msg,
      branch: current,
      snap: [...parent.snap, nextChange.add],
    }
    setCommits([...commits, c])
    setUsed({ ...used, [current]: used[current] + 1 })
    setViewing(null)
    setMsg(
      current === 'main'
        ? `Committed “${c.msg}” to main. A commit is a save point with a label — you can always come back to it.`
        : `Committed “${c.msg}” on new-pricing. Look at main: it doesn’t have this. Branches keep experiments out of the live app.`,
    )
  }

  function branch() {
    setForkIdx(commits.length - 1)
    setBranchState('open')
    setCurrent('new-pricing')
    setViewing(null)
    setMsg('Created branch “new-pricing” — a parallel copy to experiment on. Now commit something here.')
  }

  function merge() {
    const m = head('main')
    const b = head('new-pricing')
    const snap = [...m.snap, ...b.snap.filter((s) => !m.snap.includes(s))]
    const c: Commit = { id: HASHES[commits.length % HASHES.length], msg: 'Merge new-pricing into main', branch: 'main', merge: true, snap }
    setCommits([...commits, c])
    setBranchState('merged')
    setCurrent('main')
    setViewing(null)
    setMsg('Merged! main now has the pricing work AND everything that happened on main meanwhile. The branch did its job.')
    if (!fired.current) {
      fired.current = true
      onDone?.()
    }
  }

  function reset() {
    setCommits([START])
    setCurrent('main')
    setBranchState('none')
    setForkIdx(-1)
    setUsed({ main: 0, 'new-pricing': 0 })
    setViewing(null)
    setMsg('Fresh start. You’re on main.')
  }

  // which rows the branch lane passes through
  const mergeIdx = commits.findIndex((c) => c.merge)
  const laneEnd = mergeIdx >= 0 ? mergeIdx : commits.length - 1
  const inLane = (i: number) => branchState !== 'none' && i > forkIdx && i <= laneEnd
  const viewed = commits.find((c) => c.id === viewing)
  const rows = commits.map((c, i) => ({ c, i })).reverse()

  return (
    <div className="stack">
      <div className="row" role="group" aria-label="Current branch">
        <span className="tiny muted">On branch:</span>
        <button type="button" className="chip" aria-pressed={current === 'main'} onClick={() => setCurrent('main')}>
          🌳 main
        </button>
        {branchState === 'open' && (
          <button
            type="button"
            className="chip"
            aria-pressed={current === 'new-pricing'}
            onClick={() => setCurrent('new-pricing')}
          >
            🌿 new-pricing
          </button>
        )}
      </div>

      <div className="grid2">
        <button type="button" className="btn small primary" onClick={commit} disabled={!nextChange}>
          ✏️ Change & commit
        </button>
        {branchState === 'open' ? (
          <button type="button" className="btn small ink" onClick={merge} disabled={!branchCommitsUnmerged}>
            🔀 Merge into main
          </button>
        ) : (
          <button type="button" className="btn small" onClick={branch} disabled={branchState === 'merged'}>
            🌿 New branch
          </button>
        )}
      </div>
      {nextChange && <p className="tiny muted">Next change on {current}: “{nextChange.msg}”</p>}

      <div className="callout info small pop" key={msg} aria-live="polite">
        {msg}
      </div>

      <div className="stack sm">
        <div className="row between">
          <span className="kicker">History (newest on top)</span>
          <span className="tiny muted">tap a commit to time-travel</span>
        </div>
        <div className="card tight flat" style={{ padding: '6px 8px' }}>
          {rows.map(({ c, i }) => {
            const lane = c.branch === 'main' ? 0 : 1
            return (
              <button
                key={c.id + i}
                type="button"
                onClick={() => setViewing(viewing === c.id ? null : c.id)}
                aria-pressed={viewing === c.id}
                className="row nowrap"
                style={{
                  width: '100%',
                  gap: 8,
                  minHeight: 44,
                  padding: '0 4px',
                  border: 0,
                  borderRadius: 10,
                  background: viewing === c.id ? 'var(--accent-soft)' : 'transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span aria-hidden="true" style={{ display: 'flex', flex: 'none', alignSelf: 'stretch' }}>
                  {[0, 1].map((l) => {
                    const line = l === 0 ? true : inLane(i)
                    const dot = l === lane
                    return (
                      <span key={l} style={{ width: 20, position: 'relative', display: 'flex', justifyContent: 'center' }}>
                        {line && (
                          <span
                            style={{
                              position: 'absolute',
                              top: (l === 0 && i === commits.length - 1) || (l === 1 && i === laneEnd) ? '50%' : 0,
                              bottom: i === 0 ? '50%' : 0,
                              width: 2,
                              background: l === 0 ? 'var(--accent)' : 'var(--good)',
                            }}
                          />
                        )}
                        {dot && (
                          <span
                            style={{
                              position: 'relative',
                              alignSelf: 'center',
                              width: c.merge ? 14 : 12,
                              height: c.merge ? 14 : 12,
                              borderRadius: '50%',
                              background: l === 0 ? 'var(--accent)' : 'var(--good)',
                              border: c.merge ? '3px solid var(--surface)' : undefined,
                              boxShadow: c.merge ? '0 0 0 2px var(--good)' : undefined,
                            }}
                          />
                        )}
                      </span>
                    )
                  })}
                </span>
                <span className="grow" style={{ minWidth: 0 }}>
                  <span className="small" style={{ display: 'block', fontWeight: 600 }}>
                    {c.merge ? '🔀 ' : ''}
                    {c.msg}
                  </span>
                  <span className="tiny muted mono">
                    {c.id} · {c.branch}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {viewed ? (
        <div className="card tight flat stack sm pop" style={{ borderColor: 'var(--warn)' }}>
          <div className="row between">
            <span className="kicker">⏪ The app at {viewed.id}</span>
            <button type="button" className="btn small ghost" onClick={() => setViewing(null)}>
              Back to now
            </button>
          </div>
          <div className="row">
            {viewed.snap.map((s) => (
              <span key={s} className="pill">
                {s}
              </span>
            ))}
          </div>
          <p className="tiny muted">Every commit is a full snapshot. This is how teams find “when did this break?” and undo it.</p>
        </div>
      ) : (
        <div className={branchState === 'open' ? 'grid2' : 'stack'}>
          {(['main', ...(branchState === 'open' ? ['new-pricing'] : [])] as Branch[]).map((b) => (
            <div key={b} className="card tight flat stack sm" style={b === current ? { borderColor: 'var(--accent)' } : undefined}>
              <span className="kicker">{b === 'main' ? '🌳 main = live app' : '🌿 new-pricing'}</span>
              <div className="row" style={{ gap: 4 }}>
                {head(b).snap.map((s) => (
                  <span key={s} className="pill">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="row between">
        <span className="tiny muted">Goal: commit, branch, commit on the branch, merge.</span>
        <button type="button" className="btn small ghost" onClick={reset}>
          ↺ Reset
        </button>
      </div>
    </div>
  )
}
