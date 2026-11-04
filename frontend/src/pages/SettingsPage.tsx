import { useTranslation } from 'react-i18next'
import { useCurrentUser } from '@/auth/AuthProvider'
import { Section } from '@/components/Section'
import { SectionHeading } from '@/components/SectionHeading'
import { AvatarUploader } from '@/profile/AvatarUploader'

/** Example of a page of the app: it lives under <AppLayout>, see routes.tsx. */
export function SettingsPage() {
  const { t } = useTranslation()
  const { user } = useCurrentUser()
  if (!user) return null

  return (
    <Section>
      <SectionHeading title={t('settings.title')} />
      <div className="mx-auto mb-10 flex max-w-md justify-center">
        <AvatarUploader />
      </div>
      <dl className="mx-auto grid max-w-md grid-cols-[auto_1fr] gap-x-6 gap-y-3">
        <dt className="text-muted-foreground">{t('settings.name')}</dt>
        <dd>{user.name || user.username}</dd>
        <dt className="text-muted-foreground">{t('settings.email')}</dt>
        <dd>{user.email}</dd>
        <dt className="text-muted-foreground">{t('settings.roles')}</dt>
        <dd>{user.roles.join(', ') || '-'}</dd>
      </dl>
    </Section>
  )
}
