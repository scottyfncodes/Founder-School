import { useState } from 'react'
import { DbTable } from './MiniDB'
import { CONTACTS, OWNERS } from './miniDbData'
import type { Cell } from './miniDbData'

type City = 'any' | 'Denver' | 'Austin' | 'Boston'
type Owner = 'any' | 1 | 2
type Plane = 'any' | 'yes' | 'no'
type Sort = 'id' | 'name'

const CHALLENGES: { ask: string; want: number[]; win: string }[] = [
  { ask: 'Which of Alex’s contacts are in Denver?', want: [103, 108], win: 'Two filters combined with AND: both must be true.' },
  { ask: 'Which Boston contacts own an aircraft?', want: [104], win: 'The aircraft filter quietly checks another table — queries can combine tables.' },
  { ask: 'Sales leads: who in Denver doesn’t own a plane yet?', want: [106], win: 'You just turned data into a sales list. That’s what queries are for.' },
]

const owns = (id: Cell) => OWNERS.rows.some((o) => o[0] === id)

interface Filters {
  city: City
  owner: Owner
  plane: Plane
  sort: Sort
}
const EMPTY: Filters = { city: 'any', owner: 'any', plane: 'any', sort: 'id' }

function matches(f: Filters, r: Cell[]) {
  return (
    (f.city === 'any' || r[3] === f.city) &&
    (f.owner === 'any' || r[4] === f.owner) &&
    (f.plane === 'any' || (f.plane === 'yes' ? owns(r[0]) : !owns(r[0])))
  )
}

function solves(f: Filters, level: number) {
  const ids = CONTACTS.rows.filter((r) => matches(f, r)).map((r) => r[0] as number)
  const want = CHALLENGES[level].want
  return ids.length === want.length && want.every((w) => ids.includes(w))
}

export function QueryBuilder({ onDone }: { onDone?: () => void }) {
  const [f, setFState] = useState<Filters>(EMPTY)
  const [level, setLevel] = useState(0)
  const [fired, setFired] = useState(false)
  const { city, owner, plane, sort } = f

  const rows = [...CONTACTS.rows].sort((a, b) => (sort === 'name' ? String(a[1]).localeCompare(String(b[1])) : (a[0] as number) - (b[0] as number)))
  const hits = rows.filter((r) => matches(f, r))
  const ch = CHALLENGES[level]
  const isSolved = !!ch && solves(f, level)

  function setF(patch: Partial<Filters>) {
    const nf = { ...f, ...patch }
    setFState(nf)
    if (!fired && level === CHALLENGES.length - 1 && solves(nf, level)) {
      setFired(true)
      onDone?.()
    }
  }
  const setCity = (v: City) => setF({ city: v })
  const setOwner = (v: Owner) => setF({ owner: v })
  const setPlane = (v: Plane) => setF({ plane: v })
  const setSort = (v: Sort) => setF({ sort: v })
  const match = (r: Cell[]) => matches(f, r)

  const where: string[] = []
  if (city !== 'any') where.push(`city = '${city}'`)
  if (owner !== 'any') where.push(`owner_id = ${owner}`)
  if (plane === 'yes') where.push('id IN (SELECT contact_id FROM aircraft_owners)')
  if (plane === 'no') where.push('id NOT IN (SELECT contact_id FROM aircraft_owners)')
  const sql = `SELECT * FROM contacts${where.length ? `\nWHERE ${where.join('\n  AND ')}` : ''}\nORDER BY ${sort};`

  const english = [
    'Show me contacts',
    owner === 1 ? 'that Scott looks after' : owner === 2 ? 'that Alex looks after' : '',
    city !== 'any' ? `in ${city}` : '',
    plane === 'yes' ? 'who own an aircraft' : plane === 'no' ? 'who don’t own an aircraft' : '',
    `, sorted by ${sort === 'id' ? 'id' : 'name'}`,
  ]
    .filter(Boolean)
    .join(' ')
    .replace(' ,', ',')

  const chips = <T extends string | number>(label: string, value: T, set: (v: T) => void, opts: { v: T; l: string }[]) => (
    <div className="stack sm">
      <div className="kicker">{label}</div>
      <div className="row" style={{ gap: 6 }}>
        {opts.map((o) => (
          <button key={String(o.v)} type="button" className="chip small" aria-pressed={value === o.v} onClick={() => set(o.v)} style={{ padding: '6px 12px' }}>
            {o.l}
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div className="stack">
      {ch ? (
        <div className={`callout ${isSolved ? 'good' : 'info'}`}>
          <div className="tiny" style={{ fontWeight: 700 }}>
            CHALLENGE {level + 1} OF {CHALLENGES.length}
          </div>
          <div style={{ fontWeight: 650 }}>{ch.ask}</div>
          {isSolved && (
            <div className="stack sm pop" style={{ marginTop: 6 }}>
              <div className="small">✅ {ch.win}</div>
              {level < CHALLENGES.length - 1 ? (
                <button
                  type="button"
                  className="btn primary small"
                  onClick={() => {
                    setLevel(level + 1)
                    setFState({ ...EMPTY, sort })
                  }}
                >
                  Next challenge →
                </button>
              ) : (
                <div className="small" style={{ fontWeight: 650 }}>
                  All three solved. Every dashboard, report and search box in your app is a query like these.
                </div>
              )}
            </div>
          )}
        </div>
      ) : null}

      {chips<City>('City', city, setCity, [
        { v: 'any', l: 'Any' },
        { v: 'Denver', l: 'Denver' },
        { v: 'Austin', l: 'Austin' },
        { v: 'Boston', l: 'Boston' },
      ])}
      {chips<Owner>('Looked after by', owner, setOwner, [
        { v: 'any', l: 'Anyone' },
        { v: 1, l: 'Scott' },
        { v: 2, l: 'Alex' },
      ])}
      {chips<Plane>('Owns an aircraft', plane, setPlane, [
        { v: 'any', l: 'Either' },
        { v: 'yes', l: 'Yes' },
        { v: 'no', l: 'No' },
      ])}
      {chips<Sort>('Sort by', sort, setSort, [
        { v: 'id', l: 'id' },
        { v: 'name', l: 'name' },
      ])}

      <div className="well stack sm">
        <div className="kicker">Your question</div>
        <div className="small" style={{ fontWeight: 600 }}>
          “{english}”
        </div>
        <div className="kicker">The same question as a query (SQL)</div>
        <div className="code" style={{ fontSize: 12 }}>
          {sql}
        </div>
      </div>

      <div className="row between">
        <span className="kicker">Result</span>
        <span className="pill">
          {hits.length} of {rows.length} rows
        </span>
      </div>
      <DbTable
        table={CONTACTS}
        rows={rows}
        caption="Query result"
        rowClass={(r) => (match(r) ? 'hl-good' : '')}
        cellStyle={(_, r) => (match(r) ? undefined : { opacity: 0.3 })}
      />
    </div>
  )
}
