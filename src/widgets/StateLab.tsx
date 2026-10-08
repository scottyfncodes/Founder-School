import { useEffect, useRef, useState } from 'react'
import { wait } from '../lib/motion'

/* ------------------------------------------------------------------ */
/* StateLab: where does a note live? memory vs device vs server        */
/* ------------------------------------------------------------------ */

type Action = 'save' | 'refresh' | 'laptop' | 'clear'

const START = 'Call Maria about the N123AB inspection'

export function StateLab({ onDone }: { onDone?: () => void }) {
  const [draft, setDraft] = useState(START)
  const [autosave, setAutosave] = useState(false)
  const [deviceDraft, setDeviceDraft] = useState<string | null>(null)
  const [server, setServer] = useState<string[]>(['Dev prefers texts'])
  const [device, setDevice] = useState<'phone' | 'laptop'>('phone')
  const [msg, setMsg] = useState<{ tone: 'good' | 'bad' | 'warn' | 'info'; text: string } | null>(null)
  const [did, setDid] = useState<Set<Action>>(new Set())
  const [flash, setFlash] = useState<string | null>(null)
  const fired = useRef(false)

  function mark(a: Action) {
    const next = new Set(did).add(a)
    setDid(next)
    if (!fired.current && next.has('refresh') && next.has('laptop') && next.has('save')) {
      fired.current = true
      onDone?.()
    }
  }

  function typing(v: string) {
    setDraft(v)
    if (autosave && device === 'phone') setDeviceDraft(v)
  }

  function save() {
    const t = draft.trim()
    if (!t) {
      setMsg({ tone: 'warn', text: 'Type something first, then save it.' })
      return
    }
    setServer([...server, t])
    setDraft('')
    if (device === 'phone') setDeviceDraft(null)
    setFlash('server')
    setMsg({ tone: 'good', text: 'Sent to the server and written to the database. Now it survives refreshes, lost phones and new devices.' })
    mark('save')
  }

  function refresh() {
    setFlash('memory')
    if (device === 'phone' && deviceDraft) {
      setDraft(deviceDraft)
      setMsg({ tone: 'good', text: 'Refresh wiped memory — but the app found your draft in this browser’s storage and put it back.' })
    } else {
      const lost = draft.trim()
      setDraft('')
      setMsg(
        lost
          ? { tone: 'bad', text: `Gone: “${lost.slice(0, 40)}${lost.length > 40 ? '…' : ''}”. It only lived in memory, and a refresh wipes memory. Saved notes came back from the server.` }
          : { tone: 'info', text: 'Memory wiped and rebuilt. Saved notes reloaded from the server — nothing lost because nothing was unsaved.' },
      )
    }
    mark('refresh')
  }

  function switchDevice() {
    const to = device === 'phone' ? 'laptop' : 'phone'
    setDevice(to)
    setFlash('server')
    if (to === 'laptop') {
      const had = draft.trim() || deviceDraft
      setDraft('')
      setMsg({
        tone: had ? 'warn' : 'info',
        text: had
          ? 'Your saved notes are here — they came from the server. Your draft isn’t: memory and device storage stay on the phone.'
          : 'Your saved notes are here, loaded fresh from the server. That’s what “synced” means.',
      })
      mark('laptop')
    } else {
      setDraft(deviceDraft ?? '')
      setMsg({ tone: 'info', text: deviceDraft ? 'Back on the phone. Its browser storage still had your draft.' : 'Back on the phone. Saved notes reloaded from the server.' })
    }
  }

  function clearData() {
    setDeviceDraft(null)
    setDraft('')
    setFlash('device')
    setMsg({ tone: 'warn', text: 'Browser data cleared: memory and device storage on this phone are empty. The server still has every saved note.' })
    mark('clear')
  }

  useEffect(() => {
    if (!flash) return
    const t = setTimeout(() => setFlash(null), 900)
    return () => clearTimeout(t)
  }, [flash])

  const box = (id: string, emoji: string, title: string, sub: string, content: React.ReactNode) => (
    <div className={`node ${flash === id ? 'active' : ''}`} style={{ alignItems: 'flex-start' }}>
      <span className="emoji">{emoji}</span>
      <div className="grow stack" style={{ gap: 2 }}>
        <div>
          {title} <span className="tiny muted">· {sub}</span>
        </div>
        <div className="small" style={{ fontWeight: 400, overflowWrap: 'anywhere' }}>
          {content}
        </div>
      </div>
    </div>
  )

  return (
    <div className="stack">
      <div className="phone">
        <div className="screen">
          <div className="row between tiny muted">
            <span>{device === 'phone' ? '📱 Your phone' : '💻 Your laptop'}</span>
            <span>Notes</span>
          </div>
          {server.map((n, i) => (
            <div key={i} className="small" style={{ background: 'var(--surface)', borderRadius: 10, padding: '6px 10px' }}>
              {n}
            </div>
          ))}
          <textarea
            value={draft}
            onChange={(e) => typing(e.target.value)}
            rows={2}
            aria-label="Draft note"
            placeholder="Type a note…"
            style={{
              width: '100%',
              font: 'inherit',
              fontSize: 15,
              padding: 8,
              borderRadius: 10,
              border: '1.5px dashed var(--line)',
              background: 'var(--surface)',
              color: 'var(--ink)',
              resize: 'none',
            }}
          />
          <button type="button" className="btn primary small" onClick={save}>
            Save note
          </button>
        </div>
      </div>

      <div className="row nowrap between">
        <span className="small" style={{ fontWeight: 600 }}>
          Autosave drafts on this device
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={autosave}
          aria-label="Autosave drafts on this device"
          className="switch"
          onClick={() => {
            const v = !autosave
            setAutosave(v)
            if (v && device === 'phone' && draft.trim()) setDeviceDraft(draft)
            if (!v) setDeviceDraft(null)
          }}
        />
      </div>

      <div className="grid2">
        <button type="button" className="btn small" onClick={refresh}>
          🔄 Refresh {did.has('refresh') ? '✓' : ''}
        </button>
        <button type="button" className="btn small" onClick={switchDevice}>
          {device === 'phone' ? '💻 Open on laptop' : '📱 Back to phone'} {did.has('laptop') ? '✓' : ''}
        </button>
        <button type="button" className="btn small" onClick={clearData} disabled={device === 'laptop'}>
          🧹 Clear browser data
        </button>
        <button type="button" className="btn small" onClick={save}>
          ☁️ Save {did.has('save') ? '✓' : ''}
        </button>
      </div>

      <div aria-live="polite">{msg && <div className={`callout ${msg.tone} pop`} key={msg.text}>{msg.text}</div>}</div>

      <div className="stack sm">
        <div className="kicker">Where things live right now</div>
        {box('memory', '🧠', 'Memory', 'this tab, this second', draft.trim() ? `Draft: “${draft.trim()}”` : <span className="muted">empty</span>)}
        {box(
          'device',
          '💾',
          'Device storage',
          device === 'phone' ? 'this phone’s browser' : 'this laptop’s browser',
          device === 'phone' && deviceDraft ? `Saved draft: “${deviceDraft}”` : <span className="muted">{autosave ? 'empty' : 'empty (autosave is off)'}</span>,
        )}
        {box('server', '🗄️', 'Server database', 'every device', `${server.length} saved note${server.length === 1 ? '' : 's'}`)}
      </div>
      {did.size < 3 && (
        <p className="tiny muted">
          To finish: try Refresh with an unsaved draft, Save a note, and Open on laptop.
        </p>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* CacheLab: fast copies, and how they go stale                        */
/* ------------------------------------------------------------------ */

export function CacheLab({ onDone }: { onDone?: () => void }) {
  const [serverName, setServerName] = useState('Maria Lopez')
  const [cached, setCached] = useState<string | null>(null)
  const [shown, setShown] = useState<{ name: string; from: 'server' | 'cache'; ms: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [stale, setStale] = useState(false)
  const [sawStale, setSawStale] = useState(false)
  const [fired, setFired] = useState(false)
  const alive = useRef(true)
  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])

  async function open(skipCache = false) {
    if (cached && !skipCache) {
      setShown({ name: cached, from: 'cache', ms: 8 })
      if (cached !== serverName) {
        setStale(true)
        setSawStale(true)
      } else setStale(false)
      return
    }
    setLoading(true)
    setShown(null)
    await wait(1200)
    if (!alive.current) return
    setLoading(false)
    setCached(serverName)
    setShown({ name: serverName, from: 'server', ms: 1200 })
    setStale(false)
    if (skipCache && sawStale && !fired) {
      setFired(true)
      onDone?.()
    }
  }

  function rename() {
    setServerName(serverName === 'Maria Lopez' ? 'Maria L. Garcia' : 'Maria Lopez')
  }

  return (
    <div className="stack">
      <div className="phone">
        <div className="screen">
          <div className="tiny muted">Contact screen</div>
          {loading && <div className="small pulse">Loading from server…</div>}
          {!loading && !shown && <div className="small muted">Not opened yet.</div>}
          {shown && (
            <div className="stack sm pop" key={`${shown.name}-${shown.from}-${shown.ms}`}>
              <div style={{ fontWeight: 700, fontSize: 18 }}>👤 {shown.name}</div>
              <span className="pill" style={{ alignSelf: 'flex-start' }}>
                {shown.from === 'cache' ? '⚡ from cache' : '🌐 from server'} · {shown.ms === 8 ? '0.008 s' : '1.2 s'}
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="grid2">
        <button type="button" className="btn primary small" onClick={() => open()} disabled={loading}>
          Open contact
        </button>
        <button type="button" className="btn small" onClick={() => open(true)} disabled={loading || !cached}>
          ↻ Pull to refresh
        </button>
      </div>
      <button type="button" className="btn small" onClick={rename} disabled={loading || !cached}>
        ✏️ Alex renames her on another device
      </button>
      <div className="grid2">
        <div className="stat">
          <span className="v small" style={{ fontSize: 15 }}>{serverName}</span>
          <span className="l">🗄️ Server says</span>
        </div>
        <div className="stat">
          <span className="v small" style={{ fontSize: 15 }}>{cached ?? '—'}</span>
          <span className="l">⚡ Phone’s cached copy</span>
        </div>
      </div>
      <div aria-live="polite">
        {stale && (
          <div className="callout warn pop">
            Stale! The cache answered instantly — with yesterday’s truth. Caches trade freshness for speed. Pull to refresh to ask
            the server again.
          </div>
        )}
        {!stale && fired && (
          <div className="callout good pop">
            Fresh again. Real apps set a cache “expiry” and clear it when data changes — and stale caches are behind many “but I
            already changed it!” bug reports.
          </div>
        )}
        {!stale && !fired && shown?.from === 'cache' && (
          <div className="callout info pop">Instant — the phone kept a copy, so it didn’t ask the server. Now have Alex rename her.</div>
        )}
        {!stale && !fired && shown?.from === 'server' && !cached?.includes('Garcia') && (
          <div className="callout info pop">That took 1.2 s because it went to the server. Open it again.</div>
        )}
      </div>
    </div>
  )
}
