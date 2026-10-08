import { AuditBoard, type AuditItem } from './AuditBoard'

/** Fictional company: ClinicBook. Sam = founder, Priya = co-founder, Alex = former co-founder, Jordan = former contractor. */
const ACCOUNTS: AuditItem[] = [
  {
    id: 'domain',
    emoji: '🌐',
    title: 'Domain registrar',
    before: [
      { k: 'Domain', v: 'clinicbook.com' },
      { k: 'Login', v: 'sam.rivera.home@gmail.com (Sam’s personal Gmail)' },
      { k: 'Paid by', v: 'Sam’s personal card — expires next month' },
      { k: 'Other admins', v: 'none · Transfer lock: off' },
    ],
    after: [
      { k: 'Login', v: 'domains@clinicbook.com (company)' },
      { k: 'Paid by', v: 'Company card, auto-renew on' },
      { k: 'Admins', v: 'Sam + Priya, MFA on · Transfer lock: on' },
    ],
    ask: 'What’s the right fix?',
    options: [
      {
        text: 'Leave it — auto-renew is on.',
        why: 'Auto-renew charges a card that expires next month. If renewal fails, the domain lapses: your website and company email go dark, and someone else can register it.',
      },
      {
        text: 'Move it to a company login, pay with the company card, add a second admin, turn on MFA and the transfer lock.',
        correct: true,
        why: 'Now the company owns its own address, renewal doesn’t depend on one person’s wallet, and the lock blocks anyone from quietly moving the domain away.',
      },
      {
        text: 'Share Sam’s Gmail password with the team so anyone can log in.',
        why: 'That spreads the risk instead of fixing it: no MFA, no record of who did what — and the domain still belongs to Sam’s personal account.',
      },
    ],
  },
  {
    id: 'github',
    emoji: '🐙',
    title: 'Code (GitHub organization)',
    before: [
      { k: 'Only owner', v: 'jordan@freelance-dev.io (contractor, left in March)' },
      { k: 'Founders', v: '“Member” role — can’t change settings or remove anyone' },
      { k: 'Jordan’s contract', v: 'No IP (intellectual property) assignment clause' },
    ],
    after: [
      { k: 'Owners', v: 'Sam + Priya (company accounts, MFA required)' },
      { k: 'Jordan', v: 'Removed' },
      { k: 'IP', v: 'Signed assignment on file: the company owns the code' },
    ],
    ask: 'Your code lives in an organization you don’t control. What do you do?',
    options: [
      {
        text: 'Copy the code into a new organization and carry on.',
        why: 'A copy doesn’t fix ownership. Jordan can still change or delete the original, and without an IP assignment the code may legally still be Jordan’s.',
      },
      {
        text: 'Ask Jordan, in writing, to make both founders Owners, then remove Jordan — and sign an IP assignment for the code they wrote.',
        correct: true,
        why: 'This fixes both control (who can change settings) and ownership (who legally owns the code). Do it while the relationship is friendly — it gets much harder later.',
      },
      {
        text: 'Nothing — Jordan was great and wouldn’t do anything bad.',
        why: 'It isn’t about trust. Jordan’s account could be hacked, or Jordan could be unreachable on the day you need a setting changed. Investors and buyers will also ask who owns the code.',
      },
    ],
  },
  {
    id: 'cloud',
    emoji: '☁️',
    title: 'Cloud hosting',
    before: [
      { k: 'Root (master) login', v: 'alex.b@hotmail.com — co-founder who left last year' },
      { k: 'MFA', v: 'Off' },
      { k: 'Day to day', v: 'Everyone signs in as root' },
    ],
    after: [
      { k: 'Root login', v: 'cloud-root@clinicbook.com, MFA on, emergencies only' },
      { k: 'Day to day', v: 'Each person has their own login with only the access they need' },
      { k: 'Alex', v: 'No access' },
    ],
    ask: 'The account that can delete your whole product is tied to someone who left. Fix it:',
    options: [
      {
        text: 'Turn on MFA for root using Alex’s phone, and keep sharing the login.',
        why: 'Better than nothing, but everyone still shares one all-powerful login — and only Alex’s phone can unlock it.',
      },
      {
        text: 'Delete the root account to be safe.',
        why: 'Every cloud account has an owner login you can’t remove. The goal is to protect it and stop using it day to day, not to get rid of it.',
      },
      {
        text: 'Move root to a company email with MFA, lock it away, and give each person their own limited login.',
        correct: true,
        why: 'Root becomes a break-glass key the company controls. Personal logins mean you can remove one person without changing everyone’s password, and you can see who did what.',
      },
    ],
  },
  {
    id: 'apple',
    emoji: '🍎',
    title: 'App Store developer account',
    before: [
      { k: 'Enrolled as', v: 'Individual — “Sam Rivera”' },
      { k: 'Seller on the App Store', v: 'Sam Rivera (not the company)' },
      { k: 'Team members', v: 'none' },
    ],
    after: [
      { k: 'Enrolled as', v: 'Organization — ClinicBook Inc.' },
      { k: 'Seller on the App Store', v: 'ClinicBook Inc.' },
      { k: 'Admins', v: 'Sam + Priya' },
    ],
    ask: 'The iPhone app is published under Sam’s own name. What should happen?',
    options: [
      {
        text: 'It’s fine — Sam is the founder.',
        why: 'The app then belongs to Sam personally, not the company. If Sam leaves, or the company is sold, the app has to be transferred — a slow process at the worst time.',
      },
      {
        text: 'Enroll the company as an Organization, transfer the app to it, and add a second admin.',
        correct: true,
        why: 'The company becomes the legal seller. Organization enrollment needs a registered company (and a business ID), so start early — it can take a while.',
      },
      {
        text: 'Open a second Individual account for Priya as a backup.',
        why: 'An app can only live in one account, so a second personal account doesn’t help — it just means two people personally own pieces of the company.',
      },
    ],
  },
  {
    id: 'payments',
    emoji: '💳',
    title: 'Payments provider',
    before: [
      { k: 'Business', v: 'ClinicBook Inc. ✓' },
      { k: 'Admins', v: 'Sam only' },
      { k: '2-step login', v: 'Sam’s phone · backup codes: nowhere' },
    ],
    after: [
      { k: 'Admins', v: 'Sam + Priya, each with their own login and 2-step' },
      { k: 'Backup codes', v: 'In the company password manager' },
    ],
    ask: 'This is where your revenue arrives. Make it survive one lost phone:',
    options: [
      {
        text: 'Add Priya as a second admin with her own login, and store backup codes in the company password manager.',
        correct: true,
        why: 'Two people can get in, each with their own credentials, and a lost phone becomes an inconvenience instead of an emergency.',
      },
      {
        text: 'Text Priya Sam’s password and a few 2-step codes.',
        why: 'Shared logins break the point of 2-step login, leave no record of who did what, and texted passwords sit in message history forever.',
      },
      {
        text: 'Deal with it if Sam ever loses his phone.',
        why: 'Account recovery on a payments platform can mean days of identity checks — while you can’t issue refunds or see payouts.',
      },
    ],
  },
  {
    id: 'email',
    emoji: '✉️',
    title: 'Company email & logins',
    before: [
      { k: 'Super admins', v: 'Sam only' },
      { k: 'MFA', v: 'Optional' },
      { k: 'Departed people', v: 'jordan@clinicbook.com still active' },
    ],
    after: [
      { k: 'Super admins', v: 'Sam + Priya' },
      { k: 'MFA', v: 'Required for everyone' },
      { k: 'Jordan', v: 'Suspended; mail forwarded to support@' },
    ],
    ask: 'Company email is the “forgot password” key to almost every other account. Fix it:',
    options: [
      {
        text: 'Make everyone a super admin so somebody can always help.',
        why: 'Every extra super admin is another account an attacker can use to take over everything. Give the least access that works — two admins is plenty.',
      },
      {
        text: 'Keep Jordan’s mailbox active in case customers email it.',
        why: 'An active login for someone who left is an open door. Forwarding the mail to a shared inbox keeps the messages without keeping the risk.',
      },
      {
        text: 'Add a second super admin, require MFA for everyone, suspend Jordan and forward the mail.',
        correct: true,
        why: 'Whoever controls email can reset the password of every other account. Two admins, MFA, and fast offboarding protect all of them at once.',
      },
    ],
  },
]

export function KeyAudit({ onDone }: { onDone?: () => void }) {
  return (
    <AuditBoard
      items={ACCOUNTS}
      meterLabel="🔑 Accounts the company truly controls"
      riskLabel="At risk"
      fixedLabel="Owned"
      onDone={onDone}
      finale={(ok, n) =>
        `All ${n} accounts now belong to the company, with at least two people who can get in. Your bus factor went from 1 to 2 — one person leaving (or losing a phone) no longer stops the business. ${ok}/${n} fixed on the first try.`
      }
    />
  )
}
