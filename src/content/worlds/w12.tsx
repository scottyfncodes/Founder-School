import type { World } from '../../lib/types'
import { Categorize } from '../../widgets/Categorize'
import { KeyAudit } from '../../widgets/KeyAudit'
import { TrustInbox } from '../../widgets/TrustInbox'
import { ScaleDial } from '../../widgets/ScaleDial'
import { DebtSim } from '../../widgets/DebtSim'
import { DiligenceRoom } from '../../widgets/DiligenceRoom'

const world: World = {
  id: 'w12',
  num: 12,
  title: 'Running a Software Company',
  tagline: 'Keys, trust, scale and the day someone wants to buy you.',
  emoji: '🏛️',
  color: '#495057',
  skill: 'business',
  concepts: [
    { id: 'key-ownership', name: 'Company account ownership' },
    { id: 'bus-factor', name: 'Bus factor & offboarding' },
    { id: 'data-ownership', name: 'Customer data ownership & privacy' },
    { id: 'compliance-basics', name: 'GDPR & SOC 2 at a glance' },
    { id: 'scaling-ops', name: 'Scaling operations' },
    { id: 'technical-debt', name: 'Technical debt' },
    { id: 'due-diligence', name: 'Technical due diligence' },
    { id: 'ip-licenses', name: 'Code ownership (IP) & open-source licenses' },
  ],
  lessons: [
    /* ------------------------------------------------------------ */
    {
      id: 'w12-ownership',
      title: 'Who holds the keys?',
      subtitle: 'When your company depends on one person’s personal account.',
      minutes: 7,
      skill: 'security',
      concepts: ['key-ownership', 'bus-factor'],
      steps: [
        {
          kind: 'concept',
          emoji: '🔑',
          title: 'Your company is a set of logins',
          what: 'Your domain, code, cloud, app-store listing, payments and email each live in an online account. Whoever controls those accounts controls the company.',
          why: 'Early on, people sign up with whatever email is handy. Years later, the domain belongs to a personal Gmail and the code belongs to a contractor who left.',
        },
        {
          kind: 'widget',
          title: 'Audit ClinicBook’s accounts',
          instruction: 'Open each account and choose the right fix until all six belong to the company.',
          render: ({ done }) => <KeyAudit onDone={done} />,
        },
        {
          kind: 'points',
          title: 'Keys, people, and leaving',
          points: [
            { term: '🚌 Bus factor', text: 'How many people would have to disappear before the business stops. A bus factor of 1 means one person can stop everything.' },
            { term: '🏢 Company-owned accounts', text: 'Sign up with role emails (domains@, billing@) on company cards — never personal email or cards.' },
            { term: '👥 Two admins minimum', text: 'Every critical account has at least two people with their own logins and MFA.' },
            { term: '🚪 Offboarding', text: 'A checklist for when someone leaves: remove access, rotate shared secrets, transfer what they owned — on their last day, not months later.' },
            { term: '🧰 Password manager', text: 'A company vault for backup codes and the rare shared credential, so nothing lives in someone’s head or texts.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w12-ownership-q1',
          context: 'Your CTO is leaving on good terms in two weeks. Her personal Gmail owns the domain and the cloud account.',
          prompt: 'What’s the right move?',
          level: 3,
          concepts: ['key-ownership', 'bus-factor'],
          options: [
            { text: 'Ask for her password before she goes.', why: 'You’d still be logging into her personal account, with MFA on her phone. The account must move to the company, not just the password.' },
            {
              text: 'Now, while she’s still here: list every account she owns or administers, transfer each to company logins with two admins, then remove her access on her last day.',
              correct: true,
              why: 'Transfers often need the current owner to click “approve”. Doing it together before she leaves takes hours; doing it after can take weeks — or fail.',
            },
            { text: 'Nothing — she’s leaving on good terms, she’ll help later.', why: 'Good intentions don’t survive a new job, a lost phone or a hacked account. And “later” is usually during an emergency.' },
            { text: 'Wait until something breaks, then contact the provider’s support.', why: 'Proving you own an account that’s registered to someone else is slow and sometimes impossible.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w12-ownership-q2',
          prompt: 'Only your co-founder knows how to deploy, and only you can log into payments. What is your bus factor?',
          level: 2,
          concepts: ['bus-factor'],
          options: [
            { text: '2 — there are two of you.', why: 'Bus factor isn’t headcount. Losing either one of you stops something critical, so it only takes one person.' },
            { text: '1', correct: true, why: 'If either of you is unreachable, the business can’t deploy or can’t manage payments. Raising it means sharing knowledge and access so each critical job has two people.' },
            { text: '0', why: 'Zero would mean the business is already stopped. It works today — it’s just fragile.' },
            { text: 'It depends on how many customers you have.', why: 'Bus factor is about people and access, not customer count.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w12-ownership-q3',
          context: 'An engineer says: “We’re covered — the whole team shares one admin login, saved in the password manager.”',
          prompt: 'What’s the best reply?',
          level: 4,
          concepts: ['key-ownership', 'bus-factor'],
          options: [
            { text: 'Great — everyone has access, so the bus factor is high.', why: 'Access is high, but so is risk: anyone leaving means changing the password for everyone, and an attacker with it looks just like a teammate.' },
            {
              text: 'Better to give each person their own login with the access they need: you can remove one person cleanly and see who did what.',
              correct: true,
              why: 'Individual logins plus least privilege give you both resilience and accountability. Keep the one shared “root” login locked away for emergencies.',
            },
            { text: 'Shared logins are fine if the password is long.', why: 'Password length doesn’t fix the real problems: no record of who did what, and offboarding means changing it for everyone.' },
            { text: 'Store it in a spreadsheet instead so it’s easier to find.', why: 'Spreadsheets aren’t encrypted vaults and get shared widely. The password manager is the right place — the shared login is the problem.' },
          ],
        },
        {
          kind: 'care',
          points: [
            'Spend one afternoon listing every account the company depends on, who owns it, and who else can get in.',
            'Domains and email are the master keys: whoever controls them can reset almost everything else.',
            'Get IP assignment signed by everyone who writes code — especially contractors — before you need it.',
            'Offboard on the last day, every time. Remove access first; send the farewell cake second.',
          ],
        },
      ],
    },
    /* ------------------------------------------------------------ */
    {
      id: 'w12-data-trust',
      title: 'Data ownership, privacy & trust',
      subtitle: 'Answer the questions customers actually ask.',
      minutes: 6,
      skill: 'security',
      concepts: ['data-ownership', 'compliance-basics'],
      steps: [
        {
          kind: 'concept',
          emoji: '🤝',
          title: 'You hold other people’s data',
          what: 'When a clinic uses your app, their patients’ details live on your systems. The data is theirs; you are trusted to look after it, use it only for the service, and give it back or delete it when asked.',
          why: 'B2B customers ask about this before they buy. Clear, honest answers win deals; vague ones lose them. (This is a plain-English overview, not legal advice.)',
        },
        {
          kind: 'widget',
          title: 'The customer inbox',
          instruction: 'Open each question and choose the best reply.',
          render: ({ done }) => <TrustInbox onDone={done} />,
        },
        {
          kind: 'points',
          title: 'At a glance',
          points: [
            { term: '🇪🇺 GDPR', text: 'EU privacy law. It gives people rights over their data (see it, export it, delete it) and requires you to protect it. It’s a law you follow, not a badge you buy.' },
            { term: '🧾 SOC 2', text: 'An independent audit of your security practices, common in US B2B sales. Type I checks your controls at one moment; Type II checks they worked over months.' },
            { term: '✍️ DPA', text: 'Data processing agreement: a contract saying how you’ll handle a customer’s personal data.' },
            { term: '🔗 Subprocessors', text: 'Vendors that touch customer data for you — hosting, email, error tracking, AI providers. Keep a public list.' },
            { term: '⏳ Retention policy', text: 'Written rules for how long each kind of data is kept and when it’s deleted.' },
          ],
        },
        {
          kind: 'widget',
          title: 'A clinic asks you to delete their account',
          instruction: 'Sort each copy of their data into what happens to it.',
          render: ({ done }) => (
            <Categorize
              onDone={done}
              buckets={[
                { id: 'now', label: 'Delete now', emoji: '🗑️' },
                { id: 'ages', label: 'Expires on schedule', emoji: '⏳' },
                { id: 'keep', label: 'Keep (legal reason)', emoji: '📁' },
              ]}
              items={[
                { id: 'db', label: 'Patient records in the database', bucket: 'now', why: 'The main copy. Delete it within the time your policy promises.' },
                { id: 'files', label: 'Uploaded files in storage', bucket: 'now', why: 'Files live separately from the database — easy to forget.' },
                { id: 'analytics', label: 'Analytics events tied to their users', bucket: 'now', why: 'Analytics tools hold personal data too. Delete or anonymize them.' },
                { id: 'backups', label: 'Copies in nightly backups', bucket: 'ages', why: 'Backups can’t be edited one customer at a time; they expire on a rolling schedule (say, 35 days). Say so in your policy.' },
                { id: 'email', label: 'Messages in the email provider’s logs', bucket: 'ages', why: 'Your email vendor keeps logs for a set period, then deletes them. That’s why your subprocessor list matters.' },
                { id: 'invoices', label: 'Invoices and payment records', bucket: 'keep', why: 'Tax and accounting rules require you to keep these for years — a legitimate reason not to delete.' },
              ]}
            />
          ),
        },
        {
          kind: 'quiz',
          id: 'w12-data-trust-q1',
          prompt: 'What’s the difference between GDPR and SOC 2?',
          level: 2,
          concepts: ['compliance-basics'],
          options: [
            { text: 'They’re two names for the same certificate.', why: 'They’re different things: one is a law, the other is an independent audit report.' },
            {
              text: 'GDPR is an EU privacy law you must follow; SOC 2 is an optional security audit that customers often ask for.',
              correct: true,
              why: 'GDPR applies if you handle EU residents’ personal data. SOC 2 is a report from an auditor that proves your security practices to buyers.',
            },
            { text: 'GDPR is only for big companies; SOC 2 is for startups.', why: 'GDPR applies to companies of any size that handle EU personal data. SOC 2 is common for B2B companies of all sizes.' },
            { text: 'SOC 2 is a law in the US.', why: 'SOC 2 isn’t a law. It’s an audit framework — voluntary, but often required by customers in contracts.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w12-data-trust-q2',
          context: 'A customer asks you to delete everything. Your engineer runs a script that deletes their rows from the live database.',
          prompt: 'Are you done?',
          level: 3,
          concepts: ['data-ownership', 'compliance-basics'],
          options: [
            { text: 'Yes — the database is where the data lives.', why: 'Data also lives in file storage, analytics, backups, logs and vendors’ systems. The database is just the main copy.' },
            {
              text: 'Not yet: also delete uploaded files and analytics data, confirm backups expire on schedule, and keep only what the law requires (like invoices).',
              correct: true,
              why: 'Deletion is a map of every place data lives. Knowing that map is what makes your privacy promises true.',
            },
            { text: 'No — you must immediately edit every backup too.', why: 'Usually unrealistic and risky. The accepted approach is for backups to expire on a stated schedule, and to never restore deleted customers from them.' },
            { text: 'Yes — and delete their invoices too.', why: 'Tax rules typically require keeping invoices for years. Deleting them can break the law in a different way.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w12-data-trust-q3',
          context: 'You’re adding an AI feature that sends clinic notes to an outside AI provider to write summaries.',
          prompt: 'What do you need to do on the trust side?',
          level: 4,
          concepts: ['data-ownership', 'compliance-basics'],
          options: [
            { text: 'Nothing — it’s just an API call.', why: 'It’s an API call that sends customer data to another company. That makes the AI provider a subprocessor.' },
            {
              text: 'Add the provider to your subprocessor list, check its data terms (no training on your data, where it’s stored), sign a DPA, and tell customers before turning it on.',
              correct: true,
              why: 'Customers trusted you, not your vendors. Disclosing and contracting properly keeps that trust — and your existing DPAs often require notice.',
            },
            { text: 'Only tell customers if they ask.', why: 'Most customer contracts and privacy laws expect you to tell them about new subprocessors up front, not on request.' },
            { text: 'Ban AI features entirely.', why: 'AI features can be done responsibly. The answer is transparency and the right contracts, not avoidance.' },
          ],
        },
        {
          kind: 'care',
          points: [
            'Write a one-page “data map”: what personal data you hold, where it lives, which vendors touch it, and how long you keep it.',
            'Build export and delete early — they’re cheap now and painful to add later.',
            'Never claim a certification or audit you don’t have. “Not yet, here’s our plan” is a perfectly good answer.',
            'For contracts and regulated data (health, kids, finance), talk to a lawyer — this lesson is orientation, not legal advice.',
          ],
        },
      ],
    },
    /* ------------------------------------------------------------ */
    {
      id: 'w12-scale',
      title: 'From 10 to 1,000 customers',
      subtitle: 'What breaks when you grow — and it’s usually not the code.',
      minutes: 6,
      skill: 'reliability',
      concepts: ['scaling-ops'],
      steps: [
        {
          kind: 'concept',
          emoji: '📶',
          title: 'Growth changes the job',
          what: 'With 10 customers, the founders do everything personally. At 1,000, support, onboarding, on-call and hiring become real systems — or real fires.',
          why: 'Scaling problems usually show up as tired people and slow replies long before servers struggle.',
        },
        {
          kind: 'widget',
          title: 'Turn the dial',
          instruction: 'Step from 10 to 100 to 1,000 customers, then pick your three investments.',
          render: ({ done }) => <ScaleDial onDone={done} />,
        },
        {
          kind: 'quiz',
          id: 'w12-scale-q1',
          context: 'At 300 customers, you spend 20 hours a week answering the same five questions.',
          prompt: 'What’s the best fix?',
          level: 3,
          concepts: ['scaling-ops'],
          options: [
            { text: 'Answer faster.', why: 'Speed helps a bit, but the volume keeps growing with every customer. You need to remove the questions, not race them.' },
            {
              text: 'Write help articles for the five, link them in the app where people get stuck, and ask engineering to fix the confusing screens.',
              correct: true,
              why: 'Repeat questions are product feedback. Fix the cause and document the rest, and support time stops growing with every customer.',
            },
            { text: 'Hide the support email address.', why: 'Customers who can’t get help churn and leave bad reviews. The questions don’t go away — they turn into cancellations.' },
            { text: 'Hire three support people immediately.', why: 'You may need help eventually, but hiring people to answer the same five questions forever is the expensive fix.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w12-scale-q2',
          prompt: 'Why do growing software companies publish a status page?',
          level: 2,
          concepts: ['scaling-ops'],
          options: [
            { text: 'It’s required by law.', why: 'It isn’t. It’s a practical tool that saves time and builds trust.' },
            {
              text: 'During an outage, customers can see you know and are working on it — instead of all emailing support at once.',
              correct: true,
              why: 'One status update replaces hundreds of “is it down?” tickets and shows customers you’re on top of it.',
            },
            { text: 'It makes the app run faster.', why: 'It doesn’t change performance. It changes communication.' },
            { text: 'To hide problems from customers.', why: 'The opposite: it makes problems visible, which builds trust.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w12-scale-q3',
          context: 'Your only backend engineer is woken by alerts most nights. Half turn out to be nothing.',
          prompt: 'What should change first?',
          level: 4,
          concepts: ['scaling-ops'],
          options: [
            { text: 'Turn off alerts at night.', why: 'Then real outages go unnoticed until customers wake up angry. The problem is noisy alerts, not alerts.' },
            {
              text: 'Tune alerts so only customer-impacting problems page at night, write runbooks, and train a second person so you can share a rotation.',
              correct: true,
              why: 'Fewer false alarms, written fixes, and two people on rotation turn on-call from burnout into a normal part of the job.',
            },
            { text: 'Pay them more for being on call.', why: 'Fair and sometimes right — but it doesn’t fix the noise or the single point of failure. A tired engineer still makes mistakes.' },
            { text: 'Move to a bigger server.', why: 'More hardware doesn’t fix noisy alerts or a bus factor of one.' },
          ],
        },
        {
          kind: 'care',
          points: [
            'What got you to 10 customers (founder heroics) breaks at 1,000. Plan the next stage before you reach it.',
            'Every repeated task — onboarding call, support answer, manual fix — is a candidate for docs, automation or product fixes.',
            'Hire for the job that is already overflowing, and write down how it’s done before handing it over.',
          ],
        },
      ],
    },
    /* ------------------------------------------------------------ */
    {
      id: 'w12-tech-debt',
      title: 'Technical debt',
      subtitle: 'Shortcuts are a loan. The interest is real.',
      minutes: 8,
      skill: 'architecture',
      concepts: ['technical-debt'],
      steps: [
        {
          kind: 'concept',
          emoji: '💳',
          title: 'Borrowing time from your future self',
          what: 'Technical debt is the cost of shortcuts in code: skipped tests, copy-pasted logic, “we’ll clean it up later”. Like a loan, it lets you move faster now.',
          why: 'And like a loan, it charges interest: every future change takes longer and breaks more often — until you pay it down.',
        },
        {
          kind: 'widget',
          title: 'Ten sprints to decide',
          instruction: 'Choose how to build each sprint. Hit the investor demo, then see how fast you can keep going.',
          render: ({ done }) => <DebtSim onDone={done} />,
        },
        {
          kind: 'points',
          title: 'How engineers talk about it',
          points: [
            { term: '💰 Principal', text: 'The shortcut itself: the messy code that should be redone.' },
            { term: '📈 Interest', text: 'The ongoing cost: slower features, more bugs, more time spent being careful.' },
            { term: '🎯 Deliberate debt', text: 'A conscious trade (“ship for the demo, clean up next sprint”). Often smart.' },
            { term: '🫥 Accidental debt', text: 'Mess nobody chose — from rushing, inexperience, or unchecked AI-generated code. Usually the dangerous kind.' },
            { term: '🧹 Paying down', text: 'Refactoring, adding tests, deleting dead code. Budget a steady slice of every sprint for it.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w12-tech-debt-q1',
          prompt: 'In the debt metaphor, what is the “interest”?',
          level: 2,
          concepts: ['technical-debt'],
          options: [
            { text: 'The money spent on servers.', why: 'Server costs are a separate thing. Debt interest is time lost to messy code.' },
            { text: 'The extra time every future change costs because of the shortcuts.', correct: true, why: 'Bugs, workarounds and fear of breaking things slow down every sprint until the debt is paid down — just like in the sim.' },
            { text: 'The time spent writing the shortcut.', why: 'That’s the cheap part. Interest is what you keep paying afterwards.' },
            { text: 'A fee charged by GitHub.', why: 'No one sends a bill — which is exactly why debt is easy to ignore.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w12-tech-debt-q2',
          context: 'Your engineer asks for two weeks, with no new features, to “refactor billing.”',
          prompt: 'What’s the founder’s best response?',
          level: 3,
          concepts: ['technical-debt'],
          options: [
            { text: 'No — customers pay for features, not refactors.', why: 'Customers also pay for billing that works. If debt is slowing every change, refusing makes everything slower later.' },
            { text: 'Yes, take as long as you need.', why: 'Open-ended clean-up can drift. Agree on what it fixes and how you’ll know it worked.' },
            {
              text: 'Ask what the debt costs today — bugs, slow changes, risk — and what will be faster or safer after. Then agree a scope and a check-in.',
              correct: true,
              why: 'Treat it like any investment: what’s the interest, what’s the payoff? Billing bugs cost real money, so the case may be strong.',
            },
            { text: 'Ask the AI agent to rewrite billing from scratch over the weekend.', why: 'A rushed rewrite of something that handles money often adds new debt and new bugs. Careful, tested steps are safer.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w12-tech-debt-q3',
          context: 'Your AI coding agent shipped 30 features last month. This month, every new feature breaks two old ones.',
          prompt: 'What’s happening, and what do you do?',
          level: 4,
          concepts: ['technical-debt'],
          options: [
            { text: 'The AI got worse. Switch tools.', why: 'The tool may be fine. Fast output without tests and review piles up debt — and you’re now paying the interest.' },
            {
              text: 'You took on lots of debt quickly. Pause new features briefly: add tests around what breaks, simplify duplicated code, and require review before merging.',
              correct: true,
              why: 'Tests and cleanup lower the interest so the agent can go fast again safely. Speed without a safety net isn’t really speed.',
            },
            { text: 'Ship features even faster to make up for it.', why: 'That’s the “always shortcut” path from the sim: the team slows to a crawl as interest eats the week.' },
            { text: 'Ignore it — users will report the bugs.', why: 'Then customers are your test suite. Every bug they find costs trust and support time.' },
          ],
        },
        {
          kind: 'care',
          points: [
            'Shortcuts are fine when chosen on purpose — for a demo, a test, a deadline. Write them down and schedule the payback.',
            'Rule of thumb: spend 15–20% of engineering time keeping the codebase healthy.',
            'When features keep getting slower and bugs keep returning, you’re paying interest. Ask your engineers where.',
            'AI agents generate code fast — they generate debt fast too, unless tests and review keep up.',
          ],
        },
      ],
    },
    /* ------------------------------------------------------------ */
    {
      id: 'w12-due-diligence',
      title: 'When someone wants to buy you',
      subtitle: 'Prepare the data room for a technical due diligence.',
      minutes: 9,
      concepts: ['due-diligence', 'ip-licenses'],
      steps: [
        {
          kind: 'concept',
          emoji: '🔎',
          title: 'Due diligence: the buyer checks everything',
          what: 'Before buying (or investing in) a software company, the buyer’s engineers and lawyers ask for evidence: who owns the code, how secure it is, what it costs to run, and who keeps it working.',
          why: 'Every question you can’t answer becomes a risk — and risks become a lower price, a delay, or a deal that falls apart.',
        },
        {
          kind: 'widget',
          title: 'Fill the data room',
          instruction: 'For each request, file the evidence a careful buyer wants to see.',
          render: ({ done }) => <DiligenceRoom onDone={done} />,
        },
        {
          kind: 'points',
          title: 'Terms you’ll meet',
          points: [
            { term: '🗄️ Data room', text: 'A shared folder of documents the buyer reviews: contracts, financials, technical evidence.' },
            { term: '📜 IP assignment', text: 'A signed agreement that what someone creates for the company belongs to the company.' },
            { term: '🟢 Permissive licenses', text: 'MIT, Apache, BSD: use them freely, keep the notice. Low risk.' },
            { term: '🟠 Copyleft licenses', text: 'GPL, AGPL: in some situations you must share your own source code. Fine for some uses, risky for others — know where you use them.' },
            { term: '🧑‍💻 Key-person risk', text: 'When the business depends on one person’s knowledge or access. Buyers price it in.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w12-due-diligence-q1',
          prompt: 'What is technical due diligence, in plain English?',
          level: 2,
          concepts: ['due-diligence'],
          options: [
            { text: 'A code review of your latest pull request.', why: 'It’s much broader: ownership, security, architecture, costs, people and data — not one change.' },
            {
              text: 'The buyer or investor checking the evidence behind your tech before committing money.',
              correct: true,
              why: 'They’re confirming that what you’ve told them is true and finding risks they’ll need to price in or fix.',
            },
            { text: 'A government inspection of software companies.', why: 'It’s a private check by the buyer or investor, not a regulator.' },
            { text: 'Your own yearly security test.', why: 'Your own tests are useful evidence in diligence, but diligence is done by the other side of the deal.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w12-due-diligence-q2',
          context: 'Mid-deal, you discover the contractor who built your first version never signed an IP assignment.',
          prompt: 'What do you do?',
          level: 3,
          concepts: ['ip-licenses', 'due-diligence'],
          options: [
            { text: 'Say nothing and hope the buyer doesn’t ask.', why: 'They will ask, and the sale contract will make you promise the company owns its code. Hiding it puts the deal and your payout at risk.' },
            {
              text: 'Contact the contractor now to sign an assignment (paying a fair fee if needed), and tell the buyer what you found and how you’re fixing it.',
              correct: true,
              why: 'This is usually fixable, especially if you act quickly and openly. Buyers forgive problems; they don’t forgive surprises.',
            },
            { text: 'Rewrite all their code over the weekend.', why: 'Rushed rewrites add bugs and may not even remove the issue. Getting the signature is faster and cleaner.' },
            { text: 'Pull out of the deal.', why: 'Too drastic — a missing signature is a common, fixable problem.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w12-due-diligence-q3',
          context: 'The license report shows an AGPL library inside your core hosted product. The buyer’s lawyer flags it.',
          prompt: 'What’s the strongest response?',
          level: 4,
          concepts: ['ip-licenses', 'due-diligence'],
          options: [
            { text: '“Open source is free, so it doesn’t matter.”', why: 'Free to use, but with conditions. AGPL can require sharing your source code with users of a hosted service, which can affect what the buyer is purchasing.' },
            {
              text: 'Explain exactly how it’s used, get a legal view on whether the obligations apply, and show a plan (and timeline) to replace it with a permissively licensed alternative if needed.',
              correct: true,
              why: 'Specific facts plus a remediation plan turn a scary flag into a manageable task. That’s what experienced founders and engineers do.',
            },
            { text: 'Delete it from the license report.', why: 'Hiding it is misrepresentation. The buyer can scan your code themselves — and will.' },
            { text: 'Publish your entire codebase as open source.', why: 'That would give away the very thing the buyer is paying for. Replacing one library is far cheaper.' },
          ],
        },
        {
          kind: 'care',
          points: [
            'Diligence-ready is just well-run: signed IP agreements, accounts the company owns, documented architecture, real cost numbers, an incident log.',
            'Run a license scan now — it takes minutes and avoids an ugly surprise later.',
            'Reduce key-person risk long before a deal: docs, runbooks, two people for every critical system.',
            'Be honest about problems. A known issue with a plan rarely kills a deal; a hidden one found later often does.',
          ],
        },
      ],
    },
  ],
}

export default world
