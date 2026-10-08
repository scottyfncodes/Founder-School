import { useEffect, useRef, useState } from 'react'
import { wait } from '../lib/motion'

type HostId = 'old' | 'new' | 'typo'

const HOSTS: Record<HostId, { ip: string; name: string; label: string }> = {
  old: { ip: '203.0.113.10', name: 'Old Host Co.', label: 'Old host' },
  new: { ip: '198.51.100.20', name: 'New Host Co.', label: 'New host' },
  typo: { ip: '198.51.100.29', name: '', label: 'Typo (…29)' },
}

type Step = 'domain' | 'dns' | 'ip' | 'hosting' | 'site'
const STEPS: { id: Step; emoji: string; label: string }[] = [
  { id: 'domain', emoji: '🔤', label: 'Domain' },
  { id: 'dns', emoji: '📖', label: 'DNS' },
  { id: 'ip', emoji: '🔢', label: 'Server address' },
  { id: 'hosting', emoji: '🏢', label: 'Hosting' },
  { id: 'site', emoji: '🖥️', label: 'Website' },
]

interface Result {
  ok: boolean
  host?: HostId
  text: string
  tone: 'good' | 'bad' | 'warn' | 'info'
}

function clean(v: string) {
  return v
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/.*$/, '')
}

export function DnsLab({ onDone }: { onDone?: () => void }) {
  const [input, setInput] = useState('example.com')
  const [record, setRecord] = useState<HostId>('old')
  const [registered, setRegistered] = useState(true)
  const [notes, setNotes] = useState<Partial<Record<Step, string>>>({})
  const [states, setStates] = useState<Partial<Record<Step, 'active' | 'ok' | 'fail' | 'warn'>>>({})
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [hostsSeen, setHostsSeen] = useState<Set<HostId>>(new Set())
  const [stale, setStale] = useState(0) // visitors still using the old answer
  const [prevRecord, setPrevRecord] = useState<HostId>('old')
  const [fired, setFired] = useState(false)
  const runId = useRef(0)
  useEffect(() => () => void runId.current++, [])

  async function go() {
    const my = ++runId.current
    const name = clean(input)
    setRunning(true)
    setResult(null)
    setNotes({})
    setStates({})
    const step = async (s: Step, note: string, st: 'ok' | 'fail' | 'warn' = 'ok', ms = 750) => {
      if (runId.current !== my) return false
      setStates((x) => ({ ...x, [s]: 'active' }))
      setNotes((x) => ({ ...x, [s]: note }))
      await wait(ms)
      if (runId.current !== my) return false
      setStates((x) => ({ ...x, [s]: st }))
      return true
    }
    const end = (r: Result) => {
      if (runId.current !== my) return
      setResult(r)
      setRunning(false)
    }

    if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(name)) {
      await step('domain', `“${input}” isn’t a domain name`, 'fail')
      return end({ ok: false, tone: 'warn', text: 'Domains look like name.com or app.name.co. Try example.com.' })
    }
    if (!(await step('domain', `You type ${name}`))) return
    if (name !== 'example.com') {
      await step('dns', `No records found for ${name}`, 'fail', 1000)
      return end({ ok: false, tone: 'info', text: `In this sandbox, only example.com has DNS records. A real lookup for ${name} would ask the DNS servers that own that name.` })
    }
    if (!registered) {
      await step('dns', 'example.com is not registered to anyone', 'fail', 1100)
      await step('hosting', 'Your app is still running perfectly on its server…', 'warn', 900)
      return end({ ok: false, tone: 'bad', text: 'The domain expired. Your app is fine, your server is fine — but nobody can find it by name. Customers see “site can’t be reached”.' })
    }
    if (!(await step('dns', `Looks up the record: example.com → ${HOSTS[record].ip}`, 'ok', 1000))) return
    if (!(await step('ip', HOSTS[record].ip))) return
    if (record === 'typo') {
      await step('hosting', 'Nobody is listening at that address', 'fail', 1100)
      return end({ ok: false, tone: 'bad', text: 'One wrong digit in a DNS record and your site is “down” — while your app runs happily at the right address. DNS edits deserve a second pair of eyes.' })
    }
    if (!(await step('hosting', `${HOSTS[record].name} server receives the request`))) return
    if (!(await step('site', 'Acme CRM, version 3', 'ok', 600))) return
    const seen = new Set(hostsSeen).add(record)
    setHostsSeen(seen)
    end({
      ok: true,
      host: record,
      tone: 'good',
      text:
        seen.size > 1
          ? `Same app, same version — now served from ${HOSTS[record].name}. Changing DNS re-points the name; it doesn’t change your app.`
          : `Found it. Every visit starts with this lookup — usually in a few milliseconds, and remembered for a while.`,
    })
    if (seen.size > 1 && !fired) {
      setFired(true)
      onDone?.()
    }
  }

  function change(h: HostId) {
    if (h === record) return
    setPrevRecord(record)
    setRecord(h)
    setStale(2)
    setResult(null)
    setStates({})
    setNotes({})
  }

  const show = result?.ok ? result.host! : null

  return (
    <div className="stack">
      <form
        className="row nowrap"
        onSubmit={(e) => {
          e.preventDefault()
          if (!running) go()
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          aria-label="Domain name"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className="mono"
          style={{
            flex: 1,
            minWidth: 0,
            minHeight: 48,
            padding: '8px 12px',
            fontSize: 16,
            borderRadius: 12,
            border: '1.5px solid var(--line)',
            background: 'var(--surface)',
            color: 'var(--ink)',
          }}
        />
        <button type="submit" className="btn primary" disabled={running}>
          Go
        </button>
      </form>

      <div className="stack sm" style={{ gap: 0 }} aria-hidden="true">
        {STEPS.map((s, i) => {
          const st = states[s.id]
          return (
            <div key={s.id}>
              <div className={`node ${st ?? (running ? 'dim' : '')}`} style={{ minHeight: 46, padding: '8px 12px' }}>
                <span className="emoji">{s.emoji}</span>
                <div className="grow">
                  <div>{s.label}</div>
                  {notes[s.id] && (
                    <div className="tiny ink2 pop" style={{ fontWeight: 500, overflowWrap: 'anywhere' }}>
                      {notes[s.id]}
                    </div>
                  )}
                </div>
              </div>
              {i < STEPS.length - 1 && <div className={`link ${states[STEPS[i + 1].id] ? (states[STEPS[i + 1].id] === 'fail' ? 'fail' : 'active') : ''}`} style={{ height: 14 }} />}
            </div>
          )
        })}
      </div>

      {show && (
        <div className="phone pop">
          <div className="screen" style={{ minHeight: 0 }}>
            <div className="tiny muted mono">🔒 example.com</div>
            <div style={{ fontWeight: 700 }}>Acme CRM</div>
            <div className="tiny ink2">Your contacts, aircraft and notes. · v3</div>
            <div className="tiny muted">Served by {HOSTS[show].name} · {HOSTS[show].ip}</div>
          </div>
        </div>
      )}
      <div aria-live="polite">{result && <div className={`callout ${result.tone} pop`}>{result.text}</div>}</div>

      <div className="card tight flat stack sm">
        <div className="kicker">DNS record for example.com</div>
        <div className="mono small" style={{ overflowWrap: 'anywhere' }}>
          A&nbsp;&nbsp;example.com → <b>{HOSTS[record].ip}</b>
        </div>
        <div className="row" style={{ gap: 6 }}>
          {(Object.keys(HOSTS) as HostId[]).map((h) => (
            <button key={h} type="button" className="chip small" aria-pressed={record === h} disabled={running || !registered} onClick={() => change(h)}>
              {HOSTS[h].label}
            </button>
          ))}
        </div>
        {stale > 0 && registered && (
          <div className="stack sm pop">
            <div className="tiny ink2">
              Changed from {HOSTS[prevRecord].ip}. Visitors’ devices remember old answers for up to the record’s TTL (here: 1 hour), so
              the switch rolls out gradually:
            </div>
            <div className="row" style={{ gap: 4 }} aria-label={`${6 - stale} of 6 visitors on the new address`}>
              {Array.from({ length: 6 }, (_, i) => (
                <span key={i} className="pill" style={i < stale ? { background: 'var(--warn-soft)', color: 'var(--warn)' } : { background: 'var(--good-soft)', color: 'var(--good)' }}>
                  {i < stale ? '⏳ old' : '✓ new'}
                </span>
              ))}
            </div>
            <button type="button" className="btn small" onClick={() => setStale(0)}>
              ⏩ Wait out the TTL
            </button>
          </div>
        )}
        {hostsSeen.size < 2 && <p className="tiny muted">Look up example.com, switch the record to “New host”, then look it up again.</p>}
      </div>

      <div className="card tight flat stack sm">
        <div className="kicker">Who owns the name?</div>
        <p className="small ink2">
          You rent the name yearly from a <b>registrar</b>. Whoever controls that account controls where the name points.
        </p>
        {registered ? (
          <button
            type="button"
            className="btn danger small"
            disabled={running}
            onClick={() => {
              setRegistered(false)
              setResult(null)
              setStates({})
              setNotes({})
            }}
          >
            📅 Skip ahead: renewal card expired
          </button>
        ) : (
          <div className="stack sm">
            <div className="callout bad small">Domain expired. Look it up again to see what customers get.</div>
            <button
              type="button"
              className="btn primary small"
              disabled={running}
              onClick={() => {
                setRegistered(true)
                setResult(null)
                setStates({})
                setNotes({})
              }}
            >
              💳 Renew the domain
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
