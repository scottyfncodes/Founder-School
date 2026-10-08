import type { Skill } from '../lib/types'

/* ============================================================
   FlightLog capstone — decisions, events and the numbers model.
   Pure data + pure functions; the page owns all UI state.
   ============================================================ */

export type DecisionKey =
  | 'scope'
  | 'market'
  | 'pricing'
  | 'build'
  | 'arch'
  | 'hosting'
  | 'db'
  | 'auth'
  | 'security'
  | 'apis'
  | 'backups'
  | 'dr'
  | 'cost'

export type Choices = Record<DecisionKey, string>

export interface Option {
  id: string
  label: string
  emoji: string
  tradeoff: string
  /** 0–1: how well this fits a brand-new company. */
  q: number
}

export interface Decision {
  key: DecisionKey
  title: string
  question: string
  skills: Skill[]
  lesson: string
  options: Option[]
}

export const DECISIONS: Decision[] = [
  {
    key: 'scope',
    title: 'Product scope',
    question: 'What do you build first?',
    skills: ['business', 'tech'],
    lesson: 'w10-specs',
    options: [
      { id: 'everything', emoji: '🧰', label: 'The full suite', tradeoff: 'Logbook, parts store, scheduling, invoicing. Impressive — and months before anyone can use it.', q: 0.2 },
      { id: 'core', emoji: '📒', label: 'Digital logbook + due-date reminders', tradeoff: 'Solves the painful part fast. Feels small; that’s the point.', q: 1 },
      { id: 'ai', emoji: '🤖', label: 'AI that reads photos of paper logbooks', tradeoff: 'Magical demo. Adds AI cost per scan and a vendor you depend on.', q: 0.55 },
    ],
  },
  {
    key: 'market',
    title: 'Target users',
    question: 'Who is FlightLog for, first?',
    skills: ['business'],
    lesson: 'w11-funnel',
    options: [
      { id: 'everyone', emoji: '🌍', label: 'Everyone in aviation', tradeoff: 'Huge market on paper. Fuzzy message that speaks to no one.', q: 0.3 },
      { id: 'owners', emoji: '🛩️', label: 'Owners of small aircraft', tradeoff: 'Clear, painful problem. Many buyers, each paying a little.', q: 1 },
      { id: 'shops', emoji: '🔧', label: 'Independent mechanics & small shops', tradeoff: 'Fewer customers, each worth more. They need multi-aircraft views.', q: 0.9 },
      { id: 'airlines', emoji: '🛫', label: 'Airlines', tradeoff: 'Big contracts — after 18-month sales cycles and heavy compliance.', q: 0.15 },
    ],
  },
  {
    key: 'pricing',
    title: 'Pricing',
    question: 'What do you charge?',
    skills: ['business'],
    lesson: 'w11-pricing',
    options: [
      { id: 'free', emoji: '🆓', label: 'Free, with ads', tradeoff: 'Easy signups. Ads earn pennies; you can’t afford support.', q: 0.15 },
      { id: 'p4', emoji: '🪙', label: '$4 / month', tradeoff: 'Low friction. Thin margins: one support email eats a year of profit.', q: 0.4 },
      { id: 'p29', emoji: '💳', label: '$29 / month per aircraft', tradeoff: 'Tiny next to a $3,000 inspection. Fits individual owners.', q: 1 },
      { id: 'p299', emoji: '💼', label: '$299 / month per shop', tradeoff: 'Great for shops managing many planes. Too much for one owner.', q: 1 },
    ],
  },
  {
    key: 'build',
    title: 'How you build',
    question: 'You build with an AI coding agent. How does code reach users?',
    skills: ['ai', 'tech'],
    lesson: 'w10-loop',
    options: [
      { id: 'yolo', emoji: '🚀', label: 'Agent pushes straight to production', tradeoff: 'Fastest possible. Nobody checks anything before customers see it.', q: 0.1 },
      { id: 'reviewed', emoji: '🔍', label: 'Agent opens PRs → CI tests → you review → deploy', tradeoff: 'A few minutes slower per change. Mistakes get caught before users do.', q: 1 },
      { id: 'manual', emoji: '✍️', label: 'Skip AI; hand-write it, no tests', tradeoff: 'You understand every line — but ship slowly and still miss bugs.', q: 0.5 },
    ],
  },
  {
    key: 'arch',
    title: 'Architecture',
    question: 'How is the app structured?',
    skills: ['architecture', 'tech'],
    lesson: 'w6-architecture',
    options: [
      { id: 'services', emoji: '🧩', label: 'Microservices from day one', tradeoff: 'Scales teams of 50. For one founder: 9 things to deploy and debug.', q: 0.2 },
      { id: 'serverless', emoji: '⚡', label: 'Serverless functions', tradeoff: 'Nearly free when quiet. Per-request pricing grows with traffic.', q: 0.65 },
      { id: 'monolith', emoji: '🏛️', label: 'One well-organized app (monolith)', tradeoff: 'Simple to build, deploy and debug. Can be split later if needed.', q: 1 },
    ],
  },
  {
    key: 'hosting',
    title: 'Hosting',
    question: 'Where does it run?',
    skills: ['architecture', 'reliability'],
    lesson: 'w6-deploy',
    options: [
      { id: 'paas', emoji: '☁️', label: 'Managed platform (PaaS)', tradeoff: 'Push code, it runs and scales. Costs a bit more per user.', q: 1 },
      { id: 'vps', emoji: '🖥️', label: 'One rented server you manage', tradeoff: 'Cheap and flexible. You are the ops team, at 3 a.m. too.', q: 0.55 },
      { id: 'k8s', emoji: '☸️', label: 'Kubernetes cluster', tradeoff: 'Industrial-strength. ~$450/month and real expertise before user #1.', q: 0.3 },
      { id: 'laptop', emoji: '💻', label: 'Your laptop, via a tunnel', tradeoff: 'Free! Until it sleeps, updates, or leaves the house.', q: 0 },
    ],
  },
  {
    key: 'db',
    title: 'Database',
    question: 'Where does the data live?',
    skills: ['data', 'architecture'],
    lesson: 'w3-tables',
    options: [
      { id: 'sheet', emoji: '📊', label: 'A spreadsheet service', tradeoff: 'Zero setup. Breaks with rate and row limits as you grow.', q: 0.25 },
      { id: 'managed', emoji: '🐘', label: 'Managed Postgres', tradeoff: 'Relational (aircraft → logs → parts), with failover and snapshots built in.', q: 1 },
      { id: 'selfhost', emoji: '🛠️', label: 'Database on your own server', tradeoff: 'Cheapest. Upgrades, disk space and failures are all yours.', q: 0.35 },
      { id: 'nosql', emoji: '📦', label: 'Hosted document store (NoSQL)', tradeoff: 'Flexible and quick to start. Linked data gets awkward later.', q: 0.6 },
    ],
  },
  {
    key: 'auth',
    title: 'Authentication',
    question: 'How do people log in?',
    skills: ['security'],
    lesson: 'w4-authn',
    options: [
      { id: 'own', emoji: '🔨', label: 'Build your own login', tradeoff: 'Full control. Hashing, resets, rate limits and MFA are all on you.', q: 0.2 },
      { id: 'provider', emoji: '🛡️', label: 'Proven auth provider (with MFA)', tradeoff: 'Battle-tested, a small monthly cost, and some lock-in.', q: 1 },
      { id: 'shared', emoji: '🔑', label: 'Simple logins + one shared admin password', tradeoff: 'Easy for your team. One leak opens every customer.', q: 0 },
    ],
  },
  {
    key: 'security',
    title: 'Security practices',
    question: 'How seriously, right now?',
    skills: ['security'],
    lesson: 'w7-habits',
    options: [
      { id: 'fast', emoji: '🏃', label: 'Ship fast, fix security later', tradeoff: 'No slowdown today. “Later” usually arrives as an incident.', q: 0.1 },
      { id: 'soc2', emoji: '📋', label: 'Full SOC 2 program now', tradeoff: 'Enterprise-grade. ~$1,200/month and weeks of paperwork pre-revenue.', q: 0.5 },
      { id: 'basics', emoji: '✅', label: 'Basics: MFA, secrets out of code, logs, updates', tradeoff: 'A few hours a month. Stops most real-world attacks.', q: 1 },
    ],
  },
  {
    key: 'apis',
    title: 'Third-party APIs',
    question: 'Reminders go out by email & SMS. How?',
    skills: ['architecture', 'reliability'],
    lesson: 'w9-services',
    options: [
      { id: 'single', emoji: '📮', label: 'One provider, send directly', tradeoff: 'Simple. If it’s down, reminders silently fail.', q: 0.6 },
      { id: 'diy', emoji: '🏗️', label: 'Run your own mail server', tradeoff: 'No vendor bill. Spam filters distrust new servers.', q: 0.15 },
      { id: 'fallback', emoji: '🔁', label: 'Provider + queue, retries & a backup provider', tradeoff: 'A day more work. Outages become delays, not lost messages.', q: 1 },
      { id: 'many', emoji: '🧲', label: 'A best-in-class API for everything', tradeoff: 'Maps, SMS, analytics, chat… each one another thing that breaks.', q: 0.3 },
    ],
  },
  {
    key: 'backups',
    title: 'Backups',
    question: 'What happens if data is lost?',
    skills: ['reliability', 'data'],
    lesson: 'w8-backups',
    options: [
      { id: 'none', emoji: '🙈', label: 'No backups yet', tradeoff: 'Free. One bad command away from losing everything.', q: 0 },
      { id: 'tested', emoji: '🧪', label: 'Nightly + offsite + tested restores', tradeoff: '~$20/month and an hour a quarter. You know restore works.', q: 1 },
      { id: 'nightly', emoji: '🌙', label: 'Nightly backups, never tested', tradeoff: 'Cheap comfort. A backup never restored is a theory.', q: 0.5 },
    ],
  },
  {
    key: 'dr',
    title: 'Disaster recovery',
    question: 'If things go badly wrong, who can fix it?',
    skills: ['reliability'],
    lesson: 'w12-ownership',
    options: [
      { id: 'none', emoji: '🤞', label: 'We’ll figure it out', tradeoff: 'No effort now. All knowledge lives in one head.', q: 0.1 },
      { id: 'doc', emoji: '📝', label: 'Written runbook, logins in your name', tradeoff: 'Good start. Accounts still tied to one person.', q: 0.55 },
      { id: 'drilled', emoji: '🧯', label: 'Runbook + company-owned accounts + a second admin + one drill', tradeoff: 'An afternoon to set up. Anyone can recover, calmly.', q: 1 },
    ],
  },
  {
    key: 'cost',
    title: 'Cost posture',
    question: 'How do you manage the cloud bill?',
    skills: ['business', 'architecture'],
    lesson: 'w6-cloud-bill',
    options: [
      { id: 'upfront', emoji: '🏦', label: 'Reserve big servers upfront “for scale”', tradeoff: '~$1,800/month before you have customers.', q: 0.15 },
      { id: 'alerts', emoji: '🔔', label: 'Pay as you grow + budget alerts', tradeoff: 'Lean, and you hear about surprises on day 2, not day 30.', q: 1 },
      { id: 'lean', emoji: '🪶', label: 'Pay as you grow, check the bill monthly', tradeoff: 'Lean. Surprises show up at month-end.', q: 0.6 },
    ],
  },
]

