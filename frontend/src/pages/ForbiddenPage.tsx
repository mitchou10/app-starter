import { useTranslation } from 'react-i18next'
import { Section } from '@/components/Section'
import { LinkButton } from '@/features/landing/LinkButton'

export function ForbiddenPage() {
  const { t } = useTranslation()

  return (
    <Section className="text-center">
      <p className="text-6xl font-bold text-muted-foreground">403</p>
      <h1 className="mt-4 text-3xl font-semibold">{t('forbidden.title')}</h1>
      <p className="mt-3 text-muted-foreground">{t('forbidden.description')}</p>
      <div className="mt-8">
        <LinkButton to="/app">{t('forbidden.back')}</LinkButton>
      </div>
    </Section>
  )
}
