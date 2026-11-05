import { useEffect, useState } from 'react'

function parse(): string[] {
  const raw = window.location.hash.replace(/^#\/?/, '')
  return raw.split('?')[0].split('/').filter(Boolean).map(decodeURIComponent)
}

export function useRoute(): string[] {
  const [route, setRoute] = useState(parse)
  useEffect(() => {
    const on = () => setRoute(parse())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return route
}

export function navigate(href: string) {
  if (window.location.hash === href) return
  window.location.hash = href
}
