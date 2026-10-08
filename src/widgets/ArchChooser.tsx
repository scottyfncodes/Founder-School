import { useRef, useState } from 'react'

type StyleId = 'clientserver' | 'monolith' | 'services' | 'serverless'

const DIMS = [
  { id: 'simple', label: 'Simplicity', goodHigh: true },
  { id: 'cost', label: 'Cheap when small', goodHigh: true },
  { id: 'scale', label: 'Scales to huge', goodHigh: true },
  { id: 'reliable', label: 'Contains failures', goodHigh: true },
  { id: 'ops', label: 'Ops work needed', goodHigh: false },
] as const

type DimId = (typeof DIMS)[number]['id']

const STYLES: Record<
  StyleId,
  { emoji: string; name: string; what: string; boxes: string[]; scores: Record<DimId, number>; best: string; watch: string }
> = {
  clientserver: {
    emoji: '📱↔️🖥️',
    name: 'Client / server',
    what: 'The basic shape of every web app: a client (browser or phone) asks; a server answers. The other three are ways to build the server half.',
    boxes: ['📱 Client', '🖥️ One server', '🗄️ Database'],
    scores: { simple: 5, cost: 5, scale: 2, reliable: 2, ops: 1 },
    best: 'Every app starts here. A single server is perfect for prototypes and early products.',
    watch: 'One server is one point of failure. Grow it into a proper monolith with a managed database.',
  },
  monolith: {
    emoji: '🏛️',
    name: 'Monolith',
    what: 'One app, one codebase, deployed as one unit (often on a few identical servers). Everything — users, billing, search — lives together.',
    boxes: ['📱 Client', '🏛️ The app (all features)', '🗄️ Database'],
    scores: { simple: 5, cost: 4, scale: 3, reliable: 3, ops: 2 },
    best: 'Most startups, from day one to well past 10,000 users. Shopify and GitHub grew huge on monoliths.',
    watch: 'As the team grows past ~30 engineers, everyone shipping one app starts to step on each other.',
  },
  services: {
    emoji: '🧩',
    name: 'Services (microservices)',
    what: 'Many small apps — users, billing, search, notifications — each deployed separately and talking over the network.',
    boxes: ['📱 Client', '🚪 Gateway', '👤 Users', '💳 Billing', '🔎 Search', '🗄️ DB per service'],
    scores: { simple: 1, cost: 2, scale: 5, reliable: 4, ops: 5 },
    best: 'Large companies with many teams, or parts with wildly different load. Each team owns and ships its piece.',
    watch: 'Every call is now a network call that can fail. You need serious monitoring, tooling and people to run it.',
  },
  serverless: {
    emoji: '⚡',
    name: 'Serverless',
    what: 'You upload functions; the cloud runs them only when requests arrive and bills per request. No servers to manage.',
    boxes: ['📱 Client', '⚡ Function per task', '☁️ Managed database'],
    scores: { simple: 4, cost: 5, scale: 4, reliable: 4, ops: 1 },
    best: 'Spiky or unpredictable traffic, background jobs, small teams that don’t want to manage servers.',
    watch: 'Slow “cold starts”, time limits, costs that climb under constant heavy load, and tight ties to one cloud.',
  },
}

interface Scenario {
  id: string
  emoji: string
  title: string
  detail: string
  verdict: Record<Exclude<StyleId, 'clientserver'>, { tone: 'good' | 'warn' | 'bad'; text: string }>
}

const SCENARIOS: Scenario[] = [
  {
    id: 's50',
    emoji: '🌱',
    title: '50 users',
    detail: 'You and an AI agent. Launching next month. Still figuring out what customers want.',
    verdict: {
      monolith: { tone: 'good', text: 'Best fit. One codebase, one deploy, one place to look when it breaks. You’ll change direction often — keep it simple.' },
      serverless: { tone: 'warn', text: 'Also reasonable — near-zero cost at this size. Just watch that features don’t scatter across dozens of functions.' },
      services: { tone: 'bad', text: 'Massive overkill. You’d spend your launch month wiring services together instead of talking to customers.' },
    },
  },
  {
    id: 's10k',
    emoji: '📈',
    title: '10,000 users',
    detail: 'Steady growth, 4 engineers, paying customers who expect it to just work.',
    verdict: {
      monolith: { tone: 'good', text: 'Still the best fit. A well-organized monolith on a few servers handles this easily. Add caching, a CDN, a bigger database first.' },
      serverless: { tone: 'warn', text: 'Can work, especially for background jobs. Watch for cold starts and per-request costs as traffic becomes constant.' },
      services: { tone: 'bad', text: 'Classic founder trap. 4 engineers running 12 services spend their week on plumbing and debugging network calls.' },
    },
  },
  {
    id: 's10m',
    emoji: '🦄',
    title: '10 million users',
    detail: '300 engineers in 30 teams. Search gets 50× more traffic than billing.',
    verdict: {
      services: { tone: 'good', text: 'Now services earn their cost. Teams ship independently, and search can scale without touching billing.' },
      monolith: { tone: 'warn', text: 'Possible with huge investment (some giants do it), but 30 teams deploying one app constantly collide.' },
      serverless: { tone: 'warn', text: 'Useful for some pieces, but running everything as functions at constant huge load usually costs more than servers.' },
    },
  },
  {
    id: 'spike',
    emoji: '🎟️',
    title: 'Spiky ticket sales',
    detail: 'Quiet all week. Then 200,000 people arrive at 10:00 on Friday for concert tickets.',
    verdict: {
      serverless: { tone: 'good', text: 'Made for this: scales up in seconds for the rush and costs almost nothing during the quiet week.' },
      monolith: { tone: 'warn', text: 'Works if you pre-scale servers before Friday — but you pay for idle capacity, and guessing wrong means crashing at 10:00.' },
      services: { tone: 'bad', text: 'Doesn’t solve the spike by itself, and adds lots of moving parts that can fail under exactly that pressure.' },
    },
  },
]

