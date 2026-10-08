import type { Scenario } from '../lib/types'

export const SCENARIOS: Scenario[] = [
  {
    id: 'sc-db-deleted',
    title: 'Your database is accidentally deleted',
    emoji: '💥',
    setup:
      'Tuesday, 2:20pm. A cleanup script ran against production instead of staging. The customers table is gone and the app shows errors to everyone.',
    steps: [
      {
        prompt: 'What do you do first?',
        options: [
          {
            text: 'Stop the bleeding: pause the script and put the app in maintenance mode.',
            correct: true,
            why: 'Stop further damage before anything else. New writes to a broken database can make recovery harder and confuse what you restore.',
          },
          {
            text: 'Ask the AI agent to rebuild the customers table from the code.',
            why: 'Code describes the table’s shape, not its contents. The schema can be recreated; your customers’ actual data cannot.',
          },
          {
            text: 'Email every customer to apologize right away.',
            why: 'Communication matters, but in the first minutes your job is to contain the damage and learn the facts. A quick status-page note can come next.',
          },
          {
            text: 'Find out who ran the script.',
            why: 'Blame doesn’t restore data. Postmortems should be blameless and happen after recovery — the real question is why one script could do this.',
          },
        ],
      },
      {
        prompt: 'Your engineer says, "We have nightly backups." What’s the most important follow-up question?',
        options: [
          {
            text: '"When did we last successfully restore one?"',
            correct: true,
            why: 'A backup that has never been restored is a theory. Untested backups are often incomplete, corrupted or missing the table you need.',
          },
          {
            text: '"How big are the backups?"',
            why: 'Size tells you little about whether recovery will work. Whether they restore — and how long it takes — is what matters now.',
          },
          {
            text: '"Which cloud provider stores them?"',
            why: 'Useful later (offsite matters), but it doesn’t tell you if you can actually get your data back today.',
          },
        ],
      },
      {
        prompt: 'The last nightly backup is from 2am. What does that mean for your customers?',
        options: [
          {
            text: 'Up to ~12 hours of changes may be lost unless you have point-in-time recovery.',
            correct: true,
            why: 'That gap is your RPO in real life. Point-in-time recovery could restore to 2:19pm instead — often just a setting you can turn on in advance.',
          },
          {
            text: 'Nothing is lost — the backup has everything.',
            why: 'A nightly backup only has what existed at 2am. Every signup, edit and payment since then is not in it.',
          },
          {
            text: 'Everything is lost; backups only help with hardware failures.',
            why: 'Backups protect against human mistakes too — that’s one of their main jobs. You can recover, just not the most recent changes.',
          },
        ],
      },
    ],
    takeaway:
      'A backup that has never been restored is a theory. Know your RPO (how much data you can lose) and RTO (how long you can be down) before the bad day.',
    lessons: ['w8-backups', 'w8-incidents', 'w6-environments'],
    skill: 'reliability',
  },
  {
    id: 'sc-data-leak',
    title: 'A customer says another user saw their data',
    emoji: '🕵️',
    setup:
      'An email arrives: "Someone from another company just described our private project notes to us. How did they see them?"',
    steps: [
      {
        prompt: 'What’s the most likely kind of bug to investigate first?',
        options: [
          {
            text: 'Missing authorization — a request that doesn’t check which customer the data belongs to.',
            correct: true,
            why: 'In multi-tenant apps, one endpoint that forgets "only this customer’s rows" is the classic cause. Authentication worked; authorization didn’t.',
          },
          {
            text: 'A hacker cracked our encryption.',
            why: 'Very unlikely. Real leaks between customers almost always come from missing access checks, not broken encryption.',
          },
          {
            text: 'The customer’s password was too weak.',
            why: 'A weak password lets someone into that customer’s own account. It doesn’t explain a different company seeing it in theirs.',
          },
          {
            text: 'The database is down.',
            why: 'An outage shows errors, not someone else’s data. Wrong data appearing points to access rules, not availability.',
          },
        ],
      },
      {
        prompt: 'Your engineer finds the bug in an export endpoint. What’s the right order?',
        options: [
          {
            text: 'Contain (disable or fix the endpoint), then use logs to find who accessed what, then notify affected customers.',
            correct: true,
            why: 'Stop further exposure first, then get facts from logs so your disclosure is accurate. Guessing in either direction erodes trust.',
          },
          {
            text: 'Fix it quietly and move on — it was probably just this one case.',
            why: 'You don’t know that without checking logs. Hiding a leak you later confirm is far worse, and may break legal and contract duties.',
          },
          {
            text: 'Tell every customer immediately that "all data may be exposed".',
            why: 'Transparency is right, but an over-broad, fact-free alarm causes panic and churn. Contain, scope with logs, then disclose clearly.',
          },
        ],
      },
      {
        prompt: 'Logs show the endpoint was hit, but they don’t record which account requested which data. What does that mean?',
        options: [
          {
            text: 'You can’t prove who was affected, so you may have to treat everyone as possibly affected.',
            correct: true,
            why: 'Good audit logs let you say "these 3 customers, these records". Without them, the honest scope is much bigger — and much more expensive.',
          },
          {
            text: 'Great — no evidence means no leak.',
            why: 'Absence of logs is absence of evidence, not proof of safety. Customers and regulators won’t accept that reasoning.',
          },
          {
            text: 'It doesn’t matter now that the bug is fixed.',
            why: 'The fix stops future leaks; it doesn’t tell you what already happened. You still owe affected customers the truth.',
          },
        ],
      },
    ],
    takeaway:
      'Authentication asks "who are you?"; authorization asks "what may you see?". Most leaks between customers are a missing authorization check — and logs decide how big the blast radius looks.',
    lessons: ['w4-tenants', 'w4-authz', 'w8-incidents'],
    skill: 'security',
  },
  {
    id: 'sc-tests-pass',
    title: 'Your AI agent says "All tests pass"',
    emoji: '🤖',
    setup:
      'You asked your AI coding agent to add team invites with admin and member roles. It replies: "Done! All tests pass. ✅"',
    steps: [
      {
        prompt: 'Does "all tests pass" mean the feature is safe to ship?',
        options: [
          {
            text: 'No — it only means the tests that exist pass. You need to know what they actually check.',
            correct: true,
            why: 'Tests prove what they test, nothing more. If no test checks "a member can’t remove an admin", that bug passes silently.',
          },
          {
            text: 'Yes — that’s what tests are for.',
            why: 'Tests catch regressions in what they cover. They can’t catch problems nobody wrote a test for — and agents sometimes write tests that confirm their own mistakes.',
          },
          {
            text: 'Yes, as long as there are lots of tests.',
            why: 'Quantity isn’t coverage of the right risks. 500 tests on button colors don’t protect permissions.',
          },
        ],
      },
      {
        prompt: 'Which follow-up question gets you the most useful evidence?',
        options: [
          {
            text: '"Show me the tests for what a member must NOT be able to do, and the test output."',
            correct: true,
            why: 'Permission bugs live in the "must not" cases. Asking for those tests and the actual run output turns a claim into evidence.',
          },
          {
            text: '"Are you sure?"',
            why: 'An AI will usually just say yes. Ask for specific evidence — tests, output, a diff — rather than reassurance.',
          },
          {
            text: '"Great, how many lines of code did you write?"',
            why: 'Lines of code say nothing about correctness or safety. More code can even mean more risk.',
          },
          {
            text: '"Can you make it faster?"',
            why: 'Speed isn’t the question yet. First confirm it does the right thing and blocks the wrong things.',
          },
        ],
      },
      {
        prompt: 'The agent shows the tests. None of them try a member calling the admin-only endpoint directly. What now?',
        options: [
          {
            text: 'Ask for that test (and a server-side check), then try it yourself in staging before merging.',
            correct: true,
            why: 'The rule must be enforced on the server and proven by a test. A quick hands-on check in staging is the founder’s final gate.',
          },
          {
            text: 'Ship it — the button is hidden from members anyway.',
            why: 'Hiding a button is not security. Anyone can call the endpoint directly; only a server-side check stops them.',
          },
          {
            text: 'Throw the feature away and write it by hand.',
            why: 'Overreaction. The code may be mostly fine — the gap is a missing check and test. Specific feedback fixes it fast.',
          },
        ],
      },
    ],
    takeaway: '"All tests pass" means "the tests I have pass". Ask what’s tested — especially what must NOT be allowed — and demand evidence, not reassurance.',
    lessons: ['w10-interrogate', 'w5-tests', 'w10-ready'],
    skill: 'ai',
  },
  {
    id: 'sc-host-down',
    title: 'Your hosting provider goes down',
    emoji: '🌩️',
    setup:
      'Your app runs on one hosting provider in one region. Their status page says "Major outage — investigating." Customers start emailing.',
    steps: [
      {
        prompt: 'What happens to your app?',
        options: [
          {
            text: 'It’s down for everyone until the provider recovers — you have one region and no failover.',
            correct: true,
            why: 'With everything in one place, their outage is your outage. That’s a normal, reasonable choice early on — as long as you know it.',
          },
          {
            text: 'Nothing — the cloud is always up.',
            why: 'Every major cloud has outages. "The cloud" is someone else’s servers, and they fail too.',
          },
          {
            text: 'Your data is probably gone.',
            why: 'Outages usually mean "unreachable", not "deleted". Data typically comes back when service does — though backups elsewhere are still smart.',
          },
        ],
      },
      {
        prompt: 'Right now, during the outage, what’s the most useful thing you can do?',
        options: [
          {
            text: 'Post on your status page and email customers: what’s down, that it’s a provider issue, and when you’ll update next.',
            correct: true,
            why: 'You can’t fix their outage, but you can control communication. Clear, regular updates protect trust and cut support load.',
          },
          {
            text: 'Migrate everything to a different cloud provider immediately.',
            why: 'Moving infrastructure mid-outage is slow and risky — likely to cause a second outage. Consider redundancy afterwards, calmly.',
          },
          {
            text: 'Stay quiet until it’s fixed so customers don’t panic.',
            why: 'Silence makes customers assume the worst and flood support. Honest, brief updates calm people down.',
          },
        ],
      },
      {
        prompt: 'Afterwards, a big customer asks for a 99.99% uptime SLA. Your provider promises 99.9%. What do you do?',
        options: [
          {
            text: 'Don’t promise more than your setup can deliver — offer what you can back up, or price in the cost of redundancy.',
            correct: true,
            why: 'An SLA is a contract. If your provider can be down ~43 minutes a month, promising ~4 minutes means paying penalties for their outages.',
          },
          {
            text: 'Agree — outages are rare.',
            why: 'You just had one. Promising more than your infrastructure gives you turns every provider hiccup into a refund or breach.',
          },
          {
            text: 'Refuse to offer any SLA at all.',
            why: 'Bigger customers often need some commitment. Offer a realistic one rather than walking away from the deal.',
          },
        ],
      },
    ],
    takeaway:
      'Your providers’ outages are your outages. Know your single points of failure, communicate fast, and never promise an SLA higher than what you depend on.',
    lessons: ['w6-architecture', 'w8-incidents', 'w9-services'],
    skill: 'reliability',
  },
  {
    id: 'sc-data-owner',
    title: 'A customer asks, "Who owns my data?"',
    emoji: '🔐',
    setup:
      'A larger prospect’s security team sends a questionnaire. Question 1: "Who owns the data we put into your product, and what do you do with it?"',
    steps: [
      {
        prompt: 'What’s the usual, healthy answer for a B2B SaaS product?',
        options: [
          {
            text: 'The customer owns their data; you process it on their behalf to provide the service.',
            correct: true,
            why: 'That’s the standard controller/processor model. Your terms should say it plainly — it’s what trust (and GDPR) expect.',
          },
          {
            text: 'You own it, since it’s stored in your database.',
            why: 'Storing data doesn’t make it yours. Claiming ownership of customer data scares off buyers and conflicts with privacy law.',
          },
          {
            text: 'Your hosting provider owns it.',
            why: 'Hosts are sub-processors: they store it under contract, but don’t own it or get to use it for their own purposes.',
          },
        ],
      },
      {
        prompt: 'Question 2: "Is our data sent to any third parties, including AI providers?" What do you need to know to answer?',
        options: [
          {
            text: 'Every service that touches customer data — hosting, email, analytics, AI — and what each does with it.',
            correct: true,
            why: 'Those are your sub-processors. If you can’t list them, you can’t answer honestly — and a new AI feature might quietly add one.',
          },
          {
            text: 'Just the hosting provider — the others don’t count.',
            why: 'Email, analytics, support and AI tools often see customer data too. Missing one makes your answer inaccurate.',
          },
          {
            text: 'Nothing — say "no" to keep things simple.',
            why: 'A false "no" on a security questionnaire can become a contract breach. Accurate beats simple.',
          },
        ],
      },
      {
        prompt: 'Question 3: "If we leave, can we get our data out, and will you delete it?" What’s the best position?',
        options: [
          {
            text: 'Yes: offer an export in a usable format and a clear deletion process, including backup retention timing.',
            correct: true,
            why: 'Easy exit builds trust and wins deals. Be honest that backups age out on a schedule rather than vanishing instantly.',
          },
          {
            text: 'No export — it keeps customers from leaving.',
            why: 'Lock-in by hostage rarely works on serious buyers. It fails security reviews and may conflict with privacy rights.',
          },
          {
            text: 'We delete everything instantly, everywhere.',
            why: 'Probably not true — backups and logs keep copies for a while. Promise what you can actually do.',
          },
        ],
      },
    ],
    takeaway:
      'Customers own their data; you’re its custodian. Know every service that touches it, write your terms to match reality, and make leaving easy.',
    lessons: ['w12-data-trust', 'w9-services', 'w8-backups'],
    skill: 'business',
  },
  {
    id: 'sc-acquisition',
    title: 'Someone wants to buy your company',
    emoji: '🤝',
    setup:
      'A larger company sends a letter of intent. Their CTO wants a "technical due diligence" call next week.',
    steps: [
      {
        prompt: 'Which question are they most likely to ask first?',
        options: [
          {
            text: '"Does the company own all its code, accounts and infrastructure?"',
            correct: true,
            why: 'Buyers must know what they’re actually buying. Code written by contractors without IP agreements, or accounts in someone’s personal name, can stall a deal.',
          },
          {
            text: '"What programming language do you use?"',
            why: 'They’ll note it, but language choice rarely makes or breaks a deal. Ownership, security and risk matter far more.',
          },
          {
            text: '"How many lines of code do you have?"',
            why: 'Lines of code aren’t value. Buyers care about what the code does, who can maintain it and what risks come with it.',
          },
        ],
      },
      {
        prompt: 'They ask, "What happens if your lead engineer leaves?" What are they really probing?',
        options: [
          {
            text: 'Bus factor — whether knowledge and access are concentrated in one person.',
            correct: true,
            why: 'If one person holds the keys and the knowledge, the buyer is buying a risk. Documentation and shared access lower it.',
          },
          {
            text: 'Whether they can lower your salary budget.',
            why: 'Cost may come up, but this question is about continuity: can the product survive one departure?',
          },
          {
            text: 'Whether your engineer is any good.',
            why: 'It’s less about skill and more about dependency. Even a brilliant engineer is a risk if only they understand the system.',
          },
        ],
      },
      {
        prompt: 'Which of these is most likely to lower your price or kill the deal?',
        options: [
          {
            text: 'An undisclosed data leak they discover during diligence.',
            correct: true,
            why: 'Hidden security problems destroy trust and create liability. Disclosed and fixed issues are negotiable; surprises are not.',
          },
          {
            text: 'Some known technical debt, documented with a plan.',
            why: 'Every codebase has debt. Known, documented debt is normal and usually just a talking point.',
          },
          {
            text: 'Using open-source libraries.',
            why: 'Everyone does. Buyers check that the licenses are compatible, not that you avoided open source.',
          },
        ],
      },
    ],
    takeaway:
      'Buyers pay for certainty. Company-owned accounts, clear IP, documented systems, known debt and honest security history make you worth more.',
    lessons: ['w12-due-diligence', 'w12-ownership', 'w12-tech-debt'],
    skill: 'business',
  },
  {
    id: 'sc-scale',
    title: 'You have 10 customers. Then 1,000.',
    emoji: '📈',
    setup:
      'Your product took off. In six months you went from 10 hand-held customers to 1,000. Things that worked fine are starting to creak.',
    steps: [
      {
        prompt: 'The app is getting slow. What’s most likely the first fix?',
        options: [
          {
            text: 'Find the slow queries and add indexes or caching.',
            correct: true,
            why: 'Most early slowness is a few inefficient database queries that didn’t matter with little data. Often a cheap, quick fix.',
          },
          {
            text: 'Rewrite everything as microservices.',
            why: 'A huge, risky project that adds complexity. At 1,000 customers a well-tuned monolith is usually plenty.',
          },
          {
            text: 'Switch to a different programming language.',
            why: 'Language is rarely the bottleneck at this size. The database and how you query it usually are.',
          },
        ],
      },
      {
        prompt: 'Support is overwhelming you. What changes first?',
        options: [
          {
            text: 'Fix the top recurring issues in the product and write help docs for the rest.',
            correct: true,
            why: 'At 10 customers you can answer everything personally. At 1,000, each recurring question is a product bug to fix once.',
          },
          {
            text: 'Hire one support person per 50 customers.',
            why: 'Support that scales linearly with customers eats your margin. Remove the causes before adding headcount.',
          },
          {
            text: 'Stop responding to small customers.',
            why: 'That trades a support problem for a churn problem. Prioritize, but fix root causes.',
          },
        ],
      },
      {
        prompt: 'The app goes down at 3am. Nobody notices until 9am. What was missing?',
        options: [
          {
            text: 'Monitoring with alerts, and someone on call to respond.',
            correct: true,
            why: 'With 1,000 customers across time zones, someone is always using it. Alerts plus an on-call rota turn 6 hours into 15 minutes.',
          },
          {
            text: 'A bigger server.',
            why: 'Maybe, but the real problem is that nobody knew. Even the best server fails sometimes.',
          },
          {
            text: 'More unit tests.',
            why: 'Tests help prevent bugs before release; they don’t tell you when production breaks at 3am.',
          },
        ],
      },
    ],
    takeaway:
      'Scaling is mostly about removing things that depend on you personally: slow queries, manual support, and nobody watching at 3am. Rarely a rewrite.',
    lessons: ['w12-scale', 'w3-queries', 'w8-monitoring'],
    skill: 'architecture',
  },
  {
    id: 'sc-personal-account',
    title: 'Everything depends on one person’s personal account',
    emoji: '🔑',
    setup:
      'You discover the domain, GitHub, hosting and Stripe are all registered to your cofounder’s personal Gmail, paid with their personal card.',
    steps: [
      {
        prompt: 'Your cofounder is great and trustworthy. Why is this still dangerous?',
        options: [
          {
            text: 'If that one account is lost, hacked or locked out, the company loses access to itself.',
            correct: true,
            why: 'This is about risk, not trust. A phished Gmail, a declined card or a locked account can take your domain, code and payments offline at once.',
          },
          {
            text: 'It isn’t — as long as you trust them.',
            why: 'People get sick, leave, or get hacked. Trust doesn’t protect against an expired card or a phished password.',
          },
          {
            text: 'Only because it might be against the providers’ terms of service.',
            why: 'That’s a minor point. The real danger is a single point of failure for your whole company.',
          },
        ],
      },
      {
        prompt: 'What’s the best fix?',
        options: [
          {
            text: 'Move each service to company-owned accounts, with at least two admins, MFA and a company card.',
            correct: true,
            why: 'Company accounts with two admins remove the single point of failure; MFA protects them; a company card avoids surprise suspensions.',
          },
          {
            text: 'Have your cofounder share their Gmail password with you.',
            why: 'Shared passwords break MFA, can’t be audited and still leave everything tied to a personal account.',
          },
          {
            text: 'Write the passwords in a shared doc as a backup.',
            why: 'A plain-text doc of passwords is a gift to attackers. Use proper company accounts or a password manager.',
          },
        ],
      },
      {
        prompt: 'Which account should you move first?',
        options: [
          {
            text: 'The domain registrar and the email account that controls it.',
            correct: true,
            why: 'Whoever controls the domain controls your website, email and password resets for every other service. It’s the master key.',
          },
          {
            text: 'The analytics tool.',
            why: 'Worth moving eventually, but losing analytics is an inconvenience. Losing the domain can take down everything.',
          },
          {
            text: 'The design tool.',
            why: 'Low risk compared to the domain, code and payments. Start with the accounts that could stop the business.',
          },
        ],
      },
    ],
    takeaway:
      'The company must own its keys. Domain first, then code, hosting and payments — company accounts, two admins, MFA. Trust isn’t a backup plan.',
    lessons: ['w12-ownership', 'w2-dns', 'w7-habits'],
    skill: 'security',
  },
]
