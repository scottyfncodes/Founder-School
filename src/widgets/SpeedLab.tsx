import { useEffect, useRef, useState } from 'react'
import { wait } from '../lib/motion'

interface Settings {
  far: boolean
  compress: boolean
  combine: boolean
  cdn: boolean
  cached: boolean
}

interface Bar {
  id: string
  label: string
  start: number
  wait: number // time spent on distance / round trips
  dl: number // time spent downloading bytes / server thinking
  kind: 'static' | 'api'
}

const BW = 1.25 // MB per second (≈10 Mbps mobile)
const GOAL = 1.5

function model(s: Settings) {
  const rttO = s.far ? 0.3 : 0.02 // round trip to your server
  const rttS = s.cdn ? 0.02 : rttO // round trip for files (CDN edge is nearby)
  const bars: Bar[] = []
  let t = 0
  // 1. connect (TLS handshake ≈ 2 round trips)
  bars.push({ id: 'conn', label: s.cdn ? 'Connect (to CDN nearby)' : 'Connect (handshake)', start: 0, wait: 2 * rttS, dl: 0, kind: 'static' })
  t += 2 * rttS
  // 2. HTML
  const html = s.cached ? 0 : rttS + 0.03 / BW
  bars.push({ id: 'html', label: s.cached ? 'Page (from cache)' : 'Page HTML (30 KB)', start: t, wait: s.cached ? 0 : rttS, dl: s.cached ? 0.005 : 0.03 / BW, kind: 'static' })
  t += Math.max(html, 0.005)
  // 3. JS + image in parallel
  const jsT = s.cached ? 0.005 : rttS + 0.4 / BW
  bars.push({ id: 'js', label: s.cached ? 'App code (from cache)' : 'App code (400 KB)', start: t, wait: s.cached ? 0 : rttS, dl: s.cached ? 0.005 : 0.4 / BW, kind: 'static' })
  const imgMB = s.compress ? 0.25 : 6
  bars.push({
    id: 'img',
    label: s.cached ? 'Hero image (from cache)' : `Hero image (${s.compress ? '250 KB' : '6 MB'})`,
    start: t,
    wait: s.cached ? 0 : rttS,
    dl: s.cached ? 0.005 : imgMB / BW,
    kind: 'static',
  })
  const imgEnd = t + (s.cached ? 0.005 : rttS + imgMB / BW)
  t += jsT
  // 4. API: needs a connection to your real server if files came from the CDN
  if (s.cdn) {
    bars.push({ id: 'apiconn', label: 'Connect to your server', start: t, wait: 2 * rttO, dl: 0, kind: 'api' })
    t += 2 * rttO
  }
  const calls = s.combine ? 1 : 6
  for (let i = 0; i < calls; i++) {
    const think = s.combine ? 0.1 : 0.04
    bars.push({
      id: `api${i}`,
      label: s.combine ? 'Data request (all at once)' : `Data request ${i + 1} of 6`,
      start: t,
      wait: rttO,
      dl: think,
      kind: 'api',
    })
    t += rttO + think
  }
  const usable = t
  const total = Math.max(usable, imgEnd)
  const waiting = bars.reduce((x, b) => x + b.wait, 0)
  return { bars, usable, total, waiting }
}

const fmt = (s: number) => (s < 0.1 ? `${Math.round(s * 1000)} ms` : `${s.toFixed(2)} s`)