export const decisionByKey = (k: DecisionKey) => DECISIONS.find((d) => d.key === k)!
export const optionOf = (k: DecisionKey, id: string) => decisionByKey(k).options.find((o) => o.id === id)
export const labelOf = (k: DecisionKey, id: string) => optionOf(k, id)?.label ?? id

/** Pricing quality depends on who you sell to. */
const PRICE_FIT: Record<string, Record<string, number>> = {
  free: { owners: 0.15, shops: 0.15, everyone: 0.2, airlines: 0.1 },
  p4: { owners: 0.45, shops: 0.35, everyone: 0.4, airlines: 0.2 },
  p29: { owners: 1, shops: 0.7, everyone: 0.6, airlines: 0.3 },
  p299: { owners: 0.2, shops: 1, everyone: 0.2, airlines: 0.6 },
}

export function quality(k: DecisionKey, c: Choices): number {
  if (k === 'pricing') return PRICE_FIT[c.pricing]?.[c.market] ?? 0.5
  return optionOf(k, c[k])?.q ?? 0.5
}

/* ---------------- numbers ---------------- */

export const STAGES = [10, 100, 1000, 10000]
export const STAGE_NAMES = ['10', '100', '1,000', '10,000']

export interface Fx {
  trust?: number
  /** hours of downtime this stage */
  down?: number
  /** users multiplier */
  users?: number
  /** monthly bill change ($) */
  bill?: number
  team?: number
}

