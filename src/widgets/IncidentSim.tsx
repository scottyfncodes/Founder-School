import { useRef, useState } from 'react'

/* A Friday-afternoon incident, played as five decisions. Choices carry consequences
   (downtime, customer trust) and the timeline records everything that happened. */

type Status = 'ok' | 'investigating' | 'monitoring' | 'resolved' | 'silent' | 'lie'

interface Choice {
  text: string
  best?: boolean
  /** Minutes of extra downtime this choice causes. */
  mins: number
  trust: number
  log: string
  why: string
  status?: Status
  errors?: number
}

interface Decision {
  phase: string
  prompt: string
  choices: Choice[]
}

const DECISIONS: Decision[] = [
  {
    phase: 'Triage',
    prompt: '📟 4:12 PM Friday. Alert: login errors at 40% (normally under 1%). You’re on call. What first?',
    choices: [
      {
        text: 'Declare an incident and check what changed recently',
        best: true,
        mins: 3,
        trust: 0,
        log: 'Incident declared. Found it: deploy v142 went out at 4:05 PM, 7 minutes before errors started.',
        why: 'Most incidents are caused by a recent change. “What changed?” is the fastest first question.',
      },
      {
        text: 'Start reading the login code line by line',
        mins: 40,
        trust: -5,
        log: '40 minutes of code reading. Eventually you notice the 4:05 PM deploy.',
        why: 'Deep debugging is for later. During an incident, find the likely cause fast and stop the bleeding.',
      },
      {
        text: 'Wait 15 minutes to see if it clears up',
        mins: 15,
        trust: -10,
        log: 'Waited 15 min. Errors still at 40%. Then you check recent deploys.',
        why: 'Errors rarely heal themselves. Waiting is just downtime with extra steps.',
      },
    ],
  },
  {
    phase: 'Communicate',
    prompt: 'Support has 30 new emails: “I can’t log in!” What do you tell customers?',
    choices: [
      {
        text: 'Status page: “Investigating — some users can’t log in. Next update in 30 min.”',
        best: true,
        mins: 0,
        trust: 10,
        status: 'investigating',
        log: 'Status page updated. Support links to it; new emails slow to a trickle.',
        why: 'Fast, honest, and with a time for the next update. Customers forgive outages far more than silence.',
      },
      {
        text: 'Say nothing until it’s fixed',
        mins: 0,
        trust: -20,
        status: 'silent',
        log: 'No update. Support inbox hits 120 emails; two customers post on social media.',
        why: 'Silence makes customers assume the worst — and floods your support team while you’re trying to fix things.',
      },
      {
        text: 'Status page: “All systems operational”',
        mins: 0,
        trust: -35,
        status: 'lie',
        log: 'Status page says all is fine while customers can’t log in. Screenshots start circulating.',
        why: 'A status page that contradicts reality destroys trust in everything else you say.',
      },
    ],
  },
  {
    phase: 'Fix',
    prompt: 'Deploy v142 is the prime suspect. How do you stop the bleeding?',
    choices: [
      {
        text: 'Roll back to v141 (the last version that worked)',
        best: true,
        mins: 4,
        trust: 5,
        errors: 0.4,
        status: 'monitoring',
        log: 'Rolled back to v141 in 4 minutes. Login errors fall to 0.4%.',
        why: 'Rollback first, understand later. Going back to known-good code is the fastest, safest fix.',
      },
      {
        text: 'Write a quick fix and push it straight to production',
        mins: 35,
        trust: -5,
        errors: 0.4,
        status: 'monitoring',
        log: 'Hotfix #1 had a typo and broke signup too. Hotfix #2 works, 35 minutes later.',
        why: 'Rushed changes under pressure often cause a second incident. Roll back, then fix calmly.',
      },
      {
        text: 'Restore the database from last night’s backup',
        mins: 90,
        trust: -20,
        errors: 0.4,
        status: 'monitoring',
        log: 'Restore took 90 minutes and erased today’s data. Errors continued until you also rolled back the code.',
        why: 'The data was fine — the code was broken. A restore is for data disasters, and it costs you every change since the backup.',
      },
    ],
  },
  {
    phase: 'Resolve',
    prompt: 'Login errors are back to normal (0.4%). Now what?',
    choices: [
      {
        text: 'Watch it for 15 minutes, then mark resolved and update the status page',
        best: true,
        mins: 0,
        trust: 10,
        status: 'resolved',
        log: 'Stable for 15 minutes. Status page: “Resolved — logins work again. Sorry for the disruption; details to follow.”',
        why: 'Confirm the fix holds, then close the loop with customers. They saw the problem; let them see the ending.',
      },
      {
        text: 'Mark it resolved right away and go home',
        mins: 0,
        trust: -5,
        status: 'resolved',
        log: 'Marked resolved without checking. It held — this time.',
        why: 'You got lucky. A fix that isn’t verified can quietly fail again on a Friday night with nobody watching.',
      },
    ],
  },
  {
    phase: 'Learn',
    prompt: 'Monday morning. What do you do about Friday?',
    choices: [
      {
        text: 'Blameless postmortem: timeline, cause, what let it through, 2–3 fixes',
        best: true,
        mins: 0,
        trust: 10,
        log: 'Postmortem done. Actions: add a login test to CI, deploy Friday changes earlier, alert at 5% not 40%.',
        why: 'Ask “what in our process allowed this?” — not “who did it?”. That’s how the same incident doesn’t happen twice.',
      },
      {
        text: 'Find out who wrote the bug and make sure they know',
        mins: 0,
        trust: -10,
        log: 'The engineer is named in Slack. Next time, people are slower to admit mistakes.',
        why: 'Blame teaches people to hide problems. The same gap (no login test) is still there for the next person.',
      },
      {
        text: 'Move on — it’s fixed',
        mins: 0,
        trust: -5,
        log: 'Nothing changes. Three weeks later, a similar deploy breaks login again.',
        why: 'Without a postmortem, the conditions that caused the incident are still in place.',
      },
    ],
  },
]

