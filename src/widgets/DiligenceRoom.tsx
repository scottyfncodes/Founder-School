import { AuditBoard, type AuditItem } from './AuditBoard'

/** An acquirer's technical due-diligence questions for ClinicBook (fictional). */
const REQUESTS: AuditItem[] = [
  {
    id: 'ip',
    emoji: '📜',
    title: 'Who owns the code?',
    before: [{ k: 'Buyer asks', v: 'Show that the company — not individuals — owns all the code and designs.' }],
    after: [{ k: 'In the data room', v: 'Signed IP assignment agreements from every founder, employee and contractor.' }],
    ask: 'What goes in the data room?',
    options: [
      {
        text: 'Screenshots showing our team made the commits.',
        why: 'Commits show who typed the code, not who legally owns it. Without a signed assignment, a contractor may still own what they wrote.',
      },
      {
        text: 'Signed IP assignment agreements from every founder, employee and contractor.',
        correct: true,
        why: 'This is the proof a buyer’s lawyer needs. Missing ones are a classic deal-delayer — collect them early, while people are easy to reach.',
      },
      {
        text: '“We paid the contractors, so it’s ours.”',
        why: 'Paying for work doesn’t automatically transfer ownership in many countries. Buyers treat this as a red flag until the paperwork exists.',
      },
    ],
  },
  {
    id: 'oss',
    emoji: '🧩',
    title: 'Open-source licenses',
    before: [{ k: 'Buyer asks', v: 'List the open-source packages you use and their licenses.' }],
    after: [{ k: 'In the data room', v: 'An automated license report, with the one copyleft package flagged and a plan to replace it.' }],
    ask: 'What goes in the data room?',
    options: [
      {
        text: '“We use lots of open source — it’s free.”',
        why: 'Free to use isn’t the same as free of rules. Some licenses (like AGPL) can require you to publish your own code in certain situations.',
      },
      {
        text: 'A promise that we never copied any code.',
        why: 'Your app likely depends on hundreds of open-source packages. The question is which licenses they carry, not whether you copied anything.',
      },
      {
        text: 'An automated license report of every dependency, with risky licenses flagged and a plan for each.',
        correct: true,
        why: 'Tools can generate this in minutes. Flagging problems yourself — with a plan — builds far more trust than a buyer finding them.',
      },
    ],
  },
  {
    id: 'incidents',
    emoji: '🚨',
    title: 'Security incidents',
    before: [
      { k: 'Buyer asks', v: 'Have you had any security incidents?' },
      { k: 'The truth', v: 'Last year an API key leaked in a public repo. You rotated it in an hour.' },
    ],
    after: [{ k: 'In the data room', v: 'Incident log + the postmortem for the leaked key: timeline, impact, fixes.' }],
    ask: 'How do you answer?',
    options: [
      {
        text: 'An incident log, including the leaked key: what happened, what you checked, and what you changed.',
        correct: true,
        why: 'Every company has incidents. Buyers look for whether you noticed, responded and learned. A clear postmortem is a strength.',
      },
      {
        text: '“No incidents.” It was fixed quickly, so it doesn’t count.',
        why: 'If it comes out later, a false statement in a sale contract can cost you money after closing — and the buyer’s trust immediately.',
      },
      {
        text: 'A penetration test report from three years ago.',
        why: 'Old, and it answers a different question. It says nothing about what has happened since.',
      },
    ],
  },
  {
    id: 'arch',
    emoji: '🗺️',
    title: 'Architecture',
    before: [{ k: 'Buyer asks', v: 'How does the system work, and how do changes reach production?' }],
    after: [{ k: 'In the data room', v: 'Current architecture diagram, list of services and vendors, and how deploys and backups work.' }],
    ask: 'What goes in the data room?',
    options: [
      {
        text: 'The architecture slide from our pitch deck.',
        why: 'Pitch slides are marketing. Engineers on the buyer’s side want the real boxes, vendors and data flows.',
      },
      {
        text: 'An up-to-date architecture diagram, a list of services and vendors, and how deploys and backups work.',
        correct: true,
        why: 'That’s exactly the architecture map you’ve been building in this course. It shows the system is understood, not just running.',
      },
      {
        text: '“It’s all in the code.”',
        why: 'Nobody will read 200,000 lines during a deal. It also hints that only the people who wrote it understand it.',
      },
    ],
  },
  {
    id: 'people',
    emoji: '🧑‍💻',
    title: 'Key-person risk',
    before: [{ k: 'Buyer asks', v: 'What happens if your lead engineer leaves after the sale?' }],
    after: [{ k: 'In the data room', v: 'Runbooks and docs; an access list showing at least two people can deploy, restore and administer every system.' }],
    ask: 'How do you show the business doesn’t depend on one person?',
    options: [
      {
        text: '“Only Maya understands billing, but she’s committed.”',
        why: 'Commitment isn’t a plan. Buyers may respond by lowering the price or tying payment to Maya staying.',
      },
      {
        text: 'An org chart.',
        why: 'It shows who reports to whom, not who can actually keep the system running.',
      },
      {
        text: 'Runbooks, docs, and an access list proving at least two people can deploy, restore and administer every system.',
        correct: true,
        why: 'This is your bus factor, written down. It directly reduces the risk the buyer is pricing in.',
      },
    ],
  },
  {
    id: 'data',
    emoji: '🔐',
    title: 'Data handling',
    before: [{ k: 'Buyer asks', v: 'What personal data do you hold, where, and who can access it?' }],
    after: [{ k: 'In the data room', v: 'Data map, subprocessor list, retention & deletion policy, signed customer data agreements.' }],
    ask: 'What goes in the data room?',
    options: [
      {
        text: 'A data map, subprocessor list, retention and deletion policy, and signed customer data agreements.',
        correct: true,
        why: 'Buying a company means taking on its privacy obligations. This shows they’re known and handled.',
      },
      {
        text: 'A copy of our public privacy policy.',
        why: 'A useful start, but it says what you promise, not what you actually do or where the data really lives.',
      },
      {
        text: '“Customer data is in our database.”',
        why: 'Also in backups, logs, analytics, email tools and support inboxes. Not knowing that is exactly the risk a buyer fears.',
      },
    ],
  },
  {
    id: 'costs',
    emoji: '🧾',
    title: 'Infrastructure costs',
    before: [{ k: 'Buyer asks', v: 'What does it cost to run the product, and how does that grow with customers?' }],
    after: [{ k: 'In the data room', v: '12 months of cloud and vendor bills, cost per customer, and the trend.' }],
    ask: 'What goes in the data room?',
    options: [
      {
        text: '“Around $3k a month, give or take.”',
        why: 'A guess invites the buyer to assume the worst. Costs directly affect gross margin, and margin affects price.',
      },
      {
        text: '12 months of cloud and vendor bills, with cost per customer and how it’s trending.',
        correct: true,
        why: 'Real bills plus cost per customer prove your gross margin — one of the numbers that most affects what you’re worth.',
      },
      {
        text: 'The cloud provider’s public pricing page.',
        why: 'Prices aren’t costs. The buyer needs what you actually spend and how it scales.',
      },
    ],
  },
]

export function DiligenceRoom({ onDone }: { onDone?: () => void }) {
  return (
    <AuditBoard
      items={REQUESTS}
      meterLabel="🗄️ Data room ready"
      riskLabel="Missing"
      fixedLabel="Filed"
      onDone={onDone}
      finale={(ok, n) =>
        `All ${n} requests answered with evidence, not reassurance. ${ok}/${n} right on the first try. A tidy data room shortens the deal and protects the price — and almost everything in it is worth doing years before anyone wants to buy you.`
      }
    />
  )
}
