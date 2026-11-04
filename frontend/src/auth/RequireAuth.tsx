import { useTranslation } from 'react-i18next'
import { Outlet, useLocation } from 'react-router'
import { useCurrentUser } from './AuthProvider'
import { Button } from '@/components/ui/button'

/**
 * Layout route: everything nested inside needs a logged-in user. Anyone else gets a sign-in button that brings
 * them back to the page they asked for (the backend only accepts internal paths).
 */
export function RequireAuth() {
  const { t } = useTranslation()
  const { user, loaded, login } = useCurrentUser()
  const { pathname, search } = useLocation()

  if (!loaded) return null
  if (user) return <Outlet />

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 text-center">
      <p className="text-lg">{t('auth.required')}</p>
      <Button onClick={() => login(pathname + search)}>{t('auth.signIn')}</Button>
    </main>
  )
}
