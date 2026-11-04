import { useTranslation } from 'react-i18next'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useLanguage } from '@/i18n/useLanguage'

export function LanguageSwitcher() {
  const { t } = useTranslation()
  const { current, languages, change } = useLanguage()

  return (
    <Select value={current} items={languages} onValueChange={(language) => language && change(language)}>
      <SelectTrigger size="sm" aria-label={t('language.label')}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {languages.map((language) => (
          <SelectItem key={language.value} value={language.value}>
            {language.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