export interface Answer {
  skills: Skill[]
  q: number
  lesson: string
}

export interface Turn {
  eventId: string
  tone: Tone
  lines: string[]
}

export interface Sim {
  initial: Choices
  choices: Choices
  stage: number
  trust: number
  down: number[]
  userMult: number
  billAdd: number
  teamAdd: number
  answers: Answer[]
  turns: Turn[]
  upgrades: string[]
}

export function newSim(c: Choices): Sim {
  return {
    initial: { ...c },
    choices: { ...c },
    stage: 0,
    trust: 70,
    down: [0, 0, 0, 0],
    userMult: 1,
    billAdd: 0,
    teamAdd: 0,
    answers: [],
    turns: [],
    upgrades: [],
  }
}

export interface Stats {
  users: number
  mrr: number
  bill: number
  /** gross margin 0–1, null when there is no revenue */
  margin: number | null
  uptime: number
  team: number
  trust: number
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))

const SCOPE_G: Record<string, number> = { core: 1, ai: 0.9, everything: 0.7 }
const MARKET_G: Record<string, number> = { owners: 1, shops: 0.8, everyone: 0.6, airlines: 0.15 }
const PRICE: Record<string, number> = { free: 0, p4: 4, p29: 29, p299: 299 }
const PAID: Record<string, Record<string, number>> = {
  free: { owners: 0, shops: 0, everyone: 0, airlines: 0 },
  p4: { owners: 0.6, shops: 0.6, everyone: 0.5, airlines: 0.3 },
  p29: { owners: 0.45, shops: 0.5, everyone: 0.25, airlines: 0.3 },
  p299: { owners: 0.03, shops: 0.35, everyone: 0.02, airlines: 0.25 },
}

export function computeStats(sim: Sim): Stats {
  const c = sim.choices
  const s = sim.stage
  const trustF = clamp(0.55 + (0.45 * sim.trust) / 70, 0.6, 1.1)
  const users = Math.max(1, Math.round(STAGES[s] * (SCOPE_G[c.scope] ?? 1) * (MARKET_G[c.market] ?? 1) * sim.userMult * trustF))

  const mrr = users * (PAID[c.pricing]?.[c.market] ?? 0) * (PRICE[c.pricing] ?? 0) + (c.pricing === 'free' ? users * 0.1 : 0)

  // ---- cloud bill
  const host = { paas: [25, 0.12], vps: [12, 0.05], k8s: [450, 0.1], laptop: [0, 0] }[c.hosting] ?? [25, 0.1]
  const archMult = c.arch === 'services' ? 1.8 : c.arch === 'serverless' ? (s < 2 ? 0.5 : 1.5) : 1
  const archBase = c.arch === 'services' ? 180 : 0
  const db = { managed: [15, 0.03], selfhost: [0, 0.01], nosql: [10, 0.04], sheet: [0, 0.002] }[c.db] ?? [15, 0.03]
  let bill = (host[0] + host[1] * users) * archMult + archBase + db[0] + db[1] * users
  bill += { none: 0, nightly: 5 + 0.004 * users, tested: 20 + 0.01 * users }[c.backups] ?? 0
  bill += { fast: 0, basics: 10 + 0.005 * users, soc2: 1200 }[c.security] ?? 0
  bill += { single: 0.02 * users, fallback: 10 + 0.03 * users, diy: 40 + 0.01 * users, many: 30 + 0.12 * users }[c.apis] ?? 0
  if (c.auth === 'provider' && users > 1000) bill += 0.02 * users
  if (c.scope === 'ai') bill += 0.35 * users
  if (c.scope === 'everything') bill += 50 + 0.05 * users
  if (c.cost === 'upfront') bill += 1800
  bill += sim.billAdd
  bill = Math.round(bill)

  const margin = mrr > 0 ? (mrr - bill) / mrr : null

  // ---- uptime
  let up = { paas: 99.95, vps: 99.6, k8s: 99.8, laptop: s >= 2 ? 94 : 97.5 }[c.hosting] ?? 99.9
  if (c.arch === 'services') up -= 0.15
  if (c.db === 'selfhost') up -= 0.25
  if (c.db === 'sheet') up -= s >= 2 ? 2 : 0.1
  if (c.scope === 'everything') up -= 0.2
  if (c.build === 'yolo') up -= 0.1
  up -= (sim.down[s] / 720) * 100
  const uptime = clamp(up, 80, 99.99)

  let team = [1, 1, 3, 8][s]
  if (c.scope === 'everything' && s >= 1) team += 1
  if (c.arch === 'services' && s >= 2) team += 1
  if (c.security === 'soc2' && s >= 1) team += 1
  team = Math.max(1, team + sim.teamAdd)

  return { users, mrr: Math.round(mrr), bill, margin, uptime, team, trust: Math.round(sim.trust) }
}

