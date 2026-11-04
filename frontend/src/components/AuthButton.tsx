import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { useCurrentUser } from '@/auth/AuthProvider'

/** Sign in when logged out, the user and sign out when logged in. */
export function AuthButton() {
  const { t } = useTranslation()
  const { user, loaded, login, logout } = useCurrentUser()

  if (!loaded) return null
  if (!user) return <Button onClick={() => login()}>{t('auth.signIn')}</Button>

  return (
    <div className="flex items-center gap-3">
      <Link to="/account" className="hidden text-sm hover:underline sm:inline">
        {user.name || user.username || user.email}
      </Link>
      <Button variant="outline" onClick={() => void logout()}>
        {t('auth.signOut')}
      </Button>
    </div>
  )
}
