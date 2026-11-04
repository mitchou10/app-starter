import { useTranslation } from 'react-i18next'
import { Section } from '@/components/Section'
import { SectionHeading } from '@/components/SectionHeading'
import { FEATURES } from './content'
import { FeatureCard } from './FeatureCard'
import { FeatureGrid } from './FeatureGrid'
import { Hero } from './Hero'
import { LinkButton } from './LinkButton'

/** The home page: assembles the sections; each one is a small component that only knows its props. */
export function LandingPage() {
  const { t } = useTranslation()

  return (
    <>
      <Hero
        title={t('landing.hero.title')}
        description={t('landing.hero.description')}
        actions={<LinkButton to="/#features">{t('landing.hero.cta')}</LinkButton>}
      />

      <Section id="features" className="bg-muted/40">
        <SectionHeading title={t('landing.features.title')} description={t('landing.features.description')} />
        <FeatureGrid>
          {FEATURES.map(({ key, icon }) => (
            <FeatureCard
              key={key}
              icon={icon}
              title={t(`landing.features.${key}.title`)}
              description={t(`landing.features.${key}.description`)}
            />
          ))}
        </FeatureGrid>
      </Section>
    </>
  )
}