export function SpeedLab({ onDone }: { onDone?: () => void }) {
  const [s, setS] = useState<Settings>({ far: true, compress: false, combine: false, cdn: false, cached: false })
  const [run, setRun] = useState<ReturnType<typeof model> | null>(null)
  const [clock, setClock] = useState(0)
  const [busy, setBusy] = useState(false)
  const [best, setBest] = useState<number | null>(null)
  const [runs, setRuns] = useState(0)
  const [fired, setFired] = useState(false)
  const runId = useRef(0)
  useEffect(() => () => void runId.current++, [])

  async function load() {
    const my = ++runId.current
    const m = model(s)
    setRun(m)
    setBusy(true)
    setClock(0)
    const frames = 14
    for (let i = 1; i <= frames; i++) {
      await wait(1600 / frames)
      if (runId.current !== my) return
      setClock((m.total * i) / frames)
    }
    setBusy(false)
    setRuns((r) => r + 1)
    if (s.far && !s.cached && (best === null || m.total < best)) setBest(m.total)
    if (!fired && s.far && !s.cached && m.total <= GOAL) {
      setFired(true)
      onDone?.()
    }
  }

  const set = (k: keyof Settings, v: boolean) => {
    setS({ ...s, [k]: v })
  }

  const toggles: { k: keyof Settings; label: string; on: string; off: string }[] = [
    { k: 'compress', label: '🖼️ Compress the hero image', on: '250 KB', off: 'Huge original (6 MB)' },
    { k: 'combine', label: '🔁 Combine data requests', on: '1 request with everything', off: '6 requests, one after another' },
    { k: 'cdn', label: '🛰️ CDN for files', on: 'On — copies near the visitor', off: 'Off — all from your server' },
    { k: 'cached', label: '⚡ Repeat visit (cache)', on: 'Files already on the device', off: 'First visit' },
  ]

  const scale = run ? Math.max(run.total, 0.5) : 1

  return (
    <div className="stack">
      <div className="callout info small">
        🎯 <b>Goal:</b> a first-time visitor in Sydney (your server is in Virginia) should see the full page in under {GOAL} s.
      </div>

      <div className="stack sm">
        <div className="kicker">Visitor location</div>
        <div className="grid2">
          <button type="button" className="chip small" aria-pressed={!s.far} disabled={busy} onClick={() => set('far', false)}>
            🏙️ Next door to the server
          </button>
          <button type="button" className="chip small" aria-pressed={s.far} disabled={busy} onClick={() => set('far', true)}>
            🦘 Sydney (far away)
          </button>
        </div>
      </div>

      <div className="stack sm">
        {toggles.map((t) => {
          const v = s[t.k]
          return (
            <div key={t.k} className="row nowrap between" style={{ gap: 10 }}>
              <div className="grow">
                <div className="small" style={{ fontWeight: 600 }}>
                  {t.label}
                </div>
                <div className={`tiny ${v && t.k !== 'cached' ? 'good-text' : 'muted'}`}>{v ? t.on : t.off}</div>
              </div>
              <button type="button" role="switch" aria-checked={v} aria-label={t.label} className="switch" disabled={busy} onClick={() => set(t.k, !v)} />
            </div>
          )
        })}
      </div>

      <button type="button" className="btn primary" onClick={load} disabled={busy}>
        {busy ? 'Loading…' : '▶ Load the page'}
      </button>

      {run && (
        <div className="stack sm">
          <div className="grid2">
            <div className="stat">
              <span className={`v ${!busy ? (run.total <= GOAL ? 'good-text' : run.total > 3 ? 'bad-text' : 'warn-text') : ''}`}>{fmt(Math.min(clock, run.total))}</span>
              <span className="l">Full page loaded</span>
            </div>
            <div className="stat">
              <span className="v">{busy ? '…' : fmt(run.waiting)}</span>
              <span className="l">Spent just waiting on distance</span>
            </div>
          </div>
          <div className="stack" style={{ gap: 6 }} aria-label="Loading timeline">
            {run.bars.map((b) => {
              const startPct = (b.start / scale) * 100
              const visible = Math.max(0, Math.min(clock - b.start, b.wait + b.dl))
              const waitPart = Math.min(visible, b.wait)
              const dlPart = Math.max(0, visible - b.wait)
              return (
                <div key={b.id} className="stack" style={{ gap: 2 }}>
                  <div className="tiny row nowrap between">
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.label}</span>
                    <span className="muted mono">{clock >= b.start + b.wait + b.dl ? fmt(b.wait + b.dl) : ''}</span>
                  </div>
                  <div style={{ position: 'relative', height: 8, borderRadius: 4, background: 'var(--surface-2)' }}>
                    <span
                      style={{
                        position: 'absolute',
                        left: `${startPct}%`,
                        width: `${(waitPart / scale) * 100}%`,
                        top: 0,
                        bottom: 0,
                        background: 'var(--warn)',
                        borderRadius: 4,
                      }}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        left: `${((b.start + waitPart) / scale) * 100}%`,
                        width: `${(dlPart / scale) * 100}%`,
                        top: 0,
                        bottom: 0,
                        background: b.kind === 'api' ? 'var(--good)' : 'var(--accent)',
                        borderRadius: 4,
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
          <div className="row tiny muted" style={{ gap: 12 }}>
            <span>
              <span style={{ color: 'var(--warn)' }}>■</span> waiting on distance
            </span>
            <span>
              <span style={{ color: 'var(--accent)' }}>■</span> downloading
            </span>
            <span>
              <span style={{ color: 'var(--good)' }}>■</span> server working
            </span>
          </div>
        </div>
      )}

      <div aria-live="polite">
        {run && !busy && <Verdict s={s} total={run.total} done={fired} runs={runs} best={best} />}
      </div>
    </div>
  )
}

function Verdict({ s, total, done, runs, best }: { s: Settings; total: number; done: boolean; runs: number; best: number | null }) {
  if (done && s.far && !s.cached && total <= GOAL)
    return (
      <div className="callout good pop">
        🎉 {fmt(total)} from Sydney. You didn’t buy a faster server — you sent less, asked fewer times, and moved files closer.
        Those are the real speed levers.
      </div>
    )
  if (s.cached)
    return (
      <div className="callout info pop">
        Repeat visits are fast because files come from the device’s cache. Nice — but the goal is a <b>first</b> visit. Turn the cache
        off.
      </div>
    )
  if (!s.far)
    return (
      <div className="callout info pop">
        Next door, everything feels fast — which is why apps feel fine to the founder and slow to faraway customers. Switch to Sydney.
      </div>
    )
  const hints: string[] = []
  if (!s.compress) hints.push('that 6 MB image takes ~5 s to download on mobile')
  if (!s.combine) hints.push('6 requests in a row means paying the Sydney round trip 6 times')
  if (!s.cdn) hints.push('every file crosses the ocean')
  return (
    <div className="callout warn pop">
      {fmt(total)}. {hints.length ? `Biggest culprits: ${hints.join('; ')}.` : ''}
      {runs > 2 && best !== null ? ` Best so far: ${fmt(best)}.` : ''}
    </div>
  )
}
