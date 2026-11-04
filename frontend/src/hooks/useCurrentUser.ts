import { useCallback, useEffect, useState } from 'react'

export interface CurrentUser {
  user_id: string
  email: string
  name: string
  username: string
  roles: string[]
  groups: string[]
  is_admin: boolean
}

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [loaded, setLoaded] = useState(false)

  // 401 is the normal answer of a visitor who is not logged in, not an error.
  useEffect(() => {
    let cancelled = false
    fetch('/api/auth/me')
      .then((response) => (response.ok ? (response.json() as Promise<CurrentUser>) : null))
      .catch(() => null)
      .then((current) => {
        if (cancelled) return
        setUser(current)
        setLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // The browser leaves for the identity provider: the backend (BFF) runs the whole flow and keeps the tokens.
  const login = useCallback((redirect = '/') => {
    window.location.href = `/api/auth/login?redirect=${encodeURIComponent(redirect)}`
  }, [])

  const logout = useCallback(async () => {
    const response = await fetch('/api/auth/logout', { method: 'POST' })
    const { logout_url } = (await response.json()) as { logout_url: string | null }
    setUser(null)
    window.location.href = logout_url ?? '/'
  }, [])

  return { user, loaded, login, logout }
}
