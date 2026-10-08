import { useRef, useState } from 'react'

interface Line {
  id: string
  file?: string
  text: string
  kind: '+' | '-' | ' '
  flag?: string
  ok?: string
}

const LINES: Line[] = [
  { id: 'f1', file: 'api/invites.ts', text: 'export async function invite(user, email) {', kind: ' ', ok: 'Just the function name — context, not a change.' },
  { id: 'l1', text: "  if (user.role !== 'ADMIN') return forbidden()", kind: '-', flag: 'The admin check was DELETED. Now any user can invite people into the company — the authorization bug from World 4.' },
  { id: 'l2', text: '  validateEmail(email)', kind: '+', ok: 'Checking the email looks valid. Good hygiene.' },
  { id: 'l3', text: '  const KEY = "SG.live_9xK2fQ…"', kind: '+', flag: 'A live email-provider key pasted into the code. Anyone with repo access (or a leaked copy) can send email as you. Keys belong in secret settings, not code.' },
  { id: 'l4', text: '  await sendInvite(KEY, email)', kind: '+', ok: 'Sends the invite. Fine — once the key comes from a secret setting instead.' },
  { id: 'l5', text: '  await db.run("DELETE FROM invites")', kind: '+', flag: 'Meant to clear old invites — but there’s no filter. It deletes EVERY company’s pending invites, every time anyone invites someone.' },
  { id: 'l6', text: "  return ok('Invite sent')", kind: '+', ok: 'Tells the user it worked. Fine.' },
  { id: 'f2', file: 'tests/invites.test.ts', text: "test('admin can invite a teammate')", kind: '+', ok: 'A test! Good — though notice there’s no test that a USER is refused. That test would have caught the deleted check.' },
]

const FLAGS = LINES.filter((l) => l.flag).length

/** Review a pull request like a founder: tap suspicious lines, then decide. */
export function PRReview({ onDone }: { onDone?: () => void }) {
  const [tapped, setTapped] = useState<Set<string>>(new Set())
  const [last, setLast] = useState<Line | null>(null)
  const [decision, setDecision] = useState<'approve' | 'changes' | null>(null)
  const fired = useRef(false)
  const found = LINES.filter((l) => l.flag && tapped.has(l.id)).length

  function tap(l: Line) {
    setTapped(new Set(tapped).add(l.id))
    setLast(l)
  }

  function decide(d: 'approve' | 'changes') {
    setDecision(d)
    if (d === 'changes' && !fired.current) {
      fired.current = true
      onDone?.()
    }
  }

  return (
    <div className="stack">
      <div className="card tight flat stack sm">
        <div className="row between nowrap">
          <b className="small">#42 Let admins invite teammates</b>
          <span className="pill">Open</span>
        </div>
        <p className="tiny muted">ai-agent wants to merge 1 commit into main · +6 −1 · 2 files</p>
        <p className="small">“Adds an Invite button so admins can add teammates by email. Tested.”</p>
      </div>

      <div className="stack sm">
        <div className="row between">
          <span className="kicker">The diff — tap lines that worry you</span>
          <span className={`pill ${found === FLAGS ? 'good-text' : ''}`}>
            {found}/{FLAGS} problems
          </span>
        </div>
        <div className="card tight flat" style={{ padding: 6 }}>
          {LINES.map((l) => {
            const t = tapped.has(l.id)
            const bg = t ? (l.flag ? 'var(--bad-soft)' : 'var(--good-soft)') : l.kind === '+' ? 'color-mix(in srgb, var(--good) 8%, transparent)' : l.kind === '-' ? 'color-mix(in srgb, var(--bad) 8%, transparent)' : 'transparent'
            return (
              <div key={l.id}>
                {l.file && <div className="tiny muted mono" style={{ padding: '6px 6px 2px' }}>📄 {l.file}</div>}
                <button
                  type="button"
                  onClick={() => tap(l)}
                  aria-pressed={t}
                  className="mono"
                  style={{
                    display: 'flex',
                    gap: 6,
                    width: '100%',
                    minHeight: 44,
                    alignItems: 'center',
                    padding: '4px 6px',
                    border: 0,
                    borderRadius: 8,
                    background: bg,
                    textAlign: 'left',
                    fontSize: 12,
                    cursor: 'pointer',
                    overflowWrap: 'anywhere',
                  }}
                >
                  <span style={{ flex: 'none', width: 10, fontWeight: 700 }} className={l.kind === '+' ? 'good-text' : l.kind === '-' ? 'bad-text' : 'muted'}>
                    {l.kind}
                  </span>
                  <span className="grow">{l.text}</span>
                  {t && <span aria-hidden="true">{l.flag ? '🚩' : '👍'}</span>}
                </button>
              </div>
            )
          })}
        </div>
        <p className="tiny muted">Green “+” lines were added. Red “−” lines were removed.</p>
      </div>

      {last && (
        <div className={`callout ${last.flag ? 'bad' : 'good'} small pop`} key={last.id} aria-live="polite">
          <b>{last.flag ? '🚩 Problem: ' : '👍 Looks fine: '}</b>
          {last.flag ?? last.ok}
        </div>
      )}

      {found === FLAGS && (
        <div className="stack sm pop">
          <div className="kicker">Your review</div>
          <div className="grid2">
            <button type="button" className={`chip ${decision === 'approve' ? 'bad' : ''}`} onClick={() => decide('approve')}>
              ✅ Approve & merge
            </button>
            <button type="button" className={`chip ${decision === 'changes' ? 'good' : ''}`} onClick={() => decide('changes')}>
              🔁 Request changes
            </button>
          </div>
          {decision === 'approve' && (
            <div className="callout bad small">That would ship a permission hole, a leaked key and a data-deleting bug — all in one tidy-looking PR. Try the other choice.</div>
          )}
          {decision === 'changes' && (
            <div className="callout good small">
              Right. Your comment: “Restore the admin check and add a test that users get 403; move the key to secrets and
              rotate it; scope the DELETE to this company’s expired invites.” Ten minutes of review just prevented an incident.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
