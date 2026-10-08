import type { World } from '../../lib/types'
import { AuthLab, HashVault } from '../../widgets/AuthLab'
import { RoleLab } from '../../widgets/RoleLab'
import { SessionLab } from '../../widgets/SessionLab'
import { TenantTable, LeakHunt } from '../../widgets/TenantLab'
import { Categorize } from '../../widgets/Categorize'
import { FlowSim } from '../../widgets/FlowSim'

const world: World = {
  id: 'w4',
  num: 4,
  title: 'Users + Authentication',
  tagline: 'Who are you, and what are you allowed to do?',
  emoji: '🔑',
  color: '#7048e8',
  skill: 'security',
  concepts: [
    { id: 'authn', name: 'Authentication (who are you?)' },
    { id: 'password-hashing', name: 'Password hashing' },
    { id: 'two-factor', name: 'Two-factor authentication (2FA)' },
    { id: 'authz', name: 'Authorization (what can you do?)' },
    { id: 'server-checks', name: 'Server-side permission checks' },
    { id: 'sessions', name: 'Sessions & cookies' },
    { id: 'sso-passkeys', name: 'Sign in with Google & passkeys' },
    { id: 'multi-tenancy', name: 'Multi-tenancy' },
  ],
  lessons: [
    // ------------------------------------------------------------------ w4-authn
    {
      id: 'w4-authn',
      title: 'Who are you? Authentication',
      subtitle: 'Log in, fail, add 2FA, and stop a stranger with a stolen password.',
      minutes: 7,
      concepts: ['authn', 'password-hashing', 'two-factor'],
      unlocks: ['auth'],
      steps: [
        {
          kind: 'concept',
          emoji: '🪪',
          title: 'Authentication: proving who you are',
          what: 'Authentication is the front desk checking your ID badge. You prove you’re you — with a password, a code, a fingerprint — and the app remembers it.',
          why: 'Every account holds someone’s data or money. If the app can’t tell Scott from a stranger who knows Scott’s email, nothing else about security matters.',
        },
        {
          kind: 'widget',
          title: 'Log in to the simulated app',
          instruction: 'Log in as Scott (try a wrong password first if you like). Then switch to the Stranger and try with 2FA on — and off.',
          render: ({ done }) => <AuthLab onDone={done} />,
        },
        {
          kind: 'points',
          title: 'What just happened',
          points: [
            { term: '🔑 Password', text: 'Something you KNOW. Easy to steal: leaks, reuse, phishing, guessing.' },
            { term: '📱 Second factor (2FA)', text: 'Something you HAVE (your phone, a security key) or ARE (a fingerprint). A stolen password alone isn’t enough.' },
            { term: '🎟️ Session', text: 'After you prove who you are, the server gives your browser a pass so you don’t log in on every tap.' },
          ],
        },
        {
          kind: 'widget',
          title: 'What the database actually stores',
          instruction: 'Steal the database twice: once with plain-text passwords, once with hashed ones.',
          render: ({ done }) => <HashVault onDone={done} />,
        },
        {
          kind: 'quiz',
          id: 'w4-authn-q1',
          prompt: 'The stranger typed Scott’s real password and still couldn’t get in. What stopped them?',
          level: 2,
          concepts: ['two-factor', 'authn'],
          options: [
            { text: 'The password was hashed', why: 'Hashing protects passwords if the database is stolen. The stranger already had the correct password, so hashing didn’t matter here.' },
            { text: 'They didn’t have Scott’s phone for the 2FA code', correct: true, why: 'The password is one factor; the phone is a second, independent one. An attacker needs to steal both, which is much harder.' },
            { text: 'The app noticed they were a stranger by their name', why: 'The app can’t see faces or names — it only sees what’s typed. That’s exactly why it needs proof like a second factor.' },
            { text: 'The password was too weak', why: 'Strength matters for guessing, but here the attacker already knew it. A strong password that leaks is still leaked.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w4-authn-q2',
          context: 'Your AI agent wrote a “Forgot password?” feature: it emails users their current password.',
          prompt: 'What does that tell you?',
          level: 3,
          concepts: ['password-hashing'],
          options: [
            { text: 'Great feature — users love convenience', why: 'Convenient, but it’s only possible if the app can read every password. One database leak exposes all of them.' },
            { text: 'Passwords are stored readable — they should be hashed, and “forgot password” should send a reset link', correct: true, why: 'A properly hashed password can’t be turned back into text, even by you. Real apps send a one-time reset link instead.' },
            { text: 'Fine, as long as the email is sent over HTTPS', why: 'HTTPS protects the trip, not the storage. The real problem is the database holding readable passwords.' },
            { text: 'It’s fine if 2FA is also enabled', why: '2FA helps logins, but readable passwords still leak — and users reuse them on other sites you don’t protect.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w4-authn-q3',
          prompt: 'You’re starting a new app. How should login be built?',
          level: 3,
          concepts: ['authn', 'two-factor', 'password-hashing'],
          options: [
            { text: 'Have the AI agent write a custom login system from scratch', why: 'Homemade login is where subtle, serious bugs hide: hashing, reset flows, lockouts, 2FA. Few teams get it all right.' },
            { text: 'Use a proven auth provider or framework and turn on 2FA', correct: true, why: 'Auth providers (Clerk, Auth0, Supabase Auth, Firebase Auth…) have solved hashing, resets and 2FA, and get attacked and fixed daily. You spend your effort on your product.' },
            { text: 'Skip passwords: just ask for an email address', why: 'Anyone could type anyone’s email. Without proof of ownership — a password, a code sent to that inbox, a passkey — there’s no authentication at all.' },
          ],
        },
        {
          kind: 'care',
          points: [
            'Account takeovers become support tickets, refunds and headlines. 2FA blocks the vast majority of them.',
            'Ask your developer: “Are passwords hashed? Which auth provider do we use?” Both answers should be instant.',
            'Turn on 2FA for your OWN accounts first: GitHub, hosting, domain registrar, email. Those are the keys to the company.',
          ],
        },
      ],
    },

    // ------------------------------------------------------------------ w4-authz
    {
      id: 'w4-authz',
      title: 'What can you do? Authorization',
      subtitle: 'Scott is an ADMIN. Alex is a USER. Now turn the check off.',
      minutes: 9,
      concepts: ['authz', 'server-checks'],
      unlocks: ['authz'],
      steps: [
        {
          kind: 'concept',
          emoji: '🚪',
          title: 'Authorization: what you’re allowed to do',
          what: 'Authentication asks “Who are you?” — the ID badge. Authorization asks “What are you allowed to do?” — the keycard that opens some doors and not others.',
          why: 'Logged-in users aren’t all equal. An ADMIN can change settings; a USER can only see their own stuff. Something has to check that on every single request.',
        },
        {
          kind: 'widget',
          title: 'Badge, then keycard',
          instruction: 'As Alex, try Admin settings. Then flip “Server checks permissions” OFF and try again — also try Scott’s invoices.',
          render: ({ done }) => <RoleLab onDone={done} />,
        },
        {
          kind: 'points',
          title: 'Two questions, two checkpoints',
          points: [
            { term: '🪪 Authentication = “Who are you?”', text: 'The ID badge. Checked when you log in. Failure: 401 — “I don’t know you.”' },
            { term: '🚪 Authorization = “What are you allowed to do?”', text: 'The keycard. Checked on every request, for every action. Failure: 403 — “I know you, and no.”' },
            { term: '👑 Roles', text: 'Labels like ADMIN or USER that bundle permissions, so you don’t set rules person by person.' },
            { term: '🧾 Ownership', text: 'The other half of authorization: “is this record yours?” Changing ?user=alex to ?user=scott must not work.' },
          ],
        },
        {
          kind: 'widget',
          title: 'Badge or keycard?',
          instruction: 'Sort each situation: is it about WHO you are, or WHAT you may do?',
          render: ({ done }) => (
            <Categorize
              onDone={done}
              buckets={[
                { id: 'authn', label: 'Who are you? (authentication)', emoji: '🪪' },
                { id: 'authz', label: 'What may you do? (authorization)', emoji: '🚪' },
              ]}
              items={[
                { id: 'a', label: 'Typing your password', bucket: 'authn', why: 'Proving your identity — the ID badge.' },
                { id: 'b', label: 'Only admins can delete users', bucket: 'authz', why: 'A rule about what a role may do.' },
                { id: 'c', label: 'Entering a 2FA code', bucket: 'authn', why: 'A second proof of identity.' },
                { id: 'd', label: 'Alex can only see his own invoices', bucket: 'authz', why: 'An ownership rule: is this record yours?' },
                { id: 'e', label: 'Free plan can’t export data', bucket: 'authz', why: 'Plans are permissions too — and must be enforced on the server.' },
                { id: 'f', label: '“Sign in with Google”', bucket: 'authn', why: 'Google vouches for who you are. It says nothing about what you may do in your app.' },
                { id: 'g', label: '403 Forbidden', bucket: 'authz', why: '“I know who you are, and you can’t do this.”' },
              ]}
            />
          ),
        },
        {
          kind: 'quiz',
          id: 'w4-authz-q1',
          prompt: 'Alex is logged in. He opens /admin and gets “403 Forbidden”. Which checkpoint stopped him?',
          level: 2,
          concepts: ['authz', 'server-checks'],
          options: [
            { text: 'Authentication — the app didn’t know who he was', why: 'It knew exactly who he was: Alex, a USER. A “who are you?” failure would be 401 and a login screen.' },
            { text: 'Authorization — he’s known, but not allowed', correct: true, why: 'He passed the ID-badge check and failed the keycard check. 403 means “I know you, and this door isn’t yours.”' },
            { text: 'Neither — the page was just broken', why: 'A broken page is usually 500. A 403 is a deliberate, correct “no” from a permission check.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w4-authz-q2',
          context: 'Your AI agent: “Done! I hid the Admin button for non-admin users, so only admins can reach admin settings.”',
          prompt: 'What’s your reply?',
          level: 3,
          concepts: ['server-checks', 'authz'],
          options: [
            { text: '“Great, ship it.”', why: 'Hiding a button is decoration. Alex just typed /admin into the address bar and walked in.' },
            { text: '“Also hide the /admin address from the menu.”', why: 'Addresses can be guessed, shared, or found in the app’s code. Hiding things is never the lock.' },
            { text: '“Show me the server-side check that returns 403 for non-admins, and a test that proves it.”', correct: true, why: 'The rule must be enforced on the server, where users can’t change it. Asking for the check and a test turns a claim into evidence.' },
            { text: '“Make the button red so users know not to click it.”', why: 'Attackers don’t follow polite signs. Only the server saying “no” stops them.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w4-authz-q3',
          context: 'Your app has 60 API endpoints. An engineer proposes: “Every endpoint is denied by default; each one must declare who’s allowed, and a test fails if one doesn’t.”',
          prompt: 'What’s the main tradeoff?',
          level: 4,
          concepts: ['server-checks', 'authz'],
          options: [
            { text: 'More upfront work and occasional “why am I blocked?” bugs — in exchange for forgotten checks failing closed instead of open', correct: true, why: 'Deny-by-default turns the classic bug (a new endpoint with no check) into an annoying error instead of a data leak. That’s almost always worth it.' },
            { text: 'It makes the app slower for users', why: 'A permission check is a tiny lookup — microseconds. Speed isn’t the real cost here.' },
            { text: 'No tradeoff: frontend checks already cover it', why: 'Frontend checks run on the user’s device and can be bypassed. They improve the experience; they don’t protect anything.' },
            { text: 'It replaces the need for authentication', why: 'Authorization depends on authentication — you can’t decide what someone may do until you know who they are.' },
          ],
        },
        {
          kind: 'care',
          points: [
            'Missing authorization is the most common serious bug in AI-built apps: everything “works”, and users can see each other’s data.',
            'Ask: “If I change the ID in the address bar, can I see someone else’s record?” Then actually try it.',
            'Every new feature (export, search, API, admin tool) needs its own check. One forgotten endpoint is enough.',
          ],
        },
      ],
    },

    // ------------------------------------------------------------------ w4-sessions
    {
      id: 'w4-sessions',
      title: 'Sessions, tokens & “Sign in with Google”',
      subtitle: 'How the app remembers you — and how that memory gets stolen.',
      minutes: 6,
      concepts: ['sessions', 'sso-passkeys'],
      steps: [
        {
          kind: 'concept',
          emoji: '🎟️',
          title: 'A session is a festival wristband',
          what: 'After you log in, the server records a session and gives your browser a cookie (or token) with its ID. Every request shows that wristband instead of your password.',
          why: 'Typing your password on every tap would be unbearable — and sending it constantly would be riskier. The wristband is temporary and can be cut off.',
        },
        {
          kind: 'widget',
          title: 'Play with a session',
          instruction: 'Skip 8 days and reload. Then log in, let the attacker steal your cookie, use it, and fight back.',
          render: ({ done }) => <SessionLab onDone={done} />,
        },
        {
          kind: 'concept',
          emoji: '🔵',
          title: 'Letting someone else check the badge',
          what: '“Sign in with Google” (OAuth / SSO) lets Google vouch for who you are. Passkeys let your phone prove it with a secret that never leaves the device.',
          why: 'Fewer passwords means fewer leaks and less to build. Passkeys also can’t be typed into a fake website, which defeats phishing.',
        },
        {
          kind: 'widget',
          title: 'Three ways in',
          instruction: 'Run all three: Google sign-in, a passkey, and a phishing attempt.',
          render: ({ done }) => (
            <FlowSim
              onDone={done}
              nodes={[
                { id: 'you', label: 'You', emoji: '🧑' },
                { id: 'device', label: 'Your phone', emoji: '📱', note: 'Holds your passkey' },
                { id: 'app', label: 'acme-crm.app', emoji: '🖥️', note: 'The real app' },
                { id: 'google', label: 'Google', emoji: '🔵' },
                { id: 'fake', label: 'acme-crm-login.co', emoji: '🎣', note: 'A lookalike site' },
              ]}
              scenarios={[
                {
                  id: 'google',
                  label: 'Sign in with Google',
                  hops: [
                    { at: 'you', say: 'Taps “Sign in with Google”', tone: 'req' },
                    { at: 'app', say: 'Sends you to Google: “please tell me who this is”', tone: 'req' },
                    { at: 'google', say: 'You’re already signed in. “Share your name and email with acme-crm?”', tone: 'req', hold: 1100 },
                    { at: 'you', say: 'Taps Allow', tone: 'req' },
                    { at: 'google', say: 'Hands back a signed note: “this is scott@gmail.com, verified”', tone: 'res' },
                    { at: 'app', say: 'Trusts Google’s signature, creates a session. It never saw a password.', tone: 'res', hold: 1100 },
                  ],
                  screen: '👋 Welcome, Scott (via Google)',
                  result: { tone: 'good', text: 'Google did the authentication. Your app still decides what Scott may do — that part is always yours.' },
                },
                {
                  id: 'passkey',
                  label: 'Sign in with a passkey',
                  hops: [
                    { at: 'you', say: 'Taps “Sign in with passkey”', tone: 'req' },
                    { at: 'app', say: 'Sends a one-time puzzle (a challenge)', tone: 'req' },
                    { at: 'device', say: 'Asks for Face ID, then signs the puzzle with a private key', tone: 'req', hold: 1100 },
                    { at: 'app', say: 'Checks the signature with the public key it stored. Match → session.', tone: 'res', hold: 1100 },
                    { at: 'you', say: 'Logged in. Nothing to type, nothing to leak.', tone: 'res' },
                  ],
                  screen: '👋 Welcome back, Scott (passkey)',
                  result: { tone: 'good', text: 'The app only stores a PUBLIC key. If its database leaks, there are no passwords in it to steal.' },
                },
                {
                  id: 'phish',
                  label: 'Phishing email',
                  danger: true,
                  hops: [
                    { at: 'you', say: 'Clicks “Your account is locked — sign in now” in an email', tone: 'req' },
                    { at: 'fake', say: 'A pixel-perfect copy of the login page', tone: 'err', status: 'warn', hold: 1100 },
                    { at: 'device', say: '“No passkey for acme-crm-login.co.” Passkeys are tied to the real address.', tone: 'res', hold: 1300 },
                    { at: 'fake', say: 'Gets nothing usable', tone: 'err', status: 'fail' },
                  ],
                  screen: '🤔 No passkey found for this site',
                  result: { tone: 'warn', text: 'A typed password would have been stolen here. A passkey can’t be handed to the wrong site, even by a fooled human.' },
                },
              ]}
            />
          ),
        },
        {
          kind: 'quiz',
          id: 'w4-sessions-q1',
          prompt: 'Why do sessions expire at all? Users hate logging in.',
          level: 2,
          concepts: ['sessions'],
          options: [
            { text: 'To save storage space on the server', why: 'A session takes a few bytes. Expiry is about risk, not storage.' },
            { text: 'To limit how long a stolen or forgotten session can be used', correct: true, why: 'A cookie copied by malware, or left on a library computer, stops working once it expires. Shorter = safer, longer = more convenient.' },
            { text: 'Because cookies can’t last more than a day', why: 'Cookies can last months or years. Expiry is a deliberate product and security choice.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w4-sessions-q4',
          prompt: 'In the phishing run, why did the passkey protect Scott when a password wouldn’t have?',
          level: 2,
          concepts: ['sso-passkeys'],
          options: [
            { text: 'Passkeys are longer than passwords', why: 'Length isn’t the point — a long password typed into a fake site is still stolen.' },
            { text: 'The phone only offers a passkey to the exact site it was made for, and the secret never leaves the device', correct: true, why: 'There’s nothing to type and nothing to hand over. A lookalike address simply gets “no passkey here”.' },
            { text: 'Google blocked the fake site', why: 'Google wasn’t involved in the passkey flow at all. The protection is built into the passkey itself.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w4-sessions-q2',
          context: 'A customer emails: “My laptop was stolen at the airport. I was logged in to your app.”',
          prompt: 'What should your app let them (or support) do right now?',
          level: 3,
          concepts: ['sessions', 'authn'],
          options: [
            { text: 'Change their password — that logs everything out', why: 'Only if the app is built to kill sessions on password change. Many aren’t. The thief’s session can survive a password change.' },
            { text: '“Log out of all devices”, which deletes their sessions on the server', correct: true, why: 'Killing the sessions server-side makes the laptop’s cookie worthless immediately. It’s a feature worth asking your developer for.' },
            { text: 'Nothing — sessions expire in 30 days anyway', why: '30 days is a long time for a thief to read and change someone’s account.' },
            { text: 'Delete the account and make a new one', why: 'Drastic, loses their data, and unnecessary if sessions can be revoked.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w4-sessions-q3',
          context: 'Your engineer asks: “Should sessions last 1 hour or 30 days?” Your app is a CRM that small teams use all day.',
          prompt: 'What’s the best answer?',
          level: 4,
          concepts: ['sessions'],
          options: [
            { text: '1 hour, always — security beats everything', why: 'Forcing hourly logins pushes users to weak, reused passwords and sticky notes. Security that people route around isn’t security.' },
            { text: 'Fairly long sessions, plus re-confirming identity for risky actions (changing email, exporting, billing) and “log out everywhere”', correct: true, why: 'Convenience for everyday use, extra proof where damage would be high, and a kill switch for theft. That’s how mature apps balance it.' },
            { text: 'Never expire — use “Sign in with Google” so it doesn’t matter', why: 'Google vouches for identity at login. After that, your app’s session is still a wristband that can be stolen, so expiry still matters.' },
          ],
        },
        {
          kind: 'care',
          points: [
            'Session length is a product decision: convenience vs. risk. Decide it on purpose.',
            '“Log out of all devices” is a must-have once you have paying customers — it’s your answer to every “I lost my laptop” email.',
            '“Sign in with Google” and passkeys mean fewer passwords to store, leak and reset. Fewer support tickets, too.',
          ],
        },
      ],
    },

    // ------------------------------------------------------------------ w4-tenants
    {
      id: 'w4-tenants',
      title: 'Keeping customers’ data apart',
      subtitle: '“A customer says another user saw their data.” Find the leak.',
      minutes: 8,
      concepts: ['multi-tenancy', 'server-checks'],
      steps: [
        {
          kind: 'concept',
          emoji: '🏢',
          title: 'Multi-tenancy: one building, many locked apartments',
          what: 'Most apps keep every customer company in the same database tables. Each row is tagged with its company (its “tenant”), and every query must filter by it.',
          why: 'One shared system is far cheaper and simpler than a separate copy per customer. The price: every query is one forgotten line away from a leak.',
        },
        {
          kind: 'widget',
          title: 'Two companies, one table',
          instruction: 'You’re Maria at Acme. Flip the tenant filter off — then back on.',
          render: ({ done }) => <TenantTable onDone={done} />,
        },
        {
          kind: 'widget',
          title: 'Find the leak',
          instruction: 'Run all three features as Maria, find the leaky one, and fix it.',
          render: ({ done }) => <LeakHunt onDone={done} />,
        },
        {
          kind: 'points',
          title: 'Words engineers will use',
          points: [
            { term: '🏠 Tenant', text: 'One customer organization — a company, team or workspace — whose data must stay theirs.' },
            { term: '🏷️ Tenant ID', text: 'The column on every row saying which tenant owns it. Every query must filter on it.' },
            { term: '🛡️ Row-level security', text: 'A database feature that applies the tenant filter automatically, even if the code forgets.' },
            { term: '🏘️ Database per tenant', text: 'Each customer gets their own database. Strong walls, but more to run, upgrade and pay for.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w4-tenants-q1',
          context: 'A customer writes: “I could see another company’s invoices in my dashboard.”',
          prompt: 'What’s the right first move?',
          level: 3,
          concepts: ['multi-tenancy', 'server-checks'],
          options: [
            { text: 'Reply that it must have been a caching glitch on their side', why: 'Never guess away a data leak. If it’s real, every hour it stays open, more data is exposed.' },
            { text: 'Treat it as a security incident: reproduce it, disable or fix the leaking feature, then find out what was exposed and to whom', correct: true, why: 'Stop the bleeding first, then measure the damage. You may legally have to tell the affected company — and they’ll want details.' },
            { text: 'Ask the AI agent to “make it more secure” and move on', why: 'Vague instructions get vague fixes. You need the exact query that leaked and proof it’s fixed.' },
            { text: 'Wait for a second report to be sure', why: 'Most people who see someone else’s data never report it. One report is enough to act.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w4-tenants-q2',
          prompt: 'Where must the “only your company’s rows” rule be enforced?',
          level: 2,
          concepts: ['server-checks', 'multi-tenancy'],
          options: [
            { text: 'In the frontend, by hiding other companies’ rows', why: 'If the server sent the rows, they’re already on the user’s device. Hiding them on screen protects nothing.' },
            { text: 'On the server / in the database, before any data is sent', correct: true, why: 'Data that never leaves the server can’t leak. The filter has to run where users can’t touch it.' },
            { text: 'In the terms of service', why: 'A legal promise doesn’t stop a query from returning the wrong rows. You need a technical control.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w4-tenants-q3',
          context: 'A big enterprise prospect asks: “Is our data in a separate database?” Today all 300 customers share tables, with a tenant ID and row-level security.',
          prompt: 'What’s the honest tradeoff to discuss?',
          level: 4,
          concepts: ['multi-tenancy'],
          options: [
            { text: 'Shared tables are insecure; move everyone to separate databases now', why: 'Shared tables with enforced filters are how most successful SaaS works. Moving 300 customers would be costly and risky.' },
            { text: 'Shared + row-level security is cheap and simple to run; a dedicated database gives stronger isolation for a premium price, but adds upgrades, migrations and cost per customer', correct: true, why: 'Many companies offer exactly this: shared by default, dedicated for enterprise plans that pay for the extra operations work.' },
            { text: 'Tell them yes — it’s basically the same thing', why: 'It isn’t, and enterprise security reviews will check. Being caught misdescribing your architecture kills deals.' },
          ],
        },
        {
          kind: 'care',
          points: [
            'A cross-customer leak is the bug that ends B2B companies: lost trust, legal notices, cancelled contracts.',
            'Ask your developer: “What enforces the tenant filter if someone forgets it?” Row-level security is a good answer.',
            'Make “log in as two test companies and try to see each other’s data” part of every release check.',
          ],
        },
      ],
    },
  ],
}

export default world
