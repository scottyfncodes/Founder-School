import { useRef, useState } from 'react'

interface Row {
  id: number
  company: 'acme' | 'bluesky'
  name: string
  note: string
}

const ROWS: Row[] = [
  { id: 1, company: 'acme', name: 'Dana Ruiz', note: 'Renewal in May' },
  { id: 2, company: 'bluesky', name: 'Omar Haddad', note: 'Wants 20% discount' },
  { id: 3, company: 'acme', name: 'Lee Park', note: 'Pilot, 2 aircraft' },
  { id: 4, company: 'bluesky', name: 'Priya Shah', note: 'VIP — owes $12k' },
  { id: 5, company: 'acme', name: 'Tom Becker', note: 'Prefers phone' },
  { id: 6, company: 'bluesky', name: 'Jo King', note: 'Cancelling soon?' },
]

const CO = { acme: 'Acme', bluesky: 'Blue Sky' }

function Rows({ rows, viewer }: { rows: Row[]; viewer: 'acme' }) {
  return (
    <div className="tbl-wrap">
      <table className="tbl">
        <thead>
          <tr>
            <th>company</th>
            <th>name</th>
            <th>note</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className={r.company !== viewer ? 'hl-bad' : ''}>
              <td>{r.company !== viewer ? `⚠️ ${CO[r.company]}` : CO[r.company]}</td>
              <td>{r.name}</td>
              <td>{r.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** One table, two companies. Flip the tenant filter and watch what Maria (at Acme) sees. */
export function TenantTable({ onDone }: { onDone?: () => void }) {
  const [filter, setFilter] = useState(true)
  const [flipped, setFlipped] = useState(0)
  const fired = useRef(false)
  const rows = filter ? ROWS.filter((r) => r.company === 'acme') : ROWS
  const leaks = rows.filter((r) => r.company !== 'acme').length

  function toggle() {
    setFilter(!filter)
    const n = flipped + 1
    setFlipped(n)
    if (!fired.current && n >= 2) {
      fired.current = true
      onDone?.()
    }
  }

  return (
    <div className="stack">
      <div className="row nowrap between well" style={{ padding: '8px 12px' }}>
        <span className="small">
          <b>Tenant filter</b>
          <div className="tiny muted">“only rows from the viewer’s company”</div>
        </span>
        <button type="button" role="switch" aria-checked={filter} aria-label="Tenant filter" className="switch" onClick={toggle} />
      </div>
      <div className="code">
        SELECT * FROM contacts
        {filter ? (
          <span className="good-text">{'\n'}WHERE company = 'acme'</span>
        ) : (
          <span className="bad-text">{'\n'}-- (filter missing)</span>
        )}
      </div>
      <div className="stack sm">
        <div className="row between">
          <span className="kicker">What Maria @ Acme sees</span>
          <span className={`pill ${leaks ? 'bad-text' : 'good-text'}`}>{leaks ? `${leaks} rows leaked` : 'only Acme'}</span>
        </div>
        <Rows rows={rows} viewer="acme" />
      </div>
      <div className={`callout ${filter ? 'good' : 'bad'} small pop`} key={String(filter)}>
        {filter
          ? 'Both companies’ contacts live in the same table. One line of the query keeps Maria inside Acme’s “apartment”.'
          : 'Same table, one forgotten line — and Maria can read Blue Sky’s private notes about their clients. Nothing crashed. Nobody gets an alert.'}
      </div>
      <p className="tiny muted">Flip the switch off and back on.</p>
    </div>
  )
}

interface Feature {
  id: string
  emoji: string
  label: string
  query: string
  leaky: boolean
}

const FEATURES: Feature[] = [
  { id: 'list', emoji: '📋', label: 'Contacts list', query: "SELECT * FROM contacts\nWHERE company = 'acme'", leaky: false },
  {
    id: 'search',
    emoji: '🔎',
    label: 'Search “a”',
    query: "SELECT * FROM contacts\nWHERE company = 'acme'\n  AND name LIKE '%a%'",
    leaky: false,
  },
  { id: 'export', emoji: '📤', label: 'Export CSV', query: 'SELECT * FROM contacts\n-- builds the CSV', leaky: true },
]

/** A customer reports a leak. Run each feature, find the one missing the filter, fix it. */
export function LeakHunt({ onDone }: { onDone?: () => void }) {
  const [ran, setRan] = useState<Set<string>>(new Set())
  const [open, setOpen] = useState<string | null>(null)
  const [accused, setAccused] = useState<string | null>(null)
  const [fixed, setFixed] = useState(false)

  const feature = FEATURES.find((f) => f.id === open)
  const resultRows = (f: Feature) => {
    const base = f.leaky && !fixed ? ROWS : ROWS.filter((r) => r.company === 'acme')
    return f.id === 'search' ? base.filter((r) => r.name.toLowerCase().includes('a')) : base
  }

  return (
    <div className="stack">
      <div className="callout warn small">
        📨 <b>Support ticket from Acme:</b> “I exported our contacts and there are names in here I’ve never seen. Who is
        Priya Shah??”
      </div>
      <div className="stack sm">
        <div className="kicker">Run each feature as Maria @ Acme</div>
        <div className="grid3" role="group" aria-label="Features">
          {FEATURES.map((f) => (
            <button
              key={f.id}
              type="button"
              className="chip"
              aria-pressed={open === f.id}
              onClick={() => {
                setOpen(f.id)
                setRan(new Set(ran).add(f.id))
              }}
              style={{ textAlign: 'center', padding: '8px 4px' }}
            >
              <div aria-hidden="true">{f.emoji}</div>
              <div className="tiny" style={{ fontWeight: 650 }}>
                {f.label} {ran.has(f.id) ? '✓' : ''}
              </div>
            </button>
          ))}
        </div>
      </div>

      {feature && (
        <div className="stack sm pop" key={feature.id + String(fixed)}>
          <div className="code">
            {feature.leaky && fixed ? "SELECT * FROM contacts\nWHERE company = 'acme'\n-- builds the CSV" : feature.query}
          </div>
          <Rows rows={resultRows(feature)} viewer="acme" />
        </div>
      )}

      {ran.size === FEATURES.length && !fixed && (
        <div className="stack sm pop">
          <div className="kicker">Which feature leaks?</div>
          <div className="grid3">
            {FEATURES.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`chip ${accused === f.id ? (f.leaky ? 'good' : 'bad') : ''}`}
                onClick={() => setAccused(f.id)}
                style={{ textAlign: 'center', padding: '8px 4px' }}
              >
                <span className="tiny" style={{ fontWeight: 650 }}>
                  {f.label}
                </span>
              </button>
            ))}
          </div>
          {accused && (
            <div className={`callout ${FEATURES.find((f) => f.id === accused)?.leaky ? 'good' : 'bad'} small pop`} key={accused}>
              {FEATURES.find((f) => f.id === accused)?.leaky
                ? 'Found it. The list and search remembered the company filter; the export endpoint was written later and didn’t. Every new feature is a new chance to forget.'
                : 'Look at its query again — it has the company filter, so its results only include Acme rows.'}
            </div>
          )}
          {accused === 'export' && (
            <button
              type="button"
              className="btn primary"
              onClick={() => {
                setFixed(true)
                setOpen('export')
                onDone?.()
              }}
            >
              🔧 Add the company filter to Export
            </button>
          )}
        </div>
      )}

      {fixed && (
        <div className="callout good small pop">
          Fixed — the export now returns only Acme rows. But the leak already happened: a real company must now tell Blue Sky
          what was exposed, and work out who else exported.
        </div>
      )}
      {ran.size < FEATURES.length && <p className="tiny muted">Run all three features, then pick the culprit.</p>}
    </div>
  )
}
