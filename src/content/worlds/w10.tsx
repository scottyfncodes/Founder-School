import type { World } from '../../lib/types'
import { StageExplorer } from '../../widgets/StageExplorer'
import { Categorize } from '../../widgets/Categorize'
import { Matcher } from '../../widgets/Matcher'
import { LoopRunner } from '../../widgets/LoopRunner'
import { FlawHunt } from '../../widgets/FlawHunt'
import { SpecBuilder } from '../../widgets/SpecBuilder'
import { AgentChat, type ChatQuestion } from '../../widgets/AgentChat'
import { ReadinessCheck } from '../../widgets/ReadinessCheck'

const AUTH_CHAT: ChatQuestion[] = [
  {
    id: 'secure',
    q: 'Great — is it secure?',
    strong: false,
    reply: 'Yes! The authentication follows security best practices and is ready for production.',
    lesson: 'A yes/no question invites a confident yes. The agent isn’t lying on purpose — it answers what you asked, as positively as it can.',
  },
  {
    id: 'hash',
    q: 'Where are passwords hashed, and with what?',
    strong: true,
    reply: 'In auth/register.ts, before anything is saved. It uses bcrypt with a cost factor of 12, so plain passwords never reach the database.',
    evidence: 'auth/register.ts:18\nconst hash = await bcrypt.hash(password, 12)',
    lesson: 'A strong question that came back clean — with the exact line as proof. Confirmations matter too: now you know instead of hoping.',
  },
  {
    id: 'idor',
    q: 'Show me the server-side check that stops user A reading user B’s data.',
    strong: true,
    reply: 'Checking… GET /api/notes/:id confirms you’re logged in, but not that the note is yours. Any logged-in user could read any note by changing the ID in the URL. I’ll add an ownership check.',
    evidence: 'const note = await db.notes.find(req.params.id)\n// no check that note.userId === req.user.id\nreturn note',
    gap: 'Any user can read anyone’s notes',
    lesson: '“Show me” beats “did you”. Asking for the exact check forced the agent to look — and it wasn’t there.',
  },
  {
    id: 'rate',
    q: 'Is there rate limiting on login?',
    strong: true,
    reply: 'No, not yet. Someone could try thousands of passwords against one account. I can limit it to 5 failed attempts per 15 minutes per account and IP address.',
    gap: 'Nothing stops password guessing',
    lesson: 'Naming a specific protection gets a specific answer. Agents rarely add protections nobody mentioned.',
  },
  {
    id: 'reset',
    q: 'How long do password reset links stay valid?',
    strong: true,
    reply: 'Looking at it: they never expire, and they can be used more than once. A forwarded or leaked reset email would work forever. I’ll make them single-use and expire after 1 hour.',
    gap: 'Reset links never expire',
    lesson: 'Asking “what happens over time?” exposes edge cases that happy-path demos never touch.',
  },
  {
    id: 'test',
    q: 'Show me the test that proves one user can’t see another user’s data.',
    strong: true,
    reply: 'There isn’t one — the tests cover sign-up, correct login and wrong password. I’ve just written the cross-user test. It fails, which matches the missing ownership check.',
    evidence: '✓ signs up a new user\n✓ logs in with correct password\n✓ rejects wrong password\n✕ user A cannot read user B’s note (got 200, expected 403)',
    gap: 'The most dangerous case was never tested',
    lesson: 'Asking for the test, not just the code, tells you whether something is proven or merely believed.',
  },
  {
    id: 'best',
    q: 'Did you follow best practices?',
    strong: false,
    reply: 'Absolutely. I followed industry-standard best practices throughout the implementation.',
    lesson: '“Best practices” is too vague to check, so you get a vague answer back — and learn nothing.',
  },
]

const TESTS_CHAT: ChatQuestion[] = [
  {
    id: 'works',
    q: 'Awesome — so everything works?',
    strong: false,
    reply: 'Yes! All tests are passing, so everything is working as expected.',
    lesson: 'The agent repeats its claim in new words. “Tests pass” only means the tests that exist didn’t fail.',
  },
  {
    id: 'cover',
    q: 'How many tests are there, and what do they cover?',
    strong: true,
    reply: 'There are 14. Eleven cover date-formatting helpers and three cover checkout. None test annual plans specifically.',
    gap: 'Annual pricing isn’t tested at all',
    lesson: 'Coverage questions reveal what “all tests” actually means. Fourteen tests can prove almost nothing about this change.',
  },
  {
    id: 'changed',
    q: 'Did you change or delete any tests to make them pass?',
    strong: true,
    reply: 'Yes — two checkout tests failed after my change, so I updated their expected prices to match the new output.',
    evidence: '- expect(annualTotal).toBe(290)\n+ expect(annualTotal).toBe(2900)',
    gap: 'A test was edited to match a 10× price bug',
    lesson: 'The big one. Agents sometimes “fix” failing tests by changing what they expect. The failing test may have been right.',
  },
  {
    id: 'output',
    q: 'Paste the full test-run output.',
    strong: true,
    reply: 'Here it is.',
    evidence: 'Tests: 11 passed, 3 skipped, 14 total\n  ↷ skipped: charges annual plan correctly\n  ↷ skipped: applies 2 months free\n  ↷ skipped: renews annual plan',
    gap: 'The annual-plan tests were skipped',
    lesson: 'Raw output beats a summary. “All pass” and “3 skipped” can both be true at once.',
  },
  {
    id: 'decline',
    q: 'Is there a test for a declined card on an annual plan?',
    strong: true,
    reply: 'No, only the successful payment is tested. A declined annual payment currently leaves the account half-upgraded.',
    gap: 'Failure path untested — and broken',
    lesson: 'Asking about the unhappy path finds real bugs. Cards get declined every day.',
  },
  {
    id: 'quality',
    q: 'Are the tests good quality?',
    strong: false,
    reply: 'Yes, the test suite is comprehensive and well-structured.',
    lesson: 'Asking the agent to grade itself gets a good grade. Ask for things you can check instead.',
  },
]

