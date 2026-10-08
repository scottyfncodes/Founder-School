import { useEffect, useRef, useState } from 'react'
import { wait } from '../lib/motion'

const FILES = [
  { id: 'reg', emoji: '📄', name: 'registration_N123AB.pdf', mb: 2.1, key: 'docs/3c9e1a.pdf', sensitive: false },
  { id: 'passport', emoji: '🪪', name: 'maria_passport.jpg', mb: 3.4, key: 'docs/7f3a9c.jpg', sensitive: true },
]

type Who = 'stranger' | 'maria'

export function FileLab({ onDone }: { onDone?: () => void }) {
  const [pick, setPick] = useState('passport')
  const [uploaded, setUploaded] = useState<string[]>([])
  const [rows, setRows] = useState<string[]>([])
  const [publicBucket, setPublicBucket] = useState(true)
  const [stage, setStage] = useState<'idle' | 'api' | 'split' | 'done'>('idle')
  const [view, setView] = useState<{ who: Who; pub: boolean; file: string; orphan?: boolean } | null>(null)
  const [tried, setTried] = useState<Set<string>>(new Set())
  const [fired, setFired] = useState(false)
  const alive = useRef(true)
  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])

  const f = FILES.find((x) => x.id === pick)!
  const latest = FILES.find((x) => x.id === uploaded[uploaded.length - 1])

  async function upload() {
    setView(null)
    setStage('api')
    await wait(700)
    if (!alive.current) return
    setStage('split')
    await wait(900)
    if (!alive.current) return
    setUploaded((u) => (u.includes(f.id) ? u : [...u, f.id]))
    setRows((r) => (r.includes(f.id) ? r : [...r, f.id]))
    setStage('done')
  }

  function open(who: Who) {
    if (!latest) return
    setView({ who, pub: publicBucket, file: latest.id, orphan: !rows.includes(latest.id) })
    if (who === 'stranger') {
      const next = new Set(tried).add(publicBucket ? 'pub' : 'priv')
      setTried(next)
      if (!fired && next.size === 2) {
        setFired(true)
        onDone?.()
      }
    }
  }

  const vf = FILES.find((x) => x.id === view?.file)

  return (
    <div className="stack">
      <div className="stack sm">
        <div className="kicker">1 · Pick a file to attach to Maria Lopez</div>
        <div className="stack" style={{ gap: 6 }}>
          {FILES.map((x) => (
            <button key={x.id} type="button" className="chip" aria-pressed={pick === x.id} disabled={stage === 'api' || stage === 'split'} onClick={() => setPick(x.id)}>
              {x.emoji} <span className="mono small">{x.name}</span> <span className="tiny muted">· {x.mb} MB</span>
            </button>
          ))}
        </div>
        <button type="button" className="btn primary" onClick={upload} disabled={stage === 'api' || stage === 'split'}>
          ⬆️ Upload
        </button>
      </div>

      <div className="stack sm" style={{ gap: 0 }} aria-hidden="true">
        <div className={`node ${stage === 'api' ? 'active' : stage !== 'idle' ? 'ok' : ''}`}>
          <span className="emoji">🚪</span>
          <div className="grow small">
            API
            {stage === 'api' && <div className="tiny" style={{ fontWeight: 500 }}>Checks: logged in? allowed? under 10 MB?</div>}
          </div>
        </div>
        <div className={`link ${stage === 'split' ? 'active' : ''}`} />
        <div className="grid2">
          <div className={`node ${stage === 'split' ? 'active' : ''}`} style={{ alignItems: 'flex-start', flexDirection: 'column', gap: 4 }}>
            <span>
              <span className="emoji">🗂️</span> File storage
            </span>
            <span className="tiny" style={{ fontWeight: 500 }}>
              stores the <b>bytes</b>
            </span>
          </div>
          <div className={`node ${stage === 'split' ? 'active' : ''}`} style={{ alignItems: 'flex-start', flexDirection: 'column', gap: 4 }}>
            <span>
              <span className="emoji">🗄️</span> Database
            </span>
            <span className="tiny" style={{ fontWeight: 500 }}>
              stores the <b>pointer</b>
            </span>
          </div>
        </div>
      </div>

      {uploaded.length > 0 && (
        <div className="stack sm pop">
          <div className="kicker">🗂️ Bucket “acme-docs” ({publicBucket ? 'public' : 'private'})</div>
          <div className="well stack sm">
            {uploaded.map((id) => {
              const x = FILES.find((y) => y.id === id)!
              return (
                <div key={id} className="row nowrap small" style={{ gap: 8 }}>
                  <span aria-hidden="true">{x.emoji}</span>
                  <span className="mono grow" style={{ overflowWrap: 'anywhere' }}>
                    {x.key}
                  </span>
                  <span className="tiny muted">{x.mb} MB</span>
                </div>
              )
            })}
          </div>
          <div className="kicker">🗄️ DOCUMENTS table</div>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>id</th>
                  <th>contact_id</th>
                  <th>filename</th>
                  <th>file_key</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={4} className="muted">
                      (no rows)
                    </td>
                  </tr>
                )}
                {rows.map((id, i) => {
                  const x = FILES.find((y) => y.id === id)!
                  return (
                    <tr key={id} className="hl">
                      <td className="mono">{405 + i}</td>
                      <td className="mono">101</td>
                      <td>{x.name}</td>
                      <td className="mono">{x.key}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className="tiny muted">The row is a few bytes: who it belongs to, and where the file lives. The file itself is in the bucket.</p>
        </div>
      )}

      {latest && (
        <div className="card tight flat stack sm">
          <div className="kicker">2 · Who can open it?</div>
          <div className="row nowrap between">
            <span className="small" style={{ fontWeight: 600 }}>
              Bucket is public
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={publicBucket}
              aria-label="Bucket is public"
              className="switch"
              onClick={() => {
                setPublicBucket(!publicBucket)
                setView(null)
              }}
              style={publicBucket ? { background: 'var(--bad)' } : undefined}
            />
          </div>
          <div className="grid2">
            <button type="button" className="btn small" onClick={() => open('stranger')}>
              🕵️ A stranger opens the link
            </button>
            <button type="button" className="btn small" onClick={() => open('maria')}>
              👩 Maria opens it in the app
            </button>
          </div>
          <p className="tiny muted">
            Try the stranger both ways: public {tried.has('pub') ? '✅' : '⬜'} · private {tried.has('priv') ? '✅' : '⬜'}
          </p>
          {rows.includes(latest.id) && (
            <button
              type="button"
              className="btn ghost small"
              onClick={() => {
                setRows(rows.filter((r) => r !== latest.id))
                setView(null)
              }}
            >
              🗑 Delete the DB row (but forget the file)
            </button>
          )}
        </div>
      )}

      <div aria-live="polite">
        {view && vf && (
          <div className="stack sm pop" key={`${view.who}-${view.pub}-${view.orphan}`}>
            <div className="phone">
              <div className="screen" style={{ minHeight: 0 }}>
                <div className="tiny muted mono" style={{ overflowWrap: 'anywhere' }}>
                  {view.who === 'maria' && !view.pub ? `${vf.key}?signature=…&expires=10min` : `acme-docs.storage.example/${vf.key}`}
                </div>
                {view.who === 'stranger' && !view.pub ? (
                  <div style={{ fontWeight: 700 }}>⛔ 403 — Access denied</div>
                ) : view.who === 'maria' && view.orphan ? (
                  <div style={{ fontWeight: 700 }}>🤷 Document not found</div>
                ) : (
                  <div style={{ fontWeight: 700 }}>
                    {vf.emoji} {vf.name} {vf.sensitive ? '— passport photo visible' : '— visible'}
                  </div>
                )}
              </div>
            </div>
            <div className={`callout ${calloutTone(view, vf.sensitive)}`}>{explain(view, vf.sensitive)}</div>
          </div>
        )}
      </div>
    </div>
  )
}

function calloutTone(v: { who: Who; pub: boolean; orphan?: boolean }, sensitive: boolean) {
  if (v.who === 'stranger') return v.pub ? (sensitive ? 'bad' : 'warn') : 'good'
  if (v.orphan) return 'warn'
  return v.pub ? 'warn' : 'good'
}

function explain(v: { who: Who; pub: boolean; orphan?: boolean }, sensitive: boolean) {
  if (v.who === 'stranger' && v.pub) {
    return v.orphan
      ? 'The database row is gone, but the file isn’t — it’s still sitting in a public bucket, still reachable, still on your storage bill. Delete files and rows together.'
      : `Public bucket: anyone with the link sees ${sensitive ? 'Maria’s passport' : 'the file'}. Links leak — forwarded emails, browser history, logs, search engines. This is one of the most common real-world data leaks.`
  }
  if (v.who === 'stranger') return 'Private bucket: the link alone isn’t enough. No permission, no file — even if the link leaks.'
  if (v.orphan) return 'The app can’t find it: the pointer row is gone, so as far as the app knows the document doesn’t exist. The file is still in the bucket, costing money — an “orphan”.'
  if (v.pub) return 'It works for Maria — but it would work exactly the same for anyone. A public bucket can’t tell the difference.'
  return 'The app checks Maria is logged in and allowed, then hands her a signed link that expires in 10 minutes. That’s the safe pattern.'
}