export function applyFx(sim: Sim, fx: Fx): Sim {
  const down = sim.down.slice()
  down[sim.stage] = Math.max(0, down[sim.stage] + (fx.down ?? 0))
  return {
    ...sim,
    trust: clamp(sim.trust + (fx.trust ?? 0), 0, 100),
    down,
    userMult: sim.userMult * (fx.users ?? 1),
    billAdd: Math.max(0, sim.billAdd + (fx.bill ?? 0)),
    teamAdd: sim.teamAdd + (fx.team ?? 0),
  }
}

export function mergeFx(list: Fx[]): Fx {
  const out: Fx = {}
  for (const f of list) {
    if (f.trust) out.trust = (out.trust ?? 0) + f.trust
    if (f.down) out.down = (out.down ?? 0) + f.down
    if (f.users) out.users = (out.users ?? 1) * f.users
    if (f.bill) out.bill = (out.bill ?? 0) + f.bill
    if (f.team) out.team = (out.team ?? 0) + f.team
  }
  return out
}

/* ---------------- events ---------------- */

export type Tone = 'good' | 'warn' | 'bad'

export interface Line {
  key: DecisionKey
  /** Continues the sentence "Because you chose <label>, …" */
  text: string
  tone: Tone
  fx?: Fx
}

export interface Response {
  text: string
  why: string
  q: number
  fx?: Fx
}

export interface Upgrade {
  key: DecisionKey
  from: string[]
  to: string
  pitch: string
}

export interface EventDef {
  id: string
  stage: number
  emoji: string
  title: string
  skills: Skill[]
  lesson: string
  story: string
  lines: (c: Choices) => Line[]
  prompt: string
  responses: Response[]
  upgrades: Upgrade[]
}

export const worstTone = (lines: { tone: Tone }[]): Tone =>
  lines.some((l) => l.tone === 'bad') ? 'bad' : lines.some((l) => l.tone === 'warn') ? 'warn' : 'good'

