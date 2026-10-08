import type { World } from '../../lib/types'
import { ArchMap } from '../../components/ArchMap'
import { ServiceBoard } from '../../widgets/ServiceBoard'
import { WebhookSim } from '../../widgets/WebhookSim'
import { KeyVault } from '../../widgets/KeyVault'
import { LimitsLab } from '../../widgets/LimitsLab'
import { SwitchCost } from '../../widgets/SwitchCost'

const world: World = {
  id: 'w9',
  num: 9,
  title: 'APIs + Integrations',
  tagline: 'Your app is a team of other companies’ services.',
  emoji: '🔌',
  color: '#0ca678',
  skill: 'architecture',
  concepts: [
    { id: 'third-party', name: 'Third-party services & dependencies' },
    { id: 'service-failure-modes', name: 'Critical vs. degraded failures' },
    { id: 'service-fallbacks', name: 'Fallback strategies' },
    { id: 'payment-flow', name: 'Checkout & payment providers' },
    { id: 'webhooks', name: 'Webhooks' },
    { id: 'api-key-safety', name: 'API keys' },
    { id: 'api-rate-limits', name: 'Rate limits & API limits' },
    { id: 'usage-pricing', name: 'Usage-based pricing' },
    { id: 'vendor-lock-in', name: 'Vendor lock-in' },
  ],
  lessons: [
    // ------------------------------------------------------------------
    {
      id: 'w9-services',
      title: 'Your app is a team of services',
      subtitle: 'Switch services off and watch which features break.',
      minutes: 8,
      concepts: ['third-party', 'service-failure-modes', 'service-fallbacks'],
      unlocks: ['email', 'push', 'thirdparty'],
      steps: [
        {
          kind: 'concept',
          emoji: '🧑‍🤝‍🧑',
          title: 'You didn’t build most of your app',
          what: 'Modern apps rent their hardest parts: email sending, payments, logins, file storage, AI, text messages. Your code calls these third-party services through their APIs.',
          why: 'Building a reliable email or payment system yourself takes years. Renting one takes an afternoon — but every service you rent becomes a dependency your app can’t work without.',
        },
        {
          kind: 'widget',
          title: 'Switch services off',
          instruction: 'Turn a few services off and watch the features. Then run the email drill and try two fallbacks.',
          render: ({ done }) => <ServiceBoard key="board" onDone={done} />,
        },
        {
          kind: 'points',
          title: 'The words for what you just saw',
          points: [
            { term: '🔗 Dependency', text: 'A service a feature needs. Reset password depends on email, auth and the database.' },
            { term: '❌ Critical failure', text: 'The feature can’t work at all without it. Payments down means nobody can pay you.' },
            { term: '🟠 Degraded', text: 'The feature still works, just worse — like an upgrade with no receipt email.' },
            { term: '💥 Blast radius', text: 'How many features break when one service fails. The database has the biggest blast radius of all.' },
            { term: '🪂 Fallback', text: 'Your plan B: queue & retry, a second provider, or a graceful message with another path.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w9-services-q1',
          context: 'Your analytics tool has an outage for a whole day.',
          prompt: 'What do your customers experience?',
          level: 2,
          concepts: ['service-failure-modes', 'third-party'],
          options: [
            { text: 'Nothing obvious — but you lose a day of usage data', correct: true, why: 'Analytics is for you, not them. The app keeps working; your charts just get a hole. That’s a degraded, mostly invisible failure.' },
            { text: 'They can’t log in', why: 'Login depends on auth and the database, not analytics. A well-built app doesn’t need analytics to let people in.' },
            { text: 'Payments fail', why: 'Payments go through the payment provider. Analytics only watches what happens.' },
            { text: 'The whole app goes down', why: 'One non-critical service failing shouldn’t take everything down. If it does, the app was built with a hidden hard dependency.' },
          ],
        },
        {
          kind: 'widget',
          title: 'Where these live on your map',
          instruction: 'Tap at least 3 of the service boxes and read what happens when each one fails.',
          render: ({ done }) => <ArchMap key="map" revealAll only={['backend', 'email', 'push', 'thirdparty', 'payments', 'analytics']} onExplored={(n) => n >= 3 && done()} />,
        },
        {
          kind: 'quiz',
          id: 'w9-services-q2',
          context: 'Login codes for 2FA go out by text through one SMS provider. Twice this year it went down for 3 hours, and users with 2FA were locked out.',
          prompt: 'What’s the best fix?',
          level: 3,
          concepts: ['service-fallbacks', 'service-failure-modes'],
          options: [
            { text: 'Turn off 2FA so it can’t lock anyone out', why: 'That trades a few hours of inconvenience for permanently weaker security. Fix the dependency, not the protection.' },
            { text: 'Offer a second path: authenticator app or email code, plus backup codes', correct: true, why: 'A critical feature with a single provider needs a plan B. A second way to prove who you are turns a lockout into a minor detour.' },
            { text: 'Build your own SMS system', why: 'Sending texts reliably worldwide is a whole industry. You’d spend months and still be less reliable than a specialist.' },
            { text: 'Do nothing — 3 hours twice a year is rare', why: 'Rare, but it hits your most security-minded users at the worst moment. Cheap fallbacks exist, so “do nothing” is a choice to lock people out.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w9-services-q3',
          context: 'Your engineer proposes: “Let’s put every outgoing email in a queue and retry if the provider fails.”',
          prompt: 'What tradeoff should you raise?',
          level: 4,
          concepts: ['service-fallbacks', 'third-party', 'service-failure-modes'],
          options: [
            { text: 'Queues lose emails, so it’s worse than nothing', why: 'A proper queue stores messages until they’re sent. Losing emails is what happens without one.' },
            { text: 'None — queue & retry solves provider outages completely', why: 'It solves “lost”, not “late”. If the outage lasts an hour, everything in the queue is an hour late.' },
            { text: 'Nothing gets lost, but time-sensitive emails like password resets arrive late — those may need a second provider', correct: true, why: 'Right. Receipts can wait; a reset email or login code that arrives in an hour is effectively broken. Match the fallback to how urgent each message is.' },
            { text: 'Queues are only for big companies', why: 'Queues are standard, cheap and offered by most hosting platforms. Small teams benefit most because they can’t watch every outage live.' },
          ],
        },
        {
          kind: 'care',
          points: [
            'Their outage is your outage. List your critical services and know who to call — and where their status page is.',
            'Ask for each feature: “What happens if this provider is down?” If the answer is “it crashes”, you have a design task, not just a risk.',
            'Fallbacks cost money and time. Spend them on the critical paths: logging in, paying, resetting passwords.',
          ],
        },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'w9-payments',
      title: 'Payments, webhooks & API keys',
      subtitle: 'How money turns into access — and how it goes wrong.',
      minutes: 7,
      concepts: ['payment-flow', 'webhooks', 'api-key-safety'],
      unlocks: ['payments'],
      steps: [
        {
          kind: 'concept',
          emoji: '💳',
          title: 'Let the payment provider touch the money',
          what: 'Customers type their card into the payment provider’s checkout, not yours. The provider charges the card, then sends your server a message — a webhook — saying “this person paid”.',
          why: 'Handling raw card numbers comes with heavy security rules and liability. Providers carry that burden so you never have to store a card number.',
        },
        {
          kind: 'widget',
          title: 'Follow the money',
          instruction: 'Run a normal upgrade, then the outage. Then switch on both safety nets and run the outage again.',
          render: ({ done }) => <WebhookSim key="webhook" onDone={done} />,
        },
        {
          kind: 'points',
          title: 'What made it work',
          points: [
            { term: '🧾 Checkout', text: 'The provider’s payment page. Card details go straight to them, never through your servers.' },
            { term: '📨 Webhook', text: 'The provider calling your server to say “something happened” — paid, refunded, card declined.' },
            { term: '✍️ Signature check', text: 'Proof the webhook really came from the provider. Without it, anyone could send “user 42 paid”.' },
            { term: '🔁 Idempotency', text: 'Handling the same webhook twice has the same effect as once. Retries can’t double-upgrade or double-credit.' },
            { term: '🔎 Reconciliation', text: 'A regular check that “who paid” matches “who has access”. Catches what slipped through.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w9-payments-q1',
          context: 'A customer says: “You charged my card but I’m still on the Free plan.”',
          prompt: 'What most likely happened?',
          level: 2,
          concepts: ['webhooks', 'payment-flow'],
          options: [
            { text: 'The card was declined', why: 'A declined card means no charge. Here the money arrived — the problem is on your side.' },
            { text: 'The “paid” webhook never got processed by your server', correct: true, why: 'The provider charged successfully, but your app never recorded it. That gap between provider and database is the classic webhook failure.' },
            { text: 'The customer is confused', why: 'Maybe — but “charged but not upgraded” is common enough that you should check your webhook logs before assuming anything.' },
            { text: 'The payment provider kept the money', why: 'Providers pay out reliably. The money arrived; your app just didn’t hear about it.' },
          ],
        },
        {
          kind: 'widget',
          title: 'Where does the secret key go?',
          instruction: 'Try all three places for the key. Then handle the leak.',
          render: ({ done }) => <KeyVault key="keys" onDone={done} />,
        },
        {
          kind: 'quiz',
          id: 'w9-payments-q2',
          context: 'A developer suggests: “Let’s save customers’ card numbers in our database so re-billing is easier.”',
          prompt: 'What do you say?',
          level: 3,
          concepts: ['payment-flow', 'api-key-safety'],
          options: [
            { text: 'Fine, if the database is encrypted', why: 'Encryption helps, but storing cards still drags you into strict card-security rules, audits and liability if you’re breached.' },
            { text: 'Yes — it saves the provider’s fees', why: 'You still need a provider to charge the card. Storing numbers saves nothing and adds enormous risk.' },
            { text: 'No. The provider stores the card and gives us a reference to charge it again', correct: true, why: 'Providers keep the card and hand you a token or customer ID. You can re-bill any time without a card number ever touching your systems.' },
            { text: 'Only store the last 4 digits and expiry, and charge from those', why: 'Showing the last 4 digits is fine (providers give you those), but you can’t charge a card with them. The provider’s reference does the charging.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w9-payments-q3',
          context: 'Your server was slow to answer, so the provider sent the same “paid $29” webhook three times.',
          prompt: 'What should happen in your app?',
          level: 4,
          concepts: ['webhooks', 'payment-flow'],
          options: [
            { text: 'Three months of Pro get added', why: 'That’s the bug idempotency prevents. Retries are normal — your handler must expect duplicates.' },
            { text: 'The server should reject retried webhooks', why: 'Rejecting them would lose real events after a genuine failure. Retries are the provider’s safety net — accept them, just don’t double-apply.' },
            { text: 'The app upgrades once; the duplicates are recognized by event ID and ignored', correct: true, why: 'Each webhook has a unique event ID. Record which ones you’ve processed, and the second and third copies do nothing. That’s idempotency.' },
            { text: 'It doesn’t matter, it’s the same customer', why: 'It matters a lot when the event is “add 100 credits” or “send a refund”. Doing it three times is real money.' },
          ],
        },
        {
          kind: 'care',
          points: [
            '“Charged but not upgraded” is a support nightmare and a refund. Ask: do we retry webhooks, and do we reconcile?',
            'Never store card numbers. If anyone proposes it, the answer is the provider’s stored-customer feature.',
            'A leaked secret key is a money-moving key. Know where yours live, who can see them, and how to roll them in minutes.',
          ],
        },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'w9-lockin',
      title: 'Limits, costs & lock-in',
      subtitle: 'What happens to your vendors when you grow.',
      minutes: 6,
      concepts: ['api-rate-limits', 'usage-pricing', 'vendor-lock-in'],
      steps: [
        {
          kind: 'concept',
          emoji: '📈',
          title: 'Your vendors scale with you — limits and bills too',
          what: 'Every API has limits (how many requests per minute) and most charge per use. More users means more calls, a bigger bill, and eventually hitting the limit.',
          why: 'Limits protect the provider’s systems; per-use pricing lets you start cheap. Both are fine — until growth turns them into errors and margin problems.',
        },
        {
          kind: 'widget',
          title: 'Grow to 100,000 users',
          instruction: 'Slide users all the way up. Watch the errors and the bill, then pull at least two levers.',
          render: ({ done }) => <LimitsLab key="limits" onDone={done} />,
        },
        {
          kind: 'quiz',
          id: 'w9-lockin-q1',
          context: 'Your logs fill up with “429 Too Many Requests” from your AI provider at 9am every day.',
          prompt: 'What does that mean?',
          level: 2,
          concepts: ['api-rate-limits'],
          options: [
            { text: 'The AI provider is down', why: 'A down provider gives 500-type errors or timeouts. 429 means it’s up — and telling you to slow down.' },
            { text: 'You’re sending more requests per minute than your plan allows', correct: true, why: 'Exactly. 429 is a rate limit. At peak time you exceed your allowance, and the extra requests are refused.' },
            { text: 'Your API key leaked', why: 'Possible in theory, but a daily 9am pattern points to your own peak traffic hitting the limit.' },
            { text: 'Users are typing wrong answers', why: '429 is about request volume, not content. It has nothing to do with what users type.' },
          ],
        },
        {
          kind: 'widget',
          title: 'How hard would it be to leave?',
          instruction: 'Hit the price-hike button, then change at least two integration choices and watch the verdict.',
          render: ({ done }) => <SwitchCost key="switch" onDone={done} />,
        },
        {
          kind: 'points',
          title: 'Lock-in, in plain English',
          points: [
            { term: '🔒 Vendor lock-in', text: 'When leaving a provider costs so much that you effectively can’t. They can raise prices and you’ll pay.' },
            { term: '🧱 Wrapper (adapter)', text: 'One file of your own code that talks to the vendor. Everything else calls your wrapper, so switching changes one file.' },
            { term: '📦 Data portability', text: 'Can you export your data in a usable format? If not, your data is part of their moat.' },
            { term: '📜 Contract terms', text: 'Discounts for long commitments are real savings — and real handcuffs. Read the exit terms.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w9-lockin-q2',
          context: 'Your AI summary feature is a hit. AI calls now cost 55% of your revenue, and free users generate most of them.',
          prompt: 'What’s the best first move?',
          level: 3,
          concepts: ['usage-pricing', 'api-rate-limits'],
          options: [
            { text: 'Remove the feature', why: 'It’s your most popular feature. The problem is cost per use, not the feature.' },
            { text: 'Cache repeat results and cap free-plan usage, then price heavy use into paid plans', correct: true, why: 'Caching cuts calls you don’t need; a free-plan cap stops non-paying users driving your bill; pricing makes heavy users pay for what they use.' },
            { text: 'Buy the provider’s biggest tier', why: 'A bigger tier raises your limit, not your margin. You’d pay more to serve the same free users.' },
            { text: 'Ignore it — costs will drop as you grow', why: 'Usage pricing grows with usage. Without changes, more users means proportionally more cost.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w9-lockin-q3',
          context: 'Your engineer wants to spend two days wrapping all email-provider calls behind one sendEmail() function before launch.',
          prompt: 'How should you weigh it?',
          level: 4,
          concepts: ['vendor-lock-in', 'service-fallbacks'],
          options: [
            { text: 'Skip it — we’ll never switch providers', why: 'You might not plan to, but price hikes, outages and acquisitions happen. A wrapper is cheap insurance.' },
            { text: 'Worth it: cheap now, and it makes switching or adding a backup provider a one-file change', correct: true, why: 'Two days now versus weeks later. The same wrapper is also where you’d add retries or a second provider — so it pays off even if you never switch.' },
            { text: 'Better to build our own email system so there’s no vendor', why: 'That swaps a little lock-in for a huge ongoing job. Deliverability is a specialty — wrap the vendor, don’t replace it.' },
            { text: 'Only worth it if the vendor is unreliable', why: 'Reliable vendors still change prices and terms. The wrapper protects your negotiating position, not just uptime.' },
          ],
        },
        {
          kind: 'care',
          points: [
            'Model your vendor bill at 10× and 100× today’s users. Usage pricing is how a growing product becomes unprofitable.',
            'Know your limits before launch day: requests per minute, emails per day, monthly caps.',
            'Keep the switch possible: a wrapper in the code, your data exportable, and contract exit terms you’ve actually read.',
          ],
        },
      ],
    },
  ],
}

export default world
