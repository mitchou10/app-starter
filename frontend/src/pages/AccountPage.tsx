import { useTranslation } from 'react-i18next'
import { useCurrentUser } from '@/auth/AuthProvider'
import { Section } from '@/components/Section'
import { SectionHeading } from '@/components/SectionHeading'

/** Example of a protected page: it is only reachable through <RequireAuth>, see routes.tsx. */
export function AccountPage() {
  const { t } = useTranslation()
  const { user } = useCurrentUser()
  if (!user) return null

  return (
    <Section>
      <SectionHeading title={t('account.title')} />
      <dl className="mx-auto grid max-w-md grid-cols-[auto_1fr] gap-x-6 gap-y-3">
        <dt className="text-muted-foreground">{t('account.name')}</dt>
        <dd>{user.name || user.username}</dd>
        <dt className="text-muted-foreground">{t('account.email')}</dt>
        <dd>{user.email}</dd>
        <dt className="text-muted-foreground">{t('account.roles')}</dt>
        <dd>{user.roles.join(', ') || '-'}</dd>
      </dl>
    </Section>
  )
}
