import { useEffect, useMemo, useRef, useState } from 'react'
import { GLOSSARY } from '../content/glossary'
import { lessonById } from '../content/curriculum'
import { href } from '../lib/router'

export function GlossaryPage({ openId }: { openId?: string }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState<string | null>(openId ?? null)
  const openRef = useRef<HTMLLIElement>(null)

  useEffect(() => {
    if (openId) {
      setOpen(openId)
      setQ('')
    }
  }, [openId])

  useEffect(() => {
    if (openId) openRef.current?.scrollIntoView({ block: 'center' })
  }, [openId])

  const sorted = useMemo(() => [...GLOSSARY].sort((a, b) => a.term.localeCompare(b.term)), [])
  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return sorted
    return sorted
      .filter((t) => t.term.toLowerCase().includes(s) || t.what.toLowerCase().includes(s))
      .sort((a, b) => Number(!a.term.toLowerCase().startsWith(s)) - Number(!b.term.toLowerCase().startsWith(s)))
  }, [q, sorted])

  return (
    <main className="page">
      <div className="stack lg">
        <header className="stack sm">
          <div className="kicker">Glossary</div>
          <h1>Jargon, translated</h1>
          <p className="lead">{GLOSSARY.length} terms in plain English. Technical words aren’t intelligence — they’re just labels.</p>
        </header>
        <div
          style={{
            position: 'sticky',
            top: 'calc(8px + var(--safe-t))',
            zIndex: 4,
          }}
        >
          <label className="sr-only" htmlFor="gsearch">
            Search the glossary
          </label>
          <input
            id="gsearch"
            type="search"
            placeholder="Search: API, churn, migration…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            autoComplete="off"
            style={{
              width: '100%',
              minHeight: 50,
              padding: '12px 16px',
              borderRadius: 14,
              border: '1.5px solid var(--line)',
              background: 'var(--surface)',
              color: 'var(--ink)',
              fontSize: 17,
              boxShadow: 'var(--shadow)',
            }}
          />
        </div>
        {list.length === 0 && <p className="muted center">No terms match “{q}”.</p>}
        <ul className="stack sm" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {list.map((t) => {
            const isOpen = open === t.id
            return (
              <li key={t.id} id={`term-${t.id}`} ref={isOpen && openId === t.id ? openRef : undefined} className="card tight">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : t.id)}
                  className="row nowrap between"
                  style={{
                    width: '100%',
                    background: 'none',
                    border: 0,
                    padding: '4px 2px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    minHeight: 40,
                  }}
                >
                  <span className="grow">
                    <b>{t.term}</b>
                    {!isOpen && (
                      <span
                        className="small muted"
                        style={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                      >
                        {t.what}
                      </span>
                    )}
                  </span>
                  <span aria-hidden="true" className="muted">
                    {isOpen ? '−' : '+'}
                  </span>
                </button>
                {isOpen && (
                  <div className="stack sm pop" style={{ paddingTop: 8 }}>
                    <div>
                      <div className="kicker">What it is</div>
                      <p className="small">{t.what}</p>
                    </div>
                    <div>
                      <div className="kicker">Why it matters</div>
                      <p className="small ink2">{t.why}</p>
                    </div>
                    {t.lessons.length > 0 && (
                      <div className="stack sm">
                        <div className="kicker">See it in action</div>
                        <div className="row">
                          {t.lessons.map((id) => (
                            <a key={id} className="btn small" href={href(`/lesson/${id}`)}>
                              ▶ {lessonById(id)?.title ?? id}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </main>
  )
}
