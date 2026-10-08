import type { World } from '../../lib/types'
import { BackupChain, RestoreDrill } from '../../widgets/BackupDrill'
import { MonitorBoard } from '../../widgets/MonitorBoard'
import { IncidentSim } from '../../widgets/IncidentSim'

const world: World = {
  id: 'w8',
  num: 8,
  title: 'Reliability + Backups',
  tagline: 'Things will break. Be ready.',
  emoji: '🛟',
  color: '#f08c00',
  skill: 'reliability',
  concepts: [
    { id: 'rel-backups', name: 'Backups & retention' },
    { id: 'rel-offsite', name: 'Offsite & immutable backups' },
    { id: 'rel-restore', name: 'Restores & restore drills' },
    { id: 'rel-pitr', name: 'Point-in-time recovery' },
    { id: 'rel-rpo-rto', name: 'RPO, RTO & disaster recovery' },
    { id: 'rel-logs', name: 'Logs & request tracing' },
    { id: 'rel-monitoring', name: 'Monitoring & alerts' },
    { id: 'rel-incidents', name: 'Incident response' },
    { id: 'rel-postmortems', name: 'Postmortems' },
  ],
  lessons: [
    /* ------------------------------------------------------------ */
    {
      id: 'w8-backups',
      title: 'Backups & the restore drill',
      subtitle: 'Destroy the database, then bring it back yourself.',
      minutes: 10,
      concepts: ['rel-backups', 'rel-offsite', 'rel-restore', 'rel-pitr', 'rel-rpo-rto'],
      unlocks: ['backups'],
      steps: [
        {
          kind: 'concept',
          emoji: '🛟',
          title: 'A backup is a copy you can go back to',
          what: 'A backup is a saved copy of your data from a moment in time. Good setups keep several copies, in different places, for different disasters.',
          why: 'Databases get deleted by bad scripts, corrupted by bugs, taken offline by outages and encrypted by ransomware. Without a copy, your customers’ data is simply gone.',
        },
        {
          kind: 'widget',
          title: 'Four layers of copies',
          instruction: 'Tap the layers to see what each one is, then unleash all four disasters.',
          render: ({ done }) => <BackupChain onDone={done} />,
        },
        {
          kind: 'points',
          title: 'Backup vocabulary',
          points: [
            { term: '💾 Backup', text: 'A copy of your data from a specific moment, stored separately from the live database.' },
            { term: '🗓️ Retention', text: 'How long copies are kept before deletion. Too short, and a slow-burning problem outlives every clean copy.' },
            { term: '🌍 Offsite', text: 'Stored far away — another region or provider — so one disaster can’t reach both.' },
            { term: '🧊 Immutable', text: 'Locked so nobody can change or delete it for a set time. Your last line of defense against ransomware.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w8-backups-q1',
          context: 'An attacker steals your cloud admin keys and encrypts your database. Your nightly backups live in the same cloud account.',
          prompt: 'Which copy can you count on?',
          level: 2,
          concepts: ['rel-offsite', 'rel-backups'],
          options: [
            { text: 'The nightly backups — that’s what they’re for', why: 'The attacker holds the same keys that can delete them. Attackers go after backups first, precisely so you’ll pay.' },
            { text: 'An immutable backup with a time lock', correct: true, why: 'Right. Nobody — not even someone with admin keys — can delete it until the lock expires. That’s what lets you restore instead of paying a ransom.' },
            { text: 'Whatever copy is newest', why: 'Newest doesn’t matter if the attacker can reach it. What matters is whether your stolen keys could delete it.' },
            { text: 'The live database, after a restart', why: 'Restarting doesn’t decrypt data. The live database is the thing that was attacked.' },
          ],
        },
        {
          kind: 'concept',
          emoji: '⏱️',
          title: 'Two numbers that define “recovered”',
          what: 'RPO (recovery point) is how much recent data you can afford to lose. RTO (recovery time) is how long you can afford to be down.',
          why: 'They turn “we have backups” into a promise you can test. Point-in-time recovery shrinks RPO to minutes; practice shrinks RTO.',
        },
        {
          kind: 'widget',
          title: 'The restore drill',
          instruction: 'Decide what to do, pick a backup, choose a restore point, restore, then verify the data.',
          render: ({ done }) => <RestoreDrill onDone={done} />,
        },
        {
          kind: 'quiz',
          id: 'w8-backups-q2',
          context: 'An investor asks about disaster recovery. Your developer says: “We have daily automatic backups, so we’re covered.”',
          prompt: 'What’s the best follow-up question?',
          level: 3,
          concepts: ['rel-restore', 'rel-rpo-rto'],
          options: [
            { text: '“Which cloud provider makes the backups?”', why: 'Good to know, but it doesn’t tell you whether a restore actually works or how long it takes.' },
            { text: '“When did we last restore one, how long did it take, and how much data would we lose?”', correct: true, why: 'Yes. A backup that has never been restored is a theory. A tested restore gives you real RPO and RTO numbers to share.' },
            { text: '“Can we back up twice a day instead?”', why: 'More frequent backups may help RPO, but you still don’t know if a restore works. Test first, then tune.' },
            { text: 'None — automatic backups are enough', why: 'Backups fail silently all the time: wrong database, expired credentials, corrupted files. Only a restore proves them.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w8-backups-q3',
          context: 'A big customer’s contract requires: “No more than 5 minutes of data loss, and back online within 1 hour.”',
          prompt: 'Which setup can honestly meet that?',
          level: 4,
          concepts: ['rel-pitr', 'rel-rpo-rto', 'rel-restore'],
          options: [
            { text: 'Nightly backups, restored by hand when needed', why: 'A nightly backup can lose up to 24 hours of data — far beyond a 5-minute RPO.' },
            { text: 'Point-in-time recovery (or a live replica), with a restore drill timed under an hour', correct: true, why: 'Continuous change logs give minute-level RPO, and a practiced, timed drill is the only evidence you can meet a 1-hour RTO.' },
            { text: 'Weekly offsite backups', why: 'Great for surviving regional disasters, but up to a week of data loss — nowhere near 5 minutes.' },
            { text: 'Any setup — just write “5 min / 1 hour” in the contract', why: 'Promising numbers you’ve never tested is how a bad day becomes a breach of contract.' },
          ],
        },
        {
          kind: 'care',
          points: [
            'A backup that has never been restored is a theory. Schedule a restore drill every quarter and write down the RPO and RTO you actually got.',
            'Keep at least one copy offsite and one immutable. Ransomware crews target backups first.',
            'Check retention: if a bug went unnoticed for two weeks, would you still have a clean copy?',
            'Investors, acquirers and enterprise customers ask “what’s your disaster recovery plan?” — real numbers beat reassurance.',
          ],
        },
      ],
    },

    /* ------------------------------------------------------------ */
    {
      id: 'w8-monitoring',
      title: 'Logs, monitoring & alerts',
      subtitle: 'Find out before your customers tell you.',
      minutes: 7,
      concepts: ['rel-logs', 'rel-monitoring'],
      unlocks: ['logging', 'monitoring'],
      steps: [
        {
          kind: 'concept',
          emoji: '📟',
          title: 'Your app’s smoke detectors',
          what: 'Logs are your app’s diary: one line per thing that happened. Monitoring turns those events into charts, and alerts wake you when a chart crosses a line.',
          why: 'Without them, problems are invisible until a customer complains — or quietly leaves. With them, you find out first and can see exactly what went wrong.',
        },
        {
          kind: 'widget',
          title: 'The same bad Tuesday, twice',
          instruction: 'Play the morning with monitoring off, then on. When the alert fires, trace a failed request through the logs.',
          render: ({ done }) => <MonitorBoard onDone={done} />,
        },
        {
          kind: 'points',
          title: 'The toolkit',
          points: [
            { term: '📜 Logs', text: 'Timestamped records of events and errors. The first place to look when something breaks.' },
            { term: '🔗 Request ID / trace', text: 'One ID attached to a request as it passes through every box, so you can follow it end to end.' },
            { term: '📈 Metrics', text: 'Numbers over time: error rate, response time, signups. Good for spotting “something changed”.' },
            { term: '🚨 Alerts', text: 'A rule that notifies a person when a metric crosses a line. Alert on what customers feel.' },
            { term: '🩺 Uptime check', text: 'A robot that visits your app every minute from outside and alerts if it doesn’t load.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w8-monitoring-q1',
          prompt: 'A customer says “checkout failed at 9:14”. What lets you find out exactly why?',
          level: 2,
          concepts: ['rel-logs'],
          options: [
            { text: 'The error-rate chart', why: 'The chart shows THAT errors rose, not why one specific checkout failed. For that you need the detailed records.' },
            { text: 'Logs with a request ID you can trace through each service', correct: true, why: 'Right. Find the failing request, follow its ID through frontend, API, backend and payments, and you see the exact step that broke.' },
            { text: 'The uptime check', why: 'An uptime check only knows whether the homepage loads. Checkout can be broken while the homepage is fine.' },
            { text: 'Asking the customer to try again', why: 'That may help them, but it tells you nothing about the cause — and the next customer hits the same bug.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w8-monitoring-q2',
          context: 'You set up 40 alerts. Your phone buzzes 30 times a day, mostly for things that fix themselves.',
          prompt: 'What’s the right move?',
          level: 3,
          concepts: ['rel-monitoring'],
          options: [
            { text: 'Mute notifications and check the dashboard when you remember', why: 'Then the one alert that matters gets missed too. That’s how a 2-hour outage happens with monitoring “on”.' },
            { text: 'Keep a few alerts on what customers feel (errors, slowness, failed payments); send the rest to a daily summary', correct: true, why: 'Exactly. Every page should mean “a human must act now”. Too many alerts train everyone to ignore them.' },
            { text: 'Add more alerts so nothing is missed', why: 'More noise makes the real signal harder to see. Alert fatigue is a real cause of missed incidents.' },
            { text: 'Turn monitoring off — it’s too noisy', why: 'Then you’re back to hearing about problems from angry customers. Tune it, don’t remove it.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w8-monitoring-q3',
          context: 'To debug faster, your AI agent adds a log line that prints the full checkout request — card number, email and password included.',
          prompt: 'What’s the problem?',
          level: 4,
          concepts: ['rel-logs'],
          options: [
            { text: 'None — more detail makes debugging easier', why: 'Detail is good; secrets are not. Logs are copied to many tools and people, and kept for months.' },
            { text: 'Logs become a second copy of sensitive data, so a log leak becomes a data breach', correct: true, why: 'Right. Log IDs and outcomes, never passwords or full card numbers. Many tools can mask sensitive fields automatically.' },
            { text: 'It makes the logs too long', why: 'Size is a minor cost. The real risk is that anyone with log access now sees passwords and card numbers.' },
            { text: 'It’s fine as long as the logs are deleted daily', why: 'Even a day of exposed card numbers and passwords can be a reportable breach. Don’t log them at all.' },
          ],
        },
        {
          kind: 'care',
          points: [
            'Minimum setup: an uptime check, an error-rate alert, and logs with request IDs. Most hosting platforms offer these in an afternoon.',
            'Every hour a problem goes unnoticed costs revenue and trust — most unhappy users never email, they just leave.',
            'Ask: “If checkout broke right now, who would get alerted, and how fast?” If the answer is “a customer”, fix that first.',
          ],
        },
      ],
    },

    /* ------------------------------------------------------------ */
    {
      id: 'w8-incidents',
      title: 'When things break: incidents',
      subtitle: 'Triage, communicate, roll back, learn.',
      minutes: 8,
      concepts: ['rel-incidents', 'rel-postmortems'],
      steps: [
        {
          kind: 'concept',
          emoji: '🚨',
          title: 'An incident is a problem with a process',
          what: 'An incident is anything that hurts customers right now: an outage, broken checkout, a leak. Incident response is the playbook: triage, communicate, fix, verify, learn.',
          why: 'Panic makes outages longer. A simple, practiced playbook turns a scary hour into a calm twenty minutes — and keeps customers on your side.',
        },
        {
          kind: 'widget',
          title: 'Friday, 4:12 PM',
          instruction: 'Make five decisions as the incident unfolds. Watch downtime and customer trust react, then replay to improve.',
          render: ({ done }) => <IncidentSim onDone={done} />,
        },
        {
          kind: 'points',
          title: 'The playbook',
          points: [
            { term: '🩺 Triage', text: 'How bad, how many people, since when? Then: what changed recently?' },
            { term: '📣 Status page', text: 'A public page with the current state and a time for the next update. Honest and early beats perfect.' },
            { term: '↩️ Rollback', text: 'Go back to the last version that worked. Fix the bug calmly afterwards.' },
            { term: '✅ Verify & resolve', text: 'Confirm metrics are back to normal before declaring victory, then close the loop with customers.' },
            { term: '📝 Postmortem', text: 'A blameless write-up: timeline, cause, what let it through, and a few concrete fixes.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w8-incidents-q1',
          context: 'Payments have been failing for 20 minutes. Your engineer thinks a fix will take “maybe an hour”. The last deploy was 25 minutes ago.',
          prompt: 'What should you push for?',
          level: 3,
          concepts: ['rel-incidents'],
          options: [
            { text: 'Let them write the fix — they know the code best', why: 'An hour of failed payments while coding under pressure. And rushed fixes often cause a second incident.' },
            { text: 'Roll back the last deploy now, post a status update, then fix it properly', correct: true, why: 'Stop the bleeding first. The timing points at the deploy, rollback takes minutes, and the real fix can happen without customers waiting.' },
            { text: 'Restore the database from this morning’s backup', why: 'Nothing suggests the data is broken. A restore would erase today’s orders and still leave the bad code running.' },
            { text: 'Wait to see if it resolves on its own', why: 'Every minute of waiting is lost revenue. Problems caused by a change don’t usually undo themselves.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w8-incidents-q2',
          prompt: 'Why should a postmortem be “blameless”?',
          level: 2,
          concepts: ['rel-postmortems'],
          options: [
            { text: 'So nobody has to feel bad', why: 'Kindness is a bonus, not the reason. The point is getting the truth so the problem doesn’t repeat.' },
            { text: 'Because blame makes people hide mistakes, and the process gap that allowed it stays open', correct: true, why: 'Right. If one person could break production with one change, the system allowed it. Fix the system, and people will tell you about problems early.' },
            { text: 'Because incidents are nobody’s fault', why: 'Someone did make the change. Blameless means asking “what let it through?” rather than “who do we punish?”' },
            { text: 'Because customers will read it', why: 'Some companies publish them, but blamelessness is about learning internally, not public relations.' },
          ],
        },
        {
          kind: 'quiz',
          id: 'w8-incidents-q3',
          context: 'A bad release also ran a database migration that deleted a column. Your engineer says: “We can’t just roll back the code — the old version expects that column.”',
          prompt: 'What’s the best path, and the lesson?',
          level: 4,
          concepts: ['rel-incidents', 'rel-postmortems'],
          options: [
            { text: 'Roll back anyway and hope it works', why: 'The old code would crash looking for a column that no longer exists. Hope is not a rollback plan.' },
            { text: 'Roll forward with a small fix (or turn the feature off with a flag), restore the column’s data if needed — and in the postmortem, require migrations that can be undone', correct: true, why: 'When rollback isn’t possible, a small forward fix or a feature flag is fastest. The lesson: ship changes that can be reversed, and remove old columns in a later release.' },
            { text: 'Restore the whole database from last night', why: 'That throws away a day of everyone’s data to fix one column. Point-in-time recovery or a targeted fix is far less painful.' },
            { text: 'Rewrite the feature from scratch during the outage', why: 'A big change under pressure is the riskiest option. Make the smallest change that stops the damage.' },
          ],
        },
        {
          kind: 'care',
          points: [
            'Write a one-page incident playbook now: who leads, where you talk, how to post to the status page, how to roll back.',
            'Customers judge you more on how you communicate during an outage than on the outage itself.',
            'Make “can we roll this back?” part of every risky release — especially ones that change the database.',
            'Postmortems are how a 10-person company gets more reliable without hiring an operations team.',
          ],
        },
      ],
    },
  ],
}

export default world
