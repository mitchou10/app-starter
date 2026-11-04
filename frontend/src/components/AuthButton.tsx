import { useTranslation } from 'react-i18next'
import { useCurrentUser } from '@/auth/AuthProvider'
import { LinkButton } from '@/features/landing/LinkButton'
import { Button } from '@/components/ui/button'

/** Public header: sign in when logged out, a way into the app once logged in (sign out is in the app's menu). */
export function AuthButton() {
  const { t } = useTranslation()
  const { user, loaded, login } = useCurrentUser()

  if (!loaded) return null
  if (!user) return <Button onClick={() => login('/app')}>{t('auth.signIn')}</Button>
  return <LinkButton to="/app" size="default">{t('auth.openApp')}</LinkButton>
}
