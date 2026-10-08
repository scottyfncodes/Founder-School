# Authoring lessons — Software Founder School

Stack: Vite + React 19 + TypeScript, no router lib, no CSS framework. Everything is static and
offline-capable. Progress is in localStorage (`src/lib/store.ts`).

## The learner
A smart, curious founder who has shipped small apps with AI coding agents but has no CS training.
Learns by tapping, dragging, revealing, experimenting. Never make them feel stupid. Translate jargon.
Prefer "Here's what happens when you press this button" over textbook definitions.
**No long paragraphs.** Every text field should be 1–3 short sentences.

## Content model (`src/lib/types.ts`)
A `World` has `concepts` (id + name) and `lessons`. A `Lesson` is a list of `steps`:

| kind | purpose |
|---|---|
| `concept` | WHAT IS IT + WHY DOES IT EXIST (title, emoji, what, why) |
| `widget` | WHAT DOES IT LOOK LIKE / HOW DOES IT WORK — an interactive component. `render: ({done}) => <X onDone={done} />`. Call `done()` when the learner has done the key interaction (unlocks Continue). |
| `points` | compact term → 1–2 sentence explanations (use for vocab like rows/columns/PK/FK) |
| `care` | WHY SHOULD A FOUNDER CARE — 2–4 punchy bullets tied to real business decisions |
| `quiz` | tiny challenge. Exactly ONE option has `correct: true`. EVERY option has a `why` explaining why it is right/wrong (never just "Correct!"). `level`: 2 = Literate (can explain), 3 = Founder (can make a decision), 4 = Advanced (can discuss tradeoffs with an engineer). `concepts`: ids from the world's concept list. `id` globally unique: `<lessonId>-q1`. |

