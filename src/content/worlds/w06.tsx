import type { World } from '../../lib/types'
import { DeployConsole } from '../../widgets/DeployConsole'
import { EnvSwitcher, SecretHunt } from '../../widgets/EnvLab'
import { CloudBill } from '../../widgets/CloudBill'
import { ArchCompare, ArchScenarios } from '../../widgets/ArchChooser'

const world: World = {
  id: 'w6',
  num: 6,
  title: 'Deployment + Cloud',
  tagline: 'Hosting, secrets, cloud bills and architecture.',
  emoji: '☁️',
  color: '#e8590c',
  skill: 'architecture',
  concepts: [
    { id: 'deployment', name: 'Deployment' },
    { id: 'build-step', name: 'The build' },
    { id: 'hosting-platform', name: 'Hosting' },
    { id: 'environments', name: 'Environments (dev, staging, production)' },
    { id: 'secrets-mgmt', name: 'Secrets & environment variables' },
    { id: 'cloud-costs', name: 'Cloud costs' },
    { id: 'arch-styles', name: 'Architecture styles' },
    { id: 'scale-tradeoffs', name: 'Scaling tradeoffs' },
  ],
  lessons: [
    // ------------------------------------------------------------------ w6-deploy
    {
      id: 'w6-deploy',
      title: 'Press DEPLOY',
      subtitle: 'From your laptop to the live website — and reading the logs when it fails.',
      minutes: 8,
      concepts: ['deployment', 'build-step', 'hosting-platform'],
      unlocks: ['hosting'],
      steps: [
        {
          kind: 'concept',
          emoji: '🚀',
          title: 'Deploying: getting code onto the live website',
          what: 'A deploy takes the code in GitHub, checks it, builds it into something runnable, and swaps it onto the hosting servers your customers use.',
          why: 'Code on a laptop helps nobody. Deploys should be automatic and boring, so shipping is safe enough to do every day.',
        },
        {
          kind: 'widget',
          title: 'Your deploy console',
          instruction: 'Press DEPLOY. Then run the next two deploys, read the logs, and find where — and why — each one failed.',
          render: ({ done }) => <DeployConsole onDone={done} />,
        },
        {
          kind: 'points',
          title: 'The stages, decoded',
          points: [
            { term: '🏗️ Build', text: 'Turns your source code into the files that actually run: installs packages, bundles, compresses.' },
            { term: '🏠 Hosting', text: 'The rented computers that run your app, from platforms like Vercel, Render, Fly or AWS.' },
            { term: '💓 Health check', text: 'The host pings the new version before sending it customers. Not healthy → the old version stays.' },
            { term: '📜 Deploy log', text: 'A line-by-line diary of the deploy. The first red line is usually the real cause.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w6-deploy-q1',
          prompt: 'A deploy fails at the build stage. What do customers see?',
          level: 2,
          concepts: ['build-step', 'deployment'],
          options: [
            { text: 'An error page until it’s fixed', why: 'A failed build never produces a new version, so there’s nothing new to show. The old version keeps running.' },
            { text: 'The previous version, working as before', correct: true, why: 'The build happens before anything touches the servers. Customers don’t notice a failed build at all.' },
            { text: 'A half-built version of the new feature', why: 'Builds are all-or-nothing. Either the whole thing builds, or nothing is deployed.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w6-deploy-q2',
          context: 'Your AI agent: “It works perfectly on my machine, but the deploy keeps failing.”',
          prompt: 'What’s the most useful thing to ask for?',
          level: 3,
          concepts: ['deployment', 'hosting-platform', 'build-step'],
          options: [
            { text: '“Try deploying again — maybe it was a glitch.”', why: 'If it fails the same way twice, it’s not a glitch. Retrying wastes time.' },
            { text: '“Paste the first error line from the deploy log and tell me which stage it’s in.”', correct: true, why: 'The log says exactly what failed. “Works on my machine” usually means the laptop has a package or setting the clean server doesn’t.' },
            { text: '“Switch hosting providers.”', why: 'The same missing package or setting would fail on any provider. Diagnose before you move.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w6-deploy-q3',
          context: 'You’re a two-person team. One option: a managed platform (push to GitHub → it builds and hosts). Another: rent raw cloud servers and set everything up yourselves.',
          prompt: 'Which makes sense now?',
          level: 3,
          concepts: ['hosting-platform', 'deployment'],
          options: [
            { text: 'Raw servers — they’re cheaper per hour', why: 'The hourly price is lower, but you pay in engineering time: security updates, deploy scripts, scaling, 3am restarts.' },
            { text: 'The managed platform — automatic deploys, rollbacks and scaling, so your time goes into the product', correct: true, why: 'For small teams, engineering hours are the scarcest resource. Revisit when the bill is big enough to justify a dedicated person.' },
            { text: 'A server in the office', why: 'One power cut or broken router takes your company offline. Cloud hosting exists so you don’t have to run a data centre.' },
          ],
        },
        {
          kind: 'care',
          points: [
            'If deploying is scary or manual, you’ll ship less often and in bigger, riskier chunks. Make it a button.',
            'You should be able to see your deploy logs and do a rollback yourself — not only through one engineer.',
            'Hosting is usually the biggest line of your cloud bill. Know which provider, which plan, and who has the login.',
          ],
        },
      ],
    },

    // ------------------------------------------------------------------ w6-environments
    {
      id: 'w6-environments',
      title: 'Environments & secrets',
      subtitle: 'Same code, different consequences. And the key that should never be in it.',
      minutes: 7,
      concepts: ['environments', 'secrets-mgmt'],
      unlocks: ['secrets'],
      steps: [
        {
          kind: 'concept',
          emoji: '🎭',
          title: 'Rehearsal, dress rehearsal, opening night',
          what: 'Most apps run in several environments: development (a laptop), staging (a private copy of the real thing) and production (what customers use). Same code, different settings and data.',
          why: 'You need somewhere to break things that isn’t in front of paying customers — and a final check that matches reality closely.',
        },
        {
          kind: 'widget',
          title: 'Same button, three worlds',
          instruction: 'Switch between environments and press the email button in each one.',
          render: ({ done }) => <EnvSwitcher onDone={done} />,
        },
        {
          kind: 'concept',
          emoji: '🔐',
          title: 'Secrets live outside the code',
          what: 'Secrets are passwords and API keys your app needs: the database password, the payments key. They’re stored as environment variables in the hosting platform, never written in the code.',
          why: 'Code gets copied everywhere: laptops, GitHub, AI tools, contractors. Anything in the code should be considered public eventually.',
        },
        {
          kind: 'widget',
          title: 'Spot the secret',
          instruction: 'Tap every line that contains a real secret. Watch out for one that only looks like one.',
          render: ({ done }) => <SecretHunt onDone={done} />,
        },
        {
          kind: 'quiz',
          id: 'w6-environments-q1',
          prompt: 'Why have a staging environment if you already test on your laptop?',
          level: 2,
          concepts: ['environments'],
          options: [
            { text: 'To make deploys take longer, for safety', why: 'Slowness isn’t the goal. Realism is.' },
            { text: 'Because it matches production closely — real settings, real services — without real customers', correct: true, why: 'Laptops differ from servers in a hundred small ways. Staging catches “works on my machine” before customers do.' },
            { text: 'So customers can try features early', why: 'That’s a beta or feature flag. Staging is for your team, not customers.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w6-environments-q2',
          context: 'A contractor pasted your live payments key into a public GitHub issue an hour ago, then deleted the comment.',
          prompt: 'What now?',
          level: 3,
          concepts: ['secrets-mgmt'],
          options: [
            { text: 'Nothing — the comment is deleted', why: 'Bots scan GitHub for keys within seconds. Deleting it doesn’t unlearn it from anyone who already copied it.' },
            { text: 'Rotate the key immediately: issue a new one, revoke the old one, update the hosting settings', correct: true, why: 'Once a secret has been visible, treat it as stolen. Rotation makes the leaked copy useless, and takes minutes.' },
            { text: 'Make the repository private', why: 'Good hygiene, but the key has already been seen. Only revoking it stops its use.' },
            { text: 'Ask the contractor to be more careful', why: 'Worth saying — after the key is rotated. The key is the emergency.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w6-environments-q3',
          context: 'Your engineer wants to copy the production database into staging every night, “so testing is realistic”.',
          prompt: 'What’s the best answer?',
          level: 4,
          concepts: ['environments', 'secrets-mgmt'],
          options: [
            { text: 'Great idea — the more real the better', why: 'Staging usually has weaker security and more people with access. Real customer data there is a leak waiting to happen, and may break privacy promises.' },
            { text: 'Copy the shape and volume, but scramble names, emails and payment details first', correct: true, why: 'Realistic size and structure catch the bugs; anonymized contents protect customers. You get most of the benefit with little of the risk.' },
            { text: 'Never use realistic data — 10 fake rows is enough', why: 'Tiny fake datasets miss real problems: slow queries at scale, odd characters in names, missing fields.' },
          ],
        },
        {
          kind: 'care',
          points: [
            'Every “oops, that was production” story starts with environments that look too alike. Make production obviously different.',
            'Never paste secrets into code, chats, screenshots or AI prompts. If one leaks, rotate it — today.',
            'Know where your secrets live and who can read them. It’s a short list, and it should stay short.',
          ],
        },
      ],
    },

    // ------------------------------------------------------------------ w6-cloud-bill
    {
      id: 'w6-cloud-bill',
      title: 'What your cloud bill represents',
      subtitle: 'Drag the usage sliders and watch each line move.',
      minutes: 6,
      concepts: ['cloud-costs'],
      steps: [
        {
          kind: 'concept',
          emoji: '🧾',
          title: 'A cloud bill is a usage meter',
          what: 'Each line on a cloud bill is something you rent: servers, a database, storage, data transfer, and third-party services like email and AI — mostly priced by how much you use.',
          why: 'You don’t buy hardware up front, so it’s cheap to start. But costs grow with success — and with mistakes — automatically.',
        },
        {
          kind: 'widget',
          title: 'Your app’s monthly bill',
          instruction: 'Try the presets and sliders. Tap bill lines to see what each one represents.',
          render: ({ done }) => <CloudBill onDone={done} />,
        },
        {
          kind: 'quiz',
          id: 'w6-cloud-bill-q1',
          context: 'Your cloud bill jumped from $400 to $6,000 this month. Active users barely changed.',
          prompt: 'What’s the most likely kind of cause?',
          level: 3,
          concepts: ['cloud-costs'],
          options: [
            { text: 'Cloud providers raised their prices 15×', why: 'Prices change slowly and with notice. A sudden spike with flat users points to your own usage.' },
            { text: 'Something is using resources without real users: a leaked key, a runaway job, a bot, a loop calling an AI API', correct: true, why: 'When the bill moves and users don’t, look for usage that isn’t customers. Set budget alerts so you hear about it on day one, not day thirty.' },
            { text: 'It’s normal monthly variation', why: '15× is never normal variation. Treat it as an incident.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w6-cloud-bill-q2',
          context: 'Your new AI feature costs about $0.40 per active user per month. Your plan is $5/month.',
          prompt: 'What should you think about?',
          level: 3,
          concepts: ['cloud-costs'],
          options: [
            { text: 'Nothing — $0.40 is tiny', why: 'It’s 8% of revenue for one feature, and heavy users might cost 10× the average. It adds up fast.' },
            { text: 'Whether heavy users could cost more than they pay — and whether you need usage limits or a higher tier', correct: true, why: 'Usage-priced features turn your best customers into your most expensive. Price and limit them on purpose.' },
            { text: 'Remove the feature immediately', why: 'It may be your best feature. Understand the costs first, then price it — don’t panic.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w6-cloud-bill-q3',
          prompt: 'In the bill you just played with, why did the database line jump in big steps instead of growing smoothly?',
          level: 2,
          concepts: ['cloud-costs'],
          options: [
            { text: 'Managed databases are sold in plan sizes; outgrowing one means paying for the next size up', correct: true, why: 'Unlike per-request pricing, databases come in tiers. Knowing when you’ll hit the next one helps you plan costs.' },
            { text: 'The database charges per user', why: 'Most managed databases charge for size and power, not users. More users just push you into a bigger tier.' },
            { text: 'It’s a bug in the simulator', why: 'It’s intentional — real database pricing really does jump in steps.' },
          ],
        },
        {
          kind: 'care',
          points: [
            'Know your cost per user. If it’s rising faster than revenue per user, you have a business problem, not just a tech one.',
            'Set budget alerts with every provider on day one. A leaked key or runaway loop should page someone in hours.',
            'Third-party lines (AI, email, auth) are often bigger than hosting. Read their pricing pages before building on them.',
          ],
        },
      ],
    },

    // ------------------------------------------------------------------ w6-architecture
    {
      id: 'w6-architecture',
      title: 'Monolith vs. services vs. serverless',
      subtitle: 'Four ways to shape an app — and which one fits 50 users or 10 million.',
      minutes: 9,
      concepts: ['arch-styles', 'scale-tradeoffs'],
      steps: [
        {
          kind: 'concept',
          emoji: '🏗️',
          title: 'Architecture: how the pieces are arranged',
          what: 'Architecture is how your app is split up: one big program, many small services, or functions that run on demand. All of them are client/server underneath.',
          why: 'The choice decides how fast you can ship, what it costs, and what breaks. Choosing the “big company” option too early is one of the most expensive startup mistakes.',
        },
        {
          kind: 'widget',
          title: 'Compare the four shapes',
          instruction: 'Open each style and compare its scores.',
          render: ({ done }) => <ArchCompare onDone={done} />,
        },
        {
          kind: 'widget',
          title: 'You decide',
          instruction: 'For each scenario, pick how you’d build the backend and read the reasoning.',
          render: ({ done }) => <ArchScenarios onDone={done} />,
        },
        {
          kind: 'quiz',
          id: 'w6-architecture-q1',
          prompt: 'How does “client/server” relate to monolith, services and serverless?',
          level: 2,
          concepts: ['arch-styles'],
          options: [
            { text: 'It’s a fourth, competing option', why: 'Every web app is client/server: a browser or phone talks to servers. The others describe how the server side is organized.' },
            { text: 'It’s the basic shape of all of them; the other three are ways to build the server half', correct: true, why: 'The client asks, the server answers. Whether the server is one monolith, many services or on-demand functions is the next decision.' },
            { text: 'It’s an old style nobody uses any more', why: 'Practically every app you use is client/server today.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w6-architecture-q2',
          context: 'Your AI agent proposes building your MVP as 9 microservices “so it can scale to millions of users”.',
          prompt: 'What’s your reply?',
          level: 3,
          concepts: ['arch-styles', 'scale-tradeoffs'],
          options: [
            { text: '“Great — let’s be ready for scale from day one.”', why: 'You’d pay the complexity cost every day for a scale problem you may never have. Most startups die of slowness, not of too many users.' },
            { text: '“Start with one well-organized monolith. We’ll split out pieces if a specific one needs it.”', correct: true, why: 'A monolith with clean internal boundaries is fast to build and easy to change. Splitting later, with real data on what needs scaling, is far cheaper.' },
            { text: '“Use 20 services, to be extra safe.”', why: 'More services means more network calls, deploys and things to monitor. It’s the opposite of safe for a small team.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w6-architecture-q3',
          context: 'Your monolith has 15,000 users and pages are getting slow. An engineer says: “We need to rewrite everything as microservices.”',
          prompt: 'What’s the strongest response?',
          level: 4,
          concepts: ['scale-tradeoffs', 'arch-styles'],
          options: [
            { text: 'Approve the rewrite — slowness means the architecture is wrong', why: 'Rewrites take months, freeze features and introduce new bugs. Slowness at this size almost always has a cheaper cause.' },
            { text: 'First measure where the time goes; fix the slow queries, add indexes and caching, or upgrade the database — then revisit if one part still can’t keep up', correct: true, why: 'Most slowness lives in a few hot spots. Targeted fixes buy years. If one piece really needs separate scaling, split just that piece out.' },
            { text: 'Switch everything to serverless', why: 'Changing the hosting model doesn’t fix a slow database query — it moves it somewhere else.' },
            { text: 'Ignore it — users will get used to it', why: 'Slow apps lose customers quietly. It’s worth fixing — just with the cheapest effective fix.' },
          ],
        },
        {
          kind: 'care',
          points: [
            'Architecture is a cost decision: each extra moving part costs engineering time every week, forever.',
            'Buyers and investors will ask why you chose your architecture. “We started simple and split where data told us to” is a great answer.',
            'Be wary of rewrites. Ask what specific problem it solves, how it’ll be measured, and what ships in the meantime.',
          ],
        },
      ],
    },
  ],
}

export default world
