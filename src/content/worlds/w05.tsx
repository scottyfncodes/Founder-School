import type { World } from '../../lib/types'
import { CommitGraph } from '../../widgets/CommitGraph'
import { GitPipeline } from '../../widgets/GitPipeline'
import { PRReview } from '../../widgets/PRReview'
import { TestBench } from '../../widgets/TestBench'
import { StageExplorer } from '../../widgets/StageExplorer'
import { Categorize } from '../../widgets/Categorize'

const world: World = {
  id: 'w5',
  num: 5,
  title: 'Code + GitHub',
  tagline: 'How changes travel safely from idea to live app.',
  emoji: '🌿',
  color: '#2f9e44',
  skill: 'tech',
  concepts: [
    { id: 'commits', name: 'Commits & history' },
    { id: 'branches', name: 'Branches' },
    { id: 'merge-conflicts', name: 'Merging & merge conflicts' },
    { id: 'ci-pipeline', name: 'CI: automated checks' },
    { id: 'deploy-rollback', name: 'Rollbacks' },
    { id: 'pull-requests', name: 'Pull requests & code review' },
    { id: 'test-types', name: 'Unit, integration & end-to-end tests' },
    { id: 'test-limits', name: 'What tests can’t prove' },
  ],
  lessons: [
    // ------------------------------------------------------------------ w5-git
    {
      id: 'w5-git',
      title: 'Commits, branches & history',
      subtitle: 'A time machine for your code. Drive it yourself.',
      minutes: 6,
      concepts: ['commits', 'branches'],
      unlocks: ['github'],
      steps: [
        {
          kind: 'concept',
          emoji: '🌿',
          title: 'Git: a time machine for code',
          what: 'Git records every change to your code as a commit — a save point with a label, an author and a time. GitHub stores that history online so a team (and your AI agent) can share it.',
          why: 'Without history, one bad change can wreck a working app with no way back. With it, you can see who changed what, when — and undo it.',
        },
        {
          kind: 'widget',
          title: 'Drive Git yourself',
          instruction: 'Commit on main, start a branch, commit on it (watch main stay untouched), then merge. Tap any commit to time-travel.',
          render: ({ done }) => <CommitGraph onDone={done} />,
        },
        {
          kind: 'points',
          title: 'The vocabulary',
          points: [
            { term: '📦 Repository (repo)', text: 'The folder of code plus its entire history. On GitHub, it’s the project page.' },
            { term: '📌 Commit', text: 'One saved change with a message like “Fix typo on login page”. Small commits are easy to understand and undo.' },
            { term: '🌳 main', text: 'The official branch — usually the version that’s live for customers.' },
            { term: '🌿 Branch', text: 'A parallel copy for working on something without disturbing main.' },
            { term: '🔀 Merge', text: 'Bringing a branch’s commits back into main once they’re ready.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w5-git-q1',
          context: 'The app worked this morning. After six commits today, signup is broken.',
          prompt: 'What does Git make possible?',
          level: 2,
          concepts: ['commits'],
          options: [
            { text: 'Nothing — once code changes, the old version is gone', why: 'That’s life without Git. With Git, every commit is a full snapshot you can return to.' },
            { text: 'Look through today’s commits to find which one broke signup, and undo just that one', correct: true, why: 'Each commit is a small, labelled change. Finding “the commit that broke it” is one of Git’s superpowers.' },
            { text: 'Automatically fix the bug', why: 'Git records changes; it doesn’t understand them. It helps you find and undo, not fix.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w5-git-q2',
          context: 'Your developer wants to try a risky redesign of checkout. It could take two weeks.',
          prompt: 'Where should that work happen?',
          level: 3,
          concepts: ['branches'],
          options: [
            { text: 'Directly on main, so customers see progress', why: 'Half-finished work on main means half-finished checkout for paying customers. And urgent fixes get tangled up with it.' },
            { text: 'On its own branch, merged into main only when it’s reviewed and ready', correct: true, why: 'Main stays shippable the whole time. If the redesign fails, you just don’t merge it.' },
            { text: 'In a copy of the code on the developer’s laptop, not in Git', why: 'Then there’s no history, no backup and no review. One lost laptop and two weeks are gone.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w5-git-q3',
          context: 'Your app’s GitHub repository lives in a freelancer’s personal GitHub account.',
          prompt: 'What should you do?',
          level: 3,
          concepts: ['commits', 'branches'],
          options: [
            { text: 'Nothing — as long as you can see the code', why: 'Seeing isn’t owning. If they leave or delete their account, your product’s entire history goes with them.' },
            { text: 'Move it to a GitHub organization the company owns, with you as an owner', correct: true, why: 'The code and its history are company assets. A company-owned organization survives any one person leaving.' },
            { text: 'Download a zip of the code every month', why: 'Better than nothing, but you lose the history, pull requests and automation — and you’re still not in control.' },
          ],
        },
        {
          kind: 'care',
          points: [
            'Your repository is your product. Make sure the company owns it, not a person.',
            'Good commit history is how you answer “when did this break, and why?” in minutes instead of days.',
            'Branches let you experiment without risking paying customers. Ask for big changes to live on one.',
          ],
        },
      ],
    },

    // ------------------------------------------------------------------ w5-pipeline
    {
      id: 'w5-pipeline',
      title: 'From code to live app',
      subtitle: 'Eight stages from laptop to customers — and what breaks at each.',
      minutes: 10,
      concepts: ['ci-pipeline', 'merge-conflicts', 'deploy-rollback'],
      unlocks: ['cicd'],
      steps: [
        {
          kind: 'concept',
          emoji: '🏭',
          title: 'An assembly line for changes',
          what: 'Every change travels the same path: written, committed, put on a branch, proposed as a pull request, checked by robots (CI), merged, deployed, live.',
          why: 'Each stage is a gate that catches a different kind of mistake before customers do. Skipping gates is how “quick fixes” become outages.',
        },
        {
          kind: 'widget',
          title: 'Walk the pipeline',
          instruction: 'Tap each stage. Where offered, flip to “What can go wrong here?”.',
          render: ({ done }) => (
            <StageExplorer
              onDone={done}
              stages={[
                { id: 'code', emoji: '💻', label: 'Working code', what: 'A developer (or AI agent) changes code on their own computer and tries it locally.', fail: '“Works on my machine” — their computer has settings or data that production doesn’t.' },
                { id: 'commit', emoji: '📌', label: 'Commit', what: 'The change is saved as a labelled snapshot in Git.', fail: 'Giant commits mixing ten changes are impossible to review or undo cleanly.' },
                { id: 'branch', emoji: '🌿', label: 'Branch', what: 'The commit lives on a branch, away from main, and is pushed to GitHub.' },
                { id: 'pr', emoji: '🔀', label: 'Pull request', what: 'A request to merge the branch into main — with a description and the exact lines changed, for review.', fail: 'Reviewers skim and click Approve. Then the PR is just a ritual.' },
                { id: 'ci', emoji: '🤖', label: 'CI tests', what: 'Continuous Integration: robots build the code and run every automated test on every change.', fail: 'Tests fail → merge blocked. Good! That’s the gate working.' },
                { id: 'merge', emoji: '🧩', label: 'Merge', what: 'Approved and green, the branch joins main.', fail: 'Merge conflict: two people changed the same lines. A human must choose.' },
                { id: 'deploy', emoji: '🚀', label: 'Deploy', what: 'The new version is built and shipped to the servers, usually automatically after merge.', fail: 'The new version won’t start (missing setting, bad config). Good platforms keep the old one running.' },
                { id: 'live', emoji: '🌍', label: 'Live app', what: 'Customers are using the new version.', fail: 'A bug got past every gate. Roll back first, investigate second.' },
              ]}
            />
          ),
        },
        {
          kind: 'widget',
          title: 'Now break it',
          instruction: 'Run each ⚠️ scenario and fix it: failing tests, a merge conflict, a failed deploy and a bad change in production.',
          render: ({ done }) => <GitPipeline onDone={done} />,
        },
        {
          kind: 'points',
          title: 'What you just handled',
          points: [
            { term: '🤖 CI (Continuous Integration)', text: 'Automatic checks on every change. A red CI run blocks the merge, so the bug never ships.' },
            { term: '🧩 Merge conflict', text: 'Two changes touched the same lines. Not an error — a question Git can’t answer alone.' },
            { term: '⏪ Rollback', text: 'Switching production back to the last good version. Fast, boring and safe.' },
            { term: '🔧 Fix forward', text: 'Shipping a new fix instead of rolling back. Fine for small bugs; risky under pressure.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w5-pipeline-q1',
          prompt: 'CI tests fail on a pull request. What happens to customers?',
          level: 2,
          concepts: ['ci-pipeline'],
          options: [
            { text: 'They see the bug until it’s fixed', why: 'CI runs before merge and deploy. The broken change never got near production.' },
            { text: 'Nothing — the change is blocked until it’s fixed and the tests pass', correct: true, why: 'That’s the whole point of CI: catch problems while they’re cheap and invisible to customers.' },
            { text: 'The live app goes down', why: 'A failing check on a branch doesn’t touch the live app. Production keeps running the last version.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w5-pipeline-q2',
          context: 'Friday 5pm. A release just went out and checkout is failing for some customers. Your developer: “I think I see the bug — give me an hour to fix it.”',
          prompt: 'What do you say?',
          level: 3,
          concepts: ['deploy-rollback'],
          options: [
            { text: '“Go for it — fix it properly.”', why: 'That’s an hour of lost orders, and a rushed fix under pressure can break something else.' },
            { text: '“Roll back to the previous version now, then fix it calmly.”', correct: true, why: 'Rollback restores a known-good state in minutes. Customers stop hurting immediately, and the fix gets a proper review and test.' },
            { text: '“Turn the whole site off until Monday.”', why: 'Far worse than the bug. A rollback keeps everything else working.' },
            { text: '“Post on social media to warn customers.”', why: 'Communication matters, but first stop the damage. Rolling back may make the announcement unnecessary.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w5-pipeline-q3',
          context: 'Your two developers each work on a branch for 3 weeks. Every merge is a painful day of conflicts and surprise bugs.',
          prompt: 'What’s the best change — and its cost?',
          level: 4,
          concepts: ['merge-conflicts', 'ci-pipeline', 'branches'],
          options: [
            { text: 'Merge small pieces daily, hiding unfinished features behind a switch (a feature flag). Cost: some discipline and flag clean-up', correct: true, why: 'Small, frequent merges mean small conflicts. Feature flags let half-done work sit safely in main, switched off.' },
            { text: 'Let one developer work at a time', why: 'It removes conflicts by halving your team’s speed. A very expensive fix.' },
            { text: 'Turn off CI so merges go faster', why: 'Removes the safety net exactly when merges are risky. The surprise bugs would reach customers instead.' },
            { text: 'Use longer branches so merges happen less often', why: 'Longer branches drift further apart, which makes each merge worse, not better.' },
          ],
        },
        {
          kind: 'care',
          points: [
            'A working pipeline means you can ship many times a day with confidence. That speed compounds.',
            'Ask: “How long does a rollback take, and when did we last do one?” The answer should be minutes.',
            'Red CI is a feature, not a nuisance. Never let anyone (or any AI agent) merge past it “just this once”.',
          ],
        },
      ],
    },

    // ------------------------------------------------------------------ w5-pr
    {
      id: 'w5-pr',
      title: 'Why pull requests exist',
      subtitle: 'A second pair of eyes — and what a founder should look for.',
      minutes: 7,
      concepts: ['pull-requests'],
      steps: [
        {
          kind: 'concept',
          emoji: '🔀',
          title: 'A pull request: “please check this before it goes in”',
          what: 'A pull request (PR) proposes merging a branch into main. It shows a description and the diff — exactly which lines were added and removed — so someone can review it.',
          why: 'The person who wrote a change is the worst at spotting its problems. PRs add a second look, a record of why changes were made, and a gate for automated checks.',
        },
        {
          kind: 'widget',
          title: 'Review an AI agent’s pull request',
          instruction: 'Read the diff. Tap every line that worries you, then make your call.',
          render: ({ done }) => <PRReview onDone={done} />,
        },
        {
          kind: 'points',
          title: 'What a founder looks for (no coding needed)',
          points: [
            { term: '📝 Does it do what it says?', text: 'Compare the description to the files changed. Surprises (“why is billing in a typo fix?”) deserve a question.' },
            { term: '🔥 Scary areas', text: 'Logins, permissions, payments, deleting data, secrets. Changes there deserve a slower read.' },
            { term: '➖ Removed lines', text: 'Deleted checks are easy to miss. Red lines in auth code are worth asking about.' },
            { term: '🧪 Tests', text: 'New behaviour should come with new tests — including “the wrong person is refused”.' },
            { term: '📏 Size', text: 'Under ~400 changed lines can be reviewed properly. 4,000 lines gets a skim and a rubber stamp.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w5-pr-q1',
          prompt: 'If an AI agent writes all the code, why still use pull requests?',
          level: 2,
          concepts: ['pull-requests'],
          options: [
            { text: 'You don’t need them — AI doesn’t make mistakes', why: 'AI agents make confident mistakes, like the deleted admin check you just found.' },
            { text: 'They give a checkpoint where tests run and a human sees exactly what changed before it reaches customers', correct: true, why: 'The PR is where the evidence lives: the diff, the CI results, the discussion. It’s your control point over the agent.' },
            { text: 'GitHub requires them for every change', why: 'It doesn’t — you can push straight to main. Teams choose PRs because of what they catch.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w5-pr-q2',
          context: 'A PR arrives: “Refactor + new billing + fix login bug”. 4,200 lines changed across 61 files.',
          prompt: 'What’s the best response?',
          level: 3,
          concepts: ['pull-requests'],
          options: [
            { text: 'Approve — the tests pass', why: 'Tests only check what someone thought to test. Nobody can truly review 4,200 lines, so problems hide in there.' },
            { text: 'Ask for it to be split: login fix, refactor and billing as separate PRs', correct: true, why: 'Small PRs get real reviews, can be shipped (and rolled back) independently, and the urgent login fix isn’t stuck behind billing.' },
            { text: 'Review only the first 200 lines carefully', why: 'Problems don’t politely sit at the top. The billing logic could be anywhere.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w5-pr-q3',
          context: 'You’re a solo founder with an AI agent. Reviewing every PR in full takes hours you don’t have.',
          prompt: 'What’s a sensible review policy?',
          level: 4,
          concepts: ['pull-requests', 'ci-pipeline'],
          options: [
            { text: 'Skip reviews entirely and rely on CI', why: 'CI only knows what tests exist. A deleted permission check with no test would sail through.' },
            { text: 'Let CI gate everything; skim small, low-risk PRs; read slowly — or get an outside engineer — for auth, payments, data deletion and secrets', correct: true, why: 'Match review effort to risk. Most bugs are cheap; a handful of areas can sink the company.' },
            { text: 'Review every line of every PR yourself', why: 'Admirable but unsustainable — and you’ll start rubber-stamping out of fatigue, which is worse.' },
          ],
        },
        {
          kind: 'care',
          points: [
            'You don’t need to read code fluently to ask good questions in a PR: “What’s this deleted line for? Where’s the test?”',
            'Require PRs and green CI to merge into main — GitHub can enforce it, even for you and your AI agent.',
            'PR history is also your audit trail: who changed what, why, and who approved it.',
          ],
        },
      ],
    },

    // ------------------------------------------------------------------ w5-tests
    {
      id: 'w5-tests',
      title: 'What tests prove (and don’t)',
      subtitle: 'All tests pass. A customer still got overcharged.',
      minutes: 8,
      concepts: ['test-types', 'test-limits'],
      steps: [
        {
          kind: 'concept',
          emoji: '🧪',
          title: 'Tests: code that checks code',
          what: 'An automated test runs a piece of your app with a known input and checks the output: “a $100 order with SAVE10 costs $90”. CI runs hundreds of them on every change.',
          why: 'Clicking through the whole app by hand after every change is slow and gets skipped. Tests check the same things, every time, in seconds.',
        },
        {
          kind: 'points',
          title: 'Three sizes of test',
          points: [
            { term: '🔬 Unit test', text: 'Checks one small piece alone, like the discount calculation. Fast and precise; blind to how pieces fit together.' },
            { term: '🔗 Integration test', text: 'Checks pieces working together, like the API saving an order to a real test database.' },
            { term: '🧑‍💻 End-to-end (E2E) test', text: 'A robot uses the app like a customer: open, sign up, buy. Closest to reality; slower and more fragile.' },
          ],
        },
        {
          kind: 'widget',
          title: 'Which kind of test?',
          instruction: 'Sort each test into the right size.',
          render: ({ done }) => (
            <Categorize
              onDone={done}
              buckets={[
                { id: 'unit', label: 'Unit', emoji: '🔬' },
                { id: 'int', label: 'Integration', emoji: '🔗' },
                { id: 'e2e', label: 'End-to-end', emoji: '🧑‍💻' },
              ]}
              items={[
                { id: 'a', label: 'applyDiscount(100, "SAVE10") returns 90', bucket: 'unit', why: 'One function, in isolation. A classic unit test.' },
                { id: 'b', label: 'POST /orders saves a row in the test database', bucket: 'int', why: 'The API and database working together.' },
                { id: 'c', label: 'A robot browser signs up, verifies email and logs in', bucket: 'e2e', why: 'The whole journey, the way a real person does it.' },
                { id: 'd', label: 'formatPrice(1999) shows “$19.99”', bucket: 'unit', why: 'A single small function with a clear answer.' },
                { id: 'e', label: 'A USER calling the admin API gets 403', bucket: 'int', why: 'Checks the API, the login session and the permission rule together.' },
                { id: 'f', label: 'A robot adds to cart and completes checkout', bucket: 'e2e', why: 'Clicks through real screens, start to finish.' },
              ]}
            />
          ),
        },
        {
          kind: 'concept',
          emoji: '✅',
          title: '“All tests pass” ≠ “it works”',
          what: 'A passing test suite proves the app does what the tests check — nothing more. Anything nobody thought to test is unchecked, however green the screen looks.',
          why: 'AI agents love to report “all tests pass”. Sometimes they even wrote the tests to match the bug. Green is evidence, not proof.',
        },
        {
          kind: 'widget',
          title: 'Green tests, real bug',
          instruction: 'Run the tests, ship, watch real orders — then add the test that would have caught the bug.',
          render: ({ done }) => <TestBench onDone={done} />,
        },
        {
          kind: 'quiz',
          id: 'w5-tests-q1',
          prompt: 'Which test best catches “new customers can’t finish signing up”?',
          level: 2,
          concepts: ['test-types'],
          options: [
            { text: 'A unit test of the email-format checker', why: 'That checks one small piece. Signup could still break in a dozen other places.' },
            { text: 'An end-to-end test that signs up like a real person', correct: true, why: 'Only a test that walks the whole journey notices when any step in it breaks.' },
            { text: 'A test that the database is reachable', why: 'Useful, but signup can fail with a perfectly healthy database.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w5-tests-q2',
          context: 'Your AI agent: “Implemented refunds. All 212 tests pass ✅.”',
          prompt: 'What’s the most useful follow-up?',
          level: 3,
          concepts: ['test-limits'],
          options: [
            { text: '“Great, ship it.”', why: 'The 212 tests might not touch refunds at all. Green says nothing about code no test exercises.' },
            { text: '“Which tests cover refunds? Show me one for a partial refund and one for refunding twice.”', correct: true, why: 'You’re asking for evidence about the new behaviour — including the nasty edge cases where money goes wrong.' },
            { text: '“Run the tests again to be sure.”', why: 'Running the same tests again gives the same answer. The question is what they check.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w5-tests-q3',
          context: 'An engineer proposes a rule: 100% test coverage (every line run by some test) before any merge.',
          prompt: 'What’s the honest tradeoff?',
          level: 4,
          concepts: ['test-limits', 'test-types'],
          options: [
            { text: 'Great rule — 100% coverage means no bugs', why: 'Coverage shows a line RAN during a test, not that its result was checked. Cleo’s bug lived on a fully covered line.' },
            { text: 'It slows every change and invites box-ticking tests; better to require strong tests where mistakes are costly — money, permissions, data — plus a few end-to-end journeys', correct: true, why: 'Test effort is a budget. Spend it where a bug would hurt most, and always add a test when a real bug is found.' },
            { text: 'Tests are a waste for a startup', why: 'Without tests, every change is a gamble, and you slow down as fear grows. The question is which tests, not whether.' },
          ],
        },
        {
          kind: 'care',
          points: [
            'Tests are what let you (and your AI agent) change code quickly without breaking yesterday’s work.',
            'Every real bug should leave behind a test, so it can never quietly come back.',
            'When someone says “all tests pass”, ask “do any tests cover the thing we just changed?”',
          ],
        },
      ],
    },
  ],
}

export default world