Every lesson: ≥1 concept step, ≥1 widget step (real interaction — no static diagrams), 2–4 quizzes
(mix levels; include at least one level-3 founder decision; advanced lessons get a level-4),
and a `care` step. 5–10 minutes each; vary lengths. Each lesson's `concepts` list must reference ids
defined in that world's `concepts`. Every world concept must be used by at least one lesson AND at
least one quiz. Lesson `unlocks` = architecture map box ids from `src/content/architecture.ts`
(only the lesson named in that box's `lesson` field should unlock it).

Look at `src/content/worlds/w01.tsx` → lesson `w1-machine` for the reference pattern.

## Reusable widgets (`src/widgets/`)
- `FlowSim` — animated message travelling node to node, with scenario buttons (incl. failures),
  a plain-English log, a "what the user sees" phone, and a result callout. Great for request
  flows, pipelines, DNS, deploys, outages.
- `Sorter` — put items in the right order (drag handle or ↑↓ buttons).
- `Matcher` — tap a term, tap its meaning.
- `Categorize` — tap item, tap bucket; wrong answers explain.
- `RevealCards` — tap cards to reveal.
- `StageExplorer` — vertical pipeline; tap each stage; optional "💥 What can go wrong here?".
- `ArchMap` (`src/components/ArchMap.tsx`) — the architecture diagram. In lessons pass `revealAll`
  and `only={[...ids]}` and `onExplored={(n) => n >= K && done()}`.
- `Quiz` (`src/components/Quiz.tsx`) — reusable inside custom widgets/sims if needed.

Build **bespoke widgets** for the signature simulations (in `src/widgets/<Name>.tsx`). They must:
- work entirely by touch (tap targets ≥ 44px), also keyboard (use real `<button>`s);
- fit 320px wide with NO horizontal page scroll (wide tables go in `.tbl-wrap`, which scrolls itself);
- use `wait()` from `src/lib/motion.ts` for timed animation (it respects prefers-reduced-motion);
- call `onDone` exactly when the learner has meaningfully interacted;
- have a working reset/"try again" where it makes sense. Every visible button must work.
- show cause → effect: "what the developer intended" → "what actually happened" → "the fix", etc.

## Design system (`src/index.css`) — use these classes, avoid new global CSS
Layout: `stack` (`.sm/.lg/.xl`), `row` (`.between/.nowrap`), `grid2`, `grid3`, `grow`, `center`.
Surfaces: `card` (`.tight/.flat`), `well`, `callout good|bad|warn|info`, `pill`, `divider`.
Text: `kicker`, `lead`, `muted`, `ink2`, `small`, `tiny`, `mono`, `code`, `good-text|bad-text|warn-text`.
Buttons: `btn` (+ `primary|ink|danger|ghost|small|block|icon`). Toggle chips: `chip` with
`aria-pressed`, or `.good/.bad`. Switch: `<button role="switch" aria-checked className="switch">`.
Diagrams: `node` (+ `active|ok|fail|warn|dim`, child `.emoji`), `link` (+`active|fail`) vertical
connector, `bubble` (`req|res|err`). Data: `tbl-wrap` > `table.tbl` (rows `.hl|.hl-good|.hl-bad|.clickable`),
`meter > span`, `stat > .v + .l`. Device mock: `phone > .screen`. Animations: `pop`, `pulse`.
Colors via CSS vars only (`var(--good)`, `var(--bad-soft)`, `var(--accent)` …) so dark mode works.
Helpers: `src/lib/util.ts` (`shuffle`, `money`, `num`, `pct`, `clamp`).

## Checks
`npx tsc -p tsconfig.app.json --noEmit` and `npx oxlint src` must be clean for your files.
`npx vitest run` validates content structure.

## Curriculum outline (lesson ids are fixed — other files link to them)
W1 How Software Works (`w01.tsx`, skill tech)
- `w1-machine` How does a web app actually work? — unlocks user, phone, browser, internet, frontend, api, backend, database (DONE, reference)
- `w1-front-back` Frontend vs. backend — what runs where; why rules live on the server
- `w1-code` What code actually is — languages, frameworks, libraries/packages, dependencies
- `w1-state` Where things live — memory vs. storage, device vs. server, why refresh loses unsaved work, caching basics
W2 The Web (`w02.tsx`, tech)
- `w2-request` Requests & responses — URLs, HTTP methods, status codes (200/401/403/404/500), HTTPS
- `w2-api` APIs: how apps talk — the "Load my contacts" sim; "Database unavailable"; "What should the app do?" (A crash / B error+retry / C pretend / D delete account)
- `w2-dns` Domains & DNS — unlocks dns; example.com → DNS → address → hosting → website; records; changing DNS ≠ changing the app; registrar ownership
- `w2-speed` Why apps feel fast or slow — latency, round trips, payload size, caching, CDN — unlocks cdn
W3 Data (`w03.tsx`, data)
- `w3-tables` Tables, rows & IDs — interactive mini database (CONTACTS, AIRCRAFT, NOTES, DOCUMENTS, USERS); rows, columns, IDs, primary keys
- `w3-relationships` Relationships — tap a contact → see related notes/documents; foreign keys; one-to-many, many-to-many
- `w3-queries` Queries & indexes — ask questions of data; an index makes search fast (visible speed demo)
- `w3-migrations` Migrations — changing the shape of live data safely; what goes wrong
- `w3-files` Files vs. data — unlocks storage; file storage buckets, the DB stores the pointer, public-bucket leaks
W4 Users + Authentication (`w04.tsx`, security)
- `w4-authn` Who are you? Authentication — unlocks auth; login, password hashing, 2FA, sessions in a simulated app
- `w4-authz` What can you do? Authorization — unlocks authz; Scott=ADMIN, Alex=USER; Alex tries ADMIN SETTINGS; then DISABLE authorization and watch the vulnerability. Make AUTHN="Who are you?" vs AUTHZ="What are you allowed to do?" unforgettable.
- `w4-sessions` Sessions, tokens & "Sign in with Google" — cookies, expiry, logout, OAuth/SSO, passkeys
- `w4-tenants` Keeping customers' data apart — multi-tenancy; "a customer says another user saw their data"
W5 Code + GitHub (`w05.tsx`, tech)
- `w5-git` Commits, branches & history — unlocks github
- `w5-pipeline` From code to live app — unlocks cicd; WORKING CODE→COMMIT→BRANCH→PULL REQUEST→CI TESTS→MERGE→DEPLOY→LIVE APP; click each stage; simulate tests fail, merge conflict, deploy fails, bad change reaches production (rollback)
- `w5-pr` Why pull requests exist — review, diffs, what to look for as a founder
- `w5-tests` What tests prove (and don't) — unit/integration/end-to-end; "all tests pass" ≠ safe
W6 Deployment + Cloud (`w06.tsx`, architecture)
- `w6-deploy` Press DEPLOY — unlocks hosting; MY LAPTOP→GITHUB→CI→BUILD→HOSTING→LIVE WEBSITE; then "Build failed" — inspect the logs and identify which stage failed
- `w6-environments` Environments & secrets — unlocks secrets; dev/staging/production; env vars; secrets never in code
- `w6-cloud-bill` What your cloud bill represents — compute, database, storage, bandwidth, third parties; usage sliders
- `w6-architecture` Monolith vs. services vs. serverless vs. client/server — tradeoffs (simplicity, cost, scalability, reliability, ops complexity, use cases); scenarios 50 / 10,000 / 10 million users
W7 Security (`w07.tsx`, security)
- `w7-lab-1` Attack lab I: accounts & keys — weak passwords, stolen sessions, missing authorization, exposed secrets
- `w7-lab-2` Attack lab II: inputs & limits — unlocks security; SQL injection, XSS, excessive permissions, no rate limiting
  (each vuln: "what the developer intended" → "what actually happened" → "the fix"; fictional sandbox, simulations, NOT real attack instructions)
- `w7-habits` Security habits that actually matter — MFA everywhere, least privilege, updates/dependencies, incident basics
W8 Reliability + Backups (`w08.tsx`, reliability)
- `w8-backups` Backups & the restore drill — unlocks backups; LIVE DB→NIGHTLY→OFFSITE→IMMUTABLE; 💥 DATABASE DESTROYED; learner performs a simulated restore; backup, restore, point-in-time recovery, retention, offsite, immutable, RPO/RTO, disaster recovery. "A backup that has never been restored is a theory."
- `w8-monitoring` Logs, monitoring & alerts — unlocks logging, monitoring
- `w8-incidents` When things break: incidents — triage, status page, communication, postmortems, rollbacks
W9 APIs + Integrations (`w09.tsx`, architecture)
- `w9-services` Your app is a team of services — unlocks email, push, thirdparty; toggle DATABASE, EMAIL, FILE STORAGE, PAYMENTS, AUTH, ANALYTICS, AI, SMS, PUSH; "EMAIL PROVIDER DOWN" — what happens?; dependencies, failure modes, fallbacks
- `w9-payments` Payments, webhooks & API keys — unlocks payments
- `w9-lockin` Limits, costs & lock-in — rate limits/API limits, usage pricing, vendor lock-in, fallback strategies
W10 AI Software Development (`w10.tsx`, ai)
- `w10-loop` The AI build loop — FOUNDER→SPECIFICATION→AI CODING AGENT→CODE→TESTS→PR→REVIEW→DEPLOYMENT→FOUNDER TESTING
- `w10-strengths` What AI is great at — and what it gets wrong
- `w10-specs` Specs: the founder's superpower — improve a vague spec interactively
- `w10-interrogate` Interrogating your AI agent — simulated chats: "I've implemented secure authentication." / "All tests pass." — learner picks the right follow-up questions and reviews claims; when to demand evidence
- `w10-ready` "It works" vs. production-ready
W11 Software Business (`w11.tsx`, business)
- `w11-revenue` MRR, ARR & ARPU — 100 customers × $10 vs 10 × $1,000
- `w11-unit-economics` CAC, LTV, churn & gross margin — sliders for PRICE, USERS, CHURN, INFRA COST, ACQUISITION COST; business changes live
- `w11-pricing` The pricing lab — $9/$29/$99/$199/$499 → customers, revenue, support burden, infra cost, profit; value-based pricing
- `w11-funnel` Conversion & retention — unlocks analytics; funnels, cohorts, retention curves
W12 Running a Software Company (`w12.tsx`, business; lessons may set `skill`)
- `w12-ownership` Who holds the keys? — accounts owned by one person's personal account; bus factor; access offboarding
- `w12-data-trust` Data ownership, privacy & trust — "who owns my data?", privacy, terms, compliance basics (GDPR, SOC 2 at a glance)
- `w12-scale` From 10 to 1,000 customers — support, on-call, process, hiring
- `w12-tech-debt` Technical debt — debt as a loan with interest
- `w12-due-diligence` When someone wants to buy you — technical due-diligence questions

Architecture box ids: user phone browser frontend internet dns cdn api backend auth authz database
storage backups email push thirdparty payments analytics github cicd hosting secrets logging monitoring security