export const EVENTS: EventDef[] = [
  {
    id: 'deploy',
    stage: 0,
    emoji: '🚧',
    title: 'Friday deploy breaks login',
    skills: ['ai', 'tech'],
    lesson: 'w5-pipeline',
    story: 'Friday, 5 p.m. A change to the login page goes out. Minutes later, nobody can sign in.',
    lines: (c) => [
      c.build === 'yolo'
        ? { key: 'build', tone: 'bad', text: 'the agent’s change went live with no tests or review. Everyone was locked out for 6 hours.', fx: { trust: -12, down: 6 } }
        : c.build === 'manual'
          ? { key: 'build', tone: 'warn', text: 'there were no automated tests. You spotted it after an hour and fixed it by hand.', fx: { trust: -4, down: 1 } }
          : { key: 'build', tone: 'good', text: 'CI tests failed on the pull request, so the broken change never shipped. Users saw nothing.', fx: { trust: 2 } },
    ],
    prompt: 'What’s the right next move?',
    responses: [
      { text: 'Roll back to the last working version, then fix it with a test', why: 'Rollback restores service in minutes; the new test stops it coming back.', q: 1, fx: { trust: 3 } },
      { text: 'Have the AI hotfix it directly in production', why: 'Rushed, unreviewed fixes are how one outage becomes two.', q: 0.25, fx: { down: 1 } },
      { text: 'Keep quiet and hope nobody noticed', why: 'Customers notice. Silence turns a bug into a trust problem.', q: 0, fx: { trust: -3 } },
      { text: 'Freeze all deploys for a month', why: 'Feels safe, but you stop improving. Small, tested deploys are safer than rare big ones.', q: 0.3 },
    ],
    upgrades: [{ key: 'build', from: ['yolo', 'manual'], to: 'reviewed', pitch: 'Add pull requests, CI tests and your review before every deploy.' }],
  },
  {
    id: 'db-outage',
    stage: 0,
    emoji: '🛑',
    title: 'The database goes dark',
    skills: ['reliability'],
    lesson: 'w8-incidents',
    story: '2:13 a.m. Your database stops responding. Every FlightLog screen shows a spinner.',
    lines: (c) => {
      const out: Line[] = []
      if (c.db === 'managed') out.push({ key: 'db', tone: 'good', text: 'your provider failed over to a standby copy in 4 minutes.', fx: { down: 0.1 } })
      else if (c.db === 'selfhost') out.push({ key: 'db', tone: 'bad', text: 'it shared a server with the app and the disk filled up. Down 9 hours, until you woke up.', fx: { down: 9, trust: -10 } })
      else if (c.db === 'nosql') out.push({ key: 'db', tone: 'warn', text: 'the hosted store had a regional blip. Down for an hour.', fx: { down: 1, trust: -3 } })
      else out.push({ key: 'db', tone: 'warn', text: 'the spreadsheet service rate-limited your app. Read-only for 3 hours.', fx: { down: 3, trust: -5 } })
      if (c.hosting === 'laptop') out.push({ key: 'hosting', tone: 'bad', text: 'your laptop had also gone to sleep. Add 5 more hours.', fx: { down: 5, trust: -4 } })
      return out
    },
    prompt: 'Users are emailing: “Is FlightLog down?” What do you do?',
    responses: [
      { text: 'Fix it quietly and say nothing', why: 'Fixing matters most, but silence makes users assume the worst.', q: 0.3, fx: { trust: -2 } },
      { text: 'Post a short, honest status update with an ETA', why: 'Fast, honest updates keep trust even mid-outage.', q: 1, fx: { trust: 4 } },
      { text: 'Blame your cloud provider publicly', why: 'Customers chose you, not your provider. Own it.', q: 0.05, fx: { trust: -5 } },
      { text: 'Promise everyone a free year', why: 'Generous, but costly — and it doesn’t answer “when is it back?”', q: 0.4, fx: { trust: 1 } },
    ],
    upgrades: [
      { key: 'backups', from: ['none', 'nightly'], to: 'tested', pitch: 'That was a scare. Set up nightly, offsite backups and test a restore.' },
      { key: 'db', from: ['selfhost', 'sheet'], to: 'managed', pitch: 'Move to managed Postgres with automatic failover.' },
    ],
  },
  {
    id: 'api-outage',
    stage: 1,
    emoji: '📭',
    title: 'Your SMS & email provider is down',
    skills: ['tech', 'architecture'],
    lesson: 'w9-services',
    story: 'A provider outage lasts 5 hours. “Annual inspection due” reminders are stuck.',
    lines: (c) => [
      c.apis === 'fallback'
        ? { key: 'apis', tone: 'good', text: 'reminders were queued, retried, and sent via the backup provider. Nobody missed a date.', fx: { trust: 2 } }
        : c.apis === 'single'
          ? { key: 'apis', tone: 'warn', text: 'reminders failed silently. 4 owners missed a due-date notice.', fx: { trust: -6 } }
          : c.apis === 'diy'
            ? { key: 'apis', tone: 'bad', text: 'it turns out your own mail server was on spam blacklists. Reminders had been landing in junk for weeks.', fx: { trust: -12, users: 0.95 } }
            : { key: 'apis', tone: 'warn', text: 'five vendors meant five things that can fail. SMS and the maps widget both broke.', fx: { trust: -6, down: 1 } },
    ],
    prompt: 'Some reminders didn’t go out. What now?',
    responses: [
      { text: 'Switch providers tonight, in a rush', why: 'Rushed migrations create new bugs. Close the gap first; plan any switch calmly.', q: 0.35 },
      { text: 'Nothing — it was the provider’s fault', why: 'To customers, FlightLog failed. Your dependencies are your responsibility.', q: 0.05, fx: { trust: -4 } },
      { text: 'Re-send what failed and tell affected owners plainly', why: 'Fix the customer impact, then explain. That’s what earns trust back.', q: 1, fx: { trust: 4 } },
      { text: 'Build your own SMS gateway so it never happens again', why: 'Huge effort and worse delivery. Use providers — add a fallback.', q: 0.15 },
    ],
    upgrades: [{ key: 'apis', from: ['single', 'diy', 'many'], to: 'fallback', pitch: 'Add a queue with retries and a backup provider.' }],
  },
  {
    id: 'account',
    stage: 1,
    emoji: '🕵️',
    title: 'Accounts under attack',
    skills: ['security'],
    lesson: 'w7-lab-1',
    story: 'An attacker tries thousands of passwords leaked from another website against FlightLog.',
    lines: (c) => {
      const out: Line[] = []
      if (c.auth === 'provider') out.push({ key: 'auth', tone: 'good', text: 'the provider spotted the attack, rate-limited it and demanded MFA. Zero accounts taken.', fx: { trust: 2 } })
      else if (c.auth === 'own') out.push({ key: 'auth', tone: 'bad', text: 'your login had no rate limit or breach checks. 12 accounts were taken over.', fx: { trust: -16, users: 0.95 } })
      else out.push({ key: 'auth', tone: 'bad', text: 'the shared admin password was reused elsewhere. The attacker got admin access to every customer.', fx: { trust: -25, users: 0.9 } })
      if (c.auth !== 'provider') {
        if (c.security === 'fast') out.push({ key: 'security', tone: 'bad', text: 'nothing alerted you. You heard from a customer two days later.', fx: { trust: -4 } })
        else if (c.security === 'basics') out.push({ key: 'security', tone: 'good', text: 'login logs showed exactly which accounts were hit.', fx: { trust: 2 } })
        else out.push({ key: 'security', tone: 'good', text: 'monitoring alerted you within minutes.', fx: { trust: 3 } })
      }
      return out
    },
    prompt: 'Accounts were attacked. Your move?',
    responses: [
      { text: 'Reset passwords quietly', why: 'Better than nothing, but affected customers deserve to know.', q: 0.25, fx: { trust: -3 } },
      { text: 'Take FlightLog offline for a week to rebuild login', why: 'An overreaction: a week dark hurts every customer. Contain, then fix.', q: 0.3, fx: { down: 12 } },
      { text: 'Delete the affected accounts', why: 'That destroys customers’ records and punishes the victims.', q: 0, fx: { trust: -8 } },
      { text: 'Lock affected accounts, force resets, tell those customers what happened', why: 'Contain, fix, communicate — the incident playbook in one line.', q: 1, fx: { trust: 5 } },
    ],
    upgrades: [
      { key: 'auth', from: ['own', 'shared'], to: 'provider', pitch: 'Switch to a proven auth provider with MFA.' },
      { key: 'security', from: ['fast'], to: 'basics', pitch: 'Adopt the basics: MFA, secrets out of code, logs, updates.' },
    ],
  },
  {
    id: 'spike',
    stage: 2,
    emoji: '📈',
    title: 'You went viral',
    skills: ['architecture'],
    lesson: 'w6-architecture',
    story: 'An aviation YouTuber with 400k subscribers features FlightLog. Signups jump 20× overnight.',
    lines: (c) => {
      const out: Line[] = []
      if (c.hosting === 'laptop') out.push({ key: 'hosting', tone: 'bad', text: 'your laptop couldn’t cope. Down for most of two days.', fx: { down: 40, trust: -15, users: 0.85 } })
      else if (c.hosting === 'vps') out.push({ key: 'hosting', tone: 'warn', text: 'your single server maxed out. Slow for 6 hours while you resized it.', fx: { down: 3, users: 1.08 } })
      else if (c.hosting === 'k8s') out.push({ key: 'hosting', tone: 'good', text: 'autoscaling worked — and the bill jumped with it.', fx: { users: 1.2, bill: 300 } })
      else out.push({ key: 'hosting', tone: 'good', text: 'the platform added more copies of your app automatically.', fx: { users: 1.2 } })
      if (c.db === 'sheet') out.push({ key: 'db', tone: 'bad', text: 'the spreadsheet hit its limits. Signups failed for 12 hours.', fx: { down: 12, trust: -8 } })
      if (c.db === 'selfhost') out.push({ key: 'db', tone: 'warn', text: 'your database needed an emergency upgrade at 3 a.m.', fx: { down: 2 } })
      if (c.arch === 'services') out.push({ key: 'arch', tone: 'warn', text: 'one service scaled but the one it calls didn’t. Cascading timeouts for 4 hours.', fx: { down: 4, trust: -4 } })
      if (c.arch === 'serverless') out.push({ key: 'arch', tone: 'good', text: 'functions scaled instantly — with per-request costs to match.', fx: { bill: 200 } })
      if (c.arch === 'monolith' && c.hosting !== 'laptop') out.push({ key: 'arch', tone: 'good', text: 'there was one app to scale and one place to look.' })
      return out
    },
    prompt: 'Signups are pouring in. What first?',
    responses: [
      { text: 'Rewrite everything into microservices this weekend', why: 'A rewrite mid-spike is the riskiest move available.', q: 0.1, fx: { down: 3 } },
      { text: 'Buy the biggest server tier without checking what’s slow', why: 'Might help, but you’re paying to avoid looking. Measure first.', q: 0.45, fx: { bill: 500 } },
      { text: 'Watch error rates, pause side projects, welcome new users', why: 'Stability first, then delight the newcomers. This is how spikes become growth.', q: 1, fx: { trust: 3, users: 1.05 } },
      { text: 'Close signups for good', why: 'You lose the moment. A temporary waitlist can be fine; closing isn’t.', q: 0.2, fx: { users: 0.9 } },
    ],
    upgrades: [
      { key: 'hosting', from: ['laptop', 'vps'], to: 'paas', pitch: 'Move to a managed platform that scales for you.' },
      { key: 'db', from: ['sheet', 'selfhost'], to: 'managed', pitch: 'Migrate to managed Postgres.' },
    ],
  },
  {
    id: 'restore',
    stage: 2,
    emoji: '🗑️',
    title: 'A migration deletes real data',
    skills: ['data', 'ai', 'reliability'],
    lesson: 'w8-backups',
    story: 'Your AI agent writes a migration to “clean up old fields.” In production, it wipes every aircraft’s inspection history.',
    lines: (c) => {
      const out: Line[] = []
      if (c.backups === 'tested') out.push({ key: 'backups', tone: 'good', text: 'you restored to 5 minutes before the mistake in 40 minutes. Nothing lost.', fx: { down: 0.7 } })
      else if (c.backups === 'nightly') out.push({ key: 'backups', tone: 'warn', text: 'last night’s backup worked, but today’s entries were lost and your first-ever restore took 6 hours.', fx: { down: 6, trust: -8 } })
      else if (c.db === 'managed') {
        out.push({ key: 'backups', tone: 'warn', text: 'you had no backups of your own. 10 hours of panic followed.', fx: { down: 10, trust: -12 } })
        out.push({ key: 'db', tone: 'good', text: 'its automatic 7-day snapshots saved you anyway. Lucky.' })
      } else out.push({ key: 'backups', tone: 'bad', text: 'there was nothing to restore. Customers’ maintenance history is gone; some rebuild it from paper.', fx: { down: 4, trust: -35, users: 0.75 } })
      if (c.dr === 'drilled') out.push({ key: 'dr', tone: 'good', text: 'the practiced runbook kept everyone calm.', fx: { trust: 3 } })
      return out
    },
    prompt: 'What changes for next time?',
    responses: [
      { text: 'Stop using AI for code entirely', why: 'Humans write bad migrations too. The fix is process, not banning a tool.', q: 0.3 },
      { text: 'Trust the agent more — it said the migration was safe', why: 'An agent saying “safe” is a claim, not evidence. Demand a test on real-shaped data.', q: 0 },
      { text: 'Fire whoever ran it', why: 'Blame hides problems. Blameless postmortems fix the system.', q: 0.1, fx: { trust: -2, team: -1 } },
      { text: 'Review migrations, test them on a copy of production, back up right before', why: 'Three cheap habits that make this mistake boring instead of fatal.', q: 1, fx: { trust: 3 } },
    ],
    upgrades: [
      { key: 'backups', from: ['none', 'nightly'], to: 'tested', pitch: 'Set up nightly, offsite backups with a tested restore.' },
      { key: 'dr', from: ['none', 'doc'], to: 'drilled', pitch: 'Company-owned accounts, a second admin, and a restore drill.' },
    ],
  },
  {
    id: 'bill',
    stage: 3,
    emoji: '🧾',
    title: 'The cloud bill triples',
    skills: ['business'],
    lesson: 'w6-cloud-bill',
    story: 'A background job has been reprocessing every logbook photo, every hour. The bill is 3× last month.',
    lines: (c) => {
      const out: Line[] = []
      if (c.cost === 'alerts') out.push({ key: 'cost', tone: 'good', text: 'a budget alert fired on day 2 and you stopped the job early.', fx: { bill: 150 } })
      else if (c.cost === 'lean') out.push({ key: 'cost', tone: 'warn', text: 'nothing alerted you. You found out at month-end.', fx: { bill: 2500 } })
      else out.push({ key: 'cost', tone: 'bad', text: 'you were already paying for idle reserved servers — the spike landed on top.', fx: { bill: 2500 } })
      if (c.arch === 'services') out.push({ key: 'arch', tone: 'warn', text: 'chatty services added data-transfer fees.', fx: { bill: 600 } })
      if (c.arch === 'serverless') out.push({ key: 'arch', tone: 'warn', text: 'at this volume, per-request pricing costs more than servers would.', fx: { bill: 800 } })
      if (c.scope === 'ai') out.push({ key: 'scope', tone: 'warn', text: 'AI photo scans are now your biggest cost line.' })
      return out
    },
    prompt: 'How do you get the bill under control?',
    responses: [
      { text: 'Triple prices tomorrow', why: 'Punishes customers for your bug. Some will leave.', q: 0.2, fx: { users: 0.85, trust: -6 } },
      { text: 'Find the top cost lines, fix the biggest, set budget alerts', why: 'Most bills are dominated by 2–3 lines. Fix those, then watch.', q: 1, fx: { bill: -2400 } },
      { text: 'Move to a different cloud this month', why: 'A big, risky migration that doesn’t fix the runaway job.', q: 0.2, fx: { down: 4 } },
      { text: 'Ignore it — growth will fix margins', why: 'Costs that grow with usage don’t shrink with growth.', q: 0.05 },
    ],
    upgrades: [{ key: 'cost', from: ['lean', 'upfront'], to: 'alerts', pitch: 'Switch to pay-as-you-grow with budget alerts.' }],
  },
  {
    id: 'breach',
    stage: 3,
    emoji: '🔓',
    title: 'A researcher finds a hole',
    skills: ['security', 'data'],
    lesson: 'w4-authz',
    story: 'An email: “Change the number in /api/aircraft/1042 and you can see another customer’s records.”',
    lines: (c) => {
      const out: Line[] = []
      if (c.security === 'soc2') out.push({ key: 'security', tone: 'good', text: 'audit logs proved nobody else used it. Customers were impressed.', fx: { trust: 2 } })
      else if (c.security === 'basics') out.push({ key: 'security', tone: 'good', text: 'access logs showed only the researcher used it. Fixed the same day.', fx: { trust: -2 } })
      else out.push({ key: 'security', tone: 'bad', text: 'there were no access logs, so you can’t tell who saw what. Every customer must be notified.', fx: { trust: -22, users: 0.9 } })
      if (c.build === 'yolo') out.push({ key: 'build', tone: 'bad', text: 'the endpoint was AI-written and never reviewed.', fx: { trust: -4 } })
      if (c.build === 'reviewed') out.push({ key: 'build', tone: 'good', text: 'adding a test for it took minutes, so it can’t come back.' })
      return out
    },
    prompt: 'What’s your first move?',
    responses: [
      { text: 'Thank them, patch, check logs for abuse, notify anyone affected', why: 'Researchers who report quietly are allies. Fix, verify, be honest.', q: 1, fx: { trust: 5 } },
      { text: 'Threaten the researcher with lawyers', why: 'It scares off the people helping you — and it makes headlines.', q: 0, fx: { trust: -10 } },
      { text: 'Patch quietly and tell no one', why: 'Patching is right. Hiding exposure can be illegal and backfires when found.', q: 0.3, fx: { trust: -2 } },
      { text: 'Turn off the API for good', why: 'Breaks your own app and integrations. Fix the missing permission check instead.', q: 0.2, fx: { users: 0.9 } },
    ],
    upgrades: [
      { key: 'security', from: ['fast'], to: 'basics', pitch: 'Adopt the basics: MFA, secrets out of code, logs, updates.' },
      { key: 'build', from: ['yolo', 'manual'], to: 'reviewed', pitch: 'Require PRs, CI tests and review for every change.' },
    ],
  },
  {
    id: 'departure',
    stage: 3,
    emoji: '👋',
    title: 'Your first engineer resigns',
    skills: ['business', 'reliability'],
    lesson: 'w12-ownership',
    story: 'Jordan — who set up the servers and knows where everything is — is leaving for a big-tech job.',
    lines: (c) => {
      const out: Line[] = []
      if (c.dr === 'drilled') out.push({ key: 'dr', tone: 'good', text: 'accounts were company-owned and the runbook was practiced. Handoff took an afternoon.', fx: { team: -1 } })
      else if (c.dr === 'doc') out.push({ key: 'dr', tone: 'warn', text: 'the runbook helped, but the domain and cloud logins were in Jordan’s name. Two weeks of chasing.', fx: { team: -1, trust: -3, down: 2 } })
      else out.push({ key: 'dr', tone: 'bad', text: 'only Jordan knew how to deploy, and the cloud account used their personal email. Weeks of scrambling.', fx: { team: -1, trust: -8, down: 8 } })
      if (c.arch === 'services') out.push({ key: 'arch', tone: 'warn', text: 'nobody else understood the nine services.', fx: { down: 3 } })
      if (c.arch === 'monolith') out.push({ key: 'arch', tone: 'good', text: 'a new hire only has one codebase to learn.' })
      return out
    },
    prompt: 'Jordan gives two weeks’ notice. Use them how?',
    responses: [
      { text: 'Counter-offer anything; change nothing else', why: 'Keeps Jordan for now. The single point of failure stays.', q: 0.3, fx: { team: 1 } },
      { text: 'Ask an AI to document the system after Jordan leaves', why: 'AI can read code — not the passwords and know-how in Jordan’s head.', q: 0.3 },
      { text: 'Pair on a handoff: move accounts to the company, write deploy & restore steps, revoke access when they go', why: 'Turns one person’s memory into company knowledge. Revoking access is part of offboarding.', q: 1, fx: { trust: 2 } },
      { text: 'Throw a nice farewell and wish them well', why: 'Kind, but their access and knowledge walk out the door.', q: 0.15 },
    ],
    upgrades: [{ key: 'dr', from: ['none', 'doc'], to: 'drilled', pitch: 'Company-owned accounts, a second admin, and a recovery drill.' }],
  },
]