const STATUS: Record<Status, { emoji: string; text: string; tone: string }> = {
  ok: { emoji: '🟢', text: 'All systems operational', tone: 'var(--good)' },
  investigating: { emoji: '🟠', text: 'Investigating: some users can’t log in', tone: 'var(--warn)' },
  monitoring: { emoji: '🔵', text: 'Fix deployed — monitoring', tone: 'var(--info)' },
  resolved: { emoji: '🟢', text: 'Resolved', tone: 'var(--good)' },
  silent: { emoji: '🟢', text: 'All systems operational (not updated)', tone: 'var(--muted)' },
  lie: { emoji: '🟢', text: 'All systems operational (while broken!)', tone: 'var(--bad)' },
}

const BASE_DOWN = 7 // errors began at 4:05, alert at 4:12

export function IncidentSim({ onDone }: { onDone?: () => void }) {
  const [step, setStep] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [history, setHistory] = useState<Choice[]>([])
  const [status, setStatus] = useState<Status>('ok')
  const [errors, setErrors] = useState(40)
  const [runs, setRuns] = useState(0)
  const fired = useRef(false)

  const decision = DECISIONS[step]
  const finished = step >= DECISIONS.length
  const downtime = BASE_DOWN + history.reduce((s, c) => s + c.mins, 0)
  const trust = Math.max(0, Math.min(100, 70 + history.reduce((s, c) => s + c.trust, 0)))
  const bestCount = history.filter((c) => c.best).length

  function choose(i: number) {
    if (picked !== null) return
    const c = decision.choices[i]
    setPicked(i)
    setHistory((h) => [...h, c])
    if (c.status) setStatus(c.status)
    if (c.errors !== undefined) setErrors(c.errors)
  }

  function next() {
    setPicked(null)
    const n = step + 1
    setStep(n)
    if (n >= DECISIONS.length) {
      setRuns((r) => r + 1)
      if (!fired.current) {
        fired.current = true
        onDone?.()
      }
    }
  }

  function replay() {
    setStep(0)
    setPicked(null)
    setHistory([])
    setStatus('ok')
    setErrors(40)
  }

  const st = STATUS[status]

  return (
    <div className="stack">
      <div className="grid3">
        <div className="stat">
          <span className={`v ${errors > 5 ? 'bad-text' : 'good-text'}`}>{errors}%</span>
          <span className="l">login errors</span>
        </div>
        <div className="stat">
          <span className="v">{downtime}m</span>
          <span className="l">downtime</span>
        </div>
        <div className="stat">
          <span className={`v ${trust < 50 ? 'bad-text' : trust >= 80 ? 'good-text' : ''}`}>{trust}</span>
          <span className="l">customer trust</span>
        </div>
      </div>

      <div className="card tight flat row nowrap" style={{ gap: 10 }}>
        <span aria-hidden="true" style={{ fontSize: 20 }}>
          {st.emoji}
        </span>
        <div className="grow">
          <div className="tiny muted">status.kitedesk.example</div>
          <div className="small" style={{ fontWeight: 650, color: st.tone }}>
            {st.text}
          </div>
        </div>
      </div>

      {!finished && (
        <div className="stack sm" key={step}>
          <div className="row between">
            <span className="kicker">
              Decision {step + 1}/{DECISIONS.length} · {decision.phase}
            </span>
          </div>
          <p style={{ fontWeight: 650 }}>{decision.prompt}</p>
          {decision.choices.map((c, i) => (
            <button
              key={i}
              type="button"
              className={`chip ${picked === i ? (c.best ? 'good' : 'bad') : ''}`}
              disabled={picked !== null && picked !== i}
              onClick={() => choose(i)}
            >
              {c.text}
            </button>
          ))}
          {picked !== null && (
            <div className="stack sm pop" aria-live="polite">
              <div className={`callout ${decision.choices[picked].best ? 'good' : 'warn'} small`}>
                <b>{decision.choices[picked].best ? 'Strong call. ' : 'This costs you. '}</b>
                {decision.choices[picked].why}
                {!decision.choices[picked].best && (
                  <span className="muted"> Better: “{decision.choices.find((c) => c.best)?.text}”.</span>
                )}
              </div>
              <button type="button" className="btn primary block" onClick={next}>
                {step === DECISIONS.length - 1 ? 'See how it went' : 'Next →'}
              </button>
            </div>
          )}
        </div>
      )}

      {finished && (
        <div className="stack sm pop" aria-live="polite">
          <div className={`callout ${bestCount === DECISIONS.length ? 'good' : bestCount >= 3 ? 'info' : 'warn'}`}>
            <b>
              {bestCount}/{DECISIONS.length} strong calls.
            </b>{' '}
            Logins were down {downtime} minutes (best possible: 14). Customer trust ended at {trust}/100.
            {bestCount < DECISIONS.length ? ' Replay and see how the numbers change.' : ' Textbook incident handling.'}
          </div>
          <button type="button" className="btn block" onClick={replay}>
            ↻ Replay the incident{runs > 1 ? ` (run ${runs + 1})` : ''}
          </button>
        </div>
      )}

      {history.length > 0 && (
        <div className="stack sm">
          <div className="kicker">Incident timeline</div>
          <ol className="small" style={{ margin: 0, paddingLeft: 20 }}>
            <li className="bad-text">4:05 PM — deploy v142; login errors begin.</li>
            {history.map((c, i) => (
              <li key={i} className={c.best ? '' : 'warn-text'}>
                <b>{DECISIONS[i].phase}:</b> {c.log}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}
