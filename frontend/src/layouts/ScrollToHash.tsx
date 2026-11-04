import { useEffect } from 'react'
import { useLocation } from 'react-router'

/** Client-side navigation does not scroll to `#section` on its own: do it, or go back to the top. */
export function ScrollToHash() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView()
    else window.scrollTo(0, 0)
  }, [pathname, hash])

  return null
}
