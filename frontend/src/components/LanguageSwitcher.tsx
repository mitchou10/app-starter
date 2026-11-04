import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { LANGUAGES } from '@/i18n'

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation()
  // `resolvedLanguage` is the supported one in use (fr-FR resolves to fr).
  const current = i18n.resolvedLanguage

  return (
    <div role="group" aria-label={t('language.label')} className="flex gap-1">
      {LANGUAGES.map((language) => (
        <Button
          key={language}
          size="sm"
          variant={language === current ? 'default' : 'outline'}
          aria-pressed={language === current}
          onClick={() => void i18n.changeLanguage(language)}
        >
          {t(`language.${language}`)}
        </Button>
      ))}
    </div>
  )
}