export const eventsInStage = (s: number) => EVENTS.filter((e) => e.stage === s)

/* ---------------- scoring ---------------- */

export function simScores(sim: Sim): Record<Skill, number> {
  const items: Record<string, number[]> = {}
  const add = (skills: Skill[], q: number) => skills.forEach((s) => (items[s] ??= []).push(q))
  for (const d of DECISIONS) add(d.skills, quality(d.key, sim.initial))
  for (const a of sim.answers) add(a.skills, a.q)
  const out = {} as Record<Skill, number>
  for (const s of ['tech', 'data', 'security', 'architecture', 'reliability', 'ai', 'business'] as Skill[]) {
    const list = items[s] ?? []
    out[s] = list.length ? Math.round((list.reduce((a, b) => a + b, 0) / list.length) * 100) : 0
  }
  return out
}

/** Lessons to revisit for each skill, strongest recommendation first. */
export const SKILL_LESSONS: Record<Skill, string[]> = {
  tech: ['w1-machine', 'w1-front-back', 'w2-api'],
  data: ['w3-tables', 'w3-migrations', 'w8-backups'],
  security: ['w4-authn', 'w4-authz', 'w7-habits'],
  architecture: ['w6-architecture', 'w9-services', 'w6-cloud-bill'],
  reliability: ['w8-backups', 'w8-incidents', 'w8-monitoring'],
  ai: ['w10-loop', 'w10-interrogate', 'w10-ready'],
  business: ['w11-pricing', 'w11-unit-economics', 'w12-ownership'],
}

