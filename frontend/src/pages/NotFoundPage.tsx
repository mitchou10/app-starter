import { useTranslation } from 'react-i18next'
import { Section } from '@/components/Section'
import { LinkButton } from '@/features/landing/LinkButton'

export function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <Section className="text-center">
      <p className="text-6xl font-bold text-muted-foreground">404</p>
      <h1 className="mt-4 text-3xl font-semibold">{t('notFound.title')}</h1>
      <p className="mt-3 text-muted-foreground">{t('notFound.description')}</p>
      <div className="mt-8">
        <LinkButton to="/">{t('notFound.back')}</LinkButton>
      </div>
    </Section>
  )
}
