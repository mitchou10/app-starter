import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export interface CurrentUser {
  user_id: string
  email: string
  name: string
  username: string
  roles: string[]
  groups: string[]
  is_admin: boolean
}

interface AuthContextValue {
  user: CurrentUser | null
  /** Changes with every new profile photo, None without one: the photo's URL carries it, so it is never stale. */
  avatarVersion: number | null
  /** Asks the backend again for the profile, after the photo was changed. */
  refreshProfile: () => Promise<void>
  /** False until the first answer of the backend: do not show "signed out" before that. */
  loaded: boolean
  login: (redirect?: string) => void
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

/** Asks the backend once who is logged in, and shares the answer with the whole app. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [avatarVersion, setAvatarVersion] = useState<number | null>(null)

  const refreshProfile = useCallback(async () => {
    try {
      const response = await fetch('/api/me/profile')
      if (!response.ok) return
      const profile = (await response.json()) as { avatar_version?: number | null }
      setAvatarVersion(profile.avatar_version ?? null)
    } catch {
      // The photo is a nicety: the app works without it.
    }
  }, [])

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
        if (current) void refreshProfile()
      })
    return () => {
      cancelled = true
    }
  }, [refreshProfile])

  // The browser leaves for the identity provider: the backend (BFF) runs the whole flow and keeps the tokens.
  const login = useCallback((redirect = '/') => {
    window.location.href = `/api/auth/login?redirect=${encodeURIComponent(redirect)}`
  }, [])

  const logout = useCallback(async () => {
    const response = await fetch('/api/auth/logout', { method: 'POST' })
    const { logout_url } = (await response.json()) as { logout_url: string | null }
    setUser(null)
    setAvatarVersion(null)
    window.location.href = logout_url ?? '/'
  }, [])

  const value = useMemo(
    () => ({ user, loaded, avatarVersion, refreshProfile, login, logout }),
    [user, loaded, avatarVersion, refreshProfile, login, logout],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useCurrentUser(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useCurrentUser must be used inside <AuthProvider>')
  return context
}
