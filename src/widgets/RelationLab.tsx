import { useState } from 'react'
import { DbTable } from './MiniDB'
import { AIRCRAFT, CONTACTS, DOCUMENTS, NOTES, OWNERS, USERS } from './miniDbData'
import type { Cell } from './miniDbData'

const dim = { opacity: 0.35 }
const fk = { fontWeight: 800, color: 'var(--accent)' }

/* ------------------------------------------------------------------ */
/* RelationExplorer: tap a contact, watch related rows light up        */
/* ------------------------------------------------------------------ */

export function RelationExplorer({ onDone }: { onDone?: () => void }) {
  const [sel, setSel] = useState<number | null>(null)
  const [seen, setSeen] = useState<Set<number>>(new Set())
  const [fired, setFired] = useState(false)

  const contact = CONTACTS.rows.find((r) => r[0] === sel)
  const owner = contact ? USERS.rows.find((u) => u[0] === contact[4]) : undefined
  const notes = NOTES.rows.filter((r) => r[1] === sel)
  const docs = DOCUMENTS.rows.filter((r) => r[1] === sel)
  const links = OWNERS.rows.filter((r) => r[0] === sel)
  const planes = links.map((l) => AIRCRAFT.rows.find((a) => a[0] === l[1])!)
  const shared = links
    .map((l) => ({ plane: AIRCRAFT.rows.find((a) => a[0] === l[1])!, others: OWNERS.rows.filter((o) => o[1] === l[1] && o[0] !== sel) }))
    .filter((x) => x.others.length > 0)
  const nameOf = (id: Cell) => CONTACTS.rows.find((c) => c[0] === id)?.[1]

  function pick(id: number) {
    setSel(id)
    const next = new Set(seen).add(id)
    setSeen(next)
    if (!fired && next.size >= 3) {
      setFired(true)
      onDone?.()
    }
  }

  const mine = (col: string) => (c: string, r: Cell[]) => {
    if (sel === null) return undefined
    if (r[col === 'contact_id' ? 1 : 0] !== sel) return dim
    return c === col ? fk : undefined
  }

  return (
    <div className="stack">
      <div className="stack sm">
        <div className="kicker">Tap a contact ({Math.min(seen.size, 3)}/3)</div>
        <div className="row" style={{ gap: 6 }}>
          {CONTACTS.rows.map((r) => (
            <button
              key={r[0] as number}
              type="button"
              className={`chip small ${seen.has(r[0] as number) && sel !== r[0] ? 'good' : ''}`}
              aria-pressed={sel === r[0]}
              onClick={() => pick(r[0] as number)}
              style={{ padding: '6px 10px', fontSize: 13 }}
            >
              {r[1]} <span className="muted">· {r[3]}</span>
            </button>
          ))}
        </div>
      </div>

      {contact && (
        <div className="card tight flat stack sm pop" key={sel}>
          <div style={{ fontWeight: 700 }}>
            👤 {contact[1]} <span className="pill mono">id {contact[0]}</span>
          </div>
          <div className="small ink2">
            {notes.length} note{notes.length === 1 ? '' : 's'} · {docs.length} document{docs.length === 1 ? '' : 's'} · {planes.length} aircraft · looked
            after by <b>{owner?.[1]}</b> <span className="mono tiny">(owner_id {contact[4]} → USERS)</span>
          </div>
          {notes.length + docs.length === 0 && (
            <div className="tiny muted">Nothing points to this contact yet — that’s fine. A contact can have zero notes.</div>
          )}
        </div>
      )}

      <div className="stack sm">
        <div className="kicker">📝 NOTES — each note points to one contact</div>
        <DbTable table={NOTES} caption="Notes" cellStyle={mine('contact_id')} />
      </div>
      <div className="stack sm">
        <div className="kicker">📄 DOCUMENTS</div>
        <DbTable table={DOCUMENTS} caption="Documents" cellStyle={mine('contact_id')} />
      </div>
      <div className="stack sm">
        <div className="kicker">🔗 AIRCRAFT_OWNERS — links contacts and planes</div>
        <DbTable table={OWNERS} caption="Aircraft owners" cellStyle={(c, r) => (sel === null ? undefined : r[0] !== sel ? dim : c === 'contact_id' ? fk : undefined)} />
      </div>

      <div aria-live="polite" className="stack sm">
        {sel === null && <p className="small muted">Tap a contact to see everything that points to them.</p>}
        {contact && (notes.length > 0 || docs.length > 0) && (
          <div className="callout info small pop" key={`n${sel}`}>
            Every highlighted row has <span className="mono">contact_id = {sel}</span>. That column is a <b>foreign key</b>: it stores another
            table’s id, which is how rows “point” at each other. One contact → many notes is <b>one-to-many</b>.
          </div>
        )}
        {contact && planes.length > 0 && (
          <div className="callout good small pop" key={`p${sel}`}>
            ✈️ {planes.map((p) => `${p[1]} (${p[2]})`).join(', ')}
            {shared.length > 0 && (
              <>
                {' '}
                — and {shared.map((s) => `${s.plane[1]} also belongs to ${s.others.map((o) => nameOf(o[0])).join(', ')}`).join('; ')}. People
                own many planes, planes have many owners: <b>many-to-many</b>, which needs the link table.
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* DeleteRules: what happens to related rows when a contact is deleted */
/* ------------------------------------------------------------------ */

type Rule = 'none' | 'block' | 'cascade'
const RULES: { id: Rule; label: string }[] = [
  { id: 'none', label: 'No rule' },
  { id: 'block', label: 'Block (restrict)' },
  { id: 'cascade', label: 'Cascade' },
]

export function DeleteRules({ onDone }: { onDone?: () => void }) {
  const [rule, setRule] = useState<Rule>('none')
  const [ran, setRan] = useState<Rule | null>(null)
  const [tried, setTried] = useState<Set<Rule>>(new Set())
  const [fired, setFired] = useState(false)
  const ID = 101

  function del() {
    setRan(rule)
    const next = new Set(tried).add(rule)
    setTried(next)
    if (!fired && next.size === RULES.length) {
      setFired(true)
      onDone?.()
    }
  }

  const contactGone = ran === 'none' || ran === 'cascade'
  const childGone = ran === 'cascade'
  const orphan = ran === 'none'
  const child = (c: string, r: Cell[]) => {
    if (r[1] !== ID) return dim
    if (childGone) return { textDecoration: 'line-through', opacity: 0.6 }
    if (orphan && c === 'contact_id') return { fontWeight: 800, color: 'var(--bad)' }
    return c === 'contact_id' ? fk : undefined
  }
  const rowCls = (r: Cell[]) => (r[1] === ID ? (orphan ? 'hl-bad' : childGone ? 'hl-bad' : 'hl') : '')

  return (
    <div className="stack">
      <div className="stack sm">
        <div className="kicker">Rule for “contact deleted”</div>
        <div className="row" style={{ gap: 6 }}>
          {RULES.map((r) => (
            <button
              key={r.id}
              type="button"
              className="chip small"
              aria-pressed={rule === r.id}
              onClick={() => {
                setRule(r.id)
                setRan(null)
              }}
            >
              {r.label} {tried.has(r.id) ? '✓' : ''}
            </button>
          ))}
        </div>
      </div>
      <button type="button" className="btn danger" onClick={del}>
        🗑 Delete Maria Lopez (id 101)
      </button>

      <DbTable
        table={CONTACTS}
        rows={CONTACTS.rows.slice(0, 3)}
        caption="Contacts"
        rowClass={(r) => (r[0] === ID ? (contactGone ? 'hl-bad' : 'hl') : '')}
        cellStyle={(_, r) => (r[0] === ID && contactGone ? { textDecoration: 'line-through', opacity: 0.6 } : r[0] !== ID ? dim : undefined)}
      />
      <DbTable table={NOTES} rows={NOTES.rows.slice(0, 4)} caption="Notes" rowClass={rowCls} cellStyle={child} />
      <DbTable table={DOCUMENTS} rows={DOCUMENTS.rows.slice(0, 3)} caption="Documents" rowClass={rowCls} cellStyle={child} />

      <div aria-live="polite">
        {ran === 'none' && (
          <div className="callout bad pop">
            Maria is gone, but 2 notes and 2 documents still say <span className="mono">contact_id = 101</span> — pointing at nobody. These
            “orphans” cause blank screens and errors, and her files linger.
          </div>
        )}
        {ran === 'block' && (
          <div className="callout good pop">
            Refused: “2 notes and 2 documents still point to contact 101.” Nothing deleted. Safe — the app must ask the user what to do with
            them first.
          </div>
        )}
        {ran === 'cascade' && (
          <div className="callout warn pop">
            5 rows gone in one tap: Maria, her 2 notes and 2 documents. Tidy and consistent — and permanent. Great for drafts, frightening
            for invoices.
          </div>
        )}
        {!ran && <p className="small muted">Pick a rule, then delete. Try all three.</p>}
      </div>
    </div>
  )
}
