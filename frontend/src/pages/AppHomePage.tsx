import { useTranslation } from 'react-i18next'
import { useCurrentUser } from '@/auth/AuthProvider'
import { Section } from '@/components/Section'

/** Where a user lands after signing in. Empty on purpose: this is where your product starts. */
export function AppHomePage() {
  const { t } = useTranslation()
  const { user } = useCurrentUser()

  return (
    <Section className="text-center">
      <h1 className="text-3xl font-semibold">{t('appHome.welcome', { name: user?.name || user?.username })}</h1>
      <p className="mt-3 text-muted-foreground">{t('appHome.empty')}</p>
    </Section>
  )
}
