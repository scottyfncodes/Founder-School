import { useSyncExternalStore } from 'react'

/** Hash routes: #/, #/world/w2, #/lesson/w2-api, #/map, #/glossary, #/glossary/api ... */
function read() {
  return window.location.hash.replace(/^#/, '') || '/'
}

function subscribe(l: () => void) {
  window.addEventListener('hashchange', l)
  return () => window.removeEventListener('hashchange', l)
}

export function useRoute(): string[] {
  const path = useSyncExternalStore(subscribe, read, () => '/')
  return path.split('/').filter(Boolean).map(decodeURIComponent)
}

export function href(path: string) {
  return '#' + path
}

export function go(path: string) {
  window.location.hash = path
}

export function back(fallback = '/') {
  if (window.history.length > 1) window.history.back()
  else go(fallback)
}
