import { useEffect } from 'react'
import { useRoute, href } from './lib/router'
import { lessonById, worldById, worldOfLesson } from './content/curriculum'
import { Home } from './pages/Home'
import { WorldPage } from './pages/WorldPage'
import { MapPage } from './pages/MapPage'
import { GlossaryPage } from './pages/GlossaryPage'
import { ScenariosPage } from './pages/ScenariosPage'
import { ProgressPage } from './pages/ProgressPage'
import { CapstonePage } from './capstone/CapstonePage'
import { LessonPlayer } from './components/LessonPlayer'
import { TabBar } from './components/bits'

function NotFound() {
  return (
    <main className="page stack center" style={{ paddingTop: 80 }}>
      <div style={{ fontSize: 48 }} aria-hidden="true">
        🧭
      </div>
      <h2>That page doesn’t exist</h2>
      <p className="muted">Like a 404 error — the server is fine, the address just points nowhere.</p>
      <a className="btn primary" href={href('/')}>
        Go home
      </a>
    </main>
  )
}

export default function App() {
  const [section = '', id] = useRoute()

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [section, id])

  let page: React.ReactNode
  let immersive = false
  let title = 'Software Founder School'

  switch (section) {
    case '':
      page = <Home />
      break
    case 'world': {
      const w = id ? worldById(id) : undefined
      page = w ? <WorldPage world={w} /> : <NotFound />
      if (w) title = `${w.title} · Founder School`
      break
    }
    case 'lesson': {
      const l = id ? lessonById(id) : undefined
      const w = id ? worldOfLesson(id) : undefined
      page = l && w ? <LessonPlayer key={l.id} lesson={l} world={w} /> : <NotFound />
      immersive = !!l
      if (l) title = `${l.title} · Founder School`
      break
    }
    case 'map':
      page = <MapPage />
      title = 'Architecture map · Founder School'
      break
    case 'glossary':
      page = <GlossaryPage key={id ?? ''} openId={id} />
      title = 'Glossary · Founder School'
      break
    case 'scenarios':
      page = <ScenariosPage playId={id} />
      title = 'Reality checks · Founder School'
      break
    case 'capstone':
      page = <CapstonePage />
      title = 'Capstone · Founder School'
      break
    case 'progress':
      page = <ProgressPage />
      title = 'Progress · Founder School'
      break
    default:
      page = <NotFound />
  }

  useEffect(() => {
    document.title = title
  }, [title])

  return (
    <>
      {page}
      {!immersive && <TabBar section={section} />}
    </>
  )
}
