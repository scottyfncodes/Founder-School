import { useEffect, useRef, useState, type ReactNode } from 'react'

/**
 * Shared shell for the Security Attack Lab. Every vulnerability is played in
 * three beats inside a fictional sandbox app ("KiteDesk"):
 *   1. What the developer intended  (learner uses the app normally)
 *   2. What actually happened       (learner triggers the flaw)
 *   3. The fix                      (learner switches the fix on and retries — blocked)
 */

export type VulnResult = 'normal' | 'breach' | 'blocked'

export interface VulnApi {
  /** 0 = use it normally, 1 = attack, 2 = fix + retry, 3 = finished */
  stage: 0 | 1 | 2 | 3
  fixOn: boolean
  /** True while the sandbox is animating — the shell disables the fix switch. */
  busy: boolean
  setBusy: (b: boolean) => void
  report: (r: VulnResult) => void
  last: VulnResult | null
}

interface Props {
  emoji: string
  name: string
  /** Beat 1 — what the developer meant to happen. */
  intended: string
  /** Beat 2 — plain-English explanation of the breach. */
  happened: string
  /** Beat 3 — the fix. */
  fixName: string
  fixText: string
  /** Shown once the attack is blocked. */
  blocked: string
  /** Sandbox address bar text. */
  url: (api: VulnApi) => string
  sandbox: (api: VulnApi) => ReactNode
  onDone?: () => void
}

const BEATS = ['Intended', 'What happened', 'The fix']

export function VulnCase({ emoji, name, intended, happened, fixName, fixText, blocked, url, sandbox, onDone }: Props) {
  const [stage, setStage] = useState<VulnApi['stage']>(0)
  const [fixOn, setFixOn] = useState(false)
  const [busy, setBusy] = useState(false)
  const [last, setLast] = useState<VulnResult | null>(null)
  const fired = useRef(false)

  function report(r: VulnResult) {
    setLast(r)
    if (r === 'normal' && stage === 0) setStage(1)
    if (r === 'breach' && stage < 2) setStage(2)
    if (r === 'blocked' && stage >= 2) setStage(3)
  }

  useEffect(() => {
    if (stage === 3 && !fired.current) {
      fired.current = true
      onDone?.()
    }
  }, [stage, onDone])

  const api: VulnApi = { stage, fixOn, busy, setBusy, report, last }
  const hint =
    stage === 0
      ? 'Step 1 — use the app the way the developer expected.'
      : stage === 1
        ? 'Step 2 — now try the attack.'
        : stage === 2 && !fixOn
          ? 'Step 3 — switch the fix on, then try the attack again.'
          : stage === 2
            ? 'Fix is on. Run the same attack again.'
            : 'Done. Flip the fix off and on to compare, if you like.'

  return (
    <div className="stack">
      <div className="row nowrap" style={{ gap: 6 }} aria-label="Progress">
        {BEATS.map((b, i) => {
          const doneBeat = stage > i
          const current = stage === i || (i === 2 && stage === 3)
          return (
            <span
              key={b}
              className="pill"
              style={{
                flex: 1,
                justifyContent: 'center',
                whiteSpace: 'normal',
                textAlign: 'center',
                background: doneBeat ? 'var(--good-soft)' : current ? 'var(--accent-soft)' : undefined,
                color: doneBeat ? 'var(--good)' : current ? 'var(--accent)' : undefined,
              }}
            >
              {doneBeat ? '✓' : i + 1} {b}
            </span>
          )
        })}
      </div>

      <div className="callout info small">
        <div className="kicker" style={{ color: 'var(--info)' }}>
          {emoji} {name} · What the developer intended
        </div>
        {intended}
      </div>

      <p className="small ink2" aria-live="polite" style={{ fontWeight: 600 }}>
        {hint}
      </p>

      {stage >= 2 && (
        <div className="card tight flat row nowrap pop" style={{ alignItems: 'flex-start', borderColor: fixOn ? 'var(--good)' : undefined }}>
          <div className="grow stack sm">
            <div style={{ fontWeight: 700 }}>🛠️ Fix: {fixName}</div>
            <p className="tiny ink2">{fixText}</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={fixOn}
            aria-label={`Fix: ${fixName}`}
            className="switch"
            disabled={busy}
            onClick={() => {
              setFixOn(!fixOn)
              setLast(null)
            }}
          />
        </div>
      )}

      <div className="card tight stack sm" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="row nowrap" style={{ gap: 6, padding: '8px 10px', background: 'var(--surface-2)', borderBottom: '1px solid var(--line)' }}>
          <span aria-hidden="true" className="tiny">
            🪁
          </span>
          <span className="mono tiny grow" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {url(api)}
          </span>
          <span className="pill" style={{ background: 'var(--warn-soft)', color: 'var(--warn)' }}>
            SANDBOX
          </span>
        </div>
        <div className="stack sm" style={{ padding: 12 }}>
          {sandbox(api)}
        </div>
      </div>

      <div aria-live="polite">
        {last === 'breach' && (
          <div className="callout bad pop">
            <b>💥 What actually happened: </b>
            {happened}
          </div>
        )}
        {last === 'blocked' && (
          <div className="callout good pop">
            <b>🔒 Blocked. </b>
            {blocked}
          </div>
        )}
      </div>
    </div>
  )
}

/** Small helper: a line in a sandbox's activity log. */
export function LogLine({ tone, children }: { tone?: 'good' | 'bad' | 'warn'; children: ReactNode }) {
  return (
    <div className={`mono tiny pop ${tone ? `${tone}-text` : 'ink2'}`} style={{ overflowWrap: 'anywhere' }}>
      {children}
    </div>
  )
}