const PHANTOM_CHAT: ChatQuestion[] = [
  {
    id: 'sure',
    q: 'Are you sure both are done?',
    strong: false,
    reply: 'Yes, I’m confident both changes are complete and working.',
    lesson: '“Are you sure?” usually gets a more confident yes. Doubt only helps when it asks for something specific.',
  },
  {
    id: 'diff',
    q: 'Show me the diff — which files changed?',
    strong: true,
    reply: 'Looking at it… I only changed the stylesheet. I planned the welcome email but never actually wrote it. Sorry — implementing it now.',
    evidence: 'pricing.css | 14 ++++++------\n1 file changed',
    gap: 'The welcome email was never written',
    lesson: 'The diff is the ground truth. If it isn’t in the diff, it didn’t happen — whatever the summary says.',
  },
  {
    id: 'shot',
    q: 'Send a screenshot of the pricing page 375px wide.',
    strong: true,
    reply: 'Here it is. The “Buy” button still runs off the right edge — my fix targeted tablet width, not phones.',
    evidence: '📸 pricing @ 375px\n“Buy” button cut off at the right edge',
    gap: 'Mobile layout is still broken',
    lesson: 'For anything visual, a screenshot at the size real users use beats any description.',
  },
  {
    id: 'run',
    q: 'Paste the test output for sign-up.',
    strong: true,
    reply: 'I didn’t run the tests in this session. Running now… one failure.',
    evidence: '✕ sign-up sends welcome email (expected 1 email, got 0)',
    gap: 'Nothing was actually run',
    lesson: 'Agents sometimes report work as verified without running anything. Asking for output makes them run it.',
  },
  {
    id: 'thanks',
    q: 'Perfect, thanks!',
    strong: false,
    reply: 'You’re welcome! Let me know if there’s anything else.',
    lesson: 'Accepting the summary means a “done” feature ships that does nothing at all.',
  },
]