/** Compare four architecture styles, then pick one for each scenario. */
export function ArchCompare({ onDone }: { onDone?: () => void }) {
  const [sel, setSel] = useState<StyleId>('clientserver')
  const [seen, setSeen] = useState<Set<StyleId>>(new Set(['clientserver']))
  const fired = useRef(false)
  const s = STYLES[sel]

  function pick(id: StyleId) {
    setSel(id)
    const n = new Set(seen).add(id)
    setSeen(n)
    if (!fired.current && n.size === 4) {
      fired.current = true
      onDone?.()
    }
  }

  return (
    <div className="stack">
      <div className="grid2" role="tablist" aria-label="Architecture style">
        {(Object.keys(STYLES) as StyleId[]).map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={sel === id}
            className={`chip ${sel === id ? 'on' : ''}`}
            onClick={() => pick(id)}
            style={{ padding: '8px 10px' }}
          >
            <span className="small" style={{ fontWeight: 650 }}>
              {STYLES[id].name} {seen.has(id) && sel !== id ? '✓' : ''}
            </span>
          </button>
        ))}
      </div>

      <div className="card tight flat stack sm pop" key={sel} role="tabpanel">
        <div style={{ fontSize: 26 }} aria-hidden="true">
          {s.emoji}
        </div>
        <p className="small">{s.what}</p>
        <div className="row" style={{ gap: 4 }} aria-label="Shape">
          {s.boxes.map((b, i) => (
            <span key={b} className="row nowrap" style={{ gap: 4 }}>
              <span className="pill">{b}</span>
              {i < s.boxes.length - 1 && i < 2 && <span className="tiny muted">→</span>}
            </span>
          ))}
        </div>
        <div className="stack" style={{ gap: 6, marginTop: 4 }}>
          {DIMS.map((d) => {
            const v = s.scores[d.id]
            const good = d.goodHigh ? v >= 4 : v <= 2
            const bad = d.goodHigh ? v <= 2 : v >= 4
            return (
              <div key={d.id} className="stack" style={{ gap: 2 }}>
                <span className="row between tiny">
                  <span>{d.label}</span>
                  <span className="muted">{'●'.repeat(v) + '○'.repeat(5 - v)}</span>
                </span>
                <span className="meter" style={{ height: 6 }}>
                  <span style={{ width: `${v * 20}%`, background: good ? 'var(--good)' : bad ? 'var(--bad)' : 'var(--warn)' }} />
                </span>
              </div>
            )
          })}
        </div>
        <div className="callout good small">
          <b>Best for:</b> {s.best}
        </div>
        <div className="callout warn small">
          <b>Watch out:</b> {s.watch}
        </div>
      </div>
      <p className="tiny muted">Open all four styles. Green = good for you, red = costly.</p>
    </div>
  )
}

export function ArchScenarios({ onDone }: { onDone?: () => void }) {
  const [answers, setAnswers] = useState<Record<string, StyleId>>({})
  const [idx, setIdx] = useState(0)
  const fired = useRef(false)
  const sc = SCENARIOS[idx]
  const picked = answers[sc.id] as Exclude<StyleId, 'clientserver'> | undefined
  const options: Exclude<StyleId, 'clientserver'>[] = ['monolith', 'services', 'serverless']
  const bestId = options.find((o) => sc.verdict[o].tone === 'good')

  function choose(o: Exclude<StyleId, 'clientserver'>) {
    const next = { ...answers, [sc.id]: o }
    setAnswers(next)
    if (!fired.current && SCENARIOS.every((x) => next[x.id])) {
      fired.current = true
      onDone?.()
    }
  }

  return (
    <div className="stack">
      <div className="row" role="group" aria-label="Scenarios">
        {SCENARIOS.map((x, i) => (
          <button
            key={x.id}
            type="button"
            className="chip"
            aria-pressed={i === idx}
            onClick={() => setIdx(i)}
            style={{ padding: '6px 10px' }}
          >
            <span className="small">
              {x.emoji} {x.title} {answers[x.id] ? '✓' : ''}
            </span>
          </button>
        ))}
      </div>

      <div className="card tight flat stack sm pop" key={sc.id}>
        <div style={{ fontSize: 30 }} aria-hidden="true">
          {sc.emoji}
        </div>
        <b>{sc.title}</b>
        <p className="small ink2">{sc.detail}</p>
        <div className="kicker">How would you build the backend?</div>
        <div className="stack sm">
          {options.map((o) => {
            const v = sc.verdict[o]
            const isPicked = picked === o
            const reveal = !!picked
            return (
              <div key={o} className="stack sm">
                <button
                  type="button"
                  className={`chip ${isPicked ? (v.tone === 'bad' ? 'bad' : 'good') : reveal && o === bestId ? 'good' : ''}`}
                  onClick={() => choose(o)}
                >
                  {STYLES[o].emoji} {STYLES[o].name}
                  {reveal && o === bestId ? ' — best fit' : ''}
                </button>
                {reveal && (isPicked || o === bestId) && (
                  <div className={`callout ${v.tone} small`}>{v.text}</div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {picked && idx < SCENARIOS.length - 1 && (
        <button type="button" className="btn ink" onClick={() => setIdx(idx + 1)}>
          Next scenario →
        </button>
      )}
      {SCENARIOS.every((x) => answers[x.id]) && (
        <div className="callout info small pop">
          Pattern: start simple, and split things up only when a specific pain — team size, very uneven load — makes the
          extra complexity worth paying for.
        </div>
      )}
    </div>
  )
}
