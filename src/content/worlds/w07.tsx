import type { World } from '../../lib/types'
import type { SortItem } from '../../widgets/Sorter'
import { Sorter } from '../../widgets/Sorter'
import { ArchMap } from '../../components/ArchMap'
import { ExposedSecretCase, MissingAuthzCase, StolenSessionCase, WeakPasswordCase } from '../../widgets/VulnAccounts'
import { PermissionsCase, RateLimitCase, SqlInjectionCase, XssCase } from '../../widgets/VulnInputs'
import { SecurityCheckup } from '../../widgets/SecurityCheckup'

const LEAK_RESPONSE: SortItem[] = [
  { id: 'rotate', emoji: '🔁', label: 'Revoke the key and issue a new one' },
  { id: 'logs', emoji: '📜', label: 'Check logs: what did the key touch, and when?' },
  { id: 'tell', emoji: '📣', label: 'Tell affected customers (and get advice if personal data was exposed)' },
  { id: 'cause', emoji: '🛠️', label: 'Fix how it leaked, and write a short postmortem' },
]

const world: World = {
  id: 'w7',
  num: 7,
  title: 'Security',
  tagline: 'A safe lab for seeing how apps get broken.',
  emoji: '🛡️',
  color: '#c92a2a',
  skill: 'security',
  concepts: [
    { id: 'sec-passwords', name: 'Weak passwords & guessing' },
    { id: 'sec-sessions', name: 'Stolen sessions' },
    { id: 'sec-authz-gaps', name: 'Missing authorization checks' },
    { id: 'sec-secrets', name: 'Exposed secrets' },
    { id: 'sec-injection', name: 'SQL injection' },
    { id: 'sec-xss', name: 'Cross-site scripting (XSS)' },
    { id: 'sec-least-privilege', name: 'Least privilege' },
    { id: 'sec-rate-limit', name: 'Rate limiting' },
    { id: 'sec-habits', name: 'Everyday security habits' },
  ],
  lessons: [
    /* ------------------------------------------------------------ */
    {
      id: 'w7-lab-1',
      title: 'Attack lab I: accounts & keys',
      subtitle: 'Break a fictional app four ways — then fix it.',
      minutes: 10,
      concepts: ['sec-passwords', 'sec-sessions', 'sec-authz-gaps', 'sec-secrets'],
      steps: [
        {
          kind: 'concept',
          emoji: '🧪',
          title: 'Welcome to the attack lab',
          what: 'KiteDesk is a fictional app with four classic mistakes built in. For each one you’ll use it normally, watch it get broken, then switch on the fix.',
          why: 'Most breaches aren’t genius hackers. They’re ordinary mistakes found by bots and curious people. Once you’ve seen each mistake happen, you’ll spot it in your own product.',
        },
        {
          kind: 'widget',
          title: 'Mistake 1: weak passwords',
          instruction: 'Sign Maya up, run the guessing bot, then turn on the fix and run it again.',
          render: ({ done }) => <WeakPasswordCase onDone={done} />,
        },
        {
          kind: 'widget',
          title: 'Mistake 2: stolen sessions',
          instruction: 'Log in as Maya, run the leaky script, then turn on the fix and try again.',
          render: ({ done }) => <StolenSessionCase onDone={done} />,
        },
        {
          kind: 'quiz',
          id: 'w7-lab-1-q1',
          prompt: 'An attacker copies a user’s session cookie but never learns their password. What can they do?',
          level: 2,
          concepts: ['sec-sessions'],
          options: [
            { text: 'Nothing — without the password they can’t get in', why: 'The session cookie IS the proof of login. The app checks the wristband, not the password, on every click.' },
            { text: 'Act as that user until the session expires or is revoked', correct: true, why: 'Exactly. That’s why short expiry, HttpOnly cookies and “log out everywhere” matter: they shrink how long a stolen wristband works.' },
            { text: 'Only see the login page', why: 'The login page is what you see WITHOUT a session. With a valid cookie, the attacker skips straight past it.' },
            { text: 'Change the password, but not see any data', why: 'With a valid session they can usually see everything the user can. Sensitive actions should still ask for the password again.' },
          ],
        },
        {
          kind: 'widget',
          title: 'Mistake 3: missing authorization',
          instruction: 'Open Alex’s invoice, change the number in the address bar, then turn on the fix and retry.',
          render: ({ done }) => <MissingAuthzCase onDone={done} />,
        },
        {
          kind: 'widget',
          title: 'Mistake 4: exposed secrets',
          instruction: 'Buy the Pro plan, view the page source, use the key — then fix it and try again.',
          render: ({ done }) => <ExposedSecretCase onDone={done} />,
        },
        {
          kind: 'points',
          title: 'What you just saw',
          points: [
            { term: '🔑 Weak passwords', text: 'Bots try the most common and previously leaked passwords first. Block those and add 2FA.' },
            { term: '🍪 Session theft', text: 'A session cookie is as good as a password while it lasts. Protect it and keep it short-lived.' },
            { term: '🚪 Missing authorization', text: 'Logged in ≠ allowed. Every request must check “is this yours?” on the server.' },
            { term: '🗝️ Exposed secrets', text: 'Anything sent to the browser is public. Secret keys live on the server, and leaked keys get rotated.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w7-lab-1-q2',
          context: 'Your AI coding agent says: “Checkout works now! I put the payment provider’s secret key in the frontend config so the browser can charge cards directly.”',
          prompt: 'What do you do?',
          level: 3,
          concepts: ['sec-secrets'],
          options: [
            { text: 'Ship it — it works, and the frontend config isn’t visible', why: 'Frontend code is downloaded by every visitor. “View source” shows it. Working and safe are different claims.' },
            { text: 'Ask for the key to be moved to a server environment variable, with the browser calling your own backend — and rotate the key', correct: true, why: 'Right. The secret stays on the server, the browser asks your backend to charge, and rotating means the exposed key stops working.' },
            { text: 'Minify the code so the key is harder to read', why: 'Scrambled-looking code is still downloadable. Bots search bundles for key patterns automatically.' },
            { text: 'Keep it, but make the GitHub repo private', why: 'The repo is only one leak. The bigger one is every visitor’s browser, which receives the key no matter what.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w7-lab-1-q3',
          context: 'After the invoice bug, an engineer proposes: “Let’s switch invoice numbers to long random IDs like 9f2c-71ab-… so nobody can guess them.”',
          prompt: 'How should you respond?',
          level: 4,
          concepts: ['sec-authz-gaps', 'sec-passwords'],
          options: [
            { text: 'Great — unguessable IDs fix the problem', why: 'IDs leak: in emails, screenshots, browser history, shared links. Once someone has the ID, nothing stops them.' },
            { text: 'Random IDs are a nice extra, but the real fix is an ownership check on every request', correct: true, why: 'Exactly. Hard-to-guess IDs reduce casual snooping, but the server must still ask “does this belong to you?” every single time.' },
            { text: 'Hide the invoice number from the address bar instead', why: 'The browser still sends the number to the server; it’s just hidden from view. Anyone can see and change requests with basic tools.' },
            { text: 'Require a stronger password for Alex', why: 'Alex logged in legitimately. The flaw is what the server lets a logged-in user see — passwords don’t touch that.' },
          ],
        },
        {
          kind: 'care',
          points: [
            'Ask your developer or AI agent: “For every page that shows customer data, where is the server-side ownership check?”',
            'Turn on breached-password blocking and offer 2FA from day one — it’s usually a setting in your auth provider, not a project.',
            'If a key ever appears in frontend code, a screenshot or a public repo: rotate it the same day. Assume it’s already copied.',
            'One authorization slip can expose every customer at once — the kind of incident that ends enterprise deals.',
          ],
        },
      ],
    },

    /* ------------------------------------------------------------ */
    {
      id: 'w7-lab-2',
      title: 'Attack lab II: inputs & limits',
      subtitle: 'When text becomes code, and keys can do too much.',
      minutes: 10,
      concepts: ['sec-injection', 'sec-xss', 'sec-least-privilege', 'sec-rate-limit'],
      unlocks: ['security'],
      steps: [
        {
          kind: 'concept',
          emoji: '🧯',
          title: 'Never trust input',
          what: 'Anything a user types, uploads or sends is input. Some mistakes happen when the app accidentally treats that input as instructions.',
          why: 'Your app takes input from strangers all day. The fixes are well known and mostly built into modern tools — as long as nobody switches them off.',
        },
        {
          kind: 'widget',
          title: 'Mistake 5: SQL injection',
          instruction: 'Search for Maya, then search with the odd-looking text. Then turn on the fix and search again.',
          render: ({ done }) => <SqlInjectionCase onDone={done} />,
        },
        {
          kind: 'widget',
          title: 'Mistake 6: cross-site scripting',
          instruction: 'Post a normal comment, then the script one. Then turn on the fix and post it again.',
          render: ({ done }) => <XssCase onDone={done} />,
        },
        {
          kind: 'quiz',
          id: 'w7-lab-2-q1',
          prompt: 'SQL injection and XSS look different. What’s the same mistake underneath both?',
          level: 2,
          concepts: ['sec-injection', 'sec-xss'],
          options: [
            { text: 'The password was too weak', why: 'Neither attack involved a password. The attacker just typed into a normal box.' },
            { text: 'User text was treated as instructions instead of plain data', correct: true, why: 'Yes. In one case the database obeyed it, in the other the browser did. The fix in both: keep data and commands separate.' },
            { text: 'The server was too slow', why: 'Speed has nothing to do with it. These attacks work instantly on fast servers.' },
            { text: 'The attacker had admin access', why: 'They had no special access at all — only a search box and a comment form, like any visitor.' },
          ],
        },
        {
          kind: 'widget',
          title: 'Mistake 7: excessive permissions',
          instruction: 'Run the report, misuse the bot’s key, then apply least privilege and try again.',
          render: ({ done }) => <PermissionsCase onDone={done} />,
        },
        {
          kind: 'widget',
          title: 'Mistake 8: no rate limiting',
          instruction: 'Log in as Maya, unleash the guessing bot, then turn on the rate limit and run it again.',
          render: ({ done }) => <RateLimitCase onDone={done} />,
        },
        {
          kind: 'quiz',
          id: 'w7-lab-2-q2',
          context: 'You want an AI agent to answer questions like “How many signups did we get last week?” straight from your production database.',
          prompt: 'What access should it get?',
          level: 3,
          concepts: ['sec-least-privilege'],
          options: [
            { text: 'The admin database login — it’s the easiest to set up', why: 'Easiest today, scariest later. One confused instruction or leaked key could edit or delete real customer data.' },
            { text: 'A read-only login limited to the tables it needs (ideally a copy, not production)', correct: true, why: 'Least privilege: enough to do the job, nothing more. If the agent or its key misbehaves, the worst case is small.' },
            { text: 'No limits, but ask it nicely not to delete anything', why: 'Instructions are not permissions. Security comes from what the key CAN’T do, not what it promises.' },
            { text: 'Your own personal login, so you can see what it does', why: 'Then the agent has every power you have — and your logs can’t tell your actions from its actions.' },
          ],
        },
        {
          kind: 'widget',
          title: 'Where security lives',
          instruction: 'Tap at least 3 boxes to see how the security layer guards the rest.',
          render: ({ done }) => (
            <ArchMap revealAll only={['security', 'api', 'backend', 'auth', 'authz', 'secrets', 'database']} onExplored={(n) => n >= 3 && done()} />
          ),
        },
        {
          kind: 'quiz',
          id: 'w7-lab-2-q3',
          context: 'Your engineer proposes a rate limit of “5 login attempts per IP address per 15 minutes.”',
          prompt: 'What’s the most important gap to raise?',
          level: 4,
          concepts: ['sec-rate-limit', 'sec-passwords'],
          options: [
            { text: 'None — per-IP limits stop guessing bots', why: 'Serious bots spread guesses across thousands of IP addresses, so each one stays under a per-IP limit.' },
            { text: 'Also limit per account (with growing delays) and alert on floods — but avoid hard lockouts that let attackers lock real users out', correct: true, why: 'That’s the tradeoff. Per-account limits catch spread-out bots; progressive delays plus 2FA protect users without handing attackers an easy “lock everyone out” button.' },
            { text: 'Make it 50 attempts so real users never get blocked', why: 'Looser limits barely slow a bot, and still let the per-IP dodge work. The fix is smarter limits, not bigger ones.' },
            { text: 'Rate limiting belongs in the frontend', why: 'The frontend runs on the attacker’s machine — they can skip it. Limits must be enforced on the server.' },
          ],
        },
        {
          kind: 'care',
          points: [
            'Ask: “Do we ever build database queries by gluing text together?” and “Do we ever switch off our framework’s automatic escaping?” Both answers should be no.',
            'Every API key, bot and AI agent gets its own key with the smallest permissions that work. Review them quarterly.',
            'Rate limits on login, signup, password reset and anything that costs you money (SMS, AI calls) — bots love free resources.',
          ],
        },
      ],
    },

    /* ------------------------------------------------------------ */
    {
      id: 'w7-habits',
      title: 'Security habits that actually matter',
      subtitle: 'The boring defaults that stop most real attacks.',
      minutes: 7,
      concepts: ['sec-habits', 'sec-least-privilege'],
      steps: [
        {
          kind: 'concept',
          emoji: '🧹',
          title: 'Boring habits beat clever hackers',
          what: 'Most real attacks are phishing, reused passwords, forgotten access and outdated software. A few habits close most of those doors.',
          why: 'You don’t need a security team to be hard to break into. You need 2FA, tidy access lists, updated packages and a plan for when something leaks.',
        },
        {
          kind: 'widget',
          title: 'Your company’s security checkup',
          instruction: 'Run the attack, close every open door, then run it again until every door holds.',
          render: ({ done }) => <SecurityCheckup onDone={done} />,
        },
        {
          kind: 'points',
          title: 'The habits',
          points: [
            { term: '📱 MFA everywhere', text: 'Two-factor on email, cloud, GitHub, domain and payments. A phished password alone then isn’t enough.' },
            { term: '🎟️ Least privilege', text: 'People and bots get only the access they need. Fewer admins means fewer ways in.' },
            { term: '👋 Offboarding', text: 'When someone leaves, remove their access the same day — including shared passwords and API keys.' },
            { term: '📦 Updates', text: 'Packages with known flaws get scanned for within hours. Turn on automatic update alerts and act on critical ones.' },
            { term: '🚨 Incident basics', text: 'If something leaks: contain it first, then investigate, tell the people affected, and fix the cause.' },
          ],
        },
        {
          kind: 'widget',
          title: 'A key leaked. What now?',
          instruction: 'GitHub emails you: your payments key was found in a public repo. Put the response in order.',
          render: ({ done }) => (
            <Sorter
              items={LEAK_RESPONSE}
              topLabel="Do first"
              bottomLabel="Do last"
              explain="Contain first — a revoked key can’t do more damage while you investigate. Then learn what happened, tell the people affected, and fix the cause so it can’t recur."
              onDone={done}
            />
          ),
        },
        {
          kind: 'quiz',
          id: 'w7-habits-q1',
          prompt: 'You can turn on 2FA for only one account today. Which protects your company most?',
          level: 3,
          concepts: ['sec-habits'],
          options: [
            { text: 'Your company email', correct: true, why: 'Email is the master key: password resets for GitHub, cloud, domain and payments all go there. Whoever controls it can take over the rest.' },
            { text: 'Your analytics dashboard', why: 'Useful, but it can’t reset other accounts or touch customer data. Start with the account that unlocks the others.' },
            { text: 'Your social media account', why: 'Embarrassing if lost, but it doesn’t control your app, data or money.' },
            { text: 'Your design tool', why: 'Losing designs would hurt, but it isn’t the key to everything else. Email is.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w7-habits-q2',
          context: 'A tool warns: “pdf-maker 4.0.2 has a known critical flaw. Fixed in 4.0.9.”',
          prompt: 'Why does a PUBLICLY known flaw make this urgent?',
          level: 2,
          concepts: ['sec-habits'],
          options: [
            { text: 'Because public flaws are easy to scan for — bots check websites for them within hours', correct: true, why: 'Right. Once a flaw is published, attackers search the internet for apps still running the old version. Updating closes the door.' },
            { text: 'It isn’t urgent — attackers only target big companies', why: 'Automated scanners don’t care how big you are. They hit everything that’s running the vulnerable version.' },
            { text: 'Because the package will stop working', why: 'The old version keeps working fine — that’s what makes it easy to forget. The risk is that it’s now a known way in.' },
            { text: 'Because updates make the app faster', why: 'Sometimes, but that’s not the reason here. A security fix closes a known door.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w7-habits-q3',
          context: 'A contractor finished their project. They had admin on your cloud account and know the shared database password.',
          prompt: 'What’s the complete offboarding?',
          level: 4,
          concepts: ['sec-habits', 'sec-least-privilege'],
          options: [
            { text: 'Remove their cloud account — done', why: 'They still know the shared database password, which works from anywhere. Shared secrets must be changed too.' },
            { text: 'Remove their accounts AND rotate every shared secret they knew; next time give them their own scoped, expiring access', correct: true, why: 'Exactly. Remove what’s theirs, rotate what was shared, and design future access so offboarding is one click instead of a scavenger hunt.' },
            { text: 'Ask them to promise they’ll forget the password', why: 'Their laptop may be stolen next year with the password in a notes file. Trust isn’t the issue — exposure is.' },
            { text: 'Leave it, in case they come back for more work', why: 'Unused admin access is pure risk with no benefit. Re-adding someone takes two minutes.' },
          ],
        },
        {
          kind: 'care',
          points: [
            'This week: 2FA on email, cloud, GitHub, domain registrar and payments. Use an authenticator app or passkey, not SMS where you can avoid it.',
            'Keep an access list: who has admin where. Review it monthly and the day anyone leaves.',
            'Turn on dependency and secret scanning alerts in GitHub — they’re free and catch the two most common slip-ups.',
            'Enterprise customers will ask about exactly these habits in security questionnaires. Having them makes deals faster.',
          ],
        },
      ],
    },
  ],
}

export default world