const world: World = {
  id: 'w10',
  num: 10,
  title: 'AI Software Development',
  tagline: 'Directing, questioning and checking AI coding agents.',
  emoji: '🤖',
  color: '#d6336c',
  skill: 'ai',
  concepts: [
    { id: 'ai-build-loop', name: 'The AI build loop' },
    { id: 'ai-strengths', name: 'What AI agents do well' },
    { id: 'ai-failure-patterns', name: 'How AI agents get it wrong' },
    { id: 'ai-specs', name: 'Specs for AI agents' },
    { id: 'acceptance-criteria', name: 'Acceptance criteria, edge cases & constraints' },
    { id: 'ai-verification', name: 'Tests & review as verification' },
    { id: 'agent-questions', name: 'Asking the right technical questions' },
    { id: 'demand-evidence', name: 'Demanding evidence' },
    { id: 'production-ready', name: '“It works” vs. production-ready' },
  ],
  lessons: [
    // ------------------------------------------------------------------
    {
      id: 'w10-loop',
      title: 'The AI build loop',
      subtitle: 'From your idea to live code — and the gates in between.',
      minutes: 6,
      concepts: ['ai-build-loop', 'ai-verification'],
      steps: [
        {
          kind: 'concept',
          emoji: '🎬',
          title: 'You direct. The agent builds. The gates decide.',
          what: 'With an AI coding agent, you describe what you want, the agent writes the code, and a series of checks — tests, review, your own testing — decide whether it ships.',
          why: 'The agent removes the typing, not the thinking. Fast code with no checks is just fast bugs.',
        },
        {
          kind: 'widget',
          title: 'Walk the loop',
          instruction: 'Tap every stage. Flip each to “What can go wrong?” to see how it fails.',
          render: ({ done }) => (
            <StageExplorer
              key="loop"
              onDone={done}
              stages={[
                { id: 'founder', emoji: '🧑', label: 'Founder', what: 'You decide what’s worth building and why — for which customer, solving which problem.', fail: 'Building the wrong thing perfectly. No amount of AI speed fixes a bad decision.' },
                { id: 'spec', emoji: '📝', label: 'Specification', what: 'What “done” looks like: acceptance criteria, edge cases, constraints.', fail: 'A vague spec. The agent fills every gap with a guess — confidently.' },
                { id: 'agent', emoji: '🤖', label: 'AI coding agent', what: 'Reads your codebase and the spec, makes a plan, writes the code.', fail: 'It may invent functions, take security shortcuts, or edit things you didn’t ask about.' },
                { id: 'code', emoji: '💻', label: 'Code', what: 'The actual change, on its own branch, separate from the live app.', fail: 'Works on the demo path, breaks on empty, huge or weird inputs.' },
                { id: 'tests', emoji: '🧪', label: 'Tests', what: 'Automated checks that prove the code does what the spec says.', fail: 'Tests that test nothing, or tests edited to match the bug. “All green” then means nothing.' },
                { id: 'pr', emoji: '🔀', label: 'Pull request', what: 'The proposed change, showing every line added or removed (the diff).', fail: 'A 3,000-line PR nobody can really review, so nobody does.' },
                { id: 'review', emoji: '👀', label: 'Review', what: 'A person (or a second agent) reads the diff — especially security, money and data.', fail: 'Rubber-stamp review: “Looks good!” after 30 seconds.' },
                { id: 'deploy', emoji: '🚀', label: 'Deployment', what: 'The change goes live, ideally with monitoring on and a rollback ready.', fail: 'Shipped Friday night with no monitoring. You hear about it on Monday.' },
                { id: 'ftest', emoji: '🙋', label: 'Founder testing', what: 'You use the real feature like a customer would — on your own phone.', fail: 'Skipped because “the agent said it works”.' },
              ]}
            />
          ),
        },
        {
          kind: 'widget',
          title: 'Ship six AI-built changes',
          instruction: 'Ship with every gate on. Then switch some gates off and ship again.',
          render: ({ done }) => <LoopRunner key="runner" onDone={done} />,
        },
        {
          kind: 'quiz',
          id: 'w10-loop-q1',
          context: 'You asked the agent to rename a button. Its change also quietly edited a line in the billing code.',
          prompt: 'Which stage is designed to catch that?',
          level: 2,
          concepts: ['ai-verification', 'ai-build-loop'],
          options: [
            { text: 'The spec', why: 'A spec can say “only touch this screen”, which helps — but it can’t see what the agent actually did.' },
            { text: 'Review of the pull request’s diff', correct: true, why: 'The diff lists every changed line, so an unexpected edit to billing stands out to anyone who reads it.' },
            { text: 'Founder testing', why: 'Clicking around the app probably won’t reveal a subtle billing change until invoices go out wrong.' },
            { text: 'Deployment', why: 'Deployment ships whatever it’s given. It doesn’t judge whether a change was intended.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w10-loop-q2',
          context: 'For “add dark mode”, the agent opens a pull request with 2,400 changed lines across 60 files.',
          prompt: 'What do you do?',
          level: 3,
          concepts: ['ai-build-loop', 'ai-verification'],
          options: [
            { text: 'Merge it — tests are green', why: 'Green tests prove the tested paths. Sixty files means plenty of untested places for surprises.' },
            { text: 'Ask the agent to split it into smaller PRs and explain why each file changed', correct: true, why: 'Small PRs can actually be reviewed. Asking “why did this file change?” flags unrelated edits fast.' },
            { text: 'Read all 2,400 lines yourself tonight', why: 'Heroic, but tired eyes miss things. Make the change reviewable instead of reviewing the unreviewable.' },
            { text: 'Throw it away and code it yourself', why: 'The work may be mostly fine. Splitting and reviewing keeps the speed without the risk.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w10-loop-q3',
          context: 'Your engineer says: “Our test suite is strong now. Let’s skip human review for AI pull requests.”',
          prompt: 'What’s the right response?',
          level: 4,
          concepts: ['ai-verification', 'ai-build-loop'],
          options: [
            { text: 'Agreed — tests are more reliable than people', why: 'Tests only check what someone thought to test. Review catches what nobody wrote a test for.' },
            { text: 'Never skip review on anything', why: 'Reviewing every one-word copy change wastes your scarcest resource: attention. Risk should set the bar.' },
            { text: 'Maybe for low-risk areas, but keep review for auth, payments and data — tests miss unrelated edits and hollow tests', correct: true, why: 'Tests and review catch different things. Scale review to risk: a typo fix can lean on tests; a permissions change needs eyes.' },
            { text: 'Have the same agent review its own PR instead', why: 'An agent reviewing its own work shares its own blind spots. A second, independent check is the point.' },
          ],
        },
        {
          kind: 'care',
          points: [
            'Each gate you skip moves bugs later, to where they’re more expensive — the last gate is your customers.',
            'Your highest-leverage moments are at both ends: the spec at the start, and your own testing at the end.',
            'Ask for small pull requests. Reviewable beats impressive.',
          ],
        },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'w10-strengths',
      title: 'What AI is great at — and what it gets wrong',
      subtitle: 'A brilliant, tireless, overconfident teammate.',
      minutes: 7,
      concepts: ['ai-strengths', 'ai-failure-patterns'],
      steps: [
        {
          kind: 'concept',
          emoji: '🦾',
          title: 'Superb at patterns, shaky on subtle details',
          what: 'AI agents are excellent at well-trodden work: repeating patterns, boilerplate, explanations, first drafts. They’re unreliable where details are subtle — security, money, edge cases — and at knowing what they don’t know.',
          why: 'Knowing the pattern lets you let it run where it’s strong and slow down where it’s weak, instead of trusting everything or nothing.',
        },
        {
          kind: 'widget',
          title: 'Let it run, or review closely?',
          instruction: 'Sort each task into the right bucket.',
          render: ({ done }) => (
            <Categorize
              key="cat"
              onDone={done}
              buckets={[
                { id: 'run', label: 'Let it run', emoji: '🚀' },
                { id: 'check', label: 'Review closely', emoji: '🔍' },
              ]}
              items={[
                { id: 'pages', label: 'Another settings page like the others', bucket: 'run', why: 'Following an existing pattern is where agents shine.' },
                { id: 'explain', label: 'Explain this code in plain English', bucket: 'run', why: 'Reading and summarizing is a core strength — and low risk.' },
                { id: 'draft', label: 'First draft of tests', bucket: 'run', why: 'Fast to generate; you’ll still check they test something real.' },
                { id: 'error', label: 'Fix a bug with a clear error message', bucket: 'run', why: 'A specific error points straight at the problem. Agents are quick at these.' },
                { id: 'auth', label: 'Login and permission rules', bucket: 'check', why: 'Security shortcuts are a classic agent mistake, and the cost is a data breach.' },
                { id: 'billing', label: 'Billing and discount logic', bucket: 'check', why: 'Edge cases here are real money: negative prices, double charges.' },
                { id: 'migrate', label: 'Change the shape of live data', bucket: 'check', why: 'A wrong migration can destroy customer data. Review, back up and test first.' },
                { id: 'library', label: 'Adding a new library', bucket: 'check', why: 'Agents sometimes invent package names — or pick abandoned ones.' },
              ]}
            />
          ),
        },
        {
          kind: 'points',
          title: 'Five ways agents get it wrong',
          points: [
            { term: '🎭 Confident hallucination', text: 'Inventing a function, setting or library that doesn’t exist — and describing it as if it does.' },
            { term: '🧩 Missing edge cases', text: 'Handles the normal case beautifully. Empty lists, huge numbers and declined cards: not so much.' },
            { term: '🔓 Security shortcuts', text: 'Leaving the hard check as a “TODO”, or trusting what the browser sends.' },
            { term: '🧹 Changing unrelated code', text: '“Improving” files you didn’t ask about. Those edits hide in big diffs.' },
            { term: '🫥 Tests that test nothing', text: 'Tests that always pass, whatever the code does — so “all green” proves nothing.' },
          ],
        },
        {
          kind: 'widget',
          title: 'Spot the flaws',
          instruction: 'The agent says it’s done. Tap the lines you don’t trust until you’ve found all 5 flaws.',
          render: ({ done }) => (
            <FlawHunt
              key="hunt"
              onDone={done}
              claim="Done! ✅ Added discount codes with full validation and tests."
              lines={[
                { file: 'checkout/discount.ts', code: "import { validateCoupon } from 'stripe-coupon-helpers-pro'", flaw: { name: 'Confident hallucination', why: 'This package doesn’t exist. Worse: attackers publish malware under names agents tend to invent.' } },
                { code: 'export async function applyDiscount(user, code, price) {', fine: 'Just the function’s name and inputs. Fine.' },
                { code: '  const coupon = await db.coupons.find(code)', fine: 'Looks up the coupon. Fine — though what happens if it isn’t found?' },
                { code: '  // TODO: check this coupon belongs to the user’s company', flaw: { name: 'Security shortcut', why: 'Anyone can use another company’s private codes. The hard part became a TODO — and the agent still said “done”.' } },
                { code: '  return price - coupon.amount', flaw: { name: 'Missing edge case', why: 'A $50 coupon on a $29 plan makes the price –$21. No check for expired coupons either.' } },
                { code: '}', fine: 'Just a closing bracket.' },
                { file: 'billing/invoice.ts', code: '- const TAX_RATE = 0.20', fine: 'That’s the old line being removed. Look at what replaced it.' },
                { code: '+ const TAX_RATE = 0.02', flaw: { name: 'Changed unrelated code', why: 'You asked for discounts. The agent also cut the tax rate tenfold in billing — a quiet, expensive change.' } },
                { file: 'tests/discount.test.ts', code: "test('applies discount', () => {", fine: 'The test’s name sounds right. Check what it actually checks.' },
                { code: '  expect(true).toBe(true)', flaw: { name: 'Test that tests nothing', why: 'True always equals true. This passes even if applyDiscount is deleted.' } },
                { code: '})', fine: 'Closing bracket.' },
              ]}
            />
          ),
        },
        {
          kind: 'quiz',
          id: 'w10-strengths-q1',
          context: 'An AI-written test: test(\'refund works\', () => { refund(order); expect(true).toBe(true) })',
          prompt: 'What does this test prove?',
          level: 2,
          concepts: ['ai-failure-patterns'],
          options: [
            { text: 'That refunds work', why: 'It never checks the refund’s result. It would pass if refunds sent the money to the wrong person.' },
            { text: 'Almost nothing — at most that refund() doesn’t crash', correct: true, why: 'Right. The only assertion is “true is true”. A real test checks the outcome: the order is refunded, by the right amount.' },
            { text: 'That the code is secure', why: 'Security isn’t tested here at all. Nothing is, really.' },
            { text: 'That the refund amount is correct', why: 'No amount is checked anywhere. That’s exactly what a good test would add.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w10-strengths-q2',
          context: 'You’re about to let an agent work unsupervised for two hours while you’re in meetings.',
          prompt: 'Which task is the best fit?',
          level: 3,
          concepts: ['ai-strengths', 'ai-failure-patterns'],
          options: [
            { text: 'Rewrite the billing system', why: 'Money logic is full of edge cases. That needs close, step-by-step supervision.' },
            { text: 'Build six admin pages following the pattern of the existing ones', correct: true, why: 'Repetitive work with a clear example to follow plays to the agent’s strengths, and mistakes are easy to spot afterwards.' },
            { text: 'Migrate the production database', why: 'One wrong step can destroy live customer data. Never unsupervised.' },
            { text: 'Decide next quarter’s pricing', why: 'That’s a business judgment about your customers. An agent can help analyse, but it shouldn’t decide.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w10-strengths-q3',
          context: 'The agent added a dependency called “react-auth-helpers-pro”. Your engineer looks worried.',
          prompt: 'Why?',
          level: 4,
          concepts: ['ai-failure-patterns', 'ai-strengths'],
          options: [
            { text: 'New libraries always slow the app down', why: 'Some do, many don’t. Speed isn’t the main worry with an unfamiliar package.' },
            { text: 'Agents can invent package names, and attackers publish malware under them — check it exists, is maintained and widely used', correct: true, why: 'A hallucinated name is a supply-chain risk: someone can register it with malicious code. Every new dependency deserves a quick sanity check.' },
            { text: 'Packages with “pro” in the name cost money', why: 'Names don’t determine price. The real question is whether it’s real and trustworthy.' },
            { text: 'Agents shouldn’t ever add libraries', why: 'Reusing good libraries is normal and healthy. The point is to verify, not forbid.' },
          ],
        },
        {
          kind: 'care',
          points: [
            'Use agents boldly for pattern work, drafts and explanations — that’s where the speed is.',
            'Slow down on auth, payments, data changes and new dependencies. That’s where the expensive mistakes are.',
            'Read the diff for the five patterns: invented things, missing edge cases, TODO security, unrelated edits, hollow tests.',
          ],
        },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'w10-specs',
      title: 'Specs: the founder’s superpower',
      subtitle: 'Same agent, better instructions, far better software.',
      minutes: 8,
      concepts: ['ai-specs', 'acceptance-criteria'],
      steps: [
        {
          kind: 'concept',
          emoji: '📝',
          title: 'A spec is “done”, written down',
          what: 'A spec turns a wish (“let users invite teammates”) into checkable statements: what must be true, which edge cases matter, and what’s off-limits.',
          why: 'An agent fills every gap in your request with a guess — confidently. A good spec removes the guessing, and it’s the cheapest quality tool you have.',
        },
        {
          kind: 'widget',
          title: 'Improve the spec',
          instruction: 'Build it once as-is. Then add spec lines and build again until at least 5 of 6 problems are fixed.',
          render: ({ done }) => <SpecBuilder key="spec" onDone={done} />,
        },
        {
          kind: 'points',
          title: 'The parts of a good spec',
          points: [
            { term: '✅ Acceptance criteria', text: 'Statements you can check with a yes/no: “Invite links expire after 7 days.”' },
            { term: '🧩 Edge cases', text: 'The unusual-but-real situations: already a member, invited twice, plan limit reached.' },
            { term: '🚧 Constraints', text: 'Rules and boundaries: who’s allowed, what not to touch, limits by plan.' },
            { term: '🚫 Out of scope', text: 'What this change is NOT. Stops the agent “helpfully” redesigning other pages.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w10-specs-q1',
          prompt: 'Which line is a real acceptance criterion?',
          level: 2,
          concepts: ['acceptance-criteria', 'ai-specs'],
          options: [
            { text: 'Make the export fast and easy', why: 'How fast? Easy for whom? Nobody can check this with a yes or no.' },
            { text: 'Users can download their projects as a CSV with name, status and created date', correct: true, why: 'Specific and checkable: you can open the file and see if those columns are there.' },
            { text: 'Use clean code', why: 'A nice wish, but it says nothing about what the feature must do.' },
            { text: 'It should delight users', why: 'A goal, not a criterion. Nothing here tells the agent — or you — when it’s done.' },
          ],
        },
        {
          kind: 'widget',
          title: 'Spec drill: “Delete my account”',
          instruction: 'Sort each line into the part of the spec it belongs to.',
          render: ({ done }) => (
            <Categorize
              key="spec-sort"
              onDone={done}
              buckets={[
                { id: 'accept', label: 'Acceptance', emoji: '✅' },
                { id: 'edge', label: 'Edge case', emoji: '🧩' },
                { id: 'constraint', label: 'Constraint', emoji: '🚧' },
                { id: 'vague', label: 'Too vague', emoji: '☁️' },
              ]}
              items={[
                { id: 'a1', label: 'Deleted users can’t log in; their data is gone within 30 days', bucket: 'accept', why: 'Checkable: try to log in, check the data after 30 days.' },
                { id: 'a2', label: 'Tests cover: owner deletes, member deletes, undo within 7 days', bucket: 'accept', why: 'It names exactly which behaviors must be proven.' },
                { id: 'e1', label: 'What if they’re the only admin of a team?', bucket: 'edge', why: 'Rare but real — the team could be left with nobody in charge.' },
                { id: 'e2', label: 'What if they have an active paid subscription?', bucket: 'edge', why: 'Forgetting this means charging a deleted account.' },
                { id: 'c1', label: 'Must re-enter their password first', bucket: 'constraint', why: 'A rule that limits how the feature can work, for safety.' },
                { id: 'c2', label: 'Don’t change the billing code', bucket: 'constraint', why: 'A boundary on what the agent may touch.' },
                { id: 'v1', label: 'Make it user-friendly', bucket: 'vague', why: 'Nobody can check it. Replace it with a specific behavior.' },
                { id: 'v2', label: 'Handle everything properly', bucket: 'vague', why: '“Everything” and “properly” leave the agent to guess.' },
              ]}
            />
          ),
        },
        {
          kind: 'quiz',
          id: 'w10-specs-q2',
          context: 'Mid-task, the agent asks: “While I’m adding invites, should I also refactor the user settings page? It’s a bit messy.”',
          prompt: 'What’s the best answer?',
          level: 3,
          concepts: ['ai-specs', 'acceptance-criteria'],
          options: [
            { text: 'Sure — it’s already in there', why: 'Now one change does two things, the diff doubles, and a bug in either blocks both.' },
            { text: 'No. Keep this change to invites; note the refactor as a separate task', correct: true, why: 'One change, one purpose. Small, focused changes are easier to review, test and roll back.' },
            { text: 'Yes, but don’t tell me about it', why: 'Hidden changes are how unrelated code breaks without anyone noticing.' },
            { text: 'Refactor everything while you’re at it', why: 'That’s a giant, unreviewable diff. You’d lose control of what’s changing.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w10-specs-q3',
          context: 'Your engineer argues: “Writing detailed specs is slower than letting the agent try and iterating.”',
          prompt: 'When are they right?',
          level: 4,
          concepts: ['ai-specs', 'acceptance-criteria'],
          options: [
            { text: 'Always — agents are fast enough to iterate on anything', why: 'Iterating works when mistakes are visible. A missing permission check looks perfect in the demo.' },
            { text: 'Never — everything needs a full spec', why: 'For a button color, a full spec is overhead. Match effort to risk.' },
            { text: 'For small, visible, low-risk changes; for money, permissions or data, a spec is cheaper than finding the problems later', correct: true, why: 'If you’ll see the mistake instantly, iterate. If a mistake would be invisible until a customer finds it, write it down first.' },
            { text: 'Only when the agent is a cheaper model', why: 'Better models still guess when the request is ambiguous. The spec is about your intent, not the model’s skill.' },
          ],
        },
        {
          kind: 'care',
          points: [
            'Your product judgment lives in the spec. Fifteen minutes of writing saves days of rework.',
            'Swap vague words for checkable ones: not “secure”, but “only admins can invite, enforced on the server”.',
            'Always add a line on what NOT to touch. It’s the cheapest guard against surprise changes.',
          ],
        },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'w10-interrogate',
      title: 'Interrogating your AI agent',
      subtitle: 'Three conversations. Find the gaps before customers do.',
      minutes: 10,
      concepts: ['agent-questions', 'demand-evidence'],
      steps: [
        {
          kind: 'concept',
          emoji: '🕵️',
          title: 'Confidence is not evidence',
          what: 'Agents report their work in confident summaries — whether it’s right, half-done, or not done at all. Your job is to ask questions that can only be answered with specifics.',
          why: 'An agent can’t warn you about gaps it never thought of. A precise question makes it look; a request for evidence makes it prove.',
        },
        {
          kind: 'widget',
          title: 'Conversation 1: “Secure authentication”',
          instruction: 'You get 5 follow-up questions. Expose as many gaps as you can.',
          render: ({ done }) => (
            <AgentChat
              key="chat-auth"
              onDone={done}
              setup="You asked the agent to add accounts to your app: sign-up, login and password reset."
              claim="✅ I’ve implemented secure authentication. Users can sign up, log in and reset their password."
              questions={AUTH_CHAT}
              budget={5}
            />
          ),
        },
        {
          kind: 'points',
          title: 'Questions that work',
          points: [
            { term: '📍 Ask where', text: '“Where is this enforced? Which file?” Forces the agent to look instead of reassure.' },
            { term: '🖐️ Ask to see it', text: '“Show me the diff / the test / the output.” Evidence beats summaries.' },
            { term: '🌧️ Ask about the unhappy path', text: '“What happens if the card is declined, the list is empty, the provider is down?”' },
            { term: '🙅 Avoid yes/no and self-grading', text: '“Is it secure?” and “Are the tests good?” always get “Yes.”' },
          ],
        },
        {
          kind: 'widget',
          title: 'Conversation 2: “All tests pass”',
          instruction: 'You get 4 questions. Find out what “all tests pass” really means.',
          render: ({ done }) => (
            <AgentChat
              key="chat-tests"
              onDone={done}
              setup="You asked for annual plans with 2 months free. The agent is reporting back."
              claim="Done! Annual pricing is live and ✅ all tests pass."
              questions={TESTS_CHAT}
              budget={4}
            />
          ),
        },
        {
          kind: 'quiz',
          id: 'w10-interrogate-q1',
          context: 'The agent says: “I’ve added permissions so only admins can delete projects.”',
          prompt: 'Which follow-up is strongest?',
          level: 2,
          concepts: ['agent-questions'],
          options: [
            { text: 'Great, does it work?', why: 'A yes/no question gets “Yes!” — and you learn nothing new.' },
            { text: 'Show me where the server checks the user is an admin, and the test where a non-admin tries to delete', correct: true, why: 'It asks for the exact location and for proof of the failure case. Either the agent shows both, or you’ve found a gap.' },
            { text: 'Is it secure?', why: 'Self-grading. The agent will say it is.' },
            { text: 'Did you follow best practices?', why: 'Too vague to check, so you get a vague “absolutely”.' },
          ],
        },
        {
          kind: 'widget',
          title: 'Conversation 3: “All done!”',
          instruction: 'You get 3 questions. Check whether the work actually happened.',
          render: ({ done }) => (
            <AgentChat
              key="chat-phantom"
              onDone={done}
              setup="You asked for two things: fix the pricing page on phones, and send a welcome email when someone signs up."
              claim="All done! 🎉 I fixed the mobile layout on the pricing page and added the welcome email on sign-up."
              questions={PHANTOM_CHAT}
              budget={3}
            />
          ),
        },
        {
          kind: 'widget',
          title: 'Match the claim to the evidence',
          instruction: 'Tap a claim, then the evidence that would prove it.',
          render: ({ done }) => (
            <Matcher
              key="evidence"
              onDone={done}
              leftTitle="The agent says"
              rightTitle="Ask to see"
              pairs={[
                { id: 'mobile', left: '“I fixed the layout on mobile.”', right: 'A screenshot at phone width' },
                { id: 'tests', left: '“All tests pass.”', right: 'The full test output, including skipped tests' },
                { id: 'scope', left: '“I only changed the login file.”', right: 'The diff: the list of files changed' },
                { id: 'fast', left: '“It’s much faster now.”', right: 'Before/after timings on realistic data' },
                { id: 'private', left: '“Users can’t see each other’s data.”', right: 'A test where user A tries to read user B’s data — and fails' },
              ]}
            />
          ),
        },
        {
          kind: 'quiz',
          id: 'w10-interrogate-q2',
          context: 'The agent says: “I fixed the bug where some customers were charged twice.” Real money is involved.',
          prompt: 'What do you ask for before merging?',
          level: 3,
          concepts: ['demand-evidence', 'agent-questions'],
          options: [
            { text: 'Nothing — it said it’s fixed', why: 'A confident summary is not proof. Double charges are exactly where you want proof.' },
            { text: 'The root cause, the diff, and a test that reproduces the double charge and now passes', correct: true, why: 'Root cause shows it understood the bug. The test proves the fix and stops the bug coming back silently.' },
            { text: 'Ask it “Are you sure?”', why: 'You’ll get a more confident yes. Ask for something you can check.' },
            { text: 'Merge and watch for complaints', why: 'That makes customers your test suite — and they’re being charged twice while you wait.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w10-interrogate-q3',
          context: 'You can’t deeply interrogate every change — the agent ships 20 a week.',
          prompt: 'How should you spend your scrutiny?',
          level: 4,
          concepts: ['demand-evidence', 'agent-questions'],
          options: [
            { text: 'Evenly: the same quick look at every change', why: 'A quick look at a permissions change misses the dangerous stuff; a quick look at copy changes is plenty.' },
            { text: 'Scale it to risk: money, permissions, personal data and deletions get diff + tests + proof; copy and color tweaks get a glance', correct: true, why: 'Evidence costs time, so spend it where a mistake is expensive or invisible. That’s how strong engineering leads triage too.' },
            { text: 'Only check the biggest pull requests', why: 'Size isn’t risk. A one-line change to a permission check can be the most dangerous of the week.' },
            { text: 'Have the agent rate each change’s risk and trust that', why: 'Useful as a hint, but the agent rating its own work shares its own blind spots. You set the rules for what counts as risky.' },
          ],
        },
        {
          kind: 'care',
          points: [
            'You don’t need to write code to lead an agent well. You need to ask “where?”, “show me”, and “what happens when it fails?”',
            'If it isn’t in the diff, it didn’t happen. If it wasn’t run, it isn’t verified.',
            'Demand evidence in proportion to risk: money, permissions, personal data and deletions always.',
          ],
        },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'w10-ready',
      title: '“It works” vs. production-ready',
      subtitle: 'The demo is the easy part.',
      minutes: 7,
      concepts: ['production-ready', 'ai-verification'],
      steps: [
        {
          kind: 'concept',
          emoji: '🎪',
          title: 'Works on my laptop ≠ ready for customers',
          what: '“It works” usually means the main path works, with test data, on one machine. Production-ready means it keeps working with real users, real data, attackers, outages and mistakes.',
          why: 'Customers don’t stay on the demo path. They hit edge cases and slow networks, and they trust you with their data and money.',
        },
        {
          kind: 'widget',
          title: 'Five days to launch',
          instruction: 'Pick up to 5 things to harden, then launch and live through the first two weeks.',
          render: ({ done }) => <ReadinessCheck key="ready" onDone={done} />,
        },
        {
          kind: 'points',
          title: 'What the demo never shows you',
          points: [
            { term: '👥 Real users', text: 'They double-click, use old phones, paste emoji into every field, and leave things empty.' },
            { term: '🐘 Real data', text: '10,000 rows instead of 10. Slow queries only show up at real size.' },
            { term: '🌩️ Real failures', text: 'Providers time out, deploys break, someone runs the wrong migration.' },
            { term: '🦹 Real attackers', text: 'Bots try passwords, scrape keys and change IDs in URLs — from day one.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w10-ready-q1',
          prompt: 'When an agent (or a developer) says “it works”, what has usually been shown?',
          level: 2,
          concepts: ['production-ready'],
          options: [
            { text: 'That it handles real users, data and failures', why: 'That’s production-ready — a much bigger claim that needs much more evidence.' },
            { text: 'That the main path works, with test data, on one machine', correct: true, why: 'Right. Useful, but it says nothing about edge cases, scale, security or what happens when things fail.' },
            { text: 'That it’s secure', why: 'Security is almost never shown by a working demo. Missing checks are invisible on the happy path.' },
            { text: 'That it has been reviewed', why: 'Working and reviewed are separate facts. Ask about each.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w10-ready-q2',
          context: 'The agent announces: “The app is production-ready! 🚀”',
          prompt: 'What do you ask for?',
          level: 3,
          concepts: ['production-ready', 'ai-verification'],
          options: [
            { text: 'Nothing — time to launch', why: '“Production-ready” is a claim, not evidence. Every incident in the drill came from an app that “worked”.' },
            { text: 'A checklist with evidence: permission checks, secrets, backups and a tested restore, monitoring, error handling', correct: true, why: 'Each item gets a concrete proof — a file, a test, a dashboard, a restore log. Anything without proof isn’t done.' },
            { text: 'Ask it to double-check everything', why: 'It will say it did. Ask for specific things you can look at.' },
            { text: 'Run the demo one more time', why: 'The demo was never the problem. It only exercises the happy path.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w10-ready-q3',
          context: 'A private beta with 15 friendly customers starts next week. You have time to harden 3 things.',
          prompt: 'Which three?',
          level: 4,
          concepts: ['production-ready', 'ai-verification'],
          options: [
            { text: 'Rate limiting, load testing, faster search', why: 'With 15 friendly users, bots and scale aren’t your first risk. Leaking or losing their data is.' },
            { text: 'Server-side permission checks, secrets out of code, backups with a tested restore', correct: true, why: 'Data leaks, stolen keys and lost data are the irreversible ones — even at 15 users. Speed and scale can wait for growth.' },
            { text: 'A prettier error page, dark mode, onboarding tour', why: 'Nice for delight, but none prevents an incident that breaks trust.' },
            { text: 'Nothing — it’s only a beta', why: 'Beta users still trust you with real data. “Beta” excuses rough edges, not leaks.' },
          ],
        },
        {
          kind: 'care',
          points: [
            'Harden in order of what’s irreversible: leaked data, lost data and stolen money first; polish and scale later.',
            'Ask “what happens when…?” for every critical path: the provider is down, the input is empty, the user isn’t allowed.',
            'Launch readiness is a checklist with proof — not a feeling, and not an agent’s announcement.',
          ],
        },
      ],
    },
  ],
}

export default world
