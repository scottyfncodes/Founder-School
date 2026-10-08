import { AuditBoard, type AuditItem } from './AuditBoard'

/** Five real questions a clinic asks before trusting ClinicBook (fictional) with patient data. */
const QUESTIONS: AuditItem[] = [
  {
    id: 'own',
    emoji: '🗂️',
    title: '“Who owns our data?”',
    before: [
      { k: 'From', v: 'Dr. Lee, Riverside Clinic' },
      { k: 'Asks', v: 'If we put our patients’ appointments in ClinicBook, whose data is it?' },
    ],
    after: [{ k: 'You replied', v: 'It’s yours. We only process it to run the service for you — our terms say so in writing.' }],
    ask: 'Pick the best reply:',
    options: [
      {
        text: 'Data stored on our servers belongs to us.',
        why: 'That’s the fastest way to lose a B2B deal. Customers own their data; you are trusted to look after it.',
      },
      {
        text: 'It’s yours. We only use it to provide the service to you, and our terms say so in writing.',
        correct: true,
        why: 'Clear, specific and backed by your terms. In privacy-law language, the clinic is the “controller” and you are their “processor”.',
      },
      {
        text: 'Hard to say — it’s in the cloud.',
        why: 'Vague answers sound like you don’t know, which is worse than any specific answer. Where data is stored doesn’t change who owns it.',
      },
    ],
  },
  {
    id: 'export',
    emoji: '📦',
    title: '“Can we take everything with us?”',
    before: [
      { k: 'From', v: 'Riverside Clinic office manager' },
      { k: 'Asks', v: 'If we ever leave, can we export all our data?' },
    ],
    after: [{ k: 'You replied', v: 'Yes: one-click export of patients, appointments and notes (CSV) plus files (zip), anytime.' }],
    ask: 'Pick the best reply:',
    options: [
      {
        text: 'Contact support and we’ll see what we can do.',
        why: '“We’ll see” makes buyers nervous. A self-serve export is cheap to build and is often a must-have on procurement checklists.',
      },
      {
        text: 'No — that’s how we keep customers.',
        why: 'Holding data hostage creates angry churn and, in many places, legal trouble. Customers stay because the product is good, not because they’re trapped.',
      },
      {
        text: 'Yes — one-click export of everything, anytime, in standard formats.',
        correct: true,
        why: 'Easy exit makes it easier to say yes in the first place. Privacy laws like GDPR also give people a right to get their data.',
      },
    ],
  },
  {
    id: 'delete',
    emoji: '🗑️',
    title: '“If we cancel, is it deleted?”',
    before: [
      { k: 'From', v: 'Dr. Lee' },
      { k: 'Asks', v: 'When we cancel, do you delete our patients’ data?' },
    ],
    after: [{ k: 'You replied', v: 'Live data deleted within 30 days; backups age out within 35; invoices kept as tax law requires.' }],
    ask: 'Pick the most honest, accurate reply:',
    options: [
      {
        text: 'Yes — instantly, from everywhere, including backups.',
        why: 'An over-promise. Backups usually can’t be edited one customer at a time; they expire on a schedule. Promising “instantly everywhere” sets you up to break your word.',
      },
      {
        text: 'Deleted from the live system within 30 days; backups expire within 35 days; invoices kept as the law requires.',
        correct: true,
        why: 'Specific, true, and it matches how the system actually works. That’s what a retention policy is: written-down rules for how long each kind of data lives.',
      },
      {
        text: 'We keep it forever in case you come back.',
        why: 'Keeping data you don’t need is a liability: more to leak, and many privacy laws require you to delete it when there’s no longer a reason to keep it.',
      },
    ],
  },
  {
    id: 'sub',
    emoji: '🔗',
    title: '“Who else sees our data?”',
    before: [
      { k: 'From', v: 'Riverside Clinic IT consultant' },
      { k: 'Asks', v: 'Which other companies process our data?' },
    ],
    after: [{ k: 'You replied', v: 'Our subprocessor list: cloud hosting (EU), email, payments, error tracking — each under a data agreement.' }],
    ask: 'Pick the best reply:',
    options: [
      {
        text: 'Nobody but us.',
        why: 'Almost certainly false: your cloud host, email provider and error tracker all touch the data. Saying “nobody” is a misstatement that can come back in a contract dispute.',
      },
      {
        text: 'Here’s our list of subprocessors and what each does. We’ll notify you before adding a new one.',
        correct: true,
        why: 'A “subprocessor” is any vendor that handles customer data for you. A public list plus a promise to give notice is standard practice and builds trust.',
      },
      {
        text: 'Lots of vendors — too many to list.',
        why: 'If you can’t list them, you can’t protect the data. Keeping this list current is a basic compliance habit.',
      },
    ],
  },
  {
    id: 'cert',
    emoji: '🛡️',
    title: '“Are you GDPR / SOC 2 compliant?”',
    before: [
      { k: 'From', v: 'A large clinic group’s procurement team' },
      { k: 'Asks', v: 'Please confirm GDPR compliance and send your SOC 2 report.' },
    ],
    after: [{ k: 'You replied', v: 'GDPR: yes, with a data agreement. SOC 2: not yet — here’s our security overview and timeline.' }],
    ask: 'You follow GDPR but have no SOC 2 audit yet. Reply:',
    options: [
      {
        text: 'Yes, we’re fully certified for everything.',
        why: 'Never claim an audit you haven’t had — it’s easy to check and can void a contract. (GDPR also isn’t a certificate; it’s a law you follow.)',
      },
      {
        text: 'We follow GDPR and can sign a data processing agreement. We don’t have SOC 2 yet — here’s our security overview and our timeline.',
        correct: true,
        why: 'Honest and useful. Many buyers accept a security overview from a young company, and the timeline shows you take it seriously.',
      },
      {
        text: 'Those only matter for big companies.',
        why: 'They matter to whoever is buying. If big customers ask, it’s on your roadmap whether you like it or not.',
      },
    ],
  },
]

export function TrustInbox({ onDone }: { onDone?: () => void }) {
  return (
    <AuditBoard
      items={QUESTIONS}
      meterLabel="📨 Customer questions answered well"
      riskLabel="Unanswered"
      fixedLabel="Sent"
      onDone={onDone}
      finale={(ok, n) =>
        `All ${n} replies sent — specific, honest, and nothing you can’t deliver. That’s what trust sounds like in B2B. ${ok}/${n} right on the first try.`
      }
    />
  )
}
