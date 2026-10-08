import { useState } from 'react'
import { ARCH } from '../content/architecture'
import { useProgress } from '../lib/store'
import { ArchMap } from '../components/ArchMap'
import { Meter } from '../components/bits'

export function MapPage() {
  const p = useProgress()
  const [all, setAll] = useState(false)
  const unlocked = ARCH.filter((c) => p.lessons[c.lesson]).length

  return (
    <main className="page">
      <div className="stack lg">
        <header className="stack sm">
          <div className="kicker">Your architecture map</div>
          <h1>The whole machine</h1>
          <p className="lead">
            Every modern web app is made of these boxes. Each lesson adds more. Tap a box to see what it does, what flows
            through it, and what happens when it fails.
          </p>
        </header>
        <div className="card tight stack sm">
          <div className="row between">
            <span className="small">
              <b>{unlocked}</b> of {ARCH.length} boxes unlocked
            </span>
            <label className="row nowrap small" style={{ gap: 8, cursor: 'pointer' }}>
              Preview all
              <button
                type="button"
                role="switch"
                aria-checked={all}
                aria-label="Preview all boxes"
                className="switch"
                onClick={() => setAll(!all)}
              />
            </label>
          </div>
          <Meter value={unlocked / ARCH.length} label="Boxes unlocked" />
        </div>
        <ArchMap revealAll={all} />
      </div>
    </main>
  )
}