/** Fallback titles (from the curriculum outline) in case a lesson isn't loaded. */
export const LESSON_TITLES: Record<string, string> = {
  'w1-machine': 'How does a web app actually work?',
  'w1-front-back': 'Frontend vs. backend',
  'w2-api': 'APIs: how apps talk',
  'w3-tables': 'Tables, rows & IDs',
  'w3-migrations': 'Migrations',
  'w4-authn': 'Who are you? Authentication',
  'w4-authz': 'What can you do? Authorization',
  'w5-pipeline': 'From code to live app',
  'w6-deploy': 'Press DEPLOY',
  'w6-cloud-bill': 'What your cloud bill represents',
  'w6-architecture': 'Monolith vs. services vs. serverless',
  'w7-lab-1': 'Attack lab I: accounts & keys',
  'w7-habits': 'Security habits that actually matter',
  'w8-backups': 'Backups & the restore drill',
  'w8-monitoring': 'Logs, monitoring & alerts',
  'w8-incidents': 'When things break: incidents',
  'w9-services': 'Your app is a team of services',
  'w10-loop': 'The AI build loop',
  'w10-specs': 'Specs: the founder’s superpower',
  'w10-interrogate': 'Interrogating your AI agent',
  'w10-ready': '“It works” vs. production-ready',
  'w11-pricing': 'The pricing lab',
  'w11-unit-economics': 'CAC, LTV, churn & gross margin',
  'w11-funnel': 'Conversion & retention',
  'w12-ownership': 'Who holds the keys?',
}
